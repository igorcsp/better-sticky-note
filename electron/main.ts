import { app, ipcMain, Menu } from 'electron'
import * as windowManager from './windowManager'
import { store, type Theme } from './store'

/**
 * Drop Electron's default menu.
 *
 * Its Edit submenu registers Ctrl+Z / Ctrl+Shift+Z / Ctrl+A as `role`
 * accelerators, which are consumed at the app level before the renderer sees
 * the keystroke and then invoke Chromium's *native* document commands.
 * CodeMirror has no handling for `historyUndo`/`historyRedo` beforeinput
 * events, so those roles do not drive its `history()` state — undo/redo and
 * select-all in a note would silently do the wrong thing.
 *
 * (Scheduled for Phase 4; pulled forward because Phase 2's keybindings do not
 * work without it.) A View-only menu is kept in dev so reload and devtools
 * accelerators survive.
 */
function setupApplicationMenu(): void {
  // Same dev signal windowManager.ts uses to pick the renderer URL.
  if (!process.env['ELECTRON_RENDERER_URL']) {
    Menu.setApplicationMenu(null)
    return
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
    ])
  )
}

app.whenReady().then(() => {
  setupApplicationMenu()

  ipcMain.on('note:open', (_event, id: string) => {
    windowManager.openNote(id)
  })

  ipcMain.on('note:close', (_event, id: string) => {
    windowManager.closeNote(id)
  })

  ipcMain.on('dashboard:open', () => {
    windowManager.openDashboard()
  })

  ipcMain.on('shortcuts:open', () => {
    windowManager.openShortcuts()
  })

  // Theme preference. Read synchronously so the renderer can apply the class
  // before first paint (no flash); write on change.
  ipcMain.on('prefs:get-theme', (event) => {
    event.returnValue = store.get('theme')
  })

  ipcMain.on('prefs:set-theme', (_event, theme: Theme) => {
    store.set('theme', theme)
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
