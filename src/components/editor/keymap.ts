import type { KeyBinding } from '@codemirror/view'
import type { EditorView } from '@codemirror/view'
import { addCursorAbove, addCursorBelow, redo } from '@codemirror/commands'
import { openSearchPanel } from '@codemirror/search'
import { EditorSelection } from '@codemirror/state'

function selectAllOccurrences(view: EditorView): boolean {
  const { state } = view
  const sel = state.selection.main
  if (sel.empty) return false

  const query = state.sliceDoc(sel.from, sel.to)
  const text = state.doc.toString()
  const ranges: ReturnType<typeof EditorSelection.range>[] = []

  let pos = 0
  while (pos <= text.length - query.length) {
    const idx = text.indexOf(query, pos)
    if (idx === -1) break
    ranges.push(EditorSelection.range(idx, idx + query.length))
    pos = idx + 1
  }

  if (ranges.length === 0) return false
  view.dispatch({ selection: EditorSelection.create(ranges) })
  return true
}

/**
 * Opens the find & replace panel and focuses the *replace* field, the way
 * VSCode's Ctrl+H does. `openSearchPanel` alone focuses the search field.
 */
function openReplacePanel(view: EditorView): boolean {
  const handled = openSearchPanel(view)
  // The panel mounts synchronously, but focus is set by the panel itself;
  // defer so our focus call wins.
  requestAnimationFrame(() => {
    const field = view.dom.querySelector<HTMLInputElement>('input[name="replace"]')
    field?.focus()
    field?.select()
  })
  return handled
}

/**
 * The bindings CodeMirror does not already provide. Everything else in the
 * VSCode set comes free from defaultKeymap / searchKeymap / historyKeymap:
 *
 *   Ctrl+F2             selectAllOccurrences      vscodeKeymap (custom)
 *   Ctrl+D              selectNextOccurrence      searchKeymap
 *   Ctrl+F              openSearchPanel           searchKeymap
 *   Ctrl+Alt+Up/Down    addCursorAbove/Below      defaultKeymap
 *   Alt+Up/Down         moveLineUp/Down           defaultKeymap
 *   Shift+Alt+Up/Down   copyLineUp/Down           defaultKeymap
 *   Ctrl+Z              undo                      historyKeymap
 *   Ctrl+A              selectAll                 standardKeymap
 *   Alt+drag            rectangular selection     rectangularSelection()
 */
export const vscodeKeymap: KeyBinding[] = [
  { key: 'Ctrl-F2', run: selectAllOccurrences, preventDefault: true },
  { key: 'Mod-h', run: openReplacePanel, preventDefault: true },
  // historyKeymap only binds Mod-Shift-z to redo on Mac; on Windows redo is
  // Mod-y. Without this, Ctrl+Shift+Z falls back to the Mod-z binding (the
  // keymap retries letter keys without Shift) and performs a *second undo*.
  { key: 'Mod-Shift-z', run: redo, preventDefault: true },
  // VSCode's column-select-down/up. CodeMirror has no keyboard command for a
  // true rectangular selection (that is Alt+drag), so these add cursors in the
  // same column, which is the equivalent behaviour for the common case.
  { key: 'Mod-Shift-Alt-ArrowDown', run: addCursorBelow, preventDefault: true },
  { key: 'Mod-Shift-Alt-ArrowUp', run: addCursorAbove, preventDefault: true },
]
