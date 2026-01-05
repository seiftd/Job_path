import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ResumeBuilder } from './components/ResumeBuilder';
import { JobMatcher } from './components/JobMatcher';
import { InterviewSession } from './components/InterviewSession';
import { ViewState, Language, UserProfile, InterviewSessionConfig, InterviewType, InterviewRecord } from './types';
import { INITIAL_PROFILE, TRANSLATIONS } from './constants';
import { Mic, MessageSquare, Trophy, CheckCircle, AlertTriangle, Lightbulb, AlertCircle, ArrowLeft, Calendar, User, Bot } from 'lucide-react';

export default function App() {
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [lang, setLang] = useState<Language>(Language.ENGLISH);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [interviewConfig, setInterviewConfig] = useState<InterviewSessionConfig | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const t = TRANSLATIONS[lang];

  const startInterview = (type: InterviewType, mode: 'text' | 'voice') => {
    setInterviewConfig({
      jobTitle: profile.targetRole || 'Software Engineer',
      type,
      mode
    });
    setView(ViewState.INTERVIEW_SESSION);
  };

  const handleInterviewEnd = (transcript: {sender: 'user'|'ai', text: string}[], feedbackData: any) => {
    if (!interviewConfig) return;

    const newRecord: InterviewRecord = {
      id: Date.now().toString(),
      date: Date.now(),
      jobTitle: interviewConfig.jobTitle,
      type: interviewConfig.type,
      transcript: transcript,
      feedback: feedbackData
    };

    setProfile(prev => ({
      ...prev,
      interviewHistory: [...prev.interviewHistory, newRecord]
    }));
    
    setFeedback(feedbackData);
    setView(ViewState.FEEDBACK);
  };

  const handleResetData = () => {
    setProfile(INITIAL_PROFILE);
    setFeedback(null);
    setInterviewConfig(null);
    setView(ViewState.DASHBOARD);
    setShowResetModal(false);
  };
  
  const handleViewHistory = (id: string) => {
      setSelectedHistoryId(id);
      setView(ViewState.HISTORY_DETAILS);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard profile={profile} lang={lang} setView={setView} onViewHistory={handleViewHistory} />;
      
      case ViewState.RESUME_BUILDER:
        return <ResumeBuilder profile={profile} setProfile={setProfile} lang={lang} />;
      
      case ViewState.JOB_MATCH:
        return <JobMatcher profile={profile} lang={lang} />;

      case ViewState.INTERVIEW_SETUP:
        return (
          <div className="max-w-2xl mx-auto py-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t.interview_setup}</h2>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Role</label>
                  <input 
                    value={profile.targetRole || ''} 
                    disabled 
                    placeholder="Complete your resume first"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-500"
                  />
               </div>

               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-4">{t.select_type}</label>
                 <div className="grid grid-cols-1 gap-3">
                   {Object.values(InterviewType).map(type => (
                     <button 
                       key={type}
                       onClick={() => startInterview(type, 'text')}
                       disabled={!profile.targetRole}
                       className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition group disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-slate-200"
                     >
                       <span className="font-medium text-slate-700 group-hover:text-brand-700">{type} Interview</span>
                       <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-brand-500" />
                     </button>
                   ))}
                 </div>
               </div>

               <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">Experimental Features</h4>
                  <button 
                    onClick={() => startInterview(InterviewType.HR, 'voice')}
                    disabled={!profile.targetRole}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-xl hover:bg-slate-800 transition shadow-lg disabled:opacity-50"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Start Voice Interview (Live API)</span>
                  </button>
                  <p className="text-xs text-slate-400 mt-2 text-center">Requires microphone permissions. Uses Gemini Live API.</p>
               </div>
            </div>
          </div>
        );

      case ViewState.INTERVIEW_SESSION:
        return interviewConfig ? (
          <InterviewSession 
            config={interviewConfig} 
            profile={profile} 
            lang={lang} 
            onEnd={handleInterviewEnd}
            setView={setView}
          />
        ) : null;

      case ViewState.FEEDBACK:
        return feedback ? (
           <div className="max-w-4xl mx-auto space-y-8 pb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-100 p-3 rounded-full">
                  <Trophy className="w-8 h-8 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{t.feedback}</h2>
                  <p className="text-slate-500">Overall Score: {feedback.overallScore}/100</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-green-700 flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5" /> {t.strengths}
                  </h3>
                  <ul className="space-y-2">
                    {feedback.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-slate-600 text-sm">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-red-700 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5" /> {t.weaknesses}
                  </h3>
                  <ul className="space-y-2">
                    {feedback.weaknesses?.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-slate-600 text-sm">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                 <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5" /> {t.tips}
                  </h3>
                  <ul className="space-y-2">
                    {feedback.tips?.map((s: string, i: number) => (
                      <li key={i} className="text-blue-700 text-sm italic">"{s}"</li>
                    ))}
                  </ul>
              </div>
              
              <button onClick={() => setView(ViewState.DASHBOARD)} className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700">
                Back to Dashboard
              </button>
           </div>
        ) : <div>Loading...</div>;

      case ViewState.HISTORY_DETAILS:
          const record = profile.interviewHistory.find(h => h.id === selectedHistoryId);
          if (!record) return <div>Record not found</div>;
          
          return (
              <div className="max-w-4xl mx-auto space-y-6 pb-20">
                  <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => setView(ViewState.DASHBOARD)} className="p-2 hover:bg-slate-100 rounded-full transition">
                          <ArrowLeft className="w-6 h-6 text-slate-600" />
                      </button>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">Interview Details</h2>
                        <div className="flex gap-4 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(record.date).toLocaleString()}</span>
                            <span>•</span>
                            <span>{record.jobTitle}</span>
                        </div>
                      </div>
                  </div>

                  {/* Score Summary */}
                  <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-brand-600 text-white p-6 rounded-xl shadow-md text-center">
                          <div className="text-4xl font-bold">{record.feedback.overallScore}</div>
                          <div className="text-brand-100 text-sm font-medium mt-1">Overall Score</div>
                      </div>
                      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm col-span-3 flex flex-col justify-center">
                          <div className="flex flex-wrap gap-2">
                              {record.feedback.strengths.slice(0,3).map((s,i) => (
                                  <span key={i} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">{s}</span>
                              ))}
                          </div>
                          <p className="text-slate-500 text-sm mt-3 italic">"{record.feedback.tips[0]}"</p>
                      </div>
                  </div>

                  {/* Transcript */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
                          Transcript
                      </div>
                      <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                        {record.transcript.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[80%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-600'}`}>
                                        {msg.sender === 'user' ? <User className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}
                                    </div>
                                    <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                                        msg.sender === 'user' 
                                        ? 'bg-brand-600 text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                      </div>
                  </div>
              </div>
          );

      default:
        return <Dashboard profile={profile} lang={lang} setView={setView} onViewHistory={handleViewHistory} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setView} lang={lang} setLang={setLang} onReset={() => setShowResetModal(true)}>
      {renderContent()}
      
      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">{t.reset_confirm_title}</h3>
            </div>
            
            <p className="text-slate-600 mb-8 leading-relaxed">
              {t.reset_confirm_desc}
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleResetData}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg shadow-sm transition"
              >
                {t.confirm_delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}