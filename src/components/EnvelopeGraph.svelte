<script lang="ts">
  interface Props {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  }

  let { attack, decay, sustain, release }: Props = $props();

  let points = $derived.by(() => {
    const viewW = 260;
    const height = 60;
    const pad = 4;
    const sustainFrac = 0.25;

    const inner = viewW - 2 * pad;
    const timeW = inner * (1 - sustainFrac);
    const sustainW = inner * sustainFrac;

    const total = attack + decay + release || 1;
    const aW = timeW * (attack / total);
    const dW = timeW * (decay / total);
    const rW = timeW * (release / total);

    const bottom = height - pad;
    const top = pad;
    const sustainY = bottom - sustain * (bottom - top);

    let x = pad;
    const points: [number, number][] = [[x, bottom]];
    x += aW; points.push([x, top]);
    x += dW; points.push([x, sustainY]);
    x += sustainW; points.push([x, sustainY]);
    x += rW; points.push([x, bottom]);

    return points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  });
</script>

<svg class="envelope" viewBox="0 0 260 60">
  <polyline {points} fill="none" stroke="#7ad" stroke-width="2" />
</svg>

<style>
  .envelope {
    width: 100%;
    height: 60px;
    background: #222;
    border: 1px solid #333;
    margin-top: 0.5rem;
  }
</style>
