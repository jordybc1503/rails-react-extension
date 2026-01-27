import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import { createConversation, createMessage, getConversation, getMessages } from "../api"
import type { Message } from "../types/message"

export function Chat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [conversationTitleOverride, setConversationTitleOverride] = useState<string | null>(null)
  const { conversationId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setConversationTitleOverride(null)
      return
    }

    let isMounted = true

    void (async () => {
      try {
        setLoadingMessages(true)
        setError(null)

        const [conversation, loadedMessages] = await Promise.all([
          getConversation(conversationId),
          getMessages(conversationId)
        ])

        if (!isMounted) {
          return
        }

        setConversationTitleOverride(conversation.title ?? null)
        const fallbackMessages = Array.isArray(conversation.messages) ? conversation.messages : []
        setMessages(loadedMessages.length > 0 ? loadedMessages : fallbackMessages)
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error cargando mensajes")
        }
      } finally {
        if (isMounted) {
          setLoadingMessages(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [conversationId])

  const conversationTitle = useMemo(() => {
    const state = (location.state ?? {}) as { conversationTitle?: string }

    if (conversationTitleOverride) {
      return conversationTitleOverride
    }

    if (state.conversationTitle) {
      return state.conversationTitle
    }

    if (conversationId) {
      return `Conversación ${conversationId}`
    }

    return "Nuevo chat"
  }, [conversationId, conversationTitleOverride, location.state])

  const upsertMessage = useCallback((nextMessage: Message) => {
    setMessages((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === nextMessage.id)

      if (existingIndex === -1) {
        return [...prev, nextMessage]
      }

      const next = [...prev]
      next[existingIndex] = nextMessage
      return next
    })
  }, [])

  const handleSend = useCallback(async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      return
    }

    try {
      setSending(true)
      setError(null)

      let targetConversationId = conversationId

      if (!targetConversationId) {
        const createdConversation = await createConversation({})
        targetConversationId = String(createdConversation.id)
        setConversationTitleOverride(createdConversation.title ?? null)

        navigate(`/chat/${targetConversationId}`, {
          replace: true,
          state: { conversationTitle: createdConversation.title ?? conversationTitle }
        })
      }

      const createdMessage = await createMessage(targetConversationId, {
        content: trimmed,
        role: "user"
      })

      upsertMessage(createdMessage)
      setMessage("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando el mensaje")
    } finally {
      setSending(false)
    }
  }, [conversationId, conversationTitle, message, navigate, upsertMessage])

  return (
    <div>
      <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>{conversationTitle}</div>
      {conversationId ? (
        <div style={{ marginBottom: 12, fontSize: 11, color: "#94a3b8" }}>
          ID: {conversationId}
        </div>
      ) : null}
      <div style={{ marginBottom: 12, fontSize: 13, color: "#475569" }}>
        Aquí irá el chat en tiempo real.
      </div>

      {error ? (
        <div style={{ marginBottom: 10, fontSize: 12, color: "#dc2626" }}>{error}</div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 8,
          background: "#f8fafc",
          maxHeight: 220,
          overflowY: "auto",
          marginBottom: 10
        }}>
        {loadingMessages ? (
          <div style={{ fontSize: 12, color: "#64748b" }}>Cargando mensajes...</div>
        ) : null}

        {!loadingMessages && messages.length === 0 ? (
          <div style={{ fontSize: 12, color: "#64748b" }}>Sin mensajes aún.</div>
        ) : null}

        {!loadingMessages
          ? messages.map((item) => {
              const role = (item.role ?? "").toLowerCase()
              const isUser = role === "user"

              return (
                <div
                  key={item.id}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: isUser ? "#0ea5e9" : "#e2e8f0",
                    color: isUser ? "#ffffff" : "#0f172a",
                    fontSize: 12,
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}>
                  {item.content}
                </div>
              )
            })
          : null}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void handleSend()
            }
          }}
          placeholder="Escribe tu pregunta..."
          disabled={sending}
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: 13,
            borderRadius: 6,
            border: "1px solid #cbd5f5"
          }}
        />
        <button
          type="button"
          disabled={!message.trim() || sending}
          onClick={() => void handleSend()}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            borderRadius: 6,
            border: "none",
            background: message.trim() && !sending ? "#0ea5e9" : "#94a3b8",
            color: "white",
            cursor: message.trim() && !sending ? "pointer" : "not-allowed"
          }}>
          {sending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  )
}
