import { useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  onAuth: () => void;
}

export function CloudAuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handle = async () => {
    setError("");
    setInfo("");
    if (!email || !password) { setError("Enter your email and password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "register" && password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      if (mode === "register") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setInfo("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth();
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16,
        padding: 40, width: "100%", maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧺</div>
          <h1 style={{ color: "var(--text)", fontSize: 24, fontWeight: 700, margin: 0 }}>WashTrack POS</h1>
          <p style={{ color: "var(--subtext)", fontSize: 14, margin: "6px 0 0" }}>Cloud Sync</p>
        </div>

        <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 600, marginBottom: 20, textAlign: "center" }}>
          {mode === "login" ? "Sign in to your shop" : "Create shop account"}
        </h2>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "10px 14px", color: "#065f46", fontSize: 14, marginBottom: 16 }}>
            {info}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "var(--subtext)", fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="shop@email.com"
            onKeyDown={e => e.key === "Enter" && handle()}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: "var(--text)", fontSize: 15, boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: mode === "register" ? 14 : 24 }}>
          <label style={{ color: "var(--subtext)", fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handle()}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: "var(--text)", fontSize: 15, boxSizing: "border-box",
            }}
          />
        </div>

        {mode === "register" && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "var(--subtext)", fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handle()}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: `1px solid ${confirmPassword && confirmPassword !== password ? "#ef4444" : "var(--border)"}`,
                background: "var(--bg)", color: "var(--text)", fontSize: 15, boxSizing: "border-box",
              }}
            />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>Passwords do not match</p>
            )}
          </div>
        )}

        <button
          onClick={handle}
          disabled={loading}
          style={{
            width: "100%", padding: "12px", borderRadius: 8, border: "none",
            background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <p style={{ textAlign: "center", color: "var(--subtext)", fontSize: 14, marginTop: 20 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setInfo(""); setConfirmPassword(""); }}
            style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
          >
            {mode === "login" ? "Register" : "Sign In"}
          </span>
        </p>

        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 16 }}>
          Each shop needs its own account. Your data is private and syncs across all your devices.
        </p>
      </div>
    </div>
  );
}
