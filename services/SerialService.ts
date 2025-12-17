import { SensorData, Position } from '../types';

export class SerialService {
  private port: any | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private isConnected: boolean = false;
  private onDataCallback: ((data: string) => void) | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  // Check if browser supports Web Serial
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      console.error('Web Serial API not supported');
      return false;
    }

    try {
      // Request a port from the user
      this.port = await (navigator as any).serial.requestPort();
      
      // Open the port
      await this.port.open({ baudRate });
      
      this.isConnected = true;
      
      // Setup Writer
      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      // Setup Reader (Loop)
      this.readLoop();
      
      return true;
    } catch (error) {
      console.error('Failed to connect to Serial Port:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    this.isConnected = false;
  }

  async sendCommand(command: string) {
    if (!this.isConnected || !this.writer) return;
    try {
      // Append newline as typical terminator for STM32
      await this.writer.write(command + '\n');
      console.log('Sent:', command);
    } catch (e) {
      console.error('Error sending command:', e);
    }
  }

  setOnData(callback: (data: string) => void) {
    this.onDataCallback = callback;
  }

  private async readLoop() {
    if (!this.port) return;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) {
          // Reader has been canceled
          break;
        }
        if (value && this.onDataCallback) {
          this.onDataCallback(value);
        }
      }
    } catch (error) {
      console.error('Read loop error:', error);
    } finally {
      this.reader.releaseLock();
    }
  }

  // Helper to parse JSON strings from STM32 if they come in that format
  // Expected format: {"m": 0.5, "t": 24, "h": 80, ...}
  parseData(rawData: string): Partial<SensorData> | null {
    try {
      // Simple heuristic to find JSON object in stream
      const jsonMatch = rawData.match(/\{.*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Map short keys to full SensorData keys if necessary
        return {
          methane: parsed.methane || parsed.m || 0,
          temperature: parsed.temperature || parsed.t || 0,
          humidity: parsed.humidity || parsed.h || 0,
          battery: parsed.battery || parsed.b || 0,
          wifiSignal: parsed.rssi || parsed.s || 0,
          timestamp: new Date().toLocaleTimeString()
        };
      }
    } catch (e) {
      // console.debug('Incomplete JSON or parse error');
    }
    return null;
  }
}

export const serialService = new SerialService();
