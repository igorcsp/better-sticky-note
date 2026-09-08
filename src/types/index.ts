import type { Timestamp } from 'firebase/firestore'

export interface Note {
  id: string
  title: string
  content: string
  color: string
  fontSize: number
  pinned: boolean
  archived: boolean
  deletedAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
