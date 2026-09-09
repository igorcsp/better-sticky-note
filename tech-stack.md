# Better Sticky Notes — Tech Stack

All tools and services are **free** or have a free tier generous enough for personal use and small teams.

---

## Desktop Framework — Electron 32+

- **Why**: Cross-platform desktop apps using web technologies (HTML/CSS/JS). No Rust or native toolchain required — just Node.js.
- **Cost**: Free (MIT)
- **Build tool**: `electron-builder` for packaging Windows `.exe` installers
- **IPC**: `contextBridge` + `ipcMain`/`ipcRenderer` for safe main ↔ renderer communication
- **Bundled with**: Chromium + Node.js (larger binary ~120 MB installer, acceptable for desktop)

---

## UI — React 18 + TypeScript + Vite

- **Why**: Familiar stack; Vite gives fast HMR inside Electron via `vite-plugin-electron`
- **Cost**: Free (MIT)
- **Key packages**:
  - `react`, `react-dom` — UI rendering
  - `typescript` — type safety
  - `vite` + `vite-plugin-electron` — dev server and build

---

## Text Editor — CodeMirror 6

The **entire note** is a CodeMirror 6 editor over raw Markdown. TipTap was evaluated and dropped:
scoping CodeMirror to code blocks only would have confined multi-cursor and find & replace to
fenced blocks, which is the opposite of the goal.

- **Why**: powers the editing engine behind many code editors; native multi-cursor, find/replace,
  rectangular selection and keymap support — everything Phase 2 needs, without a second editor layer
- **Cost**: Free (MIT)
- **Used for**: multi-cursor (`Ctrl+D`, `Ctrl+Alt+↑/↓`), find & replace with regex (`Ctrl+H`),
  column selection (`Alt+drag`), move line (`Alt+↑/↓`), duplicate line (`Shift+Alt+↑/↓`)
- **Key packages**: `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`,
  `@codemirror/search`, `@codemirror/language`, `@codemirror/lang-markdown`,
  `@codemirror/language-data`, `@lezer/highlight`
- **Rendering model**: *styled source*, not WYSIWYG. A custom `HighlightStyle` makes headings render
  larger and bold, `**bold**` render bold, and code render monospace, while the Markdown markers stay
  visible but muted — the Obsidian source-mode approach.
- **Storage**: notes are stored as a Markdown `string`, so search, previews, and export stay trivial
  and no content migration is ever needed.

---

## Authentication — Firebase Auth

- **Why**: Google OAuth in a few lines; persistent sessions out of the box; no auth server to maintain
- **Cost**: Free (Spark plan)
  - Google OAuth provider: free, unlimited
  - No monthly active user limits for OAuth providers on Spark
- **Persistence**: `browserLocalPersistence` (default) — token stored in Electron's localStorage at `%APPDATA%\better-sticky-notes`. App reads the cached token on every launch; Firebase silently refreshes expired tokens. User is never prompted again after first login unless they explicitly sign out.
- **Package**: `firebase` (modular SDK v10+)

---

## Database — Cloud Firestore

- **Why**: Real-time document sync, offline persistence, no server to run, tight Firebase Auth integration
- **Cost**: Free (Spark plan)
  - **Storage**: 1 GiB
  - **Reads**: 50,000 / day
  - **Writes**: 20,000 / day
  - **Deletes**: 20,000 / day
  - More than enough for personal use (a typical note edit = 1 write; loading the dashboard = ~50–200 reads)
- **Offline**: `enableIndexedDbPersistence()` caches data locally — notes are readable and editable offline, synced when reconnected
- **Package**: `firebase/firestore` (modular SDK)

---

## State Management — Zustand

- **Why**: Minimal boilerplate, excellent TypeScript inference, no Provider wrappers needed
- **Cost**: Free (MIT)
- **Stores**:
  - `authStore` — current user, auth loading state
  - `notesStore` — notes list, open tabs, active note
  - `uiStore` — theme, sidebar open/close, sync status

---

## Styling — Tailwind CSS + shadcn/ui

- **Why**: Utility-first CSS eliminates custom stylesheet sprawl; shadcn/ui provides accessible, unstyled components you own (no vendor lock-in)
- **Cost**: Free (MIT)
- **Used for**: Layout, color theming, spacing, responsive design; dialogs, dropdowns, color pickers, tooltips from shadcn/ui

---

## Local Persistence — electron-store

- **Why**: Persists user preferences and window state (position, size, always-on-top) to a local JSON file in `%APPDATA%`. Works in the Electron main process, survives app restarts.
- **Cost**: Free (MIT)
- **Stored locally** (not in Firestore):
  - Window positions per note
  - Theme preference
  - Last open tabs
  - Global hotkey binding

---

## Packaging & Distribution — electron-builder

- **Why**: Mature, well-documented Electron packaging tool; produces NSIS `.exe` installers for Windows
- **Cost**: Free (MIT)
- **Output**: `better-sticky-notes-setup-x.x.x.exe` (NSIS installer with auto-update support)
- **Auto-update**: `electron-updater` pointing to GitHub Releases (free for public repos)

---

## CI / CD — GitHub Actions

- **Why**: Free for public repositories; builds and publishes Windows installers on tagged releases
- **Cost**: Free for public repos (2,000 minutes/month for private)
- **Workflow**:
  - On push to `main`: run lint + type-check
  - On `v*` tag: build Windows installer → upload to GitHub Releases

---

## Summary Table

| Layer | Package / Service | License / Cost |
|---|---|---|
| Desktop | Electron 32 | MIT / Free |
| UI | React 18 + TypeScript + Vite | MIT / Free |
| Editor | CodeMirror 6 (Markdown surface, VSCode keybindings) | MIT / Free |
| Auth | Firebase Auth (Google OAuth) | Free tier (Spark) |
| Database | Cloud Firestore | Free tier (Spark) |
| State | Zustand | MIT / Free |
| Styling | Tailwind CSS + shadcn/ui | MIT / Free |
| Local storage | electron-store | MIT / Free |
| Packaging | electron-builder + electron-updater | MIT / Free |
| CI/CD | GitHub Actions | Free (public repo) |
