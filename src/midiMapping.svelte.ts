import { PARAMS, type ParamKey } from './params';
import { valueAtFraction } from './scale';

const STORAGE_KEY = 'jegorowl2.midiMapping';
const CC_MAX = 127;

type Assignments = Partial<Record<ParamKey, number>>;

interface MidiMappingState {
  assignments: Assignments;
  mapping: boolean;
  learning: ParamKey | null;
}

export interface MappedValue {
  key: ParamKey;
  value: number;
}

export const midiMapping: MidiMappingState = $state({
  assignments: loadAssignments(),
  mapping: false,
  learning: null,
});

function loadAssignments(): Assignments {
  const result: Assignments = {};
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    for (const key of Object.keys(PARAMS) as ParamKey[]) {
      if (typeof stored[key] === 'number') result[key] = stored[key];
    }
  } catch {
  }
  return result;
}

function saveAssignments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(midiMapping.assignments)));
}

function assign(key: ParamKey, controller: number) {
  for (const other of Object.keys(midiMapping.assignments) as ParamKey[]) {
    if (midiMapping.assignments[other] === controller) delete midiMapping.assignments[other];
  }
  midiMapping.assignments[key] = controller;
  saveAssignments();
}

function findParam(controller: number): ParamKey | undefined {
  return (Object.keys(midiMapping.assignments) as ParamKey[]).find(
    (key) => midiMapping.assignments[key] === controller,
  );
}

export function toggleMapMode(): void {
  midiMapping.mapping = !midiMapping.mapping;
  midiMapping.learning = null;
}

export function toggleLearning(key: ParamKey): void {
  midiMapping.learning = midiMapping.learning === key ? null : key;
}

export function clearAssignment(key: ParamKey): void {
  delete midiMapping.assignments[key];
  saveAssignments();
}

export function clearAllAssignments(): void {
  midiMapping.assignments = {};
  saveAssignments();
}

export function handleControlChange(controller: number, value: number): MappedValue | null {
  if (midiMapping.learning) {
    assign(midiMapping.learning, controller);
    midiMapping.learning = null;
  }

  const key = findParam(controller);
  if (!key) return null;

  return { key, value: valueAtFraction(PARAMS[key], value / CC_MAX) };
}
