import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, StopCircle, ChevronsUp, ChevronsDown, Plane, Zap } from 'lucide-react';
import { ControlCommand, Language, RobotMode } from '../types';
import { TRANSLATIONS } from '../constants';

interface RobotControllerProps {
  language: Language;
  onCommand: (cmd: ControlCommand) => void;
  disabled?: boolean;
  mode: RobotMode;
}

const RobotController: React.FC<RobotControllerProps> = ({ language, onCommand, disabled = false, mode }) => {
  const t = TRANSLATIONS[language];
  const [activeBtn, setActiveBtn] = useState<ControlCommand | null>(null);

  // Handle keyboard events for control
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling with arrows
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }

      switch (e.key) {
        // Directional
        case 'ArrowUp':
        case 'w':
        case 'W':
          handlePress(ControlCommand.FORWARD);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handlePress(ControlCommand.BACKWARD);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handlePress(ControlCommand.LEFT);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handlePress(ControlCommand.RIGHT);
          break;
        
        // Flight Altitude Controls (Q/E)
        case 'q':
        case 'Q':
          if (mode === RobotMode.FLIGHT) handlePress(ControlCommand.UP);
          break;
        case 'e':
        case 'E':
          if (mode === RobotMode.FLIGHT) handlePress(ControlCommand.DOWN);
          break;

        case ' ': // Spacebar
          handlePress(ControlCommand.STOP);
          break;
      }
    };

    const handleKeyUp = () => {
      setActiveBtn(null);
      // Optional: Stop on key release behavior
      // onCommand(ControlCommand.STOP); 
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, onCommand, mode]);

  const handlePress = (cmd: ControlCommand) => {
    if (disabled) return;
    setActiveBtn(cmd);
    onCommand(cmd);
  };

  const btnClass = (cmd: ControlCommand, isFlight: boolean = false) => `
    p-4 rounded-xl border-2 transition-all flex items-center justify-center
    ${activeBtn === cmd 
      ? (isFlight 
          ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-95' 
          : 'bg-amber-600 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-95')
      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
  `;

  if (mode === RobotMode.FLIGHT) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider flex justify-between items-center">
          <span className="flex items-center gap-2 text-blue-400"><Plane size={14}/> {t.flightControls}</span>
          <div className="flex gap-1">
             <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">WASD</span>
             <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">Q/E</span>
          </div>
        </h3>
        
        <div className="flex gap-4">
          {/* Left Stick: Altitude */}
          <div className="flex flex-col gap-2 w-1/3">
             <button 
                className={`${btnClass(ControlCommand.UP, true)} h-16`}
                onMouseDown={() => handlePress(ControlCommand.UP)}
                onMouseUp={() => setActiveBtn(null)}
                title={t.cmdUp}
              >
                <div className="flex flex-col items-center">
                  <ChevronsUp size={24} />
                  <span className="text-[10px] font-bold">Q</span>
                </div>
              </button>
              <button 
                className={`${btnClass(ControlCommand.DOWN, true)} h-16`}
                onMouseDown={() => handlePress(ControlCommand.DOWN)}
                onMouseUp={() => setActiveBtn(null)}
                title={t.cmdDown}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold">E</span>
                  <ChevronsDown size={24} />
                </div>
              </button>
          </div>

          {/* Right Stick: Direction */}
          <div className="grid grid-cols-3 gap-2 flex-1">
            <div className="col-start-2">
              <button 
                className={`${btnClass(ControlCommand.FORWARD, true)} w-full aspect-square`}
                onMouseDown={() => handlePress(ControlCommand.FORWARD)}
                onMouseUp={() => setActiveBtn(null)}
              >
                <ArrowUp size={20} />
              </button>
            </div>
            <div className="col-start-1">
              <button 
                className={`${btnClass(ControlCommand.LEFT, true)} w-full aspect-square`}
                onMouseDown={() => handlePress(ControlCommand.LEFT)}
                onMouseUp={() => setActiveBtn(null)}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="col-start-2">
              <button 
                className={`${btnClass(ControlCommand.STOP, true)} w-full aspect-square bg-red-900/20 border-red-900/50 text-red-500 hover:bg-red-900/40 hover:text-red-400`}
                onClick={() => handlePress(ControlCommand.STOP)}
              >
                <StopCircle size={20} />
              </button>
            </div>
            <div className="col-start-3">
              <button 
                className={`${btnClass(ControlCommand.RIGHT, true)} w-full aspect-square`}
                onMouseDown={() => handlePress(ControlCommand.RIGHT)}
                onMouseUp={() => setActiveBtn(null)}
              >
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="col-start-2">
              <button 
                className={`${btnClass(ControlCommand.BACKWARD, true)} w-full aspect-square`}
                onMouseDown={() => handlePress(ControlCommand.BACKWARD)}
                onMouseUp={() => setActiveBtn(null)}
              >
                <ArrowDown size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TRACK MODE DEFAULT
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider flex justify-between items-center">
        <span className="flex items-center gap-2 text-amber-500"><Zap size={14}/> {t.trackControls}</span>
        <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">WASD / ARROWS</span>
      </h3>
      
      <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
        <div className="col-start-2">
          <button 
            className={`${btnClass(ControlCommand.FORWARD)} w-full aspect-square`}
            onMouseDown={() => handlePress(ControlCommand.FORWARD)}
            onMouseUp={() => setActiveBtn(null)}
            onTouchStart={() => handlePress(ControlCommand.FORWARD)}
            onTouchEnd={() => setActiveBtn(null)}
          >
            <ArrowUp size={28} />
          </button>
        </div>
        
        <div className="col-start-1">
          <button 
            className={`${btnClass(ControlCommand.LEFT)} w-full aspect-square`}
            onMouseDown={() => handlePress(ControlCommand.LEFT)}
            onMouseUp={() => setActiveBtn(null)}
          >
            <ArrowLeft size={28} />
          </button>
        </div>
        <div className="col-start-2">
           <button 
            className={`${btnClass(ControlCommand.STOP)} w-full aspect-square bg-red-900/20 border-red-900/50 text-red-500 hover:bg-red-900/40 hover:text-red-400`}
            onClick={() => handlePress(ControlCommand.STOP)}
          >
            <StopCircle size={28} />
          </button>
        </div>
        <div className="col-start-3">
          <button 
            className={`${btnClass(ControlCommand.RIGHT)} w-full aspect-square`}
            onMouseDown={() => handlePress(ControlCommand.RIGHT)}
            onMouseUp={() => setActiveBtn(null)}
          >
            <ArrowRight size={28} />
          </button>
        </div>

        <div className="col-start-2">
          <button 
            className={`${btnClass(ControlCommand.BACKWARD)} w-full aspect-square`}
            onMouseDown={() => handlePress(ControlCommand.BACKWARD)}
            onMouseUp={() => setActiveBtn(null)}
          >
            <ArrowDown size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RobotController;