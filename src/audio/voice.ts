import { smooth } from './params';
import { triggerEnvelope, releaseEnvelope } from './envelope';
import { CENTS_PER_OCTAVE } from './notes';
import type { Lfo } from './lfo';

interface VoiceSettings {
  waveform: OscillatorType;
  osc2Waveform: OscillatorType;
  osc2Mix: number;
  osc2Detune: number;
  filterType: BiquadFilterType;
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
  private readonly oscillator2: OscillatorNode;
  private readonly oscillatorGain: GainNode;
  private readonly oscillator2Gain: GainNode;
  private readonly switchGain: GainNode; // own gain just for the declick on waveform switch, so the adsr automation stays untouched
  private readonly filter: BiquadFilterNode;
  private readonly envelope: GainNode;
  private readonly lfo: Lfo;
  private stopped = false;

  onended: (() => void) | null = null;

  constructor(ctx: AudioContext, output: AudioNode, lfo: Lfo, frequency: number, velocity: number, settings: VoiceSettings) {
    this.ctx = ctx;
    this.lfo = lfo;

    const now = ctx.currentTime;

    this.oscillator = ctx.createOscillator();
    this.oscillator2 = ctx.createOscillator();
    this.oscillatorGain = ctx.createGain();
    this.oscillator2Gain = ctx.createGain();
    this.switchGain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.envelope = ctx.createGain();

    this.oscillator.type = settings.waveform;
    this.oscillator.frequency.value = frequency;

    this.oscillator2.type = settings.osc2Waveform;
    this.oscillator2.frequency.value = frequency;
    // only osc2 gets detuned, osc1 stays dead on the note
    this.oscillator2.detune.value = settings.osc2Detune;

    // crossfade, both gains add up to 1 so mixing in osc2 doesnt get louder
    this.oscillatorGain.gain.value = 1 - settings.osc2Mix;
    this.oscillator2Gain.gain.value = settings.osc2Mix;

    this.filter.type = settings.filterType;
    this.filter.frequency.value = settings.cutoff;
    this.filter.Q.value = settings.resonance;

    this.oscillator.connect(this.oscillatorGain);
    this.oscillator2.connect(this.oscillator2Gain);
    this.oscillatorGain.connect(this.switchGain);
    this.oscillator2Gain.connect(this.switchGain);
    this.switchGain.connect(this.filter);
    this.filter.connect(this.envelope);
    this.envelope.connect(output);

    lfo.filterOut.connect(this.filter.detune);
    lfo.pitchOut.connect(this.oscillator.detune);
    lfo.pitchOut.connect(this.oscillator2.detune);

    triggerEnvelope(this.envelope.gain, now, settings, velocity);

    // envelope goes on detune (cents) not frequency, so cutoff slider and envelope dont fight + octaves sweep evenly
    triggerEnvelope(this.filter.detune, now, {
      attack: settings.filterAttack,
      decay: settings.filterDecay,
      sustain: settings.filterSustain,
    }, settings.filterAmount * CENTS_PER_OCTAVE);

    this.oscillator.start(now);
    this.oscillator2.start(now);
  }

  release(releaseTime: number, filterReleaseTime: number): void {
    if (this.stopped) return;
    this.stopped = true;

    const now = this.ctx.currentTime;

    releaseEnvelope(this.envelope.gain, now, releaseTime);
    releaseEnvelope(this.filter.detune, now, filterReleaseTime);

    this.oscillator.stop(now + releaseTime + 0.02);
    this.oscillator2.stop(now + releaseTime + 0.02);

    this.oscillator.onended = () => {
      // only cut this voice's link, a bare disconnect() would kill the lfo for every voice
      this.lfo.filterOut.disconnect(this.filter.detune);
      this.lfo.pitchOut.disconnect(this.oscillator.detune);
      this.lfo.pitchOut.disconnect(this.oscillator2.detune);
      this.oscillator.disconnect();
      this.oscillator2.disconnect();
      this.oscillatorGain.disconnect();
      this.oscillator2Gain.disconnect();
      this.switchGain.disconnect();
      this.filter.disconnect();
      this.envelope.disconnect();
      if (this.onended) this.onended();
    };
  }

  setFilterType(value: BiquadFilterType): void {
    this.filter.type = value;
  }

  setCutoff(value: number): void {
    smooth(this.filter.frequency, value);
  }

  setResonance(value: number): void {
    smooth(this.filter.Q, value);
  }

  setWaveform(value: OscillatorType): void {
    this.declick(() => { this.oscillator.type = value; });
  }

  setOsc2Waveform(value: OscillatorType): void {
    this.declick(() => { this.oscillator2.type = value; });
  }

  setOsc2Mix(value: number): void {
    smooth(this.oscillatorGain.gain, 1 - value);
    smooth(this.oscillator2Gain.gain, value);
  }

  setOsc2Detune(value: number): void {
    smooth(this.oscillator2.detune, value);
  }

  // works in the release phase too, the dip lives on switchGain so the release ramp keeps going
  private declick(apply: () => void): void {
    const now = this.ctx.currentTime;
    const g = this.switchGain.gain;

    g.cancelScheduledValues(now);
    g.setValueAtTime(1, now);
    g.linearRampToValueAtTime(0.5, now + 0.003);
    apply();
    g.linearRampToValueAtTime(1, now + 0.006);
  }
}
