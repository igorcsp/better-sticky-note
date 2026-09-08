# Better Sticky Notes — Project Scope

## Overview

A Windows desktop note-taking app inspired by sticky notes, with rich text editing, real-time cloud sync, and Google authentication. Intended for personal use and distributed on GitHub for others to self-configure.

Full tech stack details are documented in [tech-stack.md](./tech-stack.md).
Development phases and task breakdown are in [implementation-plan.md](./implementation-plan.md).

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Window model | One `BrowserWindow` per note + separate All Notes window | More authentic sticky-note feel; allows future categories/folders in the dashboard |
| Editor | TipTap + CodeMirror 6 integrated from the start | Both from the start avoids a painful migration mid-project |

---

## Features

### Core
- [ ] Google OAuth sign-in on first launch only — session persists until explicit logout
- [ ] Create, read, update, delete notes
- [ ] Notes auto-save to Firestore on every change (debounced 500 ms)
- [ ] Real-time sync — open the app on two machines, edits appear on both
- [ ] Offline support — notes work without internet, sync on reconnect

### Editor
- [ ] Rich text: bold, italic, underline, strikethrough, inline code
- [ ] Headings (H1–H3), bullet lists, numbered lists, blockquotes
- [ ] Code blocks with syntax highlighting
- [ ] Multi-cursor editing (`Ctrl+D` select next occurrence, `Ctrl+Alt+↓` add cursor below)
- [ ] Find & Replace (`Ctrl+H`) with regex support
- [ ] Column selection (`Alt+drag` or `Alt+Shift+↓`)
- [ ] Undo/Redo (`Ctrl+Z` / `Ctrl+Shift+Z`)
- [ ] Select all (`Ctrl+A`), duplicate line (`Ctrl+Shift+D`)
- [ ] Move line up/down (`Alt+↑/↓`)

### Notes Management
- [ ] Each note opens in its own Electron window (independent, resizable, movable)
- [ ] "All Notes" dashboard — separate window, grid or list view with search
- [ ] Dashboard ready for categories/folders filter in a future phase
- [ ] Pin notes to top
- [ ] Archive / soft-delete notes
- [ ] Trash with 30-day recovery

### Customization
- [ ] Per-note background color (preset palette + custom hex)
- [ ] Per-note font size
- [ ] Light / dark / system theme
- [ ] Note width/height resize (snap to grid)

### Window Behavior (Electron)
- [ ] Always-on-top toggle per note
- [ ] Minimize to system tray
- [ ] Global hotkey to create new note (configurable)
- [ ] Remember window positions per note

---

## Authentication Flow

Firebase Auth with `browserLocalPersistence` (the default) stores the auth token in the Electron app's localStorage, which lives in `%APPDATA%\better-sticky-notes`. On every subsequent app launch, `onAuthStateChanged` fires with the cached user and silently refreshes the token — no login prompt.

```
First launch:
  App opens → no cached token → show Google sign-in → user authenticates
  → token stored in localStorage → app loads notes

Every subsequent launch:
  App opens → Firebase reads cached token → silently refreshes if expired
  → onAuthStateChanged fires with user → app loads notes (no prompt)

Logout:
  User clicks "Sign out" → Firebase clears token → next launch shows sign-in again
```

---

## Data Model (Firestore)

```
users/{userId}
  displayName: string
  email: string
  createdAt: timestamp

users/{userId}/notes/{noteId}
  title: string           // derived from first line, editable
  content: string         // TipTap JSON
  color: string           // hex color e.g. "#FFF176"
  fontSize: number        // default 14
  pinned: boolean
  archived: boolean
  deletedAt: timestamp | null
  createdAt: timestamp
  updatedAt: timestamp

users/{userId}/windowStates/{noteId}
  x: number               // stored locally via electron-store, synced to Firestore
  y: number               // so window positions follow the user across machines
  width: number
  height: number
  alwaysOnTop: boolean
```

---

## Project Structure

```
better-sticky-notes/
├── electron/
│   ├── main.ts               # Main process: creates/manages BrowserWindows
│   ├── preload.ts            # Context bridge (IPC exposed to renderer)
│   ├── windowManager.ts      # Tracks open note windows, opens/closes/restores them
│   └── tray.ts               # System tray icon and menu
├── src/                      # React renderer (shared bundle, route decides which view)
│   ├── pages/
│   │   ├── NoteWindow.tsx    # Single note editor view (one per window)
│   │   └── Dashboard.tsx     # All Notes listing view
│   ├── components/
│   │   ├── editor/           # TipTap + CodeMirror wrappers
│   │   ├── notes/            # NoteCard (dashboard), NoteToolbar
│   │   └── ui/               # shadcn base components
│   ├── hooks/                # useNotes, useAuth, useSync
│   ├── store/                # Zustand slices
│   ├── lib/
│   │   ├── firebase.ts       # Firebase init + persistence config
│   │   └── firestore.ts      # CRUD helpers
│   ├── types/
│   └── App.tsx               # Router: ?view=note&id=X or ?view=dashboard
├── .env.example              # Firebase config keys (users fill this in)
├── electron-builder.yml      # Packaging config
├── project-scope.md
├── tech-stack.md
├── implementation-plan.md
└── README.md
```

---

## Distribution Plan

1. GitHub repository with MIT license
2. Users clone the repo and fill in `.env` with their own Firebase project credentials
3. Firebase setup guide in README (create project → enable Google Auth → enable Firestore → copy config)
4. GitHub Releases with pre-built Windows installers (`.exe` NSIS installer) via GitHub Actions
5. GitHub Actions CI: build on push to `main`, publish installer on tagged release (`v*`)

---

## Development Phases

See [implementation-plan.md](./implementation-plan.md) for detailed task breakdown.

### MVP — Auth + One Note
- Electron scaffold, Firebase Auth with persistent session
- Create and auto-save a single note to Firestore

### Phase 1 — Foundation
- Multi-window manager (one window per note)
- All Notes dashboard window
- Full Firestore CRUD

### Phase 2 — Rich Editor
- TipTap + CodeMirror 6 integrated together
- Bold, italic, lists, headings, code blocks, multi-cursor, find & replace

### Phase 3 — Notes Management
- All Notes dashboard with search and filters
- Pinning, archiving, trash with 30-day recovery
- Dashboard structure ready for categories/folders

### Phase 4 — Customization & Window Behavior
- Per-note color picker and font size
- Light / dark / system theme
- Always-on-top, system tray, global hotkey
- Window position memory via electron-store

### Phase 5 — Polish & Distribution
- Offline indicator + sync status
- GitHub Actions release pipeline (Windows `.exe`)
- README and Firebase setup guide
