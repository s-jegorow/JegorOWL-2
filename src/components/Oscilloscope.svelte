<script lang="ts">
  import { getAnalyser, ANALYSER_SIZE } from '../audio/engine';

  const WIDTH = 600;
  const HEIGHT = 300;
  const SAMPLES_SHOWN = 1024;

  let canvas: HTMLCanvasElement;

  interface ScopeColors {
    grid: string;
    line: string;
  }

  // canvas can't do var(), so grab the tokens once
  function readColors(element: HTMLElement): ScopeColors {
    const style = getComputedStyle(element);
    return {
      grid: style.getPropertyValue('--color-line').trim(),
      line: style.getPropertyValue('--color-accent').trim(),
    };
  }

  function findTrigger(data: Float32Array): number {
    const searchEnd = data.length - SAMPLES_SHOWN;
    for (let i = 1; i < searchEnd; i++) {
      // trigger-magic
      if (data[i - 1] < 0 && data[i] >= 0) return i;
    }
    return 0;
  }

  function draw(pen: CanvasRenderingContext2D, data: Float32Array, colors: ScopeColors) {
    pen.clearRect(0, 0, WIDTH, HEIGHT);

    pen.strokeStyle = colors.grid;
    pen.lineWidth = 1;
    pen.beginPath();
    pen.moveTo(0, HEIGHT / 2);
    pen.lineTo(WIDTH, HEIGHT / 2);
    pen.stroke();

    const start = findTrigger(data);

    pen.strokeStyle = colors.line;
    pen.lineWidth = 2;
    pen.shadowColor = colors.line;
    pen.shadowBlur = 6;
    pen.beginPath();
    for (let i = 0; i < SAMPLES_SHOWN; i++) {
      const x = (i / (SAMPLES_SHOWN - 1)) * WIDTH;
      const y = HEIGHT / 2 - data[start + i] * (HEIGHT / 2);
      if (i === 0) pen.moveTo(x, y);
      else pen.lineTo(x, y);
    }
    pen.stroke();
    pen.shadowBlur = 0;
  }

  $effect(() => {
    const pen = canvas.getContext('2d');
    if (!pen) return;

    const colors = readColors(canvas);
    const data = new Float32Array(ANALYSER_SIZE);
    let frameId = 0;

    const frame = () => {
      const analyser = getAnalyser();
      if (analyser) analyser.getFloatTimeDomainData(data);
      draw(pen, data, colors);
      frameId = requestAnimationFrame(frame);
    };

    frame();
    return () => cancelAnimationFrame(frameId);
  });
</script>

<canvas bind:this={canvas} width={WIDTH} height={HEIGHT}></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
