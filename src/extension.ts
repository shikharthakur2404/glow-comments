import * as vscode from 'vscode';

// Standard high-luminosity neon palette
const NEON_PRESETS: Record<string, string> = {
  cyan: '#00F0FF',
  'neon-cyan': '#00F0FF',
  pink: '#FF007F',
  'neon-pink': '#FF007F',
  magenta: '#FF00A0',
  green: '#00FFA3',
  'neon-green': '#00FFA3',
  lime: '#76FF03',
  purple: '#BD00FF',
  'neon-purple': '#BD00FF',
  violet: '#D500F9',
  yellow: '#FFE600',
  'neon-yellow': '#FFE600',
  gold: '#FFD700',
  orange: '#FF7700',
  'neon-orange': '#FF7700',
  red: '#FF2A2A',
  'neon-red': '#FF2A2A',
  blue: '#0091FF',
  'neon-blue': '#0091FF',
  white: '#FFFFFF',
  matrix: '#00FF66',
  cyberpunk: '#FFE600'
};

// Semantic shortcuts compatible with legacy workflow + glow upgrade
const SEMANTIC_TAGS: Record<string, { color: string; strike?: boolean; isRisk?: boolean }> = {
  '!': { color: '#FF2A4B', isRisk: true },        // Alert / Critical Red
  '?': { color: '#00C8FF' },                      // Question / Exploration Blue
  TODO: { color: '#FFA600', isRisk: true },       // Task / Action Gold
  '*': { color: '#00FFA3' },                      // Highlight / Focus Green
  HACK: { color: '#BD00FF', isRisk: true },       // Tech Debt Purple
  FIXME: { color: '#FF5500', isRisk: true },      // Urgent Bug Orange
  NOTE: { color: '#00F0FF' },                     // System Note Cyan
  '//': { color: '#6272A4', strike: true }        // Strikethrough / Deprecated
};

export function activate(context: vscode.ExtensionContext) {
  // Caches & States
  const commentDecorationCache = new Map<string, vscode.TextEditorDecorationType>();
  let activeEditor = vscode.window.activeTextEditor;
  let commentUpdateTimeout: NodeJS.Timeout | undefined;
  let diagnosticUpdateTimeout: NodeJS.Timeout | undefined;

  // Audit Lens state
  let isAuditLensActive = false;
  let currentFlaggedLines = new Set<number>();
  let lastDiagnosticFingerprint = '';

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

    // 1. Diagnostic Error Decoration: Radiant Crimson Neon
    diagErrorDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: `#FF1744${getHexAlpha(glowOpacity * 1.1)}`,
      border: `1px solid #FF1744${getHexAlpha(0.4)}`,
      borderRadius: '3px',
      overviewRulerColor: '#FF1744',
      overviewRulerLane: vscode.OverviewRulerLane.Right
    });

    // 2. Diagnostic Warning Decoration: Toxic Amber Neon
    diagWarnDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: `#FFA600${getHexAlpha(glowOpacity * 0.95)}`,
      border: `1px solid #FFA600${getHexAlpha(0.35)}`,
      borderRadius: '3px',
      overviewRulerColor: '#FFA600',
      overviewRulerLane: vscode.OverviewRulerLane.Right
    });

    // 3. Diagnostic Info Decoration: Cyber Cyan
    diagInfoDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: `#00F0FF${getHexAlpha(glowOpacity * 0.7)}`,
      border: `1px solid #00F0FF${getHexAlpha(0.25)}`,
      borderRadius: '3px'
    });

    // 4. Audit Lens Dimming Decoration: Drops non-flagged code to dimOpacity
    auditDimDecoration = vscode.window.createTextEditorDecorationType({
      opacity: dimOpacity.toString()
    });

    // 5. Untagged Comment Decoration: Ultra-subtle (disabled by default)
    untaggedCommentDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: `#6272A4${getHexAlpha(0.04)}`,
      fontStyle: 'italic'
    });
  }

  initStaticDecorations();

  function getCommentDecorationType(hex: string, strikethrough: boolean = false): vscode.TextEditorDecorationType {
    const config = vscode.workspace.getConfiguration('glowComments');
    const enableGlow = config.get<boolean>('enableGlow', true);
    const glowOpacity = config.get<number>('glowOpacity', 0.14);
    const enableBorder = config.get<boolean>('enableBorder', true);
    const isBold = config.get<boolean>('bold', true);

    const cacheKey = `${hex.toUpperCase()}_glow:${enableGlow}_strike:${strikethrough}_border:${enableBorder}_bold:${isBold}`;

    if (commentDecorationCache.has(cacheKey)) {
      return commentDecorationCache.get(cacheKey)!;
    }

    const renderOptions: vscode.DecorationRenderOptions = {
      color: hex,
      fontWeight: isBold ? 'bold' : 'normal',
      textDecoration: strikethrough ? 'line-through' : undefined
    };

    if (enableGlow) {
      renderOptions.backgroundColor = `${hex}${getHexAlpha(glowOpacity)}`;
      renderOptions.borderRadius = '3px';
    }

    if (enableBorder && enableGlow) {
      renderOptions.border = `1px solid ${hex}${getHexAlpha(0.35)}`;
    }

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
    const combinedPresets = { ...NEON_PRESETS, ...customPresets };
    const glowUntagged = config.get<boolean>('glowUntaggedComments', false);

    const rangeBuckets = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
    const untaggedRanges: vscode.Range[] = [];
    const flaggedCommentLines = new Set<number>();

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
      let matchedHex: string | null = null;
      let isStrike = false;
      let isRisk = false;

      // Pattern 1: Inline hex code [#RRGGBB] or [#RGB]
      const hexMatch = trimmed.match(/^\[#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\]/i);
      if (hexMatch) {
        let rawHex = hexMatch[1];
        if (rawHex.length === 3) {
          rawHex = rawHex.split('').map(c => c + c).join('');
        }
        matchedHex = `#${rawHex}`;
      }

      // Pattern 2: Named neon preset tag [#cyan], [cyan], or @glow(cyan)
      if (!matchedHex) {
        const namedMatch = trimmed.match(/^\[#?([a-zA-Z0-9_-]+)\]/i) || trimmed.match(/^@glow\(([a-zA-Z0-9_-]+)\)/i);
        if (namedMatch) {
          const tagName = namedMatch[1].toLowerCase();
          if (combinedPresets[tagName]) {
            matchedHex = combinedPresets[tagName];
          }
        }
      }

      // Pattern 3: Semantic shortcuts (!, ?, TODO, *, HACK, FIXME, NOTE, //)
      if (!matchedHex) {
        for (const [prefix, def] of Object.entries(SEMANTIC_TAGS)) {
          if (prefix === '*' && (delimiter === '/*' || delimiter === '<!--')) {
            continue;
          }
          if (trimmed.startsWith(prefix) || trimmed.startsWith(`[${prefix}]`)) {
            matchedHex = def.color;
            isStrike = !!def.strike;
            isRisk = !!def.isRisk;
            break;
          }
        }
      }

      const startPos = doc.positionAt(match.index);
      const endPos = doc.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);

      if (matchedHex) {
        const decType = getCommentDecorationType(matchedHex, isStrike);
        getBucket(decType).push(range);
        flaggedCommentLines.add(startPos.line);
        if (isRisk) {
          currentFlaggedLines.add(startPos.line);
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

    currentFlaggedLines = diagFlaggedLines;

    if (isAuditLensActive) {
      applyAuditLens();
    }
  }

  // --- ENGINE 3: RISK-SCOPED AUDIT LENS (Cmd + Shift + G) ---
  function applyAuditLens() {
    if (!activeEditor || !auditDimDecoration) return;

    if (!isAuditLensActive) {
      activeEditor.setDecorations(auditDimDecoration, []);
      auditLensStatusBar.text = '$(eye-closed) Audit Lens: OFF';
      auditLensStatusBar.tooltip = 'Click to toggle Risk Audit Lens (Cmd+Shift+G)';
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

  context.subscriptions.push(insertTagCmd, toggleGlowCmd, toggleAuditLensCmd);

  // Initial pass on activation
  if (activeEditor) {
    triggerUpdateComments(false);
    triggerUpdateDiagnostics();
    auditLensStatusBar.text = '$(eye-closed) Audit Lens: OFF';
    auditLensStatusBar.show();
  }
}

export function deactivate() {}
