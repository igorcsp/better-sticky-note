import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function LoginScreen() {
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)

  async function handleSignIn() {
    setError(null)
    setSigning(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed the popup — not an error worth showing
      } else {
        setError(code || String(err))
      }
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">Better Sticky Notes</h1>
        <p className="text-sm text-gray-500">Sign in to access your notes across devices</p>
        <button
          onClick={handleSignIn}
          disabled={signing}
          className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {signing ? 'Opening Google sign-in…' : 'Sign in with Google'}
        </button>
        {error && (
          <p className="max-w-xs text-center text-xs text-red-600">
            Sign-in failed: <code>{error}</code>
          </p>
        )}
      </div>
    </div>
  )
}
