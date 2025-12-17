import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Legend,
  Scatter
} from 'recharts';
import { Language, SensorData } from '../types';
import { TRANSLATIONS } from '../constants';
import { CloudRain, Thermometer, Wind, AlertOctagon, Info, CheckCircle, AlertTriangle, XCircle, Flame, Activity } from 'lucide-react';

interface DataViewProps {
  language: Language;
  dataHistory: SensorData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-slate-300 mb-2">{label}</p>
        {payload.map((p: any, index: number) => (
          <p key={index} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DataView: React.FC<DataViewProps> = ({ language, dataHistory }) => {
  const t = TRANSLATIONS[language];
  const latest: Partial<SensorData> = dataHistory[dataHistory.length - 1] || {};
  
  // Thresholds
  const TEMP_THRESHOLD = 35.0;
  const GAS_THRESHOLD = 0.7;

  const logs = useMemo(() => {
    const entries: { time: string; msg: string; type: 'info' | 'warning' | 'error' | 'success' }[] = [
      { time: 'System', msg: t.ready, type: 'success' },
      { time: 'System', msg: `${t.gasReconstruction} active`, type: 'info' },
      { time: 'System', msg: t.calibrating, type: 'info' },
      { time: 'System', msg: t.initializing, type: 'info' },
    ];

    const recentHistory = [...dataHistory].reverse().slice(0, 20);
    
    recentHistory.forEach((d, index) => {
      if (d.methane > GAS_THRESHOLD) {
        entries.unshift({
          time: d.timestamp,
          msg: `CRITICAL: Methane levels at ${d.methane.toFixed(3)} ppm`,
          type: 'error'
        });
      } 
      else if (d.temperature > TEMP_THRESHOLD) {
        entries.unshift({
          time: d.timestamp,
          msg: `${t.highTemp}: ${d.temperature.toFixed(1)}°C`,
          type: 'error'
        });
      }
      else if (d.wifiSignal < 40) {
        entries.unshift({
          time: d.timestamp,
          msg: `WARNING: Signal strength low (${d.wifiSignal.toFixed(0)}%)`,
          type: 'warning'
        });
      }
      // Log algorithm state occasionally
      else if (index % 5 === 0) {
         entries.unshift({
          time: d.timestamp,
          msg: `LIO-SLAM RMSE: ${d.slamRmse} | FeatDens: ${d.featureDensity}`,
          type: 'info'
        });
      }
    });
    
    return entries;
  }, [dataHistory, t]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle size={14} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
      case 'success': return <CheckCircle size={14} className="text-green-500" />;
      default: return <Info size={14} className="text-blue-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400 font-semibold';
      case 'warning': return 'text-amber-400';
      case 'success': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const isHighGas = latest.methane && latest.methane > GAS_THRESHOLD;
  const isHighTemp = latest.temperature && latest.temperature > TEMP_THRESHOLD;

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-2 h-8 bg-blue-600 rounded-full inline-block"></span>
        {t.inspection}
      </h2>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Methane Card */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${isHighGas ? 'animate-pulse' : ''}`}>
             <AlertOctagon size={48} className={isHighGas ? 'text-red-500' : 'text-slate-400'} />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <AlertOctagon size={16} className={isHighGas ? 'text-red-500 animate-bounce' : 'text-red-400'} />
            {t.gasLevel}
          </div>
          <div className={`text-2xl font-bold ${isHighGas ? 'text-red-400' : 'text-white'}`}>
            {latest.methane?.toFixed(3)} <span className="text-sm font-normal text-slate-500">ppm</span>
          </div>
          {isHighGas && (
            <div className="text-xs text-red-500 font-bold mt-1 uppercase tracking-wider">Warning: High Level</div>
          )}
        </div>

        {/* Temperature Card */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${isHighTemp ? 'animate-pulse' : ''}`}>
             <Thermometer size={48} className={isHighTemp ? 'text-orange-600' : 'text-slate-400'} />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            {isHighTemp ? (
                <Flame size={16} className="text-orange-500 animate-pulse" />
            ) : (
                <Thermometer size={16} className="text-orange-400" />
            )}
            {t.temp}
          </div>
          <div className={`text-2xl font-bold ${isHighTemp ? 'text-orange-500' : 'text-white'}`}>
            {latest.temperature?.toFixed(1)} <span className="text-sm font-normal text-slate-500">°C</span>
          </div>
          {isHighTemp && (
            <div className="text-xs text-orange-500 font-bold mt-1 uppercase tracking-wider animate-pulse">
                {t.highTemp}
            </div>
          )}
        </div>

        {/* Humidity Card */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <CloudRain size={16} className="text-blue-400" />
            {t.humidity}
          </div>
          <div className="text-2xl font-bold text-white">
            {latest.humidity?.toFixed(1)} <span className="text-sm font-normal text-slate-500">%</span>
          </div>
        </div>

        {/* Wind Speed Card */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Wind size={16} className="text-cyan-400" />
            Airflow
          </div>
          <div className="text-2xl font-bold text-white">
            {latest.windSpeed?.toFixed(2)} <span className="text-sm font-normal text-slate-500">m/s</span>
          </div>
        </div>
      </div>

      {/* Algorithm Analysis Charts (Step 1 & 2 from PDF) */}
      <h3 className="text-lg font-bold text-slate-300 mb-4 border-l-4 border-indigo-500 pl-3">Algorithm Diagnostics</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         
         {/* Step 2: Gas Field Reconstruction Comparison */}
         <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
               <div>
                  <h3 className="font-semibold text-slate-200">{t.algoGas}</h3>
                  <p className="text-xs text-slate-500">ST-GNN vs Raw Sensor (Gating Mechanism)</p>
               </div>
            </div>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataHistory.slice(-40)}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="timestamp" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                     <YAxis stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                     <Tooltip content={<CustomTooltip />} />
                     <Legend wrapperStyle={{ fontSize: '10px' }} />
                     
                     {/* Raw Noise Data (Sawtooth) */}
                     <Line 
                        type="monotone" 
                        dataKey="methaneRaw" 
                        name={t.gasRaw}
                        stroke="#64748b" 
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        dot={false}
                        isAnimationActive={false}
                     />
                     {/* GNN Smoothed Data */}
                     <Line 
                        type="monotone" 
                        dataKey="methane" 
                        name={t.gasLevel}
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Step 1: Localization Robustness */}
         <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
               <div>
                  <h3 className="font-semibold text-slate-200">{t.algoLoc}</h3>
                  <p className="text-xs text-slate-500">RMSE vs Feature Density (Adaptive Noise)</p>
               </div>
            </div>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataHistory.slice(-40)}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="timestamp" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                     <YAxis yAxisId="left" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} label={{ value: 'RMSE', angle: -90, position: 'insideLeft', fill: '#8884d8' }} />
                     <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} label={{ value: 'Density', angle: 90, position: 'insideRight', fill: '#82ca9d' }} />
                     <Tooltip content={<CustomTooltip />} />
                     <Legend wrapperStyle={{ fontSize: '10px' }} />
                     
                     <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="slamRmse" 
                        name={t.rmse}
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                     />
                     <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="featureDensity" 
                        name={t.featureDens}
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-200">{t.systemLog}</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 text-[10px] font-mono border border-blue-900/50">LIVE</span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
                Showing {logs.length} events
            </div>
        </div>
        <div className="font-mono text-xs space-y-2 h-48 overflow-y-auto custom-scrollbar pr-2">
            {logs.map((log, i) => (
                <div key={i} className="flex gap-3 hover:bg-slate-800/30 p-1.5 rounded transition-colors group">
                    <span className="text-slate-500 min-w-[70px] border-r border-slate-800 pr-3 text-right opacity-70 group-hover:opacity-100 transition-opacity">
                        {log.time}
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                        {getLogIcon(log.type)}
                        <span className={`${getLogColor(log.type)}`}>
                            {log.msg}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DataView;