import { create } from 'zustand'

export interface OpenSession {
  id: string
  hostId: number
  label: string
  hostname: string
}

interface SessionStore {
  sessions: OpenSession[]
  activeId: string | null
  openSession: (host: Pick<OpenSession, 'hostId' | 'label' | 'hostname'>) => void
  closeSession: (id: string) => void
  setActive: (id: string) => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeId: null,

  openSession(host) {
    const id = `s-${Date.now()}`
    set(s => ({
      sessions: [...s.sessions, { id, ...host }],
      activeId: id,
    }))
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
