export interface IElectronAPI {
  openNote: (id: string) => void
  closeNote: (id: string) => void
  openDashboard: () => void
}

declare global {
  interface Window {
    electron: IElectronAPI
  }
}
