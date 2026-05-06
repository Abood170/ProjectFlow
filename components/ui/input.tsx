import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, iconRight, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-xl border bg-[var(--surface-2)] px-3.5 py-2.5 text-sm",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "border-[var(--border)] transition-all duration-200",
              "focus:outline-none focus:bg-[var(--surface)]",
              "focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15",
              "focus:shadow-[0_0_0_4px_rgba(147,51,234,0.08)]",
              "hover:border-[var(--border-strong)]",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              icon && "pl-10",
              iconRight && "pr-10",
              error && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/15",
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {iconRight}
            </div>
          )}
        </div>
        {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
        {error && <p className="text-xs text-red-400 flex items-center gap-1.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
