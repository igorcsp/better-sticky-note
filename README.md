# Better Sticky Notes

A desktop sticky notes app with real-time cloud sync, Markdown editing, and multi-window support. Built with Electron, React, and Firebase.

## Download & Install

Go to [Releases](https://github.com/igorcsp/better-sticky-note/releases) and download the installer for your platform:

| Platform | File |
|----------|------|
| Windows | `Better-Sticky-Notes-Setup-x.x.x.exe` |
| macOS | `Better-Sticky-Notes-x.x.x.dmg` |
| Linux | `Better-Sticky-Notes-x.x.x.AppImage` |

**Access is invite-only.** The releases above connect to the owner's database. If you sign in without an invite you will see an "Access restricted" screen. To use the app, ask the owner for access — or set up your own Firebase project by following the [Developer Setup](#developer-setup) below.

> **First-launch warnings**
> - **Windows**: SmartScreen may show "Windows protected your PC." Click **More info → Run anyway**.
> - **macOS**: Gatekeeper may block the app. Go to **System Settings → Privacy & Security** and click **Open Anyway**.

---

## Keyboard shortcuts

The editor uses VSCode-style keybindings throughout.

| Shortcut | Action |
|---|---|
| `Ctrl+F` | Find |
| `Ctrl+H` | Find & Replace (focused on replace field) |
| `Ctrl+D` | Select next occurrence |
| `Ctrl+F2` | Select all occurrences |
| `Ctrl+A` | Select all |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Alt+↑ / ↓` | Move line up / down |
| `Shift+Alt+↑ / ↓` | Copy line up / down |
| `Ctrl+Alt+↑ / ↓` | Add cursor above / below |
| `Ctrl+Shift+Alt+↑ / ↓` | Add cursor in column above / below |
| `Alt+drag` | Rectangular (column) selection |

---

## Developer Setup

### Prerequisites

- Node.js 20+
- A [Firebase](https://console.firebase.google.com/) project with:
  - **Authentication** enabled (Google provider)
  - **Firestore** enabled (start in production mode)

### Firebase project setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Enable **Authentication** → Sign-in method → Google
3. Enable **Firestore Database** → Start in production mode
4. Go to **Project settings** → **Your apps** → Add a web app → copy the config
5. In Firestore → **Rules**, paste and publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read their own invite document to check access status.
    // Only the Firebase Console / Admin SDK can write here.
    match /allowedUsers/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }

    // Notes are only accessible to users with an active invite.
    match /users/{uid}/notes/{noteId} {
      allow read, write: if request.auth != null
        && request.auth.uid == uid
        && exists(/databases/$(database)/documents/allowedUsers/$(uid));
    }
  }
}
```

6. **Before publishing these rules**, add yourself to the allowlist (see [Managing access](#managing-access)) or you will be locked out immediately.

### Managing access

The app is invite-only. Access is controlled by the `allowedUsers` Firestore collection.

**To grant access to a friend:**
1. Ask them to open the app and attempt to sign in — this creates their Firebase Auth account.
2. In [Firebase Console](https://console.firebase.google.com/) → **Authentication** → **Users**, find their email and copy their **UID**.
3. Go to **Firestore** → open (or create) the `allowedUsers` collection.
4. Add a document with **Document ID = their UID** and any field, e.g. `email: "friend@gmail.com"`.
5. They can now sign in immediately — no app restart needed.

**To revoke access:** delete the document from `allowedUsers`.

**To add yourself (bootstrap):** do step 2–4 above with your own UID while the old permissive rules are still active, then publish the new rules.

### Local development

```bash
git clone https://github.com/igorcsp/better-sticky-note.git
cd better-sticky-note
cp .env.example .env
# Fill in your Firebase config values in .env
npm install
npm run dev
```

### Build installer

```bash
npm run dist
# Installer is output to dist/
```

### Release (maintainers)

1. Bump `version` in `package.json`
2. Commit: `git commit -m "🔧 chore: bump version to x.x.x"`
3. Tag: `git tag vx.x.x && git push origin vx.x.x`
4. GitHub Actions builds all three platforms and attaches installers to the release automatically.
5. Add the Firebase secrets to **Settings → Secrets and variables → Actions** before the first release:
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
