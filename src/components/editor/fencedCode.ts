import { syntaxTree } from '@codemirror/language'
import { RangeSetBuilder } from '@codemirror/state'
import {
  Decoration,
  ViewPlugin,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view'

const codeLine = Decoration.line({ class: 'cm-md-code-line' })

/**
 * Marks every line inside a fenced code block so the theme can render it
 * monospace.
 *
 * Needed because `tags.monospace` only reaches fence bodies that stay
 * un-parsed. As soon as `codeLanguages` matches the info string (```js), the
 * body is parsed by that language and its tokens carry language tags instead —
 * so the fence would otherwise render in the proportional prose font while
 * inline `code` stayed monospace.
 */
function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter(node) {
        if (node.name !== 'FencedCode' && node.name !== 'CodeBlock') return
        const start = view.state.doc.lineAt(node.from).number
        const end = view.state.doc.lineAt(node.to).number
        for (let n = start; n <= end; n++) {
          builder.add(view.state.doc.line(n).from, view.state.doc.line(n).from, codeLine)
        }
      },
    })
  }
  return builder.finish()
}

export const fencedCodeStyling = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (plugin) => plugin.decorations }
)
