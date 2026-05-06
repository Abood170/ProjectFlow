"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ColumnWithCards, CardWithDetails } from "@/types";

interface KanbanColumnProps {
  column: ColumnWithCards;
  members: { id: string; name?: string | null; avatar?: string | null }[];
  onCardAdded: (columnId: string, card: CardWithDetails) => void;
  onCardUpdated: (card: CardWithDetails) => void;
  onCardDeleted: (cardId: string) => void;
  onColumnDeleted: (columnId: string) => void;
  onColumnUpdated: (column: ColumnWithCards) => void;
}

export function KanbanColumn({
  column, members, onCardAdded, onCardUpdated, onCardDeleted, onColumnDeleted, onColumnUpdated
}: KanbanColumnProps) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [menuOpen, setMenuOpen] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const addCard = async () => {
    if (!newCardTitle.trim()) return;
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newCardTitle, columnId: column.id }),
    });
    if (res.ok) {
      const card = await res.json();
      onCardAdded(column.id, card);
      setNewCardTitle("");
      setAddingCard(false);
      toast.success("Card added");
    } else {
      toast.error("Failed to add card");
    }
  };

  const renameColumn = async () => {
    if (!columnName.trim() || columnName === column.name) {
      setEditingName(false);
      setColumnName(column.name);
      return;
    }
    const res = await fetch(`/api/columns/${column.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: columnName }),
    });
    if (res.ok) {
      onColumnUpdated({ ...column, name: columnName });
      setEditingName(false);
    }
  };

  const deleteColumn = async () => {
    if (!confirm(`Delete "${column.name}" and all its cards?`)) return;
    const res = await fetch(`/api/columns/${column.id}`, { method: "DELETE" });
    if (res.ok) { onColumnDeleted(column.id); toast.success("Column deleted"); }
  };

  // Column top-border accent color from column.color
  const accentColor = column.color || "#7c3aed";

  return (
    <div className={cn(
      "w-72 shrink-0 flex flex-col rounded-2xl border transition-all duration-200",
      "bg-[var(--surface-2)]",
      isOver
        ? "border-violet-500/40 shadow-[0_0_0_1px_rgba(124,58,237,0.25),inset_0_0_28px_rgba(124,58,237,0.04)]"
        : "border-[var(--border)]"
    )}>
      {/* Gradient top accent */}
      <div className="h-[3px] rounded-t-2xl w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}dd, ${accentColor}44)` }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        {editingName ? (
          <input
            className="flex-1 text-sm font-semibold bg-transparent border-b border-violet-500/50 outline-none text-[var(--text-primary)] pb-0.5"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            onBlur={renameColumn}
            onKeyDown={(e) => {
              if (e.key === "Enter") renameColumn();
              if (e.key === "Escape") { setEditingName(false); setColumnName(column.name); }
            }}
            autoFocus
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-[var(--text-primary)] cursor-pointer hover:text-violet-400 transition-colors truncate"
            onDoubleClick={() => setEditingName(true)}
          >
            {column.name}
          </span>
        )}

        {/* Count badge */}
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[10px] font-semibold text-[var(--text-muted)]">
          {column.cards.length}
        </span>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 w-36 bg-[var(--surface)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden py-1">
                <button
                  onClick={() => { setEditingName(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Pencil size={12} /> Rename
                </button>
                <button
                  onClick={() => { deleteColumn(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 px-2.5 pb-2 space-y-2 min-h-[80px] transition-all duration-200",
          isOver && "bg-violet-500/5 rounded-xl"
        )}
      >
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              members={members}
              onUpdated={onCardUpdated}
              onDeleted={onCardDeleted}
            />
          ))}
          {/* Empty column state */}
          {column.cards.length === 0 && !isOver && (
            <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
              <div className="h-8 w-8 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center mb-2">
                <Plus size={14} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-xs text-[var(--text-muted)]">Drop cards here</p>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Add Card */}
      <div className="px-2.5 pb-3">
        {addingCard ? (
          <div className="space-y-2">
            <Input
              placeholder="Card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCard();
                if (e.key === "Escape") { setAddingCard(false); setNewCardTitle(""); }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addCard} className="flex-1">Add Card</Button>
              <Button size="sm" variant="ghost"
                onClick={() => { setAddingCard(false); setNewCardTitle(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold",
              "text-[var(--text-muted)] hover:text-violet-400",
              "border border-dashed border-[var(--border)] hover:border-violet-500/40",
              "hover:bg-violet-500/8 transition-all duration-200 group"
            )}
          >
            <Plus size={13} className="group-hover:rotate-90 transition-transform duration-200" /> Add card
          </button>
        )}
      </div>
    </div>
  );
}
