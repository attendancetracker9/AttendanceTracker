import React from "react";
import { clsx } from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      "focus-ring w-full rounded-2xl border border-white/5 bg-surface/80 px-4 py-2 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={clsx(
      "focus-ring w-full rounded-2xl border border-white/5 bg-surface/80 px-4 py-2 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] transition",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={clsx(
      "focus-ring w-full rounded-2xl border border-white/5 bg-surface/80 px-4 py-2 text-sm text-[rgb(var(--text-primary))] transition",
      className
    )}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";

