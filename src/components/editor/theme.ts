import { EditorView } from '@codemirror/view'

/**
 * Sticky-note look for the CodeMirror surface.
 *
 * Two deliberate departures from CodeMirror's defaults:
 *  - transparent background, so the per-note colour (Phase 4) shows through
 *  - a proportional font on `.cm-scroller`; CodeMirror is monospace everywhere
 *    by default, which is wrong for prose. Monospace comes back only for code,
 *    via the `tags.monospace` rule in highlight.ts.
 */
export const stickyTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#1f2937',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.6',
    padding: '1rem',
  },
  '.cm-content': {
    caretColor: '#1f2937',
    padding: '0',
  },
  // Fence bodies parsed by a language lose tags.monospace; fencedCode.ts
  // marks their lines so they still render as code.
  '.cm-md-code-line': {
    fontFamily: 'ui-monospace, SFMono-Regular, "Cascadia Mono", Consolas, monospace',
    fontSize: '0.9em',
    backgroundColor: 'rgba(120, 53, 15, 0.04)',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#1f2937',
    borderLeftWidth: '2px',
  },
  // Multi-cursor: secondary carets are drawn by drawSelection(), not the browser.
  // These selectors mirror the shape of @codemirror/view's own base theme
  // rules — a shorter selector loses to them on specificity and the amber
  // never applies.
  // Match the selector shape of @codemirror/view's base theme: a shorter
  // selector loses on specificity and the amber never applies. (`&light` is
  // a baseTheme-only construct and throws inside EditorView.theme.)
  '.cm-selectionLayer .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#fde68a',
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: '#fcd34d',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#fef08a',
  },
  '.cm-placeholder': {
    color: '#ca8a04',
  },
  // Find & replace panel, themed to match the yellow-100 window chrome.
  '.cm-panels': {
    backgroundColor: '#fef3c7',
    color: '#78350f',
    border: 'none',
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid #fde68a',
  },
  '.cm-panel.cm-search': {
    padding: '6px 8px',
  },
  '.cm-panel.cm-search input, .cm-panel.cm-search button, .cm-panel.cm-search label': {
    fontSize: '12px',
  },
  '.cm-panel.cm-search input[type="text"]': {
    border: '1px solid #fcd34d',
    borderRadius: '4px',
    padding: '2px 6px',
    backgroundColor: '#fffbeb',
  },
  '.cm-searchMatch': {
    backgroundColor: '#fde047',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#facc15',
  },
})
