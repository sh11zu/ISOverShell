import { create } from 'zustand'

export type PageKind = 'dashboard' | 'settings' | 'profile'

export interface OpenSession {
  id: string
  kind: 'terminal' | 'page'
  label: string
  hostId?: number
  hostname?: string
  page?: PageKind
}

interface SessionStore {
  sessions: OpenSession[]
  activeId: string | null
  openSession: (opts:
    | { kind: 'terminal'; hostId: number; label: string; hostname: string }
    | { kind: 'page'; page: PageKind; label: string }
  ) => void
  closeSession: (id: string) => void
  setActive: (id: string) => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeId: null,

  openSession(opts) {
    if (opts.kind === 'page') {
      const existing = get().sessions.find(s => s.kind === 'page' && s.page === opts.page)
      if (existing) {
        set({ activeId: existing.id })
        return
      }
    }
    const id = `s-${Date.now()}`
    const session: OpenSession =
      opts.kind === 'terminal'
        ? { id, kind: 'terminal', label: opts.label, hostId: opts.hostId, hostname: opts.hostname }
        : { id, kind: 'page', label: opts.label, page: opts.page }
    set(s => ({ sessions: [...s.sessions, session], activeId: id }))
  },

  closeSession(id) {
    const { sessions, activeId } = get()
    const next = sessions.filter(s => s.id !== id)
    const newActive =
      activeId === id
        ? (next.length > 0 ? next[next.length - 1].id : null)
        : activeId
    set({ sessions: next, activeId: newActive })
  },

  setActive(id) {
    set({ activeId: id })
  },
}))
