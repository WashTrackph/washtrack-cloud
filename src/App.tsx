import { useState, useRef } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { PinModalOverlay } from "./components/PinModalOverlay";
import { LoginScreen } from "./screens/LoginScreen";
import { MainLayout } from "./screens/MainLayout";
import { isLegacyPin, verifyPin } from "./lib/crypto";

function AppInner() {
  const { staff, shop, currentStaff, setCurrentStaff, pinModal, setPinModal, notify } = useApp();

  const [screen, setScreen] = useState("login");
  const [pinBuffer, setPinBuffer] = useState("");
  const [pinError, setPinError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const checking = useRef(false);

  const handlePinDigit = (d: string) => {
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
        } else {
          setPinError("Incorrect PIN");
          setTimeout(() => { setPinBuffer(""); setPinError(""); }, 800);
        }
        checking.current = false;
      })();
    }
  };

  const handlePinBackspace = () => setPinBuffer((p) => p.slice(0, -1));
  const handleLogout = () => {
    setCurrentStaff(null);
    setScreen("login");
    setSelectedStaff(null);
    setPinBuffer("");
  };

  return (
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
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
