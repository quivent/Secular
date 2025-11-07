# Secular GUI - P2P Code Collaboration

Elite glassmorphism GUI for Radicle/Secular. Push and pull code directly with friends.

---

## 🚀 Two Setup Options

### Option 1: Web Version (Simpler, 3 min)

**WSL/Linux:**
```bash
tar -xzf secular-gui-share.tar.gz && cd secular-gui-share
./setup.sh
# Open http://localhost:5288 in browser
```

**Windows PowerShell:**
```powershell
# Extract with 7-Zip, then:
setup.bat
```

---

### Option 2: Desktop App (Better UX, 10 min)

**Builds native Windows/macOS/Linux app**

**Prerequisites:**
- Node.js: https://nodejs.org/
- Rust: https://rustup.rs/

**WSL/Linux:**
```bash
tar -xzf secular-gui-share.tar.gz && cd secular-gui-share
./setup-tauri.sh
# Double-click: src-tauri/target/release/secular-gui.exe
```

**Windows:**
```powershell
setup-tauri.bat
# Double-click: src-tauri\target\release\secular-gui.exe
```

**First build takes 5-10 min (downloads & compiles Rust dependencies)**

---

## 👥 Adding Friends

1. Get your Node ID: `rad node status --only nid`
2. Exchange Node IDs
3. In GUI: **Friends → Add Friend**
4. Name: `theirname`
5. Node ID: `did:key:z6Mk...`
6. Click **Push/Pull** to share code!

---

## 📦 Package Contents

**Size:** 1.4MB compressed

**What downloads during setup:**
- npm dependencies: ~162MB
- Rust dependencies (Tauri only): ~500MB first build

**You send:** 1.4MB
**They download:** Dependencies as needed

---

## 🔒 Security

✅ Command injection protection
✅ Input validation
✅ Localhost only (web version)
✅ Radicle's cryptographic security

See **SECURITY.md** for details.

---

## 📚 Documentation

- **README.md** ← You are here
- **QUICKSTART.md** - Detailed walkthrough
- **SETUP-WINDOWS.md** - Windows-specific help
- **SECURITY.md** - Security assessment
- **ENABLE-P2P-CONNECTIONS.md** - Network setup
- **DESIGN_SYSTEM.md** - Complete design system documentation
- **FIGMA_INTEGRATION.md** - Figma integration guide

---

## 🎯 Features

- **Friends Tab** - Direct P2P push/pull
- **Dashboard** - System overview
- **Scanner** - Secret scanning
- **Monitor** - Cost tracking
- **Deploy** - Cloud deployment
- **Controls Showcase** - Interactive component library

---

## 🎨 Design System

Secular GUI features a comprehensive design system with professional audio mixer aesthetics.

### Quick Access

**In the App:**
- Navigate to **Controls** tab for live component showcase
- Interactive examples of all UI components
- Real-time parameter adjustments
- Copy-paste ready code examples

**Documentation:**
- **Full Guide**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Figma Setup**: [FIGMA_INTEGRATION.md](./FIGMA_INTEGRATION.md)
- **Design Tokens**: [design-tokens.json](./design-tokens.json)

### Key Features

- **Glassmorphism UI**: Layered transparency with depth perception
- **Studio Controls**: Professional knobs, faders, meters, and LEDs
- **Real-time Animations**: Smooth spring physics and transitions
- **Dark Mode First**: Optimized for extended coding sessions
- **Accessible**: ARIA labels, keyboard navigation, screen readers

### Component Library

- **ParameterKnob**: Rotary control with color zones
- **ParameterFader**: Vertical slider with LED indicators
- **MetricMeter**: VU meter with peak hold and sparkline
- **StatusLED**: Binary status with glow effects
- **WaveformGraph**: Real-time data visualization

### Design Tokens

Available in multiple formats:

```bash
# JSON (for Figma/design tools)
design-tokens.json

# CSS Variables
design-tokens.css

# TypeScript (type-safe)
src/design-tokens.ts
```

**Example Usage:**

```tsx
import { designTokens } from './design-tokens';

const buttonStyle = {
  background: designTokens.colors.background.primaryGradient,
  borderRadius: designTokens.components.button.primary.borderRadius,
  boxShadow: designTokens.shadow.glowPrimary,
};
```

---

**Port:** 5288 (web version)
**Built with:** React + TypeScript + Tauri + Radicle + Framer Motion + Tailwind CSS
