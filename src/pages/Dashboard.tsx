import { useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { createNote, deleteNote, subscribeToNotes } from '../lib/firestore'
import { useNotesStore } from '../store/notesStore'
import NoteCard from '../components/notes/NoteCard'

interface Props {
  uid: string
}

export default function Dashboard({ uid }: Props) {
  const { notes, setNotes } = useNotesStore()

  useEffect(() => {
    const unsub = subscribeToNotes(uid, setNotes)
    return unsub
  }, [uid, setNotes])

  const visibleNotes = notes.filter((n) => !n.deletedAt && !n.archived)

  async function handleNewNote() {
    const id = await createNote(uid)
    window.electron.openNote(id)
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">All Notes</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewNote}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            + New Note
          </button>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        {visibleNotes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-400">No notes yet — click &ldquo;+ New Note&rdquo; to start.</p>
          </div>
        ) : (
          <div className="grid auto-rows-min grid-cols-3 gap-4">
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={() => window.electron.openNote(note.id)}
                onDelete={() => deleteNote(uid, note.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
