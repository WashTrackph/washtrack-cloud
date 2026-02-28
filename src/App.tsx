import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { PinModalOverlay } from "./components/PinModalOverlay";
import { LoginScreen } from "./screens/LoginScreen";
import { MainLayout } from "./screens/MainLayout";
import { SEED_STAFF, SEED_SHOP } from "./data/seeds";
import type { Staff } from "./lib/types";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [pinBuffer, setPinBuffer] = useState("");
  const [pinError, setPinError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [pinModal, setPinModal] = useState<any>(null);
  const [staff] = useState(SEED_STAFF);
  const [shop] = useState(SEED_SHOP);

  const handlePinDigit = (d: string) => {
    const next = pinBuffer + d;
    setPinBuffer(next);
    if (next.length === 4) {
      const found = staff.find((s) => s.active && s.id === selectedStaff?.id && s.pin === next);
      if (found) {
        setCurrentStaff(found);
        setScreen("home");
        setPinBuffer("");
        setPinError("");
      } else {
        setPinError("Incorrect PIN");
        setTimeout(() => { setPinBuffer(""); setPinError(""); }, 800);
      }
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
    <AppProvider currentStaff={currentStaff} onPinModal={setPinModal}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--bg)", minHeight: "100vh", color: "var(--text)", position: "relative" }}>
        {pinModal && (
          <PinModalOverlay
            pinModal={pinModal}
            setPinModal={setPinModal}
            staff={staff}
            shop={shop}
            notify={() => {}}
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
    </AppProvider>
  );
}
