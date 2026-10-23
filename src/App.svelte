<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as engine from './audio/engine';
  import type { EngineSettings } from './audio/engine';
  import { KEY_MAP, OCTAVE_MIN, OCTAVE_MAX } from './audio/notes';
  import EnvelopeGraph from './components/EnvelopeGraph.svelte';
  import Oscilloscope from './components/Oscilloscope.svelte';
  import Keyboard from './components/Keyboard.svelte';
  import Console from './components/Console.svelte';
  import Tv from './components/Tv.svelte';
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
  import { OWL_NEUTRAL } from './owl';

  type DrawerName = 'presets' | 'config';

  const activeNotes = new SvelteSet<number>();
  const heldKeys = new Map<string, number>();

  let octave = $state(0);

  let settings = $state(loadLastSettings());
  let openDrawer: DrawerName | null = $state(null);

   $effect(() => { saveLastSettings(settings); });

  $effect(() => { engine.setWaveform(settings.waveform); });
  $effect(() => { engine.setOsc2Waveform(settings.osc2Waveform); });
  $effect(() => { engine.setOsc2Mix(settings.osc2Mix); });
  $effect(() => { engine.setOsc2Detune(settings.osc2Detune); });
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

  function startNote(note: number, velocity = 1) {
    engine.noteOn(note, velocity);
    activeNotes.add(note);
  }

  function stopNote(note: number) {
    engine.noteOff(note);
    activeNotes.delete(note);
  }

  const controls = createControls({ settings, startNote, stopNote });

  function handleControl(name: string, value: number) {
    const handler = controls[name];
    if (handler) handler(value);
  }

  function handleMidiControl(controller: number, value: number) {
    const mapped = handleControlChange(controller, value);
    if (mapped) settings[mapped.key] = mapped.value;
  }

  function applySettings(next: EngineSettings) {
    Object.assign(settings, next);
           }

  function toggleDrawer(name: DrawerName) {
    openDrawer = openDrawer === name ? null : name;
            }


  //fix: ignore holddown-repeat
  function handleKeyDown(event: KeyboardEvent) {
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

  function handleKeyUp(event: KeyboardEvent) {
    const note = heldKeys.get(event.code);
    if (note === undefined) return;

    heldKeys.delete(event.code);
    stopNote(note);
  }

  function shiftOctave(step: number) {
    octave = Math.min(OCTAVE_MAX, Math.max(OCTAVE_MIN, octave + step));
  }

  function releaseAllNotes() {
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
    <div class="brand">
      <pre class="owl" aria-hidden="true">{OWL_NEUTRAL}</pre>
      <h1>JegorOWL-2</h1>
    </div>
    <div class="drawer-buttons">
      {#if midi.connected}
        <button onclick={toggleMapMode} aria-pressed={midiMapping.mapping}>Map</button>
      {/if}
      <button onclick={() => toggleDrawer('presets')} aria-pressed={openDrawer === 'presets'}>Presets</button>
      <button onclick={() => toggleDrawer('config')} aria-pressed={openDrawer === 'config'}>Config</button>
    </div>
  </header>

  <Console>
    {#snippet screen()}
      <Tv>
        <Oscilloscope />
      </Tv>
    {/snippet}

    {#snippet controls()}
      <MappableKnob param="volume" bind:value={settings.volume} />
    {/snippet}

    {#snippet keys()}
      <Keyboard
        {activeNotes}
        {octave}
        onnoteon={startNote}
        onnoteoff={stopNote}
        onoctave={shiftOctave}
      />
    {/snippet}
  </Console>

  <Panel title="Osc" span={4} rows={2}>
    <div class="selects">
      <Select label="Wave 1" options={WAVEFORMS} bind:value={settings.waveform} />
      <Select label="Wave 2" options={WAVEFORMS} bind:value={settings.osc2Waveform} />
    </div>

    <div class="knobs">
      <MappableKnob param="osc2Mix" bind:value={settings.osc2Mix} />
      <MappableKnob param="osc2Detune" bind:value={settings.osc2Detune} />
    </div>
  </Panel>

  <Panel title="Filter" span={4} rows={2}>
    <div class="selects">
      <Select label="Type" options={FILTER_TYPES} bind:value={settings.filterType} />
    </div>

    <div class="knobs">
      <MappableKnob param="cutoff" bind:value={settings.cutoff} />
      <MappableKnob param="resonance" bind:value={settings.resonance} />
      <MappableKnob param="filterAmount" bind:value={settings.filterAmount} />
    </div>
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
    <div class="selects">
      <Select label="Waveform" options={WAVEFORMS} bind:value={settings.lfoWaveform} />
    </div>

    <div class="knobs">
      <MappableKnob param="lfoRate" bind:value={settings.lfoRate} />
      <MappableKnob param="lfoFilterDepth" bind:value={settings.lfoFilterDepth} />
      <MappableKnob param="lfoPitchDepth" bind:value={settings.lfoPitchDepth} />
    </div>
  </Panel>

  <Panel title="Filter Envelope" span={4} rows={2}>
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

  <Panel title="FX" span={4} rows={2}>
    <div class="effects">
      <div class="effect">
        <span class="effect-name">Delay</span>
        <MappableKnob param="delayTime" bind:value={settings.delayTime} />
        <MappableKnob param="delayFeedback" bind:value={settings.delayFeedback} />
        <MappableKnob param="delayMix" bind:value={settings.delayMix} />
      </div>

      <div class="effect">
        <span class="effect-name">Reverb</span>
        <MappableKnob param="reverbSize" bind:value={settings.reverbSize} />
        <MappableKnob param="reverbPreDelay" bind:value={settings.reverbPreDelay} />
        <MappableKnob param="reverbMix" bind:value={settings.reverbMix} />
      </div>
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
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .owl {
    margin: 0;
    font-family: inherit;
    font-size: 0.6rem;
    line-height: 1;
    text-shadow: var(--glow-text);
  }
  h1 {
    margin: 0;
  }
  .drawer-buttons {
    display: flex;
    gap: 0.5rem;
  }
  .selects {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  .knobs {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .effects {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
  }
  .effect {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .effect-name {
    width: 3.5rem;
    text-align: right;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
</style>
