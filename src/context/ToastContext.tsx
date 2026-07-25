"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  error:   <AlertCircle  className="w-4 h-4 shrink-0" />,
  info:    <Info         className="w-4 h-4 shrink-0" />,
};

const STYLES = {
  success: "bg-[#15463b] text-white border-[#1a5c44]",
  error:   "bg-[#7c1d10] text-white border-[#9b2417]",
  info:    "bg-[#23211b] text-white border-[#3a352b]",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{    opacity: 0, x: 80 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.18)] min-w-[280px] max-w-[360px] ${STYLES[toast.type]}`}
    >
      {ICONS[toast.type]}
      <span className="flex-1 text-[13px] font-semibold leading-snug">{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
