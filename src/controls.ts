import type { EngineSettings } from './audio/engine';

const ANALOG_MAX = 1023;

export interface ControlTargets {
  settings: EngineSettings;
  startNote: (note: number) => void;
  stopNote: (note: number) => void;
}

export type ControlHandler = (value: number) => void;

function scaleExponential(value: number, min: number, max: number): number {
  return min * Math.pow(max / min, value / ANALOG_MAX);
}

export function createControls(targets: ControlTargets): Record<string, ControlHandler> {
  return {
    pot1: (value) => {
      targets.settings.cutoff = Math.round(scaleExponential(value, 50, 12000));
    },
    btn1: (value) => {
      if (value === 1) targets.startNote(60);
      else targets.stopNote(60);
    },
  };
}
