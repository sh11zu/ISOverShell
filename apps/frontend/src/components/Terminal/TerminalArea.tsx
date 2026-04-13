import { X } from 'lucide-react'
import { useSessionStore } from '../../stores/sessions'
import { useSettingsStore } from '../../stores/settings'
import { XTerm } from './XTerm'

export function TerminalArea() {
  const { sessions, activeId, closeSession, setActive } = useSessionStore()
  const { terminalTheme, fontSize, cursorStyle, cursorBlink } = useSettingsStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto', flexShrink: 0,
      }}>
        {sessions.map(s => {
          const isActive = s.id === activeId
          return (
            <div
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', cursor: 'pointer',
                borderRight: '1px solid var(--border)',
                borderTop: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                background: isActive ? 'var(--bg)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                whiteSpace: 'nowrap', fontSize: 13,
                transition: 'background 0.1s',
              }}
            >
              <span>{s.label}</span>
              <button
                onClick={e => { e.stopPropagation(); closeSession(s.id) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', padding: 0, display: 'flex', alignItems: 'center',
                  opacity: 0.6,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
              >
                <X size={11} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Terminal panels */}
      <div style={{ flex: 1, position: 'relative' }}>
        {sessions.map(s => (
          <div
            key={s.id}
            style={{
              position: 'absolute', inset: 0,
              display: s.id === activeId ? 'block' : 'none',
            }}
          >
            <XTerm
                hostId={s.hostId}
                sessionId={s.id}
                theme={terminalTheme}
                fontSize={fontSize}
                cursorStyle={cursorStyle}
                cursorBlink={cursorBlink}
              />
          </div>
        ))}
      </div>
    </div>
  )
}
