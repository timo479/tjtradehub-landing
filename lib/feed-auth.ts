import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function checkFeedAuth(req: NextRequest): Promise<boolean> {
  // n8n / external: Bearer token
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const expected = process.env.FEED_API_TOKEN;
    if (expected && token === expected) return true;
  }

  // Admin UI: session-based
  const session = await auth();
  if (session?.user && (session.user as { role?: string }).role === "admin") return true;

  return false;
}
