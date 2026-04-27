"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { LayersIcon } from "@/components/Icons";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Registration failed");
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white/90 glass rounded-2xl shadow-xl ring-1 ring-slate-900/5 p-8 space-y-5 animate-in"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center shadow-lg shadow-emerald-500/30">
            <LayersIcon width={22} height={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">Start organizing your work in seconds</p>
        </div>

        {error && (
          <div className="text-sm bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-700 mb-1.5">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Password <span className="text-slate-400 font-normal">(min. 6 chars)</span>
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg shadow-md shadow-emerald-500/20 transition"
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="text-sm text-slate-600 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
