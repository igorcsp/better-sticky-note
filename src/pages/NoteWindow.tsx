import { useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { updateNote } from '../lib/firestore'

interface Props {
  id: string
  uid: string
}

const DEBOUNCE_MS = 500

export default function NoteWindow({ id, uid }: Props) {
  const [content, setContent] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const ref = doc(db, 'users', uid, 'notes', id)
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setContent((snap.data().content as string) ?? '')
      }
    })
  }, [id, uid])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setContent(value)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const title = value.split('\n')[0].trim().slice(0, 80) || 'New Note'
      updateNote(uid, id, { content: value, title })
    }, DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="flex h-screen flex-col bg-yellow-50">
      <div className="flex items-center justify-between border-b border-yellow-200 bg-yellow-100 px-3 py-2">
        <button
          onClick={() => window.electron.openDashboard()}
          className="text-xs text-yellow-800 hover:underline"
        >
          All Notes
        </button>
        <button
          onClick={() => signOut(auth)}
          className="text-xs text-yellow-800 hover:underline"
        >
          Sign out
        </button>
      </div>
      <textarea
        className="flex-1 resize-none bg-transparent p-4 text-sm text-gray-800 outline-none placeholder-yellow-500"
        placeholder="Start typing…"
        value={content}
        onChange={handleChange}
      />
    </div>
  )
}
