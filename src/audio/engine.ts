import { getAudioContext } from './context';

interface AudioChain {
  ctx: AudioContext;
  filter: BiquadFilterNode;
  masterGain: GainNode;
}

interface EngineSettings {
frequency: number;
cutoff: number;
resonance: number;
volume: number;
}

let filter: BiquadFilterNode | null = null;
let oscillator: OscillatorNode | null = null;
let masterGain: GainNode | null = null;

const settings: EngineSettings = {
  frequency: 220,
  cutoff: 2000,
  resonance: 1,
  volume: 0.3

};

function ensureChain(): AudioChain {
  const ctx = getAudioContext();

if (!filter || !masterGain) {
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

export function setResonance(value: number): void {
  settings.resonance = value;
  if (filter) filter.Q.value = value;
}

export function setVolume(value: number): void {
  settings.volume = value;
  if (masterGain) masterGain.gain.value = value;
}

export function noteOn(): void {
  if (oscillator) return;

  const { ctx, filter } = ensureChain(); 
  oscillator = ctx.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = settings.frequency;
  oscillator.connect(filter);
  oscillator.start();
}

export function noteOff(): void {
  if (!oscillator) return;

  oscillator.stop();
  oscillator.disconnect();
  oscillator = null;
}

export function setFrequency(value: number): void {
  settings.frequency = value;
  if (oscillator) oscillator.frequency.value = value;
}

export function setCutoff(value: number): void {
  settings.cutoff = value;
  if (filter) filter.frequency.value = value;
}