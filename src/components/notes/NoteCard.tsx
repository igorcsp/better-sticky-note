import type { Note } from '../../types'

interface Props {
  note: Note
  onOpen: () => void
  onDelete: () => void
}

export default function NoteCard({ note, onOpen, onDelete }: Props) {
  const preview = note.content.split('\n').slice(1).join(' ').trim() || note.content

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-black/10 p-4 shadow-sm transition-shadow hover:shadow-md"
      style={{ backgroundColor: note.color || '#FFF176' }}
      onClick={onOpen}
    >
      <p className="truncate text-sm font-semibold text-gray-800">{note.title || 'Untitled'}</p>
      <p className="line-clamp-3 text-xs text-gray-600">{preview || 'No content'}</p>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute right-2 top-2 hidden h-5 w-5 items-center justify-center rounded text-xs text-gray-500 hover:bg-black/10 hover:text-red-600 group-hover:flex"
        title="Delete note"
      >
        ✕
      </button>
    </div>
  )
}
