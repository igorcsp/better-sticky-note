import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { store, type Bounds } from './store'
import { startRendererServer, stopRendererServer } from './rendererServer'

const noteWindows = new Map<string, BrowserWindow>()
let dashboardWindow: BrowserWindow | null = null
let shortcutsWindow: BrowserWindow | null = null

const BOUNDS_DEBOUNCE_MS = 300

// Base URL every window loads from. In dev it is Vite's server; in production
// it is our local static server (see initRenderer). Both give an http origin
// with hostname `localhost`, which Firebase treats as an authorized domain —
// the reason we no longer load the renderer from file://.
let rendererBaseUrl: string | null = null

function getPreloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

/**
 * Must be awaited once, before any window is created. In production it starts
 * the local server that serves the built renderer over http://localhost so the
 * Google sign-in popup works (file:// origins fail with auth/unauthorized-domain).
 */
export async function initRenderer(): Promise<void> {
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  rendererBaseUrl = devUrl ?? (await startRendererServer(join(__dirname, '../renderer')))
}

/** Tears down the production renderer server. No-op in dev. */
export function shutdownRenderer(): void {
  stopRendererServer()
}

function loadWindow(win: BrowserWindow, params: string): void {
  if (!rendererBaseUrl) {
    throw new Error('initRenderer() must be awaited before creating windows')
  }
  win.loadURL(`${rendererBaseUrl}/?${params}`)
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
