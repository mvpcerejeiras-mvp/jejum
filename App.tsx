import React, { useState, useEffect } from 'react';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import HomeDashboard from './components/HomeDashboard';
import WeeklySchedule from './components/WeeklySchedule';
import { PrayerClock } from './components/PrayerClock';
import { getSettings } from './services/db';
import { DEFAULT_THEME, DEFAULT_INSTRUCTION, DEFAULT_APP_TITLE, DEFAULT_LOGO, DEFAULT_DAYS } from './constants';
import { Flame, Lock, Cross, BookOpen, Heart, Sun, Mountain, Star, Moon, Sparkles } from 'lucide-react';
import { useParticipation } from './contexts/ParticipationContext';
import { Wizard } from './components/UnifiedParticipation/Wizard';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'form' | 'admin' | 'login' | 'schedule' | 'clock' | 'wizard'>('home');
  const [password, setPassword] = useState('');
  const [appSettings, setAppSettings] = useState({
    theme: DEFAULT_THEME,
    instruction: DEFAULT_INSTRUCTION,
    appTitle: DEFAULT_APP_TITLE,
    logoId: DEFAULT_LOGO,
    fastDays: DEFAULT_DAYS
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, hasParticipated, getGreeting } = useParticipation() as any;

  // Initialize Dark Mode based on localStorage or System Preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('jejum_theme_mode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('jejum_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('jejum_theme_mode', 'light');
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setAppSettings(settings);
    };
    loadSettings();
  }, [refreshKey]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setView('admin');
      setPassword('');
    } else {
      alert('Senha incorreta. (Dica: admin123)');
    }
  };

  const getLogoComponent = (id: string) => {
    if (id?.startsWith('http')) {
      return <img src={id} alt="Logo" className="w-full h-full object-cover" />;
    }

    const props = { className: "w-12 h-12 text-orange-300" };
    switch (id) {
      case 'cross': return <Cross {...props} />;
      case 'book': return <BookOpen {...props} />;
      case 'heart': return <Heart {...props} />;
      case 'sun': return <Sun {...props} />;
      case 'mountain': return <Mountain {...props} />;
      case 'star': return <Star {...props} />;
      case 'flame':
      default: return <Flame {...props} />;
    }
  };

  if (view === 'wizard') {
    return (
      <Wizard onExit={() => setView('home')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 pb-10 transition-colors duration-300">

      {/* Decorative Background Header */}
      <div className="h-64 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-black relative overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-950 transition-colors duration-300"></div>

        {/* Theme Toggle Absolute Position */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all border border-white/10"
            title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <div className={`mx-auto px-4 -mt-48 relative z-10 transition-all duration-500 ease-in-out ${view === 'admin' ? 'max-w-7xl' : 'max-w-3xl'}`}>

        {/* Main Header Content */}
        <div className="text-center mb-8">
          <div
            onClick={() => setView('home')}
            className="flex items-center justify-center w-32 h-32 mx-auto p-0 bg-white/10 backdrop-blur-sm rounded-full mb-4 ring-1 ring-white/20 shadow-lg animate-fade-in-up cursor-pointer hover:bg-white/20 transition-all overflow-hidden"
          >
            {getLogoComponent(appSettings.logoId || 'flame')}
          </div>
          <h1
            onClick={() => setView('home')}
            className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight cursor-pointer drop-shadow-md"
          >
            {appSettings.appTitle || 'Jejum Congregacional'}
          </h1>
          <div className="inline-block bg-indigo-500/30 backdrop-blur px-4 py-1 rounded-full border border-indigo-400/30 mt-2">
            <span className="text-indigo-100 font-medium text-sm uppercase tracking-wider shadow-sm">
              {appSettings.theme}
            </span>
          </div>

          {/* Dynamic Greeting */}
          {user && (
            <div className="mt-4 animate-fade-in-up">
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm font-sans">
                {getGreeting()}
              </h2>
            </div>
          )}
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">


          {view === 'home' && (
            <div className="p-6 md:p-8 space-y-6">

              {!user ? (
                /* Prompt to Login/Identify First */
                <div
                  onClick={() => setView('wizard')}
                  className="bg-indigo-600 rounded-xl p-8 text-center text-white cursor-pointer hover:bg-indigo-700 transition-all border border-indigo-500 shadow-xl group"
                >
                  <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles size={32} />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Identifique-se para começar</h2>
                  <p className="text-indigo-100 text-sm">Toque aqui para informar seu telefone e acessar o painel.</p>
                </div>
              ) : (
                /* Unified Wizard Entry Point - Participation Aware */
                <div
                  onClick={() => setView('wizard')}
                  className="cta-shine-effect bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-700 rounded-2xl p-7 text-white cursor-pointer shadow-2xl shadow-indigo-500/40 hover:scale-[1.03] transition-all duration-300 group relative border border-white/10"
                >
                  {/* Decorative background blobs */}
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                  <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-colors"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 mb-1">
                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border border-white/20">
                          {hasParticipated ? 'Acessar Plano' : 'Unificados'}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black mb-1 group-hover:text-white transition-colors tracking-tight">
                        {hasParticipated ? 'Minha Participação' : 'Participar Agora'}
                      </h2>
                      <p className="text-indigo-100/90 text-sm font-medium leading-tight">
                        {hasParticipated
                          ? 'Veja ou edite seus dias e horários.'
                          : 'Jejum e Relógio de Oração em um só lugar.'
                        }
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl ring-1 ring-white/30 group-hover:bg-white/20 group-hover:ring-white/50 transition-all duration-500 shadow-xl"
                        style={{ animation: 'icon-pulse 3s infinite ease-in-out' }}
                      >
                        <Sparkles size={32} className="text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {user && (
                <HomeDashboard
                  onJoin={() => setView('wizard')}
                  onViewSchedule={() => setView('schedule')}
                  onViewClock={() => setView('clock')}
                  fastDays={appSettings.fastDays}
                  appSettings={appSettings}
                />
              )}
            </div>
          )}

          {view === 'wizard' && (
            // Render Wizard outside the standard container? 
            // Ideally Wizard takes full screen. But we are inside Layout.
            // We should render Wizard at root or conditional render.
            // Let's modify the render return to show Wizard Full Screen.
            // See 'Conditional Full Screen' logic below.
            <div className="p-12 text-center text-slate-500">Iniciando...</div>
          )}

          {view === 'form' && (
            <div className="p-6 md:p-8">
              <div className="mb-6 text-center">
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-sm md:text-base leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700 italic transition-colors">
                  {appSettings.instruction}
                </p>
              </div>
              <RegistrationForm
                onSuccess={() => setView('home')}
                onCancel={() => setView('home')}
                fastDays={appSettings.fastDays}
              />
            </div>
          )}

          {view === 'schedule' && (
            <div className="p-6 md:p-8">
              <WeeklySchedule
                onBack={() => setView('home')}
                fastDays={appSettings.fastDays}
              />
            </div>
          )}

          {view === 'clock' && (
            <div className="relative">
              <button
                onClick={() => setView('home')}
                className="absolute top-4 left-4 z-10 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white text-gray-600"
              >
                ← Voltar
              </button>
              <PrayerClock />
            </div>
          )}

          {view === 'login' && (
            <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
                <Lock className="w-8 h-8 text-slate-500 dark:text-slate-400" />
              </div>
              <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">Acesso Pastoral</h2>
              <form onSubmit={handleAdminLogin} className="w-full max-w-xs space-y-4">
                <input
                  type="password"
                  placeholder="Senha de acesso"
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className="w-full bg-slate-800 dark:bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-slate-900 dark:hover:bg-indigo-700 transition">
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setView('home')}
                  className="w-full text-slate-500 dark:text-slate-400 text-sm py-2 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Voltar ao início
                </button>
              </form>
            </div>
          )}

          {view === 'admin' && (
            <AdminDashboard
              onLogout={() => setView('home')}
              onSettingsChange={() => setRefreshKey(k => k + 1)}
            />
          )}

        </div>

        {/* Footer / Admin Trigger */}
        <footer className="mt-8 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-xs mb-2">
            "Por isso jejuamos e suplicamos essa bênção ao nosso Deus, e ele nos atendeu." — Esdras 8:23
          </p>
          {(view === 'home' || view === 'form') && (
            <button
              onClick={() => setView('login')}
              className="text-slate-500 dark:text-slate-500 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs p-2 mt-2 border-b border-transparent hover:border-indigo-600 dark:hover:border-indigo-400"
            >
              Área Administrativa
            </button>
          )}
        </footer>

      </div>
    </div>
  );
};

export default App;