// ─── Entities ────────────────────────────────────────────────────────────────

export interface Group {
  id: number
  name: string
  color: string
  icon: string
  created_at: string
}

export interface Host {
  id: number
  label: string
  hostname: string
  port: number
  username: string
  auth_type: 'password' | 'key'
  group_id: number | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface SessionHistory {
  id: number
  host_id: number
  connected_at: string
  disconnected_at: string | null
  duration_seconds: number | null
}

// ─── WebSocket protocol ───────────────────────────────────────────────────────

export type WsMessageType =
  | 'connect'
  | 'data'
  | 'resize'
  | 'disconnect'
  | 'connected'
  | 'error'

export interface WsMessage<T = unknown> {
  type: WsMessageType
  payload?: T
}

export interface WsConnectPayload  { host_id: number }
export interface WsDataPayload     { data: string }
export interface WsResizePayload   { cols: number; rows: number }
export interface WsConnectedPayload { host: string }

// ─── Terminal themes ──────────────────────────────────────────────────────────

export interface TerminalTheme {
  id: string
  name: string
  background: string
  foreground: string
  cursor: string
  selectionBackground: string
  black: string; red: string; green: string; yellow: string
  blue: string; magenta: string; cyan: string; white: string
  brightBlack: string; brightRed: string; brightGreen: string; brightYellow: string
  brightBlue: string; brightMagenta: string; brightCyan: string; brightWhite: string
}
