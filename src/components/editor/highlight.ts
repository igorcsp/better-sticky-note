import { HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const MONO = 'ui-monospace, SFMono-Regular, "Cascadia Mono", Consolas, monospace'

/**
 * Makes raw Markdown *look* styled without hiding the source: headings render
 * larger and bold, `**bold**` renders bold, code renders monospace — but the
 * `#` / `**` / `-` markers stay visible, just muted so they recede.
 *
 * Also covers the tokens produced inside fenced code blocks, since
 * `markdown({ codeLanguages })` parses those with the real language parser.
 */
export const stickyHighlightStyle = HighlightStyle.define([
  // --- Markdown structure -------------------------------------------------
  { tag: tags.heading1, fontSize: '1.5em', fontWeight: '700', lineHeight: '1.3' },
  { tag: tags.heading2, fontSize: '1.3em', fontWeight: '700', lineHeight: '1.3' },
  { tag: tags.heading3, fontSize: '1.15em', fontWeight: '700' },
  { tag: [tags.heading4, tags.heading5, tags.heading6], fontWeight: '700' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.quote, color: '#78716c', fontStyle: 'italic' },
  { tag: tags.list, color: '#a16207' },
  { tag: tags.link, color: '#1d4ed8', textDecoration: 'underline' },
  { tag: tags.url, color: '#2563eb' },
  { tag: tags.contentSeparator, color: '#a16207', fontWeight: '700' },
  { tag: tags.monospace, fontFamily: MONO, fontSize: '0.9em', color: '#9a3412' },

  // The syntax markers themselves (#, **, -, >, ```). Muted, not hidden.
  { tag: tags.processingInstruction, color: '#d6d3d1' },

  // --- Tokens inside fenced code blocks -----------------------------------
  { tag: tags.keyword, color: '#7c3aed' },
  { tag: [tags.controlKeyword, tags.moduleKeyword], color: '#c026d3' },
  { tag: [tags.string, tags.special(tags.string)], color: '#15803d' },
  { tag: tags.comment, color: '#78716c', fontStyle: 'italic' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: '#b45309' },
  { tag: tags.variableName, color: '#1f2937' },
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: '#1d4ed8' },
  { tag: [tags.typeName, tags.className], color: '#0e7490' },
  { tag: tags.propertyName, color: '#0369a1' },
  { tag: tags.operator, color: '#a16207' },
  { tag: tags.invalid, color: '#dc2626' },
])
