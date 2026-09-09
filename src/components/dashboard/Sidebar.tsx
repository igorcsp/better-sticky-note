import { useEffect, useState } from 'react'
import {
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  StickyNote,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

export type NoteView = 'all' | 'pinned' | 'archived' | 'trash'

interface Props {
  view: NoteView
  counts: Record<NoteView, number>
  onSelect: (view: NoteView) => void
}

const ITEMS: { view: NoteView; label: string; icon: LucideIcon }[] = [
  { view: 'all', label: 'All Notes', icon: StickyNote },
  { view: 'pinned', label: 'Pinned', icon: Pin },
  { view: 'archived', label: 'Archived', icon: Archive },
  { view: 'trash', label: 'Trash', icon: Trash2 },
]

const STORAGE_KEY = 'sidebarCollapsed'

export default function Sidebar({ view, counts, onSelect }: Props) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <nav
      className={`flex flex-col gap-1 border-r bg-white p-3 transition-[width] dark:border-gray-800 dark:bg-gray-800 ${
        collapsed ? 'w-14' : 'w-48'
      }`}
    >
      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`mb-1 flex items-center rounded-lg py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 ${
          collapsed ? 'justify-center px-0' : 'justify-end px-3'
        }`}
      >
        {collapsed ? (
          <PanelLeftOpen size={16} className="shrink-0" />
        ) : (
          <PanelLeftClose size={16} className="shrink-0" />
        )}
      </button>

      {ITEMS.map((item) => {
        const active = view === item.view
        return (
          <button
            key={item.view}
            onClick={() => onSelect(item.view)}
            title={collapsed ? `${item.label} (${counts[item.view]})` : undefined}
            className={`flex items-center rounded-lg py-2 text-sm transition-colors ${
              collapsed ? 'justify-center px-0' : 'justify-between px-3'
            } ${
              active
                ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <item.icon size={16} aria-hidden className="shrink-0" />
              {!collapsed && item.label}
            </span>
            {!collapsed && (
              <span className={`text-xs ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                {counts[item.view]}
              </span>
            )}
          </button>
        )
      })}
      {/* Categories section goes here in a later phase. */}
    </nav>
  )
}
