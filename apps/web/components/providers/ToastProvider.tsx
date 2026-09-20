"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "destructive" | "default";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

interface ToastOptions {
  message?: string;
  type?: ToastType;
}

interface ShadcnToastArgs {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "info";
}

interface ToastContextType {
  showToast: (title: string, options?: ToastOptions) => void;
  toast: (args: ShadcnToastArgs) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  toast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((title: string, message?: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const normalizedType: "success" | "error" | "info" =
      type === "destructive" || type === "error"
        ? "error"
        : type === "success"
        ? "success"
        : "info";

    const newToast: Toast = {
      id,
      title,
      message,
      type: normalizedType,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showToast = useCallback(
    (title: string, options?: ToastOptions) => {
      pushToast(title, options?.message, options?.type || "info");
    },
    [pushToast]
  );

  const toast = useCallback(
    (args: ShadcnToastArgs) => {
      const type: ToastType = args.variant === "destructive" ? "error" : args.variant || "info";
      pushToast(args.title, args.description, type);
    },
    [pushToast]
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-fade-in bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          >
            {t.type === "success" && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            )}
            {t.type === "error" && (
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            {t.type === "info" && (
              <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{t.title}</p>
              {t.message && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {t.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
