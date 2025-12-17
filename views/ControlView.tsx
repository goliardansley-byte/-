
import React, { useEffect, useState, useRef } from 'react';
import { Compass, Gauge, Plane, Target, Power, Zap, Battery, Cpu, X, ScanEye, Map as MapIcon } from 'lucide-react';
import { Language, RobotMode, Position, TrajectoryPoint, SensorData, ControlCommand, AlgorithmConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { serialService } from '../services/SerialService';
import RobotController from '../components/RobotController';
import PassabilityCard from '../components/PassabilityCard';

interface ControlViewProps {
  language: Language;
  mode: RobotMode;
  setMode: (mode: RobotMode) => void;
  position: Position;
  history: TrajectoryPoint[];
  sensorData: Partial<SensorData>;
  onRobotCommand: (cmd: ControlCommand) => void;
  config: AlgorithmConfig;
}

const ControlView: React.FC<ControlViewProps> = ({ 
    language, 
    mode, 
    setMode, 
    position, 
    history, 
    sensorData,
    onRobotCommand,
    config
}) => {
  const t = TRANSLATIONS[language];
  const [engineOn, setEngineOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tooltip State
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Handle Mode Change with Serial Command
  const handleSetMode = (newMode: RobotMode) => {
    setMode(newMode);
    // Send command to STM32
    serialService.sendCommand(`CMD:MODE:${newMode.toUpperCase()}`);
  };

  // Handle Engine Toggle
  const toggleEngine = () => {
    const newState = !engineOn;
    setEngineOn(newState);
    serialService.sendCommand(`CMD:ENGINE:${newState ? 'ON' : 'OFF'}`);
  };

  // Handle Canvas Click for Robot Interactivity
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Calculate scale factors in case canvas is resized by CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Robot coordinates matches draw logic
    const rX = position.x * 3 + 150;
    const rY = position.y * 3 + 150;

    // Distance check (hit radius approx 25px)
    const dist = Math.sqrt(Math.pow(clickX - rX, 2) + Math.pow(clickY - rY, 2));

    if (dist < 25) {
      setTooltipVisible(true);
      // Position tooltip relative to the click, but in CSS pixels (relative to the container)
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setTooltipVisible(false);
    }
  };

  // Draw the simulated LIO-SLAM map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw Trajectory (History)
    if (history.length > 1) {
      // Path line with glow
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#22d3ee'; // cyan-400 for high visibility
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(34, 211, 238, 0.6)'; // Cyan glow
      ctx.shadowBlur = 12;
      
      history.forEach((point, index) => {
        const x = point.x * 3 + 150; // Scale and offset for visualization
        const y = point.y * 3 + 150;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Gas Heatmap overlay (Algorithm visualization)
      history.forEach((point) => {
        const x = point.x * 3 + 150;
        const y = point.y * 3 + 150;
        
        ctx.beginPath();
        // Color depends on risk level (Gas concentration)
        const alpha = Math.max(0.1, point.riskLevel * 0.6);
        ctx.fillStyle = point.riskLevel > 0.6 
            ? `rgba(239, 68, 68, ${alpha})` // Red for high risk
            : `rgba(34, 197, 94, ${alpha})`; // Green for safe
        
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw Robot
    const rX = position.x * 3 + 150;
    const rY = position.y * 3 + 150;

    // Draw Obstacle Detection (Flight Mode)
    if (mode === RobotMode.FLIGHT && sensorData.obstacleDistance !== undefined && sensorData.obstacleDistance < 10) {
        const dist = sensorData.obstacleDistance;
        // Convert heading to radians
        const headingRad = (position.heading * Math.PI) / 180;
        
        // Calculate obstacle position relative to robot (in front)
        // Scale factor matches robot position scaling (x3)
        const obsX = rX + (dist * 10) * Math.cos(headingRad); // Multiplied by 10 pixels per meter for visual scale
        const obsY = rY + (dist * 10) * Math.sin(headingRad);

        ctx.save();
        
        // Draw Laser/Lidar Ray
        ctx.beginPath();
        ctx.moveTo(rX, rY);
        ctx.lineTo(obsX, obsY);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Red transparent
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Translate to obstacle position to draw marker
        ctx.translate(obsX, obsY);
        ctx.rotate(headingRad);
        
        // Draw Obstacle Warning Marker (Arc)
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = 3;
        ctx.arc(0, 0, 8, -Math.PI / 3, Math.PI / 3); 
        ctx.stroke();
        
        // Draw "Blockage" Cross
        ctx.beginPath();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.moveTo(5, -5); 
        ctx.lineTo(12, 0);
        ctx.lineTo(5, 5);
        ctx.stroke();

        // Distance Label
        ctx.rotate(-headingRad); // Reset rotation for text legibility
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px monospace';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(`${dist.toFixed(1)}m`, 12, 0);
        
        // Blink effect if very close
        if (dist < 3) {
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(239, 68, 68, ${Math.sin(Date.now() / 200) * 0.5 + 0.5})`;
            ctx.stroke();
        }

        ctx.restore();
    }
    
    // Draw Robot Body
    ctx.save();
    ctx.translate(rX, rY);
    ctx.rotate((position.heading * Math.PI) / 180);
    
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowBlur = 15;
    ctx.shadowColor = mode === RobotMode.FLIGHT ? '#3b82f6' : '#f59e0b'; // Blue glow for flight, Amber for track
    
    // Draw shape based on mode
    ctx.beginPath();
    if (mode === RobotMode.FLIGHT) {
      // Quadcopter shape
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.rect(-12, -2, 24, 4);
      ctx.rect(-2, -12, 4, 24);
      
      // Propellers (animated simple rotation visualization)
      const time = Date.now() / 50;
      ctx.fillStyle = '#64748b';
      [[-12, 0], [12, 0], [0, -12], [0, 12]].forEach(([px, py]) => {
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
      });

    } else {
      // Tank/Track shape
      ctx.rect(-10, -8, 20, 16);
      // Tracks
      ctx.fillStyle = '#475569';
      ctx.fillRect(-12, -10, 24, 4);
      ctx.fillRect(-12, 6, 24, 4);
    }
    ctx.fillStyle = '#e2e8f0'; // Restore body color for fill
    ctx.fill();
    
    // Direction indicator
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(14, 0);
    ctx.strokeStyle = mode === RobotMode.FLIGHT ? '#ef4444' : '#10b981'; // Red front for flight
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Draw Timestamp on Map
    const lastPoint = history[history.length - 1];
    if (lastPoint && lastPoint.timestamp) {
        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`SLAM UPDATE: ${lastPoint.timestamp}`, canvas.width - 20, 30);
    }
    
    // Draw Mode Indicator on Canvas
    ctx.fillStyle = mode === RobotMode.FLIGHT ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)';
    ctx.font = '700 48px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(mode === RobotMode.FLIGHT ? 'FLIGHT' : 'TRACK', 20, canvas.height - 20);

  }, [position, history, mode, sensorData]); 

  return (
    <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
      
      {/* Left Column: Controls & Mode */}
      <div className="flex flex-col gap-6">
        
        {/* Mode Switcher */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">{t.switchMode}</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSetMode(RobotMode.FLIGHT)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                mode === RobotMode.FLIGHT 
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700'
              }`}
            >
              <Plane className="mb-2" size={32} />
              <span className="font-bold">{t.modeFlight}</span>
            </button>
            <button
              onClick={() => handleSetMode(RobotMode.TRACK)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                mode === RobotMode.TRACK 
                  ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                  : 'bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700'
              }`}
            >
              <Zap className="mb-2" size={32} />
              <span className="font-bold">{t.modeTrack}</span>
            </button>
          </div>
        </div>

        {/* Engine Control - REPLACED WITH RobotController */}
        <RobotController 
            language={language}
            onCommand={onRobotCommand}
            disabled={!engineOn}
            mode={mode}
        />
        
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 text-center">
             <button
                onClick={toggleEngine}
                className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                engineOn 
                    ? 'bg-red-500/20 text-red-400 border border-red-500 hover:bg-red-500/30' 
                    : 'bg-green-500/20 text-green-400 border border-green-500 hover:bg-green-500/30'
                }`}
            >
                <Power size={20} />
                {engineOn ? t.stopEngine : t.startEngine}
            </button>
        </div>

        {/* Status Metrics */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <span className="text-slate-400 flex items-center gap-2">
              <Compass size={18} /> Heading
            </span>
            <span className="text-xl font-mono text-white">{Math.round(position.heading)}°</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <span className="text-slate-400 flex items-center gap-2">
              <Target size={18} /> {t.altitude}
            </span>
            <span className="text-xl font-mono text-white">{position.z.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <span className="text-slate-400 flex items-center gap-2">
              <Gauge size={18} /> {t.speed}
            </span>
            <span className="text-xl font-mono text-white">
              {engineOn ? (mode === RobotMode.FLIGHT ? '3.5' : '1.2') : '0.0'} m/s
            </span>
          </div>
          {/* Obstacle Distance Metric */}
          <div className="flex justify-between items-center">
            <span className={`flex items-center gap-2 ${sensorData.obstacleDistance && sensorData.obstacleDistance < 3 ? 'text-red-400 animate-pulse font-bold' : 'text-slate-400'}`}>
              <ScanEye size={18} /> {t.obstacle}
            </span>
            <span className={`text-xl font-mono ${sensorData.obstacleDistance && sensorData.obstacleDistance < 3 ? 'text-red-400' : 'text-white'}`}>
              {sensorData.obstacleDistance?.toFixed(1) || '--'} m
            </span>
          </div>
        </div>

      </div>

      {/* Center & Right: Map & Camera */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Real-time Map (LIO-SLAM Visualization) */}
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 relative overflow-hidden group">
          <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-blue-400 border border-blue-500/30 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            {t.slamMap}
          </div>
          
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={400} 
            className="w-full h-full object-cover opacity-90 cursor-crosshair active:cursor-grabbing"
            onClick={handleCanvasClick}
          />
          
          {/* Interactive Tooltip Pop-up */}
          {tooltipVisible && (
            <div 
              className="absolute z-20 bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-xl p-3 shadow-2xl min-w-[200px] animate-in fade-in zoom-in duration-200"
              style={{ top: tooltipPos.y - 120, left: tooltipPos.x - 100 }}
            >
               <div className="flex justify-between items-start mb-2 border-b border-slate-700 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                     <Cpu size={14} className="text-blue-400"/> Robot Status
                  </h4>
                  <button onClick={(e) => { e.stopPropagation(); setTooltipVisible(false); }} className="text-slate-400 hover:text-white">
                     <X size={14} />
                  </button>
               </div>
               <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                     <span className="text-slate-400 flex items-center gap-1"><Battery size={12}/> Battery</span>
                     <span className={`font-mono font-bold ${sensorData.battery && sensorData.battery < 20 ? 'text-red-400' : 'text-green-400'}`}>
                        {Math.round(sensorData.battery || 0)}%
                     </span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-400">Mode</span>
                     <span className="font-mono text-blue-300 uppercase">{mode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-400">Speed</span>
                     <span className="font-mono text-white">
                        {engineOn ? (mode === RobotMode.FLIGHT ? '3.5' : '1.2') : '0.0'} m/s
                     </span>
                  </div>
                   <div className="flex justify-between items-center">
                     <span className="text-slate-400">Obs. Dist</span>
                     <span className={`font-mono ${sensorData.obstacleDistance && sensorData.obstacleDistance < 3 ? 'text-red-400 font-bold' : 'text-white'}`}>
                        {sensorData.obstacleDistance?.toFixed(1)} m
                     </span>
                  </div>
                  {/* Hydraulic Diameter (Algo Prop) */}
                   <div className="flex justify-between items-center">
                     <span className="text-slate-400">{t.hydDiam}</span>
                     <span className="font-mono text-cyan-300">
                        {sensorData.hydraulicDiameter} m
                     </span>
                  </div>
               </div>
               {/* Arrow */}
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-r border-b border-slate-600 transform rotate-45"></div>
            </div>
          )}

          {/* Enhanced Persistent Map Legend */}
          <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur p-3 rounded-xl border border-slate-700 text-[10px] md:text-xs pointer-events-none shadow-xl min-w-[150px]">
             <h4 className="text-slate-400 font-bold mb-2 uppercase tracking-wider border-b border-slate-700 pb-1 flex items-center gap-2">
               <MapIcon size={10} /> Map Legend
             </h4>
             
             {/* Gas Risk */}
             <div className="flex items-center gap-2 mb-1.5">
               <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
               <span className="text-slate-200">High Gas Risk</span>
             </div>
             <div className="flex items-center gap-2 mb-1.5">
               <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
               <span className="text-slate-200">Safe Zone</span>
             </div>

             {/* Trajectory */}
             <div className="flex items-center gap-2 mb-1.5">
               <div className="w-4 h-0.5 bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]"></div>
               <span className="text-slate-200">Trajectory Path</span>
             </div>

             {/* Robot Mode */}
             <div className="flex items-center gap-2 mb-1.5">
               <div className={`w-3 h-3 rounded-sm border ${mode === RobotMode.FLIGHT ? 'border-blue-500 bg-blue-500/30' : 'border-amber-500 bg-amber-500/30'}`}></div>
               <span className="text-slate-200">Robot ({mode === RobotMode.FLIGHT ? 'Flight' : 'Track'})</span>
             </div>

             {/* Obstacle Indicator */}
             <div className={`flex items-center gap-2 transition-opacity ${mode === RobotMode.FLIGHT ? 'opacity-100' : 'opacity-40'}`}>
               <div className="flex items-center justify-center w-3 h-3">
                 {mode === RobotMode.FLIGHT ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                 ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                 )}
               </div>
               <span className={mode === RobotMode.FLIGHT ? "text-red-300" : "text-slate-500"}>
                 {mode === RobotMode.FLIGHT ? 'Obstacle Detected' : 'Obstacle (Off)'}
               </span>
             </div>
          </div>
        </div>

        {/* Camera Feed / Semantic Analysis - UPDATED with PassabilityCard */}
        <div className="h-64 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black rounded-2xl border border-slate-700 relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</div>
            <div className="text-slate-500 text-sm flex flex-col items-center">
               <div className="w-16 h-16 border-2 border-slate-700 rounded-full flex items-center justify-center mb-2">
                 <div className="w-12 h-12 bg-slate-800 rounded-full"></div>
               </div>
               {t.cameraFeed}
               <span className="text-xs text-slate-600 mt-1">Thermal / RGB Fusion</span>
            </div>
            {/* Simulated Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <line x1="50" y1="40" x2="50" y2="60" stroke="white" strokeWidth="1"/>
                    <line x1="40" y1="50" x2="60" y2="50" stroke="white" strokeWidth="1"/>
                    <rect x="30" y="30" width="40" height="40" stroke="white" strokeWidth="1" fill="none"/>
                </svg>
            </div>
          </div>

          {/* Replaced old inline analysis with component */}
          <PassabilityCard 
             language={language}
             sensorData={sensorData}
             config={config}
          />
        </div>

      </div>
    </div>
  );
};

export default ControlView;
