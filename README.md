# Better Sticky Notes

A desktop sticky notes app with real-time cloud sync, Markdown editing, and multi-window support. Built with Electron, React, and Firebase.

## Download & Install

Go to [Releases](https://github.com/igorcsp/better-sticky-note/releases) and download the installer for your platform:

| Platform | File |
|----------|------|
| Windows | `Better-Sticky-Notes-Setup-x.x.x.exe` |
| macOS | `Better-Sticky-Notes-x.x.x.dmg` |
| Linux | `Better-Sticky-Notes-x.x.x.AppImage` |

Sign in with your Google account — notes are private to your account and sync across devices.

> **First-launch warnings**
> - **Windows**: SmartScreen may show "Windows protected your PC." Click **More info → Run anyway**.
> - **macOS**: Gatekeeper may block the app. Go to **System Settings → Privacy & Security** and click **Open Anyway**.

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
    match /users/{uid}/notes/{noteId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

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
