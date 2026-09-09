import Store from 'electron-store'

export interface Bounds {
  x?: number
  y?: number
  width: number
  height: number
}

export type Theme = 'light' | 'dark' | 'system'

export interface StoreSchema {
  openNoteIds: string[]
  theme: Theme
  // Per-note window bounds, keyed by noteId, so each note reopens where it was.
  noteBounds: Record<string, Bounds>
  dashboardBounds?: Bounds
}

// Single shared instance — imported by both main.ts and windowManager.ts.
export const store = new Store<StoreSchema>({
  defaults: { openNoteIds: [], theme: 'system', noteBounds: {} },
})
