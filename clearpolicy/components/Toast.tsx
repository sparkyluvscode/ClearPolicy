"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";

interface ToastItem {
  id: number;
  message: string;
}

interface ToastContextValue {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="glass-card rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--cp-text)] shadow-elevated animate-fade-up pointer-events-auto"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
