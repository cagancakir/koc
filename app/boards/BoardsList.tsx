"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Board = { id: string; title: string; createdAt: string };

export default function BoardsList({ initial }: { initial: Board[] }) {
  const [boards, setBoards] = useState<Board[]>(initial);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }

  async function deleteBoard(id: string) {
    if (!confirm("Delete this board and all its content?")) return;
    const prev = boards;
    setBoards((b) => b.filter((x) => x.id !== id));
    const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setBoards(prev);
      setError("Could not delete board");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createBoard} className="flex gap-2">
        <input
          type="text"
          placeholder="New board title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 rounded"
        >
          {creating ? "Creating..." : "Create board"}
        </button>
      </form>
      {error && (
        <div className="text-sm bg-red-50 text-red-700 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      {boards.length === 0 ? (
        <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded p-8 text-center">
          No boards yet. Create your first one above.
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((b) => (
            <li
              key={b.id}
              className="group bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition relative"
            >
              <Link href={`/boards/${b.id}`} className="block p-5">
                <h2 className="font-semibold text-slate-900 truncate pr-8">{b.title}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(b.createdAt).toLocaleDateString()}
                </p>
              </Link>
              <button
                onClick={() => deleteBoard(b.id)}
                className="absolute top-3 right-3 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-sm"
                aria-label="Delete board"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
