
import { SensorData, Position, TrajectoryPoint, RobotMode, AlgorithmConfig } from '../types';

let currentTime = 0;
const startX = 50;
const startY = 50;
const radius = 30;

// Default Algorithm Constants (Fallbacks)
const DEFAULT_THETA_LIM = 35; // Max slope degrees
const DEFAULT_H_LIM = 0.32; // 0.4 * 0.8m
const DEFAULT_SIGMA_SAFE = 0.05; // Roughness threshold (m)

export const generateSensorData = (mode: RobotMode, config?: AlgorithmConfig): SensorData => {
  const now = new Date();
  currentTime += 1;
  
  // Use config values if provided, else defaults
  const limitSlope = config?.maxSlope ?? DEFAULT_THETA_LIM;
  const limitStep = config?.maxStepHeight ?? DEFAULT_H_LIM;
  const limitRough = config?.maxRoughness ?? DEFAULT_SIGMA_SAFE;

  // Step 2 Simulation: Gas Reconstruction
  // Base signal is a smooth sine wave (GNN prediction)
  const baseSignal = 0.4 + Math.sin(currentTime * 0.1) * 0.3;
  // Raw signal has "Sawtooth Oscillation" (PDF Fig 3)
  const noise = (Math.random() - 0.5) * 0.4;
  const methaneRaw = Math.max(0, baseSignal + noise);
  const methaneGNN = Math.max(0, baseSignal); // Gating mechanism filters noise

  // Step 1 Simulation: Localization
  // Feature density varies. RMSE is inversely proportional to density.
  const featureDensity = 50 + Math.sin(currentTime * 0.2) * 30 + Math.random() * 10; // 20 - 90
  // If density is low, RMSE spikes (PDF Step 1.2.3 logic)
  const slamRmse = Math.max(0.02, (100 / (featureDensity + 10)) * 0.05 + Math.random() * 0.01);

  // Step 3 Simulation: Geometric Analysis
  // Generate random terrain features
  const slope = Math.abs(Math.sin(currentTime * 0.3)) * 40; // 0 - 40 degrees
  const stepHeight = Math.abs(Math.cos(currentTime * 0.4)) * 0.4; // 0 - 0.4m
  const roughness = Math.random() * 0.08; // 0 - 0.08m
  
  // Decision Logic (PDF Step 3.3) using dynamic thresholds
  const isPassable = (slope < limitSlope) && (stepHeight < limitStep) && (roughness < limitRough);
  
  // Adaptive Bandwidth parameter (Step 2.3)
  const hydraulicDiameter = 3 + Math.sin(currentTime * 0.05);

  const tempSpike = Math.random() > 0.95 ? 12 : 0;
  
  return {
    timestamp: now.toLocaleTimeString(),
    methane: parseFloat(methaneGNN.toFixed(3)),
    methaneRaw: parseFloat(methaneRaw.toFixed(3)),
    temperature: 24 + Math.random() * 2 + tempSpike,
    humidity: 85 + Math.random() * 5,
    windSpeed: mode === RobotMode.FLIGHT ? 3.5 + Math.random() : 0.5 + Math.random(),
    battery: Math.max(0, 100 - (currentTime * 0.05)),
    wifiSignal: 80 + Math.random() * 20,
    obstacleDistance: 2.5 + Math.random() * 5,
    
    // Algorithm Props
    slamRmse: parseFloat(slamRmse.toFixed(3)),
    featureDensity: Math.round(featureDensity),
    hydraulicDiameter: parseFloat(hydraulicDiameter.toFixed(2)),
    
    slope: parseFloat(slope.toFixed(1)),
    stepHeight: parseFloat(stepHeight.toFixed(2)),
    roughness: parseFloat(roughness.toFixed(3)),
    traversable: isPassable
  };
};

export const generatePosition = (mode: RobotMode): Position => {
  // Circular trajectory simulation
  const angle = currentTime * 0.05;
  const x = startX + radius * Math.cos(angle);
  const y = startY + radius * Math.sin(angle);
  
  return {
    x,
    y,
    z: mode === RobotMode.FLIGHT ? 1.5 : 0.2, // Altitude changes by mode
    heading: (angle * 180) / Math.PI + 90,
  };
};

// Generates historical points for the map
export const generateInitialTrajectory = (): TrajectoryPoint[] => {
  const points: TrajectoryPoint[] = [];
  for (let i = 0; i < 100; i++) {
    const angle = i * 0.1;
    const x = startX + radius * Math.cos(angle);
    const y = startY + radius * Math.sin(angle);
    // Simulate high gas risk area in top right (quadrant 1)
    const risk = (x > startX && y < startY) ? 0.8 : 0.1;
    points.push({ x, y, riskLevel: risk + Math.random() * 0.2 });
  }
  return points;
};
