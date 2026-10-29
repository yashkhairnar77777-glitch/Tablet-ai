import React, { useState, useEffect } from 'react';
import { 
  AppSettings, 
  BrowserCapability 
} from '../types';
import { checkBrowserCapabilities } from '../utils/compatibility';
import { 
  MousePointer, 
  Volume2, 
  Eye, 
  Sliders, 
  ShieldCheck, 
  Cloud, 
  Github, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Maximize, 
  Minimize, 
  RefreshCw,
  Copy,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { playHudSound } from '../utils/audio';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
}

export const SettingsHub: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  isFullscreen,
  onToggleFullscreen,
  wakeLockActive,
  onToggleWakeLock
}) => {
  const [capabilities, setCapabilities] = useState<BrowserCapability[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [copiedToml, setCopiedToml] = useState(false);

  useEffect(() => {
    setCapabilities(checkBrowserCapabilities());

    // Load speech synthesis voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleTestVoice = () => {
    playHudSound('wake', settings.clickSound);
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance('ORYQEN assistant audio test. Synthesizer calibrated.');
    if (settings.speechVoiceUri) {
      const found = availableVoices.find(v => v.voiceURI === settings.speechVoiceUri);
      if (found) utt.voice = found;
    }
    utt.rate = settings.speechRate;
    utt.pitch = settings.speechPitch;
    utt.volume = settings.speechVolume;
    window.speechSynthesis.speak(utt);
  };

  const netlifyTomlContent = `[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build]
  publish = "dist"
  command = "npm run build"`;

  const handleCopyToml = () => {
    playHudSound('click', settings.clickSound);
    navigator.clipboard?.writeText(netlifyTomlContent);
    setCopiedToml(true);
    setTimeout(() => setCopiedToml(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
      
      {/* Title */}
      <div className="p-5 rounded-2xl hud-card border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Settings &amp; Accessibility Console</span>
          </h2>
          <p className="text-xs text-slate-400">
            Customize USB mouse navigation, vocalizer parameters, and audit device capabilities.
          </p>
        </div>

        <button
          onClick={() => {
            playHudSound('click', settings.clickSound);
            onToggleFullscreen();
          }}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 text-xs font-mono font-medium flex items-center gap-2 cursor-pointer transition-colors"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Tablet Kiosk Fullscreen'}</span>
        </button>
      </div>

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module 1: USB Mouse & Broken Screen Accessibility */}
        <div className="p-6 rounded-2xl hud-card border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <MousePointer className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              USB Mouse &amp; Display Ergonomics
            </h3>
          </div>

          {/* Pointer Spotlight Halo */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">Mouse Pointer Spotlight</div>
              <p className="text-xs text-slate-400">
                Draws a glowing targeting ring around mouse pointer (essential for cracked/scratched tablet glass).
              </p>
            </div>
            <button
              onClick={() => {
                playHudSound('toggle', settings.clickSound);
                onUpdateSettings({ pointerSpotlight: !settings.pointerSpotlight });
              }}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                settings.pointerSpotlight
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}
            >
              {settings.pointerSpotlight ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Spotlight Color */}
          {settings.pointerSpotlight && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-mono text-slate-400">Spotlight Halo Color</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cyan', 'violet', 'amber'] as const).map((clr) => (
                  <button
                    key={clr}
                    onClick={() => {
                      playHudSound('click', settings.clickSound);
                      onUpdateSettings({ pointerColor: clr });
                    }}
                    className={`min-h-[40px] rounded-lg text-xs font-mono capitalize border transition-all cursor-pointer ${
                      settings.pointerColor === clr
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {clr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* UI Scale / Zoom for Tablet Size */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-200">UI Scale for Tablet</div>
              <span className="text-xs font-mono text-cyan-400 capitalize">{settings.uiScale}</span>
            </div>
            <p className="text-xs text-slate-400">
              Adjusts touch and mouse target sizing for low-resolution or high-DPI Android screens.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {(['compact', 'standard', 'large', 'kiosk'] as const).map((sc) => (
                <button
                  key={sc}
                  onClick={() => {
                    playHudSound('click', settings.clickSound);
                    onUpdateSettings({ uiScale: sc });
                  }}
                  className={`min-h-[40px] rounded-lg text-xs font-mono capitalize border transition-all cursor-pointer ${
                    settings.uiScale === sc
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Feedback */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div>
              <div className="text-sm font-medium text-slate-200">Acoustic HUD Feedback</div>
              <p className="text-xs text-slate-400">
                Synthesized Web Audio chimes on mouse clicks and directives.
              </p>
            </div>
            <button
              onClick={() => {
                const next = !settings.clickSound;
                onUpdateSettings({ clickSound: next });
                playHudSound('toggle', next);
              }}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                settings.clickSound
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}
            >
              {settings.clickSound ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Screen Wake Lock */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div>
              <div className="text-sm font-medium text-slate-200">Keep Screen Awake (Wake Lock)</div>
              <p className="text-xs text-slate-400">
                Prevents Android OS from sleeping while tablet is mounted on a stand.
              </p>
            </div>
            <button
              onClick={() => {
                playHudSound('toggle', settings.clickSound);
                onToggleWakeLock();
              }}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                wakeLockActive
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}
            >
              {wakeLockActive ? 'LOCKED ON' : 'DISABLED'}
            </button>
          </div>

          {/* High Contrast Mode */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div>
              <div className="text-sm font-medium text-slate-200">High Contrast Mode</div>
              <p className="text-xs text-slate-400">
                Boosts luminance and border contrast for damaged tablet digitizers.
              </p>
            </div>
            <button
              onClick={() => {
                playHudSound('toggle', settings.clickSound);
                onUpdateSettings({ highContrast: !settings.highContrast });
              }}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                settings.highContrast
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}
            >
              {settings.highContrast ? 'ACTIVE' : 'STANDARD'}
            </button>
          </div>

        </div>

        {/* Module 2: Voice & TTS Synthesis Calibration */}
        <div className="p-6 rounded-2xl hud-card border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Volume2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Voice Synthesis Calibration
            </h3>
          </div>

          {/* Voice Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400">
              System Speech Voice ({availableVoices.length} Detected)
            </label>
            <select
              value={settings.speechVoiceUri}
              onChange={(e) => onUpdateSettings({ speechVoiceUri: e.target.value })}
              className="w-full min-h-[46px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="">Default System Engine</option>
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Speech Speed Rate</span>
              <span className="text-purple-300 font-bold">{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Speech Pitch Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Voice Pitch</span>
              <span className="text-purple-300 font-bold">{settings.speechPitch}</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.05"
              value={settings.speechPitch}
              onChange={(e) => onUpdateSettings({ speechPitch: parseFloat(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Speech Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>TTS Volume</span>
              <span className="text-purple-300 font-bold">{Math.round(settings.speechVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.speechVolume}
              onChange={(e) => onUpdateSettings({ speechVolume: parseFloat(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Test Voice Button */}
          <div className="pt-3">
            <button
              onClick={handleTestVoice}
              className="w-full min-h-[46px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>TEST VOCALIZER OUTPUT</span>
            </button>
          </div>

        </div>

      </div>

      {/* Module 3: Browser Capabilities & Compatibility Audit Checklist */}
      <div className="p-6 rounded-2xl hud-card border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Device Compatibility &amp; Browser API Audit
            </h3>
          </div>

          <button
            onClick={() => {
              playHudSound('click', settings.clickSound);
              setCapabilities(checkBrowserCapabilities());
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Audit APIs</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                cap.supported
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">{cap.name}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  cap.supported
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {cap.supported ? 'SUPPORTED' : 'UNAVAILABLE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{cap.details}</p>
              {cap.recommendation && (
                <div className="text-[10px] text-amber-300/90 font-mono pt-1">
                  💡 Tip: {cap.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Module 4: Deployment Ready Guide (Netlify & GitHub) */}
      <div className="p-6 rounded-2xl hud-card border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Netlify &amp; GitHub Free Deployment Specification
            </h3>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
            100% Client-Side Pure SPA
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          ORYQEN Assistant is engineered as a lightweight, zero-cost static single-page application. All credentials remain in the tablet's browser storage without any server exposure.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-2">
              <Github className="w-4 h-4" />
              <span>Deploy via GitHub Repository</span>
            </div>
            <ol className="text-xs text-slate-400 space-y-1 list-decimal pl-4">
              <li>Push this codebase to your GitHub repository.</li>
              <li>Log in to Netlify (free tier) and click "Import from Git".</li>
              <li>Set Build Command to: <code className="font-mono text-cyan-300">npm run build</code></li>
              <li>Set Publish Directory to: <code className="font-mono text-cyan-300">dist</code></li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-semibold text-purple-400">
              <span>netlify.toml (SPA Routing)</span>
              <button
                onClick={handleCopyToml}
                className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedToml ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
              {netlifyTomlContent}
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
};
