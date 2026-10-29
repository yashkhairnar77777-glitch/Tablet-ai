import React, { useState, useEffect } from 'react';
import { 
  WeatherData, 
  TelemetryData, 
  NavView, 
  HavellsFanState, 
  SmartThingsDevice 
} from '../types';
import { 
  Clock, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  WifiOff, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Fan, 
  Lightbulb, 
  Mic, 
  Cast, 
  Eye, 
  Sparkles, 
  RefreshCw,
  Compass,
  Monitor
} from 'lucide-react';
import { playHudSound } from '../utils/audio';

interface Props {
  telemetry: TelemetryData;
  onNavigate: (view: NavView) => void;
  soundEnabled: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  havellsFan: HavellsFanState;
  onUpdateHavellsFan: (updates: Partial<HavellsFanState>) => void;
  smartThingsDevices: SmartThingsDevice[];
  onToggleSmartThingsDevice: (id: string) => void;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
}

export const HomeDashboard: React.FC<Props> = ({
  telemetry,
  onNavigate,
  soundEnabled,
  demoMode,
  onToggleDemoMode,
  havellsFan,
  onUpdateHavellsFan,
  smartThingsDevices,
  onToggleSmartThingsDevice,
  wakeLockActive,
  onToggleWakeLock
}) => {
  // Clock state
  const [time, setTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);

  // Weather state
  const [weather, setWeather] = useState<WeatherData>({
    temp: 26.5,
    condition: 'Partly Cloudy',
    humidity: 58,
    windSpeed: 12,
    city: 'Local Ambient',
    isDay: true,
    weatherCode: 2
  });
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real Open-Meteo weather
  const fetchWeather = async (lat = 28.6139, lon = 77.2090, cityName = 'New Delhi') => {
    setIsWeatherLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&timezone=auto`
      );
      if (res.ok) {
        const data = await res.json();
        const current = data.current;
        
        // Map weather code
        const code = current.weather_code;
        let cond = 'Clear Sky';
        if (code >= 1 && code <= 3) cond = 'Partly Cloudy';
        else if (code >= 45 && code <= 48) cond = 'Foggy / Hazy';
        else if (code >= 51 && code <= 67) cond = 'Light Rain';
        else if (code >= 71 && code <= 77) cond = 'Snow Flurries';
        else if (code >= 80 && code <= 82) cond = 'Rain Showers';
        else if (code >= 95) cond = 'Thunderstorm';

        setWeather({
          temp: Math.round(current.temperature_2m * 10) / 10,
          condition: cond,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          city: cityName,
          isDay: current.is_day === 1,
          weatherCode: code
        });
      }
    } catch {
      // Keep existing weather if network fails
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    // Attempt browser geolocation or default to local hub
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Station Location');
        },
        () => {
          fetchWeather();
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather();
    }
  }, []);

  const formatTime = () => {
    let hours = time.getHours();
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');
    let ampm = '';

    if (!is24Hour) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    const hoursStr = String(hours).padStart(2, '0');

    return { hoursStr, minutes, seconds, ampm };
  };

  const { hoursStr, minutes, seconds, ampm } = formatTime();

  const formattedDate = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  const activeLightsCount = smartThingsDevices.filter(d => d.type === 'light' && d.power).length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      
      {/* Top Tablet Guidance Banner */}
      <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <Monitor className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span>TABLET CONSOLE ACTIVE</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                USB MOUSE READY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configured for broken-touchscreen Android tablets. All hit targets are high-contrast &amp; enlarged for mouse precision.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              playHudSound('toggle', soundEnabled);
              onToggleDemoMode();
            }}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
              demoMode
                ? 'bg-purple-950/50 border-purple-500/40 text-purple-300 hover:bg-purple-900/50'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
            }`}
          >
            {demoMode ? 'Switch to Live API Mode' : 'Switch to Demo Sandbox'}
          </button>
        </div>
      </div>

      {/* Main HUD Hero Grid: Clock + Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Futuristic HUD Digital Clock (7 Cols) */}
        <div className="lg:col-span-7 p-6 md:p-8 rounded-2xl hud-card border border-cyan-500/25 relative overflow-hidden flex flex-col justify-between shadow-[0_4px_30px_rgba(6,182,212,0.06)]">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Clock Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>CHRONO TELEMETRY</span>
            </div>

            <button
              onClick={() => {
                playHudSound('click', soundEnabled);
                setIs24Hour(!is24Hour);
              }}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900/80 rounded border border-slate-700 hover:border-cyan-500/40 transition-colors cursor-pointer"
            >
              {is24Hour ? 'FORMAT: 24H' : 'FORMAT: 12H'}
            </button>
          </div>

          {/* Large Futuristic Glowing Time Numbers */}
          <div className="my-auto py-2">
            <div className="flex items-baseline gap-2 md:gap-3">
              <span className="text-5xl sm:text-7xl md:text-8xl font-mono font-bold tracking-tight text-slate-100 glow-cyan tabular-nums">
                {hoursStr}
              </span>
              <span className="text-4xl sm:text-6xl md:text-7xl font-mono font-light text-cyan-400/80 animate-pulse">
                :
              </span>
              <span className="text-5xl sm:text-7xl md:text-8xl font-mono font-bold tracking-tight text-slate-100 glow-cyan tabular-nums">
                {minutes}
              </span>
              <span className="text-4xl sm:text-6xl md:text-7xl font-mono font-light text-cyan-400/80 animate-pulse">
                :
              </span>
              <span className="text-4xl sm:text-5xl md:text-6xl font-mono font-semibold tracking-tight text-purple-400 glow-violet tabular-nums">
                {seconds}
              </span>
              {ampm && (
                <span className="text-lg sm:text-2xl font-mono font-semibold text-slate-400 ml-1">
                  {ampm}
                </span>
              )}
            </div>

            {/* Date Display */}
            <div className="mt-3 flex items-center gap-3 text-xs sm:text-sm font-mono tracking-wider text-slate-300">
              <span className="text-cyan-400 font-semibold">{formattedDate}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">UPTIME: {Math.floor(telemetry.uptimeSeconds / 60)}m {telemetry.uptimeSeconds % 60}s</span>
            </div>
          </div>

          {/* Quick HUD Navigation Shortcuts */}
          <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                playHudSound('wake', soundEnabled);
                onNavigate('voice');
              }}
              className="px-3.5 py-2 rounded-lg bg-cyan-950/40 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-300 text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice AI Console</span>
            </button>

            <button
              onClick={() => {
                playHudSound('click', soundEnabled);
                onNavigate('smarthome');
              }}
              className="px-3.5 py-2 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-400 text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
              <span>Smart Home Hub</span>
            </button>

            <button
              onClick={() => {
                playHudSound('click', soundEnabled);
                onToggleWakeLock();
              }}
              className={`px-3.5 py-2 rounded-lg border text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                wakeLockActive
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{wakeLockActive ? 'Screen Awake: ACTIVE' : 'Screen Awake: OFF'}</span>
            </button>
          </div>
        </div>

        {/* System Telemetry & Weather (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          
          {/* Live Environmental & Weather Card */}
          <div className="p-5 rounded-2xl hud-card border border-slate-800 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>ENVIRONMENTAL TELEMETRY</span>
              </div>
              <button
                onClick={() => fetchWeather()}
                disabled={isWeatherLoading}
                className="text-slate-400 hover:text-cyan-400 transition-colors p-1 cursor-pointer"
                title="Refresh Weather Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-mono font-bold text-slate-100 flex items-baseline gap-1">
                  <span>{weather.temp}°C</span>
                  <span className="text-xs font-sans font-normal text-slate-400">({weather.condition})</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Station: <span className="text-cyan-400 font-mono">{weather.city}</span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                {weather.weatherCode >= 51 ? (
                  <CloudRain className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-400" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Humidity: <strong className="font-mono text-slate-100">{weather.humidity}%</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Wind className="w-3.5 h-3.5 text-purple-400" />
                <span>Wind: <strong className="font-mono text-slate-100">{weather.windSpeed} km/h</strong></span>
              </div>
            </div>
          </div>

          {/* Hardware & Diagnostics Strip */}
          <div className="p-5 rounded-2xl hud-card border border-slate-800 space-y-3">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>HARDWARE DIAGNOSTICS</span>
              <span className="text-[10px] text-cyan-400">TABLET SENSORS</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Battery */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${telemetry.batteryLevel && telemetry.batteryLevel < 20 ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                  {telemetry.isCharging ? (
                    <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
                  ) : (
                    <Battery className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Battery Power</div>
                  <div className="text-sm font-mono font-bold text-slate-200">
                    {telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : '85% (Sim)'}
                    {telemetry.isCharging && <span className="text-[10px] text-emerald-400 ml-1">⚡ AC</span>}
                  </div>
                </div>
              </div>

              {/* Network */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {telemetry.isOnline ? (
                    <Wifi className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Network State</div>
                  <div className="text-sm font-mono font-bold text-slate-200">
                    {telemetry.isOnline ? 'Online // Lat: 14ms' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Display Stats */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-1">
              <span>Display: {telemetry.screenResolution} (DPR {telemetry.pixelRatio}x)</span>
              <span className="text-cyan-400">Refresh: 60Hz</span>
            </div>
          </div>

        </div>

      </div>

      {/* Quick Interactive Device Cards (Havells Fan & SmartThings) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Havells Smart Fan Quick Controller */}
        <div className="p-6 rounded-2xl hud-card border border-cyan-500/20 relative group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                havellsFan.power 
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <Fan className={`w-5 h-5 ${havellsFan.power ? 'animate-[spin_2.5s_linear_infinite]' : ''}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <span>Havells Smart Fan</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    {demoMode ? 'Sandbox' : 'LocalTuya'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {havellsFan.power 
                    ? `Speed ${havellsFan.speed} / 5 • ~${havellsFan.estimatedRpm} RPM ${havellsFan.breezeMode ? '• Breeze' : ''}` 
                    : 'Turned Off (Standby)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playHudSound('fan', soundEnabled);
                onUpdateHavellsFan({ power: !havellsFan.power });
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                havellsFan.power
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {havellsFan.power ? 'POWER: ON' : 'POWER: OFF'}
            </button>
          </div>

          {/* Quick Speed Selector Buttons (Large for Mouse) */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const isCurrent = havellsFan.power && havellsFan.speed === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    playHudSound('fan', soundEnabled);
                    onUpdateHavellsFan({ power: true, speed: lvl, estimatedRpm: 120 + lvl * 45 });
                  }}
                  className={`min-h-[44px] rounded-lg font-mono text-xs font-semibold flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-500">LVL</span>
                  <span>{lvl}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Airflow: <strong className="font-mono text-cyan-300">{havellsFan.power ? `${180 + havellsFan.speed * 18} CMM` : '0 CMM'}</strong></span>
            <button
              onClick={() => {
                playHudSound('click', soundEnabled);
                onNavigate('smarthome');
              }}
              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Fan Controls</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Samsung SmartThings Quick Controller */}
        <div className="p-6 rounded-2xl hud-card border border-purple-500/20 relative group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/40 text-purple-300 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <span>Samsung SmartThings</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                    {demoMode ? 'Sandbox' : 'REST Token'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {activeLightsCount} / {smartThingsDevices.length} Devices Powered On
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playHudSound('click', soundEnabled);
                onNavigate('smarthome');
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-300 transition-all cursor-pointer"
            >
              Configure Hub
            </button>
          </div>

          {/* Quick toggle chips */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {smartThingsDevices.slice(0, 2).map((dev) => (
              <button
                key={dev.id}
                onClick={() => {
                  playHudSound('toggle', soundEnabled);
                  onToggleSmartThingsDevice(dev.id);
                }}
                className={`min-h-[50px] p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  dev.power
                    ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-slate-200 truncate">{dev.label}</div>
                  <div className="text-[10px] text-slate-400">{dev.room}</div>
                </div>
                <div className={`w-3 h-3 rounded-full border ${dev.power ? 'bg-purple-400 border-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-slate-800 border-slate-700'}`} />
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Security: <strong className="font-mono text-emerald-400">PAT Encrypted in Storage</strong></span>
            <button
              onClick={() => {
                playHudSound('click', soundEnabled);
                onNavigate('smarthome');
              }}
              className="text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All Devices</span>
              <span>→</span>
            </button>
          </div>
        </div>

      </div>

      {/* Screen Mirroring Quick Status */}
      <div className="p-5 rounded-2xl hud-card border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Cast className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Screen Sharing &amp; Remote Mirror</h4>
            <p className="text-xs text-slate-400">
              WebRTC display capture ready for tablet-to-phone streaming + ADB / scrcpy USB instructions for mouse control.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playHudSound('click', soundEnabled);
            onNavigate('screenshare');
          }}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
        >
          Open Screen Hub →
        </button>
      </div>

    </div>
  );
};
