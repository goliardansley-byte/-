
import React from 'react';
import { Battery, Signal, Globe, Usb, Sliders } from 'lucide-react';
import { Language, ConnectionStatus } from '../types';
import { TRANSLATIONS } from '../constants';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  batteryLevel: number;
  signalStrength: number;
  connectionStatus?: ConnectionStatus;
  onOpenConfig?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  language, 
  setLanguage, 
  batteryLevel, 
  signalStrength, 
  connectionStatus = ConnectionStatus.DISCONNECTED,
  onOpenConfig
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wider">
          {t.appTitle}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-400">
          
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            connectionStatus === ConnectionStatus.CONNECTED 
              ? 'bg-blue-900/20 border-blue-800 text-blue-400' 
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            <Usb size={14} />
            <span className="text-xs uppercase font-bold tracking-wide">
              {connectionStatus === ConnectionStatus.CONNECTED ? 'STM32 LINKED' : 'NO HARDWARE'}
            </span>
          </div>

          <div className="w-px h-4 bg-slate-700 mx-2"></div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${signalStrength > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
            <span>{signalStrength > 0 ? t.statusOnline : t.statusOffline}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Signal size={16} className={signalStrength > 50 ? 'text-green-400' : 'text-yellow-400'} />
            <span>{Math.round(signalStrength)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Battery size={16} className={batteryLevel > 20 ? 'text-blue-400' : 'text-red-400'} />
            <span>{Math.round(batteryLevel)}%</span>
          </div>
        </div>

        {/* Config Button */}
        {onOpenConfig && (
          <button 
            onClick={onOpenConfig}
            className="p-2 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 transition-colors"
            title={t.configTitle}
          >
            <Sliders size={18} />
          </button>
        )}

        {/* Language Selector */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors text-slate-200 border border-slate-700">
            <Globe size={16} />
            <span className="text-sm font-medium uppercase">{language.split('-')[0]}</span>
          </button>
          <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
            {Object.values(Language).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${language === lang ? 'text-blue-400 font-bold' : 'text-slate-300'}`}
              >
                {lang === Language.CN ? '中文' : lang === Language.EN ? 'English' : 'Deutsch'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
