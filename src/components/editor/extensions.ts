import { EditorState, Prec, type Extension } from '@codemirror/state'
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightSpecialChars,
  keymap,
  placeholder,
  rectangularSelection,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search'
import { syntaxHighlighting } from '@codemirror/language'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { noteCodeLanguages } from './codeLanguages'
import { fencedCodeStyling } from './fencedCode'
import { vscodeKeymap } from './keymap'
import { stickyHighlightStyle } from './highlight'
import { stickyTheme } from './theme'

interface Options {
  /** Called with the full document text whenever the user edits it. */
  onChange: (text: string) => void
  onBlur?: () => void
  placeholderText?: string
}

/**
 * The full extension set for a note. Deliberately hand-composed rather than
 * using the `codemirror` meta-package's `basicSetup`, which drags in line
 * numbers and a fold gutter — wrong furniture for a sticky note.
 */
export function noteExtensions({
  onChange,
  onBlur,
  placeholderText = 'Start typing…',
}: Options): Extension[] {
  return [
    // Prec.highest so our bindings beat defaultKeymap's.
    Prec.highest(keymap.of(vscodeKeymap)),

    history(),
    // drawSelection is what actually renders secondary cursors; without it
    // multi-cursor is enabled but invisible.
    drawSelection(),
    dropCursor(),
    rectangularSelection(), // Alt+drag
    crosshairCursor(), // crosshair while Alt is held
    highlightSpecialChars(),

    // Without this, every multi-cursor command silently collapses to one range.
    EditorState.allowMultipleSelections.of(true),
    EditorView.lineWrapping,

    markdown({ base: markdownLanguage, codeLanguages: noteCodeLanguages }),
    syntaxHighlighting(stickyHighlightStyle),
    fencedCodeStyling,

    search({ top: true }),
    highlightSelectionMatches(),
    placeholder(placeholderText),
    stickyTheme,

    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),

    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
      if (onBlur && update.focusChanged && !update.view.hasFocus) {
        onBlur()
      }
    }),
  ]
}
