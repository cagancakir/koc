"use client";

import { useEffect, useState } from "react";
import type { CardData } from "./BoardCanvas";

type Props = {
  card: CardData;
  onClose: () => void;
  onSave: (body: { title?: string; description?: string | null }) => void;
  onDelete: () => void;
};

export default function CardDetailModal({
  card,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? "");
  }, [card.id, card.title, card.description]);

  function handleClose() {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const updates: { title?: string; description?: string | null } = {};
    if (trimmedTitle && trimmedTitle !== card.title) updates.title = trimmedTitle;
    const currentDesc = card.description ?? "";
    if (trimmedDesc !== currentDesc) {
      updates.description = trimmedDesc.length > 0 ? trimmedDesc : null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-start justify-center pt-20 px-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-semibold border-b border-slate-200 pb-2 focus:outline-none focus:border-blue-500"
        />
        <div>
          <label className="block text-xs font-medium uppercase text-slate-500 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Add a description..."
            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between pt-2">
          <button
            onClick={() => {
              if (confirm("Delete this card?")) onDelete();
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded text-sm"
            >
              Close
            </button>
            <button
              onClick={handleClose}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
