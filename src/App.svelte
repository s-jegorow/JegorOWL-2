<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as engine from './audio/engine';
  import type { EngineSettings } from './audio/engine';
  import { KEY_MAP, OCTAVE_MIN, OCTAVE_MAX } from './audio/notes';
  import EnvelopeGraph from './components/EnvelopeGraph.svelte';
  import Oscilloscope from './components/Oscilloscope.svelte';
  import Keyboard from './components/Keyboard.svelte';
  import PresetManager from './components/PresetManager.svelte';
  import ConnectionSettings from './components/ConnectionSettings.svelte';
  import MidiMapping from './components/MidiMapping.svelte';
  import MappableKnob from './components/MappableKnob.svelte';
  import Panel from './components/ui/Panel.svelte';
  import Select from './components/ui/Select.svelte';
  import Drawer from './components/ui/Drawer.svelte';
  import { loadLastSettings, saveLastSettings } from './presets';
  import { createControls } from './controls';
  import { WAVEFORMS, FILTER_TYPES } from './params';
  import { midi } from './connections.svelte';
  import { midiMapping, handleControlChange, toggleMapMode } from './midiMapping.svelte';

  type DrawerName = 'presets' | 'config';

  const activeNotes = new SvelteSet<number>();
  const heldKeys = new Map<string, number>();

  let octave = $state(0);

  let settings = $state(loadLastSettings());
  let openDrawer: DrawerName | null = $state(null);

  $effect(() => { saveLastSettings(settings); });

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

  function startNote(note: number, velocity = 1): void {
    engine.noteOn(note, velocity);
    activeNotes.add(note);
  }

  function stopNote(note: number): void {
    engine.noteOff(note);
    activeNotes.delete(note);
  }

  const controls = createControls({ settings, startNote, stopNote });

  function handleControl(name: string, value: number): void {
    const handler = controls[name];
    if (handler) handler(value);
  }

  function handleMidiControl(controller: number, value: number): void {
    const mapped = handleControlChange(controller, value);
    if (mapped) settings[mapped.key] = mapped.value;
  }

  function applySettings(next: EngineSettings): void {
    Object.assign(settings, next);
  }

  function toggleDrawer(name: DrawerName): void {
    openDrawer = openDrawer === name ? null : name;
  }


  //fix: ignore holddown-repeat
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return;

    if (event.key === 'Meta') {
      releaseAllNotes();
      return;
    }
    if (event.metaKey) return;

    const tag = (event.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if (event.code === 'KeyZ') {
      shiftOctave(-1);
      return;
    }
    if (event.code === 'KeyX') {
      shiftOctave(1);
      return;
    }

    const baseNote = KEY_MAP[event.code];
    if (baseNote === undefined) return;

    const note = baseNote + octave * 12;
    heldKeys.set(event.code, note);
    startNote(note);
  }

  function handleKeyUp(event: KeyboardEvent): void {
    const note = heldKeys.get(event.code);
    if (note === undefined) return;

    heldKeys.delete(event.code);
    stopNote(note);
  }

  function shiftOctave(step: number): void {
    octave = Math.min(OCTAVE_MAX, Math.max(OCTAVE_MIN, octave + step));
  }

  function releaseAllNotes(): void {
    engine.allNotesOff();
    activeNotes.clear();
    heldKeys.clear();
  }
</script>

<svelte:window
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
  onblur={releaseAllNotes}
/>

<main>
  <header>
    <h1>JegorOWL-2</h1>
    <div class="drawer-buttons">
      {#if midi.connected}
        <button onclick={toggleMapMode} aria-pressed={midiMapping.mapping}>Map</button>
      {/if}
      <button onclick={() => toggleDrawer('presets')} aria-pressed={openDrawer === 'presets'}>Presets</button>
      <button onclick={() => toggleDrawer('config')} aria-pressed={openDrawer === 'config'}>Config</button>
    </div>
  </header>

  <Panel span={8} rows={2}>
    <Keyboard
      {activeNotes}
      {octave}
      onnoteon={startNote}
      onnoteoff={stopNote}
      onoctave={shiftOctave}
    />
  </Panel>

  <Panel span={4} rows={2}>
    <Oscilloscope />
  </Panel>

  <Panel title="Osc" span={4} rows={1}>
    <Select label="Waveform" options={WAVEFORMS} bind:value={settings.waveform} />
  </Panel>

  <Panel title="Amp Envelope" span={4} rows={2}>
    <EnvelopeGraph
      attack={settings.attack}
      decay={settings.decay}
      sustain={settings.sustain}
      release={settings.release}
    />

    <div class="knobs">
      <MappableKnob param="attack" bind:value={settings.attack} />
      <MappableKnob param="decay" bind:value={settings.decay} />
      <MappableKnob param="sustain" bind:value={settings.sustain} />
      <MappableKnob param="release" bind:value={settings.release} />
    </div>
  </Panel>

  <Panel title="LFO" span={4} rows={2}>
    <Select label="Waveform" options={WAVEFORMS} bind:value={settings.lfoWaveform} />

    <div class="knobs">
      <MappableKnob param="lfoRate" bind:value={settings.lfoRate} />
      <MappableKnob param="lfoFilterDepth" bind:value={settings.lfoFilterDepth} />
      <MappableKnob param="lfoPitchDepth" bind:value={settings.lfoPitchDepth} />
    </div>
  </Panel>

  <Panel title="Filter" span={4} rows={3}>
    <Select label="Type" options={FILTER_TYPES} bind:value={settings.filterType} />

    <div class="knobs">
      <MappableKnob param="cutoff" bind:value={settings.cutoff} />
      <MappableKnob param="resonance" bind:value={settings.resonance} />
      <MappableKnob param="filterAmount" bind:value={settings.filterAmount} />
    </div>

    <EnvelopeGraph
      attack={settings.filterAttack}
      decay={settings.filterDecay}
      sustain={settings.filterSustain}
      release={settings.filterRelease}
    />

    <div class="knobs">
      <MappableKnob param="filterAttack" bind:value={settings.filterAttack} />
      <MappableKnob param="filterDecay" bind:value={settings.filterDecay} />
      <MappableKnob param="filterSustain" bind:value={settings.filterSustain} />
      <MappableKnob param="filterRelease" bind:value={settings.filterRelease} />
    </div>
  </Panel>

  <Panel title="Delay" span={4} rows={2}>
    <div class="knobs">
      <MappableKnob param="delayTime" bind:value={settings.delayTime} />
      <MappableKnob param="delayFeedback" bind:value={settings.delayFeedback} />
      <MappableKnob param="delayMix" bind:value={settings.delayMix} />
    </div>
  </Panel>

  <Panel title="Reverb" span={4} rows={2}>
    <div class="knobs">
      <MappableKnob param="reverbSize" bind:value={settings.reverbSize} />
      <MappableKnob param="reverbPreDelay" bind:value={settings.reverbPreDelay} />
      <MappableKnob param="reverbMix" bind:value={settings.reverbMix} />
    </div>
  </Panel>

  <Panel title="Master" span={4} rows={2}>
    <div class="knobs">
      <MappableKnob param="volume" bind:value={settings.volume} />
    </div>
  </Panel>
</main>

{#if openDrawer === 'presets'}
  <Drawer title="Presets" onclose={() => (openDrawer = null)}>
    <PresetManager {settings} onapply={applySettings} />
  </Drawer>
{:else if openDrawer === 'config'}
  <Drawer title="Config" onclose={() => (openDrawer = null)}>
    <ConnectionSettings
      onnoteon={startNote}
      onnoteoff={stopNote}
      oncontrolchange={handleMidiControl}
      oncontrol={handleControl}
    />
    <MidiMapping />
  </Drawer>
{/if}

<style>
  header {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 {
    margin: 0;
  }
  .drawer-buttons {
    display: flex;
    gap: 0.5rem;
  }
  .knobs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    justify-items: center;
    margin-top: 0.5rem;
  }
</style>
