import type { Message } from "../types/message"
import { authenticatedFetch } from "./http"

export interface CreateMessagePayload {
  content: string
  role?: string
  status?: string
}

function extractMessages(data: unknown): Message[] {
  if (Array.isArray(data)) {
    return data as Message[]
  }

  if (data && typeof data === "object") {
    const typed = data as { messages?: unknown; conversation?: { messages?: unknown } }

    if (Array.isArray(typed.messages)) {
      return typed.messages as Message[]
    }

    if (Array.isArray(typed.conversation?.messages)) {
      return typed.conversation.messages as Message[]
    }
  }

  return []
}

export async function getMessages(conversationId: string | number): Promise<Message[]> {
  const response = await authenticatedFetch(`/api/v1/conversations/${conversationId}/messages`)

  if (!response.ok) {
    throw new Error("Failed to load messages")
  }

  const data = await response.json()
  return extractMessages(data)
}

export async function createMessage(
  conversationId: string | number,
  payload: CreateMessagePayload
): Promise<Message> {
  const response = await authenticatedFetch(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error("Failed to create message")
  }

  const data = await response.json()

  if (data?.message) {
    return data.message as Message
  }

  return data as Message
}

