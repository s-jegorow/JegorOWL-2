<script lang="ts">
  import { OCTAVE_MIN, OCTAVE_MAX } from '../audio/notes';

  interface Props {
    octave: number;
    onoctave: (step: number) => void;
  }

  let { octave, onoctave }: Props = $props();
</script>

<div class="octave">
  <div class="buttons">
    <button onclick={() => onoctave(-1)} disabled={octave <= OCTAVE_MIN} aria-label="Octave down">−</button>
    <span>Oct {octave > 0 ? `+${octave}` : octave}</span>
    <button onclick={() => onoctave(1)} disabled={octave >= OCTAVE_MAX} aria-label="Octave up">+</button>
  </div>
  <span class="hint">Y / X</span>
</div>

<style>
  .octave {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }
  .buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
  }
  .hint {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
</style>
