import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { TerminalArea } from './Terminal/TerminalArea'
import { useSessionStore } from '../stores/sessions'

export function Layout() {
  const sessions = useSessionStore(s => s.sessions)

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {sessions.length > 0 ? <TerminalArea /> : <Outlet />}
      </main>
    </div>
  )
}
