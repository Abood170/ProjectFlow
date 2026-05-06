import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full rounded-xl border bg-[var(--surface)] px-3.5 py-2.5 text-sm resize-none",
            "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "border-[var(--border)] transition-all duration-200",
            "focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20",
            "hover:border-[var(--border-strong)]",
            error && "border-red-500/60 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
