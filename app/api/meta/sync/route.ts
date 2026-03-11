import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchDeals, MetaDeal } from "@/lib/metaapi";
import { NextResponse } from "next/server";

const META_TEMPLATE_NAME = "MetaAPI Import";

// Ensure the MetaAPI import template exists, return its id
async function ensureTemplate(userId: string): Promise<string> {
  const { data: existing } = await db
    .from("journal_templates")
    .select("id")
    .eq("user_id", userId)
    .eq("name", META_TEMPLATE_NAME)
    .single();

  if (existing) return existing.id;

  // Create template
  const { data: tmpl, error: tErr } = await db
    .from("journal_templates")
    .insert({ user_id: userId, name: META_TEMPLATE_NAME, version: 1 })
    .select()
    .single();
  if (tErr || !tmpl) throw new Error("Failed to create template");

  // Create section
  const { data: sec } = await db
    .from("template_sections")
    .insert({ template_id: tmpl.id, name: "Trade Info", order_index: 0 })
    .select()
    .single();
  if (!sec) throw new Error("Failed to create section");

  // Create fields
  const fields = [
    { label: "Symbol",     field_type: "text",   is_required: true,  order_index: 0 },
    { label: "Direction",  field_type: "select", is_required: true,  order_index: 1, options: ["Long", "Short"] },
    { label: "Volume",     field_type: "number", is_required: false, order_index: 2 },
    { label: "Entry Price",field_type: "number", is_required: false, order_index: 3 },
    { label: "Exit Price", field_type: "number", is_required: false, order_index: 4 },
    { label: "P&L",        field_type: "number", is_required: false, order_index: 5 },
    { label: "Commission", field_type: "number", is_required: false, order_index: 6 },
    { label: "Swap",       field_type: "number", is_required: false, order_index: 7 },
    { label: "Comment",    field_type: "text",   is_required: false, order_index: 8 },
  ];

  await db.from("template_fields").insert(
    fields.map(f => ({ ...f, template_id: tmpl.id, section_id: sec.id, options: ("options" in f ? f.options : null) ?? null }))
  );

  return tmpl.id;
}

// Get field IDs for a template
async function getFieldMap(templateId: string): Promise<Record<string, string>> {
  const { data: fields } = await db
    .from("template_fields")
    .select("id, label")
    .eq("template_id", templateId);

  const map: Record<string, string> = {};
  for (const f of fields ?? []) map[f.label] = f.id;
  return map;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("metaapi_account_id, last_meta_sync")
    .eq("id", session.user.id)
    .single();

  if (!user?.metaapi_account_id) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const to = new Date();
  const from = user.last_meta_sync ? new Date(user.last_meta_sync) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days back

  try {
    const deals = await fetchDeals(user.metaapi_account_id, from, to);

    // Only closed trades (DEAL_ENTRY_OUT) that have P&L
    const closedDeals: MetaDeal[] = deals.filter(
      d => d.entry === "DEAL_ENTRY_OUT" && (d.type === "DEAL_TYPE_BUY" || d.type === "DEAL_TYPE_SELL")
    );

    if (closedDeals.length === 0) {
      await db.from("users").update({ last_meta_sync: to.toISOString() }).eq("id", session.user.id);
      return NextResponse.json({ synced: 0, skipped: 0 });
    }

    const templateId = await ensureTemplate(session.user.id);
    const fieldMap = await getFieldMap(templateId);

    let synced = 0, skipped = 0;

    for (const deal of closedDeals) {
      // Check duplicate
      const { data: exists } = await db
        .from("trade_entries")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("meta_deal_id", deal.id)
        .maybeSingle();

      if (exists) { skipped++; continue; }

      // Create entry
      const { data: entry, error: eErr } = await db
        .from("trade_entries")
        .insert({
          user_id: session.user.id,
          template_id: templateId,
          template_version: 1,
          trade_date: deal.time.slice(0, 10),
          meta_deal_id: deal.id,
        })
        .select()
        .single();

      if (eErr || !entry) { skipped++; continue; }

      // Build field values
      const isLong = deal.type === "DEAL_TYPE_BUY";
      const fieldValues = [
        fieldMap["Symbol"]      && { field_id: fieldMap["Symbol"],      value: deal.symbol },
        fieldMap["Direction"]   && { field_id: fieldMap["Direction"],   value: isLong ? "Long" : "Short" },
        fieldMap["Volume"]      && { field_id: fieldMap["Volume"],      value: String(deal.volume) },
        fieldMap["P&L"]         && { field_id: fieldMap["P&L"],         value: String(deal.profit + (deal.commission ?? 0) + (deal.swap ?? 0)) },
        fieldMap["Commission"]  && { field_id: fieldMap["Commission"],  value: String(deal.commission ?? 0) },
        fieldMap["Swap"]        && { field_id: fieldMap["Swap"],        value: String(deal.swap ?? 0) },
        deal.comment && fieldMap["Comment"]   && { field_id: fieldMap["Comment"],   value: deal.comment },
      ].filter(Boolean) as { field_id: string; value: string }[];

      if (fieldValues.length > 0) {
        await db.from("trade_field_values").insert(
          fieldValues.map(fv => ({ trade_id: entry.id, ...fv }))
        );
      }

      synced++;
    }

    await db.from("users").update({ last_meta_sync: to.toISOString() }).eq("id", session.user.id);
    return NextResponse.json({ synced, skipped, total: closedDeals.length });

  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Sync error" }, { status: 502 });
  }
}
