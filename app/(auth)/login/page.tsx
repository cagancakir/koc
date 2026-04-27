"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { LayersIcon } from "@/components/Icons";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/boards");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm bg-white/90 glass rounded-2xl shadow-xl ring-1 ring-slate-900/5 p-8 space-y-5 animate-in"
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white grid place-items-center shadow-lg shadow-indigo-500/30">
          <LayersIcon width={22} height={22} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to continue to TaskFlow</p>
      </div>

      {justRegistered && (
        <div className="text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-2">
          Account created. Sign in below.
        </div>
      )}
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
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-slate-700 mb-1.5">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg shadow-md shadow-indigo-500/20 transition"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-sm text-slate-600 text-center">
        No account?{" "}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
