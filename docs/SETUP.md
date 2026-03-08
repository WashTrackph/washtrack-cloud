# WashTrack POS — Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| bun | 1.3+ | `powershell -c "irm bun.sh/install.ps1 \| iex"` |
| Rust | stable (1.93+) | `winget install Rustlang.Rustup` |
| Node.js | 22+ | `winget install OpenJS.NodeJS.LTS` |
| VS C++ Build Tools | 2022 | `winget install Microsoft.VisualStudio.2022.BuildTools` + "Desktop development with C++" workload |
| WebView2 | latest | Pre-installed on Windows 10/11 |

## Android Development (optional)

| Tool | Details |
|------|---------|
| Android SDK | `C:\Users\Andre\AppData\Local\Android\Sdk` |
| NDK | 28.0.13004108 |
| Java | OpenJDK 21 at `C:\Program Files\Android\openjdk\jdk-21.0.8` |
| System Image | `android-36;google_apis_playstore;x86_64` |
| Emulators | `Medium_Phone_API_36.0`, `Pixel_Tablet` |

### Environment Variables

```
ANDROID_HOME=C:\Users\Andre\AppData\Local\Android\Sdk
NDK_HOME=C:\Users\Andre\AppData\Local\Android\Sdk\ndk\28.0.13004108
JAVA_HOME=C:\Program Files\Android\openjdk\jdk-21.0.8
```

### User PATH additions

```
%ANDROID_HOME%\emulator
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\cmdline-tools\latest\bin
```

### Rust Android targets

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### Windows Developer Mode

Required for symlinks during Android builds. Enable via:
- Settings > Update & Security > For Developers > Developer Mode
- Or: `reg add HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock /t REG_DWORD /v AllowDevelopmentWithoutDevLicense /d 1 /f`

## Running

```bash
# Install dependencies
bun install

# Desktop development (Tauri window + Vite HMR)
bun run tauri dev

# Frontend-only in browser (uses localStorage fallback)
bun run dev

# Android development (builds + deploys to emulator/device)
bun run tauri android dev

# Production build
bun run tauri build
```

## Emulator Management

```bash
# List emulators
emulator -list-avds

# Launch tablet emulator
emulator -avd Pixel_Tablet

# Create new AVD
avdmanager create avd -n "Pixel_Tablet" -k "system-images;android-36;google_apis_playstore;x86_64" -d "pixel_tablet"

# Check connected devices
adb devices
```
