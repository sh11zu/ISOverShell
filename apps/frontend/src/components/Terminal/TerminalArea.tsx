import { X, Monitor, LayoutDashboard, Settings, User } from 'lucide-react'
import { useSessionStore } from '../../stores/sessions'
import { useSettingsStore } from '../../stores/settings'
import { XTerm } from './XTerm'
import { Dashboard } from '../../pages/Dashboard'
import { Settings as SettingsPage } from '../../pages/Settings'
import { Profile } from '../../pages/Profile'
import type { PageKind } from '../../stores/sessions'

const PAGE_ICON: Record<PageKind, React.ReactNode> = {
  dashboard: <LayoutDashboard size={12} />,
  settings:  <Settings size={12} />,
  profile:   <User size={12} />,
}

function PagePanel({ page }: { page: PageKind }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'settings'  && <SettingsPage />}
      {page === 'profile'   && <Profile />}
    </div>
  )
}

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
              {s.kind === 'page' && s.page && (
                <span style={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>
                  {PAGE_ICON[s.page]}
                </span>
              )}
              {s.kind === 'terminal' && (
                <span style={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>
                  <Monitor size={12} />
                </span>
              )}
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

      {/* Panels */}
      <div style={{ flex: 1, position: 'relative' }}>
        {sessions.map(s => (
          <div
            key={s.id}
            style={{
              position: 'absolute', inset: 0,
              display: s.id === activeId ? 'flex' : 'none',
              flexDirection: 'column',
            }}
          >
            {s.kind === 'terminal' ? (
              <XTerm
                hostId={s.hostId!}
                sessionId={s.id}
                theme={terminalTheme}
                fontSize={fontSize}
                cursorStyle={cursorStyle}
                cursorBlink={cursorBlink}
              />
            ) : (
              <PagePanel page={s.page!} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
