import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Monitor, Settings } from 'lucide-react'
import { useSessionStore } from '../stores/sessions'
import type { Host } from '@isovershell/types'

export function Sidebar() {
  const { data: hosts = [] } = useQuery<Host[]>({
    queryKey: ['hosts'],
    queryFn: () => fetch('/api/hosts').then(r => r.json()),
  })

  const openSession = useSessionStore(s => s.openSession)

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
      {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
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
