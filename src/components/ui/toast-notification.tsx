"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, title };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-md pointer-events-none">
        {toasts.map((toast) => {
          const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;
          
          return (
            <div
              key={toast.id}
              className="pointer-events-auto animate-in slide-in-from-top-5 duration-300"
            >
              <Alert
                variant={toast.type === 'error' ? 'destructive' : 'default'}
                className={cn(
                  "relative shadow-lg",
                  toast.type === 'success' && "border-green-500/50 bg-green-950/50 text-green-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
                <AlertDescription className="pr-6">
                  {toast.message}
                </AlertDescription>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="absolute top-3 right-3 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </Alert>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
