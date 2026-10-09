import { smooth } from './params';
import { CENTS_PER_OCTAVE } from './notes';

export interface LfoSettings {
  rate: number;
  waveform: OscillatorType;
  filterDepth: number;
  pitchDepth: number;
}

export class Lfo {
  readonly filterOut: GainNode;
  readonly pitchOut: GainNode;

  private readonly oscillator: OscillatorNode;

  constructor(ctx: AudioContext, settings: LfoSettings) {
    this.oscillator = ctx.createOscillator();
    this.filterOut = ctx.createGain();
    this.pitchOut = ctx.createGain();

    this.oscillator.type = settings.waveform;
    this.oscillator.frequency.value = settings.rate;
    this.filterOut.gain.value = settings.filterDepth * CENTS_PER_OCTAVE;
    this.pitchOut.gain.value = settings.pitchDepth;

    this.oscillator.connect(this.filterOut);
    this.oscillator.connect(this.pitchOut);

    this.oscillator.start();
  }

  setRate(value: number): void {
    smooth(this.oscillator.frequency, value);
  }

  setWaveform(value: OscillatorType): void {
    this.oscillator.type = value;
  }

  setFilterDepth(octaves: number): void {
    smooth(this.filterOut.gain, octaves * CENTS_PER_OCTAVE);
  }

  setPitchDepth(cents: number): void {
    smooth(this.pitchOut.gain, cents);
  }
}
