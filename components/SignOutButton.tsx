"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-slate-600 hover:text-slate-900 underline"
    >
      Sign out
    </button>
  );
}
