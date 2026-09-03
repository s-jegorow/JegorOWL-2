import { getAudioContext } from './context';
import { midiToFrequency } from './notes';

interface AudioChain {
  ctx: AudioContext;
  filter: BiquadFilterNode;
  masterGain: GainNode;
}

interface EngineSettings {
  waveform: OscillatorType;
  frequency: number;
  cutoff: number;
  resonance: number;
  volume: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

type VoiceId = number | 'drone';

let filter: BiquadFilterNode | null = null;
let masterGain: GainNode | null = null;

//current tone + adsr-magic
let oscillator: OscillatorNode | null = null;
let envelope: GainNode | null = null;
let currentVoiceId: VoiceId | null = null;

const settings: EngineSettings = {
  waveform: 'sawtooth',
  frequency: 220,
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

function endVoice(fadeTime: number): void {
  if (!oscillator || !envelope) return;

  const now = getAudioContext().currentTime;

  // local copy
  const osc = oscillator;
  const env = envelope;

  env.gain.cancelScheduledValues(now);
  env.gain.setValueAtTime(env.gain.value, now);
  env.gain.linearRampToValueAtTime(0, now + fadeTime);

  osc.stop(now + fadeTime + 0.02);
  osc.onended = () => {
    osc.disconnect();
    env.disconnect();
  };

  oscillator = null;
  envelope = null;
  currentVoiceId = null;
}

function startVoice(frequency: number, id: VoiceId): void {
  const { ctx, filter } = ensureChain();

  if (oscillator) endVoice(0.005);

  const now = ctx.currentTime;
  const { attack, decay, sustain } = settings;

  envelope = ctx.createGain();
  oscillator = ctx.createOscillator();

  oscillator.type = settings.waveform;
  oscillator.frequency.value = frequency;

  oscillator.connect(envelope);
  envelope.connect(filter);

  // adsr full attack
  envelope.gain.cancelScheduledValues(now);
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(1, now + attack);
  envelope.gain.linearRampToValueAtTime(sustain, now + attack + decay);

  oscillator.start(now);
  currentVoiceId = id;
}

export function noteOn(midiNote: number): void {
  startVoice(midiToFrequency(midiNote), midiNote);
}

export function noteOff(midiNote: number): void {
  if (currentVoiceId !== midiNote) return;
  endVoice(settings.release);
}

export function allNotesOff(): void {
  if (oscillator && currentVoiceId !== 'drone') {
    endVoice(0.01);
  }
}

export function droneOn(): void {
  startVoice(settings.frequency, 'drone');
}

export function droneOff(): void {
  if (currentVoiceId !== 'drone') return;
  endVoice(settings.release);
}

export function setFrequency(value: number): void {
  settings.frequency = value;
  if (oscillator && currentVoiceId === 'drone') {
    oscillator.frequency.value = value;
  }
}

export function setWaveform(value: OscillatorType): void {
  settings.waveform = value;
  if (oscillator && envelope) {
    const now = getAudioContext().currentTime;
    const g = envelope.gain;
    const current = g.value;
    g.cancelScheduledValues(now);
    g.setValueAtTime(current, now);
    g.linearRampToValueAtTime(current * 0.5, now + 0.003);
    oscillator.type = value;
    g.linearRampToValueAtTime(current, now + 0.006);
  }
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