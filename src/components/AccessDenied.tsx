import { signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function AccessDenied({ user }: { user: User }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Access restricted</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This app is invite-only. Signed in as{' '}
          <strong className="text-gray-700 dark:text-gray-300">{user.email}</strong>.
          Contact the owner to request access.
        </p>
        <button
          onClick={() => signOut(auth)}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
