import React, { useState } from 'react';
import { UserProfile, Language, Experience, TemplateType } from '../types';
import { TRANSLATIONS } from '../constants';
import { enhanceDescription } from '../services/geminiService';
import { Wand2, Plus, Trash2, Printer, Eye, PenTool, Mail, Phone, GraduationCap, Check, Upload, Image as ImageIcon, Globe, Briefcase } from 'lucide-react';

interface Props {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  lang: Language;
}

export const ResumeBuilder: React.FC<Props> = ({ profile, setProfile, lang }) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(TemplateType.PROFESSIONAL);
  const [loadingEnhance, setLoadingEnhance] = useState<string | null>(null);

  const handleEnhance = async (id: string, text: string) => {
    setLoadingEnhance(id);
    const enhanced = await enhanceDescription(text, lang);
    const newExp = profile.experience.map(e => e.id === id ? { ...e, description: enhanced } : e);
    setProfile({ ...profile, experience: newExp });
    setLoadingEnhance(null);
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      role: '',
      company: '',
      duration: '',
      description: ''
    };
    setProfile({ ...profile, experience: [...profile.experience, newExp] });
  };

  const removeExperience = (id: string) => {
    setProfile({ ...profile, experience: profile.experience.filter(e => e.id !== id) });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setProfile({
      ...profile,
      experience: profile.experience.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfile({ ...profile, photo: undefined });
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Visual Thumbnails ---
  const TemplateThumbnail = ({ type, active, label }: { type: TemplateType, active: boolean, label: string }) => (
    <button 
      onClick={() => setSelectedTemplate(type)}
      className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${
        active 
          ? 'ring-2 ring-brand-500 bg-brand-50' 
          : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
      }`}
    >
      <div className="w-24 h-32 bg-white rounded shadow-sm border border-slate-200 overflow-hidden relative pointer-events-none">
        {/* CSS-based skeletons for previews */}
        {type === TemplateType.PROFESSIONAL && (
           <div className="p-2 flex flex-col gap-1">
             <div className="h-2 w-16 bg-slate-800 rounded-sm"></div>
             <div className="h-1 w-12 bg-slate-400 rounded-sm"></div>
             <div className="h-[1px] w-full bg-slate-200 my-1"></div>
             <div className="h-1 w-full bg-slate-100 rounded-sm"></div>
             <div className="h-1 w-20 bg-slate-100 rounded-sm"></div>
           </div>
        )}
        {type === TemplateType.MODERN && (
           <div className="flex h-full">
             <div className="w-1/3 bg-slate-200 h-full"></div>
             <div className="w-2/3 p-2 flex flex-col gap-1">
               <div className="h-2 w-12 bg-slate-800 rounded-sm"></div>
               <div className="h-1 w-full bg-slate-100 rounded-sm"></div>
             </div>
           </div>
        )}
        {type === TemplateType.CREATIVE && (
           <div className="flex flex-col h-full">
             <div className="h-8 bg-purple-500 w-full mb-1"></div>
             <div className="p-2 flex flex-col gap-1">
                <div className="h-1 w-full bg-slate-100 rounded-sm"></div>
                <div className="h-1 w-16 bg-slate-100 rounded-sm"></div>
             </div>
           </div>
        )}
        
        {/* Checkmark overlay */}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-900/10">
            <div className="bg-brand-500 text-white rounded-full p-1">
               <Check className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-brand-700' : 'text-slate-600'}`}>{label}</span>
    </button>
  );

  // --- Templates ---

  const ProfessionalTemplate = () => (
    <div className="flex flex-col h-full gap-6 p-[10mm]">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-6 mb-2 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tight text-slate-900">{profile.name || "Your Name"}</h1>
          <p className="text-xl text-slate-600 mt-2 font-medium">{profile.targetRole || "Professional Role"}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
              {profile.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3"/><span>{profile.email}</span></div>}
              {profile.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3"/><span>{profile.phone}</span></div>}
          </div>
        </div>
        {profile.photo && (
          <img src={profile.photo} alt="Profile" className="w-24 h-24 object-cover rounded-md border border-slate-200" />
        )}
      </div>

      {/* Summary */}
      {profile.summary && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">{t.personal_info}</h3>
          <p className="text-sm leading-relaxed text-slate-700">{profile.summary}</p>
        </div>
      )}

      {/* Experience */}
      {profile.experience.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-4">{t.experience}</h3>
          <div className="space-y-5">
            {profile.experience.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-bold text-slate-800">{exp.role}</h4>
                  <span className="text-sm text-slate-500 font-medium">{exp.duration}</span>
                </div>
                <p className="text-sm text-slate-700 font-semibold mb-2">{exp.company}</p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.education && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">{t.education}</h3>
          <p className="text-sm text-slate-700">{profile.education}</p>
        </div>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && profile.skills[0] !== "" && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">{t.skills}</h3>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {profile.skills.map((skill, i) => (
              <span key={i} className="text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {profile.languages && profile.languages.length > 0 && profile.languages[0] !== "" && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">{t.languages}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {profile.languages.map((lang, i) => (
              <span key={i} className="text-sm text-slate-700">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ModernTemplate = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header Area */}
      <div className="bg-slate-800 text-white p-8 flex items-center justify-between">
         <div>
            <h1 className="text-5xl font-bold uppercase tracking-tight">{profile.name || "Your Name"}</h1>
            <p className="text-2xl mt-2 text-brand-400">{profile.targetRole || "Professional Role"}</p>
         </div>
         {profile.photo && (
           <img src={profile.photo} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-slate-700" />
         )}
      </div>

      <div className="flex flex-1">
        {/* Sidebar (Left in LTR) */}
        <div className="w-1/3 bg-slate-100 p-8 flex flex-col gap-8 border-r border-slate-200">
           {/* Contact */}
           <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-300 pb-2">Contact</h3>
              <div className="space-y-3 text-sm text-slate-700">
                 {profile.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-600"/><span>{profile.email}</span></div>}
                 {profile.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-600"/><span>{profile.phone}</span></div>}
              </div>
           </div>

           {/* Skills */}
           {profile.skills.length > 0 && (
             <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-300 pb-2">{t.skills}</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <span key={i} className="text-xs font-semibold text-white bg-slate-600 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
             </div>
           )}

            {/* Languages */}
           {profile.languages && profile.languages.length > 0 && (
             <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-300 pb-2">{t.languages}</h3>
                <ul className="space-y-2">
                  {profile.languages.map((lang, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                      {lang}
                    </li>
                  ))}
                </ul>
             </div>
           )}

           {/* Education */}
           {profile.education && (
             <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-300 pb-2">{t.education}</h3>
                <div className="flex items-start gap-2">
                   <GraduationCap className="w-5 h-5 text-brand-600 mt-0.5" />
                   <p className="text-sm text-slate-700 font-medium">{profile.education}</p>
                </div>
             </div>
           )}
        </div>

        {/* Main Content (Right in LTR) */}
        <div className="w-2/3 p-8 flex flex-col gap-8">
           {/* Summary */}
           {profile.summary && (
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <span className="w-8 h-1 bg-brand-500 block"></span> {t.personal_info}
                </h3>
                <p className="text-slate-600 leading-relaxed">{profile.summary}</p>
              </div>
           )}

           {/* Experience */}
           {profile.experience.length > 0 && (
              <div className="flex-1">
                 <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-8 h-1 bg-brand-500 block"></span> {t.experience}
                 </h3>
                 <div className="space-y-8 relative">
                    <div className="absolute left-[3px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                    {profile.experience.map(exp => (
                      <div key={exp.id} className="relative pl-6">
                         <div className="absolute left-[-2px] top-1.5 w-3 h-3 bg-brand-500 rounded-full border-2 border-white ring-2 ring-slate-100"></div>
                         <div className="flex justify-between items-baseline mb-1">
                           <h4 className="text-lg font-bold text-slate-800">{exp.role}</h4>
                           <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">{exp.duration}</span>
                         </div>
                         <p className="text-sm font-semibold text-slate-500 mb-2">{exp.company}</p>
                         <p className="text-slate-600 text-sm leading-relaxed">{exp.description}</p>
                      </div>
                    ))}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );

  const CreativeTemplate = () => (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Decorative BG */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-r from-purple-600 to-pink-500 z-0 transform -skew-y-3 origin-top-left scale-110"></div>
      
      {/* Header */}
      <div className="relative z-10 px-8 pt-12 pb-8 text-white flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tight mb-2 drop-shadow-md">{profile.name || "Your Name"}</h1>
            <p className="text-2xl font-light opacity-90">{profile.targetRole || "Creative Role"}</p>
            
            <div className="flex gap-4 mt-6 text-sm font-medium">
              {profile.email && <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2"><Mail className="w-3 h-3"/> {profile.email}</div>}
              {profile.phone && <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2"><Phone className="w-3 h-3"/> {profile.phone}</div>}
            </div>
          </div>
           {profile.photo && (
             <img src={profile.photo} alt="Profile" className="w-32 h-32 object-cover rounded-2xl border-4 border-white/50 shadow-xl transform rotate-3" />
           )}
      </div>

      <div className="flex flex-1 p-8 gap-8 relative z-10">
         {/* Main Column */}
         <div className="w-2/3 space-y-8">
            {profile.summary && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                 <h3 className="text-purple-600 font-bold uppercase tracking-wider text-sm mb-2">{t.personal_info}</h3>
                 <p className="text-slate-700 leading-relaxed">{profile.summary}</p>
              </div>
            )}

            {profile.experience.length > 0 && (
              <div>
                 <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="p-2 bg-pink-100 rounded-lg"><Briefcase className="w-5 h-5 text-pink-500" /></span>
                    {t.experience}
                 </h3>
                 <div className="space-y-6">
                    {profile.experience.map(exp => (
                       <div key={exp.id} className="group">
                          <div className="flex items-center gap-3 mb-1">
                             <h4 className="text-lg font-bold text-slate-800">{exp.role}</h4>
                             <div className="h-px bg-slate-200 flex-1"></div>
                             <span className="text-xs font-bold text-slate-400">{exp.duration}</span>
                          </div>
                          <p className="text-purple-600 font-medium text-sm mb-2">{exp.company}</p>
                          <p className="text-slate-600 text-sm leading-relaxed">{exp.description}</p>
                       </div>
                    ))}
                 </div>
              </div>
            )}
         </div>

         {/* Side Column */}
         <div className="w-1/3 space-y-8">
            {profile.skills.length > 0 && (
              <div>
                 <h3 className="text-lg font-bold text-slate-800 mb-4">{t.skills}</h3>
                 <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-purple-100 text-purple-700 rounded-lg text-sm font-semibold shadow-sm">
                        {skill}
                      </span>
                    ))}
                 </div>
              </div>
            )}

            {profile.languages && profile.languages.length > 0 && (
              <div>
                 <h3 className="text-lg font-bold text-slate-800 mb-4">{t.languages}</h3>
                 <div className="space-y-2">
                    {profile.languages.map((lang, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                         <Globe className="w-4 h-4 text-purple-500" />
                         <span className="font-medium">{lang}</span>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {profile.education && (
              <div className="bg-slate-900 text-white p-6 rounded-2xl">
                 <h3 className="text-pink-400 font-bold uppercase tracking-wider text-xs mb-4">{t.education}</h3>
                 <div className="flex gap-3">
                    <GraduationCap className="w-5 h-5 text-pink-500 flex-shrink-0" />
                    <p className="text-sm font-medium leading-relaxed">{profile.education}</p>
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 no-print">
        <h2 className="text-2xl font-bold text-slate-800">{t.resume_builder}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'editor' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <PenTool className="w-4 h-4" />
            {t.editor}
          </button>
          <button 
             onClick={() => setActiveTab('preview')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'preview' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Eye className="w-4 h-4" />
            {t.preview}
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="grid gap-8 animate-fade-in">
          {/* Personal Info */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-brand-700 mb-4 flex items-center gap-2">
               {t.personal_info}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
               {/* Photo Upload */}
               <div className="md:col-span-2 flex items-center gap-4 mb-4 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  {profile.photo ? (
                    <div className="relative">
                      <img src={profile.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm" />
                      <button onClick={removePhoto} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600"><Trash2 className="w-3 h-3"/></button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                     <label className="cursor-pointer bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition flex items-center gap-2">
                       <Upload className="w-4 h-4" />
                       {t.upload_photo}
                       <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                     </label>
                     <p className="text-xs text-slate-400 mt-1">Recommended: Square JPG/PNG</p>
                  </div>
               </div>

              <input 
                className="border p-2 rounded-lg w-full bg-slate-50" 
                placeholder="Full Name" 
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
              />
              <input 
                className="border p-2 rounded-lg w-full bg-slate-50" 
                placeholder={t.role_placeholder}
                value={profile.targetRole || ''}
                onChange={e => setProfile({...profile, targetRole: e.target.value})}
              />
              <input 
                className="border p-2 rounded-lg w-full bg-slate-50" 
                placeholder="Email" 
                value={profile.email}
                onChange={e => setProfile({...profile, email: e.target.value})}
              />
              <input 
                className="border p-2 rounded-lg w-full bg-slate-50" 
                placeholder="Phone" 
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
              />
            </div>
            <textarea 
              className="border p-2 rounded-lg w-full mt-4 bg-slate-50 h-24" 
              placeholder={t.summary_placeholder}
              value={profile.summary}
              onChange={e => setProfile({...profile, summary: e.target.value})}
            />
          </section>

          {/* Education */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-brand-700 mb-4">{t.education}</h3>
            <input 
                className="border p-2 rounded-lg w-full bg-slate-50" 
                placeholder="Degree, University, Year" 
                value={profile.education}
                onChange={e => setProfile({...profile, education: e.target.value})}
              />
          </section>

          {/* Experience */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-brand-700">{t.experience}</h3>
              <button onClick={addExperience} className="flex items-center gap-1 text-sm bg-brand-50 text-brand-600 hover:bg-brand-100 px-3 py-1 rounded-full transition">
                <Plus className="w-4 h-4" />
                {t.add_experience}
              </button>
            </div>
            
            <div className="space-y-6">
              {profile.experience.map((exp, idx) => (
                <div key={exp.id} className="relative p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <button 
                    onClick={() => removeExperience(exp.id)} 
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid md:grid-cols-3 gap-3 mb-3">
                    <input 
                      placeholder={t.role_placeholder}
                      className="border p-2 rounded w-full"
                      value={exp.role}
                      onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                    />
                    <input 
                      placeholder={t.company_placeholder}
                      className="border p-2 rounded w-full"
                      value={exp.company}
                      onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                    />
                    <input 
                      placeholder={t.duration_placeholder}
                      className="border p-2 rounded w-full"
                      value={exp.duration}
                      onChange={e => updateExperience(exp.id, 'duration', e.target.value)}
                    />
                  </div>
                  
                  <div className="relative">
                    <textarea 
                      placeholder="Description of responsibilities..." 
                      className="border p-2 rounded w-full h-32 pr-12"
                      value={exp.description}
                      onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                    />
                    <button 
                      onClick={() => handleEnhance(exp.id, exp.description)}
                      disabled={!!loadingEnhance}
                      className="absolute bottom-4 right-4 bg-brand-100 text-brand-700 p-2 rounded-full hover:bg-brand-200 transition"
                      title={t.ai_enhance}
                    >
                      {loadingEnhance === exp.id ? (
                        <div className="w-4 h-4 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {profile.experience.length === 0 && (
                <p className="text-center text-slate-400 italic py-4">No experience added yet.</p>
              )}
            </div>
          </section>

          {/* Skills & Languages */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-brand-700 mb-4">{t.skills}</h3>
              <textarea
                className="border p-2 rounded-lg w-full bg-slate-50 h-32"
                placeholder="e.g. React, Project Management, Leadership (comma separated)"
                value={profile.skills.join(', ')}
                onChange={e => setProfile({...profile, skills: e.target.value.split(',').map(s => s.trim())})}
              />
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-brand-700 mb-4">{t.languages}</h3>
              <textarea
                className="border p-2 rounded-lg w-full bg-slate-50 h-32"
                placeholder="e.g. English (Native), Arabic (Fluent) (comma separated)"
                value={profile.languages.join(', ')}
                onChange={e => setProfile({...profile, languages: e.target.value.split(',').map(s => s.trim())})}
              />
            </section>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col items-center">
            {/* Toolbar */}
            <div className="w-full flex justify-between items-center mb-6 no-print bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                 {/* Visual Template Selector */}
                 <div className="flex gap-4">
                    <TemplateThumbnail type={TemplateType.PROFESSIONAL} active={selectedTemplate === TemplateType.PROFESSIONAL} label={t.template_professional} />
                    <TemplateThumbnail type={TemplateType.MODERN} active={selectedTemplate === TemplateType.MODERN} label={t.template_modern} />
                    <TemplateThumbnail type={TemplateType.CREATIVE} active={selectedTemplate === TemplateType.CREATIVE} label={t.template_creative} />
                 </div>

                 <button 
                    onClick={handlePrint}
                    className="bg-slate-900 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 shadow-md transition-transform active:scale-95"
                 >
                    <Printer className="w-4 h-4" />
                    {t.download_pdf}
                 </button>
            </div>

            {/* Template Rendering */}
            <div id="resume-preview-container" className="bg-white shadow-2xl w-[210mm] min-h-[297mm] mx-auto text-slate-900 overflow-hidden" dir={lang === Language.ARABIC ? 'rtl' : 'ltr'}>
                {selectedTemplate === TemplateType.PROFESSIONAL && <ProfessionalTemplate />}
                {selectedTemplate === TemplateType.MODERN && <ModernTemplate />}
                {selectedTemplate === TemplateType.CREATIVE && <CreativeTemplate />}
            </div>
        </div>
      )}
    </div>
  );
};