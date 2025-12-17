import React, { useState, useEffect, useRef } from 'react';
import { Settings, Cpu, Usb, Terminal, RefreshCw, AlertCircle, CheckCircle2, Wifi } from 'lucide-react';
import { Language, ConnectionStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { serialService } from '../services/SerialService';
import { webSocketService } from '../services/WebSocketService';

interface SettingsViewProps {
  language: Language;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  onRawData: (data: string) => void;
  // WS Props
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  language, 
  connectionStatus, 
  setConnectionStatus,
  wsConnected,
  setWsConnected
}) => {
  const t = TRANSLATIONS[language];
  const [baudRate, setBaudRate] = useState(115200);
  
  // WebSocket State
  const [wsAddress, setWsAddress] = useState('ws://192.168.1.100:81');
  
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Hook into services to display raw logs
  useEffect(() => {
    serialService.setOnData((data) => {
      setConsoleLogs(prev => [...prev.slice(-19), `SERIAL RX: ${data.trim()}`]);
    });
    
    webSocketService.setOnLog((msg) => {
      setConsoleLogs(prev => [...prev.slice(-19), msg]);
    });
  }, []);

  // Auto scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  // Serial Connect
  const handleConnectSerial = async () => {
    if (connectionStatus === ConnectionStatus.CONNECTED) {
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      await serialService.disconnect();
    } else {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      const success = await serialService.connect(baudRate);
      if (success) {
        setConnectionStatus(ConnectionStatus.CONNECTED);
        setConsoleLogs(prev => [...prev, `SYS: Connected to STM32 at ${baudRate} baud`]);
      } else {
        setConnectionStatus(ConnectionStatus.ERROR);
        setConsoleLogs(prev => [...prev, `SYS: Serial Connection Failed`]);
        setTimeout(() => setConnectionStatus(ConnectionStatus.DISCONNECTED), 3000);
      }
    }
  };

  // WebSocket Connect
  const handleConnectWs = () => {
    if (wsConnected) {
      webSocketService.disconnect();
      // Status update handled by callback in App.tsx -> setWsConnected
      setWsConnected(false); // Optimistic update
    } else {
      setConsoleLogs(prev => [...prev, `SYS: Connecting to ${wsAddress}...`]);
      webSocketService.connect(wsAddress);
      // Status update handled by callback in App.tsx
    }
  };

  const handleTestCommand = () => {
    serialService.sendCommand('TEST_PING');
    setConsoleLogs(prev => [...prev, `TX: TEST_PING`]);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-2 h-8 bg-slate-500 rounded-full inline-block"></span>
        {t.settings}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WebSocket Connection Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="p-3 bg-indigo-900/20 rounded-xl text-indigo-400">
              <Wifi size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{t.wsStatus}</h3>
              <p className="text-sm text-slate-500">WiFi / WebSocket Link</p>
            </div>
            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
              wsConnected 
                ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {wsConnected ? <span className="flex items-center gap-1"><CheckCircle2 size={12}/> {t.connected}</span> : t.disconnected}
            </div>
          </div>

          <div className="space-y-6">
             <div>
              <label className="block text-sm text-slate-400 mb-2">{t.wsAddress}</label>
              <input 
                type="text"
                value={wsAddress}
                onChange={(e) => setWsAddress(e.target.value)}
                disabled={wsConnected}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
              />
            </div>

            <button
              onClick={handleConnectWs}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                wsConnected
                  ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
              }`}
            >
              {wsConnected ? (
                <>{t.disconnectCar}</>
              ) : (
                <>{t.connectCar}</>
              )}
            </button>
          </div>
        </div>

        {/* Hardware Connection Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="p-3 bg-blue-900/20 rounded-xl text-blue-400">
              <Usb size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{t.hardwareConnection}</h3>
              <p className="text-sm text-slate-500">USB-Serial / UART Interface</p>
            </div>
            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
              connectionStatus === ConnectionStatus.CONNECTED 
                ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                : connectionStatus === ConnectionStatus.CONNECTING
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {connectionStatus === ConnectionStatus.CONNECTED && <span className="flex items-center gap-1"><CheckCircle2 size={12}/> {t.connected}</span>}
              {connectionStatus === ConnectionStatus.DISCONNECTED && t.disconnected}
              {connectionStatus === ConnectionStatus.CONNECTING && <span className="flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> {t.connecting}</span>}
              {connectionStatus === ConnectionStatus.ERROR && <span className="flex items-center gap-1"><AlertCircle size={12}/> {t.connectionError}</span>}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">{t.baudRate}</label>
              <select 
                value={baudRate} 
                onChange={(e) => setBaudRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={connectionStatus === ConnectionStatus.CONNECTED}
              >
                <option value={9600}>9600</option>
                <option value={115200}>115200</option>
                <option value={921600}>921600</option>
              </select>
            </div>

            <button
              onClick={handleConnectSerial}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                connectionStatus === ConnectionStatus.CONNECTED
                  ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
              }`}
            >
              {connectionStatus === ConnectionStatus.CONNECTED ? (
                <><Usb size={20} className="rotate-45" /> {t.disconnectStm32}</>
              ) : (
                <><Usb size={20} /> {t.connectStm32}</>
              )}
            </button>
            
             {connectionStatus === ConnectionStatus.CONNECTED && (
               <button 
                 onClick={handleTestCommand}
                 className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-colors"
               >
                 {t.sendTest}
               </button>
            )}
          </div>
        </div>

        {/* Debug Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={18} className="text-slate-400" />
            <h3 className="font-semibold text-slate-200">{t.dataPreview}</h3>
          </div>
          
          <div className="flex-1 bg-black rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto h-[200px] border border-slate-800/50 shadow-inner">
            {consoleLogs.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-700 italic">
                {t.noData}
              </div>
            )}
            {consoleLogs.map((log, i) => (
              <div key={i} className="mb-1 break-all">
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                {log}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;