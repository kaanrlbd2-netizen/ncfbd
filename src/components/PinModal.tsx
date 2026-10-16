import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, ShieldAlert, X, Shuffle, CheckCircle } from 'lucide-react';
import { isValidAdminPin } from '../utils/serialGenerator';

interface PinModalProps {
  isOpen: boolean;
  totalStudents: number;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  totalStudents,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isValidAdminPin(pin)) {
      onSuccess();
    } else {
      setError('ভুল পিন কোড! অনুগ্রহ করে সঠিক পিন দিয়ে আবার চেষ্টা করুন।');
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              সিরিয়াল তৈরি ও ক্রম পরিবর্তন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              নিরাপত্তা যাচাইকরণ (প্রশাসক পিন আবশ্যক)
            </p>
          </div>
        </div>

        <div className="mb-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 leading-relaxed">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
            <Shuffle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>মোট শিক্ষার্থী: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{totalStudents}</strong> জন</span>
          </div>
          <p>
            • প্রতিটি স্কুলের জন্য নিজস্ব কোড দিয়ে ফরম্যাট অনুযায়ী সিরিয়াল নম্বর তৈরি হবে (যেমন: BB88, CC101)।
          </p>
          <p>
            • সিরিয়াল কখনো ১, ২, ৩ থেকে শুরু হবে না এবং সকল পূর্ববর্তী সিরিয়াল প্রতিস্থাপিত হবে।
          </p>
          <p>
            • শিক্ষার্থীদের সিরিয়াল ক্রম এলোমেলো (Shuffle) হয়ে নতুন বিন্যাসে স্থায়ীভাবে সংরক্ষিত হবে।
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              প্রশাসক পিন (Admin PIN) প্রবেশ করান:
            </label>
            <input
              ref={inputRef}
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              placeholder=""
              autoComplete="off"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-white"
            />
            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={pin.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>সিরিয়াল তৈরি নিশ্চিত করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
