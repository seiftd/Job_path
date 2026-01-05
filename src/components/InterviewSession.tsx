import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Language, InterviewSessionConfig, ViewState } from '../types';
import { TRANSLATIONS } from '../constants';
import { sendChatMessage, connectLiveSession, createPCM16Blob, decodeAudioData, generateInterviewFeedback } from '../services/geminiService';
import { Mic, Send, StopCircle, User, Bot } from 'lucide-react';

interface Props {
  config: InterviewSessionConfig;
  profile: UserProfile;
  lang: Language;
  onEnd: (transcript: {sender: 'user'|'ai', text: string}[], feedback: any) => void;
  setView: (v: ViewState) => void;
}

export const InterviewSession: React.FC<Props> = ({ config, profile, lang, onEnd }) => {
  const t = TRANSLATIONS[lang];
  const [messages, setMessages] = useState<{sender: 'user'|'ai', text: string}[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const systemInstruction = `You are a professional interviewer conducting a ${config.type} interview for the position of ${config.jobTitle}. 
  The candidate's name is ${profile.name}.
  Ask one concise question at a time. Wait for the user's response.
  Language: ${lang === Language.ARABIC ? 'Arabic' : 'English'}.
  Start by welcoming the candidate.`;

  // Initialize Text Chat
  useEffect(() => {
    if (config.mode === 'text' && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setIsProcessing(true);
      // Send initial trigger to AI
      sendChatMessage("Start interview", [], systemInstruction).then(text => {
        if(text) setMessages([{ sender: 'ai', text }]);
        setIsProcessing(false);
      });
    }
  }, [config.mode]);

  // Initialize Live Voice
  useEffect(() => {
    if (config.mode === 'voice' && !liveConnected && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startLiveSession();
    }
  }, [config.mode]);

  const startLiveSession = async () => {
    // This will now just show an alert as implemented in service
    await connectLiveSession(
      config.jobTitle, 
      config.type,
      () => {},
      () => {},
      () => setLiveConnected(false)
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg = inputText;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText("");
    setIsProcessing(true);

    try {
      // Pass current history to the stateless API
      const responseText = await sendChatMessage(userMsg, messages, systemInstruction);
      if (responseText) {
        setMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const finishSession = async () => {
    setIsProcessing(true);
    const feedbackData = await generateInterviewFeedback(messages, config.jobTitle);
    setIsProcessing(false);
    onEnd(messages, feedbackData);
  };

  if (config.mode === 'voice') {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-slate-900 rounded-2xl text-white relative overflow-hidden">
        <div className="z-10 text-center space-y-8">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-slate-700`}>
                <Mic className="w-12 h-12 text-white" />
            </div>
            
            <div>
                <h3 className="text-2xl font-semibold mb-2">Voice Mode Unavailable</h3>
                <p className="text-slate-400">Please use Text mode for secure serverless environment.</p>
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