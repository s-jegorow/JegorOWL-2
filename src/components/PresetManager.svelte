<script lang="ts">
  import { DEFAULT_SETTINGS, type EngineSettings } from '../audio/engine';
  import { loadPresets, savePresets, downloadPresets, parsePresetFile, type Preset } from '../presets';

  interface Props {
    settings: EngineSettings;
    onapply: (settings: EngineSettings) => void;
  }

  let { settings, onapply }: Props = $props();

  let presets = $state(loadPresets());
  let selectedPreset = $state('');
  let presetName = $state('');
  let presetMessage = $state('');

  $effect(() => { savePresets(presets); });

  function addPreset(preset: Preset) {
    const index = presets.findIndex((p) => p.name === preset.name);
    if (index === -1) presets.push(preset);
    else presets[index] = preset;
  }

  function savePreset() {
    const name = presetName.trim();
    if (name === '') return;

    addPreset({ name, settings: $state.snapshot(settings) });
    selectedPreset = name;
    presetName = '';
    presetMessage = `Saved "${name}"`;
  }

  function loadPreset() {
    const preset = presets.find((p) => p.name === selectedPreset);
    if (!preset) return;

    onapply(preset.settings);
    presetMessage = `Loaded "${preset.name}"`;
  }

  function deletePreset() {
    presets = presets.filter((p) => p.name !== selectedPreset);
    presetMessage = `Deleted "${selectedPreset}"`;
    selectedPreset = '';
  }

  function resetSettings() {
    onapply(DEFAULT_SETTINGS);
    presetMessage = 'Reset to default sound';
  }

  async function importPresets(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const imported = parsePresetFile(await file.text());
      for (const preset of imported) addPreset(preset);
      presetMessage = `Imported ${imported.length} presets`;
    } catch {
      presetMessage = 'Could not read that file';
    }

    input.value = '';
  }
</script>

<div class="row">
  <label>
    Preset
    <select bind:value={selectedPreset}>
      <option value="">–</option>
      {#each presets as preset (preset.name)}
        <option value={preset.name}>{preset.name}</option>
      {/each}
    </select>
  </label>
  <button onclick={loadPreset} disabled={selectedPreset === ''}>Load</button>
  <button onclick={deletePreset} disabled={selectedPreset === ''}>Delete</button>
</div>

<div class="row">
  <label>
    Name
    <input type="text" bind:value={presetName} />
  </label>
  <button onclick={savePreset} disabled={presetName.trim() === ''}>Save</button>
</div>

<div class="row">
  <button onclick={() => downloadPresets(presets)} disabled={presets.length === 0}>Export</button>
  <label>
    Import
    <input type="file" accept=".json,application/json" onchange={importPresets} />
  </label>
  <button onclick={resetSettings}>Reset</button>
</div>

<p class="hint">{presetMessage}</p>

<style>
  .row {
    margin-bottom: 1rem;
  }
  label {
    display: inline-block;
    font-size: 0.75rem;
    margin: 0 0.5rem 0.3rem 0;
  }
  .hint {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
</style>
