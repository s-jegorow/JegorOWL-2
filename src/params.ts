import type { EngineSettings } from './audio/engine';
import type { Range } from './scale';

export interface NumberParam extends Range {
  label: string;
  format: (value: number) => string;
}

export interface Option<T> {
  value: T;
  label: string;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function milliseconds(value: number): string {
  return `${Math.round(value * 1000)} ms`;
}

export const PARAMS = {
  cutoff: { label: 'Cutoff', min: 50, max: 12000, step: 1, curve: 'exp', format: (v) => `${v} Hz` },
  resonance: { label: 'Resonance', min: 0.5, max: 20, step: 0.1, format: (v) => v.toFixed(1) },
  filterAmount: { label: 'Amount', min: 0, max: 6, step: 0.1, format: (v) => `${v.toFixed(1)} oct` },
  filterAttack: { label: 'Attack', min: 0.001, max: 2, step: 0.001, curve: 'exp', format: (v) => `${v.toFixed(3)} s` },
  filterDecay: { label: 'Decay', min: 0, max: 2, step: 0.01, format: (v) => `${v.toFixed(2)} s` },
  filterSustain: { label: 'Sustain', min: 0, max: 1, step: 0.01, format: (v) => v.toFixed(2) },
  filterRelease: { label: 'Release', min: 0.01, max: 3, step: 0.01, curve: 'exp', format: (v) => `${v.toFixed(2)} s` },

  attack: { label: 'Attack', min: 0.001, max: 2, step: 0.001, curve: 'exp', format: (v) => `${v.toFixed(3)} s` },
  decay: { label: 'Decay', min: 0, max: 2, step: 0.01, format: (v) => `${v.toFixed(2)} s` },
  sustain: { label: 'Sustain', min: 0, max: 1, step: 0.01, format: (v) => v.toFixed(2) },
  release: { label: 'Release', min: 0.01, max: 3, step: 0.01, curve: 'exp', format: (v) => `${v.toFixed(2)} s` },

  lfoRate: { label: 'Rate', min: 0.1, max: 20, step: 0.1, curve: 'exp', format: (v) => `${v.toFixed(1)} Hz` },
  lfoFilterDepth: { label: 'Filter', min: 0, max: 4, step: 0.1, format: (v) => `${v.toFixed(1)} oct` },
  lfoPitchDepth: { label: 'Pitch', min: 0, max: 100, step: 1, format: (v) => `${v} cents` },

  delayTime: { label: 'Time', min: 0.01, max: 1, step: 0.01, format: milliseconds },
  delayFeedback: { label: 'Feedback', min: 0, max: 0.9, step: 0.01, format: percent },
  delayMix: { label: 'Mix', min: 0, max: 1, step: 0.01, format: percent },

  reverbSize: { label: 'Size', min: 0.3, max: 6, step: 0.1, format: (v) => `${v.toFixed(1)} s` },
  reverbPreDelay: { label: 'Pre-Delay', min: 0, max: 0.2, step: 0.001, format: milliseconds },
  reverbMix: { label: 'Mix', min: 0, max: 1, step: 0.01, format: percent },

  volume: { label: 'Volume', min: 0, max: 1, step: 0.01, format: percent },
} satisfies Partial<Record<keyof EngineSettings, NumberParam>>;

export type ParamKey = keyof typeof PARAMS;

export const PARAM_GROUPS: { title: string; keys: ParamKey[] }[] = [
  { title: 'Filter', keys: ['cutoff', 'resonance', 'filterAmount', 'filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'] },
  { title: 'Amp Envelope', keys: ['attack', 'decay', 'sustain', 'release'] },
  { title: 'LFO', keys: ['lfoRate', 'lfoFilterDepth', 'lfoPitchDepth'] },
  { title: 'Delay', keys: ['delayTime', 'delayFeedback', 'delayMix'] },
  { title: 'Reverb', keys: ['reverbSize', 'reverbPreDelay', 'reverbMix'] },
  { title: 'Master', keys: ['volume'] },
];

export const WAVEFORMS: Option<OscillatorType>[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'square', label: 'Square' },
  { value: 'sawtooth', label: 'Sawtooth' },
];

export const FILTER_TYPES: Option<BiquadFilterType>[] = [
  { value: 'lowpass', label: 'Lowpass' },
  { value: 'highpass', label: 'Highpass' },
  { value: 'bandpass', label: 'Bandpass' },
  { value: 'notch', label: 'Notch' },
];
