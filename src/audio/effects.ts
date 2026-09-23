import { smooth, equalPower } from './params';

const MAX_DELAY_TIME = 2;
const MAX_FEEDBACK = 0.9;
const DELAY_TIME_SMOOTHING = 0.05;

export interface DelaySettings {
  time: number;
  feedback: number;
  mix: number;
}

export class Delay {
  readonly input: GainNode;
  readonly output: GainNode;

  private readonly dry: GainNode;
  private readonly wet: GainNode;
  private readonly delayNode: DelayNode;
  private readonly feedbackGain: GainNode;

  constructor(ctx: AudioContext, settings: DelaySettings) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.delayNode = ctx.createDelay(MAX_DELAY_TIME);
    this.feedbackGain = ctx.createGain();

    this.input.connect(this.dry);
    this.dry.connect(this.output);

    this.input.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.wet);
    this.wet.connect(this.output);

    this.delayNode.delayTime.value = settings.time;
    this.feedbackGain.gain.value = Math.min(settings.feedback, MAX_FEEDBACK);

    const { dry, wet } = equalPower(settings.mix);
    this.dry.gain.value = dry;
    this.wet.gain.value = wet;
  }

  setTime(value: number): void {
    smooth(this.delayNode.delayTime, value, DELAY_TIME_SMOOTHING);
  }

  setFeedback(value: number): void {
    smooth(this.feedbackGain.gain, Math.min(value, MAX_FEEDBACK));
  }

  setMix(value: number): void {
    const { dry, wet } = equalPower(value);
    smooth(this.dry.gain, dry);
    smooth(this.wet.gain, wet);
  }
}

const MAX_PRE_DELAY = 0.2;
const REBUILD_WAIT_MS = 150;
const SWITCH_FADE = 0.03;

export interface ReverbSettings {
  size: number;
  preDelay: number;
  mix: number;
}

interface RoomSlot {
  feed: GainNode;
  convolver: ConvolverNode;
}

function createImpulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * seconds));
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    let energy = 0;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.pow(10, (-3 * t) / seconds);
      data[i] = (Math.random() * 2 - 1) * envelope;
      energy += data[i] * data[i];
    }

    const scale = 1 / Math.sqrt(energy);
    for (let i = 0; i < length; i++) data[i] *= scale;
  }

  return impulse;
}

export class Reverb {
  readonly input: GainNode;
  readonly output: GainNode;

  private readonly ctx: AudioContext;
  private readonly dry: GainNode;
  private readonly wet: GainNode;
  private readonly preDelayNode: DelayNode;
  private room: RoomSlot;
  private size: number;
  private rebuildTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(ctx: AudioContext, settings: ReverbSettings) {
    this.ctx = ctx;
    this.size = settings.size;

    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.preDelayNode = ctx.createDelay(MAX_PRE_DELAY);

    this.input.connect(this.dry);
    this.dry.connect(this.output);

    this.input.connect(this.preDelayNode);
    this.wet.connect(this.output);

    this.room = this.createRoom(1);

    this.preDelayNode.delayTime.value = Math.min(settings.preDelay, MAX_PRE_DELAY);

    const { dry, wet } = equalPower(settings.mix);
    this.dry.gain.value = dry;
    this.wet.gain.value = wet;
  }

  setSize(value: number): void {
    this.size = value;

    if (this.rebuildTimer !== null) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => {
      this.rebuildTimer = null;
      this.switchRoom();
    }, REBUILD_WAIT_MS);
  }

  setPreDelay(value: number): void {
    smooth(this.preDelayNode.delayTime, Math.min(value, MAX_PRE_DELAY));
  }

  setMix(value: number): void {
    const { dry, wet } = equalPower(value);
    smooth(this.dry.gain, dry);
    smooth(this.wet.gain, wet);
  }

  private createRoom(startGain: number): RoomSlot {
    const feed = this.ctx.createGain();
    feed.gain.value = startGain;

    const convolver = this.ctx.createConvolver();
    convolver.normalize = false;
    convolver.buffer = createImpulse(this.ctx, this.size);

    this.preDelayNode.connect(feed);
    feed.connect(convolver);
    convolver.connect(this.wet);

    return { feed, convolver };
  }

  private switchRoom(): void {
    const now = this.ctx.currentTime;
    const oldRoom = this.room;
    const oldTail = oldRoom.convolver.buffer?.duration ?? 0;
    const newRoom = this.createRoom(0);

    oldRoom.feed.gain.cancelScheduledValues(now);
    oldRoom.feed.gain.setValueAtTime(1, now);
    oldRoom.feed.gain.linearRampToValueAtTime(0, now + SWITCH_FADE);

    newRoom.feed.gain.setValueAtTime(0, now);
    newRoom.feed.gain.linearRampToValueAtTime(1, now + SWITCH_FADE);

    this.room = newRoom;

    setTimeout(() => {
      oldRoom.feed.disconnect();
      oldRoom.convolver.disconnect();
    }, (SWITCH_FADE + oldTail) * 1000 + 100);
  }
}
