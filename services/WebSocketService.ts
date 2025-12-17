import { SensorData } from '../types';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private onDataCallback: ((data: Partial<SensorData>) => void) | null = null;
  private onStatusChange: ((isConnected: boolean) => void) | null = null;
  private onLogCallback: ((msg: string) => void) | null = null;

  connect(url: string): void {
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('WS Connected');
        if (this.onStatusChange) this.onStatusChange(true);
        if (this.onLogCallback) this.onLogCallback(`WS: Connected to ${url}`);
      };

      this.socket.onclose = () => {
        console.log('WS Disconnected');
        if (this.onStatusChange) this.onStatusChange(false);
        if (this.onLogCallback) this.onLogCallback('WS: Disconnected');
        this.socket = null;
      };

      this.socket.onerror = (error) => {
        console.error('WS Error', error);
        if (this.onStatusChange) this.onStatusChange(false);
        if (this.onLogCallback) this.onLogCallback('WS: Error occurred');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Assuming the robot sends data in a format we can map to SensorData
          // Example expected JSON: { "temp": 25.5, "gas": 0.2, ... }
          const parsedData: Partial<SensorData> = {
            methane: data.gas || data.methane,
            temperature: data.temp || data.temperature,
            humidity: data.hum || data.humidity,
            battery: data.bat || data.battery,
            wifiSignal: data.rssi || data.wifi,
            obstacleDistance: data.dist || data.obstacleDistance,
            windSpeed: data.wind || data.windSpeed,
            timestamp: new Date().toLocaleTimeString()
          };
          
          if (this.onDataCallback) {
            this.onDataCallback(parsedData);
          }
          if (this.onLogCallback) {
            this.onLogCallback(`RX: ${JSON.stringify(data)}`);
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
          if (this.onLogCallback) this.onLogCallback(`RX (Raw): ${event.data}`);
        }
      };

    } catch (e) {
      console.error('WS Connection failed', e);
      if (this.onStatusChange) this.onStatusChange(false);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(message);
      if (this.onLogCallback) this.onLogCallback(`TX: ${message}`);
    }
  }

  // Setters for callbacks
  setOnData(cb: (data: Partial<SensorData>) => void) {
    this.onDataCallback = cb;
  }
  
  setOnStatusChange(cb: (isConnected: boolean) => void) {
    this.onStatusChange = cb;
  }

  setOnLog(cb: (msg: string) => void) {
    this.onLogCallback = cb;
  }
}

export const webSocketService = new WebSocketService();
