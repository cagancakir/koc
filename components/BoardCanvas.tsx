"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { FormEvent, useMemo, useRef, useState } from "react";
import ColumnCard from "./ColumnCard";
import CardItem from "./CardItem";
import CardDetailModal from "./CardDetailModal";
import { midpoint } from "@/lib/orderUtils";
import { PlusIcon } from "./Icons";

export type CardData = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  columnId: string;
};

export type ColumnData = {
  id: string;
  title: string;
  order: number;
  boardId: string;
  cards: CardData[];
};

type Props = {
  boardId: string;
  initialColumns: ColumnData[];
};

export default function BoardCanvas({ boardId, initialColumns }: Props) {
  const [columns, setColumns] = useState<ColumnData[]>(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"column" | "card" | null>(null);
  const dragSnapshotRef = useRef<ColumnData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // Sensor strategy:
  // - MouseSensor: small distance threshold so clicks don't trigger drag.
  // - TouchSensor: 200ms long-press so vertical scroll on mobile isn't hijacked.
  // - KeyboardSensor: keyboard accessibility (Space to pick up, arrows to move).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const activeCard = useMemo(() => {
    if (activeType !== "card" || !activeId) return null;
    for (const col of columns) {
      const f = col.cards.find((c) => c.id === activeId);
      if (f) return f;
    }
    return null;
  }, [columns, activeId, activeType]);

  const activeColumn = useMemo(
    () =>
      activeType === "column" && activeId
        ? columns.find((c) => c.id === activeId) ?? null
        : null,
    [columns, activeId, activeType],
  );

  const openCard = useMemo(() => {
    if (!openCardId) return null;
    for (const col of columns) {
      const f = col.cards.find((c) => c.id === openCardId);
      if (f) return f;
    }
    return null;
  }, [columns, openCardId]);

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError((cur) => (cur === msg ? null : cur)), 4000);
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    const data = e.active.data.current as { type?: "column" | "card" } | undefined;
    setActiveId(id);
    setActiveType(data?.type ?? null);
    dragSnapshotRef.current = columns;
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeData = active.data.current as
      | { type?: string; columnId?: string }
      | undefined;
    const overData = over.data.current as
      | { type?: string; columnId?: string }
      | undefined;
    if (activeData?.type !== "card") return;
    const aId = String(active.id);
    const oId = String(over.id);
    if (aId === oId) return;

    setColumns((prev) => {
      const fromCol = prev.find((c) => c.cards.some((cd) => cd.id === aId));
      if (!fromCol) return prev;

      let toColId: string | undefined;
      let toIdx: number | undefined;
      if (overData?.type === "column") {
        toColId = oId;
        const toCol = prev.find((c) => c.id === toColId);
        toIdx = toCol ? toCol.cards.length : 0;
      } else if (overData?.type === "card") {
        toColId = overData.columnId;
        const toCol = prev.find((c) => c.id === toColId);
        if (!toCol) return prev;
        toIdx = toCol.cards.findIndex((cd) => cd.id === oId);
      } else {
        return prev;
      }
      if (!toColId || toIdx === undefined) return prev;
      if (fromCol.id === toColId) return prev; // intra-column handled in dragEnd

      const card = fromCol.cards.find((cd) => cd.id === aId)!;
      return prev.map((c) => {
        if (c.id === fromCol.id) {
          return { ...c, cards: c.cards.filter((cd) => cd.id !== aId) };
        }
        if (c.id === toColId) {
          const next = [...c.cards];
          next.splice(toIdx!, 0, { ...card, columnId: toColId! });
          return { ...c, cards: next };
        }
        return c;
      });
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const activeData = active.data.current as { type?: string } | undefined;
    const aId = String(active.id);
    const oId = over ? String(over.id) : null;
    setActiveId(null);
    setActiveType(null);

    if (!over) {
      if (dragSnapshotRef.current) setColumns(dragSnapshotRef.current);
      dragSnapshotRef.current = null;
      return;
    }

    if (activeData?.type === "column") {
      if (oId === aId) {
        dragSnapshotRef.current = null;
        return;
      }
      const oldIdx = columns.findIndex((c) => c.id === aId);
      const newIdx = columns.findIndex((c) => c.id === oId);
      if (oldIdx < 0 || newIdx < 0) {
        dragSnapshotRef.current = null;
        return;
      }
      const reordered = arrayMove(columns, oldIdx, newIdx);
      const prev = reordered[newIdx - 1]?.order ?? null;
      const next = reordered[newIdx + 1]?.order ?? null;
      const newOrder = midpoint(prev, next);
      const updated = reordered.map((c) =>
        c.id === aId ? { ...c, order: newOrder } : c,
      );
      const snapshot = dragSnapshotRef.current;
      dragSnapshotRef.current = null;
      setColumns(updated);

      void patchColumn(aId, { order: newOrder }).catch(() => {
        if (snapshot) setColumns(snapshot);
        showError("Failed to save column order");
      });
      return;
    }

    if (activeData?.type === "card") {
      const overData = over.data.current as
        | { type?: string; columnId?: string }
        | undefined;
      let workingCols = columns;
      const targetCol = workingCols.find((c) =>
        c.cards.some((cd) => cd.id === aId),
      );
      if (!targetCol) {
        dragSnapshotRef.current = null;
        return;
      }
      if (
        overData?.type === "card" &&
        overData.columnId === targetCol.id &&
        oId !== aId
      ) {
        const fromIdx = targetCol.cards.findIndex((cd) => cd.id === aId);
        const toIdx = targetCol.cards.findIndex((cd) => cd.id === oId);
        if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
          const moved = arrayMove(targetCol.cards, fromIdx, toIdx);
          workingCols = workingCols.map((c) =>
            c.id === targetCol.id ? { ...c, cards: moved } : c,
          );
        }
      }
      const finalTargetCol = workingCols.find((c) => c.id === targetCol.id)!;
      const finalIdx = finalTargetCol.cards.findIndex((cd) => cd.id === aId);
      const prev = finalTargetCol.cards[finalIdx - 1]?.order ?? null;
      const next = finalTargetCol.cards[finalIdx + 1]?.order ?? null;
      const newOrder = midpoint(prev, next);
      const updated = workingCols.map((c) =>
        c.id === finalTargetCol.id
          ? {
              ...c,
              cards: c.cards.map((cd) =>
                cd.id === aId
                  ? { ...cd, order: newOrder, columnId: finalTargetCol.id }
                  : cd,
              ),
            }
          : c,
      );
      const snapshot = dragSnapshotRef.current;
      dragSnapshotRef.current = null;
      setColumns(updated);

      void patchCard(aId, {
        order: newOrder,
        columnId: finalTargetCol.id,
      }).catch(() => {
        if (snapshot) setColumns(snapshot);
        showError("Failed to save card position");
      });
    }
  }

  async function patchCard(
    cardId: string,
    body: Partial<{ title: string; description: string | null; order: number; columnId: string }>,
  ) {
    const res = await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("PATCH card failed");
    return res.json();
  }

  async function patchColumn(
    columnId: string,
    body: Partial<{ title: string; order: number }>,
  ) {
    const res = await fetch(`/api/columns/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("PATCH column failed");
    return res.json();
  }

  async function addColumn(e: FormEvent) {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    const title = newColumnTitle.trim();
    setNewColumnTitle("");
    setAddingColumn(false);
    const tempId = `temp-col-${Date.now()}`;
    const lastOrder = columns[columns.length - 1]?.order ?? null;
    const order = midpoint(lastOrder, null);
    const optimistic: ColumnData = {
      id: tempId,
      title,
      order,
      boardId,
      cards: [],
    };
    setColumns((cs) => [...cs, optimistic]);
    try {
      const res = await fetch(`/api/boards/${boardId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setColumns((cs) =>
        cs.map((c) =>
          c.id === tempId
            ? {
                id: created.id,
                title: created.title,
                order: created.order,
                boardId: created.boardId,
                cards: [],
              }
            : c,
        ),
      );
    } catch {
      setColumns((cs) => cs.filter((c) => c.id !== tempId));
      showError("Failed to create column");
    }
  }

  async function renameColumn(columnId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const snapshot = columns;
    setColumns((cs) =>
      cs.map((c) => (c.id === columnId ? { ...c, title: trimmed } : c)),
    );
    try {
      await patchColumn(columnId, { title: trimmed });
    } catch {
      setColumns(snapshot);
      showError("Failed to rename column");
    }
  }

  async function deleteColumn(columnId: string) {
    if (!confirm("Delete this column and all its cards?")) return;
    const snapshot = columns;
    setColumns((cs) => cs.filter((c) => c.id !== columnId));
    try {
      const res = await fetch(`/api/columns/${columnId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setColumns(snapshot);
      showError("Failed to delete column");
    }
  }

  async function addCard(columnId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const tempId = `temp-card-${Date.now()}`;
    const col = columns.find((c) => c.id === columnId);
    const lastOrder = col?.cards[col.cards.length - 1]?.order ?? null;
    const order = midpoint(lastOrder, null);
    const optimistic: CardData = {
      id: tempId,
      title: trimmed,
      description: null,
      order,
      columnId,
    };
    setColumns((cs) =>
      cs.map((c) =>
        c.id === columnId ? { ...c, cards: [...c.cards, optimistic] } : c,
      ),
    );
    try {
      const res = await fetch(`/api/columns/${columnId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setColumns((cs) =>
        cs.map((c) =>
          c.id === columnId
            ? {
                ...c,
                cards: c.cards.map((cd) =>
                  cd.id === tempId
                    ? {
                        id: created.id,
                        title: created.title,
                        description: created.description,
                        order: created.order,
                        columnId: created.columnId,
                      }
                    : cd,
                ),
              }
            : c,
        ),
      );
    } catch {
      setColumns((cs) =>
        cs.map((c) =>
          c.id === columnId
            ? { ...c, cards: c.cards.filter((cd) => cd.id !== tempId) }
            : c,
        ),
      );
      showError("Failed to create card");
    }
  }

  async function updateCard(
    cardId: string,
    body: { title?: string; description?: string | null },
  ) {
    const snapshot = columns;
    setColumns((cs) =>
      cs.map((c) => ({
        ...c,
        cards: c.cards.map((cd) =>
          cd.id === cardId ? { ...cd, ...body } : cd,
        ),
      })),
    );
    try {
      await patchCard(cardId, body);
    } catch {
      setColumns(snapshot);
      showError("Failed to save card");
    }
  }

  async function deleteCard(cardId: string) {
    const snapshot = columns;
    setColumns((cs) =>
      cs.map((c) => ({ ...c, cards: c.cards.filter((cd) => cd.id !== cardId) })),
    );
    setOpenCardId(null);
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setColumns(snapshot);
      showError("Failed to delete card");
    }
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      {error && (
        <div className="absolute top-4 right-4 z-30 bg-rose-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-xl shadow-rose-600/30 animate-in">
          {error}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full overflow-x-auto overflow-y-hidden scrollbar-thin px-6 py-4">
          <div className="inline-flex gap-4 items-start h-full">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((col) => (
                <ColumnCard
                  key={col.id}
                  column={col}
                  onAddCard={(title) => addCard(col.id, title)}
                  onDelete={() => deleteColumn(col.id)}
                  onRename={(title) => renameColumn(col.id, title)}
                  onOpenCard={(id) => setOpenCardId(id)}
                />
              ))}
            </SortableContext>
            <div className="w-[19rem] shrink-0">
              {addingColumn ? (
                <form
                  onSubmit={addColumn}
                  className="bg-white rounded-xl shadow-column ring-1 ring-slate-900/5 p-3 space-y-2 animate-in"
                >
                  <input
                    autoFocus
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Column title…"
                    className="w-full px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-md shadow-sm shadow-indigo-500/20"
                    >
                      Add column
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingColumn(false);
                        setNewColumnTitle("");
                      }}
                      className="text-slate-500 hover:text-slate-900 text-sm px-2 py-1.5 rounded-md hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-white/60 hover:bg-white border border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-700 text-slate-600 text-sm font-medium rounded-xl py-3 transition"
                >
                  <PlusIcon width={14} height={14} />
                  <span>Add column</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <DragOverlay>
          {activeCard ? (
            <CardItem card={activeCard} overlay onOpen={() => {}} />
          ) : activeColumn ? (
            <div className="w-[19rem] bg-white rounded-xl shadow-2xl ring-1 ring-indigo-300/60 p-3 rotate-1">
              <div className="text-sm font-semibold text-slate-800">
                {activeColumn.title}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {activeColumn.cards.length}{" "}
                {activeColumn.cards.length === 1 ? "card" : "cards"}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {openCard && (
        <CardDetailModal
          card={openCard}
          onClose={() => setOpenCardId(null)}
          onSave={(body) => updateCard(openCard.id, body)}
          onDelete={() => deleteCard(openCard.id)}
        />
      )}
    </div>
  );
}
