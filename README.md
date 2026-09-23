# Glow Comments ⚡ // Cognitive Verification HUD

> **The visual verification HUD for AI-generated code, live diagnostics glow, and dual-spectrum semantic annotations for VS Code and Cursor.**

Eliminate **AI Code Blindness** and lower the **Cognitive Verification Tax**. When coding agents (Claude Code, Gemini CLI, Cursor Agent) generate hundreds of lines of boilerplate, **Glow Comments** isolates critical assumptions, compiler warnings, and security boundaries with radiant contrast.

![Glow Comments Audit Lens](https://raw.githubusercontent.com/shikharthakur2404/glow-comments/main/assets/audit-lens-hud.jpg)

---

## ✨ Core Superpowers

### 1. 🔍 The Risk Audit Lens (`Cmd + K, Cmd + G` / `Ctrl + Alt + G`)
- **Negative Space Verification:** Instantly dims 98% of safe boilerplate down to **22% opacity**.
- **Radiant Isolation:** Active compiler/linter diagnostics and critical tags (`!`, `FIXME`, `HACK`, `TODO`) remain at **100% full radiance**.
- **Status Bar HUD:** Real-time indicator displaying `$(eye) Audit Lens: ON (N flagged)`.

### 2. 🌗 Dual-Spectrum Chroma Engine (Light & Dark Immunity)
- **Dark Mode:** High-luminosity neon plasma emitters (`#00F0FF`, `#00FFA3`, `#FFE600`, `#FF1744`).
- **Light Mode:** Deep jewel-ink pigments (`#00695C` Teal, `#1B5E20` Emerald, `#B26A00` Ochre, `#B71C1C` Crimson). Meets **WCAG AAA** ($\ge 4.5:1$ contrast ratio on white backgrounds).
- **Zero Washout:** Seamlessly adapts via native VS Code decoration GPU layers with zero CPU penalty.

![Dual-Spectrum Comparison](https://raw.githubusercontent.com/shikharthakur2404/glow-comments/main/assets/dual-spectrum.jpg)

### 3. 🤖 AI Agent Verification Protocol (Claude Code, Cursor, Gemini CLI)
- **File-as-IPC:** Teach your AI agents to use Glow Comments syntax during autonomous refactoring.
- **One-Click Setup:** Run `Glow Comments: Initialize AI Agent Rules` to automatically inject the verification protocol into `.cursorrules`, `CLAUDE.md`, or `AGENTS.md`.

### 4. ⚡ Diagnostics-as-Glow Engine
- Listens to language server diagnostics (`vscode.languages.onDidChangeDiagnostics`) in real-time.
- Illuminates TypeScript, ESLint, and security errors in **Radiant Crimson (`#FF1744`)** and warnings in **Toxic Amber (`#FFA600`)**.
- Built with **80ms debouncing** and **diagnostic fingerprint diffing** to eliminate keystroke re-render flicker.

---

## ⚡ Quickstart: How to Use (in 60 Seconds)

1. **Tag Critical Lines:** Prefix any comment with `// !`, `// TODO:`, `// FIXME:`, or custom hex `// [#cyan]`.
2. **Engage the Audit Lens:** Press **`Cmd + K, Cmd + G`** (`Ctrl + Alt + G` on Windows/Linux).
   - Safe code dims to **22% opacity**.
   - Your risk tags and compiler errors blaze at **100% full radiance**.
3. **Check the Status Bar:** The bottom-right HUD displays `$(eye) Audit Lens: ON (N flagged)`. Click it anytime to toggle.
4. **Switch Themes Freely:** Works on dark cyberpunk themes and crisp light themes with zero washout.

---

## 🤖 How to Tell Your AI (Claude Code, Cursor, Gemini CLI)

Make your coding agents flag their own assumptions automatically. No plugins or API keys required—your code buffer is the communication bus.

### Option 1: One-Click Auto-Setup
1. Press `Cmd + Shift + P` (or `Ctrl + Shift + P`).
2. Run **`Glow Comments: Initialize AI Agent Rules`**.
3. Select your target (`.cursorrules`, `CLAUDE.md`, or `AGENTS.md`).

---

### Option 2: Copy-Paste Directive (For any Agent or Prompt)

Paste this into your project's `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, or directly into your terminal prompt:

```markdown
### Visual Verification Protocol (Glow Comments)
When writing, refactoring, or reviewing code, use Glow Comments visual annotations so the human reviewer's Audit Lens (\`Cmd+K Cmd+G\` / \`Ctrl+Alt+G\`) instantly surfaces critical logic:
- \`// ! [critical assumption]\` -> High-risk boundaries, auth flows, unverified inputs, data mutations.
- \`// FIXME: [stub/debt]\` -> Mock implementations, temporary stubs, or performance bottlenecks.
- \`// TODO: [human task]\` -> Required human review, missing API credentials, rate limits, env configs.
- \`// ? [clarification]\` -> Ambiguous requirements, unverified external API contracts, design tradeoffs.
- \`// NOTE: [architecture]\` -> Core subsystem invariants and architectural boundaries.
```

---

## 🚀 Syntax Cheat Sheet

### 1. High-Contrast Semantic Tags
```typescript
// ! Security alert / critical boundary (Crimson Red Aura)
// TODO: Implement rate limiting & caching (Neon Amber Gold)
// FIXME: Temporary mock implementation / stub (Urgent Orange)
// ? Architectural unknown / unverified API contract (Cyber Blue)
// * Core performance optimization (Emerald Neon)
// HACK: Upstream library workaround (Deep Purple)
// NOTE: Subsystem invariant & architectural note (Teal/Cyan)
// // Deprecated function stub (Dimmed Strikethrough)
```

### 2. Smart Colon Guard (Zero False Positives)
Write naturally without worrying about strict casing. Glow Comments recognizes canonical tags in any case when followed by a delimiter, while keeping casual prose completely quiet:

| Comment Syntax | HUD Status | Rationale |
|---|---|---|
| `// TODO: verify auth token` | ✅ **Radiant Glow** | Canonical uppercase task |
| `// Todo: fix memory leak` | ✅ **Radiant Glow** | Natural mixed-case task |
| `// todo: check cache ttl` | ✅ **Radiant Glow** | Casual lowercase task |
| `// TodoList component handles state` | ❌ **Quiet (Zero Glow)** | Class/variable mention (no colon) |
| `// Todo item model definition` | ❌ **Quiet (Zero Glow)** | Conversational English (no colon) |

### 3. Dynamic Hex & Neon Presets
```typescript
// [#FF007F] Inline Hex: Custom neon pink highlight
// [#cyan] Built-in Preset: Cyan plasma aura
// [#matrix] Matrix Lime: Sandbox worker active
```

---

## 🛠️ Configuration Options

Open your `settings.json` (`Cmd + ,` or `Ctrl + ,`):

```json
{
  // Toggle the semi-transparent background aura glow
  "glowComments.enableGlow": true,

  // Control glow intensity (0.05 to 0.4 recommended)
  "glowComments.glowOpacity": 0.14,

  // Enable subtle neon outline border
  "glowComments.enableBorder": true,

  // Automatically illuminate compiler & linter warnings
  "glowComments.enableDiagnosticGlow": true,

  // Opacity factor for non-flagged code in Audit Lens mode
  "glowComments.auditLensDimOpacity": 0.22,

  // Custom team presets
  "glowComments.customPresets": {
    "security": "#FF003C",
    "telemetry": "#00F0FF"
  }
}
```

---

## ⌨️ Commands & Shortcuts

| Shortcut | Command | Description |
|---|---|---|
| `Cmd + K, Cmd + G` / `Ctrl + Alt + G` | `glowComments.toggleAuditLens` | **Toggle Risk Audit Lens** (dims non-flagged code) |
| — | `glowComments.initAgentRules` | **Initialize AI Agent Rules** (`.cursorrules`, `CLAUDE.md`, `AGENTS.md`) |
| — | `glowComments.copyAgentRule` | **Copy AI Agent Protocol** to clipboard |
| — | `glowComments.insertTag` | **Insert Color Tag** via interactive palette |
| — | `glowComments.toggleGlow` | **Toggle Glow Aura** on/off |

---

## 📄 License

MIT © [Shikhar Thakur](https://github.com/shikharthakur2404)
