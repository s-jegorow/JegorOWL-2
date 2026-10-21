<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    span: number;
    rows: number;
    children: Snippet;
  }

  let { title, span, rows, children }: Props = $props();
</script>

<section class="span-{span} rows-{rows}">
  {#if title}
    <h2>{title}</h2>
  {/if}
  {@render children()}
</section>

<style>
  section {
    margin: 0;
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
  }
  h2 {
    font-size: 0.9rem;
    margin: 0 0 0.6rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--color-line);
  }
</style>
