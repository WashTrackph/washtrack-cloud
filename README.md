# WashTrack POS

A laundry point-of-sale system built with **Tauri v2**, **React 19**, and **TypeScript**. Designed for Android tablets, developed desktop-first.

## Features

- **Staff login with PIN** — role-based access (Owner, Manager, Staff)
- **Order management** — kanban-style workflow with configurable stages (Received, Washing, Drying, Folding, Ready, Claimed)
- **POS / New Order** — service selection, pricing, add-ons, customer lookup
- **Customer database** — contact info, order history, visit tracking
- **Inventory tracking** — supplies management with low-stock alerts
- **Reports** — revenue, order volume, top services, customer metrics
- **SMS templates** — configurable notifications per workflow stage
- **Settings** — shop info, services CRUD, staff CRUD, workflow config, audit log
- **10 theme presets** — dark/light mode with 30+ auto-derived CSS variables
- **Fully offline** — SQLite storage, locally bundled fonts, no CDN dependencies

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop/Mobile shell | Tauri v2 |
| Frontend | React 19 + TypeScript |
| Build tool | Vite 7 |
| Storage | SQLite via `tauri-plugin-sql` (localStorage fallback in browser) |
| Package manager | bun |
| Font | DM Sans (bundled woff2) |

## Prerequisites

- [bun](https://bun.sh/) (v1.3+)
- [Rust](https://rustup.rs/) (stable)
- Tauri v2 system dependencies — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

For Android builds (not yet configured):
- Android SDK (platform 24+)
- Android NDK

## Getting Started

```bash
# Install dependencies
bun install

# Run in development (Tauri desktop window + Vite HMR)
bun run tauri dev

# Build for production
bun run tauri build

# Frontend-only dev (browser, uses localStorage fallback)
bun run dev
```

## Project Structure

```
src/
  main.tsx              # React entry point
  App.tsx               # Root component with auth routing
  context/
    AppContext.tsx       # State management, 13 persisted keys, fmt() helper
  lib/
    types.ts            # TypeScript interfaces
    utils.ts            # Currency formatting, date helpers, receipt builder, theme engine
    db.ts               # SQLite storage layer + localStorage fallback
  data/
    seeds.ts            # Seed data (services, stages, staff, themes, SMS templates)
  components/
    PinPad.tsx           # PIN entry keypad
    PinModalOverlay.tsx  # PIN auth modal for sensitive actions
    ThemeCustomizer.tsx  # Theme preset grid + custom color pickers
  screens/
    LoginScreen.tsx      # Staff selection + PIN entry
    MainLayout.tsx       # Sidebar navigation + screen routing
    HomeScreen.tsx       # Dashboard with stats and quick actions
    POSScreen.tsx        # New order creation
    OrdersScreen.tsx     # Kanban board for order workflow
    CustomersScreen.tsx  # Customer database
    ReportsScreen.tsx    # Business analytics
    InventoryScreen.tsx  # Supplies management
    SettingsScreen.tsx   # 10-tab settings (shop, theme, services, staff, etc.)
  assets/
    fonts/               # DM Sans woff2 (latin + latin-ext)
  styles/
    global.css           # CSS variables, base styles, utility classes

src-tauri/
  tauri.conf.json        # Tauri config (SQL plugin, window settings)
  Cargo.toml             # Rust dependencies
  capabilities/
    default.json         # SQL + shell permissions
  src/
    lib.rs               # Plugin registration (sql, shell, log)
    main.rs              # App entry point
```

## Configuration

All business configuration is seed-driven — no hardcoded values in screen files:

- **Currency/locale** — set via `shop.currency` and `shop.locale` in seed data
- **Services & pricing** — defined in `seeds.ts`, editable in Settings
- **Workflow stages** — configurable order pipeline
- **Themes** — 10 built-in presets, or create custom themes with 9 color fields + dark/light mode
- **Overstay thresholds** — configurable warning/alert/critical hours

## License

Private — all rights reserved.
