import { createCaption } from "../api"

const ACTIVE_CONVERSATION_KEY = "active_conversation_id"

interface SpeakerBuffer {
  text: string
  timerId: number | null
}

async function getActiveConversationId(): Promise<string | null> {
  const result = await chrome.storage.local.get([ACTIVE_CONVERSATION_KEY])
  const value = result[ACTIVE_CONVERSATION_KEY]
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }

  return null
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

  console.log(`[captions:${platform}] dispatcher ready`)

  const flushSpeaker = async (speaker: string) => {
    const buffer = buffers.get(speaker)
    if (!buffer || !buffer.text.trim()) {
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

    try {
      const result = await createCaption(conversationId, {
        text: textToSend,
        speaker,
        platform,
        timestamp: new Date().toISOString()
      })

      if (!result.skipped) {
        lastSent.set(speaker, textToSend)
      }
    } catch (error) {
      const now = Date.now()
      if (now - lastErrorAt > 10_000) {
        lastErrorAt = now
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[captions:${platform}] ${message}`)
      }
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
      buffers.set(speaker, { text, timerId: null })
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
