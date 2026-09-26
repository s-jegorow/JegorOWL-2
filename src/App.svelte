<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as engine from './audio/engine';
  import { noteName } from './audio/notes';

  const KEY_MAP: Record<string, number> = {
    a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66,
    g: 67, z: 68, y: 68, h: 69, u: 70, j: 71, k: 72,
  };

  let activeNotes = $state(new SvelteSet<number>());

  let waveform: OscillatorType = $state('sawtooth');
  let resonance = $state(1);
  let volume = $state(0.3);
  let cutoff = $state(2000);
  let attack = $state(0.01);
  let decay = $state(0.2);
  let sustain = $state(0.6);
  let release = $state(0.4);

  let delayTime = $state(0.35);
  let delayFeedback = $state(0.4);
  let delayMix = $state(0);

  let reverbSize = $state(2);
  let reverbPreDelay = $state(0.02);
  let reverbMix = $state(0);

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

  let envelopePoints = $derived.by(() => {
    const viewW = 260;
    const height = 60;
    const pad = 4;
    const sustainFrac = 0.25;

    const inner = viewW - 2 * pad;
    const timeW = inner * (1 - sustainFrac);
    const sustainW = inner * sustainFrac;

    const total = attack + decay + release || 1;
    const aW = timeW * (attack / total);
    const dW = timeW * (decay / total);
    const rW = timeW * (release / total);

    const bottom = height - pad;
    const top = pad;
    const sustainY = bottom - sustain * (bottom - top);

    let x = pad;
    const points: [number, number][] = [[x, bottom]];
    x += aW; points.push([x, top]);
    x += dW; points.push([x, sustainY]);
    x += sustainW; points.push([x, sustainY]);
    x += rW; points.push([x, bottom]);

    return points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  });

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
  <br />
  <div>
    <p class="status">{activeLabel || '–'}</p>
    <p class="hint">A S D F G H J K und W E T Z U · mehrere Tasten gleichzeitig für Akkorde</p>
  </div>
  <br/><br/>

  <label>
    Wellenform
    <select bind:value={waveform}>
      <option value="sine">Sine</option>
      <option value="triangle">Triangle</option>
      <option value="square">Square</option>
      <option value="sawtooth">Sawtooth</option>
    </select>
  </label>
  <br/><br/>

  <label>
    Cutoff: {cutoff} Hz
    <input type="range" min="50" max="12000" step="1" bind:value={cutoff} />
  </label>

  <label>
    Resonanz: {resonance}
    <input type="range" min="0.5" max="20" step="0.1" bind:value={resonance} />
  </label>
  <br/><br/>

  <section>
    <h2>Envelope</h2>

    <svg class="envelope" viewBox="0 0 260 60">
      <polyline points={envelopePoints} fill="none" stroke="#7ad" stroke-width="2" />
    </svg>

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
  <br/><br/>

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
  <br/><br/>

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
  <br/><br/>

  <div>
    <label>
      Lautstärke: {Math.round(volume * 100)}%
      <input type="range" min="0" max="1" step="0.01" bind:value={volume} />
    </label>
  </div>
</main>

<style>
  main {
    padding: 2rem;
  }
  .status { font-size: 2rem; color: #7ad; margin: 0; min-height: 2.4rem; }
  .hint { font-size: 0.75rem; color: #666; margin-top: 0; }
  .envelope {
    width: 100%;
    height: 60px;
    background: #222;
    border: 1px solid #333;
    margin-top: 0.5rem;
  }
</style>
