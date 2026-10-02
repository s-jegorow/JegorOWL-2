import { smooth } from './params';
import { triggerEnvelope, releaseEnvelope } from './envelope';

const CENTS_PER_OCTAVE = 1200;

interface VoiceSettings {
  waveform: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  cutoff: number;
  resonance: number;
  filterAmount: number;
  filterAttack: number;
  filterDecay: number;
  filterSustain: number;
}

export class Voice {
  private readonly ctx: AudioContext;
  private readonly oscillator: OscillatorNode;
  private readonly switchGain: GainNode; // own gain just for the declick on waveform switch, so the adsr automation stays untouched
  private readonly filter: BiquadFilterNode;
  private readonly envelope: GainNode;
  private stopped = false;

  onended: (() => void) | null = null;

  constructor(ctx: AudioContext, output: AudioNode, frequency: number, settings: VoiceSettings) {
    this.ctx = ctx;

    const now = ctx.currentTime;

    this.oscillator = ctx.createOscillator();
    this.switchGain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.envelope = ctx.createGain();

    this.oscillator.type = settings.waveform;
    this.oscillator.frequency.value = frequency;

    this.filter.type = 'lowpass';
    this.filter.frequency.value = settings.cutoff;
    this.filter.Q.value = settings.resonance;

    this.oscillator.connect(this.switchGain);
    this.switchGain.connect(this.filter);
    this.filter.connect(this.envelope);
    this.envelope.connect(output);

    triggerEnvelope(this.envelope.gain, now, settings, 1);

    // envelope goes on detune (cents) not frequency, so cutoff slider and envelope dont fight + octaves sweep evenly
    triggerEnvelope(this.filter.detune, now, {
      attack: settings.filterAttack,
      decay: settings.filterDecay,
      sustain: settings.filterSustain,
    }, settings.filterAmount * CENTS_PER_OCTAVE);

    this.oscillator.start(now);
  }

  release(releaseTime: number, filterReleaseTime: number): void {
    if (this.stopped) return;
    this.stopped = true;

    const now = this.ctx.currentTime;

    releaseEnvelope(this.envelope.gain, now, releaseTime);
    releaseEnvelope(this.filter.detune, now, filterReleaseTime);

    this.oscillator.stop(now + releaseTime + 0.02);

    this.oscillator.onended = () => {
      this.oscillator.disconnect();
      this.switchGain.disconnect();
      this.filter.disconnect();
      this.envelope.disconnect();
      if (this.onended) this.onended();
    };
  }

  setCutoff(value: number): void {
    smooth(this.filter.frequency, value);
  }

  setResonance(value: number): void {
    smooth(this.filter.Q, value);
  }

  // works in the release phase too, the dip lives on switchGain so the release ramp keeps going
  setWaveform(value: OscillatorType): void {
    const now = this.ctx.currentTime;
    const g = this.switchGain.gain;

    g.cancelScheduledValues(now);
    g.setValueAtTime(1, now);
    g.linearRampToValueAtTime(0.5, now + 0.003);
    this.oscillator.type = value;
    g.linearRampToValueAtTime(1, now + 0.006);
  }
}
