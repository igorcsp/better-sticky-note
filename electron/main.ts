import { app, ipcMain } from 'electron'
import Store from 'electron-store'
import * as windowManager from './windowManager'

interface StoreSchema {
  openNoteIds: string[]
}

const store = new Store<StoreSchema>({
  defaults: { openNoteIds: [] },
})

app.whenReady().then(() => {
  ipcMain.on('note:open', (_event, id: string) => {
    windowManager.openNote(id)
  })

  ipcMain.on('note:close', (_event, id: string) => {
    windowManager.closeNote(id)
  })

  ipcMain.on('dashboard:open', () => {
    windowManager.openDashboard()
  })

  windowManager.openDashboard()

  const savedNoteIds = store.get('openNoteIds', [])
  for (const id of savedNoteIds) {
    windowManager.openNote(id)
  }
})

app.on('before-quit', () => {
  store.set('openNoteIds', windowManager.getOpenNoteIds())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
