import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { usePrefsStore } from '../../store/prefsStore'
import type { Theme } from '../../types/electron'

const OPTIONS: { value: Theme; icon: LucideIcon; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = usePrefsStore()

  return (
    <div className="flex items-center rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          aria-pressed={theme === opt.value}
          className={`flex items-center rounded-md px-2 py-1 text-gray-700 transition-colors dark:text-gray-200 ${
            theme === opt.value
              ? 'bg-gray-100 dark:bg-gray-700'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <opt.icon size={16} />
        </button>
      ))}
    </div>
  )
}
