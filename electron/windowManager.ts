import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { store, type Bounds } from './store'

const noteWindows = new Map<string, BrowserWindow>()
let dashboardWindow: BrowserWindow | null = null
let shortcutsWindow: BrowserWindow | null = null

const BOUNDS_DEBOUNCE_MS = 300

function getPreloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

function loadWindow(win: BrowserWindow, params: string): void {
  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    win.loadURL(`${rendererUrl}?${params}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { search: `?${params}` })
  }
}

function makeWindow(options: Electron.BrowserWindowConstructorOptions): BrowserWindow {
  const win = new BrowserWindow({
    ...options,
    // Frameless custom chrome. `transparent` stays false so Windows keeps native
    // edge-resizing (transparent frameless windows lose it).
    frame: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Firebase auth popup must open inside Electron (needs window.opener for postMessage)
    if (url.includes('/__/auth/')) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

// Persist a window's bounds (debounced) on resize/move, plus once on close as a
// safety net. `save` decides where the bounds are stored.
function trackBounds(win: BrowserWindow, save: (bounds: Bounds) => void): void {
  let timer: ReturnType<typeof setTimeout> | null = null
  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      if (!win.isDestroyed()) save(win.getBounds())
    }, BOUNDS_DEBOUNCE_MS)
  }
  win.on('resize', schedule)
  win.on('move', schedule)
  win.on('close', () => {
    if (timer) clearTimeout(timer)
    if (!win.isDestroyed()) save(win.getBounds())
  })
}

export function openNote(id: string): void {
  const existing = noteWindows.get(id)
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return
  }

  const saved = store.get('noteBounds')[id]
  const win = makeWindow({
    width: saved?.width ?? 350,
    height: saved?.height ?? 450,
    x: saved?.x,
    y: saved?.y,
    title: 'Note',
  })
  loadWindow(win, `view=note&id=${id}`)
  noteWindows.set(id, win)

  trackBounds(win, (bounds) => {
    const all = store.get('noteBounds')
    all[id] = bounds
    store.set('noteBounds', all)
  })

  win.on('closed', () => {
    noteWindows.delete(id)
  })
}

export function closeNote(id: string): void {
  const win = noteWindows.get(id)
  if (win && !win.isDestroyed()) win.destroy()
  noteWindows.delete(id)
}

export function openDashboard(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.focus()
    return
  }

  const saved = store.get('dashboardBounds')
  dashboardWindow = makeWindow({
    width: saved?.width ?? 960,
    height: saved?.height ?? 640,
    x: saved?.x,
    y: saved?.y,
    title: 'Better Sticky Notes',
  })
  loadWindow(dashboardWindow, 'view=dashboard')

  trackBounds(dashboardWindow, (bounds) => store.set('dashboardBounds', bounds))

  dashboardWindow.on('closed', () => {
    dashboardWindow = null
  })
}

// New note from the tray/hotkey. createNote is renderer-only (needs Firebase +
// the signed-in user), so we ask the dashboard renderer to do it. Open the
// dashboard first if needed, then signal once its contents have loaded.
export function requestNewNote(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.focus()
    dashboardWindow.webContents.send('new-note')
    return
  }
  openDashboard()
  dashboardWindow!.webContents.once('did-finish-load', () => {
    dashboardWindow?.webContents.send('new-note')
  })
}

export function openShortcuts(): void {
  if (shortcutsWindow && !shortcutsWindow.isDestroyed()) {
    shortcutsWindow.focus()
    return
  }

  shortcutsWindow = makeWindow({ width: 520, height: 660, title: 'Keyboard Shortcuts' })
  loadWindow(shortcutsWindow, 'view=shortcuts')

  shortcutsWindow.on('closed', () => {
    shortcutsWindow = null
  })
}

export function getOpenNoteIds(): string[] {
  return [...noteWindows.keys()].filter((id) => {
    const win = noteWindows.get(id)
    return win && !win.isDestroyed()
  })
}
