import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { nanoid } from "nanoid";

type ToastStatus = "success" | "error" | "info";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  status: ToastStatus;
};

type ToastContextValue = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const statusColors: Record<ToastStatus, string> = {
  success: "bg-emerald-500/20 border-emerald-400 text-emerald-100",
  error: "bg-rose-500/20 border-rose-400 text-rose-100",
  info: "bg-sky-500/20 border-sky-400 text-sky-100"
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    setToasts((prev) => [...prev, { ...toast, id: nanoid() }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[200] flex items-start justify-end p-6">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onAnimationComplete={() => {
                  setTimeout(() => dismiss(toast.id), 3500);
                }}
                className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-soft ${statusColors[toast.status]}`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
                    {toast.description && <p className="text-sm text-slate-200">{toast.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="rounded-full p-1 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

