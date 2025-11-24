import React from "react";
import { clsx } from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "primary" | "muted" | "danger";
  interactive?: boolean;
};

type CardVariant = NonNullable<CardProps["variant"]>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, variant = "default", interactive = false, ...rest }, ref) => {
    const palette: Record<CardVariant, string> = {
      default: "bg-white text-slate-900 dark:bg-[rgb(var(--bg-elevated))] dark:text-[rgb(var(--text-primary))]",
      primary:
        "bg-teal-50 text-teal-900 dark:bg-teal-900/20 dark:text-teal-100 border border-teal-100/80 dark:border-teal-500/40",
      muted:
        "bg-slate-50 text-slate-900/80 dark:bg-slate-900/30 dark:text-slate-100 border border-slate-100 dark:border-white/10",
      danger:
        "bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-100 border border-rose-100/80 dark:border-rose-500/40"
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-3xl p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all",
          palette[variant],
          interactive && "hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.12)]",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";


