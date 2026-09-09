import { contextBridge, ipcRenderer } from 'electron'

type Theme = 'light' | 'dark' | 'system'

contextBridge.exposeInMainWorld('electron', {
  openNote: (id: string) => ipcRenderer.send('note:open', id),
  closeNote: (id: string) => ipcRenderer.send('note:close', id),
  openDashboard: () => ipcRenderer.send('dashboard:open'),
  openShortcuts: () => ipcRenderer.send('shortcuts:open'),
  // Synchronous so App can apply the theme class before first paint.
  getTheme: (): Theme => ipcRenderer.sendSync('prefs:get-theme'),
  setTheme: (theme: Theme) => ipcRenderer.send('prefs:set-theme', theme),
  // Frameless window controls — act on the calling window.
  closeSelf: () => ipcRenderer.send('window:close'),
  minimizeSelf: () => ipcRenderer.send('window:minimize'),
  toggleAlwaysOnTop: (): Promise<boolean> =>
    ipcRenderer.invoke('window:toggle-always-on-top'),
  // Tray/hotkey new-note signal. Returns an unsubscribe function.
  onNewNote: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('new-note', listener)
    return () => ipcRenderer.removeListener('new-note', listener)
  },
  clearGoogleSession: (): Promise<void> => ipcRenderer.invoke('auth:clear-google-session'),
})
