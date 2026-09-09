import { useState } from 'react'

interface Props {
  color: string
  fontSize: number
  onColorChange: (color: string) => void
  onFontSizeChange: (size: number) => void
}

// Sticky-note preset palette.
const PRESETS = [
  '#FFF176', // yellow
  '#FFD180', // orange
  '#FF8A80', // red
  '#F48FB1', // pink
  '#CE93D8', // purple
  '#90CAF9', // blue
  '#A5D6A7', // green
  '#E0E0E0', // gray
]

export const MIN_FONT_SIZE = 12
export const MAX_FONT_SIZE = 24

export default function NoteControls({
  color,
  fontSize,
  onColorChange,
  onFontSizeChange,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Note color & font size"
        className="h-5 w-5 rounded-full border border-black/20 shadow-sm"
        style={{ backgroundColor: color }}
      />
      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 flex w-56 flex-col gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Color</p>
              <div className="grid grid-cols-8 gap-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => onColorChange(preset)}
                    title={preset}
                    className={`h-5 w-5 rounded-full border ${
                      preset.toLowerCase() === color.toLowerCase()
                        ? 'border-gray-800 ring-1 ring-gray-800'
                        : 'border-black/20'
                    }`}
                    style={{ backgroundColor: preset }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border border-black/20 bg-transparent p-0"
                  title="Custom color"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onColorChange(v)
                  }}
                  className="w-20 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                Font size — {fontSize}px
              </p>
              <input
                type="range"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
