export type NoteView = 'all' | 'pinned' | 'archived' | 'trash'

interface Props {
  view: NoteView
  counts: Record<NoteView, number>
  onSelect: (view: NoteView) => void
}

const ITEMS: { view: NoteView; label: string; icon: string }[] = [
  { view: 'all', label: 'All Notes', icon: '🗒️' },
  { view: 'pinned', label: 'Pinned', icon: '📌' },
  { view: 'archived', label: 'Archived', icon: '🗄️' },
  { view: 'trash', label: 'Trash', icon: '🗑️' },
]

export default function Sidebar({ view, counts, onSelect }: Props) {
  return (
    <nav className="flex w-48 flex-col gap-1 border-r bg-white p-3 dark:border-gray-800 dark:bg-gray-800">
      {ITEMS.map((item) => {
        const active = view === item.view
        return (
          <button
            key={item.view}
            onClick={() => onSelect(item.view)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </span>
            <span className={`text-xs ${active ? 'text-blue-500' : 'text-gray-400'}`}>
              {counts[item.view]}
            </span>
          </button>
        )
      })}
      {/* Categories section goes here in a later phase. */}
    </nav>
  )
}
