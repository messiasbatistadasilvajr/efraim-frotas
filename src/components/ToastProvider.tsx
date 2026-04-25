import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto hide after 5s
    setTimeout(() => {
      hideToast(id);
    }, 5000);
  }, [hideToast]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <XCircle className="text-rose-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
    warning: <AlertCircle className="text-amber-500" size={18} />,
  };

  const colors = {
    success: 'border-emerald-100 bg-emerald-50',
    error: 'border-rose-100 bg-rose-50',
    info: 'border-blue-100 bg-blue-50',
    warning: 'border-amber-100 bg-amber-50',
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 min-w-[320px] max-w-[420px]">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right-8 duration-300",
              colors[toast.type]
            )}
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <p className="flex-1 text-[14px] font-medium text-ink leading-tight">
              {toast.message}
            </p>
            <button 
              onClick={() => hideToast(toast.id)}
              className="p-1 hover:bg-ink/5 rounded-lg transition-colors"
            >
              <X size={14} className="text-subtle" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
