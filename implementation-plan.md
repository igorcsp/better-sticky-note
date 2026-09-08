# Better Sticky Notes — Implementation Plan

Phases build on each other. Complete each phase fully before moving to the next.
The MVP is a strict subset of Phase 1 — ship it first, then continue.

---

## MVP — Auth + One Note

**Goal**: Electron app that signs in with Google once, creates one note, and saves it to Firestore. Nothing more.

**Done when**: User opens app → sees Google sign-in → authenticates → types in a text area → closes app → reopens → is still logged in, note content is restored from Firestore.

### Tasks

- [ ] **Scaffold**: init project with `electron-vite` (Vite + Electron + TypeScript template)
- [ ] **Dependencies**: install `firebase`, `react`, `react-dom`, `electron-store`
- [ ] **Firebase init**: create `src/lib/firebase.ts` — initialize app, set `browserLocalPersistence`
- [ ] **Auth**: `onAuthStateChanged` listener; if no user → render `<LoginScreen>` with "Sign in with Google" button using `signInWithPopup(GoogleAuthProvider)`
- [ ] **Persistent session**: confirm that closing and reopening the app skips the login screen
- [ ] **Single note**: after login, render a plain `<textarea>` bound to a `noteContent` state
- [ ] **Auto-save**: debounce (500 ms) writes `noteContent` to `users/{uid}/notes/default` in Firestore
- [ ] **Load on start**: on auth, read `users/{uid}/notes/default` from Firestore and populate the textarea
- [ ] **Sign out**: add a "Sign out" button that calls `signOut()` and clears the view

---

## Phase 1 — Foundation

**Goal**: Multiple note windows, All Notes dashboard, full CRUD.

### Tasks

#### Electron multi-window
- [ ] `electron/windowManager.ts`: map of `noteId → BrowserWindow`; functions `openNote(id)`, `closeNote(id)`, `openDashboard()`
- [ ] Each window loads the same renderer bundle; URL query param `?view=note&id=X` or `?view=dashboard` determines which React page renders
- [ ] `App.tsx` reads `window.location.search` and renders `<NoteWindow>` or `<Dashboard>`
- [ ] IPC channel `note:open` — renderer sends noteId, main process calls `windowManager.openNote(id)`
- [ ] IPC channel `note:close` — renderer notifies main; main removes from map
- [ ] On app start: reopen all notes that were open when the app last closed (persisted in `electron-store`)

#### Firestore CRUD
- [ ] `src/lib/firestore.ts`: `createNote()`, `updateNote()`, `deleteNote()`, `getNotes()`, `subscribeToNotes(callback)`
- [ ] `createNote()` generates a Firestore doc ID and opens a new window for it
- [ ] `subscribeToNotes` uses `onSnapshot` — dashboard reacts to changes in real time

#### State
- [ ] `authStore` (Zustand): `user`, `loading`
- [ ] `notesStore` (Zustand): `notes[]`, `openNoteIds[]`

#### Dashboard page
- [ ] Grid of note cards (title + color preview + last updated)
- [ ] "New Note" button → `createNote()` → opens new window
- [ ] Click a card → `ipcRenderer.send('note:open', id)`
- [ ] Delete button on card (moves to trash)

---

## Phase 2 — Rich Editor

**Goal**: Replace the plain textarea with a full TipTap + CodeMirror 6 editor.

### Tasks

#### TipTap (rich text marks)
- [ ] Install `@tiptap/react`, `@tiptap/starter-kit` and needed extensions
- [ ] `src/components/editor/RichEditor.tsx` — TipTap editor component
- [ ] Extensions to enable: Bold, Italic, Underline, Strike, Code, Heading (H1–H3), BulletList, OrderedList, Blockquote, CodeBlock, History
- [ ] Toolbar component with buttons + keyboard shortcut labels
- [ ] Store note content as TipTap JSON in Firestore (`content` field)

#### CodeMirror 6 (code blocks + VSCode keybindings)
- [ ] Install `@codemirror/view`, `@codemirror/state`, `@codemirror/commands`, `@codemirror/search`, `@codemirror/language`
- [ ] Replace TipTap's default `CodeBlock` with a custom node that renders a `CodeMirror` view
- [ ] Wire up `defaultKeymap`, `searchKeymap` (activates `Ctrl+H` find & replace panel)
- [ ] Multi-cursor: `Ctrl+D` selects next occurrence, `Ctrl+Alt+↓` adds cursor below
- [ ] Move line: `Alt+↑` / `Alt+↓`
- [ ] Duplicate line: `Ctrl+Shift+D`
- [ ] Column selection: `Alt+Shift+↓` or `Alt+drag`

---

## Phase 3 — Notes Management

**Goal**: Usable notes lifecycle with search, filters, and trash.

### Tasks

#### Dashboard improvements
- [ ] Search bar — client-side filter on `title` and `content` (plain text extracted from TipTap JSON)
- [ ] Sort options: last modified, created, title A–Z
- [ ] Filter toggle: All / Pinned / Archived
- [ ] Structure sidebar with "All Notes", "Pinned", "Archived", "Trash" — ready to add Categories section later

#### Note actions
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

#### App theme
- [ ] Light / Dark / System toggle in settings; persisted in `electron-store`
- [ ] Tailwind `dark:` classes throughout

#### Window behavior
- [ ] Always-on-top toggle per note window (`win.setAlwaysOnTop(bool)` via IPC)
- [ ] System tray icon: left-click opens dashboard, right-click menu has "New Note" and "Quit"
- [ ] Global hotkey (`Ctrl+Alt+N` default, configurable in settings) calls `createNote()`
- [ ] Window position + size saved to `electron-store` keyed by `noteId`; restored on next open

---

## Phase 5 — Polish & Distribution

**Goal**: Stable, shippable app with CI/CD.

### Tasks

#### Reliability
- [ ] Offline banner: detect `navigator.onLine`; show "Working offline — changes will sync when reconnected"
- [ ] Sync indicator in note toolbar (idle / saving / saved / error)
- [ ] Handle Firestore write errors with a retry queue

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
