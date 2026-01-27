import type { Message } from "./message"

export interface Conversation {
  id: string | number
  title?: string
  lastMessage?: string
  last_message?: string
  updatedAt?: string
  updated_at?: string
  aiSystemPrompt?: string
  ai_system_prompt?: string
  aiModel?: string
  ai_model?: string
  aiApiKey?: string
  ai_api_key?: string
  messages?: Message[]
}
