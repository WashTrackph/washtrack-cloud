import { useState, useRef, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { LicenseGate } from "./components/LicenseGate";
import { PinModalOverlay } from "./components/PinModalOverlay";
import { LoginScreen } from "./screens/LoginScreen";
import { MainLayout } from "./screens/MainLayout";
import { CloudAuthScreen } from "./screens/CloudAuthScreen";
import { isLegacyPin, verifyPin } from "./lib/crypto";
import { supabase } from "./lib/supabase";

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

function AppInner() {
  const { staff, shop, currentStaff, setCurrentStaff, pinModal, setPinModal, notify, licenseKey, setLicenseKey } = useApp();

  const [screen, setScreen] = useState("login");
  const [pinBuffer, setPinBuffer] = useState("");
  const [pinError, setPinError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const checking = useRef(false);

  const isLocked = lockoutRemaining > 0;

  useEffect(() => {
    if (lockoutEnd <= Date.now()) return;
    const timer = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutRemaining(0);
        setPinError("");
        clearInterval(timer);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [lockoutEnd]);

  const handlePinDigit = (d: string) => {
    if (isLocked) return;
    const next = pinBuffer + d;
    setPinBuffer(next);
    if (next.length === 4 && !checking.current) {
      checking.current = true;
      (async () => {
        const target = staff.find((s) => s.active && s.id === selectedStaff?.id);
        let valid = false;
        if (target) {
          if (isLegacyPin(target.pin)) {
            valid = next === target.pin;
          } else {
            valid = await verifyPin(next, target.pin);
          }
        }
        if (valid && target) {
          setCurrentStaff(target);
          setScreen("home");
          setPinBuffer("");
          setPinError("");
          setLoginAttempts(0);
        } else {
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          if (newAttempts >= MAX_ATTEMPTS) {
            const end = Date.now() + LOCKOUT_SECONDS * 1000;
            setLockoutEnd(end);
            setLockoutRemaining(LOCKOUT_SECONDS);
            setPinError(`Too many attempts. Locked for ${LOCKOUT_SECONDS}s`);
            setPinBuffer("");
            setLoginAttempts(0);
          } else {
            setPinError(`Incorrect PIN (${MAX_ATTEMPTS - newAttempts} attempts left)`);
            setTimeout(() => { setPinBuffer(""); }, 800);
          }
        }
        checking.current = false;
      })();
    }
  };

  const handlePinBackspace = () => !isLocked && setPinBuffer((p) => p.slice(0, -1));
  const handleLogout = () => {
    setCurrentStaff(null);
    setScreen("login");
    setSelectedStaff(null);
    setPinBuffer("");
  };

  return (
    <LicenseGate
      licenseKey={licenseKey}
      onActivate={setLicenseKey}
    >
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--bg)", minHeight: "100vh", color: "var(--text)", position: "relative" }}>
      {pinModal && (
        <PinModalOverlay
          pinModal={pinModal}
          setPinModal={setPinModal}
          staff={staff}
          shop={shop}
          notify={notify}
        />
      )}

      {screen === "login" && (
        <LoginScreen
          staff={staff}
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          pinBuffer={pinBuffer}
          pinError={pinError}
          handlePinDigit={handlePinDigit}
          handlePinBackspace={handlePinBackspace}
          shop={shop}
          lockoutRemaining={lockoutRemaining}
        />
      )}

      {screen !== "login" && currentStaff && (
        <MainLayout
          screen={screen}
          setScreen={setScreen}
          handleLogout={handleLogout}
        />
      )}
    </div>
    </LicenseGate>
  );
}

function CloudAuthGate({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<"checking" | "authed" | "unauthed">("checking");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthState(data.session ? "authed" : "unauthed");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? "authed" : "unauthed");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (authState === "checking") {
    return (
      <div style={{ background: "var(--bg)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spin" style={{ width: 48, height: 48, border: "4px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--subtext)", fontFamily: "monospace" }}>Connecting…</p>
        </div>
      </div>
    );
  }

  if (authState === "unauthed") {
    return <CloudAuthScreen onAuth={() => setAuthState("authed")} />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <CloudAuthGate>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </CloudAuthGate>
  );
}
