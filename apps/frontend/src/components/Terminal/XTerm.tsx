import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { THEMES } from '../../lib/themes'
import type { TerminalTheme } from '../../lib/themes'
import type { CursorStyle } from '../../stores/settings'

// ─── Clipboard fallback (HTTP / older browsers) ───────────────────────────────
function copyFallback(text: string) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  el.remove()
}

// ─── Component ────────────────────────────────────────────────────────────────

interface XTermProps {
  hostId: number
  sessionId: string
  theme?: TerminalTheme
  fontSize?: number
  cursorStyle?: CursorStyle
  cursorBlink?: boolean
}

export function XTerm({
  hostId,
  sessionId: _sessionId,
  theme = 'dark',
  fontSize = 14,
  cursorStyle = 'block',
  cursorBlink = true,
}: XTermProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const termRef       = useRef<Terminal | null>(null)
  const fitAddonRef   = useRef<FitAddon | null>(null)
  const themeRef      = useRef(theme)
  const fontSizeRef   = useRef(fontSize)
  const cursorStyleRef = useRef(cursorStyle)
  const cursorBlinkRef = useRef(cursorBlink)

  // ── Initialize terminal + WebSocket (only when host changes) ──────────────
  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      theme: THEMES[themeRef.current],
      fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
      fontSize: fontSizeRef.current,
      lineHeight: 1.2,
      cursorBlink: cursorBlinkRef.current,
      cursorStyle: cursorStyleRef.current,
      allowProposedApi: true,
      scrollback: 5000,
    })

    const fitAddon   = new FitAddon()
    const linksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(linksAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current    = term
    fitAddonRef.current = fitAddon

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

    // ── Toast helper ───────────────────────────────────────────────────────
    const showToast = (msg: string) => {
      const el = document.createElement('div')
      el.textContent = msg
      el.style.cssText = [
        'position:absolute;bottom:14px;left:50%;transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75);color:#e5e5e5;padding:5px 14px',
        'border-radius:6px;font-size:12px;pointer-events:none;z-index:10',
        'white-space:nowrap;backdrop-filter:blur(4px)',
      ].join(';')
      containerRef.current?.appendChild(el)
      setTimeout(() => el.remove(), 2500)
    }

    // ── Right-click → paste ────────────────────────────────────────────────
    const onContextMenu = async (e: MouseEvent) => {
      e.preventDefault()
      if (!navigator.clipboard?.readText) {
        showToast('Clipboard requires HTTPS — use Ctrl+Shift+V')
        return
      }
      const text = await navigator.clipboard.readText().catch(() => null)
      if (text == null) {
        showToast('Clipboard access denied — allow it in browser settings')
        return
      }
      if (text) term.paste(text)
    }
    // capture:true = intercepts before xterm's internal textarea shows the browser menu
    containerRef.current.addEventListener('contextmenu', onContextMenu, { capture: true })

    // ── Selection → auto-copy ──────────────────────────────────────────────
    term.onSelectionChange(() => {
      const text = term.getSelection()
      if (!text) return
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => copyFallback(text))
      } else {
        copyFallback(text)
      }
    })

    return () => {
      ro.disconnect()
      containerRef.current?.removeEventListener('contextmenu', onContextMenu, { capture: true })
      ws.close()
      term.dispose()
      termRef.current    = null
      fitAddonRef.current = null
    }
  }, [hostId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Apply theme without reconnecting ─────────────────────────────────────
  useEffect(() => {
    themeRef.current = theme
    if (termRef.current) termRef.current.options.theme = THEMES[theme]
  }, [theme])

  // ── Apply font size without reconnecting ──────────────────────────────────
  useEffect(() => {
    fontSizeRef.current = fontSize
    if (termRef.current && fitAddonRef.current) {
      termRef.current.options.fontSize = fontSize
      fitAddonRef.current.fit()
    }
  }, [fontSize])

  // ── Apply cursor settings without reconnecting ────────────────────────────
  useEffect(() => {
    cursorStyleRef.current = cursorStyle
    cursorBlinkRef.current = cursorBlink
    if (termRef.current) {
      termRef.current.options.cursorStyle = cursorStyle
      termRef.current.options.cursorBlink = cursorBlink
    }
  }, [cursorStyle, cursorBlink])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: THEMES[theme].background, padding: 4 }}
    />
  )
}
