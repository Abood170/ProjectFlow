"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar, MessageSquare, Trash2, X, Plus, AlignLeft, Tag,
  ArrowRight, Flag, UserCheck, Pencil, Clock, Smile,
  Activity as ActivityIcon, Send, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeDate, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CardWithDetails, ActivityLogWithUser } from "@/types";

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const PRIORITY_CONFIG = {
  LOW:    { label: "Low",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25" },
  MEDIUM: { label: "Medium", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25" },
  HIGH:   { label: "High",   cls: "bg-orange-500/15 text-orange-400 border-orange-500/25 hover:bg-orange-500/25" },
  URGENT: { label: "Urgent", cls: "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25" },
};
const LABEL_COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#6366f1","#a855f7","#ec4899"];
const QUICK_EMOJIS  = ["👍","❤️","😊","🎉","🚀","🔥","✅","⚡","💡","🙌","🤔","👏","💯","🎯","✨"];

type ActiveTab = "details" | "comments" | "activity";

interface CommentWithUser {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name?: string | null; avatar?: string | null };
}

interface CardModalProps {
  card: CardWithDetails;
  open: boolean;
  onClose: () => void;
  members: { id: string; name?: string | null; avatar?: string | null }[];
  onUpdated: (card: CardWithDetails) => void;
  onDeleted: (cardId: string) => void;
}

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

export function CardModal({ card, open, onClose, members, onUpdated, onDeleted }: CardModalProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab]         = useState<ActiveTab>("details");
  const [title, setTitle]                 = useState(card.title);
  const [description, setDescription]     = useState(card.description || "");
  const [priority, setPriority]           = useState(card.priority);
  const [dueDate, setDueDate]             = useState(card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : "");
  const [assigneeId, setAssigneeId]       = useState(card.assigneeId || "");
  const [saving, setSaving]               = useState(false);
  const [comments, setComments]           = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment]       = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showEmoji, setShowEmoji]         = useState(false);
  const [addingLabel, setAddingLabel]     = useState(false);
  const [newLabelName, setNewLabelName]   = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[5]);
  const [labels, setLabels]               = useState(card.labels);
  const [activityLogs, setActivityLogs]   = useState<ActivityLogWithUser[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description || "");
      setPriority(card.priority);
      setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : "");
      setAssigneeId(card.assigneeId || "");
      setLabels(card.labels);
      setActiveTab("details");
      setComments([]);
      setActivityLogs([]);
      setShowEmoji(false);

      // Load comments on open
      fetch(`/api/cards/${card.id}/comments`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setComments(data); });
    }
  }, [open, card.id]);

  if (!open) return null;

  const save = async (overrides?: Partial<{ priority: string; dueDate: string; assigneeId: string }>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority:   overrides?.priority   ?? priority,
          dueDate:    (overrides?.dueDate   ?? dueDate) || null,
          assigneeId: (overrides?.assigneeId ?? assigneeId) || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated({ ...updated, _count: { comments: comments.length } });
        toast.success("Saved");
        // Invalidate activity so it re-fetches next time tab is opened
        setActivityLogs([]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = async (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === "activity") {
      setLoadingActivity(true);
      try {
        const res = await fetch(`/api/cards/${card.id}/activity`);
        const data = await res.json();
        setActivityLogs(Array.isArray(data) ? data : []);
      } finally {
        setLoadingActivity(false);
      }
    }
    if (tab === "comments") {
      setTimeout(() => commentInputRef.current?.focus(), 80);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const comment = await res.json();
        const updated = [...comments, comment];
        setComments(updated);
        setNewComment("");
        setShowEmoji(false);
        onUpdated({ ...card, _count: { comments: updated.length } });
        setActivityLogs([]); // invalidate so activity tab re-fetches
      }
    } finally {
      setPostingComment(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      const updated = comments.filter((c) => c.id !== commentId);
      setComments(updated);
      onUpdated({ ...card, _count: { comments: updated.length } });
    }
  };

  const addLabel = async () => {
    if (!newLabelName.trim()) return;
    const res = await fetch(`/api/cards/${card.id}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLabelName, color: newLabelColor }),
    });
    if (res.ok) {
      const label = await res.json();
      setLabels((prev) => [...prev, label]);
      setNewLabelName("");
      setAddingLabel(false);
    }
  };

  const removeLabel = async (labelId: string) => {
    await fetch(`/api/labels/${labelId}`, { method: "DELETE" });
    setLabels((prev) => prev.filter((l) => l.id !== labelId));
  };

  const deleteCard = async () => {
    if (!confirm("Delete this card?")) return;
    const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    if (res.ok) { onDeleted(card.id); onClose(); }
  };

  const overdue = isOverdue(card.dueDate);
  const soon    = isDueSoon(card.dueDate);

  const TABS: { id: ActiveTab; label: string; count?: number }[] = [
    { id: "details",  label: "Details" },
    { id: "comments", label: "Comments", count: comments.length },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[6px]" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[0_32px_80px_rgba(0,0,0,0.5)] animate-scale-in flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Purple top glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Header: title + tabs */}
        <div className="px-6 pt-5 pb-0 border-b border-[var(--border)]">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <input
                className="w-full text-base font-bold bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-violet-500/40 pb-0.5 transition-colors"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => save()}
                placeholder="Card title..."
              />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all shrink-0 mt-0.5"
            >
              <X size={15} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 mt-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all",
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                    activeTab === tab.id ? "bg-violet-500/20 text-violet-300" : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* ── Details tab ──────────────────────────── */}
            {activeTab === "details" && (
              <div className="space-y-5">

                {/* Labels */}
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2.5">
                    <Tag size={10} /> Labels
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((l) => (
                      <span
                        key={l.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white cursor-pointer hover:opacity-75 transition-opacity"
                        style={{ background: l.color }}
                        onClick={() => removeLabel(l.id)}
                        title="Click to remove"
                      >
                        {l.name} <X size={9} />
                      </span>
                    ))}
                    {addingLabel ? (
                      <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-1.5">
                        <input
                          className="text-xs bg-transparent outline-none text-[var(--text-primary)] w-20 placeholder:text-[var(--text-muted)]"
                          placeholder="Label name"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") addLabel(); if (e.key === "Escape") setAddingLabel(false); }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          {LABEL_COLORS.map((c) => (
                            <button
                              key={c}
                              className={cn("h-4 w-4 rounded-full transition-transform", newLabelColor === c ? "scale-125 ring-2 ring-white/30" : "hover:scale-110")}
                              style={{ background: c }}
                              onClick={() => setNewLabelColor(c)}
                            />
                          ))}
                        </div>
                        <button onClick={addLabel} className="text-xs text-violet-400 font-medium hover:text-violet-300">Add</button>
                        <button onClick={() => setAddingLabel(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingLabel(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)] hover:border-violet-500/40 hover:text-violet-400 transition-all"
                      >
                        <Plus size={10} /> Add label
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2.5">
                    <AlignLeft size={10} /> Description
                  </p>
                  <Textarea
                    placeholder="Add a description..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => save()}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── Comments tab ─────────────────────────── */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                {/* Comment list */}
                {comments.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-2.5">
                      <MessageSquare size={18} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] font-medium">No comments yet</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Be the first to leave a comment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c) => {
                      const isOwn = c.user.id === session?.user?.id;
                      return (
                        <div key={c.id} className="flex gap-3 group">
                          <Avatar name={c.user.name} src={c.user.avatar} size="xs" className="shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-[var(--text-primary)]">{c.user.name || "User"}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">{formatRelativeDate(c.createdAt)}</span>
                              {isOwn && (
                                <button
                                  onClick={() => deleteComment(c.id)}
                                  className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  title="Delete comment"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] leading-relaxed break-words">
                              {c.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comment input */}
                <div className="pt-1">
                  <div className="flex gap-2 items-end">
                    <div className="relative flex-1">
                      {showEmoji && (
                        <div className="absolute bottom-full mb-2 left-0 z-10 bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl p-2.5 shadow-lg shadow-black/30 animate-scale-in">
                          <div className="flex flex-wrap gap-1 w-52">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg text-base transition-colors leading-none"
                                onClick={() => { setNewComment((prev) => prev + emoji); setShowEmoji(false); commentInputRef.current?.focus(); }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <input
                        ref={commentInputRef}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                      />
                    </div>
                    <button
                      onClick={() => setShowEmoji(!showEmoji)}
                      className={cn(
                        "p-2.5 rounded-xl border transition-all shrink-0",
                        showEmoji
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 bg-[var(--surface-2)]"
                      )}
                      title="Add emoji"
                    >
                      <Smile size={15} />
                    </button>
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim() || postingComment}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0",
                        newComment.trim() && !postingComment
                          ? "gradient-purple text-white shadow-[0_4px_12px_rgba(124,58,237,0.35)] hover:brightness-110 active:scale-95"
                          : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
                      )}
                    >
                      {postingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Activity tab ──────────────────────────── */}
            {activeTab === "activity" && (
              <div>
                {loadingActivity ? (
                  <div className="space-y-2.5 py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="skeleton h-8 w-8 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="skeleton h-3.5 rounded-lg w-3/4" />
                          <div className="skeleton h-3 rounded-lg w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-2.5">
                      <Clock size={18} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] font-medium">No activity yet</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Changes to this card will appear here</p>
                  </div>
                ) : (
                  <div className="relative space-y-1 pl-1">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[18px] top-4 bottom-4 w-px bg-[var(--border)]" />
                    {activityLogs.map((log) => {
                      const meta = getActivityMeta(log.action);
                      const Icon = meta.icon;
                      return (
                        <div key={log.id} className="flex gap-3 items-start py-2 group">
                          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 z-10", meta.bg)}>
                            <Icon size={13} className={meta.color} />
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5">
                            <p className="text-sm text-[var(--text-secondary)] leading-snug">
                              <span className="font-semibold text-[var(--text-primary)]">{log.user.name || "Someone"}</span>
                              {" "}{log.action}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              {formatRelativeDate(log.createdAt.toString())}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────── */}
          <div className="w-48 shrink-0 border-l border-[var(--border)] bg-[var(--surface-2)] px-4 py-4 space-y-5 overflow-y-auto">

            {/* Priority */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">Priority</p>
              <div className="space-y-1">
                {PRIORITY_OPTIONS.map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => { setPriority(p); save({ priority: p }); }}
                      className={cn(
                        "flex items-center w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                        priority === p ? cfg.cls : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-secondary)]"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full mr-2 shrink-0", {
                        "bg-emerald-400": p === "LOW",
                        "bg-amber-400":   p === "MEDIUM",
                        "bg-orange-400":  p === "HIGH",
                        "bg-red-400":     p === "URGENT",
                      })} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">Due Date</p>
              <input
                type="date"
                className={cn(
                  "w-full rounded-xl border px-2.5 py-1.5 text-xs outline-none transition-all",
                  "bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]",
                  "focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10",
                  overdue && dueDate && "border-red-500/50 text-red-400",
                  soon && !overdue && dueDate && "border-amber-500/50 text-amber-400"
                )}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={() => save({ dueDate })}
              />
            </div>

            {/* Assignee */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">Assignee</p>
              <div className="space-y-1">
                <button
                  onClick={() => { setAssigneeId(""); save({ assigneeId: "" }); }}
                  className={cn(
                    "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-all",
                    !assigneeId ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]" : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <div className="h-5 w-5 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center shrink-0">
                    <span className="text-[8px]">—</span>
                  </div>
                  Unassigned
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setAssigneeId(m.id); save({ assigneeId: m.id }); }}
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-all",
                      assigneeId === m.id ? "bg-violet-500/10 border border-violet-500/20 text-violet-300" : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <Avatar name={m.name} src={m.avatar} size="xs" className="shrink-0" />
                    <span className="truncate">{m.name || "User"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Delete */}
            <div className="pt-2 border-t border-[var(--border)]">
              <button
                onClick={deleteCard}
                className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={12} /> Delete card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
