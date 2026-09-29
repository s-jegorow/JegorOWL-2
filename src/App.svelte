<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as engine from './audio/engine';
  import { DEFAULT_SETTINGS } from './audio/engine';
  import { KEY_MAP, noteName } from './audio/notes';
  import EnvelopeGraph from './components/EnvelopeGraph.svelte';

  const activeNotes = new SvelteSet<number>();

  let waveform = $state(DEFAULT_SETTINGS.waveform);
  let resonance = $state(DEFAULT_SETTINGS.resonance);
  let volume = $state(DEFAULT_SETTINGS.volume);
  let cutoff = $state(DEFAULT_SETTINGS.cutoff);
  let attack = $state(DEFAULT_SETTINGS.attack);
  let decay = $state(DEFAULT_SETTINGS.decay);
  let sustain = $state(DEFAULT_SETTINGS.sustain);
  let release = $state(DEFAULT_SETTINGS.release);

  let delayTime = $state(DEFAULT_SETTINGS.delayTime);
  let delayFeedback = $state(DEFAULT_SETTINGS.delayFeedback);
  let delayMix = $state(DEFAULT_SETTINGS.delayMix);

  let reverbSize = $state(DEFAULT_SETTINGS.reverbSize);
  let reverbPreDelay = $state(DEFAULT_SETTINGS.reverbPreDelay);
  let reverbMix = $state(DEFAULT_SETTINGS.reverbMix);

  $effect(() => { engine.setWaveform(waveform); });
  $effect(() => { engine.setCutoff(cutoff); });
  $effect(() => { engine.setResonance(resonance); });
  $effect(() => { engine.setVolume(volume); });

  $effect(() => { engine.setAttack(attack); });
  $effect(() => { engine.setDecay(decay); });
  $effect(() => { engine.setSustain(sustain); });
  $effect(() => { engine.setRelease(release); });

  $effect(() => { engine.setDelayTime(delayTime); });
  $effect(() => { engine.setDelayFeedback(delayFeedback); });
  $effect(() => { engine.setDelayMix(delayMix); });

  $effect(() => { engine.setReverbSize(reverbSize); });
  $effect(() => { engine.setReverbPreDelay(reverbPreDelay); });
  $effect(() => { engine.setReverbMix(reverbMix); });

  //fix: ignore holddown-repeat
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return;

    const tag = (event.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    const note = KEY_MAP[event.key.toLowerCase()];
    if (note === undefined) return;

    engine.noteOn(note);
    activeNotes.add(note);
  }

  function handleKeyUp(event: KeyboardEvent): void {
    const note = KEY_MAP[event.key.toLowerCase()];
    if (note === undefined) return;

    engine.noteOff(note);
    activeNotes.delete(note);
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
    <label>
      Waveform
      <select bind:value={waveform}>
        <option value="sine">Sine</option>
        <option value="triangle">Triangle</option>
        <option value="square">Square</option>
        <option value="sawtooth">Sawtooth</option>
      </select>
    </label>
  </section>

  <section>
    <label>
      Cutoff: {cutoff} Hz
      <input type="range" min="50" max="12000" step="1" bind:value={cutoff} />
    </label>

    <label>
      Resonance: {resonance}
      <input type="range" min="0.5" max="20" step="0.1" bind:value={resonance} />
    </label>
  </section>

  <section>
    <h2>Envelope</h2>

    <EnvelopeGraph {attack} {decay} {sustain} {release} />

    <label>
      Attack: {attack.toFixed(3)} s
      <input type="range" min="0.001" max="2" step="0.001" bind:value={attack} />
    </label>
    <label>
      Decay: {decay.toFixed(2)} s
      <input type="range" min="0" max="2" step="0.01" bind:value={decay} />
    </label>

    <label>
      Sustain: {sustain.toFixed(2)}
      <input type="range" min="0" max="1" step="0.01" bind:value={sustain} />
    </label>

    <label>
      Release: {release.toFixed(2)} s
      <input type="range" min="0.01" max="3" step="0.01" bind:value={release} />
    </label>
  </section>

  <section>
    <h2>Delay</h2>

    <label>
      Time: {Math.round(delayTime * 1000)} ms
      <input type="range" min="0.01" max="1" step="0.01" bind:value={delayTime} />
    </label>

    <label>
      Feedback: {Math.round(delayFeedback * 100)}%
      <input type="range" min="0" max="0.9" step="0.01" bind:value={delayFeedback} />
    </label>

    <label>
      Mix: {Math.round(delayMix * 100)}%
      <input type="range" min="0" max="1" step="0.01" bind:value={delayMix} />
    </label>
  </section>

  <section>
    <h2>Reverb</h2>

    <label>
      Size: {reverbSize.toFixed(1)} s
      <input type="range" min="0.3" max="6" step="0.1" bind:value={reverbSize} />
    </label>

    <label>
      Pre-Delay: {Math.round(reverbPreDelay * 1000)} ms
      <input type="range" min="0" max="0.2" step="0.001" bind:value={reverbPreDelay} />
    </label>

    <label>
      Mix: {Math.round(reverbMix * 100)}%
      <input type="range" min="0" max="1" step="0.01" bind:value={reverbMix} />
    </label>
  </section>

  <section>
    <label>
      Volume: {Math.round(volume * 100)}%
      <input type="range" min="0" max="1" step="0.01" bind:value={volume} />
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
