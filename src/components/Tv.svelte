<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="tv">
  {@render children()}
  <div class="scanlines"></div>
</div>

<style>
  .tv {
    position: relative;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--color-line);
    border-radius: 1.75rem / 1.25rem;
    background: radial-gradient(ellipse at center, var(--color-screen) 0%, var(--color-surface) 75%);
    box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.9);
  }
  .scanlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.35) 0px,
      rgba(0, 0, 0, 0.35) 1px,
      transparent 1px,
      transparent 3px
    );
  }
</style>
