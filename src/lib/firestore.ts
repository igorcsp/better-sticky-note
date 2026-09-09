import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Note } from '../types'

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

function notesCollection(uid: string) {
  return collection(db, 'users', uid, 'notes')
}

export async function createNote(uid: string): Promise<string> {
  const ref = await addDoc(notesCollection(uid), {
    title: 'New Note',
    content: '',
    color: '#FFF176',
    fontSize: 12,
    pinned: false,
    archived: false,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateNote(
  uid: string,
  noteId: string,
  data: Partial<Omit<Note, 'id' | 'createdAt'>>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'notes', noteId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'notes', noteId)
  await updateDoc(ref, { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

// Undo a soft-delete — bring a note back out of the trash.
export async function restoreNote(uid: string, noteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'notes', noteId)
  await updateDoc(ref, { deletedAt: null, updatedAt: serverTimestamp() })
}

// Permanently remove a note from Firestore (no recovery). Used by "Delete Forever".
export async function deleteNoteForever(uid: string, noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'notes', noteId))
}

// Hard-delete any note trashed more than 30 days ago. Fire-and-forget on app start.
export async function purgeExpiredTrash(uid: string): Promise<void> {
  const cutoff = Timestamp.fromMillis(Date.now() - TRASH_RETENTION_MS)
  const q = query(notesCollection(uid), where('deletedAt', '<', cutoff))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

export function subscribeToNotes(uid: string, callback: (notes: Note[]) => void): Unsubscribe {
  return onSnapshot(notesCollection(uid), (snap) => {
    const notes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Note))
    callback(notes)
  })
}
