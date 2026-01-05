import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Language, InterviewType, InterviewSessionConfig, ViewState } from '../types';
import { TRANSLATIONS } from '../constants';
import { GoogleGenAI, Chat } from "@google/genai";
import { connectLiveSession, createPCM16Blob, decodeAudioData, generateInterviewFeedback } from '../services/geminiService';
import { Mic, Send, StopCircle, Volume2, User, Bot, Loader2 } from 'lucide-react';

interface Props {
  config: InterviewSessionConfig;
  profile: UserProfile;
  lang: Language;
  onEnd: (transcript: {sender: 'user'|'ai', text: string}[], feedback: any) => void;
  setView: (v: ViewState) => void;
}

export const InterviewSession: React.FC<Props> = ({ config, profile, lang, onEnd, setView }) => {
  const t = TRANSLATIONS[lang];
  const [messages, setMessages] = useState<{sender: 'user'|'ai', text: string}[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  
  // Refs for Chat
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs for Live Audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const liveSessionRef = useRef<any>(null); // To store live session promise/obj
  const nextStartTimeRef = useRef<number>(0);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  // Initialize Text Chat
  useEffect(() => {
    if (config.mode === 'text' && !chatSessionRef.current) {
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are a professional interviewer conducting a ${config.type} interview for the position of ${config.jobTitle}. 
      The candidate's name is ${profile.name}.
      Ask one concise question at a time. Wait for the user's response.
      Language: ${lang === Language.ARABIC ? 'Arabic' : 'English'}.
      Start by welcoming the candidate.`;

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction }
      });
      chatSessionRef.current = chat;
      
      // Initial greeting
      setIsProcessing(true);
      chat.sendMessage({ message: "Start interview" }).then(res => {
        if(res.text) setMessages([{ sender: 'ai', text: res.text }]);
        setIsProcessing(false);
      });
    }
  }, [config.mode]);

  // Initialize Live Voice
  useEffect(() => {
    if (config.mode === 'voice' && !liveConnected) {
      startLiveSession();
    }
  }, [config.mode]);

  const stopLiveSession = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    setLiveConnected(false);
  };

  const startLiveSession = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = connectLiveSession(
        config.jobTitle, 
        config.type,
        async (base64Audio) => {
            // Play Audio
            if(!audioContextRef.current) return;
            // Ensure output context is 24k as per gemini default
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const buffer = await decodeAudioData(base64Audio, outputCtx);
            
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            
            const currentTime = outputCtx.currentTime;
            // Simple scheduler to avoid overlap, though simplistic for this demo
            const startTime = Math.max(currentTime, nextStartTimeRef.current);
            source.start(startTime);
            nextStartTimeRef.current = startTime + buffer.duration;
        },
        (text) => {
             // For simplicity in this demo, we might not get text back in 'audio' modality easily without transcription config
        },
        () => setLiveConnected(false)
      );

      liveSessionRef.current = sessionPromise;

      // Input Pipeline
      const ctx = audioContextRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPCM16Blob(inputData);
        sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      
      inputSourceRef.current = source;
      processorRef.current = processor;
      setLiveConnected(true);

    } catch (err) {
      console.error("Failed to start live session", err);
      alert("Microphone access needed for Voice Mode. Please switch to Text mode if issues persist.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;
    
    const userMsg = inputText;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText("");
    setIsProcessing(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg });
      if (result.text) {
        setMessages(prev => [...prev, { sender: 'ai', text: result.text }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const finishSession = async () => {
    stopLiveSession();
    // Generate feedback
    setIsProcessing(true);
    const feedbackData = await generateInterviewFeedback(messages, config.jobTitle);
    setIsProcessing(false);
    onEnd(messages, feedbackData);
  };

  if (config.mode === 'voice') {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-slate-900 rounded-2xl text-white relative overflow-hidden">
        {/* Visualizer Placeholder */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-blue-900 to-slate-900"></div>
        
        <div className="z-10 text-center space-y-8">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${liveConnected ? 'bg-brand-500 shadow-[0_0_50px_rgba(14,165,233,0.5)] animate-pulse' : 'bg-slate-700'}`}>
                <Mic className="w-12 h-12 text-white" />
            </div>
            
            <div>
                <h3 className="text-2xl font-semibold mb-2">{liveConnected ? t.listening : "Connecting..."}</h3>
                <p className="text-slate-400">Interviewing for: {config.jobTitle}</p>
            </div>

            <button 
                onClick={finishSession}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 mx-auto transition"
            >
                <StopCircle className="w-5 h-5" />
                {t.end_session}
            </button>
        </div>
      </div>
    );
  }

  // Text Mode UI
  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
                <h3 className="font-bold text-slate-800">{config.jobTitle}</h3>
                <span className="text-xs text-slate-500 uppercase">{config.type} Interview</span>
            </div>
            <button onClick={finishSession} className="text-red-500 text-sm font-semibold hover:bg-red-50 px-3 py-1 rounded">
                {t.end_session}
            </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[80%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-600'}`}>
                            {msg.sender === 'user' ? <User className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}
                        </div>
                        <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                            msg.sender === 'user' 
                            ? 'bg-brand-600 text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                </div>
            ))}
            {isProcessing && (
                <div className="flex justify-start">
                     <div className="bg-slate-100 px-4 py-2 rounded-full flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
                <input 
                    className="flex-1 border border-slate-200 rounded-full px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                    placeholder={t.type_message}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    disabled={isProcessing}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isProcessing}
                    className="bg-brand-600 text-white p-3 rounded-full hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
  );
};