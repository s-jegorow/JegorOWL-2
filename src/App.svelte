<script lang="ts">

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let isPlaying = $state(false);
let frequency = $state(220);


function ensureAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function startTone(): void {
  const ctx = ensureAudioContext();
  oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = 240;
  oscillator.connect(ctx.destination);
  oscillator.start();
  isPlaying = true;
}

function stopTone(): void {
  if (oscillator) {
    oscillator.stop();
    oscillator.disconnect();
    oscillator = null;
  }
  isPlaying = false;
}

function toggleTone(): void {
  if (isPlaying) {
    stopTone();
  } else {
    startTone();
  }
}

</script>

<main>
  <h1>JegorOWL-2</h1>

  <button onclick={toggleTone}>
  {isPlaying ? '■ Stop' : '▶ Play'}
</button>

</main>

<style>
  main {
    font-family: monospace;
    color: #e0e0e0;
    background: #1a1a1a;
    min-height: 100vh;
    padding: 2rem;
  }
</style>