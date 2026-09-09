import { create } from 'zustand'
import type { Theme } from '../types/electron'

interface PrefsState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Seed from electron-store synchronously (preload exposes a sync getter) so the
// first render already has the right theme and there is no flash. Optional
// chaining keeps the app alive if the preload bridge is ever unavailable.
export const usePrefsStore = create<PrefsState>((set) => ({
  theme: window.electron?.getTheme?.() ?? 'system',
  setTheme: (theme) => {
    window.electron?.setTheme?.(theme)
    set({ theme })
  },
}))
