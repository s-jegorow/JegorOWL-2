<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    screen: Snippet;
    controls: Snippet;
    keys: Snippet;
  }

  let { screen, controls, keys }: Props = $props();
</script>

<section class="console span-12 rows-4">
  <div class="screen">{@render screen()}</div>
  <div class="controls">{@render controls()}</div>
  <div class="keys">{@render keys()}</div>
</section>

<style>
  .console {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 6rem 17.5rem;
    gap: 1.5rem;
    padding: 1.25rem;
    border: 2px solid var(--color-accent);
    border-radius: 1rem;
    background: var(--color-surface);
    box-shadow: var(--glow-box);
  }
  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }
  .keys {
    min-width: 0;
  }

  @media (max-width: 999px) {
    .console {
      grid-template-columns: minmax(0, 1fr);
    }
    .screen {
      height: 15rem;
    }
    .controls {
      flex-direction: row;
    }
  }
</style>
