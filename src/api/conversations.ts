import type { Conversation } from "../types/conversation"
import { authenticatedFetch } from "./http"

export async function getConversations(): Promise<Conversation[]> {
  const response = await authenticatedFetch("/api/v1/conversations")

  if (!response.ok) {
    throw new Error("Failed to load conversations")
  }

  const data = await response.json()

  if (Array.isArray(data)) {
    return data as Conversation[]
  }

  if (Array.isArray(data?.conversations)) {
    return data.conversations as Conversation[]
  }

  return []
}

export async function createConversation(payload: { title?: string } = {}): Promise<Conversation> {
  const response = await authenticatedFetch("/api/v1/conversations", {
    method: "POST",
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error("Failed to create conversation")
  }

  const data = await response.json()

  if (data?.conversation) {
    return data.conversation as Conversation
  }

  return data as Conversation
}

export async function getConversation(conversationId: string | number): Promise<Conversation> {
  const response = await authenticatedFetch(`/api/v1/conversations/${conversationId}`)

  if (!response.ok) {
    throw new Error("Failed to load conversation")
  }

  const data = await response.json()

  if (data?.conversation) {
    return data.conversation as Conversation
  }

  return data as Conversation
}
