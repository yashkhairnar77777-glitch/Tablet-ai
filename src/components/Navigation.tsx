import React from 'react';
import { NavView } from '../types';
import { 
  Compass, 
  Mic, 
  Home as HomeIcon, 
  Cast, 
  Sliders, 
  Maximize2, 
  Minimize2,
  Sparkles
} from 'lucide-react';
import { playHudSound } from '../utils/audio';

interface Props {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  soundEnabled: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Navigation: React.FC<Props> = ({
  currentView,
  onNavigate,
  isFullscreen,
  onToggleFullscreen,
  soundEnabled,
  demoMode,
  onToggleDemoMode
}) => {
  const navItems: { id: NavView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home HUD', icon: Compass },
    { id: 'voice', label: 'Voice AI', icon: Mic },
    { id: 'smarthome', label: 'Smart Home', icon: HomeIcon },
    { id: 'screenshare', label: 'Screen Share', icon: Cast },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const handleNavClick = (view: NavView) => {
    playHudSound('click', soundEnabled);
    onNavigate(view);
  };

  return (
    <>
      {/* Top Bar Contract: Zone 1 (Brand) - Zone 2 (5 Nav Links) - Zone 3 (1 Primary Action) */}
      <header className="sticky top-0 z-40 w-full bg-[#060814]/85 backdrop-blur-md border-b border-cyan-500/20 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
          
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500/20 via-cyan-500/10 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:border-cyan-300 transition-all duration-200">
                <span className="font-mono font-bold text-sm tracking-wider">OQ</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-wider text-slate-100 group-hover:text-cyan-300 transition-colors">
                  ORYQEN
                </span>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400/70 -mt-0.5">
                  ASSISTANT
                </span>
              </div>
            </button>

            {/* Demo Mode Toggle Badge */}
            <button
              onClick={() => {
                playHudSound('toggle', soundEnabled);
                onToggleDemoMode();
              }}
              title="Click to toggle Demo Mode"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                demoMode 
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/40' 
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
              }`}
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{demoMode ? 'Sandbox Mode' : 'Live Hardware Mode'}</span>
            </button>
          </div>

          {/* Zone 2: 5 Nav items with single-line labels and comfortable click targets */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 border border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action (Fullscreen / Wake Toggle for Tablet) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                playHudSound('click', soundEnabled);
                onToggleFullscreen();
              }}
              className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Tablet Fullscreen Mode'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden md:inline whitespace-nowrap">Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden md:inline whitespace-nowrap">Fullscreen</span>
                </>
              )}
            </button>

            {/* Quick Voice Wake Button */}
            <button
              onClick={() => handleNavClick('voice')}
              className="min-h-[44px] px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-semibold text-xs font-mono flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">VOICE AI</span>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile & Tablet Bottom Dock with Touch Gesture Position Dots */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060814]/95 backdrop-blur-xl border-t border-cyan-500/20 px-2 pt-1 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        
        {/* Subtle Swipe Carousel Dot Track (Mobile & Tablet) */}
        <div className="flex items-center justify-center gap-1.5 pb-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <span
                key={`dot-${item.id}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : 'w-1 bg-slate-700'
                }`}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`min-h-[50px] flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer touch-press ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
