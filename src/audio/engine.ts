import { getAudioContext } from './context';
import { midiToFrequency } from './notes';
import { Voice } from './voice';
import { smooth } from './params';
import { Delay, Reverb } from './effects';

interface AudioChain {
  ctx: AudioContext;
  filter: BiquadFilterNode;
  masterGain: GainNode;
}

interface EngineSettings {
  waveform: OscillatorType;
  cutoff: number;
  resonance: number;
  volume: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  reverbSize: number;
  reverbPreDelay: number;
  reverbMix: number;
}

let filter: BiquadFilterNode | null = null;
let masterGain: GainNode | null = null;
let delay: Delay | null = null;
let reverb: Reverb | null = null;

// stuff thats playing + stuff thats fading out
const voices = new Map<number, Voice>();
const releasing = new Set<Voice>();
const settings: EngineSettings = {
  waveform: 'sawtooth',
  cutoff: 2000,
  resonance: 1,
  volume: 0.3,
  attack: 0.01,
  decay: 0.2,
  sustain: 0.6,
  release: 0.4,
  delayTime: 0.35,
  delayFeedback: 0.4,
  delayMix: 0,
  reverbSize: 2,
  reverbPreDelay: 0.02,
  reverbMix: 0,
};

function ensureChain(): AudioChain {
  const ctx = getAudioContext();

  if (!filter || !masterGain || !delay || !reverb) {
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = settings.cutoff;
    filter.Q.value = settings.resonance;

    masterGain = ctx.createGain();
    masterGain.gain.value = settings.volume;

    delay = new Delay(ctx, {
      time: settings.delayTime,
      feedback: settings.delayFeedback,
      mix: settings.delayMix,
    });

    reverb = new Reverb(ctx, {
      size: settings.reverbSize,
      preDelay: settings.reverbPreDelay,
      mix: settings.reverbMix,
    });

    filter.connect(delay.input);
    delay.output.connect(reverb.input);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;

    reverb.output.connect(masterGain);
    masterGain.connect(limiter);
    limiter.connect(ctx.destination);
  }

  return { ctx, filter, masterGain };
}

export function noteOn(note: number): void {
  const { ctx, filter } = ensureChain();
  if (voices.has(note)) return; // key already down, skip

  const voice = new Voice(ctx, filter, midiToFrequency(note), settings);
  voices.set(note, voice);
}

export function noteOff(note: number): void {
  const voice = voices.get(note);
  if (!voice) return;

  voices.delete(note); // yank it out now or the key gets stuck

  releasing.add(voice);
  voice.onended = () => releasing.delete(voice);
  voice.release(settings.release);
}

export function allNotesOff(): void {
  // just kill everything, no release here
  for (const voice of voices.values()) {
    releasing.add(voice);
    voice.onended = () => releasing.delete(voice);
    voice.release(0.01);
  }
  voices.clear();
}

export function setWaveform(value: OscillatorType): void {
  settings.waveform = value;
  for (const voice of voices.values()) voice.setWaveform(value);
  for (const voice of releasing) voice.setWaveform(value); // hit the fading ones too or it sounds weird
}

export function setCutoff(value: number): void {
  settings.cutoff = value;
  if (filter) smooth(filter.frequency, value);
}

export function setResonance(value: number): void {
  settings.resonance = value;
  if (filter) smooth(filter.Q, value);
}
export function setVolume(value: number): void {
  settings.volume = value;
  if (masterGain) smooth(masterGain.gain, value);
}

export function setAttack(value: number): void { settings.attack = value; }
export function setDecay(value: number): void { settings.decay = value; }
export function setSustain(value: number): void { settings.sustain = value; }
export function setRelease(value: number): void { settings.release = value; }

export function setDelayTime(value: number): void {
  settings.delayTime = value;
  if (delay) delay.setTime(value);
}

export function setDelayFeedback(value: number): void {
  settings.delayFeedback = value;
  if (delay) delay.setFeedback(value);
}

export function setDelayMix(value: number): void {
  settings.delayMix = value;
  if (delay) delay.setMix(value);
}

export function setReverbSize(value: number): void {
  settings.reverbSize = value;
  if (reverb) reverb.setSize(value);
}

export function setReverbPreDelay(value: number): void {
  settings.reverbPreDelay = value;
  if (reverb) reverb.setPreDelay(value);
}

export function setReverbMix(value: number): void {
  settings.reverbMix = value;
  if (reverb) reverb.setMix(value);
}
