export type Theme = 'light' | 'dark' | 'system'

export interface IElectronAPI {
  openNote: (id: string) => void
  closeNote: (id: string) => void
  openDashboard: () => void
  openShortcuts: () => void
  getTheme: () => Theme
  setTheme: (theme: Theme) => void
}

declare global {
  interface Window {
    electron: IElectronAPI
  }
}
