import type { Message } from "../types/message"
import { API_BASE_URL, authenticatedFetch, getToken } from "./http"

export interface CreateCaptionPayload {
  text: string
  speaker?: string
  platform?: string
  timestamp?: string
  response_mode?: "auto" | "manual_last_interviewer"
}

export interface CreateCaptionResult {
  captionMessage?: Message | null
  assistantMessage?: Message | null
  error?: string | null
  skipped?: boolean
}

export interface StreamEventHandlers {
  onCaption?: (message: Message) => void
  onAssistantStart?: (data: { messageId: string; role: string }) => void
  onAssistantChunk?: (data: { messageId: string; chunk: string }) => void
  onAssistantComplete?: (message: Message) => void
  onError?: (error: string) => void
  onSkipped?: () => void
  onDone?: () => void
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

export async function createCaptionStream(
  conversationId: string | number,
  payload: CreateCaptionPayload,
  handlers: StreamEventHandlers
): Promise<void> {
  const token = await getToken()
  if (!token) {
    throw new Error("No authentication token found")
  }

  const url = new URL(`/api/v1/conversations/${conversationId}/captions/stream`, API_BASE_URL)

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "text/event-stream"
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("Response body is not readable")
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let currentEvent = "message"
  let currentData = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete lines
      while (buffer.includes("\n")) {
        const newlineIndex = buffer.indexOf("\n")
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)

        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith("data: ")) {
          currentData = line.slice(6).trim()
        } else if (line === "") {
          // Empty line signals end of event - dispatch it now
          if (currentData) {
            handleSSEEvent(currentEvent, currentData, handlers)
            currentData = ""
            currentEvent = "message"
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function handleSSEEvent(event: string, data: string, handlers: StreamEventHandlers) {
  try {
    const parsed = JSON.parse(data)

    switch (event) {
      case "caption":
        handlers.onCaption?.(parsed as Message)
        break
      case "assistant_start":
        handlers.onAssistantStart?.(parsed)
        break
      case "assistant_chunk":
        handlers.onAssistantChunk?.(parsed)
        break
      case "assistant_complete":
        handlers.onAssistantComplete?.(parsed as Message)
        break
      case "error":
        handlers.onError?.(parsed.error || "Unknown error")
        break
      case "skipped":
        handlers.onSkipped?.()
        break
      case "done":
        handlers.onDone?.()
        break
      default:
        console.warn(`[SSE] Unknown event: ${event}`)
    }
  } catch (error) {
    console.error("[SSE] Failed to parse event data:", data, error)
  }
}
