import type { EngineSettings } from './audio/engine';
import { PARAMS } from './params';
import { valueAtFraction } from './scale';

const ANALOG_MAX = 1023;

export interface ControlTargets {
  settings: EngineSettings;
  startNote: (note: number) => void;
  stopNote: (note: number) => void;
}

export type ControlHandler = (value: number) => void;

export function createControls(targets: ControlTargets): Record<string, ControlHandler> {
  return {
    pot1: (value) => {
      targets.settings.cutoff = valueAtFraction(PARAMS.cutoff, value / ANALOG_MAX);
    },
    btn1: (value) => {
      if (value === 1) targets.startNote(60);
      else targets.stopNote(60);
    },
  };
}
