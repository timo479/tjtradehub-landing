import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${appUrl()}/login?error=invalid_token`);
  }

  const { data: user } = await db
    .from("users")
    .select("id, verification_token_expires")
    .eq("verification_token", token)
    .single();

  if (!user) {
    return NextResponse.redirect(`${appUrl()}/login?error=invalid_token`);
  }

  if (new Date(user.verification_token_expires) < new Date()) {
    await db.from("users").update({
      verification_token: null,
      verification_token_expires: null,
    }).eq("id", user.id);
    return NextResponse.redirect(`${appUrl()}/login?error=token_expired`);
  }

  await db
    .from("users")
    .update({
      email_verified: true,
      verification_token: null,
      verification_token_expires: null,
    })
    .eq("id", user.id);

  return NextResponse.redirect(`${appUrl()}/login?verified=1`);
}
