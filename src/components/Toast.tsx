import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgStyles =
    toast.type === 'success'
      ? 'bg-emerald-800 text-white border border-emerald-700 shadow-lg'
      : toast.type === 'error'
      ? 'bg-rose-800 text-white border border-rose-700 shadow-lg'
      : 'bg-slate-900 text-white border border-slate-700 shadow-lg';

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${bgStyles}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-sky-300 shrink-0" />}
        <p className="text-sm font-medium leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/70 hover:text-white p-1 rounded-md transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
