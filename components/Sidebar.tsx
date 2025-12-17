import React from 'react';
import { LayoutDashboard, Activity, Settings, Gamepad2 } from 'lucide-react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, language }) => {
  const t = TRANSLATIONS[language];

  const navItems = [
    { id: 'control' as ViewState, icon: Gamepad2, label: t.dashboard },
    { id: 'inspection' as ViewState, icon: Activity, label: t.inspection },
    { id: 'settings' as ViewState, icon: Settings, label: t.settings },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-slate-900/50 backdrop-blur-md border-r border-slate-800 flex flex-col items-center lg:items-stretch py-6 gap-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`
            w-12 h-12 lg:w-auto lg:h-12 lg:mx-4 flex items-center justify-center lg:justify-start lg:px-4 rounded-xl transition-all duration-200 group relative
            ${currentView === item.id 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }
          `}
        >
          <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
          <span className="hidden lg:block ml-3 font-medium text-sm">{item.label}</span>
          
          {/* Tooltip for mobile/collapsed state */}
          <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 lg:hidden pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
            {item.label}
          </div>
        </button>
      ))}

      <div className="mt-auto px-4 lg:px-6">
        <div className="h-px bg-slate-800 w-full my-4"></div>
        <div className="text-xs text-slate-500 text-center lg:text-left">
          <span className="hidden lg:inline">System v2.4.0</span>
          <span className="lg:hidden">v2.4</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
