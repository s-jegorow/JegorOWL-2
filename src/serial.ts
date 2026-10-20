const BAUD_RATE = 115200;

export interface SerialCallbacks {
  control: (name: string, value: number) => void;
  disconnected: () => void;
}

export function isSerialSupported(): boolean {
  return 'serial' in navigator;
}

export async function connectSerial(callbacks: SerialCallbacks): Promise<void> {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: BAUD_RATE });

  void readLines(port, callbacks);
}

async function readLines(port: SerialPort, callbacks: SerialCallbacks): Promise<void> {
  if (!port.readable) return;

  const reader = port.readable.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) handleLine(line, callbacks);
    }
  } catch {
  } finally {
    reader.releaseLock();
    await port.close();
    callbacks.disconnected();
  }
}

function handleLine(line: string, callbacks: SerialCallbacks): void {
  const [name, text] = line.trim().split(':');
  if (!name || !text) return;

  const value = Number(text);
  if (Number.isNaN(value)) return;

  callbacks.control(name, value);
}