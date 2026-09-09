# Better Sticky Notes — Implementation Plan

Phases build on each other. Complete each phase fully before moving to the next.
The MVP is a strict subset of Phase 1 — ship it first, then continue.

---

## MVP — Auth + One Note

**Goal**: Electron app that signs in with Google once, creates one note, and saves it to Firestore. Nothing more.

**Done when**: User opens app → sees Google sign-in → authenticates → types in a text area → closes app → reopens → is still logged in, note content is restored from Firestore.

### Tasks

- [x] **Scaffold**: init project with `electron-vite` (Vite + Electron + TypeScript template)
- [x] **Dependencies**: install `firebase`, `react`, `react-dom`, `electron-store`
- [x] **Firebase init**: create `src/lib/firebase.ts` — initialize app, set `browserLocalPersistence`
- [x] **Auth**: `onAuthStateChanged` listener; if no user → render `<LoginScreen>` with "Sign in with Google" button using `signInWithPopup(GoogleAuthProvider)`
- [x] **Persistent session**: confirm that closing and reopening the app skips the login screen
- [x] **Single note**: after login, render a plain `<textarea>` bound to a `noteContent` state
- [x] **Auto-save**: debounce (500 ms) writes `noteContent` to `users/{uid}/notes/default` in Firestore
- [x] **Load on start**: on auth, read `users/{uid}/notes/default` from Firestore and populate the textarea
- [x] **Sign out**: add a "Sign out" button that calls `signOut()` and clears the view

---

## Phase 1 — Foundation

**Goal**: Multiple note windows, All Notes dashboard, full CRUD.

### Tasks

#### Electron multi-window
- [x] `electron/windowManager.ts`: map of `noteId → BrowserWindow`; functions `openNote(id)`, `closeNote(id)`, `openDashboard()`
- [x] Each window loads the same renderer bundle; URL query param `?view=note&id=X` or `?view=dashboard` determines which React page renders
- [x] `App.tsx` reads `window.location.search` and renders `<NoteWindow>` or `<Dashboard>`
- [x] IPC channel `note:open` — renderer sends noteId, main process calls `windowManager.openNote(id)`
- [x] IPC channel `note:close` — renderer notifies main; main removes from map
- [x] On app start: reopen all notes that were open when the app last closed (persisted in `electron-store`)

#### Firestore CRUD
- [x] `src/lib/firestore.ts`: `createNote()`, `updateNote()`, `deleteNote()`, `getNotes()`, `subscribeToNotes(callback)`
- [x] `createNote()` generates a Firestore doc ID and opens a new window for it
- [x] `subscribeToNotes` uses `onSnapshot` — dashboard reacts to changes in real time

#### State
- [x] `authStore` (Zustand): `user`, `loading`
- [x] `notesStore` (Zustand): `notes[]`, `openNoteIds[]`

#### Dashboard page
- [x] Grid of note cards (title + color preview + last updated)
- [x] "New Note" button → `createNote()` → opens new window
- [x] Click a card → `ipcRenderer.send('note:open', id)`
- [x] Delete button on card (moves to trash)

---

## Phase 2 — Rich Editor

**Goal**: Replace the plain textarea with a CodeMirror 6 Markdown editor with VSCode-style editing.

> **Architecture change**: originally planned as TipTap (rich text) + CodeMirror (code blocks only).
> Changed to **the whole note being a CodeMirror surface editing raw Markdown**, so the VSCode
> shortcuts work everywhere in a note rather than only inside a fenced block. TipTap is not used.
> Notes are *styled source* (a `#` heading renders large and bold, the `#` stays visible), not WYSIWYG.
> `content` therefore stays a Markdown `string` — no format migration, existing notes load as-is.

### Tasks

#### CodeMirror 6 editor surface
- [x] Install `@codemirror/{state,view,commands,search,language,lang-markdown,language-data}` + `@lezer/highlight`
- [x] `src/components/editor/theme.ts` — sticky-note theme (transparent bg, proportional font, amber selection/panel)
- [x] `src/components/editor/highlight.ts` — `HighlightStyle` so Markdown looks styled; syntax markers muted
- [x] `src/components/editor/extensions.ts` — extension composition (hand-composed, not `basicSetup`)
- [x] `src/components/editor/useCodeMirror.ts` — StrictMode-safe view lifecycle with `view.destroy()` cleanup
- [x] `src/components/editor/NoteEditor.tsx` — React wrapper
- [x] `src/components/editor/codeLanguages.ts` — curated static language list for fenced code blocks (js/ts, python, json, html, css, sql, yaml, rust, java, go, xml, shell)
- [x] `src/components/editor/fencedCode.ts` — `ViewPlugin` marking fence lines so they stay monospace once a language parser takes over

#### VSCode keybindings (real VSCode bindings, not the earlier draft)
- [x] `Ctrl+D` select next occurrence — free in `searchKeymap`
- [x] `Ctrl+F` find / `Ctrl+H` find & replace with regex — panel opens focused on the replace field
- [x] `Ctrl+Alt+↑/↓` add cursor above/below — free in `defaultKeymap`
- [x] `Alt+↑/↓` move line — free in `defaultKeymap`
- [x] `Shift+Alt+↑/↓` duplicate line — free in `defaultKeymap`
- [x] `Ctrl+Shift+Alt+↑/↓` column select; `Alt+drag` rectangular selection
- [x] `Ctrl+Z` undo / `Ctrl+Shift+Z` redo — redo needs an explicit binding on Windows (`historyKeymap` only maps it on macOS)
- [x] `EditorState.allowMultipleSelections` + `drawSelection()` enabled (both required for multi-cursor)

#### Note persistence
- [x] `src/lib/noteTitle.ts` — `deriveTitle()` strips Markdown markers so the title isn't `# Shopping list`
- [x] Editor mounts only after the note loads, so the loaded doc is the initial document and can never trigger a save
- [x] Load race guard — a slow `getDoc` resolving late can no longer clobber the buffer
- [x] Flush the pending debounced save on blur and on unmount (previously edits within 500 ms of closing were lost)

#### Cleanup
- [x] Remove "Sign out" button from `NoteWindow` toolbar — keep it only in the `Dashboard` header
- [x] Drop Electron's default application menu (pulled forward from Phase 4) — its Edit-role accelerators swallow `Ctrl+Z`/`Ctrl+Shift+Z`/`Ctrl+A` before the renderer sees them and drive native commands CodeMirror does not track; a View-only menu is kept in dev

---

## Phase 3 — Notes Management

**Goal**: Usable notes lifecycle with search, filters, and trash.

### Tasks

#### Dashboard improvements
- [ ] Search bar — client-side filter on `title` and `content` (Markdown text; reuse `stripMarkdown()` from `src/lib/noteTitle.ts`)
- [ ] Sort options: last modified, created, title A–Z
- [ ] Filter toggle: All / Pinned / Archived
- [ ] Structure sidebar with "All Notes", "Pinned", "Archived", "Trash" — ready to add Categories section later

#### Note actions
- [ ] Copy-to-clipboard button in note toolbar — copies the full note content (raw Markdown) to the clipboard; shows a brief "Copied!" confirmation
- [ ] Pin / Unpin (sets `pinned: true`, floats to top in dashboard)
- [ ] Archive (sets `archived: true`, hides from main list)
- [ ] Move to Trash (sets `deletedAt: now()`)
- [ ] Trash view: shows deleted notes, "Restore" and "Delete Forever" actions
- [ ] Purge notes where `deletedAt` is older than 30 days (run on app start)

---

## Phase 4 — Customization & Window Behavior

**Goal**: Each note is visually distinct and windows behave like sticky notes.

### Tasks

#### Per-note customization
- [ ] Color picker in note toolbar — preset palette (8 colors) + custom hex input; saves `color` to Firestore
- [ ] Font size slider (12–24 px); saves `fontSize` to Firestore
- [ ] Note window background color follows the note's `color` value
- [ ] Save confirmed icon in note toolbar — cloud-check icon appears after a successful Firestore write; auto-hides after 2 s
- [ ] Sync warning icon in note toolbar — warning icon appears on Firestore write failure; persists until the next successful save

#### App theme
- [ ] Light / Dark / System toggle in settings; persisted in `electron-store`
- [ ] Tailwind `dark:` classes throughout

#### Window behavior
- [ ] Remove native window frame: set `frame: false` on all BrowserWindows in `electron/windowManager.ts` (the menu bar is already gone — done in Phase 2)
- [ ] Custom title bar on all windows: drag region (`-webkit-app-region: drag`) + custom close button that sends IPC channel `window:close` → `win.close()`; note windows also get a minimize button
- [ ] Always-on-top toggle per note window (`win.setAlwaysOnTop(bool)` via IPC)
- [ ] System tray icon: left-click opens dashboard, right-click menu has "New Note" and "Quit"
- [ ] Global hotkey (`Ctrl+Alt+N` default, configurable in settings) calls `createNote()`
- [ ] Window position + size saved to `electron-store` keyed by `noteId`; restored on next open
- [ ] Persist note window dimensions on every `resize` event (debounced 300 ms) so each note remembers its size independently

#### Dashboard extras
- [ ] "Keyboard Shortcuts" button in dashboard header opens a `ShortcutsWindow` (`?view=shortcuts`) listing all Edit, View, and Window shortcuts for the editor and app

---

## Phase 5 — Polish & Distribution

**Goal**: Stable, shippable app with CI/CD.

### Tasks

#### Reliability
- [ ] Offline banner: detect `navigator.onLine`; show "Working offline — changes will sync when reconnected"
- [ ] Sync indicator in note toolbar (idle / saving / saved / error)
- [ ] Handle Firestore write errors with a retry queue

#### Testing
- [ ] Auth tests: unit-test `authStore` and Firebase Auth flows (sign-in, sign-out, session restore) using mocked Firebase SDK
- [ ] Note creation tests: test `createNote()`, `updateNote()`, `deleteNote()` against a Firestore emulator or mock

#### GitHub Actions CI
- [ ] `.github/workflows/ci.yml`: on push to `main` → `npm run typecheck` + `npm run lint`
- [ ] `.github/workflows/release.yml`: on `v*` tag → `npm run build` → upload `.exe` to GitHub Releases
- [ ] Sign the installer (optional, requires a code signing cert; document how to skip)

#### Documentation
- [ ] `README.md`: prerequisites, Firebase project setup (step-by-step with screenshots), clone → fill `.env` → `npm install` → `npm run dev`
- [ ] `.env.example` with all required Firebase config keys and comments

---

## Milestone Summary

| Milestone | Key deliverable |
|---|---|
| **MVP** | Login once, type a note, it saves to Firestore |
| **Phase 1** | Multiple notes, each in their own window; All Notes dashboard |
| **Phase 2** | Full rich text + VSCode-like editing shortcuts |
| **Phase 3** | Search, filters, pin, archive, trash |
| **Phase 4** | Note colors, font size, always-on-top, tray, global hotkey |
| **Phase 5** | Stable app, CI/CD, distributable Windows installer |
