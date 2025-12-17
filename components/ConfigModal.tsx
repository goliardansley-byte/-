
import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, RotateCcw } from 'lucide-react';
import { AlgorithmConfig, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ConfigModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  config: AlgorithmConfig;
  onSave: (newConfig: AlgorithmConfig) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ 
  language, 
  isOpen, 
  onClose, 
  config, 
  onSave 
}) => {
  const t = TRANSLATIONS[language];
  const [localConfig, setLocalConfig] = useState<AlgorithmConfig>(config);

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalConfig({
      maxSlope: 35,
      maxStepHeight: 0.32,
      maxRoughness: 0.05
    });
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Sliders size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">{t.configTitle}</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6">{t.configDesc}</p>

        <div className="space-y-6">
          {/* Slope Input */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">{t.maxSlope}</label>
              <span className="text-sm font-mono text-indigo-400">{localConfig.maxSlope}°</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="60" 
              step="1"
              value={localConfig.maxSlope}
              onChange={(e) => setLocalConfig({...localConfig, maxSlope: parseFloat(e.target.value)})}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10°</span>
              <span>60°</span>
            </div>
          </div>

          {/* Step Height Input */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">{t.maxStep}</label>
              <span className="text-sm font-mono text-indigo-400">{localConfig.maxStepHeight.toFixed(2)} m</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="0.8" 
              step="0.01"
              value={localConfig.maxStepHeight}
              onChange={(e) => setLocalConfig({...localConfig, maxStepHeight: parseFloat(e.target.value)})}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.1m</span>
              <span>0.8m</span>
            </div>
          </div>

          {/* Roughness Input */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">{t.maxRough}</label>
              <span className="text-sm font-mono text-indigo-400">{localConfig.maxRoughness.toFixed(3)} m</span>
            </div>
            <input 
              type="range" 
              min="0.01" 
              max="0.2" 
              step="0.005"
              value={localConfig.maxRoughness}
              onChange={(e) => setLocalConfig({...localConfig, maxRoughness: parseFloat(e.target.value)})}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.01m</span>
              <span>0.2m</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button 
            onClick={handleReset}
            className="flex-none p-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset to Defaults"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-semibold"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-bold flex items-center justify-center gap-2"
          >
            <Check size={18} />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
