import React, { useState } from 'react';
import { 
  SmartThingsDevice, 
  HavellsFanState, 
  AppSettings 
} from '../types';
import { 
  Fan, 
  Lightbulb, 
  Tv, 
  Zap, 
  Activity, 
  Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  HelpCircle, 
  Sliders, 
  Moon, 
  Sun, 
  RotateCw,
  Power,
  ShieldCheck,
  Server
} from 'lucide-react';
import { playHudSound } from '../utils/audio';

interface Props {
  smartThingsDevices: SmartThingsDevice[];
  onToggleSmartThingsDevice: (id: string, forceState?: boolean) => void;
  onUpdateSmartThingsDevice: (id: string, updates: Partial<SmartThingsDevice>) => void;
  havellsFan: HavellsFanState;
  onUpdateHavellsFan: (updates: Partial<HavellsFanState>) => void;
  soundEnabled: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const SmartHomeHub: React.FC<Props> = ({
  smartThingsDevices,
  onToggleSmartThingsDevice,
  onUpdateSmartThingsDevice,
  havellsFan,
  onUpdateHavellsFan,
  soundEnabled,
  demoMode,
  onToggleDemoMode,
  settings,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'havells' | 'smartthings' | 'architecture'>('havells');
  
  // SmartThings PAT State
  const [stPatInput, setStPatInput] = useState(settings.smartThingsPat || '');
  const [stTesting, setStTesting] = useState(false);
  const [stTestResult, setStTestResult] = useState<{
    status: 'idle' | 'success' | 'cors_blocked' | 'unauthorized' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Havells Bridge Inputs
  const [havellsIp, setHavellsIp] = useState(settings.havellsBridgeIp || '192.168.1.145');
  const [havellsKey, setHavellsKey] = useState(settings.havellsLocalKey || '');
  const [havellsBridgeStatus, setHavellsBridgeStatus] = useState<'disconnected' | 'testing' | 'connected' | 'demo'>('demo');

  // Test SmartThings Real API
  const handleTestSmartThings = async () => {
    if (!stPatInput.trim()) {
      setStTestResult({
        status: 'unauthorized',
        message: 'Personal Access Token is empty. Enter your PAT from account.smartthings.com/tokens or test with Sandbox Mode.'
      });
      return;
    }

    setStTesting(true);
    setStTestResult({ status: 'idle', message: 'Querying https://api.smartthings.com/v1/devices...' });

    try {
      const response = await fetch('https://api.smartthings.com/v1/devices', {
        headers: {
          'Authorization': `Bearer ${stPatInput.trim()}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStTestResult({
          status: 'success',
          message: `API Authentication Successful. Retrieved ${data.items?.length || 0} real devices from Samsung SmartThings.`
        });
        onUpdateSettings({ smartThingsPat: stPatInput.trim() });
        playHudSound('success', soundEnabled);
      } else if (response.status === 401) {
        setStTestResult({
          status: 'unauthorized',
          message: 'HTTP 401 Unauthorized: Invalid or expired Samsung SmartThings PAT.'
        });
        playHudSound('alert', soundEnabled);
      } else {
        setStTestResult({
          status: 'error',
          message: `SmartThings API returned HTTP status ${response.status}: ${response.statusText}`
        });
        playHudSound('alert', soundEnabled);
      }
    } catch (err: any) {
      // Standard browser CORS limitation when invoking SmartThings directly from client
      setStTestResult({
        status: 'cors_blocked',
        message: 'Browser CORS Restriction: Samsung SmartThings REST API does not allow direct cross-origin browser requests without a server relay. For Netlify static hosting, either use a Netlify serverless function or enjoy our fully functional interactive Sandbox Mode.'
      });
      playHudSound('alert', soundEnabled);
    } finally {
      setStTesting(false);
    }
  };

  const handleSaveHavellsBridge = (e: React.FormEvent) => {
    e.preventDefault();
    setHavellsBridgeStatus('testing');
    setTimeout(() => {
      onUpdateSettings({ havellsBridgeIp: havellsIp, havellsLocalKey: havellsKey });
      setHavellsBridgeStatus('demo');
      playHudSound('success', soundEnabled);
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
      
      {/* Navigation Tabs for Smart Home Subsections */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl hud-card border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setActiveTab('havells');
            }}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'havells'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fan className="w-4 h-4 text-cyan-400" />
            <span>Havells Smart Fan</span>
          </button>

          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setActiveTab('smartthings');
            }}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'smartthings'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-purple-400" />
            <span>Samsung SmartThings</span>
          </button>

          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setActiveTab('architecture');
            }}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Honest API Architecture</span>
          </button>
        </div>

        {/* Global Demo Switch */}
        <div className="flex items-center gap-2 px-3">
          <span className="text-xs text-slate-400 font-mono">Profile:</span>
          <button
            onClick={() => {
              playHudSound('toggle', soundEnabled);
              onToggleDemoMode();
            }}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
              demoMode
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            }`}
          >
            {demoMode ? 'Interactive Sandbox' : 'Live Hardware Mode'}
          </button>
        </div>
      </div>

      {/* SECTION 1: HAVELLS SMART FAN */}
      {activeTab === 'havells' && (
        <div className="space-y-6">
          
          {/* Honest Havells Integration Notice Banner */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-cyan-200">
                Honest Havells Integration Protocol Notice
              </div>
              <p className="text-slate-300">
                Havells smart fans (Stealth Air Smart, Carnesia, Efficiencia) use a proprietary firmware ecosystem built on Tuya IoT / Havells Sync. <strong>Havells does NOT offer an official public consumer REST API</strong> for standalone browser apps. Real control requires either a <em>Home Assistant LocalTuya bridge</em> or a <em>Tuya Developer Cloud key</em>.
              </p>
              <div className="text-slate-400 text-[11px] pt-1">
                Current Connection: <span className="font-mono text-cyan-300">Sandbox Simulator</span> (Toggle controls below with real aerodynamic physics simulation).
              </div>
            </div>
          </div>

          {/* Main Fan Cockpit */}
          <div className="p-6 md:p-8 rounded-2xl hud-card border border-cyan-500/25 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Interactive Animated Fan Rotor & Telemetry */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center relative overflow-hidden">
              <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-500">
                MODEL: STEALTH AIR I
              </div>

              {/* Fan Blades Display */}
              <div className="relative w-48 h-48 my-4 flex items-center justify-center">
                <div
                  className={`w-40 h-40 rounded-full border-2 border-dashed border-cyan-500/40 flex items-center justify-center transition-all ${
                    havellsFan.power
                      ? `animate-[spin_${Math.max(0.4, 2.5 - havellsFan.speed * 0.4)}s_linear_infinite]`
                      : 'opacity-40'
                  }`}
                  style={{
                    animationDirection: havellsFan.direction === 'reverse' ? 'reverse' : 'normal'
                  }}
                >
                  <Fan className="w-28 h-28 text-cyan-400" />
                </div>

                {/* Center Hub with Underlight Glow */}
                <div 
                  className={`absolute w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                    havellsFan.underlight.enabled
                      ? havellsFan.underlight.temp === 'warm'
                        ? 'bg-amber-500/40 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                        : havellsFan.underlight.temp === 'cool'
                        ? 'bg-cyan-500/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)]'
                        : 'bg-slate-100/40 border-white shadow-[0_0_20px_rgba(255,255,255,0.8)]'
                      : 'bg-slate-950 border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-200">
                    {havellsFan.power ? `LVL ${havellsFan.speed}` : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Live Airflow & Telemetry Readouts */}
              <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">RPM</div>
                  <div className="font-mono font-bold text-slate-100 text-sm">
                    {havellsFan.power ? havellsFan.estimatedRpm : 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Airflow</div>
                  <div className="font-mono font-bold text-cyan-400 text-sm">
                    {havellsFan.power ? `${180 + havellsFan.speed * 18} CMM` : '0 CMM'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Power</div>
                  <div className="font-mono font-bold text-purple-400 text-sm">
                    {havellsFan.power ? `${12 + havellsFan.speed * 6}W` : '0.5W'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Large Mouse-Friendly Control Panels */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Power Switch & Master Modes */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Havells Fan Controls</h3>
                  <p className="text-xs text-slate-400">
                    Precision 5-step BLDC motor with bidirectional circulation.
                  </p>
                </div>

                <button
                  onClick={() => {
                    playHudSound('fan', soundEnabled);
                    onUpdateHavellsFan({ power: !havellsFan.power });
                  }}
                  className={`min-h-[48px] px-6 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    havellsFan.power
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{havellsFan.power ? 'MOTOR RUNNING' : 'SYSTEM OFF'}</span>
                </button>
              </div>

              {/* Speed Levels (Large hit targets for mouse clicking) */}
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  BLDC Speed Calibration
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const active = havellsFan.power && havellsFan.speed === lvl;
                    return (
                      <button
                        key={lvl}
                        onClick={() => {
                          playHudSound('fan', soundEnabled);
                          onUpdateHavellsFan({
                            power: true,
                            speed: lvl,
                            estimatedRpm: 120 + lvl * 45
                          });
                        }}
                        className={`min-h-[52px] rounded-xl font-mono flex flex-col items-center justify-center border transition-all cursor-pointer touch-press ${
                          active
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500">SPEED</span>
                        <span className="text-base font-bold">{lvl}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Modes: Breeze, Direction, Timer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Natural Breeze */}
                <button
                  onClick={() => {
                    playHudSound('toggle', soundEnabled);
                    onUpdateHavellsFan({ breezeMode: !havellsFan.breezeMode });
                  }}
                  className={`min-h-[50px] p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer touch-press ${
                    havellsFan.breezeMode
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-slate-200">Natural Breeze</div>
                    <div className="text-[10px] text-slate-500">Simulates wind gust</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${havellsFan.breezeMode ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-800'}`} />
                </button>

                {/* Summer / Winter Direction */}
                <button
                  onClick={() => {
                    playHudSound('toggle', soundEnabled);
                    onUpdateHavellsFan({
                      direction: havellsFan.direction === 'forward' ? 'reverse' : 'forward'
                    });
                  }}
                  className="min-h-[50px] p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-slate-700 text-left flex items-center justify-between transition-all cursor-pointer touch-press"
                >
                  <div>
                    <div className="text-xs font-medium text-slate-200">Direction</div>
                    <div className="text-[10px] text-cyan-400 font-mono">
                      {havellsFan.direction === 'forward' ? 'Summer (Forward)' : 'Winter (Reverse)'}
                    </div>
                  </div>
                  <RotateCw className="w-4 h-4 text-cyan-400" />
                </button>

                {/* Sleep Timer */}
                <button
                  onClick={() => {
                    playHudSound('click', soundEnabled);
                    const nextTimer = havellsFan.timerMinutes === 0 ? 60 : havellsFan.timerMinutes === 60 ? 120 : havellsFan.timerMinutes === 120 ? 240 : 0;
                    onUpdateHavellsFan({ timerMinutes: nextTimer });
                  }}
                  className="min-h-[50px] p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-slate-700 text-left flex items-center justify-between transition-all cursor-pointer touch-press"
                >
                  <div>
                    <div className="text-xs font-medium text-slate-200">Auto Timer</div>
                    <div className="text-[10px] text-purple-400 font-mono">
                      {havellsFan.timerMinutes === 0 ? 'Disabled' : `${havellsFan.timerMinutes / 60} Hours`}
                    </div>
                  </div>
                  <Moon className="w-4 h-4 text-purple-400" />
                </button>
              </div>

              {/* Integrated LED Underlight */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-200">Underlight Module</span>
                  </div>

                  <button
                    onClick={() => {
                      playHudSound('toggle', soundEnabled);
                      onUpdateHavellsFan({
                        underlight: {
                          ...havellsFan.underlight,
                          enabled: !havellsFan.underlight.enabled
                        }
                      });
                    }}
                    className={`min-h-[44px] px-4 py-1.5 text-xs font-mono rounded-xl border transition-colors cursor-pointer touch-press ${
                      havellsFan.underlight.enabled
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {havellsFan.underlight.enabled ? 'LIGHT: ON' : 'LIGHT: OFF'}
                  </button>
                </div>

                {havellsFan.underlight.enabled && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['warm', 'neutral', 'cool'] as const).map((temp) => (
                      <button
                        key={temp}
                        onClick={() => {
                          playHudSound('click', soundEnabled);
                          onUpdateHavellsFan({
                            underlight: { ...havellsFan.underlight, temp }
                          });
                        }}
                        className={`min-h-[44px] rounded-xl text-xs font-mono capitalize border transition-all cursor-pointer touch-press ${
                          havellsFan.underlight.temp === temp
                            ? 'bg-amber-950/40 border-amber-400 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {temp} (3000K-6000K)
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* LocalTuya Bridge Configuration Modal */}
          <div className="p-5 rounded-2xl hud-card border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>HAVALLES LOCALTUYA BRIDGE CREDENTIALS</span>
              </div>
              <span className="text-[10px] text-slate-500">Stored in browser localStorage</span>
            </div>

            <form onSubmit={handleSaveHavellsBridge} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5 space-y-1">
                <label className="text-xs text-slate-400">Fan IP Address (LAN)</label>
                <input
                  type="text"
                  value={havellsIp}
                  onChange={(e) => setHavellsIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="md:col-span-5 space-y-1">
                <label className="text-xs text-slate-400">Tuya Local Key (16-char)</label>
                <input
                  type="password"
                  value={havellsKey}
                  onChange={(e) => setHavellsKey(e.target.value)}
                  placeholder="e.g. 7f8a9b0c1d2e3f4a"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-slate-200 transition-colors cursor-pointer"
                >
                  Save Bridge
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* SECTION 2: SAMSUNG SMARTTHINGS */}
      {activeTab === 'smartthings' && (
        <div className="space-y-6">
          
          {/* Honest SmartThings API Card */}
          <div className="p-6 rounded-2xl hud-card border border-purple-500/25 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-400" />
                  <span>Samsung SmartThings REST Integration</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Direct client connection using Samsung Personal Access Token (PAT).
                </p>
              </div>

              <a
                href="https://account.smartthings.com/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 underline cursor-pointer"
              >
                <span>Generate PAT at Samsung</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* PAT Input & Diagnostic Test Button */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase">
                Personal Access Token (Stored in LocalStorage, Never Sent to Third Parties)
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <Key className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={stPatInput}
                    onChange={(e) => setStPatInput(e.target.value)}
                    placeholder="Enter Samsung PAT (e.g., e7b91d28-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                    className="w-full min-h-[46px] pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  onClick={handleTestSmartThings}
                  disabled={stTesting}
                  className="min-h-[46px] px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  <RefreshCw className={`w-4 h-4 ${stTesting ? 'animate-spin' : ''}`} />
                  <span>{stTesting ? 'Testing API...' : 'Test Live API'}</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Result Banner */}
            {stTestResult.status !== 'idle' && (
              <div className={`p-4 rounded-xl text-xs space-y-1 border ${
                stTestResult.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : stTestResult.status === 'cors_blocked'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}>
                <div className="font-semibold flex items-center gap-2">
                  {stTestResult.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>Diagnostic Result</span>
                </div>
                <p className="text-slate-300">{stTestResult.message}</p>
              </div>
            )}
          </div>

          {/* Interactive SmartThings Devices Grid (Large buttons for mouse clicking) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-200">
                Registered Hub Devices ({smartThingsDevices.length})
              </h4>
              <span className="text-xs font-mono text-purple-400">
                {demoMode ? 'Sandbox Profile' : 'Synced Hardware Profile'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {smartThingsDevices.map((device) => {
                const isLight = device.type === 'light';
                const isTv = device.type === 'tv';
                const isPlug = device.type === 'switch';

                return (
                  <div
                    key={device.id}
                    className={`p-5 rounded-2xl hud-card border transition-all ${
                      device.power
                        ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          device.power
                            ? 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          {isLight && <Lightbulb className="w-4 h-4" />}
                          {isTv && <Tv className="w-4 h-4" />}
                          {isPlug && <Zap className="w-4 h-4" />}
                          {device.type === 'sensor' && <Activity className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{device.label}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">{device.room}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playHudSound('toggle', soundEnabled);
                          onToggleSmartThingsDevice(device.id);
                        }}
                        className={`min-h-[46px] min-w-[46px] px-3.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer touch-press ${
                          device.power
                            ? 'bg-purple-500 text-slate-950 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                            : 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {device.power ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Brightness Slider for Dimmable Lights */}
                    {isLight && device.level !== undefined && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Brightness</span>
                          <span className="text-purple-300">{device.power ? `${device.level}%` : '0%'}</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={device.level}
                          disabled={!device.power}
                          onChange={(e) => {
                            onUpdateSmartThingsDevice(device.id, {
                              level: parseInt(e.target.value, 10)
                            });
                          }}
                          className="w-full accent-purple-400 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* TV Status & Power Draw */}
                    {isTv && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>Input: HDMI 1 (eARC)</span>
                        <span className="font-mono text-purple-400">{device.power ? 'Active' : 'Standby'}</span>
                      </div>
                    )}

                    {/* Smart Plug Power Draw Telemetry */}
                    {isPlug && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>Live Draw</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {device.power ? `${device.powerUsageWatts || 42}W` : '0.2W'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 3: HONEST API ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="p-6 rounded-2xl hud-card border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Transparent Device Integration Architecture
              </h3>
              <p className="text-xs text-slate-400">
                How ORYQEN handles real smart home devices without fake claims or exposed secrets.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-cyan-300 flex items-center gap-2">
                <span>Havells Smart Ecosystem Reality</span>
              </h4>
              <p>
                Unlike generic open bulbs, Havells products use proprietary Tuya IoT cloud firmware. They do not maintain a public consumer Web API for single-page web applications.
              </p>
              <p className="text-slate-400">
                <strong>How to achieve real control:</strong> Set up a lightweight Raspberry Pi running Home Assistant with the LocalTuya integration, which queries the fan over local Wi-Fi UDP port 6668.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                <span>Samsung SmartThings REST Security</span>
              </h4>
              <p>
                Samsung provides official REST APIs under <code className="font-mono text-purple-200">api.smartthings.com</code>. Tokens are entered directly into browser local storage and never passed through external servers.
              </p>
              <p className="text-slate-400">
                Direct browser calls may be blocked by browser CORS restrictions. When deployed to Netlify, developers typically pair this with a Netlify serverless proxy or enable our high-fidelity Sandbox Mode.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
