import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { useAuthStore } from './store/authStore'
import LoginScreen from './components/LoginScreen'
import NoteWindow from './pages/NoteWindow'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [setUser, setLoading])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
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

  return <Dashboard uid={user.uid} />
}
