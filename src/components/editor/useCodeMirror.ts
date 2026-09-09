import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { noteExtensions } from './extensions'

interface Options {
  initialDoc: string
  onChange: (text: string) => void
  onBlur?: () => void
}

/**
 * Mounts a CodeMirror view into the returned ref, exactly once.
 *
 * `main.tsx` renders inside <React.StrictMode>, so effects double-invoke in
 * dev; the `view.destroy()` cleanup is what stops that from leaving two
 * stacked editors in the DOM. The callbacks are read through a ref so that a
 * new function identity on re-render never tears the view down and loses the
 * user's cursor, selection, and undo history.
 */
export function useCodeMirror({ initialDoc, onChange, onBlur }: Options) {
  const parentRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const handlersRef = useRef({ onChange, onBlur })
  handlersRef.current = { onChange, onBlur }

  useEffect(() => {
    const parent = parentRef.current
    if (!parent) return

    const view = new EditorView({
      state: EditorState.create({
        // The loaded note text is the view's *initial* document, so mounting
        // does not count as a change and cannot trigger a save.
        doc: initialDoc,
        extensions: noteExtensions({
          onChange: (text) => handlersRef.current.onChange(text),
          onBlur: () => handlersRef.current.onBlur?.(),
        }),
      }),
      parent,
    })
    viewRef.current = view
    view.focus()

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // initialDoc is intentionally not a dependency: the note is loaded before
    // this hook mounts, and re-creating the view would discard editor state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { parentRef, viewRef }
}
