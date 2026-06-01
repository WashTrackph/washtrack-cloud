import { useState, useRef, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { LicenseGate } from "./components/LicenseGate";
import { PinModalOverlay } from "./components/PinModalOverlay";
import { LoginScreen } from "./screens/LoginScreen";
import { MainLayout } from "./screens/MainLayout";
import { isLegacyPin, verifyPin } from "./lib/crypto";

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

function AppInner() {
  const { staff, shop, currentStaff, setCurrentStaff, pinModal, setPinModal, notify, sendReportEmail, emailConfig, licenseKey, setLicenseKey, trialStartDate, setTrialStartDate } = useApp();

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
    // Send end-of-shift report if enabled (fire-and-forget, don't block logout)
    if (shop.autoEmailEndOfShift && emailConfig.enabled && emailConfig.testVerified) {
      sendReportEmail("today").catch(() => {});
    }
    setCurrentStaff(null);
    setScreen("login");
    setSelectedStaff(null);
    setPinBuffer("");
  };

  return (
    <LicenseGate
      licenseKey={licenseKey}
      trialStartDate={trialStartDate}
      onActivate={setLicenseKey}
      onTrialStart={setTrialStartDate}
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

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
