<script lang="ts">
  interface Props {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    display?: string;
  }

  let { label, value = $bindable(), min, max, step, display }: Props = $props();

  const START_ANGLE = -135;
  const END_ANGLE = 135;
  const RADIUS = 40;
  const DRAG_PIXELS = 150;
  const KEY_STEPS = 100;

  let dragging = false;
  let dragStartY = 0;
  let dragStartValue = 0;

  let angle = $derived(START_ANGLE + ((value - min) / (max - min)) * (END_ANGLE - START_ANGLE));
  let tip = $derived(pointAt(angle, 26));

  function pointAt(degrees: number, radius: number): { x: number; y: number } {
    const radians = (degrees * Math.PI) / 180;
    return {
      x: 50 + radius * Math.sin(radians),
      y: 50 - radius * Math.cos(radians),
    };
  }

  function arc(from: number, to: number): string {
    const start = pointAt(from, RADIUS);
    const end = pointAt(to, RADIUS);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  function setValue(raw: number): void {
    const snapped = min + Math.round((raw - min) / step) * step;
    value = Math.min(max, Math.max(min, snapped));
  }

  function handlePointerDown(event: PointerEvent): void {
    const dial = event.currentTarget as HTMLElement;
    dial.setPointerCapture(event.pointerId);
    dragging = true;
    dragStartY = event.clientY;
    dragStartValue = value;
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!dragging) return;
    const distance = dragStartY - event.clientY;
    setValue(dragStartValue + (distance / DRAG_PIXELS) * (max - min));
  }

  function handlePointerUp(): void {
    dragging = false;
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const keyStep = Math.max(step, (max - min) / KEY_STEPS);

    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') setValue(value + keyStep);
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') setValue(value - keyStep);
    else return;

    event.preventDefault();
  }
</script>

<div class="knob">
  <span class="label">{label}</span>
  <div
    class="dial"
    role="slider"
    tabindex="0"
    aria-label={label}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext={display}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    onkeydown={handleKeyDown}
  >
    <svg viewBox="0 0 100 100">
      <path class="track" d={arc(START_ANGLE, END_ANGLE)} />
      <path class="level" d={arc(START_ANGLE, angle)} />
      <circle class="body" cx="50" cy="50" r="30" />
      <line class="pointer" x1="50" y1="50" x2={tip.x} y2={tip.y} />
    </svg>
  </div>
  <span class="value">{display ?? value}</span>
</div>

<style>
  .knob {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 3.75rem;
  }
  .label,
  .value {
    font-size: 0.65rem;
    white-space: nowrap;
  }
  .label {
    text-transform: uppercase;
  }
  .value {
    color: var(--color-muted);
  }
  .dial {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    cursor: ns-resize;
    touch-action: none;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  path,
  line {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
  }
  .track {
    stroke: var(--color-line);
  }
  .level {
    stroke: var(--color-accent);
    filter: drop-shadow(0 0 3px var(--color-accent));
  }
  .body {
    fill: var(--color-surface);
    stroke: var(--color-line);
    stroke-width: 2;
  }
  .pointer {
    stroke: var(--color-accent);
    stroke-width: 4;
  }
</style>
