import React from 'react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  User, 
  Settings, 
  LogOut, 
  Globe,
  Menu,
  X,
  Trash2,
  Navigation
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onReset: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, lang, setLang, onReset }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const t = TRANSLATIONS[lang];
  const isRTL = lang === Language.ARABIC;

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-colors ${
        currentView === view
          ? 'bg-brand-50 text-brand-700 font-semibold'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className={`w-5 h-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
      <span>{label}</span>
    </button>
  );

  const Logo = () => (
    <div className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg transform rotate-3">
        <Navigation className="w-6 h-6 -rotate-3" />
      </div>
      <div className="mx-3 flex flex-col">
        <span className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">Job_path</span>
        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Career AI</span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-slate-50 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-x border-slate-200 h-screen sticky top-0 shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-center">
          <Logo />
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label={t.dashboard} />
          <NavItem view={ViewState.RESUME_BUILDER} icon={FileText} label={t.resume_builder} />
          <NavItem view={ViewState.JOB_MATCH} icon={Briefcase} label={t.job_match} />
          <NavItem view={ViewState.INTERVIEW_SETUP} icon={User} label={t.mock_interview} />
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
           <button 
            onClick={() => setLang(lang === Language.ENGLISH ? Language.ARABIC : Language.ENGLISH)}
            className="flex items-center w-full px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Globe className={`w-5 h-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <span>{lang === Language.ENGLISH ? 'العربية' : 'English'}</span>
          </button>
           <button 
            onClick={onReset}
            className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition group"
          >
            <Trash2 className={`w-5 h-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <span className="group-hover:font-semibold">{t.reset_data}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20 sticky top-0">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <Logo />
           <button onClick={() => setLang(lang === Language.ENGLISH ? Language.ARABIC : Language.ENGLISH)} className="p-2 text-slate-600 font-bold text-sm">
             {lang === Language.ENGLISH ? 'AR' : 'EN'}
           </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className={`absolute top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-64 bg-white shadow-xl p-4 transition-transform`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                 <Logo />
                 <button onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <nav>
                <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label={t.dashboard} />
                <NavItem view={ViewState.RESUME_BUILDER} icon={FileText} label={t.resume_builder} />
                <NavItem view={ViewState.JOB_MATCH} icon={Briefcase} label={t.job_match} />
                <NavItem view={ViewState.INTERVIEW_SETUP} icon={User} label={t.mock_interview} />
                
                <div className="border-t border-slate-100 my-4 pt-4">
                  <button 
                    onClick={() => {
                      onReset();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className={`w-5 h-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                    <span>{t.reset_data}</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
};