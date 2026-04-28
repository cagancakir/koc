"use client";

import { FormEvent, useState } from "react";
import type { MemberRow } from "./BoardCanvas";
import { UsersIcon, XIcon, TrashIcon } from "./Icons";

type Props = {
  members: MemberRow[];
  canManage: boolean;
  onClose: () => void;
  onInvite: (
    email: string,
    role: "EDITOR" | "VIEWER",
  ) => Promise<{ ok: boolean; error?: string }>;
  onChangeRole: (memberId: string, role: "EDITOR" | "VIEWER") => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
};

export default function ShareBoardModal({
  members,
  canManage,
  onClose,
  onInvite,
  onChangeRole,
  onRemove,
}: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setInviting(true);
    setError(null);
    const res = await onInvite(trimmed, role);
    setInviting(false);
    if (res.ok) {
      setEmail("");
    } else {
      setError(res.error || "Failed to invite member");
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <UsersIcon width={18} height={18} className="text-slate-500" />
            Share Board
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-md transition"
            aria-label="Close"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {canManage && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Invite team members
              </label>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                  className="px-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !email.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
                >
                  {inviting ? "Inviting..." : "Invite"}
                </button>
              </form>
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Board members
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">
                      {m.email}
                    </span>
                    <span className="text-xs text-slate-500">
                      {m.role === "OWNER" ? "Owner" : "Member"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && m.role !== "OWNER" ? (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) =>
                            onChangeRole(m.memberId!, e.target.value as "EDITOR" | "VIEWER")
                          }
                          className="px-2 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="EDITOR">Editor</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <button
                          onClick={() => onRemove(m.memberId!)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Remove member"
                        >
                          <TrashIcon width={14} height={14} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-md">
                        {m.role === "OWNER"
                          ? "Owner"
                          : m.role === "EDITOR"
                          ? "Editor"
                          : "Viewer"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
