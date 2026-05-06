"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "glass";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-xl select-none " +
      "transition-all duration-200 ease-out " +
      "focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-1 focus:ring-offset-transparent " +
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none " +
      "active:scale-[0.97]";

    const variants: Record<string, string> = {
      primary:
        "gradient-purple text-white shadow-purple " +
        "hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_6px_32px_rgba(124,58,237,0.45)]",
      secondary:
        "bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border)] " +
        "hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:-translate-y-0.5 " +
        "hover:shadow-md-custom",
      outline:
        "border border-[var(--border-strong)] text-[var(--text-secondary)] bg-transparent " +
        "hover:border-purple-500/50 hover:text-purple-400 hover:bg-[var(--purple-glow)] hover:-translate-y-0.5",
      ghost:
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
      danger:
        "bg-gradient-to-r from-red-600 to-rose-500 text-white " +
        "hover:from-red-500 hover:to-rose-400 hover:-translate-y-0.5 " +
        "hover:shadow-[0_4px_20px_rgba(239,68,68,0.4)]",
      glass:
        "glass text-[var(--text-primary)] hover:-translate-y-0.5 " +
        "hover:border-purple-500/30 hover:shadow-md-custom",
    };

    const sizes: Record<string, string> = {
      xs: "px-2.5 py-1    text-xs  gap-1.5",
      sm: "px-3.5 py-1.5  text-sm  gap-1.5",
      md: "px-4.5 py-2    text-sm  gap-2",
      lg: "px-6   py-2.5  text-sm  gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
