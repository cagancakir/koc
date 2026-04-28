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
import ShareBoardModal from "./ShareBoardModal";
import { midpoint } from "@/lib/orderUtils";
import { PlusIcon, ShareIcon, type LabelColorKey } from "./Icons";

export type LabelData = { id: string; name: string; color: LabelColorKey };
export type AssigneeData = { id: string; email: string };
export type BoardRoleClient = "OWNER" | "EDITOR" | "VIEWER";

export type CardData = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  columnId: string;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: AssigneeData | null;
  labels: LabelData[];
};

export type ColumnData = {
  id: string;
  title: string;
  order: number;
  boardId: string;
  cards: CardData[];
};

export type MemberRow = {
  memberId: string | null; // null for owner
  id: string; // user id
  email: string;
  role: BoardRoleClient;
};

type Props = {
  boardId: string;
  role: BoardRoleClient;
  initialColumns: ColumnData[];
  initialLabels: LabelData[];
  initialMembers: MemberRow[]; // owner + members
};

const canEdit = (role: BoardRoleClient) => role === "OWNER" || role === "EDITOR";
const canManage = (role: BoardRoleClient) => role === "OWNER";

export default function BoardCanvas({
  boardId,
  role,
  initialColumns,
  initialLabels,
  initialMembers,
}: Props) {
  const [columns, setColumns] = useState<ColumnData[]>(initialColumns);
  const [labels, setLabels] = useState<LabelData[]>(initialLabels);
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"column" | "card" | null>(null);
  const dragSnapshotRef = useRef<ColumnData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const editing = canEdit(role);
  const managing = canManage(role);

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
    if (!editing) return;
    const id = String(e.active.id);
    const data = e.active.data.current as { type?: "column" | "card" } | undefined;
    setActiveId(id);
    setActiveType(data?.type ?? null);
    dragSnapshotRef.current = columns;
  }

  function handleDragOver(e: DragOverEvent) {
    if (!editing) return;
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
      if (fromCol.id === toColId) return prev;

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
    if (!editing) return;
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

  type CardPatchBody = {
    title?: string;
    description?: string | null;
    order?: number;
    columnId?: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    labelIds?: string[];
  };

  async function patchCard(cardId: string, body: CardPatchBody): Promise<CardData> {
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
      dueDate: null,
      assigneeId: null,
      assignee: null,
      labels: [],
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
                  cd.id === tempId ? { ...cd, ...created } : cd,
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

  async function updateCard(cardId: string, body: CardPatchBody) {
    const snapshot = columns;
    // Optimistic update for fields we know how to merge locally.
    setColumns((cs) =>
      cs.map((c) => ({
        ...c,
        cards: c.cards.map((cd) => {
          if (cd.id !== cardId) return cd;
          const next = { ...cd };
          if (body.title !== undefined) next.title = body.title;
          if (body.description !== undefined) next.description = body.description;
          if (body.dueDate !== undefined) next.dueDate = body.dueDate;
          if (body.labelIds !== undefined) {
            next.labels = labels.filter((l) => body.labelIds!.includes(l.id));
          }
          if (body.assigneeId !== undefined) {
            next.assigneeId = body.assigneeId;
            next.assignee =
              body.assigneeId === null
                ? null
                : members.find((m) => m.id === body.assigneeId) ?? cd.assignee;
          }
          return next;
        }),
      })),
    );
    try {
      const updated = await patchCard(cardId, body);
      // Reconcile with server response (canonical data).
      setColumns((cs) =>
        cs.map((c) => ({
          ...c,
          cards: c.cards.map((cd) => (cd.id === cardId ? { ...cd, ...updated } : cd)),
        })),
      );
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

  // ─── Labels ────────────────────────────────────────────────────────────────

  async function createLabel(name: string, color: LabelColorKey): Promise<LabelData | null> {
    try {
      const res = await fetch(`/api/boards/${boardId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error();
      const label: LabelData = await res.json();
      setLabels((ls) => [...ls, label].sort((a, b) => a.name.localeCompare(b.name)));
      return label;
    } catch {
      showError("Failed to create label");
      return null;
    }
  }

  async function deleteLabel(labelId: string) {
    if (!confirm("Delete this label and remove it from all cards?")) return;
    const snapshotLabels = labels;
    const snapshotColumns = columns;
    setLabels((ls) => ls.filter((l) => l.id !== labelId));
    setColumns((cs) =>
      cs.map((c) => ({
        ...c,
        cards: c.cards.map((cd) => ({
          ...cd,
          labels: cd.labels.filter((l) => l.id !== labelId),
        })),
      })),
    );
    try {
      const res = await fetch(`/api/labels/${labelId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setLabels(snapshotLabels);
      setColumns(snapshotColumns);
      showError("Failed to delete label");
    }
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async function inviteMember(
    email: string,
    inviteRole: "EDITOR" | "VIEWER",
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body.error ?? "Failed" };
      }
      const member = await res.json();
      setMembers((ms) => {
        const existing = ms.findIndex((m) => m.id === member.id);
        const row: MemberRow = {
          memberId: member.memberId,
          id: member.id,
          email: member.email,
          role: member.role,
        };
        if (existing >= 0) {
          const next = [...ms];
          next[existing] = row;
          return next;
        }
        return [...ms, row];
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error" };
    }
  }

  async function changeMemberRole(memberId: string, newRole: "EDITOR" | "VIEWER") {
    const snapshot = members;
    setMembers((ms) =>
      ms.map((m) => (m.memberId === memberId ? { ...m, role: newRole } : m)),
    );
    try {
      const res = await fetch(`/api/board-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setMembers(snapshot);
      showError("Failed to change role");
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member from the board?")) return;
    const snapshot = members;
    const snapshotColumns = columns;
    const removed = members.find((m) => m.memberId === memberId);
    setMembers((ms) => ms.filter((m) => m.memberId !== memberId));
    if (removed) {
      // Unassign their cards locally.
      setColumns((cs) =>
        cs.map((c) => ({
          ...c,
          cards: c.cards.map((cd) =>
            cd.assigneeId === removed.id
              ? { ...cd, assigneeId: null, assignee: null }
              : cd,
          ),
        })),
      );
    }
    try {
      const res = await fetch(`/api/board-members/${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setMembers(snapshot);
      setColumns(snapshotColumns);
      showError("Failed to remove member");
    }
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      {error && (
        <div className="absolute top-4 right-4 z-30 bg-rose-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-xl shadow-rose-600/30 animate-in">
          {error}
        </div>
      )}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <RoleBadge role={role} />
        <button
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm transition"
        >
          <ShareIcon width={12} height={12} />
          Share
        </button>
      </div>
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
                  canEdit={editing}
                  onAddCard={(title) => addCard(col.id, title)}
                  onDelete={() => deleteColumn(col.id)}
                  onRename={(title) => renameColumn(col.id, title)}
                  onOpenCard={(id) => setOpenCardId(id)}
                />
              ))}
            </SortableContext>
            {editing && (
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
            )}
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
          canEdit={editing}
          boardLabels={labels}
          boardMembers={members}
          onClose={() => setOpenCardId(null)}
          onSave={(body) => updateCard(openCard.id, body)}
          onDelete={() => deleteCard(openCard.id)}
          onCreateLabel={createLabel}
          onDeleteLabel={deleteLabel}
        />
      )}
      {shareOpen && (
        <ShareBoardModal
          members={members}
          canManage={managing}
          onClose={() => setShareOpen(false)}
          onInvite={inviteMember}
          onChangeRole={changeMemberRole}
          onRemove={removeMember}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: BoardRoleClient }) {
  const styles: Record<BoardRoleClient, string> = {
    OWNER: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    EDITOR: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    VIEWER: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const label: Record<BoardRoleClient, string> = {
    OWNER: "Owner",
    EDITOR: "Editor",
    VIEWER: "View only",
  };
  return (
    <span
      className={`text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 ${styles[role]}`}
    >
      {label[role]}
    </span>
  );
}
