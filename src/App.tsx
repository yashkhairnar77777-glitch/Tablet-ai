import React, { useState, useEffect, useRef } from 'react';
import { 
  NavView, 
  AppSettings, 
  HavellsFanState, 
  SmartThingsDevice, 
  TelemetryData 
} from './types';
import { Navigation } from './components/Navigation';
import { HomeDashboard } from './components/HomeDashboard';
import { VoiceAssistant } from './components/VoiceAssistant';
import { SmartHomeHub } from './components/SmartHomeHub';
import { ScreenShareHub } from './components/ScreenShareHub';
import { SettingsHub } from './components/SettingsHub';
import { MousePointerOverlay } from './components/MousePointerOverlay';
import { playHudSound } from './utils/audio';

const STORAGE_KEY_SETTINGS = 'oryqen_settings_v1';
const STORAGE_KEY_FAN = 'oryqen_fan_v1';
const STORAGE_KEY_DEVICES = 'oryqen_st_devices_v1';

const DEFAULT_SETTINGS: AppSettings = {
  demoMode: true,
  pointerSpotlight: true,
  pointerColor: 'cyan',
  clickSound: true,
  speechVoiceUri: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 0.95,
  autoListenAfterReply: false,
  wakeLockEnabled: false,
  uiScale: 'standard',
  highContrast: false,
  smartThingsPat: '',
  havellsBridgeIp: '192.168.1.145',
  havellsLocalKey: ''
};

const DEFAULT_HAVELLS_FAN: HavellsFanState = {
  power: false,
  speed: 3,
  breezeMode: false,
  timerMinutes: 0,
  direction: 'forward',
  underlight: {
    enabled: false,
    brightness: 80,
    temp: 'warm'
  },
  connected: true,
  bridgeType: 'demo',
  estimatedRpm: 255
};

const DEFAULT_SMARTTHINGS_DEVICES: SmartThingsDevice[] = [
  {
    id: 'st-dev-1',
    label: 'Living Room Chandelier',
    room: 'Living Room',
    type: 'light',
    power: true,
    level: 75,
    status: 'online'
  },
  {
    id: 'st-dev-2',
    label: 'Studio Cyber LED Strip',
    room: 'Workspace',
    type: 'light',
    power: true,
    level: 100,
    status: 'online'
  },
  {
    id: 'st-dev-3',
    label: 'Samsung QLED TV 65"',
    room: 'Living Room',
    type: 'tv',
    power: false,
    status: 'online'
  },
  {
    id: 'st-dev-4',
    label: 'Media Console Plug',
    room: 'Living Room',
    type: 'switch',
    power: true,
    status: 'online',
    powerUsageWatts: 68
  },
  {
    id: 'st-dev-5',
    label: 'Hallway Motion Multisensor',
    room: 'Hallway',
    type: 'sensor',
    power: true,
    status: 'online'
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);

  // Load persistent settings or fallback
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Load persistent Havells fan state
  const [havellsFan, setHavellsFan] = useState<HavellsFanState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAN);
      if (saved) return { ...DEFAULT_HAVELLS_FAN, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_HAVELLS_FAN;
  });

  // Load persistent SmartThings devices
  const [smartThingsDevices, setSmartThingsDevices] = useState<SmartThingsDevice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEVICES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SMARTTHINGS_DEVICES;
  });

  // System Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    batteryLevel: null,
    isCharging: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    screenResolution: '1280 × 800',
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    uptimeSeconds: 0,
    wakeLockActive: false
  });

  // Save settings
  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Save Havells Fan
  const handleUpdateHavellsFan = (updates: Partial<HavellsFanState>) => {
    setHavellsFan((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY_FAN, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Update SmartThings Device
  const handleToggleSmartThingsDevice = (id: string, forceState?: boolean) => {
    setSmartThingsDevices((prev) => {
      const next = prev.map((dev) => {
        if (dev.id === id) {
          const newPower = forceState !== undefined ? forceState : !dev.power;
          return { ...dev, power: newPower };
        }
        return dev;
      });
      try {
        localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleUpdateSmartThingsDevice = (id: string, updates: Partial<SmartThingsDevice>) => {
    setSmartThingsDevices((prev) => {
      const next = prev.map((dev) => {
        if (dev.id === id) {
          return { ...dev, ...updates };
        }
        return dev;
      });
      try {
        localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Screen Wake Lock Handler
  const handleToggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      if (wakeLockSentinel) {
        try {
          await wakeLockSentinel.release();
          setWakeLockSentinel(null);
          setTelemetry((prev) => ({ ...prev, wakeLockActive: false }));
        } catch {}
      } else {
        try {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          setWakeLockSentinel(sentinel);
          setTelemetry((prev) => ({ ...prev, wakeLockActive: true }));
          sentinel.addEventListener('release', () => {
            setWakeLockSentinel(null);
            setTelemetry((prev) => ({ ...prev, wakeLockActive: false }));
          });
        } catch {
          // If rejected
        }
      }
    }
  };

  // System Telemetry Uptime & Network Listeners
  useEffect(() => {
    const uptimeInterval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        uptimeSeconds: prev.uptimeSeconds + 1
      }));
    }, 1000);

    const handleOnline = () => setTelemetry((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setTelemetry((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Resolution measurement
    const updateRes = () => {
      setTelemetry((prev) => ({
        ...prev,
        screenResolution: `${window.innerWidth} × ${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio || 1
      }));
    };
    updateRes();
    window.addEventListener('resize', updateRes);

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setTelemetry((prev) => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

    return () => {
      clearInterval(uptimeInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', updateRes);
    };
  }, []);

  // Natural Breeze mode fluctuation simulation for Havells Fan
  useEffect(() => {
    if (!havellsFan.power || !havellsFan.breezeMode) return;

    const breezeInterval = setInterval(() => {
      const randomSpeed = Math.floor(1 + Math.random() * 5);
      setHavellsFan((prev) => ({
        ...prev,
        speed: randomSpeed,
        estimatedRpm: 120 + randomSpeed * 45
      }));
    }, 7000);

    return () => clearInterval(breezeInterval);
  }, [havellsFan.power, havellsFan.breezeMode]);

  // UI scale classes
  const uiScaleClass = {
    compact: 'text-sm scale-95 origin-top',
    standard: 'text-base',
    large: 'text-base sm:text-lg',
    kiosk: 'text-base sm:text-lg sm:scale-105 origin-top'
  }[settings.uiScale];

  return (
    <div className={`min-h-screen bg-[#060814] text-slate-100 flex flex-col relative pb-20 lg:pb-8 hud-grid-bg ${
      settings.highContrast ? 'contrast-125 brightness-110' : ''
    }`}>
      
      {/* High-visibility USB Mouse Cursor Spotlight for cracked/dim tablet screen */}
      <MousePointerOverlay
        enabled={settings.pointerSpotlight}
        color={settings.pointerColor}
      />

      {/* Navigation Top Bar Contract & Mobile Dock */}
      <Navigation
        currentView={currentView}
        onNavigate={setCurrentView}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        soundEnabled={settings.clickSound}
        demoMode={settings.demoMode}
        onToggleDemoMode={() => handleUpdateSettings({ demoMode: !settings.demoMode })}
      />

      {/* Main Content View with Dynamic Scaling */}
      <main className={`flex-1 w-full transition-all duration-200 ${uiScaleClass}`}>
        {currentView === 'home' && (
          <HomeDashboard
            telemetry={telemetry}
            onNavigate={setCurrentView}
            soundEnabled={settings.clickSound}
            demoMode={settings.demoMode}
            onToggleDemoMode={() => handleUpdateSettings({ demoMode: !settings.demoMode })}
            havellsFan={havellsFan}
            onUpdateHavellsFan={handleUpdateHavellsFan}
            smartThingsDevices={smartThingsDevices}
            onToggleSmartThingsDevice={handleToggleSmartThingsDevice}
            wakeLockActive={telemetry.wakeLockActive}
            onToggleWakeLock={handleToggleWakeLock}
          />
        )}

        {currentView === 'voice' && (
          <VoiceAssistant
            havellsFan={havellsFan}
            onUpdateHavellsFan={handleUpdateHavellsFan}
            smartThingsDevices={smartThingsDevices}
            onToggleSmartThingsDevice={handleToggleSmartThingsDevice}
            telemetry={telemetry}
            onNavigate={setCurrentView}
            soundEnabled={settings.clickSound}
            speechVoiceUri={settings.speechVoiceUri}
            speechRate={settings.speechRate}
            speechPitch={settings.speechPitch}
            speechVolume={settings.speechVolume}
            autoListen={settings.autoListenAfterReply}
            demoMode={settings.demoMode}
          />
        )}

        {currentView === 'smarthome' && (
          <SmartHomeHub
            smartThingsDevices={smartThingsDevices}
            onToggleSmartThingsDevice={handleToggleSmartThingsDevice}
            onUpdateSmartThingsDevice={handleUpdateSmartThingsDevice}
            havellsFan={havellsFan}
            onUpdateHavellsFan={handleUpdateHavellsFan}
            soundEnabled={settings.clickSound}
            demoMode={settings.demoMode}
            onToggleDemoMode={() => handleUpdateSettings({ demoMode: !settings.demoMode })}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentView === 'screenshare' && (
          <ScreenShareHub
            soundEnabled={settings.clickSound}
          />
        )}

        {currentView === 'settings' && (
          <SettingsHub
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            wakeLockActive={telemetry.wakeLockActive}
            onToggleWakeLock={handleToggleWakeLock}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="mt-auto py-4 px-6 border-t border-slate-900 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div>
          <span>ORYQEN ASSISTANT v1.2</span>
          <span className="mx-2">·</span>
          <span>TABLET USB MOUSE ARCHITECTURE</span>
        </div>
        <div className="flex items-center gap-3">
          <span>NETLIFY STATIC READY</span>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => setCurrentView('settings')}
            className="text-cyan-400 hover:underline cursor-pointer"
          >
            System Diagnostics
          </button>
        </div>
      </footer>

    </div>
  );
}
