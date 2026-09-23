import { getAudioContext } from './context';

// sliders jump, setting .value directly crackles -> let it glide for a bit (~30ms)
const SMOOTHING = 0.01;

export function smooth(param: AudioParam, value: number, timeConstant = SMOOTHING): void {
  const now = getAudioContext().currentTime;
  param.cancelScheduledValues(now);
  param.setTargetAtTime(value, now, timeConstant);
}

export function equalPower(mix: number): { dry: number; wet: number } {
  const angle = mix * (Math.PI / 2);
  return { dry: Math.cos(angle), wet: Math.sin(angle) };
}
