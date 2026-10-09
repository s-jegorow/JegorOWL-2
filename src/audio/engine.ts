import { getAudioContext } from './context';
import { midiToFrequency } from './notes';
import { Voice } from './voice';
import { smooth } from './params';
import { Delay, Reverb } from './effects';
import { Lfo } from './lfo';

export interface EngineSettings {
  waveform: OscillatorType;
  filterType: BiquadFilterType;
  cutoff: number;
  resonance: number;
  volume: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterAmount: number;
  filterAttack: number;
  filterDecay: number;
  filterSustain: number;
  filterRelease: number;
  lfoRate: number;
  lfoWaveform: OscillatorType;
  lfoFilterDepth: number;
  lfoPitchDepth: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  reverbSize: number;
  reverbPreDelay: number;
  reverbMix: number;
}

export const DEFAULT_SETTINGS: EngineSettings = {
  waveform: 'sawtooth',
  filterType: 'lowpass',
  cutoff: 2000,
  resonance: 1,
  volume: 0.3,
  attack: 0.01,
  decay: 0.2,
  sustain: 0.6,
  release: 0.4,
  filterAmount: 0,
  filterAttack: 0.01,
  filterDecay: 0.3,
  filterSustain: 0,
  filterRelease: 0.4,
  lfoRate: 4,
  lfoWaveform: 'sine',
  lfoFilterDepth: 0,
  lfoPitchDepth: 0,
  delayTime: 0.35,
  delayFeedback: 0.4,
  delayMix: 0,
  reverbSize: 2,
  reverbPreDelay: 0.02,
  reverbMix: 0,
};

interface AudioChain {
  ctx: AudioContext;
  voiceBus: GainNode;
  lfo: Lfo;
  delay: Delay;
  reverb: Reverb;
  masterGain: GainNode;
}

let chain: AudioChain | null = null;

// stuff thats playing + stuff thats fading out
const voices = new Map<number, Voice>();
const releasing = new Set<Voice>();
const settings: EngineSettings = { ...DEFAULT_SETTINGS };

function createChain(): AudioChain {
  const ctx = getAudioContext();

  const voiceBus = ctx.createGain();

  const lfo = new Lfo(ctx, {
    rate: settings.lfoRate,
    waveform: settings.lfoWaveform,
    filterDepth: settings.lfoFilterDepth,
    pitchDepth: settings.lfoPitchDepth,
  });

  const delay = new Delay(ctx, {
    time: settings.delayTime,
    feedback: settings.delayFeedback,
    mix: settings.delayMix,
  });

  const reverb = new Reverb(ctx, {
    size: settings.reverbSize,
    preDelay: settings.reverbPreDelay,
    mix: settings.reverbMix,
  });

  const masterGain = ctx.createGain();
  masterGain.gain.value = settings.volume;

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.1;

  voiceBus.connect(delay.input);
  delay.output.connect(reverb.input);
  reverb.output.connect(masterGain);
  masterGain.connect(limiter);
  limiter.connect(ctx.destination);

  return { ctx, voiceBus, lfo, delay, reverb, masterGain };
}

function ensureChain(): AudioChain {
  if (!chain) chain = createChain();
  return chain;
}

function releaseVoice(voice: Voice, releaseTime: number, filterReleaseTime: number): void {
  releasing.add(voice);
  voice.onended = () => releasing.delete(voice);
  voice.release(releaseTime, filterReleaseTime);
}

export function startAudio(): void {
  const { ctx } = ensureChain();
  if (ctx.state === 'suspended') void ctx.resume();
}

export function noteOn(note: number, velocity = 1): void {
  const { ctx, voiceBus, lfo } = ensureChain();
  if (ctx.state === 'suspended') void ctx.resume();
  if (voices.has(note)) return; // key already down, skip

  const voice = new Voice(ctx, voiceBus, lfo, midiToFrequency(note), velocity, settings);
  voices.set(note, voice);
}

export function noteOff(note: number): void {
  const voice = voices.get(note);
  if (!voice) return;

  voices.delete(note); // yank it out now or the key gets stuck
  releaseVoice(voice, settings.release, settings.filterRelease);
}

export function allNotesOff(): void {
  // just kill everything, no release here
  for (const voice of voices.values()) releaseVoice(voice, 0.01, 0.01);
  voices.clear();
}

export function setWaveform(value: OscillatorType): void {
  settings.waveform = value;
  for (const voice of voices.values()) voice.setWaveform(value);
  for (const voice of releasing) voice.setWaveform(value); // hit the fading ones too or it sounds weird
}

export function setFilterType(value: BiquadFilterType): void {
  settings.filterType = value;
  for (const voice of voices.values()) voice.setFilterType(value);
  for (const voice of releasing) voice.setFilterType(value);
}

export function setCutoff(value: number): void {
  settings.cutoff = value;
  for (const voice of voices.values()) voice.setCutoff(value);
  for (const voice of releasing) voice.setCutoff(value);
}

export function setResonance(value: number): void {
  settings.resonance = value;
  for (const voice of voices.values()) voice.setResonance(value);
  for (const voice of releasing) voice.setResonance(value);
}

export function setVolume(value: number): void {
  settings.volume = value;
  if (chain) smooth(chain.masterGain.gain, value);
}

export function setAttack(value: number): void { settings.attack = value; }
export function setDecay(value: number): void { settings.decay = value; }
export function setSustain(value: number): void { settings.sustain = value; }
export function setRelease(value: number): void { settings.release = value; }

export function setFilterAmount(value: number): void { settings.filterAmount = value; }
export function setFilterAttack(value: number): void { settings.filterAttack = value; }
export function setFilterDecay(value: number): void { settings.filterDecay = value; }
export function setFilterSustain(value: number): void { settings.filterSustain = value; }
export function setFilterRelease(value: number): void { settings.filterRelease = value; }

export function setLfoRate(value: number): void {
  settings.lfoRate = value;
  if (chain) chain.lfo.setRate(value);
}

export function setLfoWaveform(value: OscillatorType): void {
  settings.lfoWaveform = value;
  if (chain) chain.lfo.setWaveform(value);
}

export function setLfoFilterDepth(value: number): void {
  settings.lfoFilterDepth = value;
  if (chain) chain.lfo.setFilterDepth(value);
}

export function setLfoPitchDepth(value: number): void {
  settings.lfoPitchDepth = value;
  if (chain) chain.lfo.setPitchDepth(value);
}

export function setDelayTime(value: number): void {
  settings.delayTime = value;
  if (chain) chain.delay.setTime(value);
}

export function setDelayFeedback(value: number): void {
  settings.delayFeedback = value;
  if (chain) chain.delay.setFeedback(value);
}

export function setDelayMix(value: number): void {
  settings.delayMix = value;
  if (chain) chain.delay.setMix(value);
}

export function setReverbSize(value: number): void {
  settings.reverbSize = value;
  if (chain) chain.reverb.setSize(value);
}

export function setReverbPreDelay(value: number): void {
  settings.reverbPreDelay = value;
  if (chain) chain.reverb.setPreDelay(value);
}

export function setReverbMix(value: number): void {
  settings.reverbMix = value;
  if (chain) chain.reverb.setMix(value);
}
