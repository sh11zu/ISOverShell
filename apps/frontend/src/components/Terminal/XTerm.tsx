import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

// ─── Themes ───────────────────────────────────────────────────────────────────

const THEMES = {
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
} as const

// ─── Component ────────────────────────────────────────────────────────────────

interface XTermProps {
  hostId: number
  sessionId: string
  theme?: keyof typeof THEMES
  fontSize?: number
}

export function XTerm({ hostId, sessionId, theme = 'dark', fontSize = 14 }: XTermProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      theme: THEMES[theme],
      fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
      fontSize,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
      scrollback: 5000,
    })

    const fitAddon   = new FitAddon()
    const linksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(linksAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    // ── WebSocket ──────────────────────────────────────────────────────────
    const wsProto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${wsProto}://${location.host}/ws/terminal/${hostId}`)

    ws.onopen = () => term.writeln('\x1b[2mConnecting…\x1b[0m')

    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data as string)
        switch (msg.type) {
          case 'data':
            term.write(msg.payload)
            break
          case 'connected':
            term.writeln(`\x1b[32m✓ Connected to ${msg.payload.host}\x1b[0m\r\n`)
            break
          case 'error':
            term.writeln(`\r\n\x1b[31m✗ ${msg.payload}\x1b[0m`)
            break
          case 'disconnect':
            term.writeln(`\r\n\x1b[33mSession closed.\x1b[0m`)
            break
        }
      } catch { /* ignore */ }
    }

    ws.onclose = () => term.writeln('\r\n\x1b[33mDisconnected.\x1b[0m')

    // ── Input → SSH ────────────────────────────────────────────────────────
    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ type: 'data', payload: data }))
    })

    // ── Resize ─────────────────────────────────────────────────────────────
    const sendResize = () => {
      fitAddon.fit()
      if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ type: 'resize', payload: { cols: term.cols, rows: term.rows } }))
    }

    const ro = new ResizeObserver(sendResize)
    ro.observe(containerRef.current)

    // ── Right-click → paste ────────────────────────────────────────────────
    const onContextMenu = async (e: MouseEvent) => {
      e.preventDefault()
      const text = await navigator.clipboard.readText().catch(() => '')
      if (text) term.paste(text)
    }
    containerRef.current.addEventListener('contextmenu', onContextMenu)

    return () => {
      ro.disconnect()
      containerRef.current?.removeEventListener('contextmenu', onContextMenu)
      ws.close()
      term.dispose()
    }
  }, [hostId, theme, fontSize])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: THEMES[theme].background, padding: 4 }}
    />
  )
}
