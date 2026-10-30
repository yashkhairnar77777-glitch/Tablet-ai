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
  Cpu,
  Info,
  Radio,
  Loader2,
  CloudLightning,
  CloudOff
} from 'lucide-react';
import { playHudSound, triggerHaptic } from '../utils/audio';
import { askCloudAi } from '../utils/aiClient';

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
      text: 'ORYQEN online. Cloud AI backend connected. Tap the orb or speak directives.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'system'
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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
          setErrorMessage('Microphone access denied. Please grant microphone permissions in your browser address bar.');
        } else if (event.error === 'no-speech') {
          // Timeout without speech
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
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
  }, [messages, transcript, isAiLoading]);

  // Voice output synthesizer (Natural spoken Alexa-style responses)
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Remove any unwanted special symbols for clean spoken pronunciation
      const cleanSpokenText = text.replace(/[*_#`~[\]]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
      
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
    if (isAiLoading) return; // Prevent activation while AI is thinking

    triggerHaptic('medium');

    if (!sttSupported) {
      setErrorMessage('Speech Recognition is not supported on this browser engine. Use the directive input below.');
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
      } catch {
        recognitionRef.current?.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 150);
      }
    }
  };

  // Process Directives: Direct hardware/navigation commands first, general questions to Cloud AI
  const handleUserCommand = async (input: string) => {
    const raw = input.trim();
    if (!raw || isAiLoading) return; // Prevent duplicate submissions

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
    let isLocalHandled = false;

    // 1. Navigation Commands
    if (lower.includes('turn off voice') || lower.includes('stop voice') || lower.includes('mute voice') || lower.includes('shut up') || lower.includes('stop listening')) {
      isLocalHandled = true;
      intent = 'voice_off';
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      reply = 'Voice assistant deactivated. Standing by.';
    }
    else if (lower.includes('go home') || lower.includes('open home') || lower.includes('home dashboard') || lower.includes('back home')) {
      isLocalHandled = true;
      intent = 'nav_home';
      reply = 'Navigating to Home Dashboard.';
      onNavigate('home');
    }
    else if (lower.includes('screen sharing') || lower.includes('screen mirror') || lower.includes('mirroring') || lower.includes('mirror screen') || lower.includes('cast')) {
      isLocalHandled = true;
      intent = 'nav_screenshare';
      reply = 'Opening Screen Mirroring Hub.';
      onNavigate('screenshare');
    }
    else if (lower.includes('smart home') || lower.includes('open appliances')) {
      isLocalHandled = true;
      intent = 'nav_smarthome';
      reply = 'Opening Smart Home management console.';
      onNavigate('smarthome');
    }
    else if (lower.includes('settings') || lower.includes('accessibility') || lower.includes('configure')) {
      isLocalHandled = true;
      intent = 'nav_settings';
      reply = 'Accessing System Settings and display options.';
      onNavigate('settings');
    }

    // 2. Havells Fan Directives
    else if (lower.includes('fan') || lower.includes('havells')) {
      isLocalHandled = true;
      intent = 'havells_fan';
      if (lower.includes('turn on') || lower.includes('start') || lower.includes('power on')) {
        onUpdateHavellsFan({ power: true });
        reply = `Havells Smart Fan powered on at speed ${havellsFan.speed}.`;
      } else if (lower.includes('turn off') || lower.includes('stop') || lower.includes('power off') || lower.includes('shut down')) {
        onUpdateHavellsFan({ power: false });
        reply = 'Havells Smart Fan powered off.';
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

    // 3. SmartThings Directives
    else if (lower.includes('light') || lower.includes('lights') || lower.includes('lamp') || lower.includes('tv') || lower.includes('smartthings')) {
      isLocalHandled = true;
      intent = 'smartthings';
      if (lower.includes('turn on') || lower.includes('turn all on')) {
        smartThingsDevices.forEach(d => {
          if (!d.power) onToggleSmartThingsDevice(d.id, true);
        });
        reply = 'Turning on all connected SmartThings fixtures.';
      } else if (lower.includes('turn off') || lower.includes('turn all off')) {
        smartThingsDevices.forEach(d => {
          if (d.power) onToggleSmartThingsDevice(d.id, false);
        });
        reply = 'Turning off all connected SmartThings fixtures.';
      } else if (lower.includes('tv')) {
        const tv = smartThingsDevices.find(d => d.type === 'tv');
        if (tv) {
          onToggleSmartThingsDevice(tv.id);
          reply = 'Samsung Smart TV state toggled.';
        } else {
          reply = 'Samsung TV device is not in current profile.';
        }
      } else {
        reply = 'SmartThings command acknowledged. You can ask me to turn lights on or off.';
      }
    }

    // 4. Quick Local Telemetry (Time, Battery)
    else if (lower === 'what time is it' || lower === 'time' || lower === 'current time') {
      isLocalHandled = true;
      intent = 'telemetry_time';
      const now = new Date();
      reply = `The current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    } 
    else if (lower.includes('battery status') || lower.includes('battery level')) {
      isLocalHandled = true;
      intent = 'telemetry_battery';
      const level = telemetry.batteryLevel ?? 85;
      const status = telemetry.isCharging ? 'and charging' : 'on battery power';
      reply = `Your battery is at ${level} percent, ${status}.`;
    }

    // If direct local intent matched, respond immediately!
    if (isLocalHandled) {
      const assistantMsg: VoiceMessage = {
        id: `assist-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent,
        source: 'local_rule',
        status: 'success'
      };
      setMessages(prev => [...prev, assistantMsg]);
      playHudSound('success', soundEnabled);
      speakResponse(reply);
      return;
    }

    // ONLINE-ONLY Cloud AI Backend: All general queries route to Netlify Function via askCloudAi
    setIsAiLoading(true);
    setErrorMessage(null);

    // Build short conversation history
    const conversationHistory = messages
      .filter(m => m.source !== 'system')
      .slice(-6)
      .map(m => ({ sender: m.sender, text: m.text }));

    const aiResult = await askCloudAi(raw, conversationHistory);

    setIsAiLoading(false);

    if (aiResult.success && aiResult.reply) {
      const cloudMsg: VoiceMessage = {
        id: `assist-ai-${Date.now()}`,
        sender: 'assistant',
        text: aiResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'gemini_ai',
        status: 'success',
        model: aiResult.model || 'Gemini 3.8 Flash'
      };
      setMessages(prev => [...prev, cloudMsg]);
      playHudSound('success', soundEnabled);
      speakResponse(aiResult.reply);
    } else {
      // Honest error state: never fake an AI reply or use an offline fake response
      const errorMsgText = aiResult.error || 'Cloud AI service is currently unavailable.';
      setErrorMessage(errorMsgText);

      const failedMsg: VoiceMessage = {
        id: `assist-err-${Date.now()}`,
        sender: 'assistant',
        text: `Cloud AI Unavailable: ${errorMsgText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'system',
        status: 'fallback'
      };
      setMessages(prev => [...prev, failedMsg]);
      playHudSound('alert', soundEnabled);
      speakResponse('Cloud AI service unavailable.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim() || isAiLoading) return;
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
      step += isListening || isSpeaking || isAiLoading ? 0.08 : 0.02;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const lines = 3;
      for (let l = 0; l < lines; l++) {
        ctx.beginPath();
        ctx.lineWidth = l === 1 ? 2.5 : 1.2;
        
        const alpha = isListening || isSpeaking || isAiLoading ? (0.85 - l * 0.2) : (0.2 - l * 0.05);
        ctx.strokeStyle = l === 0 
          ? `rgba(6, 182, 212, ${alpha})` 
          : l === 1 
          ? `rgba(168, 85, 247, ${alpha})` 
          : `rgba(56, 189, 248, ${alpha})`;

        const amplitude = isListening ? 26 : isSpeaking ? 20 : isAiLoading ? 14 : 5;
        const frequency = isListening || isSpeaking || isAiLoading ? 0.028 : 0.015;

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
  }, [isListening, isSpeaking, isAiLoading]);

  const commandShortcuts = [
    'What is quantum computing?',
    'Open screen sharing',
    'Go home',
    'Turn off voice',
    'Set fan speed to 4',
    'Turn all lights off',
    'How does solar energy work?'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 space-y-4">
      
      {/* Alexa-Style Header & Capability Status */}
      <div className="p-4 rounded-2xl hud-card border border-cyan-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-100">
                ORYQEN Voice Assistant
              </h2>
              {/* Online-Only Cloud AI indicator badge */}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 bg-cyan-950/70 border-cyan-500/40 text-cyan-300">
                <CloudLightning className="w-2.5 h-2.5 text-cyan-400" />
                <span>Online Cloud AI Only</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by server-side Gemini Cloud AI via Netlify Function.
            </p>
          </div>
        </div>

        {/* Audio Mute / Test Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isSpeaking && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono">
              <Volume2 className="w-3.5 h-3.5 animate-pulse text-purple-400" />
              <span>VOCALIZING</span>
            </div>
          )}
          <button
            onClick={() => {
              if (isSpeaking) {
                window.speechSynthesis?.cancel();
                setIsSpeaking(false);
              } else {
                speakResponse('Oryqen speech synthesis is online and calibrated.');
              }
            }}
            className="min-h-[44px] px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-500/40 rounded-xl transition-colors cursor-pointer"
          >
            {isSpeaking ? 'Mute Audio' : 'Test Speech'}
          </button>
        </div>
      </div>

      {/* Cloud AI Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-200">Online Cloud AI Active: </span>
          <span>General questions and conversational dialogue are processed live by server-side Gemini AI via <code>/api/chat</code>. Direct device and navigation commands are executed locally with zero latency.</span>
        </div>
      </div>

      {/* Error & Rate-Limit / Offline Notification */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Notice:</span> {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-400 hover:text-amber-200 font-mono text-xs cursor-pointer ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Holographic Voice Orb & Waveform Section */}
      <div className="p-5 md:p-6 rounded-2xl hud-card border border-cyan-500/25 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-[0_4px_30px_rgba(6,182,212,0.08)]">
        
        {/* Holographic Waveform Canvas */}
        <div className="w-full h-20 max-w-md mb-2 relative">
          <canvas
            ref={canvasRef}
            width={480}
            height={80}
            className="w-full h-full"
          />
        </div>

        {/* Large Central Push-To-Talk Orb */}
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
            disabled={isAiLoading}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl relative z-10 touch-press disabled:opacity-75 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-gradient-to-tr from-cyan-500 to-cyan-400 text-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.6)] scale-105'
                : isAiLoading
                ? 'bg-purple-950 border-2 border-purple-400 text-purple-300 animate-pulse'
                : 'bg-slate-900 border-2 border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-10 h-10 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-widest mt-1">
                  LISTENING
                </span>
              </>
            ) : isAiLoading ? (
              <>
                <Sparkles className="w-9 h-9 animate-spin text-purple-400" />
                <span className="text-[10px] font-mono font-bold tracking-widest mt-1">
                  THINKING
                </span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-[10px] font-mono font-bold tracking-widest mt-1">
                  TAP TO SPEAK
                </span>
              </>
            )}
          </button>
        </div>

        {/* Live speech feedback transcript / status */}
        <div className="mt-3 min-h-[32px] max-w-lg">
          {transcript ? (
            <p className="text-sm font-mono text-cyan-300 bg-cyan-950/40 px-4 py-2 rounded-xl border border-cyan-500/30">
              "{transcript}"
            </p>
          ) : isListening ? (
            <p className="text-xs font-mono text-cyan-400/90 animate-pulse">
              Listening for commands... ("What is quantum computing?", "Go home", "Set fan speed to 3")
            </p>
          ) : isAiLoading ? (
            <p className="text-xs font-mono text-purple-300 animate-pulse flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>Querying Cloud AI model...</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Tap the orb to speak, or type any question below.
            </p>
          )}
        </div>

        {/* Quick Click Directives for Mouse or Touch Reach */}
        <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-xl">
          {commandShortcuts.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleUserCommand(cmd)}
              disabled={isAiLoading}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-300 hover:text-cyan-200 text-xs font-mono transition-all cursor-pointer whitespace-nowrap touch-press shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Message History & Manual Command Bar */}
      <div className="p-4 md:p-5 rounded-2xl hud-card border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>SESSION DIRECTIVES LOG</span>
          </div>

          <button
            onClick={() => setMessages([
              {
                id: `reset-${Date.now()}`,
                sender: 'assistant',
                text: 'Directives log cleared. Ready for next command.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                source: 'system'
              }
            ])}
            disabled={isAiLoading}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Log</span>
          </button>
        </div>

        {/* Scrollable Conversation Stream */}
        <div className="space-y-3 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isCloudAi = msg.source === 'gemini_ai';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] p-3 rounded-2xl text-xs md:text-sm ${
                    isUser
                      ? 'bg-cyan-600/20 border border-cyan-400/40 text-cyan-100 rounded-tr-none'
                      : isCloudAi
                      ? 'bg-gradient-to-r from-slate-900 to-cyan-950/40 border border-cyan-400/50 text-slate-100 rounded-tl-none shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : msg.status === 'fallback'
                      ? 'bg-red-950/40 border border-red-500/40 text-red-200 rounded-tl-none'
                      : 'bg-slate-900/90 border border-purple-500/30 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  
                  {/* Footer metadata */}
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      {isUser ? (
                        <span>USER DIRECTIVE</span>
                      ) : isCloudAi ? (
                        <span className="text-cyan-300 flex items-center gap-1 font-semibold">
                          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{msg.model || 'Gemini Cloud AI'}</span>
                        </span>
                      ) : msg.status === 'fallback' ? (
                        <span className="text-red-300 flex items-center gap-1">
                          <CloudOff className="w-2.5 h-2.5 text-red-400" />
                          <span>Cloud Error</span>
                        </span>
                      ) : (
                        <span className="text-purple-300 flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5 text-purple-400" />
                          <span>Device Controller</span>
                        </span>
                      )}
                    </div>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {!isUser && msg.status !== 'fallback' && (
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

        {/* Manual Command Form (Functional even when STT is unsupported) */}
        <form onSubmit={handleManualSubmit} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            disabled={isAiLoading}
            placeholder={isAiLoading ? 'Waiting for Cloud AI...' : "Ask anything (e.g. 'What is dark matter?', 'Open screen sharing')..."}
            className="flex-1 min-h-[50px] px-4 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isAiLoading || !manualInput.trim()}
            className="min-h-[50px] min-w-[50px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center transition-all cursor-pointer touch-press shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title={isAiLoading ? 'Request in progress' : 'Send message'}
          >
            {isAiLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

    </div>
  );
};
