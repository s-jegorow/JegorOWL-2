export interface EnvelopeShape {
  attack: number;
  decay: number;
  sustain: number;
}

export function triggerEnvelope(param: AudioParam, now: number, shape: EnvelopeShape, peak: number): void {
  param.setValueAtTime(0, now);
  param.linearRampToValueAtTime(peak, now + shape.attack);
  // sustain is relative to peak, so it works for gain (0-1) and detune (cents) alike
  param.linearRampToValueAtTime(peak * shape.sustain, now + shape.attack + shape.decay);
}

export function releaseEnvelope(param: AudioParam, now: number, releaseTime: number): void {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(0, now + releaseTime);
}
