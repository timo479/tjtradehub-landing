"use client";

import { useState, useEffect, useCallback } from "react";

const IMPACT_COLOR: Record<string, string> = {
  high: "#EF4444",
  medium: "#F97316",
  low: "#EAB308",
};

const IMPACT_DOT: Record<string, string> = {
  high: "🔴",
  medium: "🟠",
  low: "🟡",
};

const ALLOWED_SYMBOLS = [
  "EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD",
  "XAUUSD","XAGUSD","USOIL","BTCUSD","ETHUSD","DXY","SPX","NAS100","US30",
];

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function FeedAdminClient() {
  const [activeTab, setActiveTab] = useState<"draft" | "published" | "rejected">("draft");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterImpact, setFilterImpact] = useState("");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [editForm, setEditForm] = useState<Partial<FeedPost>>({});
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState({ draft: 0, published: 0, rejected: 0 });

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
    try {
      const res = await fetch(`/api/admin/feed/drafts?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data: ApiResponse = await res.json();
      let items = data.items;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        items = items.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
      }
      setPosts(items);
      setTotal(data.total);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, filterImpact, filterSymbol, filterSearch]);

  useEffect(() => { fetchPosts(); fetchCounts(); }, [fetchPosts, fetchCounts]);

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
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "#111", color: "#E5E7EB", fontSize: "14px" }}
        />
      </div>

      {/* Posts */}
      {loading ? (
        <div style={{ color: "#6B7280", textAlign: "center", padding: "40px 0" }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#6B7280", textAlign: "center", padding: "40px 0", fontSize: "15px" }}>
          No posts found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {posts.map(post => (
            <div
              key={post.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
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
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", flexShrink: 0, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px" }}
                  >
                    {expandedId === post.id ? "Hide" : "Preview"}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px" }}
                  >
                    Edit
                  </button>
                  {activeTab === "draft" && (
                    <>
                      <button
                        onClick={() => handlePublish(post.id)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#10B981", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                      >
                        Publish ✓
                      </button>
                      <button
                        onClick={() => handleReject(post.id)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#EF4444", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                      >
                        Reject ✗
                      </button>
                    </>
                  )}
                  {activeTab === "published" && (
                    <button
                      onClick={() => handleReject(post.id)}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#EF4444", color: "#fff", cursor: "pointer", fontSize: "13px" }}
                    >
                      Unpublish
                    </button>
                  )}
                  {activeTab === "rejected" && (
                    <button
                      onClick={() => handlePublish(post.id)}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#10B981", color: "#fff", cursor: "pointer", fontSize: "13px" }}
                    >
                      Re-publish
                    </button>
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
          ))}
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

const labelStyle: React.CSSProperties = {
  display: "block", color: "#9CA3AF", fontSize: "13px", fontWeight: 500, marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)", color: "#F9FAFB", fontSize: "14px", outline: "none", boxSizing: "border-box",
};
