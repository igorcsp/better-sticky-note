import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { updateNote } from '../lib/firestore'
import { deriveTitle } from '../lib/noteTitle'
import NoteEditor from '../components/editor/NoteEditor'

interface Props {
  id: string
  uid: string
}

const DEBOUNCE_MS = 500

export default function NoteWindow({ id, uid }: Props) {
  // null = still loading. The editor is not mounted until the note has loaded,
  // so the loaded text becomes CodeMirror's *initial* document and can never
  // be mistaken for a user edit. That is what keeps saving purely
  // event-driven, with no "have we loaded yet" guard flag.
  const [initialDoc, setInitialDoc] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<string | null>(null)
  // Latest editor text, seeded from the loaded doc — used by the Copy button,
  // which must reflect unsaved edits too.
  const currentTextRef = useRef('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const ref = doc(db, 'users', uid, 'notes', id)
    getDoc(ref).then((snap) => {
      // Guard against a slow read resolving after the user has started typing
      // (or after the window has been closed).
      if (cancelled) return
      const content = snap.exists() ? ((snap.data().content as string) ?? '') : ''
      currentTextRef.current = content
      setInitialDoc(content)
    })
    return () => {
      cancelled = true
    }
  }, [id, uid])

  const flush = useCallback(() => {
    const text = pendingRef.current
    if (text === null) return
    pendingRef.current = null
    updateNote(uid, id, { content: text, title: deriveTitle(text) })
  }, [uid, id])

  const handleChange = useCallback(
    (text: string) => {
      pendingRef.current = text
      currentTextRef.current = text
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, DEBOUNCE_MS)
    },
    [flush]
  )

  // Write any pending edit when the editor loses focus — clicking the window's
  // close button blurs it first, so this catches the common case of closing a
  // note within the debounce window.
  const handleBlur = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    flush()
  }, [flush])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentTextRef.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [])

  const flushRef = useRef(flush)
  flushRef.current = flush

  useEffect(() => {
    // Closing the OS window tears down the renderer without unmounting React,
    // so the cleanup below is not enough on its own.
    const onUnload = () => flushRef.current()
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      if (timerRef.current) clearTimeout(timerRef.current)
      // Flush rather than discard: previously a keystroke made within 500 ms
      // of closing a note window was silently lost.
      flushRef.current()
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
          onClick={handleCopy}
          className="text-xs text-yellow-800 hover:underline"
          title="Copy note to clipboard"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {initialDoc === null ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        </div>
      ) : (
        <NoteEditor initialDoc={initialDoc} onChange={handleChange} onBlur={handleBlur} />
      )}
    </div>
  )
}
