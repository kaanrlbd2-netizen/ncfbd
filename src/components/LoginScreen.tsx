import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, GraduationCap, ArrowRight } from 'lucide-react';
import { InstitutionConfig } from '../types';

interface LoginScreenProps {
  institution: InstitutionConfig;
  correctPassword: string;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  institution,
  correctPassword,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Small delay for clean feedback
    setTimeout(() => {
      const targetPass = (correctPassword || '1971').trim();
      if (password.trim() === targetPass) {
        onLoginSuccess();
      } else {
        setError('ভুল পাসওয়ার্ড! সঠিক অ্যাডমিন পাসওয়ার্ড প্রদান করুন।');
        setIsLoading(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Top Branding Card */}
        <div className="text-center mb-8">
          {institution.logo ? (
            <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-white p-2 shadow-xl flex items-center justify-center overflow-hidden border border-slate-700">
              <img
                src={institution.logo}
                alt="প্রতিষ্ঠানের লোগো"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
              <GraduationCap className="w-8 h-8" />
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            {institution.name || 'পরীক্ষা নিয়ন্ত্রণ সিস্টেম'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/80 mt-1">
            {institution.tagline || 'স্বচ্ছ ও নির্ভুল ফলাফল ব্যবস্থাপনা'}
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                প্রশাসক প্রবেশাধিকার (Admin Login)
              </h2>
              <p className="text-xs text-slate-400">
                সিস্টেমে প্রবেশ করতে অ্যাডমিন পাসওয়ার্ড দিন
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                অ্যাডমিন পাসওয়ার্ড (Admin Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="পাসওয়ার্ড লিখুন..."
                  autoFocus
                  className="w-full pl-4 pr-11 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-500"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {error && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || password.length === 0}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg transition-all"
            >
              <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Permanent Footer */}
        <div className="text-center mt-8 text-xs text-slate-500">
          <p className="text-emerald-400/90 font-medium">Developed by, "খান আবু আব্দুল্লাহ"</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Firebase ক্লাউড ডেটাবেসের সাথে সংযুক্ত</p>
        </div>
      </div>
    </div>
  );
};
