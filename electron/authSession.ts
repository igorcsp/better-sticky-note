import { session } from 'electron'

// All app windows share Electron's default session (see windowManager.ts),
// which means Google's accounts.google.com SSO cookies survive Firebase
// signOut(). Clear just those cookies so the next sign-in shows Google's
// account chooser instead of silently reusing the previous account.
export async function clearGoogleAuthCookies(): Promise<void> {
  await session.defaultSession.clearData({
    dataTypes: ['cookies'],
    origins: ['https://accounts.google.com'],
  })
}
