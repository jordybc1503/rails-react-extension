import type { Message } from "../types/message"
import { authenticatedFetch } from "./http"

export interface CreateCaptionPayload {
  text: string
  speaker?: string
  platform?: string
  timestamp?: string
}

export interface CreateCaptionResult {
  captionMessage?: Message | null
  assistantMessage?: Message | null
  error?: string | null
  skipped?: boolean
}

export async function createCaption(
  conversationId: string | number,
  payload: CreateCaptionPayload
): Promise<CreateCaptionResult> {
  const response = await authenticatedFetch(`/api/v1/conversations/${conversationId}/captions`, {
    method: "POST",
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof data?.errors?.[0] === "string"
        ? data.errors[0]
        : typeof data?.error === "string"
          ? data.error
          : "Failed to create caption"
    throw new Error(message)
  }

  return {
    captionMessage: (data?.caption_message ?? data?.captionMessage ?? null) as Message | null,
    assistantMessage: (data?.assistant_message ?? data?.assistantMessage ?? null) as Message | null,
    error: (data?.error ?? null) as string | null,
    skipped: Boolean(data?.skipped)
  }
}
