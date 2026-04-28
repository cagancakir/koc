"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PlusIcon, TrashIcon, pickAccent } from "@/components/Icons";

type Board = { id: string; title: string; createdAt: string };

export default function BoardsList({ initial }: { initial: Board[] }) {
  const [boards, setBoards] = useState<Board[]>(initial);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function createBoard(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setCreating(false);
    if (!res.ok) {
      setError("Could not create board");
      return;
    }
    const board: Board = await res.json();
    setBoards((prev) => [board, ...prev]);
    setTitle("");
    router.refresh();
  }

  async function deleteBoard(id: string) {
    if (!confirm("Delete this board and all its content?")) return;
    const prev = boards;
    setBoards((b) => b.filter((x) => x.id !== id));
    const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setBoards(prev);
      setError("Could not delete board");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createBoard}
        className="flex gap-2 bg-white rounded-xl shadow-card ring-1 ring-slate-900/5 p-2"
      >
        <input
          type="text"
          placeholder="New board title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm shadow-indigo-500/20 transition"
        >
          <PlusIcon width={14} height={14} />
          {creating ? "Creating..." : "Create board"}
        </button>
      </form>
      {error && (
        <div className="text-sm bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {boards.length === 0 ? (
        <div className="text-slate-500 bg-white/70 border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="text-slate-700 font-medium mb-1">No boards yet</div>
          <div className="text-sm text-slate-500">
            Create your first board above to get started.
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((b) => {
            const accent = pickAccent(b.id);
            return (
              <li
                key={b.id}
                className="group relative bg-white rounded-xl shadow-card ring-1 ring-slate-900/5 hover:shadow-cardHover hover:-translate-y-0.5 transition overflow-hidden"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent.ring}`}
                />
                <Link href={`/boards/${b.id}`} className="block p-5 pt-6">
                  <h2 className="font-semibold text-slate-900 truncate pr-8 group-hover:text-indigo-700 transition">
                    {b.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-2">
                    Created {new Date(b.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <button
                  onClick={() => deleteBoard(b.id)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition"
                  aria-label="Delete board"
                >
                  <TrashIcon width={14} height={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
