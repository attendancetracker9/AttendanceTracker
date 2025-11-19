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
  success: "bg-emerald-600 border-emerald-400 text-white backdrop-blur-sm",
  error: "bg-rose-600 border-rose-400 text-white backdrop-blur-sm",
  info: "bg-sky-600 border-sky-400 text-white backdrop-blur-sm"
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
                className={`pointer-events-auto rounded-2xl border-2 px-5 py-4 shadow-lg ${statusColors[toast.status]}`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {toast.title && <p className="text-base font-bold mb-1">{toast.title}</p>}
                    {toast.description && <p className="text-sm leading-relaxed opacity-95">{toast.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="rounded-full p-1.5 text-base font-bold transition hover:bg-white/20 hover:scale-110 flex-shrink-0"
                    aria-label="Dismiss notification"
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

