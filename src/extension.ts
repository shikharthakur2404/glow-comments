import * as vscode from 'vscode';

// Dual-Spectrum Chroma: Dark mode neon emitters & Light mode rich jewel inks (WCAG AAA >= 4.5:1)
interface DualColor {
  dark: string;
  light: string;
}

const DUAL_NEON_PRESETS: Record<string, DualColor> = {
  cyan: { dark: '#00F0FF', light: '#00695C' },
  'neon-cyan': { dark: '#00F0FF', light: '#00695C' },
  pink: { dark: '#FF007F', light: '#C2185B' },
  'neon-pink': { dark: '#FF007F', light: '#C2185B' },
  magenta: { dark: '#FF00A0', light: '#880E4F' },
  green: { dark: '#00FFA3', light: '#1B5E20' },
  'neon-green': { dark: '#00FFA3', light: '#1B5E20' },
  lime: { dark: '#76FF03', light: '#2E7D32' },
  purple: { dark: '#BD00FF', light: '#4A148C' },
  'neon-purple': { dark: '#BD00FF', light: '#4A148C' },
  violet: { dark: '#D500F9', light: '#6A1B9A' },
  yellow: { dark: '#FFE600', light: '#E65100' },
  'neon-yellow': { dark: '#FFE600', light: '#E65100' },
  gold: { dark: '#FFD700', light: '#BF360C' },
  orange: { dark: '#FF7700', light: '#D84315' },
  'neon-orange': { dark: '#FF7700', light: '#D84315' },
  red: { dark: '#FF2A2A', light: '#B71C1C' },
  'neon-red': { dark: '#FF2A2A', light: '#B71C1C' },
  blue: { dark: '#0091FF', light: '#0D47A1' },
  'neon-blue': { dark: '#0091FF', light: '#0D47A1' },
  white: { dark: '#FFFFFF', light: '#212121' },
  matrix: { dark: '#00FF66', light: '#1B5E20' },
  cyberpunk: { dark: '#FFE600', light: '#E65100' }
};

// Semantic shortcuts: High contrast in both dark & light viewports
const DUAL_SEMANTIC_TAGS: Record<string, { dark: string; light: string; strike?: boolean; isRisk?: boolean }> = {
  '!': { dark: '#FF2A4B', light: '#C62828', isRisk: true },        // Alert Red
  '?': { dark: '#00C8FF', light: '#0D47A1' },                      // Question Blue
  TODO: { dark: '#FFA600', light: '#B26A00', isRisk: true },       // Task Gold/Amber
  '*': { dark: '#00FFA3', light: '#1B5E20' },                      // Highlight Green
  HACK: { dark: '#BD00FF', light: '#4A148C', isRisk: true },       // Tech Debt Purple
  FIXME: { dark: '#FF5500', light: '#D84315', isRisk: true },      // Urgent Bug Orange
  NOTE: { dark: '#00F0FF', light: '#00695C' },                     // System Note Teal
  '//': { dark: '#6272A4', light: '#78909C', strike: true }        // Strikethrough Muted Slate
};

function getLightModeVariant(hex: string): string {
  let c = hex.replace(/^#/, '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  // If color is too luminous for white background, synthesize deep ink tone
  if (lum > 130) {
    const factor = 0.42;
    const dr = Math.floor(r * factor).toString(16).padStart(2, '0');
    const dg = Math.floor(g * factor).toString(16).padStart(2, '0');
    const db = Math.floor(b * factor).toString(16).padStart(2, '0');
    return `#${dr}${dg}${db}`;
  }
  return hex;
}

export function activate(context: vscode.ExtensionContext) {
  // Caches & States
  const commentDecorationCache = new Map<string, vscode.TextEditorDecorationType>();
  let activeEditor = vscode.window.activeTextEditor;
  let commentUpdateTimeout: NodeJS.Timeout | undefined;
  let diagnosticUpdateTimeout: NodeJS.Timeout | undefined;

  // Audit Lens state
  let isAuditLensActive = false;
  let commentRiskLines = new Set<number>();
  let diagRiskLines = new Set<number>();
  let currentFlaggedLines = new Set<number>();
  let lastDiagnosticFingerprint = '';

  function syncCurrentFlaggedLines() {
    currentFlaggedLines = new Set([...commentRiskLines, ...diagRiskLines]);
  }

  // Dedicated singletons for Diagnostics & Lens to prevent cache churn
  let diagErrorDecoration: vscode.TextEditorDecorationType | undefined;
  let diagWarnDecoration: vscode.TextEditorDecorationType | undefined;
  let diagInfoDecoration: vscode.TextEditorDecorationType | undefined;
  let auditDimDecoration: vscode.TextEditorDecorationType | undefined;
  let untaggedCommentDecoration: vscode.TextEditorDecorationType | undefined;

  // Status Bar indicator for HUD mode
  const auditLensStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  auditLensStatusBar.command = 'glowComments.toggleAuditLens';
  context.subscriptions.push(auditLensStatusBar);

  function getHexAlpha(opacity: number): string {
    const alpha = Math.round(Math.min(Math.max(opacity, 0), 1) * 255);
    return alpha.toString(16).padStart(2, '0');
  }

  function initStaticDecorations() {
    const config = vscode.workspace.getConfiguration('glowComments');
    const glowOpacity = config.get<number>('glowOpacity', 0.14);
    const dimOpacity = config.get<number>('auditLensDimOpacity', 0.22);

    // Dispose old instances if config changed
    diagErrorDecoration?.dispose();
    diagWarnDecoration?.dispose();
    diagInfoDecoration?.dispose();
    auditDimDecoration?.dispose();
    untaggedCommentDecoration?.dispose();

    // 1. Diagnostic Error: Radiant Crimson (Dark) / Deep Ruby (Light)
    diagErrorDecoration = vscode.window.createTextEditorDecorationType({
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      dark: {
        backgroundColor: `#FF1744${getHexAlpha(glowOpacity * 1.1)}`,
        border: `1px solid #FF1744${getHexAlpha(0.4)}`,
        borderRadius: '3px',
        overviewRulerColor: '#FF1744'
      },
      light: {
        backgroundColor: `#B71C1C${getHexAlpha(glowOpacity * 0.8)}`,
        border: `1px solid #B71C1C${getHexAlpha(0.45)}`,
        borderRadius: '3px',
        overviewRulerColor: '#B71C1C'
      }
    });

    // 2. Diagnostic Warning: Toxic Amber (Dark) / Burnt Ochre (Light)
    diagWarnDecoration = vscode.window.createTextEditorDecorationType({
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      dark: {
        backgroundColor: `#FFA600${getHexAlpha(glowOpacity * 0.95)}`,
        border: `1px solid #FFA600${getHexAlpha(0.35)}`,
        borderRadius: '3px',
        overviewRulerColor: '#FFA600'
      },
      light: {
        backgroundColor: `#B26A00${getHexAlpha(glowOpacity * 0.75)}`,
        border: `1px solid #B26A00${getHexAlpha(0.40)}`,
        borderRadius: '3px',
        overviewRulerColor: '#B26A00'
      }
    });

    // 3. Diagnostic Info: Cyber Cyan (Dark) / Deep Pine (Light)
    diagInfoDecoration = vscode.window.createTextEditorDecorationType({
      dark: {
        backgroundColor: `#00F0FF${getHexAlpha(glowOpacity * 0.7)}`,
        border: `1px solid #00F0FF${getHexAlpha(0.25)}`,
        borderRadius: '3px'
      },
      light: {
        backgroundColor: `#00695C${getHexAlpha(glowOpacity * 0.6)}`,
        border: `1px solid #00695C${getHexAlpha(0.35)}`,
        borderRadius: '3px'
      }
    });

    // 4. Audit Lens Dimming Decoration: Drops non-flagged code to dimOpacity
    auditDimDecoration = vscode.window.createTextEditorDecorationType({
      opacity: dimOpacity.toString()
    });

    // 5. Untagged Comment Decoration: Ultra-subtle (disabled by default)
    untaggedCommentDecoration = vscode.window.createTextEditorDecorationType({
      fontStyle: 'italic',
      dark: {
        backgroundColor: `#6272A4${getHexAlpha(0.04)}`
      },
      light: {
        backgroundColor: `#37474F${getHexAlpha(0.05)}`
      }
    });
  }

  initStaticDecorations();

  function getCommentDecorationType(
    darkHex: string,
    lightHex: string,
    strikethrough: boolean = false
  ): vscode.TextEditorDecorationType {
    const config = vscode.workspace.getConfiguration('glowComments');
    const enableGlow = config.get<boolean>('enableGlow', true);
    const glowOpacity = config.get<number>('glowOpacity', 0.14);
    const enableBorder = config.get<boolean>('enableBorder', true);
    const isBold = config.get<boolean>('bold', true);

    const cacheKey = `${darkHex.toUpperCase()}_${lightHex.toUpperCase()}_glow:${enableGlow}_strike:${strikethrough}_border:${enableBorder}_bold:${isBold}`;

    if (commentDecorationCache.has(cacheKey)) {
      return commentDecorationCache.get(cacheKey)!;
    }

    const renderOptions: vscode.DecorationRenderOptions = {
      fontWeight: isBold ? 'bold' : 'normal',
      textDecoration: strikethrough ? 'line-through' : undefined,
      dark: {
        color: darkHex,
        backgroundColor: enableGlow ? `${darkHex}${getHexAlpha(glowOpacity)}` : undefined,
        border: (enableBorder && enableGlow) ? `1px solid ${darkHex}${getHexAlpha(0.35)}` : undefined,
        borderRadius: '3px'
      },
      light: {
        color: lightHex,
        backgroundColor: enableGlow ? `${lightHex}${getHexAlpha(glowOpacity * 0.85)}` : undefined,
        border: (enableBorder && enableGlow) ? `1px solid ${lightHex}${getHexAlpha(0.40)}` : undefined,
        borderRadius: '3px'
      }
    };

    const dec = vscode.window.createTextEditorDecorationType(renderOptions);
    commentDecorationCache.set(cacheKey, dec);
    return dec;
  }

  function clearCommentDecorations() {
    commentDecorationCache.forEach(dec => dec.dispose());
    commentDecorationCache.clear();
  }

  // --- ENGINE 1: COMMENT SCANNER ---
  function triggerUpdateComments(throttle: boolean = true) {
    if (commentUpdateTimeout) {
      clearTimeout(commentUpdateTimeout);
      commentUpdateTimeout = undefined;
    }

    if (throttle) {
      commentUpdateTimeout = setTimeout(() => updateComments(), 50);
    } else {
      updateComments();
    }
  }

  function updateComments() {
    if (!activeEditor) return;

    const doc = activeEditor.document;
    const text = doc.getText();
    const config = vscode.workspace.getConfiguration('glowComments');
    const customPresets = config.get<Record<string, string>>('customPresets', {});
    const glowUntagged = config.get<boolean>('glowUntaggedComments', false);

    const rangeBuckets = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
    const untaggedRanges: vscode.Range[] = [];
    const flaggedCommentLines = new Set<number>();
    const newCommentRiskLines = new Set<number>();

    const getBucket = (dec: vscode.TextEditorDecorationType): vscode.Range[] => {
      let bucket = rangeBuckets.get(dec);
      if (!bucket) {
        bucket = [];
        rangeBuckets.set(dec, bucket);
      }
      return bucket;
    };

    // Regex matching single-line (//, #, --, ;, %) and block openers (/*, <!--)
    const commentRegex = /(\/\/|#|--|;|%|\/\*|<!--)\s*([^\r\n]*)/g;
    let match: RegExpExecArray | null;

    while ((match = commentRegex.exec(text)) !== null) {
      const delimiter = match[1];
      const commentContent = match[2];
      if (!commentContent) continue;

      const trimmed = commentContent.trim();
      let matchedDarkHex: string | null = null;
      let matchedLightHex: string | null = null;
      let isStrike = false;
      let isRisk = false;

      // Pattern 1: Inline hex code [#RRGGBB] or [#RGB]
      const hexMatch = trimmed.match(/^\[#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\]/i);
      if (hexMatch) {
        let rawHex = hexMatch[1];
        if (rawHex.length === 3) {
          rawHex = rawHex.split('').map(c => c + c).join('');
        }
        matchedDarkHex = `#${rawHex}`;
        matchedLightHex = getLightModeVariant(matchedDarkHex);
      }

      // Pattern 2: Named neon preset tag [#cyan], [cyan], or @glow(cyan)
      if (!matchedDarkHex) {
        const namedMatch = trimmed.match(/^\[#?([a-zA-Z0-9_-]+)\]/i) || trimmed.match(/^@glow\(([a-zA-Z0-9_-]+)\)/i);
        if (namedMatch) {
          const tagName = namedMatch[1].toLowerCase();
          if (DUAL_NEON_PRESETS[tagName]) {
            matchedDarkHex = DUAL_NEON_PRESETS[tagName].dark;
            matchedLightHex = DUAL_NEON_PRESETS[tagName].light;
          } else if (customPresets[tagName]) {
            matchedDarkHex = customPresets[tagName];
            matchedLightHex = getLightModeVariant(matchedDarkHex);
          }
        }
      }

      // Pattern 3: Semantic shortcuts (!, ?, TODO, *, HACK, FIXME, NOTE, //)
      if (!matchedDarkHex) {
        for (const [prefix, def] of Object.entries(DUAL_SEMANTIC_TAGS)) {
          if (prefix === '*' && (delimiter === '/*' || delimiter === '<!--')) {
            continue;
          }
          if (trimmed.startsWith(prefix) || trimmed.startsWith(`[${prefix}]`)) {
            matchedDarkHex = def.dark;
            matchedLightHex = def.light;
            isStrike = !!def.strike;
            isRisk = !!def.isRisk;
            break;
          }
        }
      }

      const startPos = doc.positionAt(match.index);
      const endPos = doc.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);

      if (matchedDarkHex && matchedLightHex) {
        const decType = getCommentDecorationType(matchedDarkHex, matchedLightHex, isStrike);
        getBucket(decType).push(range);
        flaggedCommentLines.add(startPos.line);
        if (isRisk) {
          newCommentRiskLines.add(startPos.line);
        }
      } else if (glowUntagged && untaggedCommentDecoration) {
        untaggedRanges.push(range);
      }
    }

    // Apply comment decorations
    commentDecorationCache.forEach(dec => {
      const ranges = rangeBuckets.get(dec) || [];
      activeEditor!.setDecorations(dec, ranges);
    });

    if (untaggedCommentDecoration) {
      activeEditor.setDecorations(untaggedCommentDecoration, untaggedRanges);
    }

    commentRiskLines = newCommentRiskLines;
    syncCurrentFlaggedLines();

    if (isAuditLensActive) {
      applyAuditLens();
    }
  }

  // --- ENGINE 2: DIAGNOSTICS-AS-GLOW ---
  function computeDiagnosticsFingerprint(diags: readonly vscode.Diagnostic[]): string {
    if (!diags || diags.length === 0) return 'EMPTY';
    return diags
      .map(d => `${d.range.start.line}:${d.range.start.character}-${d.range.end.line}:${d.range.end.character}_${d.severity}`)
      .join('|');
  }

  function triggerUpdateDiagnostics() {
    if (diagnosticUpdateTimeout) {
      clearTimeout(diagnosticUpdateTimeout);
      diagnosticUpdateTimeout = undefined;
    }
    // 80ms debounce prevents CPU/flicker churn during rapid typing
    diagnosticUpdateTimeout = setTimeout(() => updateDiagnostics(), 80);
  }

  function updateDiagnostics() {
    if (!activeEditor || !diagErrorDecoration || !diagWarnDecoration || !diagInfoDecoration) {
      return;
    }

    const config = vscode.workspace.getConfiguration('glowComments');
    const enableDiagGlow = config.get<boolean>('enableDiagnosticGlow', true);

    if (!enableDiagGlow) {
      activeEditor.setDecorations(diagErrorDecoration, []);
      activeEditor.setDecorations(diagWarnDecoration, []);
      activeEditor.setDecorations(diagInfoDecoration, []);
      return;
    }

    const levels = config.get<string[]>('diagnosticGlowLevels', ['Error', 'Warning']);
    const diags = vscode.languages.getDiagnostics(activeEditor.document.uri);
    const fingerprint = computeDiagnosticsFingerprint(diags);

    // Skip recalculation if the diagnostics set has not changed
    if (fingerprint === lastDiagnosticFingerprint) {
      return;
    }
    lastDiagnosticFingerprint = fingerprint;

    const errorRanges: vscode.Range[] = [];
    const warnRanges: vscode.Range[] = [];
    const infoRanges: vscode.Range[] = [];
    const diagFlaggedLines = new Set<number>();

    for (const d of diags) {
      if (d.severity === vscode.DiagnosticSeverity.Error && levels.includes('Error')) {
        errorRanges.push(d.range);
        diagFlaggedLines.add(d.range.start.line);
      } else if (d.severity === vscode.DiagnosticSeverity.Warning && levels.includes('Warning')) {
        warnRanges.push(d.range);
        diagFlaggedLines.add(d.range.start.line);
      } else if (d.severity === vscode.DiagnosticSeverity.Information && levels.includes('Information')) {
        infoRanges.push(d.range);
      }
    }

    activeEditor.setDecorations(diagErrorDecoration, errorRanges);
    activeEditor.setDecorations(diagWarnDecoration, warnRanges);
    activeEditor.setDecorations(diagInfoDecoration, infoRanges);

    diagRiskLines = diagFlaggedLines;
    syncCurrentFlaggedLines();

    if (isAuditLensActive) {
      applyAuditLens();
    }
  }

  // --- ENGINE 3: RISK-SCOPED AUDIT LENS (Alt + Cmd + G / Alt + Ctrl + G) ---
  function applyAuditLens() {
    if (!activeEditor || !auditDimDecoration) return;

    if (!isAuditLensActive) {
      activeEditor.setDecorations(auditDimDecoration, []);
      auditLensStatusBar.text = '$(eye-closed) Audit Lens: OFF';
      auditLensStatusBar.tooltip = 'Click to toggle Risk Audit Lens (Alt+Cmd+G / Alt+Win+G)';
      auditLensStatusBar.show();
      return;
    }

    const doc = activeEditor.document;
    const totalLines = doc.lineCount;
    const dimRanges: vscode.Range[] = [];

    // Any line not flagged as error/warning or risky tag is dimmed
    for (let i = 0; i < totalLines; i++) {
      if (!currentFlaggedLines.has(i)) {
        const line = doc.lineAt(i);
        if (!line.isEmptyOrWhitespace) {
          dimRanges.push(line.range);
        }
      }
    }

    activeEditor.setDecorations(auditDimDecoration, dimRanges);
    auditLensStatusBar.text = `$(eye) Audit Lens: ON (${currentFlaggedLines.size} flagged)`;
    auditLensStatusBar.tooltip = `${currentFlaggedLines.size} risk/diagnostic lines illuminated. Safe code dimmed.`;
    auditLensStatusBar.show();
  }

  function toggleAuditLens() {
    isAuditLensActive = !isAuditLensActive;
    applyAuditLens();
    vscode.window.showInformationMessage(
      `Glow Comments: Risk Audit Lens ${isAuditLensActive ? 'ACTIVATED (Isolating risk lines)' : 'DEACTIVATED'}`
    );
  }

  // --- EVENT LISTENERS ---
  vscode.window.onDidChangeActiveTextEditor(editor => {
    activeEditor = editor;
    if (editor) {
      lastDiagnosticFingerprint = '';
      triggerUpdateComments(false);
      triggerUpdateDiagnostics();
      if (isAuditLensActive) {
        applyAuditLens();
      }
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (activeEditor && event.document === activeEditor.document) {
      triggerUpdateComments(true);
    }
  }, null, context.subscriptions);

  vscode.languages.onDidChangeDiagnostics(event => {
    if (activeEditor && event.uris.some(uri => uri.toString() === activeEditor!.document.uri.toString())) {
      triggerUpdateDiagnostics();
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('glowComments')) {
      clearCommentDecorations();
      initStaticDecorations();
      lastDiagnosticFingerprint = '';
      triggerUpdateComments(false);
      triggerUpdateDiagnostics();
    }
  }, null, context.subscriptions);

  vscode.window.onDidChangeActiveColorTheme(() => {
    clearCommentDecorations();
    initStaticDecorations();
    lastDiagnosticFingerprint = '';
    triggerUpdateComments(false);
    triggerUpdateDiagnostics();
  }, null, context.subscriptions);

  // --- AI AGENT DIRECTIVE PROTOCOL (Path A) ---
  const AGENT_DIRECTIVE_BLOCK = `
# Glow Comments: Visual Verification Protocol
When generating, refactoring, or reviewing code, use Glow Comments visual annotations so the developer's Audit Lens (\`Alt+Cmd+G\` / \`Alt+Ctrl+G\`) instantly surfaces critical logic:
- \`// ! [critical assumption]\` -> High-risk boundaries, auth flows, unverified inputs, data mutations.
- \`// FIXME: [stub/debt]\` -> Mock implementations, temporary stubs, or performance bottlenecks.
- \`// TODO: [human task]\` -> Required human review, missing API credentials, rate limits, env configs.
- \`// ? [clarification]\` -> Ambiguous requirements, unverified external API contracts, design tradeoffs.
- \`// NOTE: [architecture]\` -> Core subsystem invariants and architectural boundaries.
`.trim();

  // --- COMMANDS ---
  const insertTagCmd = vscode.commands.registerCommand('glowComments.insertTag', async () => {
    const paletteItems = [
      { label: '$(circle-filled) Neon Cyan', description: '#00F0FF', tag: '[#cyan]' },
      { label: '$(circle-filled) Neon Pink', description: '#FF007F', tag: '[#pink]' },
      { label: '$(circle-filled) Neon Lime', description: '#00FFA3', tag: '[#lime]' },
      { label: '$(circle-filled) Neon Gold', description: '#FFE600', tag: '[#gold]' },
      { label: '$(circle-filled) Neon Purple', description: '#BD00FF', tag: '[#purple]' },
      { label: '$(circle-filled) Neon Red', description: '#FF2A2A', tag: '[#red]' },
      { label: '$(circle-filled) Neon Blue', description: '#0091FF', tag: '[#blue]' },
      { label: '$(circle-filled) Matrix Green', description: '#00FF66', tag: '[#matrix]' },
      { label: '$(symbol-color) Custom Hex Code...', description: 'Enter any #RRGGBB hex code', tag: 'CUSTOM' }
    ];

    const pick = await vscode.window.showQuickPick(paletteItems, {
      placeHolder: 'Select a Neon Glow color tag for this comment'
    });

    if (!pick) return;

    let tagToInsert = pick.tag;
    if (pick.tag === 'CUSTOM') {
      const customHex = await vscode.window.showInputBox({
        prompt: 'Enter 6-digit hex color (e.g. #FF5500 or FF5500)',
        validateInput: val => (/^#?[0-9a-fA-F]{6}$/.test(val) ? null : 'Please enter a valid 6-digit hex color.')
      });
      if (!customHex) return;
      tagToInsert = `[#${customHex.replace(/^#/, '').toUpperCase()}]`;
    }

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.edit(editBuilder => {
        editor.selections.forEach(selection => {
          editBuilder.insert(selection.active, `${tagToInsert} `);
        });
      });
    }
  });

  const toggleGlowCmd = vscode.commands.registerCommand('glowComments.toggleGlow', async () => {
    const config = vscode.workspace.getConfiguration('glowComments');
    const current = config.get<boolean>('enableGlow', true);
    await config.update('enableGlow', !current, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`Glow Comments Aura: ${!current ? 'ENABLED' : 'DISABLED'}`);
  });

  const toggleAuditLensCmd = vscode.commands.registerCommand('glowComments.toggleAuditLens', () => {
    toggleAuditLens();
  });

  const initAgentRulesCmd = vscode.commands.registerCommand('glowComments.initAgentRules', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('Glow Comments: Open a workspace folder first to initialize agent rules.');
      return;
    }

    const rootUri = workspaceFolders[0].uri;
    const targetOptions = [
      { label: '$(file-code) All Agent Files (.cursorrules, CLAUDE.md, AGENTS.md)', files: ['.cursorrules', 'CLAUDE.md', 'AGENTS.md'] },
      { label: '$(file-code) .cursorrules (Cursor IDE Agent)', files: ['.cursorrules'] },
      { label: '$(file-code) CLAUDE.md (Claude Code CLI / Anthropic)', files: ['CLAUDE.md'] },
      { label: '$(file-code) AGENTS.md (OpenCode / Codex / Universal Agents)', files: ['AGENTS.md'] },
      { label: '$(clippy) Copy Protocol to Clipboard Only', files: [] }
    ];

    const pick = await vscode.window.showQuickPick(targetOptions, {
      placeHolder: 'Select where to install Glow Comments Visual Verification Protocol'
    });

    if (!pick) return;

    if (pick.files.length === 0) {
      await vscode.env.clipboard.writeText(AGENT_DIRECTIVE_BLOCK);
      vscode.window.showInformationMessage('Glow Comments: Agent verification protocol copied to clipboard.');
      return;
    }

    const written: string[] = [];
    for (const filename of pick.files) {
      const fileUri = vscode.Uri.joinPath(rootUri, filename);
      let content = AGENT_DIRECTIVE_BLOCK;
      try {
        const existingData = await vscode.workspace.fs.readFile(fileUri);
        const existingText = Buffer.from(existingData).toString('utf8');
        if (existingText.includes('Glow Comments: Visual Verification Protocol')) {
          continue;
        }
        content = `${existingText.trim()}\n\n${AGENT_DIRECTIVE_BLOCK}\n`;
      } catch {
        content = `${AGENT_DIRECTIVE_BLOCK}\n`;
      }

      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf8'));
      written.push(filename);
    }

    if (written.length > 0) {
      vscode.window.showInformationMessage(`Glow Comments: Installed AI agent rules in ${written.join(', ')}`);
    } else {
      vscode.window.showInformationMessage('Glow Comments: Agent rules were already present in target file(s).');
    }
  });

  const copyAgentRuleCmd = vscode.commands.registerCommand('glowComments.copyAgentRule', async () => {
    await vscode.env.clipboard.writeText(AGENT_DIRECTIVE_BLOCK);
    vscode.window.showInformationMessage('Glow Comments: AI agent verification protocol copied to clipboard!');
  });

  context.subscriptions.push(
    insertTagCmd,
    toggleGlowCmd,
    toggleAuditLensCmd,
    initAgentRulesCmd,
    copyAgentRuleCmd
  );

  // Initial pass on activation
  if (activeEditor) {
    triggerUpdateComments(false);
    triggerUpdateDiagnostics();
    auditLensStatusBar.text = '$(eye-closed) Audit Lens: OFF';
    auditLensStatusBar.show();
  }
}

export function deactivate() {}
