interface Shortcut {
  keys: string
  action: string
}

const EDIT: Shortcut[] = [
  { keys: 'Ctrl+D', action: 'Select next occurrence' },
  { keys: 'Ctrl+F', action: 'Find' },
  { keys: 'Ctrl+H', action: 'Find & replace (regex)' },
  { keys: 'Ctrl+Alt+↑ / ↓', action: 'Add cursor above / below' },
  { keys: 'Alt+↑ / ↓', action: 'Move line up / down' },
  { keys: 'Shift+Alt+↑ / ↓', action: 'Duplicate line up / down' },
  { keys: 'Ctrl+Shift+Alt+↑ / ↓', action: 'Column (box) selection' },
  { keys: 'Alt+drag', action: 'Rectangular selection' },
  { keys: 'Ctrl+Z', action: 'Undo' },
  { keys: 'Ctrl+Shift+Z', action: 'Redo' },
]

const VIEW: Shortcut[] = [
  { keys: 'Ctrl+R', action: 'Reload (dev)' },
  { keys: 'Ctrl++ / Ctrl+-', action: 'Zoom in / out (dev)' },
  { keys: 'F11', action: 'Toggle fullscreen (dev)' },
]

const WINDOW: Shortcut[] = [
  { keys: 'Ctrl+Alt+N', action: 'New note (global hotkey — coming soon)' },
]

function Section({ title, items }: { title: string; items: Shortcut[] }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        {items.map((s, i) => (
          <div
            key={s.keys}
            className={`flex items-center justify-between px-3 py-2 text-sm ${
              i % 2 === 0
                ? 'bg-white dark:bg-gray-800'
                : 'bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            <span className="text-gray-700 dark:text-gray-200">{s.action}</span>
            <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {s.keys}
            </kbd>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Shortcuts() {
  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
      <h1 className="mb-5 text-lg font-semibold text-gray-800 dark:text-gray-100">
        Keyboard Shortcuts
      </h1>
      <Section title="Editing" items={EDIT} />
      <Section title="View" items={VIEW} />
      <Section title="Window" items={WINDOW} />
    </div>
  )
}
