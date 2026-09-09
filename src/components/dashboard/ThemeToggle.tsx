import { usePrefsStore } from '../../store/prefsStore'
import type { Theme } from '../../types/electron'

const OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: 'light', icon: '☀️', label: 'Light' },
  { value: 'dark', icon: '🌙', label: 'Dark' },
  { value: 'system', icon: '🖥️', label: 'System' },
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
          className={`rounded-md px-2 py-1 text-sm transition-colors ${
            theme === opt.value
              ? 'bg-gray-100 dark:bg-gray-700'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
