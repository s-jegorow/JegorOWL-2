import { DEFAULT_SETTINGS, type EngineSettings } from './audio/engine';

export interface Preset {
  name: string;
  settings: EngineSettings;
}

const PRESETS_KEY = 'jegorowl2.presets';
const LAST_SETTINGS_KEY = 'jegorowl2.lastSettings';

function toSettings(data: unknown): EngineSettings {
  const settings = { ...DEFAULT_SETTINGS };
  if (typeof data !== 'object' || data === null) return settings;

  const source = data as Record<string, unknown>;
  const target = settings as Record<string, unknown>;
  for (const key of Object.keys(settings)) {
    if (typeof source[key] === typeof target[key]) {
      target[key] = source[key];
    }
  }
  return settings;
}

function toPresets(data: unknown): Preset[] {
  if (!Array.isArray(data)) return [];

  const presets: Preset[] = [];
  for (const item of data) {
    if (typeof item?.name !== 'string') continue;
    const name = item.name.trim();
    if (name === '') continue;
    presets.push({ name, settings: toSettings(item.settings) });
  }
  return presets;
}

function readJson(key: string): unknown {
  const text = localStorage.getItem(key);
  if (text === null) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function loadLastSettings(): EngineSettings {
  return toSettings(readJson(LAST_SETTINGS_KEY));
}

export function saveLastSettings(settings: EngineSettings): void {
  localStorage.setItem(LAST_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadPresets(): Preset[] {
  return toPresets(readJson(PRESETS_KEY));
}

export function savePresets(presets: Preset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function downloadPresets(presets: Preset[]): void {
  const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'jegorowl-presets.json';
  link.click();

  URL.revokeObjectURL(url);
}

export function parsePresetFile(text: string): Preset[] {
  return toPresets(JSON.parse(text));
}
