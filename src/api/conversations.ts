import type { Conversation } from "../types/conversation"
import { authenticatedFetch } from "./http"

export interface ConversationPayload {
  title?: string
  ai_system_prompt?: string
  ai_model?: string
  ai_api_key?: string
}

export interface ConversationReportDownload {
  blob: Blob
  filename: string
}

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

export async function createConversation(payload: ConversationPayload = {}): Promise<Conversation> {
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

export async function updateConversation(
  conversationId: string | number,
  payload: ConversationPayload
): Promise<Conversation> {
  const response = await authenticatedFetch(`/api/v1/conversations/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error("Failed to update conversation")
  }

  const data = await response.json()

  if (data?.conversation) {
    return data.conversation as Conversation
  }

  return data as Conversation
}

function parseFilename(
  contentDisposition: string | null,
  fallbackName: string
): string {
  if (!contentDisposition) {
    return fallbackName
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const quotedMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (quotedMatch?.[1]) {
    return quotedMatch[1]
  }

  return fallbackName
}

export async function downloadConversationReport(
  conversationId: string | number
): Promise<ConversationReportDownload> {
  const response = await authenticatedFetch(`/api/v1/conversations/${conversationId}/report`, {
    headers: {
      Accept: "text/plain"
    }
  })

  if (!response.ok) {
    throw new Error("Failed to download conversation report")
  }

  const blob = await response.blob()
  const fallbackName = `reporte-conversacion-${conversationId}.txt`
  const filename = parseFilename(response.headers.get("Content-Disposition"), fallbackName)

  return { blob, filename }
}
