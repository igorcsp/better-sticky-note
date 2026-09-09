import { useEffect, useRef, useState } from 'react'
import { updateNote } from '../../lib/firestore'
import NoteControls from './NoteControls'

interface Props {
  uid: string
  noteId: string
  color: string
  fontSize: number
}

const FONT_DEBOUNCE_MS = 400

// Color/font popover for a dashboard card. Keeps local state so the swatch and
// slider respond instantly, persists color immediately and font debounced, and
// stops clicks from bubbling to the card's open-note handler.
export default function NoteAppearanceButton({ uid, noteId, color, fontSize }: Props) {
  const [localColor, setLocalColor] = useState(color)
  const [localFont, setLocalFont] = useState(fontSize)
  const fontTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track the last value we wrote so an incoming snapshot doesn't clobber an
  // in-progress local edit, but external changes still sync in.
  useEffect(() => setLocalColor(color), [color])
  useEffect(() => setLocalFont(fontSize), [fontSize])

  function handleColor(next: string) {
    setLocalColor(next)
    if (/^#[0-9a-fA-F]{6}$/.test(next)) updateNote(uid, noteId, { color: next })
  }

  function handleFont(next: number) {
    setLocalFont(next)
    if (fontTimer.current) clearTimeout(fontTimer.current)
    fontTimer.current = setTimeout(() => updateNote(uid, noteId, { fontSize: next }), FONT_DEBOUNCE_MS)
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <NoteControls
        color={localColor}
        fontSize={localFont}
        onColorChange={handleColor}
        onFontSizeChange={handleFont}
      />
    </div>
  )
}
