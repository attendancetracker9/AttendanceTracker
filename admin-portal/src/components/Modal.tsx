import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, description, actions, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-modal="true"
        role="dialog"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="w-full max-w-2xl rounded-3xl bg-[rgb(var(--bg-elevated))] p-6 shadow-soft"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{title}</h2>}
              {description && <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{description}</p>}
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Close modal">
              ×
            </Button>
          </div>
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">{children}</div>
          {actions && <div className="mt-6 flex justify-end gap-3">{actions}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

