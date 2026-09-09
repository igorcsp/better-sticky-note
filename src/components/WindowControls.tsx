// Custom close/minimize buttons for frameless windows. Marked no-drag so they
// stay clickable inside a draggable title bar.
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

interface Props {
  minimize?: boolean
}

export default function WindowControls({ minimize }: Props) {
  return (
    <div className="flex items-center" style={noDrag}>
      {minimize && (
        <button
          onClick={() => window.electron.minimizeSelf()}
          title="Minimize"
          className="flex h-6 w-7 items-center justify-center text-gray-600 hover:bg-black/10 dark:text-gray-300"
        >
          {/* minus */}
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      )}
      <button
        onClick={() => window.electron.closeSelf()}
        title="Close"
        className="flex h-6 w-7 items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white dark:text-gray-300"
      >
        {/* x */}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  )
}
