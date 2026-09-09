import { useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  Check,
  Copy,
  Pin,
  PinOff,
  RotateCcw,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Note } from '../../types'
import type { NoteView } from '../dashboard/Sidebar'
import NoteAppearanceButton from './NoteAppearanceButton'

interface Props {
  note: Note
  view: NoteView
  uid: string
  onOpen: () => void
  onCopy: () => void
  onTogglePin: () => void
  onToggleArchive: () => void
  onDelete: () => void
  onRestore: () => void
  onDeleteForever: () => void
}

// Small icon button used in the card's hover row. stopPropagation keeps a click
// on an action from also opening the note.
function IconButton({
  title,
  onClick,
  icon: Icon,
  danger,
}: {
  title: string
  onClick: () => void
  icon: LucideIcon
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-gray-600 hover:bg-black/10 ${
        danger ? 'hover:text-red-600' : 'hover:text-gray-900'
      }`}
    >
      <Icon size={16} />
    </button>
  )
}

export default function NoteCard({
  note,
  view,
  uid,
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
      className="group relative flex min-h-44 cursor-pointer flex-col gap-2 rounded-xl border border-black/10 p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ backgroundColor: note.color || '#FFF176' }}
      onClick={onOpen}
    >
      <p className="flex items-center gap-1.5 truncate pr-8 text-sm font-semibold text-gray-800">
        {note.pinned && !inTrash && <Pin size={13} className="shrink-0 fill-current" />}
        {note.title || 'Untitled'}
      </p>
      <p className="line-clamp-4 flex-1 text-xs text-gray-600">{preview || 'No content'}</p>

      <div className="absolute right-2 top-2 hidden items-center gap-0.5 rounded-lg bg-white/60 p-1 backdrop-blur-sm group-hover:flex">
        {inTrash ? (
          <>
            <IconButton title="Restore" onClick={onRestore} icon={RotateCcw} />
            <IconButton title="Delete forever" onClick={onDeleteForever} icon={Trash2} danger />
          </>
        ) : (
          <>
            <NoteAppearanceButton
              uid={uid}
              noteId={note.id}
              color={note.color || '#FFF176'}
              fontSize={note.fontSize || 12}
            />
            <IconButton
              title={copied ? 'Copied!' : 'Copy to clipboard'}
              onClick={handleCopy}
              icon={copied ? Check : Copy}
            />
            <IconButton
              title={note.pinned ? 'Unpin' : 'Pin'}
              onClick={onTogglePin}
              icon={note.pinned ? PinOff : Pin}
            />
            <IconButton
              title={note.archived ? 'Unarchive' : 'Archive'}
              onClick={onToggleArchive}
              icon={note.archived ? ArchiveRestore : Archive}
            />
            <IconButton title="Move to trash" onClick={onDelete} icon={X} danger />
          </>
        )}
      </div>
    </div>
  )
}
