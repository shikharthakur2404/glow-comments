# Glow Comments ⚡

> **High-visibility neon glowing comments, dynamic inline hex colors, and modern semantic code annotations for VS Code and Cursor.**

Transform dead gray comments into an illuminated visual HUD. Whether you want subtle neon accent tags, vibrant cyberpunk warnings, or arbitrary hex color codes, **Glow Comments** renders luminous, aura-bordered annotations on the fly without bogging down your editor.

---

## ✨ Features

- 🌈 **Dynamic Hex Colors:** Type any 6-digit or 3-digit hex code directly inside a comment (`// [#FF007F]`) to render that exact color instantly.
- ⚡ **Luminous Neon Presets:** Built-in cyber palette (`[#cyan]`, `[#pink]`, `[#lime]`, `[#purple]`, `[#gold]`, `[#matrix]`, and more).
- 🎯 **Drop-in "Better Comments" Upgrade:** Supercharges legacy shortcuts (`!`, `?`, `TODO`, `*`, `HACK`, `FIXME`) with luminous ambient auras and borders.
- 🎨 **Right-Click Color Palette:** Right-click any line and select **"Glow Comments: Insert Color Tag"** to pick from a sleek interactive QuickPick menu.
- 🛡️ **Zero Lag & Zero Memory Leaks:** Cached decoration types with debounced updates ensure lightning-fast rendering even on 10,000+ line files.
- 🌐 **Universal Language Support:** Works seamlessly across JavaScript, TypeScript, Python, C/C++, Java, Go, Rust, SQL, HTML, Markdown, Shell, and more.

---

## 🚀 Syntax Cheat Sheet

### 1. Dynamic Hex Colors
Place `[#RRGGBB]` at the start of any comment:
```typescript
// [#FF007F] Neon Pink: Memory optimization required here
// [#00F0FF] Cyber Cyan: Interface boundary validated
// [#FFE600] Solar Gold: Refactor planned for v2.0
# [#00FFA3] Matrix Lime: Python background worker operational
```

### 2. Built-in Neon Presets
Use `[#tagname]` or `[tagname]`:
```typescript
// [#cyan] System telemetry connected
// [#pink] Critical authentication bypass check
// [#lime] Safe memory boundary
// [#purple] Architectural pivot note
// [#gold] Payment webhook handler
// [#matrix] Running inside local sandbox
```

### 3. Upgraded Semantic Tags
```typescript
// ! Critical security alert (Neon Red Aura)
// ? Design query / architectural unknown (Cyber Blue)
// TODO: Implement token refresh logic (Gold Highlight)
// * Core algorithm optimization (Neon Lime)
// HACK: Temporary workaround for upstream bug (Deep Violet)
// FIXME: Race condition during hot reload (Orange Pulse)
// // Deprecated function stub (Dimmed Strikethrough)
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

  // Make glowing text bold
  "glowComments.bold": true,

  // Add your own custom team presets
  "glowComments.customPresets": {
    "danger": "#FF0033",
    "team-alpha": "#00E5FF",
    "backend": "#7B2CBF"
  }
}
```

---

## ⌨️ Commands

| Command | Title | Description |
|---|---|---|
| `glowComments.insertTag` | **Glow Comments: Insert Color Tag** | Opens interactive color palette to insert a neon tag at cursor |
| `glowComments.toggleGlow` | **Glow Comments: Toggle Glow Aura** | Instantly toggles background glow auras on/off |

---

## 📦 Local Installation (VSIX)

1. Download or package `glow-comments-0.1.0.vsix`.
2. Open VS Code or Cursor.
3. Open the **Extensions** panel (`Cmd + Shift + X`).
4. Click the `...` menu in the top right → **"Install from VSIX..."**.
5. Select `glow-comments-0.1.0.vsix`. Done!

---

## 📄 License

MIT © [Shikhar Thakur](https://github.com/shikharthakur2404)
