<script lang="ts">
  import Knob from './ui/Knob.svelte';
  import { PARAMS, PARAM_GROUPS, type ParamKey } from '../params';
  import { midiMapping, toggleLearning, clearAssignment } from '../midiMapping.svelte';

  interface Props {
    param: ParamKey;
    value: number;
  }

  let { param, value = $bindable() }: Props = $props();

  let controller = $derived(midiMapping.assignments[param]);
  let group = $derived(PARAM_GROUPS.find((g) => g.keys.includes(param))?.title ?? '');

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    clearAssignment(param);
    event.preventDefault();
  }
</script>

<div class="mappable">
  <Knob {...PARAMS[param]} bind:value />
  {#if midiMapping.mapping}
    <button
      class="overlay"
      onclick={() => toggleLearning(param)}
      onkeydown={handleKeyDown}
      aria-pressed={midiMapping.learning === param}
      aria-label="Map {group} {PARAMS[param].label}"
    >
      <span class="cc">{controller === undefined ? '–' : `CC ${controller}`}</span>
    </button>
  {/if}
</div>

<style>
  .mappable {
    position: relative;
  }
  .overlay {
    position: absolute;
    inset: -0.2rem;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: 1px dashed var(--color-accent);
  }
  .overlay[aria-pressed='true'] {
    animation: blink 0.8s steps(2) infinite;
  }
  .cc {
    width: 100%;
    font-size: 0.65rem;
    background: var(--color-surface);
  }
  @keyframes blink {
    50% {
      border-color: transparent;
    }
  }
</style>
