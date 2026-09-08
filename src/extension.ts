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
const SEMANTIC_TAGS: Record<string, { color: string; strike?: boolean }> = {
  '!': { color: '#FF2A4B' },       // Alert / Critical Red
  '?': { color: '#00C8FF' },       // Question / Exploration Blue
  TODO: { color: '#FFA600' },     // Task / TODO Gold
  '*': { color: '#00FFA3' },       // Highlight / Focus Green
  HACK: { color: '#BD00FF' },      // Tech Debt Purple
  FIXME: { color: '#FF5500' },     // Urgent Bug Orange
  NOTE: { color: '#00F0FF' },      // System Note Cyan
  '//': { color: '#6272A4', strike: true } // Strikethrough / Deprecated
};

export function activate(context: vscode.ExtensionContext) {
  const decorationCache = new Map<string, vscode.TextEditorDecorationType>();
  let activeEditor = vscode.window.activeTextEditor;
  let updateTimeout: NodeJS.Timeout | undefined;

  function getHexAlpha(opacity: number): string {
    const alpha = Math.round(Math.min(Math.max(opacity, 0), 1) * 255);
    return alpha.toString(16).padStart(2, '0');
  }

  function getDecorationType(hex: string, strikethrough: boolean = false): vscode.TextEditorDecorationType {
    const config = vscode.workspace.getConfiguration('glowComments');
    const enableGlow = config.get<boolean>('enableGlow', true);
    const glowOpacity = config.get<number>('glowOpacity', 0.14);
    const enableBorder = config.get<boolean>('enableBorder', true);
    const isBold = config.get<boolean>('bold', true);

    const cacheKey = `${hex.toUpperCase()}_glow:${enableGlow}_strike:${strikethrough}_border:${enableBorder}_bold:${isBold}`;

    if (decorationCache.has(cacheKey)) {
      return decorationCache.get(cacheKey)!;
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
    decorationCache.set(cacheKey, dec);
    return dec;
  }

  function clearAllDecorations() {
    decorationCache.forEach(dec => dec.dispose());
    decorationCache.clear();
  }

  function triggerUpdateDecorations(throttle: boolean = true) {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = undefined;
    }

    if (throttle) {
      updateTimeout = setTimeout(() => updateDecorations(), 60);
    } else {
      updateDecorations();
    }
  }

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    const doc = activeEditor.document;
    const text = doc.getText();
    const config = vscode.workspace.getConfiguration('glowComments');
    const customPresets = config.get<Record<string, string>>('customPresets', {});
    const combinedPresets = { ...NEON_PRESETS, ...customPresets };

    // Buckets for ranges grouped by decoration type
    const rangeBuckets = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

    const getBucket = (dec: vscode.TextEditorDecorationType): vscode.Range[] => {
      let bucket = rangeBuckets.get(dec);
      if (!bucket) {
        bucket = [];
        rangeBuckets.set(dec, bucket);
      }
      return bucket;
    };

    // Regex to match comment lines across programming languages:
    // 1. Single-line: //, #, --, ;, %
    // 2. Multi-line tokens: /* ... */ or <!-- ... -->
    const commentRegex = /(?:\/\/|#|--|;|%|\/\*|<!--)\s*([^\r\n*]*)/g;
    let match: RegExpExecArray | null;

    while ((match = commentRegex.exec(text)) !== null) {
      const commentContent = match[1];
      if (!commentContent) continue;

      const trimmed = commentContent.trim();
      let matchedHex: string | null = null;
      let isStrike = false;

      // Check Pattern 1: Inline hex code [#RRGGBB] or [#RGB]
      const hexMatch = trimmed.match(/^\[#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\]/i);
      if (hexMatch) {
        let rawHex = hexMatch[1];
        if (rawHex.length === 3) {
          rawHex = rawHex.split('').map(c => c + c).join('');
        }
        matchedHex = `#${rawHex}`;
      }

      // Check Pattern 2: Named neon preset tag [#cyan], [cyan], or @glow(cyan)
      if (!matchedHex) {
        const namedMatch = trimmed.match(/^\[#?([a-zA-Z0-9_-]+)\]/i) || trimmed.match(/^@glow\(([a-zA-Z0-9_-]+)\)/i);
        if (namedMatch) {
          const tagName = namedMatch[1].toLowerCase();
          if (combinedPresets[tagName]) {
            matchedHex = combinedPresets[tagName];
          }
        }
      }

      // Check Pattern 3: Semantic shortcuts (!, ?, TODO, *, HACK, FIXME, NOTE, //)
      if (!matchedHex) {
        for (const [prefix, def] of Object.entries(SEMANTIC_TAGS)) {
          if (trimmed.startsWith(prefix) || trimmed.startsWith(`[${prefix}]`)) {
            matchedHex = def.color;
            isStrike = !!def.strike;
            break;
          }
        }
      }

      if (matchedHex) {
        const startPos = doc.positionAt(match.index);
        const endPos = doc.positionAt(match.index + match[0].length);
        const decType = getDecorationType(matchedHex, isStrike);
        getBucket(decType).push(new vscode.Range(startPos, endPos));
      }
    }

    // Apply decorations across all buckets
    decorationCache.forEach(dec => {
      const ranges = rangeBuckets.get(dec) || [];
      activeEditor!.setDecorations(dec, ranges);
    });
  }

  // 1. Editor event listeners
  vscode.window.onDidChangeActiveTextEditor(editor => {
    activeEditor = editor;
    if (editor) {
      triggerUpdateDecorations(false);
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (activeEditor && event.document === activeEditor.document) {
      triggerUpdateDecorations(true);
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('glowComments')) {
      clearAllDecorations();
      triggerUpdateDecorations(false);
    }
  }, null, context.subscriptions);

  // 2. Interactive Command: Insert Tag
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

  // 3. Interactive Command: Toggle Glow Aura
  const toggleGlowCmd = vscode.commands.registerCommand('glowComments.toggleGlow', async () => {
    const config = vscode.workspace.getConfiguration('glowComments');
    const current = config.get<boolean>('enableGlow', true);
    await config.update('enableGlow', !current, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`Glow Comments Aura: ${!current ? 'ENABLED' : 'DISABLED'}`);
  });

  context.subscriptions.push(insertTagCmd, toggleGlowCmd);

  // Initial pass on start
  if (activeEditor) {
    triggerUpdateDecorations(false);
  }
}

export function deactivate() {}
