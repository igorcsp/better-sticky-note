import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { useAuthStore } from './store/authStore'
import { usePrefsStore } from './store/prefsStore'
import LoginScreen from './components/LoginScreen'
import NoteWindow from './pages/NoteWindow'
import Dashboard from './pages/Dashboard'
import Shortcuts from './pages/Shortcuts'

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
  useApplyTheme()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [setUser, setLoading])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  const noteId = params.get('id')

  if (view === 'note' && noteId) {
    return <NoteWindow id={noteId} uid={user.uid} />
  }

  if (view === 'shortcuts') {
    return <Shortcuts />
  }

  return <Dashboard uid={user.uid} />
}
