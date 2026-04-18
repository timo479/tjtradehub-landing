import { NextRequest, NextResponse } from "next/server";
import { sendTrialEmail, TrialEmailType } from "@/lib/email";

const VALID_TYPES: TrialEmailType[] = ["day5", "day6", "day7", "day8", "week1", "week2", "week3"];

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = (req.nextUrl.searchParams.get("type") ?? "day5") as TrialEmailType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    await sendTrialEmail("timo@tjtradehub.com", type);
    return NextResponse.json({ ok: true, type, to: "timo@tjtradehub.com" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
