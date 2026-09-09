import { LanguageDescription } from '@codemirror/language'

/**
 * Languages highlighted inside fenced code blocks.
 *
 * A curated static list rather than `@codemirror/language-data`. That package
 * loads each of its ~40 languages through a dynamic `import()`, which Vite
 * emits as a separate lazy chunk — and the packaged app loads the renderer
 * over `file://` (see `loadWindow` in electron/windowManager.ts), where
 * dynamic chunk loading is not something we can rely on. These `load`
 * functions resolve statically bundled modules instead, so a fence highlights
 * the same in dev and in the installed app.
 *
 * Adding a language is a one-line entry plus its `@codemirror/lang-*` dep.
 */
export const noteCodeLanguages: LanguageDescription[] = [
  LanguageDescription.of({
    name: 'javascript',
    alias: ['js', 'jsx', 'mjs', 'cjs', 'node'],
    extensions: ['js', 'jsx', 'mjs', 'cjs'],
    load: async () => (await import('@codemirror/lang-javascript')).javascript({ jsx: true }),
  }),
  LanguageDescription.of({
    name: 'typescript',
    alias: ['ts', 'tsx'],
    extensions: ['ts', 'tsx'],
    load: async () =>
      (await import('@codemirror/lang-javascript')).javascript({ jsx: true, typescript: true }),
  }),
  LanguageDescription.of({
    name: 'python',
    alias: ['py'],
    extensions: ['py'],
    load: async () => (await import('@codemirror/lang-python')).python(),
  }),
  LanguageDescription.of({
    name: 'json',
    extensions: ['json'],
    load: async () => (await import('@codemirror/lang-json')).json(),
  }),
  LanguageDescription.of({
    name: 'html',
    extensions: ['html', 'htm'],
    load: async () => (await import('@codemirror/lang-html')).html(),
  }),
  LanguageDescription.of({
    name: 'css',
    extensions: ['css'],
    load: async () => (await import('@codemirror/lang-css')).css(),
  }),
  LanguageDescription.of({
    name: 'sql',
    extensions: ['sql'],
    load: async () => (await import('@codemirror/lang-sql')).sql(),
  }),
  LanguageDescription.of({
    name: 'yaml',
    alias: ['yml'],
    extensions: ['yaml', 'yml'],
    load: async () => (await import('@codemirror/lang-yaml')).yaml(),
  }),
  LanguageDescription.of({
    name: 'rust',
    alias: ['rs'],
    extensions: ['rs'],
    load: async () => (await import('@codemirror/lang-rust')).rust(),
  }),
  LanguageDescription.of({
    name: 'java',
    extensions: ['java'],
    load: async () => (await import('@codemirror/lang-java')).java(),
  }),
  LanguageDescription.of({
    name: 'go',
    extensions: ['go'],
    load: async () => (await import('@codemirror/lang-go')).go(),
  }),
  LanguageDescription.of({
    name: 'xml',
    extensions: ['xml', 'svg'],
    load: async () => (await import('@codemirror/lang-xml')).xml(),
  }),
  LanguageDescription.of({
    name: 'shell',
    alias: ['bash', 'sh', 'zsh', 'powershell', 'ps1'],
    extensions: ['sh', 'bash'],
    load: async () => {
      const { LanguageSupport, StreamLanguage } = await import('@codemirror/language')
      const { shell } = await import('@codemirror/legacy-modes/mode/shell')
      // `load` must resolve to a LanguageSupport; a StreamLanguage needs wrapping.
      return new LanguageSupport(StreamLanguage.define(shell))
    },
  }),
]
