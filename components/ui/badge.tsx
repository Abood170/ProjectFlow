import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = "default", size = "sm", dot, className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]",
    purple:  "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10  text-amber-400  border border-amber-500/20",
    danger:  "bg-red-500/10   text-red-400   border border-red-500/20",
    info:    "bg-blue-500/10  text-blue-400  border border-blue-500/20",
  };

  const sizes: Record<string, string> = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      variants[variant], sizes[size], className
    )}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full",
        variant === "success" ? "bg-emerald-400" :
        variant === "warning" ? "bg-amber-400" :
        variant === "danger"  ? "bg-red-400" :
        variant === "purple"  ? "bg-violet-400" :
        variant === "info"    ? "bg-blue-400" : "bg-[var(--text-muted)]"
      )} />}
      {children}
    </span>
  );
}
