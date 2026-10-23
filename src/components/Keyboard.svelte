<script lang="ts">
  import { KEY_MAP, KEY_LABELS, noteName } from '../audio/notes';
  import Octave from './Octave.svelte';

  interface Props {
    activeNotes: Set<number>;
    octave: number;
    onnoteon: (note: number) => void;
    onnoteoff: (note: number) => void;
    onoctave: (step: number) => void;
  }

  let { activeNotes, octave, onnoteon, onnoteoff, onoctave }: Props = $props();

  interface KeyInfo {
    note: number;
    position: number;
  }

  const BLACK_KEYS = [1, 3, 6, 8, 10];
  const KEY_COUNT = 13;

  let pointerNote: number | null = null;

  let start = $derived(60 + octave * 12);

  let keys = $derived.by(() => {
    const white: KeyInfo[] = [];
    const black: KeyInfo[] = [];
    for (let note = start; note < start + KEY_COUNT; note++) {
      if (BLACK_KEYS.includes(note % 12)) black.push({ note, position: white.length });
      else white.push({ note, position: white.length });
    }
    return { white, black };
  });

  let labels = $derived.by(() => {
    const result = new Map<number, string>();
    for (const code in KEY_MAP) {
      result.set(KEY_MAP[code] + octave * 12, KEY_LABELS[code]);
    }
    return result;
  });

  let activeLabel = $derived([...activeNotes].sort((a, b) => a - b).map(noteName).join(' '));

  function press(note: number) {
    pointerNote = note;
    onnoteon(note);
  }

  function release(note: number) {
    if (pointerNote !== note) return;
    pointerNote = null;
    onnoteoff(note);
  }
</script>

<div class="keyboard">
  <div class="top">
    <p class="status">{activeLabel}</p>
    <Octave {octave} {onoctave} />
  </div>

  <div class="keys">
    {#each keys.white as key (key.note)}
      <div
        class="white"
        class:active={activeNotes.has(key.note)}
        role="button"
        tabindex="-1"
        aria-label={noteName(key.note)}
        onpointerdown={() => press(key.note)}
        onpointerup={() => release(key.note)}
        onpointerleave={() => release(key.note)}
        onpointercancel={() => release(key.note)}
      >
        <span class="letter">{labels.get(key.note) ?? ''}</span>
      </div>
    {/each}
    {#each keys.black as key (key.note)}
      <div
        class="black"
        class:active={activeNotes.has(key.note)}
        style:left="{(key.position / keys.white.length) * 100}%"
        role="button"
        tabindex="-1"
        aria-label={noteName(key.note)}
        onpointerdown={() => press(key.note)}
        onpointerup={() => release(key.note)}
        onpointerleave={() => release(key.note)}
        onpointercancel={() => release(key.note)}
      >
        <span class="letter">{labels.get(key.note) ?? ''}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .keyboard {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .status {
    font-size: 2rem;
    color: var(--color-accent);
    text-shadow: var(--glow-text);
    margin: 0;
    min-height: 2.4rem;
  }
  .keys {
    position: relative;
    display: flex;
    height: 9rem;
    margin-top: 2rem;
    touch-action: none;
    user-select: none;
  }
  .white,
  .black {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 0.3rem;
    background: var(--color-surface);
    cursor: pointer;
  }
  .white {
    flex: 1;
    border: 1px solid var(--color-line);
    border-left: none;
  }
  .white:first-child {
    border-left: 1px solid var(--color-line);
  }
  .black {
    position: absolute;
    top: 0;
    width: 7.5%;
    height: 60%;
    transform: translateX(-50%);
    border: 1px solid var(--color-accent);
  }
  .letter {
    font-size: 0.65rem;
    color: var(--color-muted);
  }
  .active {
    background: var(--color-accent);
    box-shadow: var(--glow-box);
  }
  .active .letter {
    color: var(--color-bg);
  }
</style>
