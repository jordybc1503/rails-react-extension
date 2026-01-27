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
  aiSummary?: string
  ai_summary?: string
  aiSummaryMessageId?: string | number
  ai_summary_message_id?: string | number
  aiSummaryUpdatedAt?: string
  ai_summary_updated_at?: string
  messages?: Message[]
}
