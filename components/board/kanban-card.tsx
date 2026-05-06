"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MessageSquare, GripVertical, Trash2, Pencil } from "lucide-react";
import { cn, formatDate, isOverdue, isDueSoon } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { CardModal } from "./card-modal";
import type { CardWithDetails } from "@/types";
import toast from "react-hot-toast";

const PRIORITY_CONFIG = {
  URGENT: { label: "Urgent", cls: "bg-red-500/15 text-red-400 border-red-500/25",    dot: "bg-red-400",     pulse: true },
  HIGH:   { label: "High",   cls: "bg-orange-500/15 text-orange-400 border-orange-500/25", dot: "bg-orange-400", pulse: true },
  MEDIUM: { label: "Medium", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25",  dot: "bg-amber-400",  pulse: false },
  LOW:    { label: "Low",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400", pulse: false },
};

interface KanbanCardProps {
  card: CardWithDetails;
  isDragging?: boolean;
  members: { id: string; name?: string | null; avatar?: string | null }[];
  onUpdated: (card: CardWithDetails) => void;
  onDeleted: (cardId: string) => void;
}

export function KanbanCard({ card, isDragging, members, onUpdated, onDeleted }: KanbanCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0 : 1,
  };

  const overdue = isOverdue(card.dueDate);
  const soon = isDueSoon(card.dueDate);
  const priority = PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.MEDIUM;

  const deleteCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this card?")) return;
    const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    if (res.ok) { onDeleted(card.id); toast.success("Card deleted"); }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn(
          "group relative rounded-2xl border bg-[var(--surface)] p-3.5",
          "transition-all duration-200 cursor-pointer select-none",
          overdue && !isSortableDragging
            ? "border-l-2 border-l-red-500/70 border-[var(--border)]"
            : "border-[var(--border)] hover:border-[var(--border-strong)]",
          "hover:-translate-y-1",
          "hover:shadow-[0_8px_28px_rgba(0,0,0,0.12),0_0_0_1px_rgba(124,58,237,0.1)]"
        )}
        onClick={() => setModalOpen(true)}
      >
        {/* Ambient glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%)" }}
        />

        {/* Drag handle */}
        <div
          {...listeners}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-lg cursor-grab active:cursor-grabbing text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={13} />
        </div>

        {/* Label strips */}
        {card.labels.length > 0 && (
          <div className="flex gap-1 mb-3 flex-wrap">
            {card.labels.map((l) => (
              <span key={l.id} className="h-1.5 w-8 rounded-full" style={{ background: l.color }} title={l.name} />
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug pr-5 mb-3">
          {card.title}
        </p>

        {/* Footer meta */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority */}
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            priority.cls
          )}>
            {priority.pulse ? (
              <span className="relative h-1.5 w-1.5 shrink-0">
                <span className={cn("absolute inset-0 rounded-full animate-ping opacity-75", priority.dot)} style={{ animationDuration: "1.4s" }} />
                <span className={cn("relative inline-block h-1.5 w-1.5 rounded-full", priority.dot)} />
              </span>
            ) : (
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priority.dot)} />
            )}
            {priority.label}
          </span>

          {/* Due date */}
          {card.dueDate && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              overdue ? "bg-red-500/10 text-red-400" :
              soon    ? "bg-amber-500/10 text-amber-400" :
                        "bg-[var(--surface-2)] text-[var(--text-muted)]"
            )}>
              <Calendar size={9} />
              {formatDate(card.dueDate)}
            </span>
          )}

          {(card._count?.comments ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)] ml-auto">
              <MessageSquare size={9} />
              {card._count?.comments}
            </span>
          )}

          {card.assignee && (
            <div className={(card._count?.comments ?? 0) > 0 ? "" : "ml-auto"}>
              <Avatar name={card.assignee.name} src={card.assignee.avatar} size="xs" ring />
            </div>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-0.5 group-hover:translate-y-0">
          <button
            onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/20 transition-all"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={deleteCard}
            className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <CardModal
        card={card}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        members={members}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
      />
    </>
  );
}
