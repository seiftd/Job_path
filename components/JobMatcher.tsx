import React, { useState } from 'react';
import { UserProfile, Language, JobRecommendation } from '../types';
import { TRANSLATIONS } from '../constants';
import { analyzeProfileForJobs } from '../services/geminiService';
import { Sparkles, ArrowRight, CheckCircle, XCircle, Search, Filter } from 'lucide-react';

interface Props {
  profile: UserProfile;
  lang: Language;
}

export const JobMatcher: React.FC<Props> = ({ profile, lang }) => {
  const t = TRANSLATIONS[lang];
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAnalysis = async () => {
    setLoading(true);
    const results = await analyzeProfileForJobs(profile, lang);
    setJobs(results);
    setLoading(false);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.missingSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t.recommended_jobs}</h2>
          <p className="text-slate-500">Based on your skills: {profile.skills.slice(0,3).join(', ')}...</p>
        </div>
        <button 
          onClick={handleAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-brand-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition disabled:opacity-70"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          <span className="font-semibold">{t.analyze_profile}</span>
        </button>
      </div>

      {/* Search Bar */}
      {jobs.length > 0 && (
        <div className="relative animate-fade-in">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition duration-150 ease-in-out shadow-sm"
            placeholder={t.search_jobs_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Empty State for Initial Load */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">Click analyze to see AI career recommendations</p>
        </div>
      )}

      {/* Empty State for Search Results */}
      {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">{t.no_jobs_found}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {filteredJobs.map((job, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-3">
                 <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
                 <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                    {job.matchScore}% {t.match}
                 </span>
              </div>
              <p className="text-sm text-slate-500 mb-4">{job.avgSalary}</p>
              <p className="text-slate-600 mb-6 line-clamp-3">{job.description}</p>
              
              {job.missingSkills.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <span className="text-xs font-semibold text-red-600 block mb-2">{t.missing_skills}:</span>
                  <div className="flex flex-wrap gap-2">
                    {job.missingSkills.map(skill => (
                      <span key={skill} className="text-xs bg-white text-red-500 border border-red-200 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100">
              <button className="w-full flex items-center justify-center gap-2 text-brand-600 font-semibold hover:text-brand-700">
                <span>{t.start_practice}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};