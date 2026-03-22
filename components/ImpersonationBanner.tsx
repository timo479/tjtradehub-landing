"use client";

import { signOut } from "next-auth/react";

export default function ImpersonationBanner({ email }: { email: string }) {
  return (
    <div className="w-full bg-orange-500 text-black px-4 py-2 flex items-center justify-between text-sm font-medium z-50">
      <span>👁 Viewing as <strong>{email}</strong> (Admin Impersonation)</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="ml-4 px-3 py-1 bg-black text-white rounded text-xs hover:bg-zinc-800 transition-colors"
      >
        Stop & Log out
      </button>
    </div>
  );
}
