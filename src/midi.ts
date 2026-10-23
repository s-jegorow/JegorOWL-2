const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;
const CONTROL_CHANGE = 0xb0;

export interface MidiCallbacks {
  noteOn: (note: number, velocity: number) => void;
  noteOff: (note: number) => void;
  controlChange: (controller: number, value: number) => void;
  devicesChanged: (names: string[]) => void;
}

export function isMidiSupported(): boolean {
  return 'requestMIDIAccess' in navigator;
}

export async function connectMidi(callbacks: MidiCallbacks): Promise<void> {
  const access = await navigator.requestMIDIAccess();

  function handleMessage(event: MIDIMessageEvent) {
    const data = event.data;
    if (!data || data.length < 3) return;

    const type = data[0] & 0xf0;

    if (type === CONTROL_CHANGE) {
      callbacks.controlChange(data[1], data[2]);
      return;
    }

    const note = data[1];
    const velocity = data[2];

    if (type === NOTE_ON && velocity > 0) {
      callbacks.noteOn(note, velocity / 127);
    } else if (type === NOTE_OFF || type === NOTE_ON) {
      callbacks.noteOff(note);
    }
  }

  function listenToInputs() {
    const names: string[] = [];
    for (const input of access.inputs.values()) {
      if (input.state !== 'connected') continue;
      input.onmidimessage = handleMessage;
      names.push(input.name ?? 'Unknown device');
    }
    callbacks.devicesChanged(names);
  }

  access.onstatechange = listenToInputs;
  listenToInputs();
}
