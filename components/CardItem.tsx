"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardData } from "./BoardCanvas";
import { AlignLeftIcon } from "./Icons";

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
      className={`group relative bg-white border border-slate-200/80 rounded-lg p-2.5 text-sm text-slate-800 shadow-card hover:shadow-cardHover hover:border-indigo-300 hover:-translate-y-px cursor-grab active:cursor-grabbing select-none transition ${
        overlay ? "shadow-xl ring-2 ring-indigo-400/40 rotate-1" : ""
      }`}
    >
      <div className="font-medium leading-snug whitespace-pre-wrap break-words">
        {card.title}
      </div>
      {card.description ? (
        <div className="mt-1.5 flex items-start gap-1 text-xs text-slate-500">
          <AlignLeftIcon
            width={12}
            height={12}
            className="mt-0.5 shrink-0 text-slate-400"
          />
          <span className="line-clamp-2 whitespace-pre-wrap break-words">
            {card.description}
          </span>
        </div>
      ) : null}
    </div>
  );
}
