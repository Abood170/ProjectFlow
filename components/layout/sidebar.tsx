"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, CheckSquare, FolderKanban, Users,
  Settings, Bell, LogOut, Plus, Moon, Sun, Menu, X,
  Zap, ChevronRight, Search, Activity,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { useSearchOpen } from "@/components/search/search-provider";

const navItems = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/my-tasks",       label: "My Tasks",        icon: CheckSquare },
  { href: "/projects",       label: "Projects",        icon: FolderKanban },
  { href: "/activity",       label: "Activity",        icon: Activity },
  { href: "/team",           label: "Team",            icon: Users },
  { href: "/notifications",  label: "Notifications",   icon: Bell, badge: true },
  { href: "/settings",       label: "Settings",        icon: Settings },
];

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const pathname   = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount }   = useNotifications();
  const { openSearch }    = useSearchOpen();

  return (
    <div className="flex flex-col h-full sidebar-grid relative">
      {/* Purple gradient overlay at top */}
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.12) 0%, transparent 70%)" }}
      />

      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl animate-orbit-glow opacity-70" />
          <div className="relative h-9 w-9 rounded-xl gradient-purple flex items-center justify-center z-10">
            <Zap size={17} className="text-white" strokeWidth={2.5} />
          </div>
        </div>
        <span className="text-base font-bold gradient-purple-text tracking-tight">ProjectFlow</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={17} />
          </button>
        )}
      </div>

      {/* ── New Project ────────────────────────────────────────── */}
      <div className="px-4 pb-3 relative">
        <Link
          href="/projects"
          onClick={onClose}
          className={cn(
            "flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold",
            "gradient-purple text-white",
            "shadow-[0_4px_20px_rgba(124,58,237,0.4)]",
            "hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(124,58,237,0.5)]",
            "transition-all duration-200 active:scale-[0.97]"
          )}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Project
        </Link>
      </div>

      {/* ── Search button ──────────────────────────────────────── */}
      <div className="px-4 pb-3 relative">
        <button
          onClick={() => { openSearch(); onClose?.(); }}
          className={cn(
            "flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150",
            "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            "bg-[var(--surface-2)] border border-[var(--border)] hover:border-violet-500/30",
            "group"
          )}
        >
          <Search size={14} className="shrink-0 group-hover:text-violet-400 transition-colors" />
          <span className="flex-1 text-left text-xs">Search...</span>
          <kbd className="text-[10px] font-medium bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="mx-4 mb-2 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative",
                active
                  ? "nav-active"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Icon size={16} className={cn(
                "shrink-0 transition-colors",
                active ? "text-purple-400" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
              )} />
              <span className="flex-1">{label}</span>

              {badge && unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full gradient-purple text-white text-[10px] font-bold notif-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}

              {active && (
                <ChevronRight size={13} className="text-purple-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ─────────────────────────────────────────────── */}
      <div className="px-3 pb-5 pt-3 mt-2">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-3" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
            "transition-all duration-200 group mb-1"
          )}
        >
          <div className="relative h-5 w-5 shrink-0">
            <Sun size={16} className={cn(
              "absolute inset-0 transition-all duration-300 text-amber-400",
              theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
            )} />
            <Moon size={16} className={cn(
              "absolute inset-0 transition-all duration-300 text-indigo-400",
              theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
            )} />
          </div>
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* User card */}
        <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-[var(--surface-2)] cursor-default"
          style={{ border: "1px solid var(--border)" }}>
          <div className="relative shrink-0">
            <Avatar name={session?.user?.name} src={session?.user?.image} size="sm" />
            <div className="absolute -inset-0.5 rounded-full border border-purple-500/40 pointer-events-none" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">
              {session?.user?.name || "You"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className={cn(
              "rounded-lg p-1.5 text-[var(--text-muted)]",
              "hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            )}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className={cn(
        "hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0",
        "bg-[var(--sidebar-bg)] border-r border-[var(--border)]"
      )}>
        <SidebarInner />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          "lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl",
          "bg-[var(--surface)] border border-[var(--border)] shadow-md-custom",
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        )}
      >
        <Menu size={17} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={cn(
            "fixed left-0 top-0 h-screen w-64 z-50 animate-slide-in-right",
            "bg-[var(--sidebar-bg)] border-r border-[var(--border)]"
          )}>
            <SidebarInner onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
