"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PendingNewsletter {
  id: string;
  week_of: string;
  subject: string;
  generated_at: string;
  content_json: unknown;
}

interface HistoryEntry {
  id: string;
  week_of: string;
  subject: string;
  status: string;
  sent_at: string | null;
  recipient_count: number | null;
  error_message: string | null;
  generated_at: string;
}

interface Props {
  pending: PendingNewsletter | null;
  history: HistoryEntry[];
  optInCount: number;
}

export default function NewsletterAdminClient({ pending, history, optInCount }: Props) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  async function handleApprove() {
    if (!pending) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/admin/newsletter/${pending.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSendResult({
          ok: true,
          message: `✓ Sent to ${data.result?.succeeded ?? 0} subscriber${data.result?.succeeded === 1 ? "" : "s"}${data.result?.failed > 0 ? ` (${data.result.failed} failed)` : ""}`,
        });
        setTimeout(() => router.refresh(), 2000);
      } else {
        setSendResult({ ok: false, message: data.message ?? data.error ?? "Send failed" });
      }
    } catch (err) {
      setSendResult({ ok: false, message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setSending(false);
    }
  }

  async function handleDiscard() {
    if (!pending) return;
    setDiscarding(true);
    try {
      const res = await fetch(`/api/admin/newsletter/${pending.id}/discard`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setSendResult({ ok: false, message: data.error ?? "Discard failed" });
      }
    } catch (err) {
      setSendResult({ ok: false, message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setDiscarding(false);
      setConfirmDiscard(false);
    }
  }

  return (
    <>
      {/* PENDING SECTION */}
      {pending ? (
        <section
          style={{
            backgroundColor: "#0A0A0A",
            border: "1px solid #1F2937",
            borderRadius: "16px",
            padding: "28px",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "3px 8px",
                borderRadius: "5px",
                backgroundColor: "rgba(251, 191, 36, 0.12)",
                color: "#FBBF24",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                textTransform: "uppercase",
              }}
            >
              Pending Review
            </span>
            <span style={{ color: "#6B7280", fontSize: "13px" }}>
              Week of {pending.week_of} · Generated {new Date(pending.generated_at).toLocaleString("en-US")}
            </span>
          </div>

          <h2
            style={{
              color: "#F9FAFB",
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 14px",
              lineHeight: 1.3,
            }}
          >
            {pending.subject}
          </h2>

          <div
            style={{
              display: "flex",
              gap: "20px",
              padding: "14px 16px",
              backgroundColor: "#000",
              border: "1px solid #1F2937",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <div>
              <p style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Will be sent to
              </p>
              <p style={{ color: "#A78BFA", fontSize: "18px", fontWeight: 700, margin: "2px 0 0" }}>
                {optInCount} subscriber{optInCount === 1 ? "" : "s"}
              </p>
            </div>
            <div style={{ width: "1px", backgroundColor: "#1F2937" }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Preview
              </p>
              <a
                href={`/api/admin/newsletter/preview?id=${pending.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#A78BFA", fontSize: "14px", textDecoration: "underline" }}
              >
                Open in new tab ↗
              </a>
            </div>
          </div>

          {/* Inline preview iframe */}
          <iframe
            src={`/api/admin/newsletter/preview?id=${pending.id}`}
            style={{
              width: "100%",
              height: "600px",
              border: "1px solid #1F2937",
              borderRadius: "10px",
              backgroundColor: "#000",
              marginBottom: "20px",
            }}
            title="Newsletter preview"
          />

          {/* Result banner */}
          {sendResult && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "16px",
                backgroundColor: sendResult.ok ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${sendResult.ok ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                color: sendResult.ok ? "#22c55e" : "#ef4444",
                fontSize: "14px",
              }}
            >
              {sendResult.message}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            {!confirmDiscard ? (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={sending || discarding}
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: sending ? "#1F7A3F" : "#22c55e",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: sending ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s",
                  }}
                >
                  {sending ? "Sending…" : `Approve & Send to ${optInCount}`}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDiscard(true)}
                  disabled={sending || discarding}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "10px",
                    border: "1px solid #374151",
                    backgroundColor: "transparent",
                    color: "#ef4444",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: sending || discarding ? "not-allowed" : "pointer",
                  }}
                >
                  Discard
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmDiscard(false)}
                  disabled={discarding}
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    borderRadius: "10px",
                    border: "1px solid #374151",
                    backgroundColor: "transparent",
                    color: "#9CA3AF",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: discarding ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={discarding}
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: discarding ? "not-allowed" : "pointer",
                  }}
                >
                  {discarding ? "Discarding…" : "Yes, discard this newsletter"}
                </button>
              </>
            )}
          </div>
        </section>
      ) : (
        <section
          style={{
            backgroundColor: "#0A0A0A",
            border: "1px dashed #1F2937",
            borderRadius: "16px",
            padding: "40px",
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#9CA3AF", fontSize: "15px", margin: "0 0 6px" }}>
            No newsletter pending review.
          </p>
          <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>
            The next one will be generated automatically on Monday at 06:00 UTC.
          </p>
        </section>
      )}

      {/* HISTORY */}
      <section>
        <h2 style={{ color: "#F9FAFB", fontSize: "16px", fontWeight: 600, margin: "0 0 14px" }}>
          History
        </h2>
        {history.length === 0 ? (
          <p style={{ color: "#6B7280", fontSize: "13px" }}>No past newsletters yet.</p>
        ) : (
          <div
            style={{
              backgroundColor: "#0A0A0A",
              border: "1px solid #1F2937",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {history.map((h, i) => (
              <div
                key={h.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 18px",
                  borderTop: i === 0 ? "none" : "1px solid #1F2937",
                }}
              >
                <StatusBadge status={h.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: "#F9FAFB",
                      fontSize: "14px",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.subject}
                  </p>
                  <p style={{ color: "#6B7280", fontSize: "12px", margin: "2px 0 0" }}>
                    Week of {h.week_of}
                    {h.sent_at && ` · Sent ${new Date(h.sent_at).toLocaleString("en-US")}`}
                    {h.recipient_count !== null && ` · ${h.recipient_count} recipients`}
                    {h.error_message && ` · ${h.error_message}`}
                  </p>
                </div>
                <a
                  href={`/api/admin/newsletter/preview?id=${h.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#A78BFA", fontSize: "12px", textDecoration: "underline", flexShrink: 0 }}
                >
                  Preview ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; fg: string; border: string; label: string }> = {
    sent: { bg: "rgba(34, 197, 94, 0.12)", fg: "#22c55e", border: "rgba(34, 197, 94, 0.3)", label: "Sent" },
    failed: { bg: "rgba(239, 68, 68, 0.12)", fg: "#ef4444", border: "rgba(239, 68, 68, 0.3)", label: "Failed" },
    sending: { bg: "rgba(168, 85, 247, 0.12)", fg: "#A78BFA", border: "rgba(168, 85, 247, 0.3)", label: "Sending" },
    approved: { bg: "rgba(168, 85, 247, 0.12)", fg: "#A78BFA", border: "rgba(168, 85, 247, 0.3)", label: "Approved" },
    draft: { bg: "rgba(107, 114, 128, 0.12)", fg: "#9CA3AF", border: "rgba(107, 114, 128, 0.3)", label: "Draft" },
  };
  const c = config[status] ?? config.draft;
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "3px 8px",
        borderRadius: "5px",
        backgroundColor: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      {c.label}
    </span>
  );
}
