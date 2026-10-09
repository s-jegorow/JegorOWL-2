const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;

export interface MidiCallbacks {
  noteOn: (note: number, velocity: number) => void;
  noteOff: (note: number) => void;
  devicesChanged: (names: string[]) => void;
}

export function isMidiSupported(): boolean {
  return 'requestMIDIAccess' in navigator;
}

export async function connectMidi(callbacks: MidiCallbacks): Promise<void> {
  const access = await navigator.requestMIDIAccess();

  function handleMessage(event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 3) return;

    const type = data[0] & 0xf0;
    const note = data[1];
    const velocity = data[2];

    if (type === NOTE_ON && velocity > 0) {
      callbacks.noteOn(note, velocity / 127);
    } else if (type === NOTE_OFF || type === NOTE_ON) {
      callbacks.noteOff(note);
    }
  }

  function listenToInputs(): void {
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
