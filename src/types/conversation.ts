import type { Message } from "./message"

export interface Conversation {
  id: string | number
  title?: string
  lastMessage?: string
  last_message?: string
  updatedAt?: string
  updated_at?: string
  messages?: Message[]
}
