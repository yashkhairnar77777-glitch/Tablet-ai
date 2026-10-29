export type NavView = 'home' | 'voice' | 'smarthome' | 'screenshare' | 'settings';

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  city: string;
  isDay: boolean;
  weatherCode: number;
}

export interface TelemetryData {
  batteryLevel: number | null;
  isCharging: boolean | null;
  isOnline: boolean;
  screenResolution: string;
  pixelRatio: number;
  uptimeSeconds: number;
  wakeLockActive: boolean;
}

export interface SmartThingsDevice {
  id: string;
  label: string;
  room: string;
  type: 'light' | 'switch' | 'tv' | 'sensor';
  power: boolean;
  level?: number; // 0 - 100 for dimmer
  color?: string;
  status: 'online' | 'offline' | 'simulated';
  powerUsageWatts?: number;
}

export interface HavellsFanState {
  power: boolean;
  speed: number; // 1 - 5
  breezeMode: boolean;
  timerMinutes: number; // 0 = off, 60, 120, 240, 480
  direction: 'forward' | 'reverse'; // summer vs winter
  underlight: {
    enabled: boolean;
    brightness: number; // 10 - 100
    temp: 'warm' | 'neutral' | 'cool';
  };
  connected: boolean;
  bridgeType: 'demo' | 'tuya_cloud' | 'localtuya' | 'mqtt';
  estimatedRpm: number;
}

export interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: string;
}

export interface AppSettings {
  demoMode: boolean;
  pointerSpotlight: boolean;
  pointerColor: 'cyan' | 'violet' | 'amber';
  clickSound: boolean;
  speechVoiceUri: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  autoListenAfterReply: boolean;
  wakeLockEnabled: boolean;
  uiScale: 'compact' | 'standard' | 'large' | 'kiosk';
  highContrast: boolean;
  smartThingsPat: string;
  havellsBridgeIp: string;
  havellsLocalKey: string;
}

export interface BrowserCapability {
  id: string;
  name: string;
  supported: boolean;
  details: string;
  recommendation?: string;
}
