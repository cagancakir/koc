"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "./Icons";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition"
      aria-label="Sign out"
    >
      <LogOutIcon width={14} height={14} />
      <span>Sign out</span>
    </button>
  );
}
