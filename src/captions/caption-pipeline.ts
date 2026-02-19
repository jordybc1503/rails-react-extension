import { createCaptionStream } from "../api"

const ACTIVE_CONVERSATION_KEY = "active_conversation_id"
const AI_RESPONSE_MODE_KEY = "ai_response_mode"
const DEFAULT_AI_RESPONSE_MODE = "auto"

type AiResponseMode = "auto" | "manual_last_interviewer"

interface SpeakerBuffer {
  text: string
  timerId: number | null
  isSending: boolean
}

async function getActiveConversationId(): Promise<string | null> {
  const result = await chrome.storage.local.get([ACTIVE_CONVERSATION_KEY])
  const value = result[ACTIVE_CONVERSATION_KEY]
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }

  return null
}

async function getAiResponseMode(): Promise<AiResponseMode> {
  const result = await chrome.storage.local.get([AI_RESPONSE_MODE_KEY])
  const rawValue = result[AI_RESPONSE_MODE_KEY]
  if (rawValue === "manual_last_interviewer") {
    return "manual_last_interviewer"
  }

  return DEFAULT_AI_RESPONSE_MODE
}

function mergeCaptionText(previous: string, next: string): string {
  const prev = previous.trim()
  const nxt = next.trim()

  if (!prev) {
    return nxt
  }

  if (!nxt) {
    return prev
  }

  // Most caption providers stream incremental updates for the same line.
  // Prefer the most complete variant instead of accumulating lines.
  if (nxt.startsWith(prev)) {
    return nxt
  }

  if (prev.startsWith(nxt)) {
    return prev
  }

  // When the text changes but still shares a strong prefix,
  // keep the longer candidate.
  let commonPrefixLength = 0
  const maxPrefix = Math.min(prev.length, nxt.length)
  while (commonPrefixLength < maxPrefix && prev[commonPrefixLength] === nxt[commonPrefixLength]) {
    commonPrefixLength += 1
  }

  const strongPrefix = commonPrefixLength >= Math.floor(maxPrefix * 0.6)
  if (strongPrefix) {
    return nxt.length >= prev.length ? nxt : prev
  }

  // Fallback: replace with the most recent text to avoid noisy multi-line blobs.
  return nxt
}

export function createCaptionDispatcher(platform: string) {
  const buffers = new Map<string, SpeakerBuffer>()
  const lastSent = new Map<string, string>()
  let lastErrorAt = 0
  let lastMissingConversationLogAt = 0
  let lastAssistantRequestAt = 0  // Track last AI request globally

  console.log(`[captions:${platform}] dispatcher ready`)

  const flushSpeaker = async (speaker: string) => {
    const buffer = buffers.get(speaker)
    if (!buffer || !buffer.text.trim()) {
      return
    }

    // Prevent concurrent sends for same speaker
    if (buffer.isSending) {
      console.log(`[captions:${platform}] skipping flush - already sending for ${speaker}`)
      return
    }

    buffer.timerId = null
    const textToSend = buffer.text.trim()

    if (lastSent.get(speaker) === textToSend) {
      return
    }

    const conversationId = await getActiveConversationId()
    if (!conversationId) {
      const now = Date.now()
      if (now - lastMissingConversationLogAt > 10_000) {
        lastMissingConversationLogAt = now
        console.warn(`[captions:${platform}] no active conversation id in storage`)
      }
      return
    }

    const responseMode = await getAiResponseMode()

    // Check if we should throttle AI requests (8 seconds between questions)
    const now = Date.now()
    const timeSinceLastAI = now - lastAssistantRequestAt
    if (timeSinceLastAI < 8000) {
      console.log(`[captions:${platform}] throttling AI - only ${Math.floor(timeSinceLastAI / 1000)}s since last request`)
    }

    buffer.isSending = true

    try {
      await createCaptionStream(
        conversationId,
        {
          text: textToSend,
          speaker,
          platform,
          timestamp: new Date().toISOString(),
          response_mode: responseMode
        },
        {
          onCaption: (message) => {
            console.log(`[captions:${platform}] caption saved`, message)
          },
          onAssistantStart: (data) => {
            lastAssistantRequestAt = Date.now()
            console.log(`[captions:${platform}] assistant streaming started`, data)
            void chrome.storage.local.set({
              assistantStream: { type: "start", data, timestamp: Date.now() }
            })
          },
          onAssistantChunk: (data) => {
            console.log(`[captions:${platform}] chunk received:`, data.chunk)
            void chrome.storage.local.set({
              assistantStream: { type: "chunk", data, timestamp: Date.now() }
            })
          },
          onAssistantComplete: (message) => {
            console.log(`[captions:${platform}] assistant response complete`, message)
            void chrome.storage.local.set({
              assistantStream: { type: "complete", data: message, timestamp: Date.now() }
            })
          },
          onSkipped: () => {
            console.log(`[captions:${platform}] caption skipped (duplicate)`)
          },
          onError: (error) => {
            console.error(`[captions:${platform}] stream error:`, error)
          },
          onDone: () => {
            lastSent.set(speaker, textToSend)
          }
        }
      )
    } catch (error) {
      const now = Date.now()
      if (now - lastErrorAt > 10_000) {
        lastErrorAt = now
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[captions:${platform}] ${message}`)
      }
    } finally {
      buffer.isSending = false
    }
  }

  const scheduleFlush = (speaker: string) => {
    const buffer = buffers.get(speaker)
    if (!buffer) {
      return
    }

    if (buffer.timerId) {
      window.clearTimeout(buffer.timerId)
    }

    buffer.timerId = window.setTimeout(() => {
      void flushSpeaker(speaker)
    }, 1_200)
  }

  const enqueueCaption = (
    rawSpeaker: string | null | undefined,
    rawText: string | null | undefined
  ) => {
    const text = rawText?.trim()
    if (!text) {
      return
    }

    const speaker = rawSpeaker?.trim() || "Interviewer"
    const existing = buffers.get(speaker)

    if (!existing) {
      buffers.set(speaker, { text, timerId: null, isSending: false })
    } else {
      existing.text = mergeCaptionText(existing.text, text)
    }

    scheduleFlush(speaker)
  }

  return {
    enqueueCaption,
    flushSpeaker
  }
}
