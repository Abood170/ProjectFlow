"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, ArrowRight, Loader2, SearchX,
  CreditCard, FolderKanban, Users,
  LayoutDashboard, CheckSquare, Bell, Settings, Activity,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SearchResults {
  cards: {
    id: string;
    title: string;
    priority: string;
    columnName: string;
    projectName: string;
    projectId: string;
    projectColor: string;
  }[];
  projects: { id: string; name: string; color: string; description?: string | null }[];
  members: { id: string; name?: string | null; email: string; avatar?: string | null }[];
}

const QUICK_NAV = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/my-tasks",       label: "My Tasks",        icon: CheckSquare },
  { href: "/projects",       label: "Projects",        icon: FolderKanban },
  { href: "/activity",       label: "Activity",        icon: Activity },
  { href: "/notifications",  label: "Notifications",   icon: Bell },
  { href: "/settings",       label: "Settings",        icon: Settings },
];

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "text-red-400",
  HIGH:   "text-orange-400",
  MEDIUM: "text-amber-400",
  LOW:    "text-emerald-400",
};

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-violet-500/30 text-violet-200 not-italic rounded-sm px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input and reset state on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setFocusedIdx(0);
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setFocusedIdx(0);
      } catch {
        setResults({ cards: [], projects: [], members: [] });
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  // All result items flattened for keyboard navigation
  const allItems = useMemo(() => {
    if (!query.trim() || !results) {
      return QUICK_NAV.map((n) => ({ type: "nav" as const, data: n }));
    }
    return [
      ...(results.cards).map((d) => ({ type: "card" as const, data: d })),
      ...(results.projects).map((d) => ({ type: "project" as const, data: d })),
      ...(results.members).map((d) => ({ type: "member" as const, data: d })),
    ];
  }, [query, results]);

  const hasResults = results && (results.cards.length + results.projects.length + results.members.length) > 0;

  const navigate = useCallback(
    (item: (typeof allItems)[0]) => {
      if (item.type === "nav")     router.push((item.data as typeof QUICK_NAV[0]).href);
      if (item.type === "card")    router.push(`/projects/${(item.data as SearchResults["cards"][0]).projectId}`);
      if (item.type === "project") router.push(`/projects/${(item.data as SearchResults["projects"][0]).id}`);
      if (item.type === "member")  router.push("/team");
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[focusedIdx]) {
      navigate(allItems[focusedIdx]);
    }
  };

  // Section-aware index helpers
  const cardStart    = 0;
  const projectStart = results?.cards.length ?? 0;
  const memberStart  = (results?.cards.length ?? 0) + (results?.projects.length ?? 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[6px] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl animate-scale-in">
        <div className="rounded-2xl overflow-hidden border border-[var(--border-strong)] shadow-[0_32px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(124,58,237,0.15)]"
          style={{ background: "var(--surface)" }}>

          {/* Purple top glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
            {loading
              ? <Loader2 size={16} className="text-violet-400 shrink-0 animate-spin" />
              : <Search size={16} className="text-[var(--text-muted)] shrink-0" />
            }
            <input
              ref={inputRef}
              className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              placeholder="Search cards, projects, people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
              >
                <X size={13} />
              </button>
            )}
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-medium bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-[var(--text-muted)] shrink-0">
              ESC
            </kbd>
          </div>

          {/* Results area */}
          <div className="max-h-[420px] overflow-y-auto overscroll-contain">

            {/* Empty state: quick nav */}
            {!query.trim() && (
              <div className="p-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 pt-2 pb-1.5">
                  Quick Navigate
                </p>
                {QUICK_NAV.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                        idx === focusedIdx
                          ? "bg-violet-500/15 text-violet-300"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                      )}
                      onClick={() => { router.push(item.href); onClose(); }}
                      onMouseEnter={() => setFocusedIdx(idx)}
                    >
                      <div className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        idx === focusedIdx ? "bg-violet-500/20" : "bg-[var(--surface-2)]"
                      )}>
                        <Icon size={14} className={idx === focusedIdx ? "text-violet-400" : "text-[var(--text-muted)]"} />
                      </div>
                      <span className="font-medium">{item.label}</span>
                      <ArrowRight size={12} className="ml-auto text-[var(--text-muted)]" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading shimmer */}
            {loading && query.trim() && (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-10 rounded-xl" />
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && query.trim().length >= 2 && results && !hasResults && (
              <div className="py-14 text-center px-6">
                <div className="h-12 w-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-3">
                  <SearchX size={20} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Try a different keyword</p>
              </div>
            )}

            {/* Results */}
            {!loading && hasResults && (
              <div className="p-2 space-y-1">

                {/* Cards */}
                {results!.cards.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 pt-2 pb-1.5 flex items-center gap-1.5">
                      <CreditCard size={10} /> Cards
                    </p>
                    {results!.cards.map((card, i) => {
                      const globalIdx = cardStart + i;
                      return (
                        <button
                          key={card.id}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                            globalIdx === focusedIdx
                              ? "bg-violet-500/15 text-violet-300"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                          )}
                          onClick={() => navigate({ type: "card", data: card })}
                          onMouseEnter={() => setFocusedIdx(globalIdx)}
                        >
                          <div className="h-7 w-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                            <CreditCard size={12} className="text-[var(--text-muted)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium truncate", globalIdx === focusedIdx ? "text-violet-200" : "text-[var(--text-primary)]")}>
                              <Highlight text={card.title} query={query} />
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {card.projectName} · {card.columnName}
                            </p>
                          </div>
                          <span className={cn("text-[10px] font-bold uppercase shrink-0", PRIORITY_COLOR[card.priority] ?? "text-[var(--text-muted)]")}>
                            {card.priority}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Projects */}
                {results!.projects.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 pt-3 pb-1.5 flex items-center gap-1.5">
                      <FolderKanban size={10} /> Projects
                    </p>
                    {results!.projects.map((project, i) => {
                      const globalIdx = projectStart + i;
                      return (
                        <button
                          key={project.id}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                            globalIdx === focusedIdx
                              ? "bg-violet-500/15 text-violet-300"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                          )}
                          onClick={() => navigate({ type: "project", data: project })}
                          onMouseEnter={() => setFocusedIdx(globalIdx)}
                        >
                          <div
                            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${project.color}22`, border: `1px solid ${project.color}44` }}
                          >
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: project.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium truncate", globalIdx === focusedIdx ? "text-violet-200" : "text-[var(--text-primary)]")}>
                              <Highlight text={project.name} query={query} />
                            </p>
                            {project.description && (
                              <p className="text-[11px] text-[var(--text-muted)] truncate">{project.description}</p>
                            )}
                          </div>
                          <ArrowRight size={12} className="text-[var(--text-muted)] shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Members */}
                {results!.members.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 pt-3 pb-1.5 flex items-center gap-1.5">
                      <Users size={10} /> People
                    </p>
                    {results!.members.map((member, i) => {
                      const globalIdx = memberStart + i;
                      return (
                        <button
                          key={member.id}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                            globalIdx === focusedIdx
                              ? "bg-violet-500/15 text-violet-300"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                          )}
                          onClick={() => navigate({ type: "member", data: member })}
                          onMouseEnter={() => setFocusedIdx(globalIdx)}
                        >
                          <Avatar name={member.name} src={member.avatar} size="xs" className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium truncate", globalIdx === focusedIdx ? "text-violet-200" : "text-[var(--text-primary)]")}>
                              <Highlight text={member.name ?? ""} query={query} />
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              <Highlight text={member.email} query={query} />
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><kbd className="bg-[var(--surface-2)] border border-[var(--border)] rounded px-1 py-0.5">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-[var(--surface-2)] border border-[var(--border)] rounded px-1 py-0.5">↵</kbd> open</span>
            <span className="flex items-center gap-1"><kbd className="bg-[var(--surface-2)] border border-[var(--border)] rounded px-1 py-0.5">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
