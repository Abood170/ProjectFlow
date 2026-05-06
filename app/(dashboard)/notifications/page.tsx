"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Crown, AlertCircle, Info, UserCheck, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; cls: string }> = {
  ASSIGNMENT: { icon: <UserCheck size={14} />, cls: "bg-violet-500/15 text-violet-400" },
  DUE_DATE:   { icon: <Clock size={14} />,     cls: "bg-amber-500/15 text-amber-400" },
  MENTION:    { icon: <Bell size={14} />,      cls: "bg-blue-500/15 text-blue-400" },
  INVITE:     { icon: <Crown size={14} />,     cls: "bg-amber-500/15 text-amber-400" },
  INFO:       { icon: <Info size={14} />,      cls: "bg-[var(--surface-2)] text-[var(--text-muted)]" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => { setNotifications(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const markAllRead = async () => {
    const res = await fetch("/api/notifications", { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {unreadCount > 0
              ? <span>{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</span>
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} size="sm">
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-[68px] rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-[var(--border)] rounded-2xl">
          <div className="h-16 w-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No notifications</h2>
          <p className="text-[var(--text-muted)] text-sm">You&apos;re all caught up! We&apos;ll let you know when something happens.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.INFO;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200",
                  !n.read
                    ? "bg-violet-500/5 border-violet-500/20 hover:bg-violet-500/8"
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-violet-500/20"
                )}
              >
                <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", cfg.cls)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm leading-snug",
                    !n.read ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                  )}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">{formatRelativeDate(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="h-2 w-2 rounded-full bg-violet-500 shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
