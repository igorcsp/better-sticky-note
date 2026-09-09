import { app, ipcMain, Menu, Tray, BrowserWindow, globalShortcut, nativeImage } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as windowManager from './windowManager'
import { store, type Theme } from './store'
import { TRAY_ICON_DATA_URL } from './trayIcon'

// Kept alive for the app's lifetime; a dropped reference lets the OS reclaim the
// tray icon.
let tray: Tray | null = null
// The app lives in the tray after all windows close, so a normal window close is
// not a quit. Only the tray "Quit" (or OS quit) sets this.
let isQuitting = false

function setupTray(): void {
  const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL)
  tray = new Tray(icon)
  tray.setToolTip('Better Sticky Notes')
  const menu = Menu.buildFromTemplate([
    { label: 'New Note', click: () => windowManager.requestNewNote() },
    { label: 'Open Dashboard', click: () => windowManager.openDashboard() },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => windowManager.openDashboard())
}

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

  // Frameless window controls — act on whichever window sent the message.
  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window:toggle-always-on-top', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return false
    const next = !win.isAlwaysOnTop()
    win.setAlwaysOnTop(next)
    return next
  })

  // Theme preference. Read synchronously so the renderer can apply the class
  // before first paint (no flash); write on change.
  ipcMain.on('prefs:get-theme', (event) => {
    event.returnValue = store.get('theme')
  })

  ipcMain.on('prefs:set-theme', (_event, theme: Theme) => {
    store.set('theme', theme)
  })

  setupTray()

  // Global new-note hotkey. Registration can fail if another app owns the combo;
  // that's non-fatal, so we don't surface it.
  globalShortcut.register('CommandOrControl+Alt+N', () => windowManager.requestNewNote())

  windowManager.openDashboard()

  const savedNoteIds = store.get('openNoteIds', [])
  for (const id of savedNoteIds) {
    windowManager.openNote(id)
  }

  // Auto-update runs in production only; dev mode is identified by the Vite
  // dev server URL being set in the environment.
  if (!process.env['ELECTRON_RENDERER_URL']) {
    autoUpdater.checkForUpdatesAndNotify()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  store.set('openNoteIds', windowManager.getOpenNoteIds())
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// The app now lives in the tray, so closing every window must NOT quit it.
// Real exit is the tray "Quit" (or an OS/`before-quit` quit). Referencing
// isQuitting keeps the intent explicit and the binding used.
app.on('window-all-closed', () => {
  if (isQuitting && process.platform !== 'darwin') {
    app.quit()
  }
})
