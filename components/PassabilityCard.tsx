
import React from 'react';
import { Layers, Ruler } from 'lucide-react';
import { AlgorithmConfig, Language, SensorData } from '../types';
import { TRANSLATIONS } from '../constants';

interface PassabilityCardProps {
  language: Language;
  sensorData: Partial<SensorData>;
  config: AlgorithmConfig;
}

const PassabilityCard: React.FC<PassabilityCardProps> = ({ language, sensorData, config }) => {
  const t = TRANSLATIONS[language];

  // Helpers for Geometric Semantic Analysis visualization
  const getStabilityColor = (val: number, limit: number) => val < limit ? 'bg-green-500' : 'bg-red-500';
  // Calculate percentage width based on limit + padding (to show overflow)
  const getStabilityWidth = (val: number, limit: number, maxRange: number) => Math.min(100, (val / maxRange) * 100);

  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Layers size={14} className="text-blue-400"/> {t.semanticAnalysis}
        </h3>
        <div className={`text-xs px-2 py-1 rounded border ${sensorData.traversable ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
          {sensorData.traversable ? t.passable : t.unreachable}
        </div>
      </div>
      
      <div className="space-y-3 mt-4">
        {/* Slope Analysis */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t.slope} (Max {config.maxSlope}°)</span>
            <span className={sensorData.slope && sensorData.slope > config.maxSlope ? 'text-red-400 font-bold' : 'text-slate-300'}>
              {sensorData.slope?.toFixed(1)}°
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
             {/* Limit Marker */}
             <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10" 
                style={{ left: `${(config.maxSlope / 60) * 100}%` }} // Assuming max scale 60 deg
             ></div>
            <div 
                className={`h-full ${getStabilityColor(sensorData.slope || 0, config.maxSlope)}`} 
                style={{width: `${getStabilityWidth(sensorData.slope || 0, config.maxSlope, 60)}%`}}
            ></div>
          </div>
        </div>
        
        {/* Step Height Analysis */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t.stepH} (Max {config.maxStepHeight.toFixed(2)}m)</span>
            <span className={sensorData.stepHeight && sensorData.stepHeight > config.maxStepHeight ? 'text-red-400 font-bold' : 'text-slate-300'}>
              {sensorData.stepHeight?.toFixed(2)}m
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
             {/* Limit Marker */}
             <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10" 
                style={{ left: `${(config.maxStepHeight / 0.8) * 100}%` }} 
             ></div>
            <div 
                className={`h-full ${getStabilityColor(sensorData.stepHeight || 0, config.maxStepHeight)}`} 
                style={{width: `${getStabilityWidth(sensorData.stepHeight || 0, config.maxStepHeight, 0.8)}%`}}
            ></div>
          </div>
        </div>

        {/* Roughness Analysis */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t.roughness} (Max {config.maxRoughness}m)</span>
            <span className={sensorData.roughness && sensorData.roughness > config.maxRoughness ? 'text-red-400 font-bold' : 'text-slate-300'}>
              {sensorData.roughness?.toFixed(3)}m
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
             {/* Limit Marker */}
             <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10" 
                style={{ left: `${(config.maxRoughness / 0.2) * 100}%` }} 
             ></div>
            <div 
                className={`h-full ${getStabilityColor(sensorData.roughness || 0, config.maxRoughness)}`} 
                style={{width: `${getStabilityWidth(sensorData.roughness || 0, config.maxRoughness, 0.2)}%`}}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-700/50 pt-2 mt-4">
        <Ruler size={12} />
        <span>Geom-Semantic Fusion (RandLA-Net + PCA)</span>
      </div>
    </div>
  );
};

export default PassabilityCard;
