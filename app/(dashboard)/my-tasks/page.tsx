"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle, Filter, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";

type FilterType = "all" | "overdue" | "due-soon" | "done";

const PRIORITY_CONFIG = {
  URGENT: { cls: "bg-red-500/15 text-red-400 border-red-500/25" },
  HIGH:   { cls: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
  MEDIUM: { cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  LOW:    { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
};

export default function MyTasksPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetch("/api/my-tasks")
      .then((r) => r.json())
      .then((data) => { setCards(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const filtered = cards.filter((c) => {
    if (filter === "overdue") return isOverdue(c.dueDate) && !c.columnName?.toLowerCase().includes("done");
    if (filter === "due-soon") return isDueSoon(c.dueDate);
    if (filter === "done") return c.columnName?.toLowerCase().includes("done");
    return true;
  });

  const filterOptions: { key: FilterType; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all",      label: "All Tasks",  icon: <Filter size={13} />,           count: cards.length },
    { key: "overdue",  label: "Overdue",    icon: <AlertTriangle size={13} />,    count: cards.filter((c) => isOverdue(c.dueDate) && !c.columnName?.toLowerCase().includes("done")).length },
    { key: "due-soon", label: "Due Soon",   icon: <Clock size={13} />,            count: cards.filter((c) => isDueSoon(c.dueDate)).length },
    { key: "done",     label: "Completed",  icon: <CheckCircle2 size={13} />,     count: cards.filter((c) => c.columnName?.toLowerCase().includes("done")).length },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Tasks</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">All tasks assigned to you across projects</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filterOptions.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
              filter === f.key
                ? "gradient-purple text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-violet-500/30"
            )}
          >
            <span className={cn(filter === f.key ? "text-white/80" : (
              f.key === "overdue" ? "text-red-400" :
              f.key === "due-soon" ? "text-amber-400" :
              f.key === "done" ? "text-emerald-400" :
              "text-[var(--text-muted)]"
            ))}>
              {f.icon}
            </span>
            {f.label}
            <span className={cn(
              "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
              filter === f.key ? "bg-white/20 text-white" : "bg-[var(--surface-2)] text-[var(--text-muted)]"
            )}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl">
          <div className="h-14 w-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <ListChecks size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-primary)] font-semibold">No tasks found</p>
          <p className="text-[var(--text-muted)] text-sm mt-1.5">
            {filter === "all" ? "You have no assigned tasks yet." : "No tasks match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((card) => {
            const overdue = isOverdue(card.dueDate);
            const soon = isDueSoon(card.dueDate);
            const done = card.columnName?.toLowerCase().includes("done");
            const priorityCfg = PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.MEDIUM;

            return (
              <div
                key={card.id}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-xl border bg-[var(--surface)] transition-all duration-200 group",
                  "hover:border-violet-500/30 hover:-translate-y-0.5 hover:shadow-md",
                  overdue && !done
                    ? "border-l-2 border-l-red-500 border-[var(--border)]"
                    : "border-[var(--border)]"
                )}
              >
                {/* Status dot */}
                <div className={cn(
                  "h-4 w-4 rounded-full border-2 shrink-0 transition-all",
                  done ? "bg-emerald-500 border-emerald-500" : "border-[var(--border-strong)] group-hover:border-violet-500/50"
                )} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium text-[var(--text-primary)] truncate",
                    done && "line-through text-[var(--text-muted)]"
                  )}>
                    {card.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {card.projectName && (
                      <Link
                        href={`/projects/${card.projectId}`}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {card.projectName}
                      </Link>
                    )}
                    {card.columnName && (
                      <span className="text-xs text-[var(--text-muted)]">• {card.columnName}</span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    priorityCfg.cls
                  )}>
                    {card.priority}
                  </span>
                  {card.dueDate && (
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
                      overdue && !done ? "bg-red-500/10 text-red-400" :
                      soon ? "bg-amber-500/10 text-amber-400" :
                      "bg-[var(--surface-2)] text-[var(--text-muted)]"
                    )}>
                      <Clock size={9} />
                      {formatDate(card.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
