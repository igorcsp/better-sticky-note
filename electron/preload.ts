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
})
