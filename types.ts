
export enum Language {
  CN = 'zh-CN',
  EN = 'en-US',
  DE = 'de-DE'
}

export enum RobotMode {
  FLIGHT = 'flight',
  TRACK = 'track'
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export enum ControlCommand {
  FORWARD = 'FORWARD',
  BACKWARD = 'BACKWARD',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  STOP = 'STOP',
  UP = 'UP',
  DOWN = 'DOWN'
}

export interface AlgorithmConfig {
  maxSlope: number;      // degrees
  maxStepHeight: number; // meters
  maxRoughness: number;  // meters
}

export interface SensorData {
  timestamp: string;
  methane: number; // CH4 ppm (GNN Smoothed)
  methaneRaw: number; // CH4 ppm (Raw Sensor - Sawtooth noise)
  temperature: number; // Celsius
  humidity: number; // %
  windSpeed: number; // m/s
  battery: number; // %
  wifiSignal: number; // %
  obstacleDistance: number; // meters
  
  // Step 1: Localization & Mapping
  slamRmse: number; // Root Mean Square Error of registration
  featureDensity: number; // Point cloud feature density (rho)
  
  // Step 2: Gas Reconstruction
  hydraulicDiameter: number; // Dh (m) for adaptive bandwidth
  
  // Step 3: Traversability
  slope: number; // theta (degrees)
  stepHeight: number; // H (meters)
  roughness: number; // sigma (RMSE to plane)
  traversable: boolean; // Final decision
}

export interface Position {
  x: number;
  y: number;
  z: number; // Altitude
  heading: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  riskLevel: number; // 0-1 for heatmap
  timestamp?: string;
}

export type ViewState = 'control' | 'inspection' | 'settings';
