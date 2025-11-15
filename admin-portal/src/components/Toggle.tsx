import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={clsx(
      "focus-ring flex w-full items-center justify-between gap-4 rounded-2xl border border-white/5 bg-surface/80 px-4 py-3 text-left transition hover:border-white/10",
      disabled && "cursor-not-allowed opacity-60"
    )}
  >
    <div>
      {label && <p className="text-sm font-semibold">{label}</p>}
      {description && <p className="text-xs text-[rgb(var(--text-muted))]">{description}</p>}
    </div>
    <span
      className={clsx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition",
        checked ? "bg-primary/80" : "bg-white/10"
      )}
      role="switch"
      aria-checked={checked}
    >
      <motion.span
        layout
        className="inline-block h-5 w-5 rounded-full bg-white shadow"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{ x: checked ? 22 : 2 }}
      />
    </span>
  </button>
);

