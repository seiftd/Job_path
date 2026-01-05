import React from 'react';
import { UserProfile, Language, ViewState } from '../types';
import { TRANSLATIONS } from '../constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PlusCircle, FileText, Clock, ChevronRight, Calendar } from 'lucide-react';

interface Props {
  profile: UserProfile;
  lang: Language;
  setView: (v: ViewState) => void;
  onViewHistory: (id: string) => void;
}

export const Dashboard: React.FC<Props> = ({ profile, lang, setView, onViewHistory }) => {
  const t = TRANSLATIONS[lang];
  const isEmpty = !profile.name || profile.experience.length === 0;

  // Prepare chart data from history
  const historyData = profile.interviewHistory
    .slice()
    .sort((a, b) => a.date - b.date)
    .map(h => ({
        name: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.feedback.overallScore
    }));
  
  const latestScore = profile.interviewHistory.length > 0 
    ? profile.interviewHistory[profile.interviewHistory.length - 1].feedback.overallScore 
    : 0;

  // Transform skills for chart or use empty
  const skillData = profile.skills
    .filter(s => s)
    .map(s => ({ name: s, val: Math.floor(Math.random() * 40) + 60 }))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">
                {t.welcome} {profile.name ? profile.name.split(' ')[0] : ''}
            </h2>
            <p className="text-slate-500 mt-1">
                {isEmpty ? "Start your career journey by building your resume." : "Ready to accelerate your career today?"}
            </p>
        </div>
        {!isEmpty && (
            <button onClick={() => setView(ViewState.INTERVIEW_SETUP)} className="hidden md:flex bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition shadow-md">
                {t.start_interview}
            </button>
        )}
      </div>

      {isEmpty ? (
         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
             <div className="bg-brand-50 p-4 rounded-full mb-4">
                 <FileText className="w-8 h-8 text-brand-500" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">{t.empty_dashboard}</h3>
             <p className="text-slate-500 max-w-md mb-6">Create a professional CV to unlock job recommendations and AI mock interviews.</p>
             <button 
                onClick={() => setView(ViewState.RESUME_BUILDER)}
                className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-brand-700 transition shadow-lg"
             >
                 <PlusCircle className="w-5 h-5" />
                 {t.create_resume_btn}
             </button>
         </div>
      ) : (
        <>
            <div className="grid md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition">
                      <Clock className="w-24 h-24" />
                  </div>
                  <h3 className="text-brand-100 text-sm font-semibold uppercase tracking-wider">{t.interview_score}</h3>
                  <div className="text-5xl font-bold mt-2 flex items-baseline gap-1">
                      {latestScore > 0 ? latestScore : '--'}
                      <span className="text-2xl text-brand-200">/100</span>
                  </div>
                  <p className="mt-4 text-brand-100 text-sm flex items-center gap-1">
                      {profile.interviewHistory.length} sessions completed
                  </p>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">{t.skills_tracked}</h3>
                <div className="text-3xl font-bold text-slate-800">{profile.skills.length}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {profile.skills.slice(0, 4).map(s => (
                        <span key={s} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">{s}</span>
                    ))}
                    {profile.skills.length > 4 && <span className="px-2 py-1 bg-slate-50 text-slate-400 text-xs rounded">+{profile.skills.length - 4}</span>}
                </div>
                </div>

                {/* Strength */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">{t.resume_strength}</h3>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-slate-800">85%</span>
                    <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Good</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-sm text-slate-500 mt-4">Tip: Add a photo to increase visibility.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent History List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">{t.recent_interviews}</h3>
                    </div>
                    {profile.interviewHistory.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                           {t.no_interviews}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {profile.interviewHistory.slice().reverse().slice(0, 5).map(record => (
                                <div key={record.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-brand-50 text-brand-600 font-bold p-3 rounded-lg text-lg min-w-[50px] text-center">
                                            {record.feedback.overallScore}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{record.jobTitle}</h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded">{record.type}</span>
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(record.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onViewHistory(record.id)}
                                        className="text-slate-400 hover:text-brand-600 hover:bg-white p-2 rounded-full transition"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Progress Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Performance Trend</h3>
                    <div className="h-64">
                        {historyData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyData}>
                                    <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 100]} fontSize={12} stroke="#94a3b8" tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        itemStyle={{color: '#0ea5e9', fontWeight: 'bold'}}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: 'white'}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-lg">
                                <Clock className="w-8 h-8 mb-2 opacity-50"/>
                                No data yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};