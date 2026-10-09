<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as engine from './audio/engine';
  import { DEFAULT_SETTINGS } from './audio/engine';
  import { KEY_MAP, noteName } from './audio/notes';
  import EnvelopeGraph from './components/EnvelopeGraph.svelte';
  import {
    loadLastSettings,
    saveLastSettings,
    loadPresets,
    savePresets,
    downloadPresets,
    parsePresetFile,
    type Preset,
  } from './presets';
  import { isMidiSupported, connectMidi } from './midi';

  const activeNotes = new SvelteSet<number>();

  let settings = $state(loadLastSettings());
  let presets = $state(loadPresets());

  let selectedPreset = $state('');
  let presetName = $state('');
  let presetMessage = $state('');

  const midiSupported = isMidiSupported();
  let midiEnabled = $state(false);
  let midiStatus = $state(midiSupported ? 'Not enabled' : 'Not supported in this browser');

  $effect(() => { saveLastSettings(settings); });
  $effect(() => { savePresets(presets); });

  $effect(() => { engine.setWaveform(settings.waveform); });
  $effect(() => { engine.setFilterType(settings.filterType); });
  $effect(() => { engine.setCutoff(settings.cutoff); });
  $effect(() => { engine.setResonance(settings.resonance); });
  $effect(() => { engine.setVolume(settings.volume); });

  $effect(() => { engine.setAttack(settings.attack); });
  $effect(() => { engine.setDecay(settings.decay); });
  $effect(() => { engine.setSustain(settings.sustain); });
  $effect(() => { engine.setRelease(settings.release); });

  $effect(() => { engine.setFilterAmount(settings.filterAmount); });
  $effect(() => { engine.setFilterAttack(settings.filterAttack); });
  $effect(() => { engine.setFilterDecay(settings.filterDecay); });
  $effect(() => { engine.setFilterSustain(settings.filterSustain); });
  $effect(() => { engine.setFilterRelease(settings.filterRelease); });

  $effect(() => { engine.setLfoRate(settings.lfoRate); });
  $effect(() => { engine.setLfoWaveform(settings.lfoWaveform); });
  $effect(() => { engine.setLfoFilterDepth(settings.lfoFilterDepth); });
  $effect(() => { engine.setLfoPitchDepth(settings.lfoPitchDepth); });

  $effect(() => { engine.setDelayTime(settings.delayTime); });
  $effect(() => { engine.setDelayFeedback(settings.delayFeedback); });
  $effect(() => { engine.setDelayMix(settings.delayMix); });

  $effect(() => { engine.setReverbSize(settings.reverbSize); });
  $effect(() => { engine.setReverbPreDelay(settings.reverbPreDelay); });
  $effect(() => { engine.setReverbMix(settings.reverbMix); });

  function addPreset(preset: Preset): void {
    const index = presets.findIndex((p) => p.name === preset.name);
    if (index === -1) presets.push(preset);
    else presets[index] = preset;
  }

  function savePreset(): void {
    const name = presetName.trim();
    if (name === '') return;

    addPreset({ name, settings: $state.snapshot(settings) });
    selectedPreset = name;
    presetName = '';
    presetMessage = `Saved "${name}"`;
  }

  function loadPreset(): void {
    const preset = presets.find((p) => p.name === selectedPreset);
    if (!preset) return;

    Object.assign(settings, preset.settings);
    presetMessage = `Loaded "${preset.name}"`;
  }

  function deletePreset(): void {
    presets = presets.filter((p) => p.name !== selectedPreset);
    presetMessage = `Deleted "${selectedPreset}"`;
    selectedPreset = '';
  }

  function resetSettings(): void {
    Object.assign(settings, DEFAULT_SETTINGS);
    presetMessage = 'Back to init sound';
  }

  async function importPresets(event: Event): Promise<void> {
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

  function startNote(note: number, velocity = 1): void {
    engine.noteOn(note, velocity);
    activeNotes.add(note);
  }

  function stopNote(note: number): void {
    engine.noteOff(note);
    activeNotes.delete(note);
  }

  async function enableMidi(): Promise<void> {
    engine.startAudio();

    try {
      await connectMidi({
        noteOn: startNote,
        noteOff: stopNote,
        devicesChanged: (names) => {
          midiStatus = names.length > 0 ? names.join(', ') : 'No device found';
        },
      });
      midiEnabled = true;
    } catch {
      midiStatus = 'Access denied';
    }
  }

  //fix: ignore holddown-repeat
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return;

    const tag = (event.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    const note = KEY_MAP[event.key.toLowerCase()];
    if (note === undefined) return;

    startNote(note);
  }

  function handleKeyUp(event: KeyboardEvent): void {
    const note = KEY_MAP[event.key.toLowerCase()];
    if (note === undefined) return;

    stopNote(note);
  }

  function handleBlur(): void {
    engine.allNotesOff();
    activeNotes.clear();
  }

  let activeLabel = $derived.by(() => {
    const notes = [...activeNotes].sort((a, b) => a - b);
    return notes.map(noteName).join(' ');
  });
</script>

<svelte:window
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
  onblur={handleBlur}
/>

<main>
  <h1>JegorOWL-2</h1>

  <section>
    <p class="status">{activeLabel || '–'}</p>
    <p class="hint">A S D F G H J K and W E T Z U · hold several keys for chords</p>
  </section>

  <section>
    <h2>MIDI</h2>

    <button onclick={enableMidi} disabled={!midiSupported || midiEnabled}>Enable MIDI</button>
    <p class="hint">{midiStatus}</p>
  </section>

  <section>
    <h2>Presets</h2>

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

    <label>
      Name
      <input type="text" bind:value={presetName} />
    </label>
    <button onclick={savePreset} disabled={presetName.trim() === ''}>Save</button>

    <div>
      <button onclick={() => downloadPresets(presets)} disabled={presets.length === 0}>Export</button>
      <label>
        Import
        <input type="file" accept=".json,application/json" onchange={importPresets} />
      </label>
      <button onclick={resetSettings}>Init</button>
    </div>

    <p class="hint">{presetMessage}</p>
  </section>

  <section>
    <label>
      Waveform
      <select bind:value={settings.waveform}>
        <option value="sine">Sine</option>
        <option value="triangle">Triangle</option>
        <option value="square">Square</option>
        <option value="sawtooth">Sawtooth</option>
      </select>
    </label>
  </section>

  <section>
    <h2>Filter</h2>

    <label>
      Type
      <select bind:value={settings.filterType}>
        <option value="lowpass">Lowpass</option>
        <option value="highpass">Highpass</option>
        <option value="bandpass">Bandpass</option>
        <option value="notch">Notch</option>
      </select>
    </label>

    <label>
      Cutoff: {settings.cutoff} Hz
      <input type="range" min="50" max="12000" step="1" bind:value={settings.cutoff} />
    </label>

    <label>
      Resonance: {settings.resonance}
      <input type="range" min="0.5" max="20" step="0.1" bind:value={settings.resonance} />
    </label>

    <label>
      Amount: {settings.filterAmount.toFixed(1)} oct
      <input type="range" min="0" max="6" step="0.1" bind:value={settings.filterAmount} />
    </label>

    <EnvelopeGraph
      attack={settings.filterAttack}
      decay={settings.filterDecay}
      sustain={settings.filterSustain}
      release={settings.filterRelease}
    />

    <label>
      Attack: {settings.filterAttack.toFixed(3)} s
      <input type="range" min="0.001" max="2" step="0.001" bind:value={settings.filterAttack} />
    </label>
    <label>
      Decay: {settings.filterDecay.toFixed(2)} s
      <input type="range" min="0" max="2" step="0.01" bind:value={settings.filterDecay} />
    </label>

    <label>
      Sustain: {settings.filterSustain.toFixed(2)}
      <input type="range" min="0" max="1" step="0.01" bind:value={settings.filterSustain} />
    </label>

    <label>
      Release: {settings.filterRelease.toFixed(2)} s
      <input type="range" min="0.01" max="3" step="0.01" bind:value={settings.filterRelease} />
    </label>
  </section>

  <section>
    <h2>Amp Envelope</h2>

    <EnvelopeGraph
      attack={settings.attack}
      decay={settings.decay}
      sustain={settings.sustain}
      release={settings.release}
    />

    <label>
      Attack: {settings.attack.toFixed(3)} s
      <input type="range" min="0.001" max="2" step="0.001" bind:value={settings.attack} />
    </label>
    <label>
      Decay: {settings.decay.toFixed(2)} s
      <input type="range" min="0" max="2" step="0.01" bind:value={settings.decay} />
    </label>

    <label>
      Sustain: {settings.sustain.toFixed(2)}
      <input type="range" min="0" max="1" step="0.01" bind:value={settings.sustain} />
    </label>

    <label>
      Release: {settings.release.toFixed(2)} s
      <input type="range" min="0.01" max="3" step="0.01" bind:value={settings.release} />
    </label>
  </section>

  <section>
    <h2>LFO</h2>

    <label>
      Waveform
      <select bind:value={settings.lfoWaveform}>
        <option value="sine">Sine</option>
        <option value="triangle">Triangle</option>
        <option value="square">Square</option>
        <option value="sawtooth">Sawtooth</option>
      </select>
    </label>

    <label>
      Rate: {settings.lfoRate.toFixed(1)} Hz
      <input type="range" min="0.1" max="20" step="0.1" bind:value={settings.lfoRate} />
    </label>

    <label>
      Filter Depth: {settings.lfoFilterDepth.toFixed(1)} oct
      <input type="range" min="0" max="4" step="0.1" bind:value={settings.lfoFilterDepth} />
    </label>

    <label>
      Pitch Depth: {settings.lfoPitchDepth} cents
      <input type="range" min="0" max="100" step="1" bind:value={settings.lfoPitchDepth} />
    </label>
  </section>

  <section>
    <h2>Delay</h2>

    <label>
      Time: {Math.round(settings.delayTime * 1000)} ms
      <input type="range" min="0.01" max="1" step="0.01" bind:value={settings.delayTime} />
    </label>

    <label>
      Feedback: {Math.round(settings.delayFeedback * 100)}%
      <input type="range" min="0" max="0.9" step="0.01" bind:value={settings.delayFeedback} />
    </label>

    <label>
      Mix: {Math.round(settings.delayMix * 100)}%
      <input type="range" min="0" max="1" step="0.01" bind:value={settings.delayMix} />
    </label>
  </section>

  <section>
    <h2>Reverb</h2>

    <label>
      Size: {settings.reverbSize.toFixed(1)} s
      <input type="range" min="0.3" max="6" step="0.1" bind:value={settings.reverbSize} />
    </label>

    <label>
      Pre-Delay: {Math.round(settings.reverbPreDelay * 1000)} ms
      <input type="range" min="0" max="0.2" step="0.001" bind:value={settings.reverbPreDelay} />
    </label>

    <label>
      Mix: {Math.round(settings.reverbMix * 100)}%
      <input type="range" min="0" max="1" step="0.01" bind:value={settings.reverbMix} />
    </label>
  </section>

  <section>
    <label>
      Volume: {Math.round(settings.volume * 100)}%
      <input type="range" min="0" max="1" step="0.01" bind:value={settings.volume} />
    </label>
  </section>
</main>

<style>
  main {
    padding: 2rem;
  }
  section {
    margin-bottom: 2rem;
  }
  .status { font-size: 2rem; color: #7ad; margin: 0; min-height: 2.4rem; }
  .hint { font-size: 0.75rem; color: #666; margin-top: 0; }
</style>
