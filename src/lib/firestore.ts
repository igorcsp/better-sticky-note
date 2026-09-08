import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Note } from '../types'

function notesCollection(uid: string) {
  return collection(db, 'users', uid, 'notes')
}

export async function createNote(uid: string): Promise<string> {
  const ref = await addDoc(notesCollection(uid), {
    title: 'New Note',
    content: '',
    color: '#FFF176',
    fontSize: 14,
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

export function subscribeToNotes(uid: string, callback: (notes: Note[]) => void): Unsubscribe {
  return onSnapshot(notesCollection(uid), (snap) => {
    const notes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Note))
    callback(notes)
  })
}
