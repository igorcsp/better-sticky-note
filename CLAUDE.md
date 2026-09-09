# CLAUDE.md — Better Sticky Notes

## Project Docs
- [project-scope.md](./project-scope.md) — features, architecture decisions, data model, project structure
- [tech-stack.md](./tech-stack.md) — every library with free-tier limits and rationale
- [implementation-plan.md](./implementation-plan.md) — phased task checklist (MVP → Phase 5)

## Stack (quick reference)
- **Desktop**: Electron 32 + electron-vite
- **UI**: React 18 + TypeScript + Vite
- **Editor**: CodeMirror 6 — whole note is a Markdown surface with VSCode keybindings
- **Auth**: Firebase Auth — Google OAuth, `browserLocalPersistence` (login once, never again unless logout)
- **DB**: Firestore (real-time sync, offline persistence)
- **State**: Zustand
- **Styling**: Tailwind CSS + shadcn/ui
- **Local storage**: electron-store (window positions, prefs)
- **Packaging**: electron-builder

## Architecture
- One `BrowserWindow` per note. URL param `?view=note&id=X` or `?view=dashboard` selects the React page.
- `electron/windowManager.ts` owns all window lifecycle.
- IPC via `contextBridge` — never expose Node APIs directly to the renderer.
- All tech must stay within **free tiers** (see tech-stack.md for limits).

---

## MCP Rules

### context7 — ALWAYS use before touching any library
Before writing or editing code that involves a library, fetch its current docs via context7. Never rely on training-data knowledge for APIs — these libraries update frequently.

Libraries that require context7 lookup before use:
- `@codemirror/*` — modular API, easy to import wrong package
- `firebase/*` — modular SDK v10+ syntax differs from v8
- `electron` — IPC and security APIs evolve each major version
- `electron-store` — API differs between v8 and v9+
- `zustand` — middleware and slice patterns
- `shadcn/ui` — component installation and prop API
- `electron-builder` — config schema and target options

```
// Example: before writing any CodeMirror code
mcp__context7__resolve-library-id("CodeMirror 6") → then mcp__context7__query-docs(...)
```

### filesystem — use for all file operations in this project
Prefer `mcp__filesystem__*` tools over the built-in Read/Write/Edit tools when working inside `C:/dev/better-sticky-notes`. Use `read_file`, `write_file`, `edit_file`, `directory_tree` for navigating and modifying the project.

### playwright — use to verify every UI change
After implementing any visible UI feature or fixing a bug that affects the rendered app, launch and verify with Playwright before reporting the task done. Do not claim a feature works without running it.

Verification checklist before closing a UI task:
1. `browser_navigate` to the Electron app's dev server or built app
2. `browser_snapshot` to confirm the expected elements are present
3. `browser_click` / `browser_type` / `browser_press_key` to exercise the interaction
4. `browser_take_screenshot` to capture the result

### github — use for all GitHub operations
Use `mcp__github__*` for creating releases, managing issues, and interacting with the repository. Do not use `gh` CLI unless the MCP cannot handle the operation.

---

## Commit Message Format

Every committable change must use this format:

```
<emoji> <type>: <short imperative description>
```

| Type | Emoji | When to use |
|---|---|---|
| `feat` | ✨ | New feature or user-facing addition |
| `fix` | 🐛 | Bug fix |
| `refactor` | ♻️ | Code change with no behavior change |
| `style` | 🎨 | Formatting, CSS, visual-only changes |
| `docs` | 📝 | Documentation only |
| `test` | 🧪 | Adding or fixing tests |
| `chore` | 🔧 | Build config, deps, tooling |
| `perf` | ⚡ | Performance improvement |
| `wip` | 🚧 | Work in progress (avoid on main) |

**Examples:**
```
✨ feat: open each note in its own Electron window
🐛 fix: prevent auto-save from overwriting note on first load
♻️ refactor: extract windowManager into separate module
🎨 style: apply per-note background color to window chrome
📝 docs: add Firebase setup steps to README
🔧 chore: configure electron-builder for Windows NSIS target
```

Rules:
- Description is lowercase, imperative mood ("add" not "adds" or "added")
- No period at the end
- Max ~72 characters total
- Do not commit unless the user explicitly asks
- **After every response where files were changed**, output a ready-to-use commit message at the end using the format above, wrapped in a code block. Label it `Suggested commit:`

---

## Task Tracking

After completing each task, mark it as done in [implementation-plan.md](./implementation-plan.md) by changing `- [ ]` to `- [x]` for that item. Do this immediately when the task is finished, before moving to the next one.

---

## Development Notes
- Run `npm run dev` to start Electron with Vite HMR
- Firebase config lives in `.env` (never commit — `.gitignore` it)
- `electron-store` data is at `%APPDATA%\better-sticky-notes\` on Windows
- Keep Firestore writes debounced (500 ms) to stay within the free-tier write quota
