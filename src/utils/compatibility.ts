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

  // Detect if on mobile / Android device
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isSamsung = typeof navigator !== 'undefined' && /Samsung/i.test(navigator.userAgent);

  // Check Screen Capture
  const screenCaptureApiExists = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
  // On Android, getDisplayMedia is either completely unavailable or strictly sandboxed to browser tab sharing
  const screenCaptureSupported = screenCaptureApiExists && !isAndroid;

  // Check Battery API
  const batterySupported = 'getBattery' in navigator;

  // Check WebRTC
  const webrtcSupported = 'RTCPeerConnection' in window;

  // Check Fullscreen
  const fullscreenSupported = !!(
    document.fullscreenEnabled ||
    (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled
  );

  // Check Touchscreen & Multi-Touch Digitizer
  const touchSupported = Boolean(isClient && ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)));
  const maxTouchPoints = isClient ? (navigator.maxTouchPoints || 0) : 0;

  // Check Vibration Motor (Haptic Feedback)
  const vibrationSupported = isClient && 'vibrate' in navigator;

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
        ? 'Browser supports Web Speech Recognition for push-to-talk voice directives.'
        : 'Not supported on this browser engine. Chrome or Edge for Android recommended.',
      recommendation: speechRecogSupported ? undefined : 'Install Chrome or Kiwi Browser for speech recognition.'
    },
    {
      id: 'wake-word',
      name: 'Continuous Background Wake-Word',
      supported: false, // Honestly unsupported in web browsers
      details: 'Always-on background wake-word listening ("Alexa", "Hey Oryqen") is blocked by browser sandbox and battery suspension.',
      recommendation: 'Use Push-to-Talk in-tab. Continuous background listening requires an Android native foreground service.'
    },
    {
      id: 'speech-synthesis',
      name: 'Speech Synthesis (TTS)',
      supported: speechSynthSupported,
      details: speechSynthSupported
        ? 'Browser can vocalize natural Alexa-style spoken responses through device speakers.'
        : 'Speech synthesis is disabled or unavailable.',
      recommendation: speechSynthSupported ? undefined : 'Ensure Google Speech Services / Samsung TTS is enabled in Android settings.'
    },
    {
      id: 'screen-capture',
      name: 'Full OS Screen Capture',
      supported: false, // Honesty: Web pages on Android 14 cannot capture system screen
      details: screenCaptureApiExists
        ? (isAndroid 
            ? 'Browser API exists but Android 14 One UI 6 blocks system-wide capture from web tabs for security.'
            : 'Desktop browser capture available. On Android, full-screen capture is restricted.')
        : 'getDisplayMedia API is not available on this mobile browser.',
      recommendation: 'Requires the Android Companion App (MediaProjection API) or scrcpy via USB/Wi-Fi.'
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
      id: 'touch-digitizer',
      name: 'Touchscreen Multi-Touch',
      supported: touchSupported,
      details: touchSupported
        ? `Hardware digitizer supports up to ${maxTouchPoints} simultaneous touch points with gesture navigation.`
        : 'Touch digitizer offline or broken. Use USB mouse or external trackball.',
      recommendation: touchSupported ? undefined : 'Enable Ghost Touch Shield in Settings if damaged glass produces phantom clicks.'
    },
    {
      id: 'haptic-vibration',
      name: 'Haptic Vibration Motor',
      supported: vibrationSupported,
      details: vibrationSupported
        ? 'Hardware vibration motor ready for tactile click feedback on Samsung M33/tablets.'
        : 'Vibration API unavailable or unsupported on this device.',
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
