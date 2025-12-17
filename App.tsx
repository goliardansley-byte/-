
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ControlView from './views/ControlView';
import DataView from './views/DataView';
import SettingsView from './views/SettingsView';
import ConfigModal from './components/ConfigModal';
import { Language, RobotMode, ViewState, SensorData, Position, TrajectoryPoint, ConnectionStatus, ControlCommand, AlgorithmConfig } from './types';
import { generateSensorData, generatePosition, generateInitialTrajectory } from './services/mockDataService';
import { serialService } from './services/SerialService';
import { webSocketService } from './services/WebSocketService';

const App: React.FC = () => {
  // Application State
  const [language, setLanguage] = useState<Language>(Language.CN);
  const [currentView, setView] = useState<ViewState>('control');
  const [mode, setMode] = useState<RobotMode>(RobotMode.TRACK);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isWsConnected, setWsConnected] = useState(false);
  
  // Algorithm Configuration State (Step 3 Thresholds)
  const [algoConfig, setAlgoConfig] = useState<AlgorithmConfig>({
    maxSlope: 35,
    maxStepHeight: 0.32,
    maxRoughness: 0.05
  });
  const [isConfigModalOpen, setConfigModalOpen] = useState(false);

  // Data State
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0, heading: 0 });
  const [history, setHistory] = useState<TrajectoryPoint[]>(generateInitialTrajectory());

  // Handle incoming Serial Data
  const handleSerialData = (rawData: string) => {
    // Attempt to parse
    const parsed = serialService.parseData(rawData);
    if (parsed && parsed.methane !== undefined) {
      updateSensorState(parsed);
    }
  };

  // Helper to update sensor state from any source
  const updateSensorState = (newData: Partial<SensorData>) => {
      // Merge with default values if partial
      const completeData: SensorData = {
          timestamp: new Date().toLocaleTimeString(),
          methane: 0,
          methaneRaw: 0,
          temperature: 20,
          humidity: 50,
          windSpeed: 0,
          battery: 0,
          wifiSignal: 0,
          obstacleDistance: 0,
          slamRmse: 0,
          featureDensity: 0,
          hydraulicDiameter: 0,
          slope: 0,
          stepHeight: 0,
          roughness: 0,
          traversable: true,
          ...newData
      };
      
      setSensorData(prev => [...prev.slice(-49), completeData]);
  };

  // Setup WebSocket Listeners
  useEffect(() => {
    webSocketService.setOnStatusChange((connected) => {
      setWsConnected(connected);
    });

    webSocketService.setOnData((data) => {
      updateSensorState(data);
    });
  }, []);

  // Handle outgoing Robot Commands (from ControlView)
  const handleRobotCommand = (cmd: ControlCommand) => {
    console.log(`Command sent: ${cmd}`);
    // If WebSocket is connected, send it there
    if (isWsConnected) {
      webSocketService.send(JSON.stringify({ type: 'control', command: cmd }));
    }
    // If Serial is connected, send it there
    if (connectionStatus === ConnectionStatus.CONNECTED) {
      serialService.sendCommand(`CMD:CTRL:${cmd}`);
    }
    // If offline, just log or maybe simulate visual feedback
  };

  // Main Simulation / Data Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const isConnected = connectionStatus === ConnectionStatus.CONNECTED || isWsConnected;

    if (isConnected) {
      // If connected (WS or Serial), we rely on external data for sensors
      // We might still want a loop for position simulation if the robot doesn't send coordinates yet
      interval = setInterval(() => {
          // In a full implementation, we'd update position from sensorData if available
          // For now, we still simulate movement on map to keep UI alive
          const newPos = generatePosition(mode);
          setPosition(newPos);
          
          // Update history with the latest sensor data (or last known)
          const latestSensor = sensorData[sensorData.length - 1] || { methane: 0 };
          setHistory(prev => {
            const newPoint = { 
                x: newPos.x, 
                y: newPos.y, 
                riskLevel: latestSensor.methane, 
                timestamp: new Date().toLocaleTimeString()
            };
            return [...prev.slice(-99), newPoint];
          });
      }, 1000);

    } else {
      // If DISCONNECTED, run full simulation
      interval = setInterval(() => {
        // 1. Generate new Sensor Data with dynamic config for decision logic
        const newData = generateSensorData(mode, algoConfig);
        setSensorData(prev => [...prev.slice(-49), newData]); 

        // 2. Generate new Position
        const newPos = generatePosition(mode);
        setPosition(newPos);

        // 3. Update Trajectory
        setHistory(prev => {
          const newPoint = { 
              x: newPos.x, 
              y: newPos.y, 
              riskLevel: newData.methane,
              timestamp: newData.timestamp
          };
          return [...prev.slice(-99), newPoint]; 
        });

      }, 1000);
    }

    return () => clearInterval(interval);
  }, [mode, connectionStatus, isWsConnected, sensorData.length, algoConfig]); 

  const latestData = sensorData[sensorData.length - 1] || { battery: 100, wifiSignal: 100 };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Configuration Modal */}
      <ConfigModal 
        isOpen={isConfigModalOpen}
        onClose={() => setConfigModalOpen(false)}
        language={language}
        config={algoConfig}
        onSave={setAlgoConfig}
      />

      {/* Top Header */}
      <Header 
        language={language} 
        setLanguage={setLanguage}
        batteryLevel={latestData.battery}
        signalStrength={latestData.wifiSignal}
        connectionStatus={connectionStatus}
        onOpenConfig={() => setConfigModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
          currentView={currentView} 
          setView={setView} 
          language={language}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600 blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600 blur-[100px]"></div>
            </div>

            {/* View Routing */}
            {currentView === 'control' && (
              <ControlView 
                language={language}
                mode={mode}
                setMode={setMode}
                position={position}
                history={history}
                sensorData={latestData}
                onRobotCommand={handleRobotCommand}
                config={algoConfig}
              />
            )}

            {currentView === 'inspection' && (
              <DataView 
                language={language}
                dataHistory={sensorData}
              />
            )}
            
            {currentView === 'settings' && (
              <SettingsView 
                language={language}
                connectionStatus={connectionStatus}
                setConnectionStatus={setConnectionStatus}
                onRawData={handleSerialData}
                wsConnected={isWsConnected}
                setWsConnected={setWsConnected}
              />
            )}
        </main>
      </div>
    </div>
  );
};

export default App;
