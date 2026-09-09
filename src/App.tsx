import { useCallback, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { auth, db } from './lib/firebase'
import { createNote } from './lib/firestore'
import { useAuthStore } from './store/authStore'
import { useNotesStore } from './store/notesStore'
import { usePrefsStore } from './store/prefsStore'
import LoginScreen from './components/LoginScreen'
import AccessDenied from './components/AccessDenied'
import NoteWindow from './pages/NoteWindow'
import Dashboard from './pages/Dashboard'
import Shortcuts from './pages/Shortcuts'

// This window's view is fixed for its lifetime (set via URL query at open time).
const VIEW = new URLSearchParams(window.location.search).get('view')
const NOTE_ID = new URLSearchParams(window.location.search).get('id')

// Keep the <html> `dark` class in sync with the theme preference. On 'system'
// we follow the OS and react to changes live.
function useApplyTheme() {
  const theme = usePrefsStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mql.matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    if (theme === 'system') {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }
  }, [theme])
}

export default function App() {
  const { user, loading, setUser, setLoading } = useAuthStore()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  useApplyTheme()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'allowedUsers', u.uid))
        setAllowed(snap.exists())
      } else {
        setAllowed(null)
        useNotesStore.getState().reset()
      }
      setLoading(false)
    })
    return unsub
  }, [setUser, setLoading])

  // Tray/hotkey "New Note" is handled by the dashboard window (createNote needs
  // the signed-in user). If auth isn't ready yet, buffer the request and run it
  // once the user resolves.
  const userRef = useRef(user)
  userRef.current = user
  const pendingNewNote = useRef(false)

  const doCreateNote = useCallback(async () => {
    const u = userRef.current
    if (!u) {
      pendingNewNote.current = true
      return
    }
    const id = await createNote(u.uid)
    window.electron.openNote(id)
  }, [])

  useEffect(() => {
    if (VIEW === 'note' || VIEW === 'shortcuts') return
    return window.electron?.onNewNote?.(() => doCreateNote())
  }, [doCreateNote])

  useEffect(() => {
    if (user && pendingNewNote.current) {
      pendingNewNote.current = false
      doCreateNote()
    }
  }, [user, doCreateNote])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  if (allowed === false) return <AccessDenied user={user} />

  if (VIEW === 'note' && NOTE_ID) {
    return <NoteWindow id={NOTE_ID} uid={user.uid} />
  }

  if (VIEW === 'shortcuts') {
    return <Shortcuts />
  }

  return <Dashboard uid={user.uid} />
}
