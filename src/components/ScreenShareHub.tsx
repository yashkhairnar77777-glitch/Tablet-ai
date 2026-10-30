import React, { useState, useRef, useEffect } from 'react';
import { 
  Cast, 
  Smartphone, 
  Tablet, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Cable, 
  Terminal, 
  HelpCircle,
  QrCode,
  ShieldAlert,
  MonitorPlay,
  RotateCcw,
  Layers,
  Code2,
  Lock,
  Radio,
  Wifi
} from 'lucide-react';
import { BrowserCaptureState } from '../types';
import { playHudSound } from '../utils/audio';

interface Props {
  soundEnabled: boolean;
}

export const ScreenShareHub: React.FC<Props> = ({ soundEnabled }) => {
  const [activeTab, setActiveTab] = useState<'browser_test' | 'companion_spec' | 'scrcpy_guide'>('browser_test');
  
  // Real Screen Capture Stream State
  const [captureState, setCaptureState] = useState<BrowserCaptureState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamResolution, setStreamResolution] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check Display Media capability accurately
  const isDisplayMediaSupported = typeof navigator !== 'undefined' && 
    !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
  
  // Check if running on Android
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  // Stop capture and release all media tracks completely
  const stopCapture = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCaptureState('idle');
    setStreamResolution(null);
    playHudSound('click', soundEnabled);
  };

  // Ensure tracks are stopped on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Request display capture strictly after user gesture
  const startCapture = async () => {
    setErrorMessage(null);

    if (!isDisplayMediaSupported) {
      setCaptureState('unsupported');
      setErrorMessage('navigator.mediaDevices.getDisplayMedia is not supported by this browser engine.');
      playHudSound('alert', soundEnabled);
      return;
    }

    setCaptureState('requesting');
    playHudSound('wake', soundEnabled);

    try {
      // Prompt user for display capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setStreamResolution(`${settings.width} × ${settings.height}`);
        }

        // Listen for user stopping share via browser native banner
        videoTrack.onended = () => {
          stopCapture();
        };
      }

      setCaptureState('capturing');
      playHudSound('success', soundEnabled);
    } catch (err: any) {
      stopCapture();
      if (err.name === 'NotAllowedError') {
        setCaptureState('permission_denied');
        setErrorMessage('Display capture permission was denied or dismissed by the user.');
      } else if (err.name === 'NotSupportedError') {
        setCaptureState('unsupported');
        setErrorMessage('Android OS policy blocks browser-level display capture. Full-screen capture on Android 14 requires a native MediaProjection foreground service.');
      } else {
        setCaptureState('error');
        setErrorMessage(`Capture failed: ${err.message || err.name}`);
      }
      playHudSound('alert', soundEnabled);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 space-y-4">
      
      {/* Navigation Sub-Tabs */}
      <div className="p-2 rounded-2xl hud-card border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setActiveTab('browser_test');
            }}
            className={`flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-press ${
              activeTab === 'browser_test'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MonitorPlay className="w-4 h-4 text-cyan-400" />
            <span>Browser Capture Probe</span>
          </button>

          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setActiveTab('companion_spec');
            }}
            className={`flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-press ${
              activeTab === 'companion_spec'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Samsung M33 Companion Spec</span>
          </button>

          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setActiveTab('scrcpy_guide');
            }}
            className={`flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-press ${
              activeTab === 'scrcpy_guide'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cable className="w-4 h-4 text-emerald-400" />
            <span>Scrcpy &amp; ADB Guide</span>
          </button>
        </div>

        <div className="px-3 flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-cyan-400 font-semibold">Target Hardware:</span>
          <span>Samsung Galaxy M33 (Android 14)</span>
        </div>
      </div>

      {/* TAB 1: BROWSER CAPTURE PROBE & HONEST TESTING */}
      {activeTab === 'browser_test' && (
        <div className="space-y-4">
          
          {/* Honest Status Breakdown */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-semibold text-cyan-200 text-sm">
                  Technical Truth: Webpage vs. Full Android 14 Screen Mirroring
                </div>
                <p className="text-slate-300 leading-relaxed">
                  A standard webpage <strong>cannot reliably capture the entire Samsung Galaxy M33 operating system from within itself</strong>. Android 14 (One UI 6) enforces strict application sandboxing. The browser's <code>getDisplayMedia</code> API is either completely disabled on mobile Chrome, or limited strictly to sharing the active browser tab.
                </p>
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-2 flex-wrap font-mono">
                  <span>API Detected: {isDisplayMediaSupported ? 'YES' : 'NO'}</span>
                  <span>·</span>
                  <span>Environment: {isAndroid ? 'Android Mobile Engine' : 'Desktop / Emulator Engine'}</span>
                  <span>·</span>
                  <span className={captureState === 'capturing' ? 'text-emerald-400' : 'text-slate-400'}>
                    State: {captureState.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error / Permission Notification */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Capture Status Notice:</span> {errorMessage}
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-amber-400 hover:text-amber-200 font-mono text-xs cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Polished Live Preview Panel with Verified Stream */}
          <div className="p-5 md:p-6 rounded-2xl hud-card border border-cyan-500/25 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <MonitorPlay className="w-4 h-4" />
                <span>BROWSER DISPLAY PREVIEW MONITOR</span>
              </div>

              <div className="flex items-center gap-2">
                {captureState === 'capturing' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/90 text-red-300 border border-red-500/40 animate-pulse">
                    LIVE MEDIA STREAM
                  </span>
                )}
                {streamResolution && (
                  <span className="text-xs text-slate-400 font-mono">{streamResolution}</span>
                )}
              </div>
            </div>

            {/* Live Video Element (No fake images, honest stream only) */}
            <div className="w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${captureState === 'capturing' ? 'block' : 'hidden'}`}
              />

              {captureState !== 'capturing' && (
                <div className="text-center p-6 space-y-2">
                  <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">
                    {captureState === 'requesting' ? 'Requesting Browser Permission...' : 'Stream Standby (Not Capturing)'}
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {captureState === 'requesting'
                      ? 'Select screen or tab in your browser prompt to begin rendering.'
                      : 'Tap the button below to test if this browser allows live display capture. On Samsung M33 Android 14, system capture will trigger an OS restriction.'}
                  </p>
                </div>
              )}
            </div>

            {/* Start / Stop Controls (Large 48px hit targets for touch or mouse) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {captureState !== 'capturing' ? (
                <button
                  onClick={startCapture}
                  disabled={captureState === 'requesting'}
                  className="w-full sm:flex-1 min-h-[48px] rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] touch-press disabled:opacity-60"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>START BROWSER DISPLAY CAPTURE</span>
                </button>
              ) : (
                <button
                  onClick={stopCapture}
                  className="w-full sm:flex-1 min-h-[48px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)] touch-press"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>STOP CAPTURE &amp; RELEASE TRACKS</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: NATIVE ANDROID COMPANION APP ARCHITECTURE (SAMSUNG M33 / ANDROID 14) */}
      {activeTab === 'companion_spec' && (
        <div className="space-y-4">
          
          <div className="p-5 md:p-6 rounded-2xl hud-card border border-purple-500/25 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Samsung Galaxy M33 Android 14 Native Companion Spec
                </h3>
                <p className="text-xs text-slate-400">
                  Required MediaProjection architecture to mirror the entire phone screen into this web dashboard.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Because Android 14 One UI 6 forbids web browsers from capturing outside their own viewports, a native lightweight Android companion app or foreground service is the standard engineering pattern.
            </p>

            {/* 4-Step Architecture Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                  <span>01. Android 14 Foreground Service</span>
                </div>
                <p className="text-xs text-slate-300">
                  Must declare <code className="font-mono text-purple-300">FOREGROUND_SERVICE_MEDIA_PROJECTION</code> in <code className="font-mono text-slate-400">AndroidManifest.xml</code> with an active user-visible notification channel before starting screen capture.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <span>02. MediaProjection Intent Flow</span>
                </div>
                <p className="text-xs text-slate-300">
                  Companion app calls <code className="font-mono text-cyan-300">mediaProjectionManager.createScreenCaptureIntent()</code>, triggering Samsung's system warning prompt ("Start recording or casting?").
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>03. VirtualDisplay &amp; Hardware Encoder</span>
                </div>
                <p className="text-xs text-slate-300">
                  Native service binds the MediaProjection token to a <code className="font-mono text-emerald-300">VirtualDisplay</code>, pipeing 1080×2408 frames directly into hardware H.264/VP8 <code className="font-mono text-slate-400">MediaCodec</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <span>04. Secure Local Delivery to Dashboard</span>
                </div>
                <p className="text-xs text-slate-300">
                  Transmits encoded frames over a local encrypted WebRTC P2P channel (DTLS-SRTP) or authenticated local WebSocket (<code className="font-mono text-amber-300">wss://192.168.x.x:8443</code>) directly to this web app.
                </p>
              </div>

            </div>

            {/* Kotlin Code Snippet */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Kotlin Companion Implementation (Android 14)</span>
                </span>
                <span className="text-[10px] text-slate-500">Android 14 (API 34)</span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`// AndroidManifest.xml (Android 14 One UI 6)
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

// MediaProjection Capture Service
class OryqenCaptureService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildOngoingNotification()
        // Required for Android 14
        ServiceCompat.startForeground(
            this, NOTIF_ID, notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
        )
        val projection = projectionManager.getMediaProjection(resultCode, data)
        virtualDisplay = projection.createVirtualDisplay(
            "OryqenMirror", 1080, 2408, dpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            mediaCodecSurface, null, null
        )
        return START_STICKY
    }
}`}
              </pre>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: SCRCPY & WIRELESS ADB GUIDE (IMMEDIATELY USABLE WITH ZERO APP CODING) */}
      {activeTab === 'scrcpy_guide' && (
        <div className="space-y-4">
          
          <div className="p-5 md:p-6 rounded-2xl hud-card border border-emerald-500/25 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Cable className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Samsung Galaxy M33 Mirroring via Scrcpy (0ms Lag)
                </h3>
                <p className="text-xs text-slate-400">
                  The recommended, free, open-source method to mirror and control your Samsung M33 screen without root.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono font-bold text-emerald-400">
                  01. Enable Samsung Developer Options
                </div>
                <p className="text-xs text-slate-300">
                  On your Samsung Galaxy M33: Go to <strong>Settings → About Phone → Software Information</strong>. Tap <strong>Build Number</strong> 7 times until Developer Mode is activated.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono font-bold text-cyan-400">
                  02. Enable Wireless Debugging (Android 14)
                </div>
                <p className="text-xs text-slate-300">
                  In <strong>Settings → Developer Options</strong>, enable <strong>USB Debugging</strong> and <strong>Wireless Debugging</strong>. Pair with your local Wi-Fi network.
                </p>
              </div>

            </div>

            {/* Quick Command Box */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Terminal Directives (PC, Mac, or Local Terminal)</span>
                </span>
                <span className="text-[10px] text-slate-500">Free Open-Source Scrcpy</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 flex items-center justify-between">
                  <code>adb pair 192.168.1.xxx:&lt;port&gt; &lt;pairing-code&gt;</code>
                  <span className="text-[10px] text-slate-500">Pair M33</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-purple-300 flex items-center justify-between">
                  <code>adb connect 192.168.1.xxx:5555</code>
                  <span className="text-[10px] text-slate-500">Connect</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 flex items-center justify-between">
                  <code>scrcpy --max-size=1600 --stay-awake --video-bit-rate=8M</code>
                  <span className="text-[10px] text-slate-500">Launch 120Hz Mirror</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
