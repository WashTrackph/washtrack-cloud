import { useState } from "react";
import { useApp } from "../context/AppContext";
import { THEME_PRESETS } from "../data/seeds";
import type { ThemePreset } from "../lib/types";

const COLOR_FIELDS: { key: keyof ThemePreset; label: string; desc: string }[] = [
  { key: "bg",      label: "Background",         desc: "Main app background" },
  { key: "sidebar", label: "Sidebar",             desc: "Navigation panel" },
  { key: "card",    label: "Card / Panel",        desc: "Content cards and panels" },
  { key: "border",  label: "Borders",             desc: "Dividers and outlines" },
  { key: "accent",  label: "Accent (Primary)",    desc: "Buttons, highlights, KPIs" },
  { key: "accent2", label: "Accent (Secondary)",  desc: "Gradients, badges" },
  { key: "text",    label: "Primary Text",        desc: "Headings and main text" },
  { key: "subtext", label: "Secondary Text",      desc: "Labels and descriptions" },
  { key: "muted",   label: "Muted Text",          desc: "Placeholders and hints" },
];

export function ThemeCustomizer() {
  const { theme, setTheme, notify, addAudit } = useApp();
  const [custom, setCustom] = useState<ThemePreset>({ ...theme });
  const [activePreset, setActivePreset] = useState(theme.id || "dark-ocean");

  const applyPreset = (preset: ThemePreset) => {
    setActivePreset(preset.id);
    setCustom({ ...preset });
    setTheme(preset);
    notify("Theme applied: " + preset.name);
    addAudit("SETTINGS_CHANGED", "Theme changed to " + preset.name);
  };

  const applyCustom = () => {
    const t: ThemePreset = { ...custom, id: "custom", name: "Custom" };
    setTheme(t);
    setActivePreset("custom");
    notify("Custom theme applied!");
    addAudit("SETTINGS_CHANGED", "Custom theme applied");
  };

  const handleColorChange = (key: string, value: string) => {
    const updated: ThemePreset = { ...custom, [key]: value, id: "custom", name: "Custom" };
    setCustom(updated);
    setTheme(updated);
    setActivePreset("custom");
  };

  const handleModeToggle = (mode: "dark" | "light") => {
    const updated: ThemePreset = { ...custom, mode, id: "custom", name: "Custom" };
    setCustom(updated);
    setTheme(updated);
    setActivePreset("custom");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
            {"\uD83C\uDFA8"} Theme Customizer
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            Personalize your POS with colors and styles
          </p>
        </div>
        <div style={{ padding: "6px 14px", borderRadius: 20, background: "var(--card)", border: "1px solid var(--border)", fontSize: 12, color: "var(--subtext)" }}>
          Current:{" "}
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>
            {THEME_PRESETS.find((p) => p.id === activePreset)?.name || "Custom"}
          </span>
        </div>
      </div>

      {/* Preset Palette Grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--subtext)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Preset Themes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {THEME_PRESETS.filter((p) => p.id !== "custom").map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              style={{
                padding: "12px 10px",
                borderRadius: 12,
                border: activePreset === preset.id ? "2px solid var(--accent)" : "2px solid " + preset.border,
                background: preset.bg,
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Mini color swatch strip */}
              <div style={{ display: "flex", gap: 3, marginBottom: 8, justifyContent: "center" }}>
                {[preset.sidebar, preset.card, preset.accent, preset.accent2].map((c, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: "1px solid " + preset.border }} />
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: preset.text, marginBottom: 2 }}>{preset.name}</div>
              <div style={{ fontSize: 10, color: preset.subtext }}>
                {preset.mode === "dark" ? "\uD83C\uDF19 Dark" : "\u2600\uFE0F Light"}
              </div>
              {activePreset === preset.id && (
                <div style={{ position: "absolute", top: 6, right: 8, fontSize: 14 }}>{"\u2713"}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--subtext)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Custom Colors
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>
          Pick any combination of colors. Changes preview live.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {COLOR_FIELDS.map((field) => (
            <label
              key={field.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--card)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: custom[field.key],
                    border: "2px solid var(--border)",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                />
                <input
                  type="color"
                  value={custom[field.key]}
                  onChange={(e) => handleColorChange(field.key, e.target.value)}
                  style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{field.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{field.desc}</div>
                <div style={{ fontSize: 10, color: "var(--subtext)", fontFamily: "monospace", marginTop: 2 }}>
                  {custom[field.key]}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Dark / Light Mode Toggle */}
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Display Mode</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["dark", "light"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeToggle(mode)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: custom.mode === mode ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: custom.mode === mode ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                  color: custom.mode === mode ? "var(--accent)" : "var(--subtext)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: custom.mode === mode ? 700 : 500,
                }}
              >
                {mode === "dark" ? "\uD83C\uDF19 Dark" : "\u2600\uFE0F Light"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={applyCustom}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            color: "var(--white)",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {"\u2713"} Apply Custom Theme
        </button>
      </div>

      {/* Live Preview */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--subtext)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Live Preview
        </div>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          <div
            style={{
              background: "var(--sidebar)",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: 16 }}>{"\uD83E\uDEE7"}</div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>WashTrack</span>
          </div>
          <div style={{ background: "var(--bg)", padding: 14, display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "var(--card)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>REVENUE</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{"\u20B1"}12,500</div>
            </div>
            <div style={{ flex: 1, background: "var(--card)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>ORDERS</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent2)" }}>24</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: "var(--white)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "default",
                }}
              >
                + Order
              </div>
              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontSize: 11,
                  cursor: "default",
                }}
              >
                Reports
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
