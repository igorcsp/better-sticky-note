import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  openNote: (id: string) => ipcRenderer.send('note:open', id),
  closeNote: (id: string) => ipcRenderer.send('note:close', id),
  openDashboard: () => ipcRenderer.send('dashboard:open'),
})
