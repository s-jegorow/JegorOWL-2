<script lang="ts">
  import * as engine from './audio/engine';

  let isPlaying = $state(false);
  let frequency = $state(220);
  let cutoff = $state(2000);
  let resonance = $state(1);
  let volume = $state(0.3);


  $effect(() => {
  engine.setResonance(resonance);
});

  $effect(() => {
    engine.setFrequency(frequency);
  });

  $effect(() => {
  engine.setCutoff(cutoff);
  });

  $effect(() => {
  engine.setVolume(volume);
});

  function toggleTone(): void {
    if (isPlaying) {
      engine.noteOff();
      isPlaying = false;
    } else {
      engine.noteOn();
      isPlaying = true;
    }
  }
</script>

<main>
  <h1>JegorOWL-2</h1>
  <br/>
  <center>
  <button onclick={toggleTone}>
    {isPlaying ? '■ Stop' : '▶ Play'}
  </button>
  </center>
<br/><br/>
  <label>
    Frequenz: {frequency} Hz
    <input type="range" min="50" max="1000" bind:value={frequency} />
  </label>

  <label>
  Cutoff: {cutoff} Hz
  <input type="range" min="50" max="12000" step="1" bind:value={cutoff} />
</label>

<label>
  Resonanz: {resonance}
  <input type="range" min="0.5" max="20" step="0.1" bind:value={resonance} />
</label>
<br/><br/>
<center>
  <label>
  Lautstärke: {Math.round(volume * 100)}%
  <input type="range" min="0" max="1" step="0.01" bind:value={volume} />
</label>
</center>
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