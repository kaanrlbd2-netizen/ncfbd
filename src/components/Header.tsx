import {
  GraduationCap,
  Settings as SettingsIcon,
  Users,
  FileText,
  Moon,
  Sun,
  Award,
  Trophy,
  LogOut,
} from 'lucide-react';
import { ActiveTab, InstitutionConfig } from '../types';

interface HeaderProps {
  institution: InstitutionConfig;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  studentCount: number;
  schoolCount: number;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  institution,
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode,
  studentCount,
  schoolCount,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Topmost Institution Branding Strip (Mandatory Requirement 1) */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-4 py-3 sm:py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {institution.logo ? (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white p-1 shrink-0 shadow-xs overflow-hidden flex items-center justify-center">
                <img
                  src={institution.logo}
                  alt="লোগো"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/15 text-emerald-300 shrink-0">
                <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                {institution.name || 'পরীক্ষা নিয়ন্ত্রণ সিস্টেম'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 font-light mt-0.5">
                {institution.tagline || 'স্বচ্ছ ও নির্ভুল ফলাফল ব্যবস্থাপনা'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-emerald-100">
            <span className="bg-emerald-950/60 border border-emerald-400/30 px-2.5 py-1 rounded-md font-mono tabular-nums">
              স্কুল: {schoolCount}
            </span>
            <span className="bg-emerald-950/60 border border-emerald-400/30 px-2.5 py-1 rounded-md font-mono tabular-nums">
              শিক্ষার্থী: {studentCount} জন
            </span>
          </div>
        </div>
      </div>

      {/* Navigation and Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('students')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'students'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>শিক্ষার্থী তালিকা ও এন্ট্রি</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'results'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>রেজাল্ট তৈরি করুন</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'pdf'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>PDF ভিউ ও প্রিন্ট</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>সেটিংস (Settings)</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={isDarkMode ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors"
            title="লগআউট করুন"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </div>
    </header>
  );
};
