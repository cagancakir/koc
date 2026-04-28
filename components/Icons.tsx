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

export function CalendarIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function UserIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function UsersIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function TagIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  );
}

export function ShareIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
    </svg>
  );
}

export function CheckIcon(p: Props) {
  return (
    <svg {...base} width={16} height={16} {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export type LabelColorKey =
  | "INDIGO"
  | "EMERALD"
  | "AMBER"
  | "ROSE"
  | "SKY"
  | "FUCHSIA"
  | "SLATE";

export const LABEL_COLOR_KEYS: LabelColorKey[] = [
  "INDIGO",
  "EMERALD",
  "AMBER",
  "ROSE",
  "SKY",
  "FUCHSIA",
  "SLATE",
];

export const LABEL_COLOR_CLASSES: Record<
  LabelColorKey,
  { bg: string; text: string; ring: string; chip: string; dot: string }
> = {
  INDIGO: {
    bg: "bg-indigo-500",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    chip: "bg-indigo-100 text-indigo-800",
    dot: "bg-indigo-500",
  },
  EMERALD: {
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    chip: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  AMBER: {
    bg: "bg-amber-500",
    text: "text-amber-700",
    ring: "ring-amber-200",
    chip: "bg-amber-100 text-amber-900",
    dot: "bg-amber-500",
  },
  ROSE: {
    bg: "bg-rose-500",
    text: "text-rose-700",
    ring: "ring-rose-200",
    chip: "bg-rose-100 text-rose-800",
    dot: "bg-rose-500",
  },
  SKY: {
    bg: "bg-sky-500",
    text: "text-sky-700",
    ring: "ring-sky-200",
    chip: "bg-sky-100 text-sky-800",
    dot: "bg-sky-500",
  },
  FUCHSIA: {
    bg: "bg-fuchsia-500",
    text: "text-fuchsia-700",
    ring: "ring-fuchsia-200",
    chip: "bg-fuchsia-100 text-fuchsia-800",
    dot: "bg-fuchsia-500",
  },
  SLATE: {
    bg: "bg-slate-500",
    text: "text-slate-700",
    ring: "ring-slate-200",
    chip: "bg-slate-100 text-slate-800",
    dot: "bg-slate-500",
  },
};

export function initials(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
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
