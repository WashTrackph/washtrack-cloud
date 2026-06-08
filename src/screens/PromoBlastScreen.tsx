import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import type { Customer, Promotion } from "../lib/types";

type FilterMode = "all" | "inactive30" | "loyal" | "search";
type View = "dashboard" | "builder" | "detail";

export function PromoBlastScreen() {
  const {
    shop, customers, smsTemplates, currentStaff, promotions, setPromotions,
    sendSms, notify, genId, addAudit,
  } = useApp();

  const [view, setView] = useState<View>("dashboard");
  const [detailId, setDetailId] = useState<string | null>(null);

  // Builder state
  const [promoName, setPromoName] = useState("");
  const [message, setMessage] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const now = Date.now();
  const DAY_MS = 86400000;
  const isMock = shop.smsMockMode || !shop.smsApiKey;

  const totalSent = promotions.reduce((s, p) => s + p.sentCount, 0);
  const totalMock = promotions.reduce((s, p) => s + p.mockCount, 0);
  const totalRecipients = promotions.reduce((s, p) => s + p.recipientIds.length, 0);

  // Eligible = has phone + promoOptIn
  const eligibleCustomers = useMemo(() =>
    customers.filter((c) => c.promoOptIn && c.phone.trim()),
  [customers]);

  const filteredCustomers = useMemo(() => {
    switch (filterMode) {
      case "inactive30":
        return eligibleCustomers.filter((c) => now - c.lastVisit >= 30 * DAY_MS);
      case "loyal": {
        const sorted = [...eligibleCustomers].sort((a, b) => b.visits - a.visits);
        return sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.25)));
      }
      case "search":
        return eligibleCustomers.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
        );
      default:
        return eligibleCustomers;
    }
  }, [filterMode, eligibleCustomers, searchQuery, now]);

  const optedOutCustomers = useMemo(() =>
    customers.filter((c) => !c.promoOptIn && c.phone.trim()),
  [customers]);

  const allDisplayed = [...filteredCustomers, ...optedOutCustomers];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredCustomers.length) setSelected(new Set());
    else setSelected(new Set(filteredCustomers.map((c) => c.id)));
  };

  const previewCustomer = filteredCustomers.find((c) => selected.has(c.id)) || filteredCustomers[0];
  const previewText = useMemo(() => {
    if (!message || !previewCustomer) return "";
    let t = smsTemplates.promo;
    const vars: Record<string, string> = { name: previewCustomer.name, shop: shop.name, address: shop.address, message };
    Object.entries(vars).forEach(([k, v]) => { t = t.replaceAll(`{${k}}`, v); });
    return t;
  }, [message, previewCustomer, smsTemplates.promo, shop.name, shop.address]);

  const daysAgo = (ts: number) => {
    const d = Math.floor((now - ts) / DAY_MS);
    return d === 0 ? "Today" : d === 1 ? "1d ago" : `${d}d ago`;
  };

  const openBuilder = () => {
    setPromoName(""); setMessage(""); setFilterMode("all"); setSearchQuery(""); setSelected(new Set());
    setView("builder");
  };

  const openDetail = (id: string) => { setDetailId(id); setView("detail"); };

  const handleSend = async () => {
    if (!message.trim() || selected.size === 0) return;
    const selectedList = customers.filter((c) => selected.has(c.id));
    const count = selectedList.length;
    const modeLabel = isMock ? "(MOCK MODE - no real SMS)" : `(${count} real SMS will be sent)`;
    if (!confirm(`Send promo to ${count} customers? ${modeLabel}`)) return;

    setSending(true);
    const promoId = genId();
    const name = promoName.trim() || `Promo ${new Date().toLocaleDateString()}`;
    let sentCount = 0, mockCount = 0, skippedCount = 0;
    const recipientIds: string[] = [];

    for (const cust of selectedList) {
      if (!cust.promoOptIn || !cust.phone) { skippedCount++; continue; }
      try {
        const result = await sendSms(cust.phone, smsTemplates.promo, { name: cust.name, shop: shop.name, address: shop.address, message }, null, promoId);
        if (result.status === "FAILED") { skippedCount++; continue; }
        recipientIds.push(cust.id);
        if (result.status === "MOCK") mockCount++; else sentCount++;
      } catch { skippedCount++; }
    }

    const promo: Promotion = { id: promoId, name, message, recipientIds, sentCount, mockCount, skippedCount, filter: filterMode, createdAt: Date.now(), createdBy: currentStaff?.name || "Unknown" };
    setPromotions((prev) => [promo, ...prev]);
    addAudit("PROMO_BLAST", `Sent "${name}" to ${recipientIds.length} customers`);

    const parts = [];
    if (sentCount > 0) parts.push(`${sentCount} sent`);
    if (mockCount > 0) parts.push(`${mockCount} mock`);
    if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
    notify(`Promo blast complete: ${parts.join(", ")}`, "success");
    setSending(false);
    setView("dashboard");
  };

  // ── DETAIL VIEW ──
  if (view === "detail" && detailId) {
    const promo = promotions.find((p) => p.id === detailId);
    if (!promo) { setView("dashboard"); return null; }
    const recipients = promo.recipientIds.map((rid) => customers.find((c) => c.id === rid)).filter(Boolean) as Customer[];

    return (
      <div style={{ padding: 24, maxWidth: 700 }}>
        <button onClick={() => setView("dashboard")} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>{"\u2190"} Back</button>
        <div className="card">
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>{"📢"}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{promo.name}</h2>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>by {promo.createdBy} &middot; {new Date(promo.createdAt).toLocaleDateString()} &middot; Filter: {promo.filter === "all" ? "All Opted-In" : promo.filter === "inactive30" ? "Inactive 30+ Days" : promo.filter === "loyal" ? "Loyal (Top 25%)" : promo.filter || "Custom"}</div>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Sent", value: promo.sentCount, color: "var(--success)" },
              { label: "Mock", value: promo.mockCount, color: "var(--warning)" },
              { label: "Skipped", value: promo.skippedCount, color: "var(--muted)" },
            ].map((s, i) => (
              <div key={i} style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Message */}
          <div style={{ padding: 12, borderRadius: 8, background: "var(--bg)", border: "1px dashed var(--border)", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>MESSAGE</div>
            <div style={{ fontSize: 13, color: "var(--text)" }}>{promo.message}</div>
          </div>

          {/* Recipients as cards */}
          <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "var(--subtext)" }}>Recipients ({recipients.length})</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {recipients.map((c) => (
              <div key={c.id} style={{ padding: 12, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{c.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.phone}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── BUILDER VIEW ──
  if (view === "builder") {
    const FILTER_BUTTONS: { id: FilterMode; label: string }[] = [
      { id: "all", label: "All Opted-In" },
      { id: "inactive30", label: "Inactive 30+ Days" },
      { id: "loyal", label: "Loyal (Top 25%)" },
      { id: "search", label: "Search" },
    ];

    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => setView("dashboard")} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>{"\u2190"} Back</button>
        <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "var(--text)" }}>New Campaign</h2>

        {/* Name + Message + Preview */}
        <div className="card" style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--subtext)", marginBottom: 4, display: "block" }}>Campaign Name</label>
          <input
            value={promoName} onChange={(e) => setPromoName(e.target.value)}
            placeholder={`Promo ${new Date().toLocaleDateString()}`}
            className="input" style={{ marginBottom: 12 }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--subtext)", marginBottom: 4, display: "block" }}>Promo Message</label>
          <textarea
            value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your promo message..."
            className="input" rows={3} style={{ marginBottom: 4, resize: "vertical" }}
          />
          <div style={{ fontSize: 11, color: message.length > 140 ? "var(--warning)" : "var(--muted)", marginBottom: 12, textAlign: "right" }}>
            {message.length} chars
          </div>

          {previewText && (
            <div style={{ padding: 12, borderRadius: 8, background: "var(--bg)", border: "1px dashed var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>SMS PREVIEW</div>
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{previewText}</div>
            </div>
          )}
        </div>

        {/* Filter bar + selection count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTER_BUTTONS.map((f) => (
              <button key={f.id} onClick={() => { setFilterMode(f.id); setSelected(new Set()); }}
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: filterMode === f.id ? "var(--accent)" : "var(--card)",
                  color: filterMode === f.id ? "#fff" : "var(--text)",
                  border: `1px solid ${filterMode === f.id ? "transparent" : "var(--border)"}`,
                }}
              >{f.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--subtext)", fontWeight: 600 }}>{selected.size} of {filteredCustomers.length} selected</span>
            <button onClick={toggleAll}
              style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)" }}
            >{selected.size === filteredCustomers.length && filteredCustomers.length > 0 ? "Deselect All" : "Select All"}</button>
          </div>
        </div>

        {filterMode === "search" && (
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or phone..." className="input" style={{ marginBottom: 12 }} />
        )}

        {/* Customer card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>
          {allDisplayed.map((c) => {
            const isOptedOut = !c.promoOptIn;
            const isEligible = filteredCustomers.some((fc) => fc.id === c.id);
            const isSelected = selected.has(c.id);
            const daysSince = c.lastVisit ? Math.floor((now - c.lastVisit) / DAY_MS) : 999;

            return (
              <div key={c.id}
                onClick={() => { if (!isOptedOut && isEligible) toggleSelect(c.id); }}
                style={{
                  padding: 16, borderRadius: 10, background: "var(--card)", cursor: isOptedOut ? "default" : "pointer",
                  border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                  opacity: isOptedOut ? 0.4 : 1,
                  boxShadow: isSelected ? "0 0 0 1px var(--accent)" : "none",
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: isSelected ? "var(--accent)" : "linear-gradient(135deg, var(--accent), var(--accent2))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isSelected ? 16 : 16, fontWeight: 800, color: "#fff",
                    }}>{isSelected ? "\u2713" : c.name[0]}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                      {c.name}
                      {isOptedOut && <span style={{ fontSize: 10, color: "var(--danger)", marginLeft: 6, fontWeight: 500 }}>Opted out</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.phone}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{c.visits} visits</span>
                  <span style={{
                    fontSize: 12, marginLeft: "auto",
                    color: daysSince < 7 ? "var(--success)" : daysSince < 30 ? "var(--warning)" : "var(--danger)",
                  }}>{daysAgo(c.lastVisit)}</span>
                </div>
              </div>
            );
          })}
          {allDisplayed.length === 0 && (
            <div style={{ gridColumn: "1/-1", padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              No customers match this filter
            </div>
          )}
        </div>

        {/* Send bar */}
        <div className="card" style={{ position: "sticky", bottom: 16 }}>
          {!isMock && selected.size > 0 && (
            <div style={{ fontSize: 12, color: "var(--warning)", marginBottom: 8, fontWeight: 600 }}>
              This will send {selected.size} real SMS (uses credits)
            </div>
          )}
          {isMock && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              Mock mode — no SMS will actually be sent
            </div>
          )}
          <button onClick={handleSend} disabled={!message.trim() || selected.size === 0 || sending}
            style={{
              width: "100%", padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 700,
              background: !message.trim() || selected.size === 0 ? "var(--border)" : "var(--accent)",
              color: !message.trim() || selected.size === 0 ? "var(--muted)" : "#fff",
              border: "none", cursor: !message.trim() || selected.size === 0 ? "default" : "pointer",
              opacity: sending ? 0.6 : 1,
            }}
          >{sending ? "Sending..." : `Send Promo to ${selected.size} Customer${selected.size !== 1 ? "s" : ""}`}</button>
        </div>
      </div>
    );
  }

  // ── DASHBOARD VIEW ──
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text)" }}>Promo Blast</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>Send promotional SMS campaigns to your customers</p>
        </div>
        <button onClick={openBuilder} className="action-btn primary" style={{ padding: "10px 20px", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{"\uFF0B"}</span>
          <span style={{ fontWeight: 700 }}>New Campaign</span>
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Campaigns", value: promotions.length, color: "var(--accent)", icon: "📢" },
          { label: "SMS Sent", value: totalSent, color: "var(--success)", icon: "\u2713" },
          { label: "Mock Sent", value: totalMock, color: "var(--warning)", icon: "🧪" },
          { label: "Total Recipients", value: totalRecipients, color: "var(--accent2-light)", icon: "👥" },
        ].map((k, i) => (
          <div key={i} className="card" style={{ borderLeft: `3px solid ${k.color}`, background: "var(--card)", borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
              <div style={{ fontSize: 24 }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign cards grid */}
      {promotions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{"📢"}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>No campaigns yet</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Create your first promo blast to reach your customers</div>
          <button onClick={openBuilder} style={{ padding: "8px 20px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Create Campaign</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {promotions.map((p) => {
            const daysSince = Math.floor((now - p.createdAt) / DAY_MS);
            return (
              <div key={p.id} onClick={() => openDetail(p.id)}
                style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{"📢"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.message.length > 50 ? p.message.slice(0, 50) + "..." : p.message}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  {p.sentCount > 0 && <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 700 }}>{p.sentCount} sent</span>}
                  {p.mockCount > 0 && <span style={{ fontSize: 12, color: "var(--warning)", fontWeight: 700 }}>{p.mockCount} mock</span>}
                  <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{p.recipientIds.length} recipients</span>
                  <span style={{ fontSize: 12, color: daysSince === 0 ? "var(--success)" : "var(--muted)", marginLeft: "auto" }}>
                    {daysSince === 0 ? "Today" : daysSince === 1 ? "1d ago" : `${daysSince}d ago`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
