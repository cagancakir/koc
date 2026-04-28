"use client";

import { useEffect, useState } from "react";
import type { CardData, LabelData, MemberRow } from "./BoardCanvas";
import {
  AlignLeftIcon,
  TrashIcon,
  XIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  LABEL_COLOR_KEYS,
  LABEL_COLOR_CLASSES,
  type LabelColorKey,
  initials,
} from "./Icons";

type Props = {
  card: CardData;
  canEdit: boolean;
  boardLabels: LabelData[];
  boardMembers: MemberRow[];
  onClose: () => void;
  onSave: (body: {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    assigneeId?: string | null;
    labelIds?: string[];
  }) => void;
  onDelete: () => void;
  onCreateLabel: (name: string, color: LabelColorKey) => Promise<LabelData | null>;
  onDeleteLabel: (labelId: string) => void;
};

export default function CardDetailModal({
  card,
  canEdit,
  boardLabels,
  boardMembers,
  onClose,
  onSave,
  onDelete,
  onCreateLabel,
  onDeleteLabel,
}: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split("T")[0] : "");
  const [assigneeId, setAssigneeId] = useState<string | null>(card.assigneeId);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    card.labels.map((l) => l.id)
  );

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? "");
    setDueDate(card.dueDate ? card.dueDate.split("T")[0] : "");
    setAssigneeId(card.assigneeId);
    setSelectedLabels(card.labels.map((l) => l.id));
  }, [card]);

  function handleClose() {
    if (!canEdit) {
      onClose();
      return;
    }
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const updates: Parameters<Props["onSave"]>[0] = {};

    if (trimmedTitle && trimmedTitle !== card.title) updates.title = trimmedTitle;
    const currentDesc = card.description ?? "";
    if (trimmedDesc !== currentDesc) {
      updates.description = trimmedDesc.length > 0 ? trimmedDesc : null;
    }
    const currentDueDate = card.dueDate ? card.dueDate.split("T")[0] : "";
    if (dueDate !== currentDueDate) {
      updates.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
    }
    if (assigneeId !== card.assigneeId) {
      updates.assigneeId = assigneeId;
    }
    
    // Check if labels changed
    const currentLabels = card.labels.map((l) => l.id).sort().join(",");
    const newLabels = [...selectedLabels].sort().join(",");
    if (currentLabels !== newLabels) {
      updates.labelIds = selectedLabels;
    }

    if (Object.keys(updates).length > 0) onSave(updates);
    onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [title, description, dueDate, assigneeId, selectedLabels, canEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleLabel(id: string) {
    if (!canEdit) return;
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-in overflow-y-auto pb-20"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 w-full max-w-2xl overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-slate-200/80">
            {canEdit ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Card title"
                className="flex-1 text-lg font-semibold bg-transparent focus:outline-none placeholder:text-slate-400"
              />
            ) : (
              <h2 className="flex-1 text-lg font-semibold text-slate-900 truncate">
                {title}
              </h2>
            )}
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-md transition"
              aria-label="Close"
            >
              <XIcon width={16} height={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                <AlignLeftIcon width={12} height={12} />
                Description
              </label>
              {canEdit ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Add a more detailed description…"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                />
              ) : (
                <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {description || <span className="text-slate-400 italic">No description</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <UserIcon width={12} height={12} />
                  Assignee
                </label>
                {canEdit ? (
                  <select
                    value={assigneeId || ""}
                    onChange={(e) => setAssigneeId(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {boardMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-slate-700 flex items-center gap-2">
                    {assigneeId ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-medium">
                          {initials(boardMembers.find((m) => m.id === assigneeId)?.email || "User")}
                        </div>
                        <span>{boardMembers.find((m) => m.id === assigneeId)?.email || "Unknown"}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <CalendarIcon width={12} height={12} />
                  Due Date
                </label>
                {canEdit ? (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                ) : (
                  <div className="text-sm text-slate-700">
                    {dueDate ? new Date(dueDate).toLocaleDateString() : <span className="text-slate-400">No due date</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200/80 p-6 flex flex-col gap-6 shrink-0">
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
              <TagIcon width={12} height={12} />
              Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              {boardLabels.map((label) => {
                const isSelected = selectedLabels.includes(label.id);
                const colors = LABEL_COLOR_CLASSES[label.color as LabelColorKey];
                return (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    disabled={!canEdit}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      isSelected
                        ? `${colors.bg} text-white shadow-sm`
                        : `bg-white border border-slate-200 text-slate-600 hover:border-slate-300`
                    } ${!canEdit && "cursor-default"}`}
                  >
                    {label.name}
                  </button>
                );
              })}
              {boardLabels.length === 0 && (
                <div className="text-xs text-slate-400 italic">No labels available</div>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-2 pt-6">
            {canEdit && (
              <button
                onClick={() => {
                  if (confirm("Delete this card?")) onDelete();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 text-rose-600 bg-white border border-rose-200 hover:text-white hover:bg-rose-600 hover:border-rose-600 text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm"
              >
                <TrashIcon width={14} height={14} />
                Delete Card
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm shadow-indigo-500/20 transition"
            >
              {canEdit ? "Save & Close" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
