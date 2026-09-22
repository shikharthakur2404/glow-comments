# Glow Comments: Optical Telemetry for the Vibe Coding Era

> **Thesis:** In an era of AI code generation and "vibe coding", syntactically plausible hallucination and silent architectural decay are the primary failure modes. **Glow Comments** evolves from aesthetic styling into an **Optical Radar HUD** designed to reduce the *Cognitive Verification Tax* and pierce code blindness.

---

## 1. The Vibe Coding Pathology

| GenAI Failure Mode | Manifestation in Code | Cognitive Eye Blindness |
| :--- | :--- | :--- |
| **Silent Fault Swallowing** | `catch (err) {}`, fallback mocks returning `{}` | Eye reads boilerplate and assumes errors are handled. |
| **Type Escape Hatches** | `as any`, `(window as any).__data`, loose casts | Looks type-safe from 10,000 ft; blows up runtime invariants. |
| **Security Surface Bleed** | Raw template literals in queries, unvalidated client inputs, prototype pollution | Code compiles cleanly; vulnerability hidden in plain text. |
| **Session Drift & Hallucination** | AI leaves mock arrays, phantom API endpoints, uncalled saga effects | Plausible-looking scaffolding that doesn't actually connect. |

When engineers "vibe code", they tab-complete hundreds of lines per hour. Standard IDE themes treat dangerous lines with the same muted syntax tokens as harmless boilerplate.

---

## 2. The Solution: Optical Telemetry HUD

Transform editor comments and line annotations from passive text into an **active sensory filter** that directs human foveal attention to critical risk surfaces.

```
       [ UNVERIFIED AI CODE ]  ───►  Luminance Filter
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
[ Silent Faults ]   [ Attack Surfaces ]
 (Radioactive Amber)    (Crimson Alert)
        │                   │
        └─────────┬─────────┘
                  ▼
      [ HUMAN ATTENTION LOCK ]
```

---

## 3. Product Evolution Vectors (v0.2.0 → v1.0.0)

### Vector 1: Semantic AI Audit Tags
Standardize prompt-injected annotation tags that Cursor, Claude, and Gemini emit when generating risky logic:

```typescript
// [AI:AUDIT] Unvalidated input payload from webhook
// [AI:UNVERIFIED] External state mutation without mutex lock
// [AI:MOCK] Stub data — replace before production deployment
// [INVARIANT] Saga must takeLatest; do not refactor to takeEvery
```

* **Visual Behavior:** Pulse aura + high-contrast neon borders. The tag physically repels passive scanning and forces active cognitive verification.

---

### Vector 2: Autonomous Optical Radar (Zero-Tag Heuristics)
The extension scans active documents for high-entropy vibe-coding traps and automatically projects ambient auras onto offending lines:

| Pattern Detected | Optical Aura | Color Hex | Threat Model |
| :--- | :--- | :--- | :--- |
| **Silent Catch** (`catch (e) {}` / empty handler) | Toxic Orange Pulse | `#FF5500` | Suppressed runtime crash |
| **Type Cast Bypass** (`as any`, `: any`) | Violet Static | `#9D00FF` | Hidden type degradation |
| **Attack Vectors** (`eval()`, `dangerouslySetInnerHTML`, raw SQL) | Crimson Alert Border | `#FF003C` | Direct injection vulnerability |
| **Leftover AI Stubs** (`// TODO: implement`, `mockData = [...]`) | Neon Cyan Hazard | `#00F0FF` | Dead mock left in production |

---

### Vector 3: The "Vibe Audit Lens" (Cognitive Dimming)
A keyboard shortcut (`Cmd + Shift + G`) that switches the editor into **Foveal Audit Mode**:
1. Boilerplate, imports, and clean declarative blocks are dimmed to **25% opacity**.
2. Critical state mutations, external network I/O, error handlers, and glowing tags radiate at **100% luminance**.
3. The human eye audits a 500-line generated file in **8 seconds** by scanning only the illuminated hotspots.

---

## 4. Integration with AI Workflows

### Prompt Directive for Cursor Rules / Antigravity System Prompts
Embed this rule into your `.cursorrules` or system prompt:

```markdown
### Visual Verification Protocol
Whenever you write code containing:
- Incomplete implementations or placeholder mock data
- Security-sensitive logic (auth, tokens, raw SQL, sanitization)
- Unhandled edge cases or intentional compromises

You MUST precede the line with a Glow Tag:
// [AI:AUDIT] <Risk explanation>
// [AI:MOCK] <Stub notice>
// [#FF003C] <Security risk>
```

This transforms the AI from a silent hallucinator into an active co-pilot that flags its own uncertainties directly onto your visual cortex.

---

## 5. Technical Implementation Roadmap

1. **Phase 1 (Active):** Dynamic hex parsing + semantic presets (`glow-comments@0.1.0`).
2. **Phase 2 (v0.2.0):** Add dedicated AI inspection tags (`[AI:AUDIT]`, `[AI:MOCK]`, `[AI:RISK]`) with pulsing animation CSS hooks.
3. **Phase 3 (v0.3.0):** Autonomous anti-pattern linter engine running lightweight AST/regex checks in a Web Worker to illuminate silent catches and `any` escapes.
4. **Phase 4 (v1.0.0):** Audit Lens shortcut (`glowComments.toggleAuditLens`) to dim non-critical lines and isolate risk surfaces.
