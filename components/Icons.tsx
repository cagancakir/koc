import { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function PlusIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function XIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function TrashIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function GripIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronLeftIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function LogOutIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function LayersIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
    </svg>
  );
}

export function AlignLeftIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M17 10H3M21 6H3M21 14H3M17 18H3" />
    </svg>
  );
}

export function SparkleIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

export const ACCENTS = [
  { ring: "from-indigo-500 to-violet-500", solid: "bg-indigo-500", text: "text-indigo-600" },
  { ring: "from-emerald-500 to-teal-500", solid: "bg-emerald-500", text: "text-emerald-600" },
  { ring: "from-amber-500 to-orange-500", solid: "bg-amber-500", text: "text-amber-600" },
  { ring: "from-rose-500 to-pink-500", solid: "bg-rose-500", text: "text-rose-600" },
  { ring: "from-sky-500 to-cyan-500", solid: "bg-sky-500", text: "text-sky-600" },
  { ring: "from-fuchsia-500 to-purple-500", solid: "bg-fuchsia-500", text: "text-fuchsia-600" },
];

export function pickAccent(idOrIndex: string | number) {
  if (typeof idOrIndex === "number") return ACCENTS[idOrIndex % ACCENTS.length];
  let h = 0;
  for (let i = 0; i < idOrIndex.length; i++) h = (h * 31 + idOrIndex.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}
