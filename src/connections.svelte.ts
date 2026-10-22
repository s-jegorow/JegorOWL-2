import * as engine from './audio/engine';
import { isMidiSupported, connectMidi } from './midi';
import { isSerialSupported, connectSerial } from './serial';

interface Connection {
  supported: boolean;
  connected: boolean;
  error: string;
}

export const midi: Connection = $state({
  supported: isMidiSupported(),
  connected: false,
  error: '',
});

export const arduino: Connection = $state({
  supported: isSerialSupported(),
  connected: false,
  error: '',
});

export async function enableMidi(
  noteOn: (note: number, velocity: number) => void,
  noteOff: (note: number) => void,
  controlChange: (controller: number, value: number) => void,
): Promise<void> {
  if (midi.connected) return;
  engine.startAudio();

  try {
    await connectMidi({
      noteOn,
      noteOff,
      controlChange,
      devicesChanged: (names) => {
        midi.error = names.length > 0 ? '' : 'No MIDI device found';
      },
    });
    midi.connected = true;
  } catch {
    midi.error = 'MIDI access denied';
  }
}

export async function connectArduino(control: (name: string, value: number) => void): Promise<void> {
  if (arduino.connected) return;
  engine.startAudio();

  try {
    await connectSerial({
      control,
      disconnected: () => {
        arduino.connected = false;
        arduino.error = 'Arduino disconnected';
      },
    });
    arduino.connected = true;
    arduino.error = '';
  } catch {
    arduino.error = 'Could not connect Arduino';
  }
}
