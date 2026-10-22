<script lang="ts">
  import { midi } from '../connections.svelte';
  import { midiMapping, clearAllAssignments } from '../midiMapping.svelte';

  let count = $derived(Object.keys(midiMapping.assignments).length);
</script>

<h3>MIDI Mapping</h3>
{#if !midi.connected}
  <p class="hint">Connect MIDI to map controls</p>
{:else}
  <p class="hint">{count} mapped · use Map in the header to assign</p>
  <button onclick={clearAllAssignments} disabled={count === 0}>Clear all</button>
{/if}

<style>
  h3 {
    font-size: 0.8rem;
    margin: 1.5rem 0 0.5rem;
  }
  .hint {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
</style>
