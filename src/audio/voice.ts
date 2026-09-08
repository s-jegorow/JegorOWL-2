interface VoiceSettings {
  waveform: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
}

export class Voice {
  private readonly ctx: AudioContext;
  private readonly oscillator: OscillatorNode;
  private readonly envelope: GainNode;
  private stopped = false;

  onended: (() => void) | null = null;

  constructor(ctx: AudioContext, filter: BiquadFilterNode, frequency: number, settings: VoiceSettings) {
    this.ctx = ctx;

    const now = ctx.currentTime;
    const { waveform, attack, decay, sustain } = settings;

    this.oscillator = ctx.createOscillator();
    this.envelope = ctx.createGain();

    this.oscillator.type = waveform;
    this.oscillator.frequency.value = frequency;

    this.oscillator.connect(this.envelope);
    this.envelope.connect(filter);

    const g = this.envelope.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(0, now);
    g.linearRampToValueAtTime(1, now + attack);
    g.linearRampToValueAtTime(sustain, now + attack + decay);

    this.oscillator.start(now);
  }

  release(releaseTime: number): void {
    if (this.stopped) return;
    this.stopped = true;

    const now = this.ctx.currentTime;
    const g = this.envelope.gain;

    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + releaseTime);

    this.oscillator.stop(now + releaseTime + 0.02);

    this.oscillator.onended = () => {
      this.oscillator.disconnect();
      this.envelope.disconnect();
      if (this.onended) this.onended();
    };
  }

  setWaveform(value: OscillatorType): void {
    if (this.stopped) return;

    const now = this.ctx.currentTime;
    const g = this.envelope.gain;
    const current = g.value;

    g.cancelScheduledValues(now);
    g.setValueAtTime(current, now);
    g.linearRampToValueAtTime(current * 0.5, now + 0.003);
    this.oscillator.type = value;
    g.linearRampToValueAtTime(current, now + 0.006);
  }
}
