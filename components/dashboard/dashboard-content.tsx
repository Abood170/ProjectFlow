"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  CheckCircle2, Clock, AlertTriangle, FolderKanban,
  ArrowRight, TrendingUp, Zap, Target, ArrowUpRight,
  Plus, Users, LayoutGrid, ListChecks,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeDate, isOverdue } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

/* ── Animated counter ─────────────────────────────────────────────────────── */
function CountUp({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <>{value}</>;
}

/* ── Priority helpers ─────────────────────────────────────────────────────── */
function priorityVariant(p: string): "danger" | "warning" | "success" | "info" | "default" {
  if (p === "URGENT" || p === "HIGH") return "danger";
  if (p === "MEDIUM") return "warning";
  return "success";
}

/* ── Custom chart tooltip ─────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3 py-2.5 shadow-lg border border-[var(--border-strong)]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1">
        {format(parseISO(label), "EEEE, MMM d")}
      </p>
      <p className="font-bold text-[var(--text-primary)] tabular-nums">{payload[0].value} completed</p>
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, gradient, trend, href }: {
  label: string; value: number; icon: React.ReactNode;
  gradient: string; trend?: string; href?: string;
}) {
  const inner = (
    <div className={cn(
      "relative rounded-2xl p-5 overflow-hidden group",
      "border border-[var(--border)] bg-[var(--surface)]",
      "transition-all duration-300 cursor-default",
      "hover:-translate-y-1.5 hover:border-[var(--border-strong)]",
      "hover:shadow-[0_8px_40px_rgba(0,0,0,0.15),0_0_0_1px_rgba(124,58,237,0.12)]"
    )}>
      {/* Ambient glow blob */}
      <div className={cn("absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity", gradient)} />

      {/* Icon */}
      <div className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4",
        gradient,
        "shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
      )}>
        {icon}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold tabular-nums gradient-purple-text">
        <CountUp target={value} />
      </p>
      <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">{label}</p>

      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400 font-semibold">
          <ArrowUpRight size={12} /> {trend}
        </div>
      )}

      {href && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={13} className="text-[var(--text-muted)]" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

/* ── Quick action button ──────────────────────────────────────────────────── */
function QuickAction({ icon, label, href, color }: {
  icon: React.ReactNode; label: string; href: string; color: string;
}) {
  return (
    <Link href={href}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl text-center",
        "border border-[var(--border)] bg-[var(--surface)]",
        "hover:border-[var(--border-strong)] hover:-translate-y-1 hover:shadow-md-custom",
        "transition-all duration-200 group"
      )}
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", color,
        "group-hover:scale-110 transition-transform duration-200")}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
        {label}
      </span>
    </Link>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export function DashboardContent({ data, userName }: { data: any; userName?: string | null }) {
  if (!data) {
    return (
      <div className="text-center py-28">
        <div className="relative inline-flex mb-6">
          <div className="h-20 w-20 rounded-2xl gradient-purple flex items-center justify-center shadow-purple animate-float">
            <FolderKanban size={32} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl animate-orbit-glow opacity-60" />
        </div>
        <h2 className="text-2xl font-bold gradient-heading mb-2">Welcome to ProjectFlow!</h2>
        <p className="text-[var(--text-secondary)] mb-6 max-w-xs mx-auto">Create your first project to start managing tasks with your team.</p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-purple text-white font-semibold text-sm shadow-purple hover:brightness-110 hover:-translate-y-0.5 transition-all active:scale-[0.97]"
        >
          <Plus size={16} /> Create Your First Project
        </Link>
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const first = userName?.split(" ")[0] || "there";
  const totalToday = data.completionByDay?.at(-1)?.count ?? 0;

  return (
    <div className="space-y-7 stagger">

      {/* ── Welcome banner ─────────────────────────────────────────── */}
      <div className="animate-fade-in-up relative overflow-hidden rounded-2xl p-6 banner-gradient">
        {/* Floating orbs */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-4 left-1/2 h-16 w-16 rounded-full bg-white/8 blur-xl" />

        {/* Subtle dot grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1.5">{greeting()}</p>
            <h1 className="text-2xl font-bold text-white">
              Hey, {first} <span className="inline-block animate-[wave_2s_ease-in-out_infinite]">👋</span>
            </h1>
            <p className="text-purple-200/80 text-sm mt-1.5 max-w-xs">
              {totalToday > 0
                ? `You've completed ${totalToday} task${totalToday > 1 ? "s" : ""} today. Keep going!`
                : "Ready to make progress today?"}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1 bg-white/12 backdrop-blur-sm rounded-2xl px-5 py-3.5 border border-white/15">
            <p className="text-white font-bold text-2xl leading-none tabular-nums">
              <CountUp target={data.completedCards} />
            </p>
            <p className="text-purple-200/80 text-xs font-medium">completed</p>
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <StatCard label="Projects"    value={data.totalProjects}  href="/projects"
          icon={<FolderKanban size={18} className="text-white" />}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700" />
        <StatCard label="Total Tasks" value={data.totalCards}
          icon={<Target size={18} className="text-white" />}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-700" />
        <StatCard label="Completed"   value={data.completedCards}
          icon={<CheckCircle2 size={18} className="text-white" />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          trend={totalToday > 0 ? `+${totalToday} today` : undefined} />
        <StatCard label="Overdue"     value={data.overdueCards}
          icon={<AlertTriangle size={18} className="text-white" />}
          gradient={data.overdueCards > 0
            ? "bg-gradient-to-br from-red-500 to-rose-700"
            : "bg-gradient-to-br from-slate-500 to-slate-700"} />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <div className="animate-fade-in-up">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-3">
          <QuickAction href="/projects" label="New Project"
            icon={<Plus size={18} className="text-white" />}
            color="gradient-purple" />
          <QuickAction href="/my-tasks" label="My Tasks"
            icon={<ListChecks size={18} className="text-white" />}
            color="bg-gradient-to-br from-blue-500 to-indigo-600" />
          <QuickAction href="/team" label="Team"
            icon={<Users size={18} className="text-white" />}
            color="bg-gradient-to-br from-emerald-500 to-teal-600" />
          <QuickAction href="/projects" label="All Boards"
            icon={<LayoutGrid size={18} className="text-white" />}
            color="bg-gradient-to-br from-amber-500 to-orange-600" />
        </div>
      </div>

      {/* ── Chart + Projects ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Bar chart */}
        <div className="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Weekly Completions</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Tasks completed each day this week</p>
            </div>
            <div className="h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <TrendingUp size={15} className="text-violet-400" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.completionByDay} barCategoryGap="38%">
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), "EEE")}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false} tickLine={false} width={22}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(124,58,237,0.07)", radius: 8 }} />
              <Bar dataKey="count" radius={[7, 7, 0, 0]}>
                {data.completionByDay?.map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={i === data.completionByDay.length - 1
                      ? "url(#purpleGrad)"
                      : "var(--surface-2)"}
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projects progress */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Projects</h2>
            <Link href="/projects" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {data.projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-3">
                <FolderKanban size={20} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-sm text-[var(--text-muted)]">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.projects.slice(0, 4).map((project: any) => {
                const allCards = project.boards.flatMap((b: any) => b.columns.flatMap((c: any) => c.cards));
                const doneCards = project.boards.flatMap((b: any) =>
                  b.columns.filter((c: any) => c.name.toLowerCase().includes("done")).flatMap((c: any) => c.cards)
                );
                const pct = allCards.length ? Math.round((doneCards.length / allCards.length) * 100) : 0;
                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-[var(--surface)]"
                        style={{ background: project.color, "--tw-ring-color": project.color + "44" } as React.CSSProperties} />
                      <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-violet-400 transition-colors truncate flex-1">
                        {project.name}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-muted)] tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, #7c3aed, #a855f7)` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Deadlines + Activity ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upcoming deadlines */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 animate-fade-in-up">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Clock size={15} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Upcoming Deadlines</h2>
              <p className="text-[11px] text-[var(--text-muted)]">{data.upcomingDeadlines.length} task{data.upcomingDeadlines.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {data.upcomingDeadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 size={28} className="text-emerald-400 mb-2.5" />
              <p className="text-sm font-medium text-[var(--text-primary)]">All clear!</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {data.upcomingDeadlines.map((card: any) => {
                const over = isOverdue(card.dueDate);
                return (
                  <div key={card.id} className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                    over
                      ? "bg-red-500/8 border border-red-500/15"
                      : "hover:bg-[var(--surface-2)] border border-transparent"
                  )}>
                    <div className={cn("relative h-2 w-2 rounded-full shrink-0",
                      over ? "bg-red-400" : "bg-violet-400")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{card.title}</p>
                      <p className={cn("text-xs mt-0.5", over ? "text-red-400" : "text-[var(--text-muted)]")}>
                        {over ? "Overdue · " : ""}{formatDate(card.dueDate)}
                      </p>
                    </div>
                    <Badge variant={priorityVariant(card.priority)}>{card.priority}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity timeline */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 animate-fade-in-up">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Zap size={15} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Recent Activity</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Latest actions from your team</p>
            </div>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Zap size={28} className="text-[var(--text-muted)] mb-2.5" />
              <p className="text-sm text-[var(--text-muted)]">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentActivity.map((log: any, i: number) => (
                <div key={log.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center shrink-0 mt-0.5">
                    <Avatar name={log.user.name} src={log.user.avatar} size="xs" />
                    {i < data.recentActivity.length - 1 && (
                      <div className="w-px flex-1 mt-1.5 bg-gradient-to-b from-[var(--border)] to-transparent min-h-[16px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm text-[var(--text-secondary)] leading-snug">
                      <span className="font-semibold text-[var(--text-primary)]">{log.user.name}</span>
                      {" "}{log.action}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{formatRelativeDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
