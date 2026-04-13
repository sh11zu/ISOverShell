// ─── Terminal themes ──────────────────────────────────────────────────────────
// Shared between XTerm renderer and Settings preview swatches.

export const THEMES = {
  dark: {
    background: '#0f0f0f', foreground: '#e5e5e5', cursor: '#6366f1',
    selectionBackground: '#6366f130',
    black: '#1a1a1a',   red: '#ef4444',   green: '#22c55e',  yellow: '#eab308',
    blue: '#3b82f6',    magenta: '#a855f7', cyan: '#06b6d4', white: '#e5e5e5',
    brightBlack: '#404040', brightRed: '#f87171',   brightGreen: '#4ade80',  brightYellow: '#facc15',
    brightBlue: '#60a5fa',  brightMagenta: '#c084fc', brightCyan: '#22d3ee', brightWhite: '#ffffff',
  },
  dracula: {
    background: '#282a36', foreground: '#f8f8f2', cursor: '#ff79c6',
    selectionBackground: '#44475a',
    black: '#21222c',   red: '#ff5555',   green: '#50fa7b',  yellow: '#f1fa8c',
    blue: '#bd93f9',    magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94', brightYellow: '#ffffa5',
    brightBlue: '#d6acff',  brightMagenta: '#ff92df', brightCyan: '#a4ffff', brightWhite: '#ffffff',
  },
  'tokyo-night': {
    background: '#1a1b26', foreground: '#c0caf5', cursor: '#c0caf5',
    selectionBackground: '#283457',
    black: '#15161e',   red: '#f7768e',   green: '#9ece6a',  yellow: '#e0af68',
    blue: '#7aa2f7',    magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
    brightBlack: '#414868', brightRed: '#f7768e',   brightGreen: '#9ece6a',  brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',  brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5',
  },
  gruvbox: {
    background: '#282828', foreground: '#ebdbb2', cursor: '#fabd2f',
    selectionBackground: '#504945',
    black: '#282828',   red: '#cc241d',   green: '#98971a',  yellow: '#d79921',
    blue: '#458588',    magenta: '#b16286', cyan: '#689d6a', white: '#a89984',
    brightBlack: '#928374', brightRed: '#fb4934',   brightGreen: '#b8bb26',  brightYellow: '#fabd2f',
    brightBlue: '#83a598',  brightMagenta: '#d3869b', brightCyan: '#8ec07c', brightWhite: '#ebdbb2',
  },
} as const

export type TerminalTheme = keyof typeof THEMES

// Metadata used by the Settings page to render theme swatches
export const THEME_META: Record<TerminalTheme, { label: string; palette: string[] }> = {
  dark: {
    label: 'Dark',
    palette: ['#0f0f0f', '#6366f1', '#22c55e', '#ef4444', '#eab308'],
  },
  dracula: {
    label: 'Dracula',
    palette: ['#282a36', '#ff79c6', '#50fa7b', '#ff5555', '#f1fa8c'],
  },
  'tokyo-night': {
    label: 'Tokyo Night',
    palette: ['#1a1b26', '#7aa2f7', '#9ece6a', '#f7768e', '#e0af68'],
  },
  gruvbox: {
    label: 'Gruvbox',
    palette: ['#282828', '#fabd2f', '#b8bb26', '#fb4934', '#83a598'],
  },
}
