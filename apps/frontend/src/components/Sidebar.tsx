import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { Monitor, Settings, LogOut, User } from 'lucide-react'
import { useSessionStore } from '../stores/sessions'
import { useAuthStore } from '../stores/auth'
import { api } from '../lib/api'
import type { Host } from '@isovershell/types'

export function Sidebar() {
  const { data: hosts = [] } = useQuery<Host[]>({
    queryKey: ['hosts'],
    queryFn: () => api('/api/hosts').then(r => r.json()),
  })

  const openSession = useSessionStore(s => s.openSession)
  const { username, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <aside style={{
      width: 240,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>ISOverShell</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>SSH Manager</div>
      </div>

      {/* Host list */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          color: 'var(--text-muted)', padding: '4px 8px 6px', textTransform: 'uppercase',
        }}>
          Hosts
        </div>

        {hosts.map(host => (
          <SidebarItem
            key={host.id}
            label={host.label}
            sub={`${host.username}@${host.hostname}`}
            onClick={() => openSession({ hostId: host.id, label: host.label, hostname: host.hostname })}
          />
        ))}

        {hosts.length === 0 && (
          <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-muted)' }}>
            No hosts yet
          </div>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <SidebarItem label="Dashboard" icon={<Monitor size={14} />} />
        </Link>
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <SidebarItem label="Settings" icon={<Settings size={14} />} />
        </Link>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />

        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
          <Link to="/profile" style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
            <SidebarItem label={username ?? ''} icon={<User size={14} />} />
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '6px 6px',
              borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({
  label, sub, icon, onClick,
}: {
  label: string
  sub?: string
  icon?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 8px', borderRadius: 6,
        background: 'transparent', border: 'none',
        color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon && <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>}
      {!icon && <Monitor size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sub}
          </div>
        )}
      </div>
    </button>
  )
}
