export type Curve = 'linear' | 'exp';

export interface Range {
  min: number;
  max: number;
  step: number;
  curve?: Curve;
}

export function snap(range: Range, raw: number): number {
  const snapped = range.min + Math.round((raw - range.min) / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, snapped));
}

export function valueAtFraction(range: Range, fraction: number): number {
  const raw =
    range.curve === 'exp'
      ? range.min * Math.pow(range.max / range.min, fraction)
      : range.min + fraction * (range.max - range.min);
  return snap(range, raw);
}

export function fractionOfValue(range: Range, value: number): number {
  const fraction =
    range.curve === 'exp'
      ? Math.log(value / range.min) / Math.log(range.max / range.min)
      : (value - range.min) / (range.max - range.min);
  return Math.min(1, Math.max(0, fraction));
}
