<script lang="ts">
  import { midi, arduino, enableMidi, connectArduino } from '../connections.svelte';

  interface Props {
    onnoteon: (note: number, velocity: number) => void;
    onnoteoff: (note: number) => void;
    oncontrolchange: (controller: number, value: number) => void;
    oncontrol: (name: string, value: number) => void;
  }

  let { onnoteon, onnoteoff, oncontrolchange, oncontrol }: Props = $props();

  let hint = $derived.by(() => {
    if (!midi.supported && !arduino.supported) return 'MIDI and Arduino need Chrome or Edge';
    if (!midi.supported) return 'MIDI needs Chrome or Edge';
    if (!arduino.supported) return 'Arduino needs Chrome or Edge';
    return midi.error || arduino.error;
  });
</script>

<h3>Connect</h3>
<div class="buttons">
  <button onclick={() => enableMidi(onnoteon, onnoteoff, oncontrolchange)} disabled={!midi.supported} aria-pressed={midi.connected}>
    MIDI
  </button>
  <button onclick={() => connectArduino(oncontrol)} disabled={!arduino.supported} aria-pressed={arduino.connected}>
    Arduino
  </button>
</div>
<p class="hint">{hint}</p>

<style>
  h3 {
    font-size: 0.8rem;
    margin: 0 0 0.5rem;
  }
  .buttons {
    display: flex;
    gap: 0.5rem;
  }
  .hint {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
</style>
