import { BrowserCapability } from '../types';

export function checkBrowserCapabilities(): BrowserCapability[] {
  const isClient = typeof window !== 'undefined';
  if (!isClient) return [];

  // Check Speech Recognition
  const speechRecogSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  
  // Check Speech Synthesis
  const speechSynthSupported = 'speechSynthesis' in window;

  // Check Web Audio
  const webAudioSupported = 'AudioContext' in window || 'webkitAudioContext' in window;

  // Check Wake Lock
  const wakeLockSupported = 'wakeLock' in navigator;

  // Check Screen Capture
  const screenCaptureSupported = !!(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices);

  // Check Battery API
  const batterySupported = 'getBattery' in navigator;

  // Check WebRTC
  const webrtcSupported = 'RTCPeerConnection' in window;

  // Check Fullscreen
  const fullscreenSupported = !!(
    document.fullscreenEnabled ||
    (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled
  );

  // Check LocalStorage
  let localStorageSupported = false;
  try {
    localStorage.setItem('__oryqen_test', '1');
    localStorage.removeItem('__oryqen_test');
    localStorageSupported = true;
  } catch {
    localStorageSupported = false;
  }

  return [
    {
      id: 'speech-recognition',
      name: 'Speech Recognition (STT)',
      supported: speechRecogSupported,
      details: speechRecogSupported
        ? 'Browser supports Web Speech Recognition for voice control.'
        : 'Not supported on this browser engine. Chrome or Edge for Android recommended.',
      recommendation: speechRecogSupported ? undefined : 'Install Chrome or Kiwi Browser for full speech recognition.'
    },
    {
      id: 'speech-synthesis',
      name: 'Speech Synthesis (TTS)',
      supported: speechSynthSupported,
      details: speechSynthSupported
        ? 'Browser can vocalize responses through tablet speakers.'
        : 'Speech synthesis is disabled or unavailable.',
      recommendation: speechSynthSupported ? undefined : 'Ensure Google Text-to-Speech is enabled in Android settings.'
    },
    {
      id: 'wake-lock',
      name: 'Screen Wake Lock API',
      supported: wakeLockSupported,
      details: wakeLockSupported
        ? 'Can prevent tablet screen from sleeping while plugged in or mounted.'
        : 'Wake lock not supported on this browser version.',
      recommendation: wakeLockSupported ? undefined : 'Enable "Stay Awake" in Android Developer Options while charging.'
    },
    {
      id: 'screen-capture',
      name: 'Display Screen Capture',
      supported: screenCaptureSupported,
      details: screenCaptureSupported
        ? 'Supports live WebRTC display capture for tablet screen broadcasting.'
        : 'Mobile browsers often restrict getDisplayMedia for security.',
      recommendation: screenCaptureSupported ? undefined : 'Use scrcpy over USB OTG/Wi-Fi for reliable low-latency mirroring.'
    },
    {
      id: 'battery-api',
      name: 'Battery Telemetry API',
      supported: batterySupported,
      details: batterySupported
        ? 'Hardware battery percentage and charging state live telemetry.'
        : 'Battery API restricted by browser privacy policy (fallback simulator active).',
      recommendation: undefined
    },
    {
      id: 'webrtc',
      name: 'WebRTC P2P Video & Data',
      supported: webrtcSupported,
      details: webrtcSupported
        ? 'Ready for peer-to-peer screen streaming between phone and tablet.'
        : 'WebRTC runtime is unavailable.',
      recommendation: undefined
    },
    {
      id: 'web-audio',
      name: 'Web Audio Synthesizer',
      supported: webAudioSupported,
      details: webAudioSupported
        ? 'Generates sci-fi acoustic chime feedback with zero external latency.'
        : 'Audio Context is disabled or blocked by policy.',
      recommendation: undefined
    },
    {
      id: 'fullscreen',
      name: 'Fullscreen Tablet Kiosk',
      supported: fullscreenSupported,
      details: fullscreenSupported
        ? 'Can enter immersive full-screen mode to hide Android navigation bar.'
        : 'Fullscreen API is disabled.',
      recommendation: undefined
    },
    {
      id: 'local-storage',
      name: 'Local Storage State Persistence',
      supported: localStorageSupported,
      details: localStorageSupported
        ? 'Configurations and custom settings persist across tablet reboots.'
        : 'Cookies/storage disabled or incognito storage limits reached.',
      recommendation: undefined
    }
  ];
}
