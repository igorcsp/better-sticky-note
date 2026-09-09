export type Theme = 'light' | 'dark' | 'system'

export interface IElectronAPI {
  openNote: (id: string) => void
  closeNote: (id: string) => void
  openDashboard: () => void
  openShortcuts: () => void
  getTheme: () => Theme
  setTheme: (theme: Theme) => void
  closeSelf: () => void
  minimizeSelf: () => void
  toggleAlwaysOnTop: () => Promise<boolean>
  // Registers a tray/hotkey new-note listener; returns an unsubscribe function.
  onNewNote: (cb: () => void) => () => void
}

declare global {
  interface Window {
    electron: IElectronAPI
  }
}
