"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, ArrowRight, Flag, Calendar,
  UserCheck, MessageSquare, Pencil, Clock, Activity as ActivityIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ActivityLogWithUser } from "@/types";

function getActivityMeta(action: string) {
  if (action.includes("created"))     return { icon: Plus,          color: "text-emerald-400", bg: "bg-emerald-500/15" };
  if (action.includes("deleted"))     return { icon: Trash2,        color: "text-red-400",     bg: "bg-red-500/15" };
  if (action.includes("moved"))       return { icon: ArrowRight,    color: "text-blue-400",    bg: "bg-blue-500/15" };
  if (action.includes("priority"))    return { icon: Flag,          color: "text-orange-400",  bg: "bg-orange-500/15" };
  if (action.includes("due date"))    return { icon: Calendar,      color: "text-amber-400",   bg: "bg-amber-500/15" };
  if (action.includes("assigned") || action.includes("unassigned"))
                                      return { icon: UserCheck,     color: "text-violet-400",  bg: "bg-violet-500/15" };
  if (action.includes("comment"))     return { icon: MessageSquare, color: "text-cyan-400",    bg: "bg-cyan-500/15" };
  if (action.includes("renamed") || action.includes("description"))
                                      return { icon: Pencil,        color: "text-purple-400",  bg: "bg-purple-500/15" };
  return                               { icon: ActivityIcon,        color: "text-[var(--text-muted)]", bg: "bg-[var(--surface-2)]" };
}

function groupByDate(logs: ActivityLogWithUser[]): [string, ActivityLogWithUser[]][] {
  const map = new Map<string, ActivityLogWithUser[]>();
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const log of logs) {
    const d = new Date(log.createdAt);
    let key: string;
    if (d.toDateString() === today.toDateString())     key = "Today";
    else if (d.toDateString() === yesterday.toDateString()) key = "Yesterday";
    else key = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }
  return Array.from(map.entries());
}

export default function ActivityPage() {
  const [logs, setLogs]       = useState<ActivityLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => { setLogs(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const grouped = groupByDate(logs);

  return (
    <div className="animate-fade-in-up max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Activity</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">All workspace activity across your projects</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((g) => (
            <div key={g}>
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton h-3 w-12 rounded-full" />
                <div className="skeleton h-px flex-1" />
              </div>
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 px-4 py-3 items-start">
                    <div className="skeleton h-9 w-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="skeleton h-3.5 rounded-lg w-2/3" />
                      <div className="skeleton h-3 rounded-lg w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-[var(--border)] rounded-2xl">
          <div className="h-16 w-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No activity yet</h2>
          <p className="text-[var(--text-muted)] text-sm">Actions taken in your workspace will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([dateLabel, dateLogs]) => (
            <div key={dateLabel}>
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">{dateLabel}</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[22px] top-5 bottom-5 w-px bg-[var(--border)]" />

                <div className="space-y-0.5">
                  {dateLogs.map((log) => {
                    const meta = getActivityMeta(log.action);
                    const Icon = meta.icon;
                    const cardTitle = (log.metadata as { cardTitle?: string } | null)?.cardTitle;
                    return (
                      <div
                        key={log.id}
                        className="flex gap-3 px-4 py-3 rounded-xl hover:bg-[var(--surface-2)] transition-colors group"
                      >
                        {/* Icon */}
                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-105", meta.bg)}>
                          <Icon size={14} className={meta.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-start gap-2">
                            <Avatar name={log.user.name} src={log.user.avatar} size="xs" className="shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[var(--text-secondary)] leading-snug">
                                <span className="font-semibold text-[var(--text-primary)]">{log.user.name || "Someone"}</span>
                                {" "}{log.action}
                              </p>
                              {cardTitle && (
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                  on &ldquo;{cardTitle}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Time */}
                        <span className="text-[11px] text-[var(--text-muted)] shrink-0 pt-1.5">
                          {formatRelativeDate(log.createdAt.toString())}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
