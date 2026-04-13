import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Monitor, Settings, LogOut, User, LayoutDashboard } from 'lucide-react'
import { useSessionStore } from '../stores/sessions'
import { useAuthStore } from '../stores/auth'
import { api } from '../lib/api'
import type { Host } from '@isovershell/types'
import type { PageKind } from '../stores/sessions'

export function Sidebar() {
  const { data: hosts = [] } = useQuery<Host[]>({
    queryKey: ['hosts'],
    queryFn: () => api('/api/hosts').then(r => r.json()),
  })

  const sessions = useSessionStore(s => s.sessions)
  const openSession = useSessionStore(s => s.openSession)
  const { username, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const allTags = [...new Set(hosts.flatMap(h => h.tags))].sort()
  const filteredHosts = tagFilter ? hosts.filter(h => h.tags.includes(tagFilter)) : hosts

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const handlePageNav = (page: PageKind, label: string) => {
    if (sessions.length > 0) {
      openSession({ kind: 'page', page, label })
    } else {
      navigate(page === 'dashboard' ? '/' : `/${page}`)
    }
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

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '2px 8px 8px' }}>
            <SidebarTagPill
              label="All"
              active={tagFilter === null}
              onClick={() => setTagFilter(null)}
            />
            {allTags.map(tag => (
              <SidebarTagPill
                key={tag}
                label={tag}
                active={tagFilter === tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              />
            ))}
          </div>
        )}

        {filteredHosts.map(host => (
          <SidebarItem
            key={host.id}
            label={host.label}
            sub={`${host.username}@${host.hostname}`}
            onClick={() => openSession({ kind: 'terminal', hostId: host.id, label: host.label, hostname: host.hostname })}
          />
        ))}

        {hosts.length === 0 && (
          <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-muted)' }}>
            No hosts yet
          </div>
        )}
        {hosts.length > 0 && filteredHosts.length === 0 && (
          <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-muted)' }}>
            No hosts with tag "{tagFilter}"
          </div>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        <SidebarItem
          label="Dashboard"
          icon={<LayoutDashboard size={14} />}
          onClick={() => handlePageNav('dashboard', 'Dashboard')}
        />
        <SidebarItem
          label="Settings"
          icon={<Settings size={14} />}
          onClick={() => handlePageNav('settings', 'Settings')}
        />

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />

        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SidebarItem
              label={username ?? ''}
              icon={<User size={14} />}
              onClick={() => handlePageNav('profile', 'Profile')}
            />
          </div>
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

function SidebarTagPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
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
