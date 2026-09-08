import { BrowserWindow, shell } from 'electron'
import { join } from 'path'

const noteWindows = new Map<string, BrowserWindow>()
let dashboardWindow: BrowserWindow | null = null

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

export function openNote(id: string): void {
  const existing = noteWindows.get(id)
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return
  }

  const win = makeWindow({ width: 350, height: 450, title: 'Note' })
  loadWindow(win, `view=note&id=${id}`)
  noteWindows.set(id, win)

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

  dashboardWindow = makeWindow({ width: 960, height: 640, title: 'Better Sticky Notes' })
  loadWindow(dashboardWindow, 'view=dashboard')

  dashboardWindow.on('closed', () => {
    dashboardWindow = null
  })
}

export function getOpenNoteIds(): string[] {
  return [...noteWindows.keys()].filter((id) => {
    const win = noteWindows.get(id)
    return win && !win.isDestroyed()
  })
}
