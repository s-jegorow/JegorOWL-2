<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    title: string;
    onclose: () => void;
    children: Snippet;
  }

  let { title, onclose, children }: Props = $props();

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<aside aria-label={title} transition:fly={{ x: 320, duration: 200 }}>
  <header>
    <h2>{title}</h2>
    <button onclick={onclose} aria-label="Close">×</button>
  </header>
  {@render children()}
</aside>

<style>
  aside {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 10;
    width: 20rem;
    max-width: 100%;
    height: 100vh;
    padding: 1rem;
    overflow-y: auto;
    background: var(--color-bg);
    border-left: 1px solid var(--color-line);
    box-shadow: var(--glow-box);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--color-line);
  }
  h2 {
    font-size: 0.9rem;
    margin: 0;
  }
</style>
