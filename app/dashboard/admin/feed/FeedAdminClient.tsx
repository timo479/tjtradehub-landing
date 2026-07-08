"use client";

import { useState, useEffect, useCallback } from "react";
import { FeedDetailModal, IMPACT_COLOR, symLabel, timeAgo } from "@/components/feed/FeedDetailModal";

const IMPACT_DOT: Record<string, string> = {
  high: "🔴",
  medium: "🟠",
  low: "🟡",
};

const ALLOWED_SYMBOLS = [
  "EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD",
  "XAUUSD","XAGUSD","USOIL","BTCUSD","ETHUSD","DXY","SPX","NAS100","US30",
];

// Keep in sync with FEED_RETENTION_DAYS in app/api/cron/daily/route.ts.
const RETENTION_DAYS = 7;

interface Scenario { if: string; then: string; }

interface FeedPost {
  id: string;
  title: string;
  body: string;
  scenarios: Scenario[];
  impact: "high" | "medium" | "low";
  symbols: string[];
  source_name: string;
  source_url: string;
  disclaimer: string;
  status: "draft" | "published" | "rejected";
  created_at: string;
  published_at: string | null;
  ai_model: string;
}

interface ApiResponse {
  items: FeedPost[];
  total: number;
  page: number;
  limit: number;
}

// How many days until the daily cron auto-deletes this post (null = published, kept forever).
function daysUntilDelete(post: FeedPost): number | null {
  if (post.status === "published") return null;
  const ageDays = Math.floor((Date.now() - new Date(post.created_at).getTime()) / 86_400_000);
  return Math.max(0, RETENTION_DAYS - ageDays);
}

export default function FeedAdminClient() {
  const [activeTab, setActiveTab] = useState<"draft" | "published" | "rejected">("draft");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterImpact, setFilterImpact] = useState("");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<FeedPost | null>(null);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [editForm, setEditForm] = useState<Partial<FeedPost>>({});
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState({ draft: 0, published: 0, rejected: 0 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Debounce the search box → filterSearch (which the fetch depends on).
  useEffect(() => {
    const t = setTimeout(() => { setFilterSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchCounts = useCallback(async () => {
    const tabs: Array<"draft" | "published" | "rejected"> = ["draft", "published", "rejected"];
    const results = await Promise.all(
      tabs.map(s =>
        // Auth läuft über die Admin-Session (checkFeedAuth akzeptiert role==="admin").
        // KEIN Bearer-Token im Client: NEXT_PUBLIC_* würde das Server-Secret
        // FEED_API_TOKEN ins öffentliche Bundle leaken → jeder könnte die Feed-Admin-API ansteuern.
        fetch(`/api/admin/feed/drafts?status=${s}&limit=1`).then(r => r.json())
      )
    );
    setCounts({
      draft: results[0]?.total ?? 0,
      published: results[1]?.total ?? 0,
      rejected: results[2]?.total ?? 0,
    });
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: activeTab, page: String(page), limit: "20" });
    if (filterImpact) params.set("impact", filterImpact);
    if (filterSymbol) params.set("symbol", filterSymbol);
    if (filterSearch) params.set("search", filterSearch);
    try {
      const res = await fetch(`/api/admin/feed/drafts?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data: ApiResponse = await res.json();
      setPosts(data.items);
      setTotal(data.total);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, filterImpact, filterSymbol, filterSearch]);

  useEffect(() => { fetchPosts(); fetchCounts(); }, [fetchPosts, fetchCounts]);

  // Never carry a selection across a tab/filter/page change — the ids would
  // point at posts that are no longer on screen.
  useEffect(() => { setSelected(new Set()); }, [activeTab, page, filterImpact, filterSymbol, filterSearch]);

  async function patchPost(id: string, update: Record<string, unknown>) {
    const res = await fetch(`/api/admin/feed/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    return res.ok;
  }

  async function handlePublish(id: string) {
    if (await patchPost(id, { status: "published" })) { fetchPosts(); fetchCounts(); }
  }

  async function handleReject(id: string) {
    if (await patchPost(id, { status: "rejected" })) { fetchPosts(); fetchCounts(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this post?")) return;
    await fetch(`/api/admin/feed/${id}`, { method: "DELETE" });
    fetchPosts(); fetchCounts();
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelected(prev => prev.size === posts.length ? new Set() : new Set(posts.map(p => p.id)));
  }
  async function bulkStatus(status: "published" | "rejected") {
    setBulkBusy(true);
    await Promise.all([...selected].map(id => patchPost(id, { status })));
    setSelected(new Set());
    setBulkBusy(false);
    fetchPosts(); fetchCounts();
  }
  async function bulkDelete() {
    if (!confirm(`Permanently delete ${selected.size} post(s)?`)) return;
    setBulkBusy(true);
    await Promise.all([...selected].map(id => fetch(`/api/admin/feed/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    setBulkBusy(false);
    fetchPosts(); fetchCounts();
  }

  function openEdit(post: FeedPost) {
    setEditPost(post);
    setEditForm({
      title: post.title,
      body: post.body,
      scenarios: post.scenarios,
      impact: post.impact,
      symbols: post.symbols,
      source_name: post.source_name,
      source_url: post.source_url,
      disclaimer: post.disclaimer,
    });
  }

  async function handleSaveEdit() {
    if (!editPost) return;
    setSaving(true);
    const update: Record<string, unknown> = { ...editForm };
    if (editForm.source_name || editForm.source_url) {
      update.source = { name: editForm.source_name ?? editPost.source_name, url: editForm.source_url ?? editPost.source_url };
      delete update.source_name; delete update.source_url;
    }
    if (await patchPost(editPost.id, update)) {
      setEditPost(null);
      fetchPosts();
    }
    setSaving(false);
  }

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: activeTab === tab ? 600 : 400,
    fontSize: "14px",
    background: activeTab === tab ? "#8B5CF6" : "rgba(255,255,255,0.06)",
    color: activeTab === tab ? "#fff" : "#9CA3AF",
    transition: "all 0.15s",
  });

  const allSelected = posts.length > 0 && selected.size === posts.length;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {(["draft","published","rejected"] as const).map(tab => (
          <button key={tab} style={tabStyle(tab)} onClick={() => { setActiveTab(tab); setPage(1); }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <select
          value={filterImpact}
          onChange={e => { setFilterImpact(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "#111", color: "#E5E7EB", fontSize: "14px" }}
        >
          <option value="">All Impact</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterSymbol}
          onChange={e => { setFilterSymbol(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "#111", color: "#E5E7EB", fontSize: "14px" }}
        >
          <option value="">All Symbols</option>
          {ALLOWED_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          placeholder="Search title / body…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "#111", color: "#E5E7EB", fontSize: "14px" }}
        />
      </div>

      {/* Select-all + bulk action bar */}
      {posts.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px", minHeight: "34px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#9CA3AF", fontSize: "13px", userSelect: "none" }}>
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ width: 16, height: 16, accentColor: "#8B5CF6", cursor: "pointer" }} />
            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
          </label>

          {selected.size > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(activeTab === "draft" || activeTab === "rejected") && (
                <button onClick={() => bulkStatus("published")} disabled={bulkBusy}
                  style={bulkBtn("#10B981")}>Publish ({selected.size})</button>
              )}
              {activeTab === "draft" && (
                <button onClick={() => bulkStatus("rejected")} disabled={bulkBusy}
                  style={bulkBtn("#EF4444")}>Reject ({selected.size})</button>
              )}
              {activeTab === "published" && (
                <button onClick={() => bulkStatus("rejected")} disabled={bulkBusy}
                  style={bulkBtn("#EF4444")}>Unpublish ({selected.size})</button>
              )}
              <button onClick={bulkDelete} disabled={bulkBusy}
                style={{ ...bulkBtn("transparent"), color: "#EF4444", border: "1px solid rgba(239,68,68,0.4)" }}>
                Delete ({selected.size})
              </button>
              {bulkBusy && <span style={{ color: "#6B7280", fontSize: "13px", alignSelf: "center" }}>Working…</span>}
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div style={{ color: "#6B7280", textAlign: "center", padding: "40px 0" }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#6B7280", textAlign: "center", padding: "40px 0", fontSize: "15px" }}>
          No posts found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {posts.map(post => {
            const isSelected = selected.has(post.id);
            const left = daysUntilDelete(post);
            return (
            <div
              key={post.id}
              style={{
                background: isSelected ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "12px",
                padding: "16px 20px",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                {/* Select checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(post.id)}
                  style={{ width: 16, height: 16, accentColor: "#8B5CF6", cursor: "pointer", marginTop: "4px", flexShrink: 0 }}
                />
                {/* Impact dot */}
                <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>{IMPACT_DOT[post.impact]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>
                    {post.title}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {post.symbols.map(s => (
                      <span key={s} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(139,92,246,0.15)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.3)" }}>{s}</span>
                    ))}
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>{timeAgo(post.created_at)} · {post.source_name}</span>
                    {left !== null && <DeleteBadge daysLeft={left} />}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", flexShrink: 0, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                    style={ghostBtn}
                  >
                    {expandedId === post.id ? "Hide" : "Preview"}
                  </button>
                  <button
                    onClick={() => setPreviewPost(post)}
                    style={{ ...ghostBtn, color: "#A78BFA", borderColor: "rgba(139,92,246,0.4)" }}
                    title="Exactly how a subscriber sees it"
                  >
                    User view
                  </button>
                  <button onClick={() => openEdit(post)} style={ghostBtn}>Edit</button>
                  {activeTab === "draft" && (
                    <>
                      <button onClick={() => handlePublish(post.id)} style={solidBtn("#10B981")}>Publish ✓</button>
                      <button onClick={() => handleReject(post.id)} style={solidBtn("#EF4444")}>Reject ✗</button>
                    </>
                  )}
                  {activeTab === "published" && (
                    <button onClick={() => handleReject(post.id)} style={solidBtn("#EF4444", false)}>Unpublish</button>
                  )}
                  {activeTab === "rejected" && (
                    <>
                      <button onClick={() => handlePublish(post.id)} style={solidBtn("#10B981", false)}>Re-publish</button>
                      <button onClick={() => handleDelete(post.id)} style={{ ...ghostBtn, color: "#EF4444", borderColor: "rgba(239,68,68,0.3)" }}>Delete</button>
                    </>
                  )}
                </div>
              </div>

              {/* Preview accordion */}
              {expandedId === post.id && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ color: "#D1D5DB", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", marginBottom: "16px" }}>{post.body}</p>
                  {post.scenarios.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Scenarios</div>
                      {post.scenarios.map((s, i) => (
                        <div key={i} style={{ marginBottom: "8px", paddingLeft: "12px", borderLeft: "2px solid rgba(139,92,246,0.4)" }}>
                          <div style={{ color: "#C4B5FD", fontSize: "13px" }}>▸ {s.if}</div>
                          <div style={{ color: "#9CA3AF", fontSize: "13px", marginLeft: "10px" }}>→ {s.then}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#EAB308", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "6px", padding: "8px 12px" }}>
                    ⚠️ {post.disclaimer}
                  </div>
                </div>
              )}
            </div>
          );})}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: page <= 1 ? "#4B5563" : "#9CA3AF", cursor: page <= 1 ? "default" : "pointer" }}
          >
            ← Prev
          </button>
          <span style={{ padding: "8px 16px", color: "#6B7280", fontSize: "14px" }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: page >= Math.ceil(total / 20) ? "#4B5563" : "#9CA3AF", cursor: page >= Math.ceil(total / 20) ? "default" : "pointer" }}
          >
            Next →
          </button>
        </div>
      )}

      {/* User-view preview (1:1 what a subscriber sees) */}
      {previewPost && (
        <FeedDetailModal
          post={{ ...previewPost, published_at: previewPost.published_at ?? previewPost.created_at }}
          onClose={() => setPreviewPost(null)}
        />
      )}

      {/* Edit Modal */}
      {editPost && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setEditPost(null); }}
        >
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 700, margin: 0 }}>Edit Post</h2>
              <button onClick={() => setEditPost(null)} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "20px" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Title <span style={{ color: "#6B7280" }}>({(editForm.title?.length ?? 0)}/120)</span></label>
                <input
                  value={editForm.title ?? ""}
                  maxLength={120}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Body */}
              <div>
                <label style={labelStyle}>Body (Markdown)</label>
                <textarea
                  value={editForm.body ?? ""}
                  onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))}
                  rows={6}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Impact */}
              <div>
                <label style={labelStyle}>Impact</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["high","medium","low"].map(imp => (
                    <button
                      key={imp}
                      onClick={() => setEditForm(f => ({ ...f, impact: imp as "high" | "medium" | "low" }))}
                      style={{
                        padding: "6px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                        border: `1px solid ${editForm.impact === imp ? IMPACT_COLOR[imp] : "rgba(255,255,255,0.1)"}`,
                        background: editForm.impact === imp ? `${IMPACT_COLOR[imp]}22` : "transparent",
                        color: editForm.impact === imp ? IMPACT_COLOR[imp] : "#9CA3AF",
                      }}
                    >
                      {imp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbols */}
              <div>
                <label style={labelStyle}>Symbols</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {ALLOWED_SYMBOLS.map(s => {
                    const active = (editForm.symbols ?? []).includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => setEditForm(f => ({
                          ...f,
                          symbols: active
                            ? (f.symbols ?? []).filter(x => x !== s)
                            : [...(f.symbols ?? []), s],
                        }))}
                        style={{
                          padding: "4px 10px", borderRadius: "20px", cursor: "pointer", fontSize: "12px",
                          border: `1px solid ${active ? "#8B5CF6" : "rgba(255,255,255,0.1)"}`,
                          background: active ? "rgba(139,92,246,0.2)" : "transparent",
                          color: active ? "#A78BFA" : "#6B7280",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scenarios */}
              <div>
                <label style={labelStyle}>Scenarios</label>
                {(editForm.scenarios ?? []).map((sc, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <input
                        placeholder="If…"
                        value={sc.if}
                        onChange={e => setEditForm(f => ({
                          ...f,
                          scenarios: (f.scenarios ?? []).map((s, j) => j === i ? { ...s, if: e.target.value } : s),
                        }))}
                        style={{ ...inputStyle, marginBottom: "4px" }}
                      />
                      <input
                        placeholder="Then…"
                        value={sc.then}
                        onChange={e => setEditForm(f => ({
                          ...f,
                          scenarios: (f.scenarios ?? []).map((s, j) => j === i ? { ...s, then: e.target.value } : s),
                        }))}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      onClick={() => setEditForm(f => ({ ...f, scenarios: (f.scenarios ?? []).filter((_, j) => j !== i) }))}
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#EF4444", cursor: "pointer", alignSelf: "flex-start" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {(editForm.scenarios ?? []).length < 5 && (
                  <button
                    onClick={() => setEditForm(f => ({ ...f, scenarios: [...(f.scenarios ?? []), { if: "", then: "" }] }))}
                    style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px" }}
                  >
                    + Add Scenario
                  </button>
                )}
              </div>

              {/* Source */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Source Name</label>
                  <input value={editForm.source_name ?? ""} onChange={e => setEditForm(f => ({ ...f, source_name: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Source URL</label>
                  <input value={editForm.source_url ?? ""} onChange={e => setEditForm(f => ({ ...f, source_url: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {/* Disclaimer */}
              <div>
                <label style={labelStyle}>Disclaimer</label>
                <textarea value={editForm.disclaimer ?? ""} onChange={e => setEditForm(f => ({ ...f, disclaimer: e.target.value }))} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <button
                  onClick={() => handleDelete(editPost.id).then(() => setEditPost(null))}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#EF4444", cursor: "pointer", fontSize: "14px" }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setEditPost(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#8B5CF6", color: "#fff", cursor: saving ? "default" : "pointer", fontSize: "14px", fontWeight: 600, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small presentational helpers ──────────────────────────────────────────────

function DeleteBadge({ daysLeft }: { daysLeft: number }) {
  const color = daysLeft <= 2 ? "#EF4444" : daysLeft <= 4 ? "#F97316" : "#6B7280";
  const label = daysLeft === 0 ? "auto-deletes today" : `auto-deletes in ${daysLeft}d`;
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px",
      color, background: `${color}18`, border: `1px solid ${color}44`,
    }}>
      ⏳ {label}
    </span>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)",
  background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px",
};

function solidBtn(bg: string, bold = true): React.CSSProperties {
  return {
    padding: "6px 12px", borderRadius: "6px", border: "none", background: bg,
    color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: bold ? 600 : 400,
  };
}

function bulkBtn(bg: string): React.CSSProperties {
  return {
    padding: "7px 14px", borderRadius: "7px", border: "none", background: bg,
    color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600,
  };
}

const labelStyle: React.CSSProperties = {
  display: "block", color: "#9CA3AF", fontSize: "13px", fontWeight: 500, marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)", color: "#F9FAFB", fontSize: "14px", outline: "none", boxSizing: "border-box",
};
