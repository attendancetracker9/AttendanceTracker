import { motion, type HTMLMotionProps } from "framer-motion";
import React from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary/90 text-[rgb(var(--bg-base))] hover:bg-primary focus-visible:ring-primary disabled:bg-primary/40 disabled:text-[rgb(var(--bg-base))]/60",
  secondary:
    "bg-surface/60 text-[rgb(var(--text-primary))] border border-white/5 hover:bg-white/10 focus-visible:ring-secondary",
  ghost: "bg-transparent text-[rgb(var(--text-primary))] hover:bg-white/5 focus-visible:ring-secondary",
  danger: "bg-rose-500 text-white hover:bg-rose-400 focus-visible:ring-rose-400"
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  icon,
  fullWidth,
  className,
  disabled,
  ...props
}) => (
  <motion.button
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    whileHover={{ y: disabled ? 0 : -2 }}
    className={clsx(
      "focus-ring group inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
      variantClasses[variant],
      disabled && "cursor-not-allowed opacity-70",
      fullWidth && "w-full",
      className
    )}
    disabled={disabled}
    {...props}
  >
    {icon && <span className="text-lg">{icon}</span>}
    {children}
  </motion.button>
);

