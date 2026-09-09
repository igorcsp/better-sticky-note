/**
 * Derives a note title from its Markdown body.
 *
 * Notes are stored as raw Markdown, so the first line is often `# Shopping
 * list` or `- milk`. Strip the block marker and any inline emphasis so the
 * dashboard shows "Shopping list", not "# Shopping list".
 */
export function deriveTitle(markdown: string): string {
  const firstLine = markdown.split('\n').find((line) => line.trim().length > 0) ?? ''
  return stripMarkdown(firstLine).slice(0, 80) || 'New Note'
}

/** Strips Markdown block markers and inline emphasis from a single line. */
export function stripMarkdown(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, '') // # heading
    .replace(/^\s{0,3}>\s?/, '') // > blockquote
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '') // - bullet / 1. ordered
    .replace(/^\s{0,3}(?:```|~~~).*$/, '') // ``` code fence
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/[*_`~]/g, '') // inline emphasis marks
    .trim()
}
