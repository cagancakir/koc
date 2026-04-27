"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardData } from "./BoardCanvas";

type Props = {
  card: CardData;
  onOpen: () => void;
  overlay?: boolean;
};

export default function CardItem({ card, onOpen, overlay }: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", columnId: card.columnId },
    disabled: overlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={(e) => {
        if (overlay) return;
        if (isDragging) return;
        e.stopPropagation();
        onOpen();
      }}
      className={`bg-white border border-slate-200 rounded-md p-2.5 text-sm text-slate-800 shadow-sm hover:border-slate-400 cursor-grab active:cursor-grabbing select-none ${
        overlay ? "shadow-xl rotate-1" : ""
      }`}
    >
      <div className="font-medium whitespace-pre-wrap break-words">{card.title}</div>
      {card.description ? (
        <div className="mt-1 text-xs text-slate-500 line-clamp-2 whitespace-pre-wrap break-words">
          {card.description}
        </div>
      ) : null}
    </div>
  );
}
