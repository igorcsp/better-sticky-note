import { useState } from 'react'
import type { Note } from '../../types'
import type { NoteView } from '../dashboard/Sidebar'

interface Props {
  note: Note
  view: NoteView
  onOpen: () => void
  onCopy: () => void
  onTogglePin: () => void
  onToggleArchive: () => void
  onDelete: () => void
  onRestore: () => void
  onDeleteForever: () => void
}

// Small square icon button used in the card's hover row. stopPropagation keeps a
// click on an action from also opening the note.
function IconButton({
  title,
  onClick,
  children,
  danger,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex h-6 w-6 items-center justify-center rounded text-xs text-gray-600 hover:bg-black/10 ${
        danger ? 'hover:text-red-600' : 'hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

export default function NoteCard({
  note,
  view,
  onOpen,
  onCopy,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onRestore,
  onDeleteForever,
}: Props) {
  const [copied, setCopied] = useState(false)
  const preview = note.content.split('\n').slice(1).join(' ').trim() || note.content
  const inTrash = view === 'trash'

  function handleCopy() {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-black/10 p-4 shadow-sm transition-shadow hover:shadow-md"
      style={{ backgroundColor: note.color || '#FFF176' }}
      onClick={onOpen}
    >
      <p className="truncate pr-6 text-sm font-semibold text-gray-800">
        {note.pinned && !inTrash && <span className="mr-1" aria-hidden>📌</span>}
        {note.title || 'Untitled'}
      </p>
      <p className="line-clamp-3 text-xs text-gray-600">{preview || 'No content'}</p>

      <div className="absolute right-2 top-2 hidden items-center gap-0.5 rounded bg-white/60 p-0.5 backdrop-blur-sm group-hover:flex">
        {inTrash ? (
          <>
            <IconButton title="Restore" onClick={onRestore}>
              ♻️
            </IconButton>
            <IconButton title="Delete forever" onClick={onDeleteForever} danger>
              🗑️
            </IconButton>
          </>
        ) : (
          <>
            <IconButton title={copied ? 'Copied!' : 'Copy to clipboard'} onClick={handleCopy}>
              {copied ? '✓' : '📋'}
            </IconButton>
            <IconButton title={note.pinned ? 'Unpin' : 'Pin'} onClick={onTogglePin}>
              {note.pinned ? '📌' : '📍'}
            </IconButton>
            <IconButton
              title={note.archived ? 'Unarchive' : 'Archive'}
              onClick={onToggleArchive}
            >
              {note.archived ? '📤' : '🗄️'}
            </IconButton>
            <IconButton title="Move to trash" onClick={onDelete} danger>
              ✕
            </IconButton>
          </>
        )}
      </div>
    </div>
  )
}
