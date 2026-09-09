import { useEffect, useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'
import { GripHorizontal, LogOut } from 'lucide-react'
import { auth } from '../lib/firebase'
import {
  createNote,
  deleteNote,
  deleteNoteForever,
  purgeExpiredTrash,
  restoreNote,
  subscribeToNotes,
  updateNote,
} from '../lib/firestore'
import { stripMarkdown } from '../lib/noteTitle'
import { useNotesStore } from '../store/notesStore'
import NoteCard from '../components/notes/NoteCard'
import Sidebar, { type NoteView } from '../components/dashboard/Sidebar'
import ThemeToggle from '../components/dashboard/ThemeToggle'
import WindowControls from '../components/WindowControls'

const DRAG = { WebkitAppRegion: 'drag' } as React.CSSProperties
const NO_DRAG = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

interface Props {
  uid: string
}

type SortKey = 'modified' | 'created' | 'title'

const EMPTY_MESSAGES: Record<NoteView, string> = {
  all: 'No notes yet — click "+ New Note" to start.',
  pinned: 'No pinned notes.',
  archived: 'No archived notes.',
  trash: 'Trash is empty.',
}

// Milliseconds from a Firestore Timestamp (or 0 while the server value is pending).
function toMillis(ts: { toMillis?: () => number } | null | undefined): number {
  return ts?.toMillis ? ts.toMillis() : 0
}

export default function Dashboard({ uid }: Props) {
  const { notes, setNotes } = useNotesStore()
  const [view, setView] = useState<NoteView>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('modified')

  useEffect(() => {
    const unsub = subscribeToNotes(uid, setNotes)
    // Clear out notes trashed more than 30 days ago. Fire-and-forget — a failure
    // here must not block the dashboard from rendering.
    purgeExpiredTrash(uid).catch((err) => console.error('Trash purge failed:', err))
    return unsub
  }, [uid, setNotes])

  const counts = useMemo<Record<NoteView, number>>(() => {
    const c = { all: 0, pinned: 0, archived: 0, trash: 0 }
    for (const n of notes) {
      if (n.deletedAt) {
        c.trash++
      } else if (n.archived) {
        c.archived++
      } else {
        c.all++
        if (n.pinned) c.pinned++
      }
    }
    return c
  }, [notes])

  const visibleNotes = useMemo(() => {
    const inBucket = notes.filter((n) => {
      switch (view) {
        case 'all':
          return !n.deletedAt && !n.archived
        case 'pinned':
          return !n.deletedAt && !n.archived && n.pinned
        case 'archived':
          return !n.deletedAt && n.archived
        case 'trash':
          return !!n.deletedAt
      }
    })

    const q = search.trim().toLowerCase()
    const matched = q
      ? inBucket.filter((n) => {
          const haystack = `${n.title}\n${stripMarkdown(n.content)}`.toLowerCase()
          return haystack.includes(q)
        })
      : inBucket

    const sorted = [...matched].sort((a, b) => {
      switch (sort) {
        case 'created':
          return toMillis(b.createdAt) - toMillis(a.createdAt)
        case 'title':
          return (a.title || '').localeCompare(b.title || '')
        case 'modified':
        default:
          return toMillis(b.updatedAt) - toMillis(a.updatedAt)
      }
    })

    // Float pinned notes to the top in the views where pinning is meaningful.
    if (view === 'all' || view === 'pinned') {
      sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned))
    }
    return sorted
  }, [notes, view, search, sort])

  async function handleNewNote() {
    const id = await createNote(uid)
    window.electron.openNote(id)
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar view={view} counts={counts} onSelect={setView} />
      <div className="flex flex-1 flex-col">
        <header className="border-b bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
          {/* Dedicated drag strip — larger target, visually signals draggability */}
          <div
            className="flex h-7 cursor-grab items-center justify-center select-none active:cursor-grabbing bg-gray-50 dark:bg-gray-900/60"
            style={DRAG}
          >
            <GripHorizontal size={16} className="pointer-events-none text-gray-300 dark:text-gray-600" />
          </div>
          <div className="flex items-center justify-between gap-4 py-3 pl-6">
            <div className="flex flex-1 items-center gap-3" style={NO_DRAG}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes…"
                className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-600 focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="modified">Last modified</option>
                <option value="created">Created</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
            <div className="flex items-center gap-4" style={NO_DRAG}>
              <ThemeToggle />
              <button
                onClick={() => window.electron.openShortcuts()}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Keyboard shortcuts"
              >
                Shortcuts
              </button>
              <button
                onClick={handleNewNote}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                + New Note
              </button>
              <button
                onClick={() => signOut(auth)}
                title="Sign out"
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <LogOut size={16} />
              </button>
            </div>
            <WindowControls />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {visibleNotes.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-400 dark:text-gray-500">
                {search.trim() ? 'No notes match your search.' : EMPTY_MESSAGES[view]}
              </p>
            </div>
          ) : (
            <div className="grid auto-rows-min gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {visibleNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  view={view}
                  uid={uid}
                  onOpen={() => window.electron.openNote(note.id)}
                  onCopy={() => navigator.clipboard.writeText(note.content)}
                  onTogglePin={() => updateNote(uid, note.id, { pinned: !note.pinned })}
                  onToggleArchive={() =>
                    updateNote(uid, note.id, { archived: !note.archived })
                  }
                  onDelete={() => deleteNote(uid, note.id)}
                  onRestore={() => restoreNote(uid, note.id)}
                  onDeleteForever={() => {
                    if (window.confirm('Delete this note forever? This cannot be undone.')) {
                      deleteNoteForever(uid, note.id)
                    }
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
