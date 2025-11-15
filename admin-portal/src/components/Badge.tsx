import React from "react";
import { clsx } from "clsx";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default: "bg-white/10 text-[rgb(var(--text-primary))]",
  success: "bg-emerald-500/20 text-emerald-200",
  warning: "bg-amber-500/20 text-amber-200",
  danger: "bg-rose-500/20 text-rose-100",
  info: "bg-sky-500/20 text-sky-100"
};

export const Badge: React.FC<BadgeProps> = ({ children, tone = "default" }) => (
  <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", toneClasses[tone])}>
    {children}
  </span>
);

