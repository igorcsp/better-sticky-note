import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Pin } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { updateNote } from '../lib/firestore'
import { deriveTitle } from '../lib/noteTitle'
import type { Note } from '../types'
import NoteEditor from '../components/editor/NoteEditor'
import NoteControls from '../components/notes/NoteControls'
import WindowControls from '../components/WindowControls'

// The title bar is draggable; its interactive controls must opt back out or the
// drag region swallows their clicks.
const DRAG = { WebkitAppRegion: 'drag' } as React.CSSProperties
const NO_DRAG = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

interface Props {
  id: string
  uid: string
}

const DEBOUNCE_MS = 500
const FONT_DEBOUNCE_MS = 400
const SAVED_VISIBLE_MS = 2000
const DEFAULT_COLOR = '#FFF176'
const DEFAULT_FONT_SIZE = 12

type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function NoteWindow({ id, uid }: Props) {
  // null = still loading. The editor is not mounted until the note has loaded,
  // so the loaded text becomes CodeMirror's *initial* document and can never
  // be mistaken for a user edit. That is what keeps saving purely
  // event-driven, with no "have we loaded yet" guard flag.
  const [initialDoc, setInitialDoc] = useState<string | null>(null)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      const data = snap.exists() ? (snap.data() as Partial<Note>) : {}
      const content = (data.content as string) ?? ''
      currentTextRef.current = content
      setColor(data.color || DEFAULT_COLOR)
      setFontSize(data.fontSize || DEFAULT_FONT_SIZE)
      setInitialDoc(content)
    })
    return () => {
      cancelled = true
    }
  }, [id, uid])

  // Single write path so every save (content, color, font) drives the sync
  // indicator consistently: saving → saved (fades after 2s) or → error (sticks
  // until the next success).
  const save = useCallback(
    async (data: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      setSyncStatus('saving')
      try {
        await updateNote(uid, id, data)
        setSyncStatus('saved')
        savedTimerRef.current = setTimeout(() => setSyncStatus('idle'), SAVED_VISIBLE_MS)
      } catch {
        setSyncStatus('error')
      }
    },
    [uid, id]
  )

  const flush = useCallback(() => {
    const text = pendingRef.current
    if (text === null) return
    pendingRef.current = null
    save({ content: text, title: deriveTitle(text) })
  }, [save])

  const handleChange = useCallback(
    (text: string) => {
      pendingRef.current = text
      currentTextRef.current = text
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, DEBOUNCE_MS)
    },
    [flush]
  )

  const handleColorChange = useCallback(
    (next: string) => {
      setColor(next)
      // Only persist complete hex values (the text field can hold a partial "#ab").
      if (/^#[0-9a-fA-F]{6}$/.test(next)) save({ color: next })
    },
    [save]
  )

  const handleFontSizeChange = useCallback(
    (next: number) => {
      setFontSize(next)
      if (fontTimerRef.current) clearTimeout(fontTimerRef.current)
      fontTimerRef.current = setTimeout(() => save({ fontSize: next }), FONT_DEBOUNCE_MS)
    },
    [save]
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

  const handleToggleAlwaysOnTop = useCallback(async () => {
    setAlwaysOnTop(await window.electron.toggleAlwaysOnTop())
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
      if (fontTimerRef.current) clearTimeout(fontTimerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      // Flush rather than discard: previously a keystroke made within 500 ms
      // of closing a note window was silently lost.
      flushRef.current()
    }
  }, [])

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: color, ['--note-font-size' as string]: `${fontSize}px` }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b border-black/10 bg-black/5 pl-3"
        style={DRAG}
      >
        <button
          onClick={() => window.electron.openDashboard()}
          className="py-2 text-xs text-gray-700 hover:underline"
          style={NO_DRAG}
        >
          All Notes
        </button>
        <div className="flex items-center gap-3 py-2" style={NO_DRAG}>
          <SyncIndicator status={syncStatus} />
          <button
            onClick={handleCopy}
            className="text-xs text-gray-700 hover:underline"
            title="Copy note to clipboard"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleToggleAlwaysOnTop}
            className={`flex items-center text-gray-700 ${alwaysOnTop ? 'opacity-100' : 'opacity-50'} hover:opacity-100`}
            title={alwaysOnTop ? 'Always on top: on' : 'Always on top: off'}
            aria-pressed={alwaysOnTop}
          >
            <Pin size={14} className={alwaysOnTop ? 'fill-current' : ''} />
          </button>
          <NoteControls
            color={color}
            fontSize={fontSize}
            onColorChange={handleColorChange}
            onFontSizeChange={handleFontSizeChange}
          />
        </div>
        <WindowControls minimize />
      </div>
      {initialDoc === null ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        </div>
      ) : (
        <NoteEditor initialDoc={initialDoc} onChange={handleChange} onBlur={handleBlur} />
      )}
    </div>
  )
}

function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === 'saving') {
    return (
      <span
        className="h-3 w-3 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"
        title="Saving…"
      />
    )
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center text-green-700" title="Saved to cloud">
        <Check size={14} />
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center text-amber-600" title="Sync problem — changes not saved">
        <AlertTriangle size={14} />
      </span>
    )
  }
  return null
}
