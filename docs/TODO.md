# WashTrack POS — TODO

## Thermal Receipt Printing
- [ ] ESC/POS command builder (text alignment, bold, font size, paper cut, 58mm/80mm support)
- [ ] Rust Tauri command for TCP socket printing (network printers, port 9100)
- [ ] Printer settings UI in Settings screen (type, IP, port, paper width)
- [ ] Keep HTML system print as fallback
- [ ] Bluetooth printer support (deferred until hardware available)

## Missing Features from Original v6
- [ ] Email report scheduler (auto-email at shift end)
- [ ] Promo Blast (bulk SMS to customers)
- [ ] Customer at-risk detection (no visit in X days)
- [ ] Aging colors on kanban order cards (time-based color coding)
- [ ] Payment info in order detail view
- [ ] Overstay badges on order cards
- [ ] Daily revenue trend chart
- [ ] Payment method breakdown chart
- [ ] Busiest day chart
- [ ] Weekly performance chart
- [ ] Repeat rate KPI

## Android
- [x] Install NDK
- [x] Add Rust Android targets
- [x] Run `tauri android init`
- [x] Create Pixel Tablet emulator AVD
- [x] Accept SDK licenses
- [x] Enable Windows Developer Mode (symlinks)
- [ ] Successful `tauri android dev` deploy to emulator
- [ ] Test full flow on tablet emulator
- [ ] Fix payment screen white screen bug

## Bugs
- [ ] White screen when navigating to payment step in POS (likely `shop.cashDenominations.map()` crash if field missing from persisted data)

## Completed
- [x] Project scaffolding (Tauri v2 + React + Vite + TypeScript)
- [x] Rust backend (tauri-plugin-sql + tauri-plugin-shell)
- [x] Full type system + seed data
- [x] SQLite storage layer + localStorage fallback
- [x] AppContext (13 persisted state keys)
- [x] All 9 screen components
- [x] 10 theme presets + dark/light mode (30+ CSS variables)
- [x] Currency hardcoding eliminated (45+ instances)
- [x] Hex color hardcoding eliminated (222 instances)
- [x] DM Sans font bundled locally (offline)
- [x] .gitignore + README
