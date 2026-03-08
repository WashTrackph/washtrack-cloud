import { useApp } from "../context/AppContext";
import { getOverstay } from "../lib/utils";
import { HomeScreen } from "./HomeScreen";
import { POSScreen } from "./POSScreen";
import { OrdersScreen } from "./OrdersScreen";
import { InventoryScreen } from "./InventoryScreen";
import { CustomersScreen } from "./CustomersScreen";
import { ReportsScreen } from "./ReportsScreen";
import { SettingsScreen } from "./SettingsScreen";
import { PromoBlastScreen } from "./PromoBlastScreen";

interface MainLayoutProps {
  screen: string;
  setScreen: (s: string) => void;
  handleLogout: () => void;
}

export function MainLayout({ screen, setScreen, handleLogout }: MainLayoutProps) {
  const { currentStaff, orders, inventory } = useApp();
  const activeOrders = orders.filter((o) => !o.voided && o.statusId < 6).length;
  const readyOrders = orders.filter((o) => !o.voided && o.statusId === 5).length;
  const lowStockCount = inventory.filter((i) => i.qty <= i.minQty).length;

  const navItems = [
    { id: "home", icon: "\u229E", label: "Dashboard" },
    { id: "pos", icon: "\uFF0B", label: "New Order" },
    { id: "orders", icon: "\uD83D\uDCCB", label: "Orders", badge: activeOrders || null },
    { id: "inventory", icon: "\uD83D\uDCE6", label: "Inventory", badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: "var(--alert)" },
    { id: "customers", icon: "\uD83D\uDC65", label: "Customers" },
    { id: "reports", icon: "\uD83D\uDCCA", label: "Reports" },
    ...(currentStaff?.role === "OWNER" || currentStaff?.role === "MANAGER" ? [
      { id: "promo", icon: "\uD83D\uDCE2", label: "Promo" },
      { id: "settings", icon: "\u2699", label: "Settings" },
    ] : []),
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <nav style={{ width: 200, background: "var(--sidebar)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 12px" }}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>{"\uD83E\uDEE7"}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", letterSpacing: -0.5 }}>WashTrack</div>
          <div style={{ fontSize: 10, color: "var(--muted-deep)" }}>POS v1.0</div>
        </div>
        <div style={{ flex: 1, padding: "8px 8px" }}>
          {navItems.map((item: any) => (
            <button key={item.id} onClick={() => setScreen(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: screen === item.id ? "color-mix(in srgb, var(--accent) 15%, var(--sidebar))" : "transparent", color: screen === item.id ? "var(--accent)" : "var(--subtext)", cursor: "pointer", fontSize: 13, fontWeight: screen === item.id ? 700 : 500, textAlign: "left", marginBottom: 2, transition: "all 0.15s", position: "relative" }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.badge && <span style={{ marginLeft: "auto", background: item.badgeColor || "var(--danger)", color: "var(--white)", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>{item.badge}</span>}
            </button>
          ))}
        </div>
        {readyOrders > 0 && (
          <div style={{ margin: "0 8px 8px", background: "var(--success-bg-dark)", border: "1px solid var(--success-border)", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 11, color: "var(--success-bright)", fontWeight: 700 }}>{"\u2705"} {readyOrders} READY</div>
            <div style={{ fontSize: 10, color: "var(--success-text)" }}>Waiting for pickup</div>
          </div>
        )}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{currentStaff?.avatar}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{currentStaff?.name}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>{currentStaff?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: "100%", padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border-dark)", background: "transparent", color: "var(--subtext)", cursor: "pointer", fontSize: 12 }}>Sign Out</button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}>
        {screen === "home" && <HomeScreen setScreen={setScreen} />}
        {screen === "pos" && <POSScreen setScreen={setScreen} />}
        {screen === "orders" && <OrdersScreen />}
        {screen === "inventory" && <InventoryScreen />}
        {screen === "customers" && <CustomersScreen />}
        {screen === "reports" && <ReportsScreen />}
        {screen === "promo" && <PromoBlastScreen />}
        {screen === "settings" && <SettingsScreen />}
      </main>
    </div>
  );
}
