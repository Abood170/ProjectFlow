"use client";

import { useState, useCallback } from "react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BoardWithColumns, ColumnWithCards, CardWithDetails } from "@/types";

interface KanbanBoardProps {
  board: BoardWithColumns;
  members: { id: string; name?: string | null; avatar?: string | null }[];
}

export function KanbanBoard({ board: initialBoard, members }: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnWithCards[]>(initialBoard.columns);
  const [activeCard, setActiveCard] = useState<CardWithDetails | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const findColumn = useCallback((id: string) =>
    columns.find((c) => c.id === id || c.cards.some((card) => card.id === id)),
    [columns]
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    const col = findColumn(active.id as string);
    const card = col?.cards.find((c) => c.id === active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);
    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    setColumns((prev) => {
      const activeIdx = prev.findIndex((c) => c.id === activeCol.id);
      const overIdx = prev.findIndex((c) => c.id === overCol.id);
      const cardIdx = prev[activeIdx].cards.findIndex((c) => c.id === active.id);
      const card = prev[activeIdx].cards[cardIdx];

      const newCols = [...prev];
      newCols[activeIdx] = { ...newCols[activeIdx], cards: newCols[activeIdx].cards.filter((c) => c.id !== active.id) };
      newCols[overIdx] = { ...newCols[overIdx], cards: [...newCols[overIdx].cards, card] };
      return newCols;
    });
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveCard(null);
    if (!over) return;

    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);
    if (!activeCol || !overCol) return;

    const activeCardIdx = activeCol.cards.findIndex((c) => c.id === active.id);
    const overIdx = overCol.cards.findIndex((c) => c.id === over.id);

    let newCards: CardWithDetails[];
    const destColumnId = overCol.id;

    if (activeCol.id === overCol.id) {
      newCards = arrayMove(activeCol.cards, activeCardIdx, overIdx === -1 ? activeCol.cards.length - 1 : overIdx);
      setColumns((prev) => prev.map((c) => c.id === activeCol.id ? { ...c, cards: newCards } : c));
    } else {
      newCards = overCol.cards;
    }

    const affectedCards = newCards
      .filter((c) => c.id !== active.id)
      .map((c, i) => ({ id: c.id, order: i + 1 }));

    try {
      await fetch("/api/cards/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: active.id,
          sourceColumnId: activeCol.id,
          destColumnId,
          newOrder: overIdx === -1 ? newCards.length - 1 : overIdx,
          affectedCards,
        }),
      });
    } catch {
      toast.error("Failed to save card position");
    }
  };

  const addColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      const res = await fetch(`/api/boards/${initialBoard.id}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newColumnName }),
      });
      if (res.ok) {
        const col = await res.json();
        setColumns((prev) => [...prev, { ...col, cards: [] }]);
        setNewColumnName("");
        setAddingColumn(false);
        toast.success("Column added");
      }
    } catch {
      toast.error("Failed to add column");
    }
  };

  const onCardAdded = (columnId: string, card: CardWithDetails) => {
    setColumns((prev) => prev.map((c) => c.id === columnId ? { ...c, cards: [...c.cards, card] } : c));
  };

  const onCardUpdated = (card: CardWithDetails) => {
    setColumns((prev) => prev.map((c) => ({
      ...c,
      cards: c.cards.map((existing) => existing.id === card.id ? card : existing),
    })));
  };

  const onCardDeleted = (cardId: string) => {
    setColumns((prev) => prev.map((c) => ({ ...c, cards: c.cards.filter((card) => card.id !== cardId) })));
  };

  const onColumnDeleted = (columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
  };

  const onColumnUpdated = (column: ColumnWithCards) => {
    setColumns((prev) => prev.map((c) => c.id === column.id ? { ...c, name: column.name, color: column.color } : c));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 items-start board-grid min-h-[calc(100vh-200px)] rounded-2xl p-4 -mx-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            members={members}
            onCardAdded={onCardAdded}
            onCardUpdated={onCardUpdated}
            onCardDeleted={onCardDeleted}
            onColumnDeleted={onColumnDeleted}
            onColumnUpdated={onColumnUpdated}
          />
        ))}

        {/* Add Column */}
        <div className="w-72 shrink-0">
          {addingColumn ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 space-y-2">
              <Input
                placeholder="Column name..."
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addColumn();
                  if (e.key === "Escape") { setAddingColumn(false); setNewColumnName(""); }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addColumn} className="flex-1">Add Column</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingColumn(false); setNewColumnName(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className={cn(
                "flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium",
                "text-[var(--text-muted)] hover:text-violet-400",
                "border-2 border-dashed border-[var(--border)] hover:border-violet-500/40",
                "hover:bg-violet-500/5 transition-all duration-200"
              )}
            >
              <Plus size={15} />
              Add Column
            </button>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeCard && (
          <div className="rotate-2 scale-105 opacity-90">
            <KanbanCard card={activeCard} isDragging members={members} onUpdated={() => {}} onDeleted={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
