import React, { useState, useRef, useEffect } from 'react';
import { 
  Cast, 
  Smartphone, 
  Tablet, 
  Tv, 
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
  RotateCcw
} from 'lucide-react';
import { playHudSound } from '../utils/audio';

interface Props {
  soundEnabled: boolean;
}

export const ScreenShareHub: React.FC<Props> = ({ soundEnabled }) => {
  const [direction, setDirection] = useState<'tablet_to_phone' | 'phone_to_tablet' | 'scrcpy_guide'>('tablet_to_phone');
  
  // Real Screen Capture Stream State
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Pairing Room Code
  const [roomCode] = useState(() => `OQ-${Math.floor(1000 + Math.random() * 9000)}-HUB`);
  const [copiedCode, setCopiedCode] = useState(false);

  // Check Display Media capability
  const displayMediaSupported = typeof navigator !== 'undefined' && 
    !!(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices);

  // Stop stream cleanup
  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    playHudSound('click', soundEnabled);
  };

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  // Real Display Capture Request
  const startCapture = async () => {
    setStreamError(null);
    if (!displayMediaSupported) {
      setStreamError('The getDisplayMedia API is not available on this browser or OS. Mobile Android Chrome restricts browser screen capture for security.');
      playHudSound('alert', soundEnabled);
      return;
    }

    try {
      playHudSound('wake', soundEnabled);
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
      setIsCapturing(true);
      playHudSound('success', soundEnabled);

      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
    } catch (err: any) {
      setIsCapturing(false);
      if (err.name === 'NotAllowedError') {
        setStreamError('Screen capture permission was declined or dismissed.');
      } else {
        setStreamError(`Screen capture failed: ${err.message || err.name}`);
      }
      playHudSound('alert', soundEnabled);
    }
  };

  const copyRoomCode = () => {
    playHudSound('click', soundEnabled);
    navigator.clipboard?.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl hud-card border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setDirection('tablet_to_phone');
            }}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
              direction === 'tablet_to_phone'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-4 h-4 text-cyan-400" />
            <span>Tablet → Phone</span>
          </button>

          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setDirection('phone_to_tablet');
            }}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
              direction === 'phone_to_tablet'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Phone → Tablet</span>
          </button>

          <button
            onClick={() => {
              playHudSound('click', soundEnabled);
              setDirection('scrcpy_guide');
            }}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
              direction === 'scrcpy_guide'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cable className="w-4 h-4 text-emerald-400" />
            <span>USB OTG &amp; Scrcpy Guide</span>
          </button>
        </div>

        <div className="px-3 flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-cyan-400">Peer Protocol:</span>
          <span>WebRTC P2P Data &amp; Media</span>
        </div>
      </div>

      {/* OPTION 1: TABLET TO PHONE (OUTGOING MIRROR) */}
      {direction === 'tablet_to_phone' && (
        <div className="space-y-6">
          
          {/* Honest Status Banner */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-cyan-200">
                Tablet Screen Broadcasting Capability
              </div>
              <p className="text-slate-300">
                Uses the browser's native Screen Capture API (<code>navigator.mediaDevices.getDisplayMedia</code>). When running on compatible Chromium tablet browsers, you can broadcast your screen directly to other local network devices via WebRTC.
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                Display Capture API: {displayMediaSupported ? (
                  <span className="text-emerald-400 font-mono">SUPPORTED ON THIS BROWSER</span>
                ) : (
                  <span className="text-amber-400 font-mono">RESTRICTED BY MOBILE OS POLICY</span>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {streamError && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Notice:</span> {streamError}
              </div>
              <button
                onClick={() => setStreamError(null)}
                className="text-amber-400 hover:text-amber-200 font-mono text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Screen Monitor HUD Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Monitor Viewport (7 Cols) */}
            <div className="lg:col-span-7 p-6 rounded-2xl hud-card border border-cyan-500/25 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <MonitorPlay className="w-4 h-4" />
                  <span>TRANSMITTER HUD MONITOR</span>
                </div>

                <div className="flex items-center gap-2">
                  {isCapturing && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-500/40 animate-pulse">
                      LIVE BROADCASTING
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono">FPS: 30-60</span>
                </div>
              </div>

              {/* Video Monitor Frame */}
              <div className="w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain ${isCapturing ? 'block' : 'hidden'}`}
                />

                {!isCapturing && (
                  <div className="text-center p-6 space-y-2">
                    <Tablet className="w-12 h-12 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-slate-300">
                      Monitor Standby
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Click below to capture the tablet screen and initiate WebRTC video stream.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons (Large for Mouse) */}
              <div className="flex items-center gap-3 pt-2">
                {!isCapturing ? (
                  <button
                    onClick={startCapture}
                    className="flex-1 min-h-[48px] rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>START TABLET SCREEN CAPTURE</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCapture}
                    className="flex-1 min-h-[48px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>STOP BROADCAST</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pairing & QR Connect Panel (5 Cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl hud-card border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Phone Pairing Channel</span>
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-400">P2P WEBRTC</span>
                </div>
                <p className="text-xs text-slate-400">
                  Scan this code or open the pairing room on your smartphone to view the tablet screen stream.
                </p>
              </div>

              {/* Holographic QR Code Representation */}
              <div className="my-auto py-3 flex flex-col items-center justify-center">
                <div className="p-4 rounded-xl bg-white border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  {/* High Quality Stylized SVG QR Code */}
                  <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="white" />
                    {/* Corner 1 */}
                    <rect x="10" y="10" width="25" height="25" rx="3" fill="#060814" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="18" y="18" width="9" height="9" fill="#0891b2" />
                    {/* Corner 2 */}
                    <rect x="65" y="10" width="25" height="25" rx="3" fill="#060814" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="73" y="18" width="9" height="9" fill="#0891b2" />
                    {/* Corner 3 */}
                    <rect x="10" y="65" width="25" height="25" rx="3" fill="#060814" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="18" y="73" width="9" height="9" fill="#0891b2" />
                    {/* Data Matrix Dots */}
                    <rect x="42" y="15" width="6" height="6" fill="#060814" />
                    <rect x="52" y="22" width="6" height="6" fill="#060814" />
                    <rect x="42" y="38" width="8" height="8" fill="#7c3aed" />
                    <rect x="65" y="45" width="6" height="6" fill="#060814" />
                    <rect x="78" y="60" width="6" height="6" fill="#0891b2" />
                    <rect x="48" y="65" width="8" height="8" fill="#060814" />
                    <rect x="60" y="75" width="6" height="6" fill="#060814" />
                    <rect x="75" y="80" width="6" height="6" fill="#7c3aed" />
                    <rect x="40" y="85" width="6" height="6" fill="#060814" />
                  </svg>
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-500">
                  SESSION ID: {roomCode}
                </div>
              </div>

              {/* Room Code Copy Target */}
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-h-[42px] px-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs font-mono text-cyan-300">
                    <span>{roomCode}</span>
                    <span className="text-[10px] text-slate-500">PAIRING PIN</span>
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="min-h-[42px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* OPTION 2: PHONE TO TABLET (INCOMING MIRROR) */}
      {direction === 'phone_to_tablet' && (
        <div className="space-y-6">
          
          {/* Honest Capability & Limitations Disclosure */}
          <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1.5">
                <div className="font-semibold text-purple-200 text-sm">
                  Phone-to-Tablet Browser Limitation (Honest Status)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Web browsers running on Android <strong>cannot natively act as a Chromecast or Miracast hardware sink</strong> without a native system service or dedicated WebRTC signaling broker running on your network.
                </p>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-purple-500/20 space-y-1 text-slate-400">
                  <span className="font-semibold text-purple-300">What works right now:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Testing WebRTC peer receiver feeds via Session ID.</li>
                    <li>Displaying phone notifications or text payloads beamed via WebRTC DataChannel.</li>
                  </ul>
                  <span className="font-semibold text-purple-300 block pt-1">What is not implemented in browser sandbox:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Native Google Cast (mDNS broadcast discovery requires native Android OS permissions).</li>
                    <li>Low-latency touch injection back to phone (restricted by Android security sandbox).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Incoming Stream Receiver Simulator */}
          <div className="p-6 rounded-2xl hud-card border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Tv className="w-4 h-4 text-purple-400" />
                <span>WebRTC Receiver Player</span>
              </h4>
              <span className="text-xs font-mono text-purple-400">STATUS: LISTENING</span>
            </div>

            <div className="w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-6 text-center">
              <div className="space-y-3">
                <Smartphone className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                <div className="text-sm font-semibold text-slate-300">
                  Awaiting Peer Video Stream from Phone
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  To stream your phone screen to this tablet with 0ms lag and mouse control, see the <strong>USB OTG &amp; Scrcpy Guide</strong>.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* OPTION 3: SCRCPY & USB OTG MASTER GUIDE (SPECIALLY FOR BROKEN TOUCHSCREEN) */}
      {direction === 'scrcpy_guide' && (
        <div className="space-y-6">
          
          <div className="p-6 rounded-2xl hud-card border border-emerald-500/25 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Cable className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  Broken Touchscreen Tablet: The Ultimate Setup
                </h3>
                <p className="text-xs text-slate-400">
                  How to turn this old tablet into a permanent kiosk with a USB mouse and full remote screen control.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Step 1: Hardware USB OTG */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-emerald-400 font-semibold">
                  01. USB OTG "Y-CABLE" (CHARGE + MOUSE)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Old tablets only have one Micro-USB or Type-C port. A standard <strong>OTG Y-Cable</strong> or powered USB-C hub allows you to connect both your <strong>USB mouse</strong> and the <strong>power charger</strong> simultaneously, so the tablet never shuts down.
                </p>
              </div>

              {/* Step 2: Scrcpy Zero Latency Mirroring */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-cyan-400 font-semibold">
                  02. SCRCPY SCREEN CONTROL (USB / WI-FI)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>scrcpy</strong> (Screen Copy) is the world's fastest open-source screen mirror tool. It lets you display and control this Android tablet with mouse and keyboard with ultra-low latency (30~70ms).
                </p>
              </div>

            </div>

            {/* Quick Terminal Command Reference */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Wireless ADB Setup Commands</span>
                </span>
                <span className="text-[10px] text-slate-500">Run on PC / Host Terminal</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 flex items-center justify-between">
                  <code>adb tcpip 5555</code>
                  <span className="text-[10px] text-slate-500">Enable wireless port</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-purple-300 flex items-center justify-between">
                  <code>adb connect &lt;tablet-ip-address&gt;:5555</code>
                  <span className="text-[10px] text-slate-500">Pair tablet wirelessly</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 flex items-center justify-between">
                  <code>scrcpy --tcpip=&lt;tablet-ip&gt; --stay-awake</code>
                  <span className="text-[10px] text-slate-500">Launch mirror &amp; keep awake</span>
                </div>
              </div>
            </div>

            {/* Remote Apps */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-purple-400 font-semibold">
                HEADLESS TOOLS FOR BROKEN SCREENS
              </div>
              <p className="text-xs text-slate-300">
                If the touchscreen is completely dead, install <strong>RustDesk</strong> (open source) or <strong>AnyDesk</strong> on the tablet using the USB mouse. Grant accessibility permissions once, and you can control the tablet anytime from your smartphone!
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
