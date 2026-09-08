import { create } from 'zustand'
import type { Note } from '../types'

type NotesState = {
  notes: Note[]
  openNoteIds: string[]
  setNotes: (notes: Note[]) => void
  addOpenNote: (id: string) => void
  removeOpenNote: (id: string) => void
}

export const useNotesStore = create<NotesState>()((set) => ({
  notes: [],
  openNoteIds: [],
  setNotes: (notes) => set({ notes }),
  addOpenNote: (id) =>
    set((state) => ({
      openNoteIds: state.openNoteIds.includes(id)
        ? state.openNoteIds
        : [...state.openNoteIds, id],
    })),
  removeOpenNote: (id) =>
    set((state) => ({
      openNoteIds: state.openNoteIds.filter((noteId) => noteId !== id),
    })),
}))
