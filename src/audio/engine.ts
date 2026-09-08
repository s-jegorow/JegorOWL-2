import { getAudioContext } from './context';
import { midiToFrequency } from './notes';
import { Voice } from './voice';

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
}

let filter: BiquadFilterNode | null = null;
let masterGain: GainNode | null = null;

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
};

function ensureChain(): AudioChain {
  const ctx = getAudioContext();

  if (!filter) {
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = settings.cutoff;
    filter.Q.value = settings.resonance;

    masterGain = ctx.createGain();
    masterGain.gain.value = settings.volume;

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);
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
  if (filter) filter.frequency.value = value;
}

export function setResonance(value: number): void {
  settings.resonance = value;
  if (filter) filter.Q.value = value;
}
export function setVolume(value: number): void {
  settings.volume = value;
  if (masterGain) masterGain.gain.value = value;
}

export function setAttack(value: number): void { settings.attack = value; }
export function setDecay(value: number): void { settings.decay = value; }
export function setSustain(value: number): void { settings.sustain = value; }
export function setRelease(value: number): void { settings.release = value; }

export function activeNoteCount(): number {
  return voices.size;
}
