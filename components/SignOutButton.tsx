"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm px-4 py-1.5 rounded-lg transition-colors"
      style={{ color: "#9CA3AF", border: "1px solid #1F2937" }}
    >
      Sign out
    </button>
  );
}
