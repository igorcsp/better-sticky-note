import { signOut } from 'firebase/auth'
import { auth } from './firebase'

// Signs out of Firebase and clears Google's SSO cookies from Electron's
// session, so the next sign-in prompts for account selection instead of
// silently reusing this session's Google login. Cookie clearing is
// best-effort: if it fails, we still complete the Firebase sign-out so the
// user is never stuck.
export async function signOutAndClearSession(): Promise<void> {
  try {
    await window.electron.clearGoogleSession()
  } catch (err) {
    console.error('Failed to clear Google session cookies:', err)
  }
  await signOut(auth)
}
