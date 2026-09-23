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
 [ Semantic Rule-ID Chroma ]     [ Session Anchor Diff Lens ]
  (Sec > Type > Stylistic)        (Survives intermediate commits)
```

---

### A. NEXT PRIORITY (v0.3.0): The Signal-to-Noise Hardening

1. **Session-Anchored Git Diff-Scoping:**
   * **The HEAD Failure Mode:** Diffing against `HEAD` means the moment an engineer commits (`git commit`), `diffWithHEAD` drops to empty and the freshly written AI code goes pitch black.
   * **The Solution (Session Anchor):** Capture `sessionAnchorCommit` when the extension activates or when Audit Lens is toggled. Diff against this anchor commit so changes survive intermediate commits.
   * **Config Vector:**
     - `glowComments.diffScopeBase`: `"session"` (default) | `"head"` (working tree) | `"main"` (branch divergence).
   * **The Hunk Parser:** `vscode.git` returns raw unified diff strings, not structured line numbers. Implement a zero-dependency hunk header parser:
     ```typescript
     // Regex: @@ -a,b +c,d @@
     const hunkRegex = /^@@\s+-(?:\d+)(?:,\d+)?\s+\+(\d+)(?:,(\d+))?\s+@@/gm;
     ```
     Maps `+startLine,lineCount` additions directly into an `O(1)` line-lookup `Set<number>`.

2. **Semantic Rule-ID Chroma Mapping (Strict Precedence Ordering):**
   * **Precedence Order:** Check threat categories in descending criticality so high-severity patterns aren't swallowed by broad type rules:
     1. **Tier 1 (Crimson Threat `#FF003C`):** `security/*`, `sql`, `eval`, `injection`, `taint`, `prototype-pollution`.
     2. **Tier 2 (Violet Static `#BF00FF`):** `no-explicit-any`, `no-unsafe-*`, `loose-cast`.
     3. **Tier 3 (Toxic Amber `#FFA600`):** `empty-catch`, `no-empty`, `unhandled-rejection`.
     4. **Tier 4 (Outline Only / No Glow):** Formatting, stylistic rules (semicolons, spacing, quotes) downgraded to subtle muted outlines to prevent visual pollution.

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
| **Phase 3** | `v0.3.0` | **Session-Anchored Diff-Scoping** + Hunk Parser (`sessionAnchorCommit`) | **PLANNED** |
| **Phase 4** | `v0.4.0` | **Semantic Rule-ID Chroma** (Strict Security > Type > Stylistic precedence) | **BACKLOG** |
| **Phase 5** | `v0.5.0` | **Internal Symbol Resolver** via `executeDefinitionProvider` | **BACKLOG** |
