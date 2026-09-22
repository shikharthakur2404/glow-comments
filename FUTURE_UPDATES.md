# Glow Comments // Future Updates & Architecture Roadmap

> **Operating Principle:** Test and validate v0.1.0 production baseline across real workloads first. Evaluate and deploy subsequent vectors sequentially, one by one.

---

## 1. Architectural Leverage: Build vs. Borrow vs. Skip

```
       [ EXISTING LINER & DIAGNOSTICS ECOSYSTEM ]
         (ESLint / Biome / TypeScript / Semgrep)
                           │
                           ▼ (vscode.languages.onDidChangeDiagnostics)
          ┌───────────────────────────────────┐
          │  GLOW COMMENTS: VISUALIZATION HUD │
          └───────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
 [ Ambient Glow by Severity ]     [ Risk-Scoped Audit Lens ]
   (Info / Warn / Error / Hint)     (Dim clean code by 75%)
```

---

### A. BUILD (Maximum Leverage — Zero Competition)

1. **Diagnostics-as-Glow Renderer (`vscode.languages.onDidChangeDiagnostics`):**
   * **Mechanism:** Do not build a custom AST scanner. Consume VS Code's native `Diagnostics` collection that ESLint, TypeScript, Biome, and Semgrep already output.
   * **Transformation:** Re-skin squiggly underlines into ambient luminous aura borders.
   * **Leverage:** Instantly inherits thousands of community-tuned rules without writing a parser. Competes with no linters; serves as the visual telemetry layer for all of them.

2. **Risk-Scoped Audit Lens (`Cmd + Shift + G`):**
   * **Mechanism:** Selective dimming by diagnostic severity rather than cursor position.
   * **Transformation:** Unflagged safe lines drop to **20–25% opacity**; only lines with active errors, warnings, or dirty tags retain **100% luminance**.
   * **Leverage:** Enables the "8-second scan" of a 500-line AI generation by turning noise pitch-black.

3. **Virtual Ghost-Text Badges (Non-Invasive Risk Marking):**
   * **Mechanism:** Replace file-mutating comment injections (`// [AI:AUDIT]`) with VS Code virtual text decorations (`decorationType.after.contentText`).
   * **Transformation:** A floating non-invasive `🟠 unhandled catch` or `🔴 untyped any` badge hovers adjacent to the code without dirtying git diffs or file buffers.

4. **Zero-Cost Internal Symbol Resolution (`executeDefinitionProvider`):**
   * **Mechanism:** Tap the already-running language server via `vscode.commands.executeCommand('vscode.executeDefinitionProvider')`.
   * **Transformation:** Verifies whether an AI-generated internal function, interface, or module actually resolves to a real symbol.
   * **Leverage:** Catches hallucinated internal imports and phantom endpoints without any AST dependencies.

---

### B. BORROW / INTEGRATE (Don't Reinvent)

* **Secret Scanning & Vulnerability Rules:** Consume diagnostics emitted by tools like Semgrep, Trufflehog, or SonarLint via the unified Diagnostics API.
* **External Package Hallucination:** Rely on npm/pypi package auditor extensions rather than querying registries directly.
* **Verification Debt / Reviewed State Tracking:** Treat manual review state as a lightweight bolt-on once visualization proves out.

---

### C. SKIP / RECONSIDER (High Noise / Low Return)

* **Auto-mutating source files with comment tags:** Modifying user buffers causes git churn and merge conflicts. Replaced by virtual ghost-text decorations.
* **Minimap Heatmaps & Custom AST Engines:** High development overhead, fragile across languages, and redundant with existing editor telemetry.
* **LLM-Scored Semantic Risk at Runtime:** Adds API cost, network latency, and token overhead to an editor extension that must run at 60 FPS.

---

## 2. Sequential Phased Roadmap

| Phase | Target Version | Objective | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | `v0.1.0` | Production verification on VS Marketplace & Open VSX | **CURRENT** |
| **Phase 1** | `v0.2.0` | Diagnostics-as-Glow listener (`onDidChangeDiagnostics`) | **QUEUED** |
| **Phase 2** | `v0.3.0` | Risk-Scoped Audit Lens (`Cmd+Shift+G` severity dimming) | **BACKLOG** |
| **Phase 3** | `v0.4.0` | Non-invasive Ghost-Text risk badges (`decoration.after`) | **BACKLOG** |
| **Phase 4** | `v0.5.0` | Language Server internal symbol resolution checker | **BACKLOG** |
