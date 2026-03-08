import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import type { Customer, Promotion } from "../lib/types";

type FilterMode = "all" | "inactive30" | "loyal" | "search";

export function PromoBlastScreen() {
  const {
    shop, customers, smsTemplates, currentStaff, promotions, setPromotions,
    sendSms, notify, genId, addAudit,
  } = useApp();

  const [promoName, setPromoName] = useState("");
  const [message, setMessage] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null);

  // Eligible = has phone + promoOptIn
  const eligibleCustomers = useMemo(() =>
    customers.filter((c) => c.promoOptIn && c.phone.trim()),
  [customers]);

  const now = Date.now();
  const DAY_MS = 86400000;

  const filteredCustomers = useMemo(() => {
    let list: Customer[];
    switch (filterMode) {
      case "inactive30":
        list = eligibleCustomers.filter((c) => now - c.lastVisit >= 30 * DAY_MS);
        break;
      case "loyal": {
        const sorted = [...eligibleCustomers].sort((a, b) => b.visits - a.visits);
        const top25 = Math.max(1, Math.ceil(sorted.length * 0.25));
        list = sorted.slice(0, top25);
        break;
      }
      case "search":
        list = eligibleCustomers.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
        );
        break;
      default:
        list = eligibleCustomers;
    }
    return list;
  }, [filterMode, eligibleCustomers, searchQuery, now]);

  // Also show opted-out customers (greyed, not selectable)
  const optedOutCustomers = useMemo(() =>
    customers.filter((c) => !c.promoOptIn && c.phone.trim()),
  [customers]);

  const allDisplayed = [...filteredCustomers, ...optedOutCustomers];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredCustomers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredCustomers.map((c) => c.id)));
    }
  };

  // Live preview
  const previewCustomer = filteredCustomers.find((c) => selected.has(c.id)) || filteredCustomers[0];
  const previewText = useMemo(() => {
    if (!message || !previewCustomer) return "";
    let t = smsTemplates.promo;
    const vars: Record<string, string> = {
      name: previewCustomer.name,
      shop: shop.name,
      address: shop.address,
      message,
    };
    Object.entries(vars).forEach(([k, v]) => { t = t.replaceAll(`{${k}}`, v); });
    return t;
  }, [message, previewCustomer, smsTemplates.promo, shop.name, shop.address]);

  const daysAgo = (ts: number) => {
    const d = Math.floor((now - ts) / DAY_MS);
    return d === 0 ? "Today" : d === 1 ? "1 day ago" : `${d} days ago`;
  };

  const isMock = shop.smsMockMode || !shop.smsApiKey;

  const handleSend = async () => {
    if (!message.trim() || selected.size === 0) return;
    const selectedList = customers.filter((c) => selected.has(c.id));
    const count = selectedList.length;
    const modeLabel = isMock ? "(MOCK MODE - no real SMS)" : `(${count} real SMS will be sent)`;

    if (!confirm(`Send promo to ${count} customers? ${modeLabel}`)) return;

    setSending(true);
    const promoId = genId();
    const name = promoName.trim() || `Promo ${new Date().toLocaleDateString()}`;
    let sentCount = 0;
    let mockCount = 0;
    let skippedCount = 0;
    const recipientIds: string[] = [];

    for (const cust of selectedList) {
      if (!cust.promoOptIn) {
        skippedCount++;
        continue;
      }

      try {
        // If not mock and has API key, send real SMS via Tauri
        if (!isMock && (window as any).__TAURI_INTERNALS__) {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("send_sms", {
            payload: {
              api_key: shop.smsApiKey,
              number: cust.phone.trim(),
              message: smsTemplates.promo
                .replaceAll("{name}", cust.name)
                .replaceAll("{shop}", shop.name)
                .replaceAll("{address}", shop.address)
                .replaceAll("{message}", message),
              sender_name: shop.smsSenderName || null,
            },
          });
        }

        // Log the SMS
        sendSms(
          cust.phone,
          smsTemplates.promo,
          { name: cust.name, shop: shop.name, address: shop.address, message },
          null,
          promoId
        );
        recipientIds.push(cust.id);
        if (isMock) mockCount++;
        else sentCount++;
      } catch {
        skippedCount++;
      }
    }

    const promo: Promotion = {
      id: promoId,
      name,
      message,
      recipientIds,
      sentCount,
      mockCount,
      skippedCount,
      filter: filterMode,
      createdAt: Date.now(),
      createdBy: currentStaff?.name || "Unknown",
    };
    setPromotions((prev) => [promo, ...prev]);
    addAudit("PROMO_BLAST", `Sent "${name}" to ${recipientIds.length} customers`);

    const parts = [];
    if (sentCount > 0) parts.push(`${sentCount} sent`);
    if (mockCount > 0) parts.push(`${mockCount} mock`);
    if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
    notify(`Promo blast complete: ${parts.join(", ")}`, "success");

    setSelected(new Set());
    setMessage("");
    setPromoName("");
    setSending(false);
  };

  const FILTER_BUTTONS: { id: FilterMode; label: string }[] = [
    { id: "all", label: "All Opted-In" },
    { id: "inactive30", label: "Inactive 30+ Days" },
    { id: "loyal", label: "Loyal (Top 25%)" },
    { id: "search", label: "Search" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
        Promo Blast
      </h2>

      {/* Campaign Builder */}
      <div style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Campaign Builder</div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--subtext)", marginBottom: 4, display: "block" }}>Promo Name</label>
        <input
          value={promoName}
          onChange={(e) => setPromoName(e.target.value)}
          placeholder={`Promo ${new Date().toLocaleDateString()}`}
          className="input"
          style={{ marginBottom: 12 }}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--subtext)", marginBottom: 4, display: "block" }}>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your promo message..."
          className="input"
          rows={3}
          style={{ marginBottom: 4, resize: "vertical" }}
        />
        <div style={{ fontSize: 11, color: message.length > 140 ? "var(--warning)" : "var(--muted)", marginBottom: 12, textAlign: "right" }}>
          {message.length} chars
        </div>

        {previewText && (
          <div style={{ padding: 10, borderRadius: 8, background: "var(--bg)", border: "1px dashed var(--border)", fontSize: 12, color: "var(--subtext)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>PREVIEW</div>
            {previewText}
          </div>
        )}
      </div>

      {/* Customer Selection */}
      <div style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Select Recipients</div>
          <div style={{ fontSize: 12, color: "var(--subtext)", fontWeight: 600 }}>
            {selected.size} of {filteredCustomers.length} selected
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {FILTER_BUTTONS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilterMode(f.id); setSelected(new Set()); }}
              style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: filterMode === f.id ? "var(--accent)" : "var(--bg)",
                color: filterMode === f.id ? "#fff" : "var(--text)",
                border: `1px solid ${filterMode === f.id ? "transparent" : "var(--border)"}`,
              }}
            >{f.label}</button>
          ))}
        </div>

        {filterMode === "search" && (
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="input"
            style={{ marginBottom: 12 }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            onClick={toggleAll}
            style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)",
            }}
          >{selected.size === filteredCustomers.length && filteredCustomers.length > 0 ? "Deselect All" : "Select All"}</button>
        </div>

        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {allDisplayed.map((c) => {
            const isOptedOut = !c.promoOptIn;
            const isEligible = filteredCustomers.some((fc) => fc.id === c.id);
            const isSelected = selected.has(c.id);

            return (
              <div
                key={c.id}
                onClick={() => { if (!isOptedOut && isEligible) toggleSelect(c.id); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: 8, marginBottom: 4, cursor: isOptedOut ? "default" : "pointer",
                  background: isSelected ? "color-mix(in srgb, var(--accent) 10%, var(--card))" : "transparent",
                  opacity: isOptedOut ? 0.4 : 1,
                  border: `1px solid ${isSelected ? "var(--accent)" : "transparent"}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isOptedOut || !isEligible}
                  onChange={() => { if (!isOptedOut && isEligible) toggleSelect(c.id); }}
                  style={{ accentColor: "var(--accent)" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    {c.name}
                    {isOptedOut && <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 8, fontWeight: 400 }}>Opted out</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.phone}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--subtext)" }}>{c.visits} visits</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{daysAgo(c.lastVisit)}</div>
                </div>
              </div>
            );
          })}
          {allDisplayed.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              No customers match this filter
            </div>
          )}
        </div>
      </div>

      {/* Send Section */}
      <div style={{ padding: 16, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
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
        <button
          onClick={handleSend}
          disabled={!message.trim() || selected.size === 0 || sending}
          style={{
            width: "100%", padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: !message.trim() || selected.size === 0 ? "var(--border)" : "var(--accent)",
            color: !message.trim() || selected.size === 0 ? "var(--muted)" : "#fff",
            border: "none", cursor: !message.trim() || selected.size === 0 ? "default" : "pointer",
            opacity: sending ? 0.6 : 1,
          }}
        >{sending ? "Sending..." : `Send Promo to ${selected.size} Customer${selected.size !== 1 ? "s" : ""}`}</button>
      </div>

      {/* Campaign History */}
      <div style={{ borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          style={{
            width: "100%", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "transparent", border: "none", cursor: "pointer", color: "var(--text)",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700 }}>Campaign History ({promotions.length})</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{historyOpen ? "\u25B2" : "\u25BC"}</span>
        </button>

        {historyOpen && (
          <div style={{ padding: "0 16px 16px" }}>
            {promotions.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13, padding: 8 }}>No campaigns yet</div>
            ) : (
              promotions.map((p) => (
                <div key={p.id} style={{ padding: 10, borderRadius: 8, marginBottom: 6, background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div
                    onClick={() => setExpandedPromo(expandedPromo === p.id ? null : p.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--subtext)", marginBottom: 4 }}>
                      &quot;{p.message.length > 60 ? p.message.slice(0, 60) + "..." : p.message}&quot;
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
                      {p.sentCount > 0 && <span style={{ color: "var(--success)" }}>{p.sentCount} sent</span>}
                      {p.mockCount > 0 && <span style={{ color: "var(--warning)" }}>{p.mockCount} mock</span>}
                      {p.skippedCount > 0 && <span>{p.skippedCount} skipped</span>}
                      <span>by {p.createdBy}</span>
                    </div>
                  </div>
                  {expandedPromo === p.id && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--subtext)", marginBottom: 4 }}>Recipients:</div>
                      {p.recipientIds.map((rid) => {
                        const c = customers.find((cu) => cu.id === rid);
                        return c ? (
                          <div key={rid} style={{ fontSize: 12, color: "var(--muted)", padding: "2px 0" }}>
                            {c.name} ({c.phone})
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
