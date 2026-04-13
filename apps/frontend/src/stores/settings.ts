import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TerminalTheme } from '../lib/themes'

export type CursorStyle = 'block' | 'bar' | 'underline'

interface SettingsState {
  terminalTheme: TerminalTheme
  fontSize: number
  cursorStyle: CursorStyle
  cursorBlink: boolean
  setTerminalTheme: (theme: TerminalTheme) => void
  setFontSize: (size: number) => void
  setCursorStyle: (style: CursorStyle) => void
  setCursorBlink: (blink: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      terminalTheme: 'dark',
      fontSize: 14,
      cursorStyle: 'block',
      cursorBlink: true,
      setTerminalTheme: (terminalTheme) => set({ terminalTheme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCursorStyle: (cursorStyle) => set({ cursorStyle }),
      setCursorBlink: (cursorBlink) => set({ cursorBlink }),
    }),
    { name: 'isovershell-settings' }
  )
)
