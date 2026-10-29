import React, { useState, useEffect, useRef } from 'react';
import { 
  VoiceMessage, 
  HavellsFanState, 
  SmartThingsDevice, 
  TelemetryData, 
  NavView, 
  WeatherData 
} from '../types';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  AlertCircle, 
  RotateCcw, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronRight,
  HelpCircle,
  AudioLines
} from 'lucide-react';
import { playHudSound } from '../utils/audio';

interface Props {
  havellsFan: HavellsFanState;
  onUpdateHavellsFan: (updates: Partial<HavellsFanState>) => void;
  smartThingsDevices: SmartThingsDevice[];
  onToggleSmartThingsDevice: (id: string, forceState?: boolean) => void;
  telemetry: TelemetryData;
  weather?: WeatherData;
  onNavigate: (view: NavView) => void;
  soundEnabled: boolean;
  speechVoiceUri: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  autoListen: boolean;
  demoMode: boolean;
}

export const VoiceAssistant: React.FC<Props> = ({
  havellsFan,
  onUpdateHavellsFan,
  smartThingsDevices,
  onToggleSmartThingsDevice,
  telemetry,
  weather,
  onNavigate,
  soundEnabled,
  speechVoiceUri,
  speechRate,
  speechPitch,
  speechVolume,
  demoMode
}) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'ORYQEN online. Systems nominal. Ready for voice directives or manual telemetry input.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSttSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        playHudSound('wake', soundEnabled);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          handleUserCommand(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Grant permission in browser address bar or use text input.');
        } else if (event.error === 'no-speech') {
          // Silent timeout
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e: any) {
      setSttSupported(false);
      setErrorMessage('Speech Recognition initialization failed on this device.');
    }

    if (!('speechSynthesis' in window)) {
      setTtsSupported(false);
    }
  }, [soundEnabled]);

  // Scroll to bottom of message stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  // Voice output synthesizer
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      if (speechVoiceUri) {
        const found = voices.find(v => v.voiceURI === speechVoiceUri);
        if (found) utterance.voice = found;
      }
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      utterance.volume = speechVolume;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (!sttSupported) {
      setErrorMessage('Browser Speech Recognition not supported on this browser version. Use text input below.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setErrorMessage(null);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        recognitionRef.current?.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 150);
      }
    }
  };

  // Natural Language Intent Processor
  const handleUserCommand = (input: string) => {
    const raw = input.trim();
    if (!raw) return;

    const userMsg: VoiceMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: raw,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setTranscript('');

    const lower = raw.toLowerCase();
    let reply = '';
    let intent = 'general';

    // 1. Havells Fan Directives
    if (lower.includes('fan') || lower.includes('havells')) {
      intent = 'havells_fan';
      if (lower.includes('turn on') || lower.includes('start') || lower.includes('power on')) {
        onUpdateHavellsFan({ power: true });
        reply = 'Havells Smart Fan powered on at speed ' + havellsFan.speed + '.';
      } else if (lower.includes('turn off') || lower.includes('stop') || lower.includes('power off') || lower.includes('shut down')) {
        onUpdateHavellsFan({ power: false });
        reply = 'Havells Smart Fan powered off. Standing by.';
      } else if (lower.match(/speed\s*([1-5])/)) {
        const match = lower.match(/speed\s*([1-5])/);
        const lvl = parseInt(match![1], 10);
        onUpdateHavellsFan({ power: true, speed: lvl, estimatedRpm: 120 + lvl * 45 });
        reply = `Havells fan adjusted to speed level ${lvl}.`;
      } else if (lower.includes('faster') || lower.includes('increase')) {
        const nextSpeed = Math.min(5, havellsFan.speed + 1);
        onUpdateHavellsFan({ power: true, speed: nextSpeed, estimatedRpm: 120 + nextSpeed * 45 });
        reply = `Increasing fan to speed ${nextSpeed}.`;
      } else if (lower.includes('slower') || lower.includes('decrease')) {
        const nextSpeed = Math.max(1, havellsFan.speed - 1);
        onUpdateHavellsFan({ power: true, speed: nextSpeed, estimatedRpm: 120 + nextSpeed * 45 });
        reply = `Decreasing fan to speed ${nextSpeed}.`;
      } else if (lower.includes('breeze') || lower.includes('natural wind')) {
        const newState = !havellsFan.breezeMode;
        onUpdateHavellsFan({ breezeMode: newState });
        reply = newState ? 'Natural Breeze mode engaged on Havells fan.' : 'Breeze mode deactivated.';
      } else {
        reply = `Havells fan is currently ${havellsFan.power ? 'ON at speed ' + havellsFan.speed : 'OFF'}.`;
      }
    }

    // 2. SmartThings Directives
    else if (lower.includes('light') || lower.includes('lights') || lower.includes('lamp') || lower.includes('tv') || lower.includes('smartthings')) {
      intent = 'smartthings';
      if (lower.includes('turn on') || lower.includes('turn all on')) {
        smartThingsDevices.forEach(d => {
          if (!d.power) onToggleSmartThingsDevice(d.id, true);
        });
        reply = 'SmartThings hub verified. Turning on connected lighting circuits.';
      } else if (lower.includes('turn off') || lower.includes('turn all off')) {
        smartThingsDevices.forEach(d => {
          if (d.power) onToggleSmartThingsDevice(d.id, false);
        });
        reply = 'SmartThings command dispatched. Turning off connected fixtures.';
      } else if (lower.includes('tv')) {
        const tv = smartThingsDevices.find(d => d.type === 'tv');
        if (tv) {
          onToggleSmartThingsDevice(tv.id);
          reply = `Samsung Smart TV state toggled.`;
        } else {
          reply = 'Samsung TV device not registered in current profile.';
        }
      } else {
        reply = 'SmartThings commands acknowledged. You can say: "Turn all lights on" or "Turn off living room".';
      }
    }

    // 3. Time, Chrono, Weather
    else if (lower.includes('time') || lower.includes('clock')) {
      intent = 'telemetry_time';
      const now = new Date();
      reply = `The current system time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.`;
    } 
    else if (lower.includes('weather') || lower.includes('temperature') || lower.includes('rain')) {
      intent = 'telemetry_weather';
      if (weather) {
        reply = `Current conditions: ${weather.condition}, ${weather.temp} degrees Celsius with ${weather.humidity} percent humidity.`;
      } else {
        reply = 'Environmental telemetry sensors are gathering atmospheric readings.';
      }
    }

    // 4. Battery & Tablet Diagnostics
    else if (lower.includes('battery') || lower.includes('power') || lower.includes('charge')) {
      intent = 'telemetry_battery';
      const level = telemetry.batteryLevel ?? 85;
      const status = telemetry.isCharging ? 'charging via AC power' : 'running on internal battery';
      reply = `Tablet battery level is currently at ${level} percent, ${status}.`;
    }

    // 5. Navigation Directives
    else if (lower.includes('go to') || lower.includes('open') || lower.includes('navigate')) {
      intent = 'navigation';
      if (lower.includes('home') || lower.includes('dashboard')) {
        reply = 'Navigating to Home HUD.';
        onNavigate('home');
      } else if (lower.includes('smart home') || lower.includes('devices')) {
        reply = 'Opening Smart Home management console.';
        onNavigate('smarthome');
      } else if (lower.includes('screen') || lower.includes('mirror') || lower.includes('cast')) {
        reply = 'Opening Screen Sharing protocol hub.';
        onNavigate('screenshare');
      } else if (lower.includes('settings') || lower.includes('accessibility')) {
        reply = 'Accessing System Settings and tablet mouse options.';
        onNavigate('settings');
      } else {
        reply = 'Unknown destination. You can navigate to Home, Smart Home, Screen Share, or Settings.';
      }
    }

    // 6. Identity & General
    else if (lower.includes('who are you') || lower.includes('what are you')) {
      reply = 'I am ORYQEN, your high-performance tablet assistant and HUD console, designed specifically for USB mouse navigation and home automation.';
    }
    else if (lower.includes('joke')) {
      reply = 'Why did the Android tablet connect a USB mouse? Because its touchscreen had a complete nervous breakdown.';
    }
    else {
      reply = `Understood: "${raw}". I am ready for smart home directives, weather telemetry, or tablet control.`;
    }

    // Append Assistant Reply
    const assistantMsg: VoiceMessage = {
      id: `assist-${Date.now()}`,
      sender: 'assistant',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent
    };

    setMessages(prev => [...prev, assistantMsg]);
    playHudSound('success', soundEnabled);
    speakResponse(reply);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleUserCommand(manualInput);
    setManualInput('');
  };

  // Holographic Canvas Visualizer effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      step += isListening || isSpeaking ? 0.08 : 0.02;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw subtle wave
      const lines = 3;
      for (let l = 0; l < lines; l++) {
        ctx.beginPath();
        ctx.lineWidth = l === 1 ? 2.5 : 1.2;
        
        const alpha = isListening || isSpeaking ? (0.8 - l * 0.2) : (0.25 - l * 0.05);
        ctx.strokeStyle = l === 0 
          ? `rgba(6, 182, 212, ${alpha})` 
          : l === 1 
          ? `rgba(168, 85, 247, ${alpha})` 
          : `rgba(56, 189, 248, ${alpha})`;

        const amplitude = isListening ? 24 : isSpeaking ? 18 : 6;
        const frequency = isListening || isSpeaking ? 0.025 : 0.015;

        for (let x = 0; x < width; x += 4) {
          const y = centerY + Math.sin(x * frequency + step + l * 0.8) * amplitude * Math.sin((x / width) * Math.PI);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isListening, isSpeaking]);

  const commandShortcuts = [
    'Turn on Havells fan',
    'Set fan speed to 4',
    'Turn all lights off',
    'Check battery status',
    'What is the weather?',
    'What time is it?',
    'Open Screen Share'
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">
      
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl hud-card border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Voice AI &amp; Speech Core</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                sttSupported 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
              }`}>
                {sttSupported ? 'Speech STT Ready' : 'STT Restricted / Fallback'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Web Speech API recognition with real speech synthesis and local intent processing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono">
              <Volume2 className="w-4 h-4 animate-pulse text-purple-400" />
              <span>VOCALIZING...</span>
            </div>
          )}
          <button
            onClick={() => {
              if (isSpeaking) {
                window.speechSynthesis?.cancel();
                setIsSpeaking(false);
              } else {
                speakResponse('Audio vocalization test. Speech synthesis operational.');
              }
            }}
            className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
            title="Test or Stop Speech Synthesis"
          >
            {isSpeaking ? 'Mute' : 'Test TTS'}
          </button>
        </div>
      </div>

      {/* Error / Compatibility Notification if any */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Notice:</span> {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-400 hover:text-amber-200 font-mono text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Holographic Voice Orb & Waveform Section */}
      <div className="p-6 md:p-8 rounded-2xl hud-card border border-cyan-500/25 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-[0_4px_30px_rgba(6,182,212,0.08)]">
        {/* Holographic Waveform Canvas */}
        <div className="w-full h-24 max-w-lg mb-2 relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={96}
            className="w-full h-full"
          />
        </div>

        {/* Large Central Push-To-Talk Orb (Big Target for USB Mouse) */}
        <div className="relative my-2">
          {/* Pulsing rings when listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 -m-3 rounded-full border-2 border-cyan-400/60 animate-ping pointer-events-none" />
              <div className="absolute inset-0 -m-6 rounded-full border border-purple-400/40 animate-pulse pointer-events-none" />
            </>
          )}

          <button
            onClick={toggleListening}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl relative z-10 active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-cyan-500 to-cyan-400 text-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.6)] scale-105'
                : 'bg-slate-900 border-2 border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-9 h-9 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-widest mt-1">
                  LISTENING
                </span>
              </>
            ) : (
              <>
                <Mic className="w-9 h-9" />
                <span className="text-[10px] font-mono font-bold tracking-widest mt-1">
                  CLICK TO TALK
                </span>
              </>
            )}
          </button>
        </div>

        {/* Live speech feedback transcript */}
        <div className="mt-4 min-h-[32px] max-w-xl">
          {transcript ? (
            <p className="text-sm font-mono text-cyan-300 bg-cyan-950/40 px-4 py-2 rounded-xl border border-cyan-500/30">
              "{transcript}"
            </p>
          ) : isListening ? (
            <p className="text-xs font-mono text-cyan-400/80 animate-pulse">
              Listening for directives... ("Turn on fan", "What time is it?", "Check battery")
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Click the orb with your USB mouse or click any directive below.
            </p>
          )}
        </div>

        {/* Quick Click Directives for Mouse Control */}
        <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl">
          {commandShortcuts.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleUserCommand(cmd)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-300 hover:text-cyan-200 text-xs font-mono transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Message History & Manual Command Bar */}
      <div className="p-5 rounded-2xl hud-card border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <AudioLines className="w-4 h-4 text-cyan-400" />
            <span>SESSION DIRECTIVES LOG</span>
          </div>

          <button
            onClick={() => setMessages([
              {
                id: `reset-${Date.now()}`,
                sender: 'assistant',
                text: 'Directives log cleared. Ready for next command.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ])}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Log</span>
          </button>
        </div>

        {/* Scrollable Conversation Stream */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs md:text-sm ${
                    isUser
                      ? 'bg-cyan-600/20 border border-cyan-400/40 text-cyan-100 rounded-tr-none'
                      : 'bg-slate-900/90 border border-purple-500/30 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-slate-500 font-mono">
                    <span>{isUser ? 'USER DIRECTIVE' : 'ORYQEN RESPONSE'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {!isUser && (
                  <button
                    onClick={() => speakResponse(msg.text)}
                    className="mt-1 text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 px-2 py-0.5 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Replay Audio</span>
                  </button>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Manual Command Form (For when mic is off or unavailable) */}
        <form onSubmit={handleManualSubmit} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type directive (e.g. 'Turn on Havells fan', 'What time is it?')..."
            className="flex-1 min-h-[48px] px-4 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="min-h-[48px] min-w-[48px] px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
