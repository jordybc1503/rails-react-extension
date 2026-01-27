export interface Message {
  id: string | number
  conversationId?: string | number
  conversation_id?: string | number
  userId?: string | number
  user_id?: string | number
  role: string
  content: string
  status?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}
