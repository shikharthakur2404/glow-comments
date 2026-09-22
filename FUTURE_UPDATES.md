# Glow Comments // Future Updates & Architecture Roadmap

> **Operating Principle:** Test and validate v0.2.0 baseline across real workloads first. Sequence upcoming vectors by signal-to-noise ratio.

---

## 1. Architectural Leverage: Build vs. Borrow vs. Skip

```
       [ EXISTING LINTER & DIAGNOSTICS ECOSYSTEM ]
         (ESLint / Biome / TypeScript / Semgrep)
                           │
                           ▼ (vscode.languages.onDidChangeDiagnostics)
          ┌───────────────────────────────────┐
          │  GLOW COMMENTS: VISUALIZATION HUD │
          └───────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
 [ Semantic Rule-ID Chroma ]     [ Git Diff-Scoped Lens ]
  (any: violet, sec: crimson)      (Isolates newly added risk)
```

---

### A. NEXT PRIORITY (v0.3.0): The Signal-to-Noise Hardening

1. **Git Diff-Scoped Audit Lens (`Diagnostic Lines ∩ Git Modified Lines`):**
   * **The Problem:** On legacy enterprise files with 40 pre-existing lint warnings, Audit Lens lights up the whole file, collapsing the "5-second scan" promise back into noise.
   * **The Architecture:** Hook into VS Code's native Git API (`vscode.extensions.getExtension('vscode.git')?.exports`) or compute dirty line ranges via git diff.
   * **The Filter:** `ActiveRiskLines = DiagnosticsLines.filter(line => gitDiff.isLineModified(line))`.
   * **The Result:** Pre-existing legacy debt stays dimmed in black; **ONLY** lines introduced by the AI in the current session radiate.

2. **Semantic Rule-ID Chroma Mapping (Beyond Binary Severity):**
   * **The Problem:** A missing semicolon and a raw SQL injection or `any` bypass both glow with the same severity color.
   * **The Architecture:** Inspect `diagnostic.code` and `diagnostic.source` strings using lightweight regex pattern matching:
     - `@typescript-eslint/no-explicit-any` or `no-any` → **Violet Static Aura (`#BF00FF`)**
     - `security/*` / `sql` / `eval` / `taint` → **Crimson Threat Hazard (`#FF003C`)**
     - `unused-vars` / `empty-block` / `empty-catch` → **Toxic Amber Warning (`#FFA600`)**
     - Formatting / stylistic warnings → Fallback to subtle outline without ambient glow.

3. **Zero-Cost Internal Symbol Resolution (`executeDefinitionProvider`):**
   * **The Leverage:** Call `vscode.commands.executeCommand('vscode.executeDefinitionProvider', doc.uri, position)`.
   * **The Target:** Detect phantom API endpoints and unexported module calls hallucinated by LLMs during multi-file refactors without compiling custom ASTs.

---

### B. BORROW / INTEGRATE (Don't Reinvent)

* **Secret Scanning & Vulnerability Rules:** Consume diagnostics emitted by tools like Semgrep, Trufflehog, or SonarLint via the unified Diagnostics API.
* **External Package Hallucination:** Rely on npm/pypi package auditor extensions rather than querying registries directly.
* **Verification Debt / Reviewed State Tracking:** Treat manual review state as a lightweight bolt-on once visualization proves out.

---

### C. SKIP / RECONSIDER (High Noise / Low Return)

* **Auto-mutating source files with comment tags:** Modifying user buffers causes git churn and merge conflicts.
* **Minimap Heatmaps & Custom AST Engines:** High development overhead, fragile across languages, and redundant with existing editor telemetry.
* **LLM-Scored Semantic Risk at Runtime:** Adds API cost, network latency, and token overhead to an editor extension that must run at 60 FPS.

---

## 2. Sequential Phased Roadmap

| Phase | Version | Core Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | `v0.1.0` | Dual-Marketplace Release (VS Marketplace & Open VSX) | **SHIPPED** |
| **Phase 1 & 2** | `v0.2.0` | Diagnostics-as-Glow + Risk-Scoped Audit Lens (`Cmd+Shift+G`) | **SHIPPED** |
| **Phase 3** | `v0.3.0` | **Git Diff-Scoping** (Legacy debt stays dark; only AI diff radiates) | **PLANNED** |
| **Phase 4** | `v0.4.0` | **Semantic Rule-ID Chroma** (Violet for `any`, Crimson for security) | **BACKLOG** |
| **Phase 5** | `v0.5.0` | **Internal Symbol Resolver** via `executeDefinitionProvider` | **BACKLOG** |
