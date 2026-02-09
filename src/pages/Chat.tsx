import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import {
  createConversation,
  createMessage,
  getConversation,
  getMessages,
  updateConversation
} from "../api"
import type { Conversation } from "../types/conversation"
import type { Message } from "../types/message"

export function Chat() {
  const ACTIVE_CONVERSATION_KEY = "active_conversation_id"
  const PANEL_STATE_KEY = "interview_panel_state_v1"
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configExpanded, setConfigExpanded] = useState(false)
  const [conversationTitleOverride, setConversationTitleOverride] = useState<string | null>(null)
  const [aiSystemPrompt, setAiSystemPrompt] = useState("")
  const [aiModel, setAiModel] = useState("")
  const [aiApiKey, setAiApiKey] = useState("")
  const [messageOpacity, setMessageOpacity] = useState(1)
  const [panelOpacity, setPanelOpacity] = useState(1)
  const { conversationId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const DEFAULT_MODEL = "gpt-5-nano"
  const MODEL_SUGGESTIONS = [
    "gpt-4o-mini",
    "gpt-4.1-mini",
    "gpt-4.1",
    "gpt-4o",
    "gpt-5-nano"
  ]

  const applyConversationConfig = useCallback((nextConversation: Conversation | null) => {
    setConversation(nextConversation)

    if (!nextConversation) {
      return
    }

    setConversationTitleOverride(nextConversation.title ?? null)
    setAiSystemPrompt(nextConversation.aiSystemPrompt ?? nextConversation.ai_system_prompt ?? "")
    setAiModel(nextConversation.aiModel ?? nextConversation.ai_model ?? "")
    setAiApiKey(nextConversation.aiApiKey ?? nextConversation.ai_api_key ?? "")
  }, [])

  const conversationConfigSnapshot = useMemo(() => {
    if (!conversation) {
      return {
        aiSystemPrompt: "",
        aiModel: "",
        aiApiKey: ""
      }
    }

    return {
      aiSystemPrompt: conversation.aiSystemPrompt ?? conversation.ai_system_prompt ?? "",
      aiModel: conversation.aiModel ?? conversation.ai_model ?? "",
      aiApiKey: conversation.aiApiKey ?? conversation.ai_api_key ?? ""
    }
  }, [conversation])

  const configDirty = useMemo(() => {
    return (
      aiSystemPrompt !== conversationConfigSnapshot.aiSystemPrompt ||
      aiModel !== conversationConfigSnapshot.aiModel ||
      aiApiKey !== conversationConfigSnapshot.aiApiKey
    )
  }, [aiApiKey, aiModel, aiSystemPrompt, conversationConfigSnapshot])

  useEffect(() => {
    if (!conversationId) {
      return
    }

    void chrome.storage.local.set({ [ACTIVE_CONVERSATION_KEY]: conversationId })
  }, [ACTIVE_CONVERSATION_KEY, conversationId])

  useEffect(() => {
    const originKey = window.location.origin

    void (async () => {
      try {
        const result = await chrome.storage.local.get([PANEL_STATE_KEY])
        const allStates = result[PANEL_STATE_KEY] ?? {}
        const panelState = allStates[originKey]
        if (panelState?.messageOpacity !== undefined) {
          setMessageOpacity(panelState.messageOpacity)
        }
        if (panelState?.opacity !== undefined) {
          setPanelOpacity(panelState.opacity)
        }
      } catch (err) {
        console.warn("[Chat] Failed to read opacity from storage:", err)
      }
    })()

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[PANEL_STATE_KEY]) {
        const newStates = changes[PANEL_STATE_KEY].newValue ?? {}
        const panelState = newStates[originKey]
        if (panelState?.messageOpacity !== undefined) {
          setMessageOpacity(panelState.messageOpacity)
        }
        if (panelState?.opacity !== undefined) {
          setPanelOpacity(panelState.opacity)
        }
      }
    }

    chrome.storage.local.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.local.onChanged.removeListener(handleStorageChange)
    }
  }, [PANEL_STATE_KEY])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setConversation(null)
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

        applyConversationConfig(conversation)
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
  }, [applyConversationConfig, conversationId])

  useEffect(() => {
    if (!conversationId) {
      return
    }

    let isCancelled = false

    const syncMessages = async () => {
      try {
        const latestMessages = await getMessages(conversationId)
        if (!isCancelled && latestMessages.length > 0) {
          setMessages((prev) => {
            // Only update if messages actually changed (compare by length and last message ID)
            if (prev.length !== latestMessages.length) {
              return latestMessages
            }
            const prevLastId = prev[prev.length - 1]?.id
            const latestLastId = latestMessages[latestMessages.length - 1]?.id
            if (prevLastId !== latestLastId) {
              return latestMessages
            }
            // Also check first message in case of deletions
            const prevFirstId = prev[0]?.id
            const latestFirstId = latestMessages[0]?.id
            if (prevFirstId !== latestFirstId) {
              return latestMessages
            }
            return prev  // No change, keep same reference
          })
        }
      } catch (err) {
        if (!isCancelled) {
          // Silently ignore polling errors to avoid noisy UI.
        }
      }
    }

    void syncMessages()
    const intervalId = window.setInterval(syncMessages, 2500)

    return () => {
      isCancelled = true
      window.clearInterval(intervalId)
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

  // Auto-scroll only when streaming content updates (not for regular caption messages)
  useEffect(() => {
    if (streamingContent !== null && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [streamingContent])

  // Listen for assistant streaming events via chrome.storage (cross-context compatible)
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== "local" || !changes.assistantStream) return

      const { newValue } = changes.assistantStream
      if (!newValue) return

      const { type, data } = newValue

      if (type === "start") {
        console.log("[Chat] stream start received", data)
        setStreamingMessageId(data.messageId)
        setStreamingContent("")
      } else if (type === "chunk") {
        setStreamingContent((prev) => (prev ?? "") + data.chunk)
      } else if (type === "complete") {
        console.log("[Chat] stream complete received", data)
        setStreamingContent(null)
        setStreamingMessageId(null)
        // Add the complete message to the list and scroll to it
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.id)
          if (exists) return prev
          return [...prev, data]
        })
        // Scroll after adding the complete message
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        }, 50)
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  const sortedMessages = useMemo(() => {
    return messages
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const aDateRaw = a.item.createdAt ?? a.item.created_at
        const bDateRaw = b.item.createdAt ?? b.item.created_at
        const aDate = aDateRaw ? new Date(aDateRaw).getTime() : null
        const bDate = bDateRaw ? new Date(bDateRaw).getTime() : null

        if (aDate !== null && bDate !== null && aDate !== bDate) {
          return aDate - bDate
        }

        if (aDate !== null && bDate === null) {
          return -1
        }

        if (aDate === null && bDate !== null) {
          return 1
        }

        return a.index - b.index
      })
      .map(({ item }) => item)
  }, [messages])

  const buildConversationPayload = useCallback(() => {
    const payload = {
      ai_system_prompt: aiSystemPrompt.trim(),
      ai_model: aiModel.trim(),
      ai_api_key: aiApiKey.trim()
    }

    return {
      ai_system_prompt: payload.ai_system_prompt || undefined,
      ai_model: payload.ai_model || undefined,
      ai_api_key: payload.ai_api_key || undefined
    }
  }, [aiApiKey, aiModel, aiSystemPrompt])

  const handleSaveConfig = useCallback(async () => {
    if (!conversationId) {
      setError("La configuración se guardará cuando exista una conversación.")
      return
    }

    try {
      setSavingConfig(true)
      setError(null)
      const updatedConversation = await updateConversation(conversationId, buildConversationPayload())
      applyConversationConfig(updatedConversation)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando la configuración")
    } finally {
      setSavingConfig(false)
    }
  }, [applyConversationConfig, buildConversationPayload, conversationId])

  const configStatusText = conversationId
    ? configDirty
      ? "Tienes cambios sin guardar."
      : "Configuración guardada."
    : "Se aplicará al crear la conversación."

  const configSummaryText = `Modelo: ${aiModel.trim() || DEFAULT_MODEL}`

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
        const createdConversation = await createConversation(buildConversationPayload())
        targetConversationId = String(createdConversation.id)
        applyConversationConfig(createdConversation)

        navigate(`/chat/${targetConversationId}`, {
          replace: true,
          state: { conversationTitle: createdConversation.title ?? conversationTitle }
        })
      } else if (configDirty) {
        const updatedConversation = await updateConversation(
          targetConversationId,
          buildConversationPayload()
        )
        applyConversationConfig(updatedConversation)
      }

      const result = await createMessage(targetConversationId, {
        content: trimmed,
        role: "user"
      })

      upsertMessage(result.message)

      if (result.assistantMessage) {
        upsertMessage(result.assistantMessage)
      }

      if (result.conversation) {
        applyConversationConfig(result.conversation)
      }

      if (result.error) {
        setError(result.error)
      }

      setMessage("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando el mensaje")
    } finally {
      setSending(false)
    }
  }, [
    applyConversationConfig,
    buildConversationPayload,
    configDirty,
    conversationId,
    conversationTitle,
    message,
    navigate,
    upsertMessage
  ])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        height: "100%",
        minHeight: 0
      }}>
      <div style={{ marginBottom: 2, fontSize: 13, fontWeight: 700 }}>{conversationTitle}</div>
      {conversationId ? (
        null
      ) : <div style={{ marginBottom: 6, fontSize: 12, color: "#475569" }}>
        Aquí irá el chat en tiempo real.
      </div>}


      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 4,
          padding: 6,
          background: `rgba(255, 255, 255, ${panelOpacity})`,
          marginBottom: 6,
          display: "flex",
          flexDirection: "column",
          gap: configExpanded ? 8 : 6
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Configuración IA</div>
          <button
            type="button"
            onClick={() => setConfigExpanded((prev) => !prev)}
            style={{
              border: "1px solid #cbd5e1",
              background: `rgba(255, 255, 255, ${panelOpacity})`,
              color: "#0f172a",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer"
            }}>
            {configExpanded ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {!configExpanded ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#0f172a" }}>{configSummaryText}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{configStatusText}</div>
          </div>
        ) : (
          <>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
              Prompt del sistema
              <textarea
                value={aiSystemPrompt}
                onChange={(event) => setAiSystemPrompt(event.target.value)}
                placeholder="Define el comportamiento del agente..."
                rows={3}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "6px 8px",
                  fontSize: 12,
                  resize: "vertical"
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
              Modelo
              <input
                value={aiModel}
                onChange={(event) => setAiModel(event.target.value)}
                placeholder={DEFAULT_MODEL}
                list="ai-model-suggestions"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "6px 8px",
                  fontSize: 12
                }}
              />
              <datalist id="ai-model-suggestions">
                {MODEL_SUGGESTIONS.map((modelName) => (
                  <option key={modelName} value={modelName} />
                ))}
              </datalist>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
              API key
              <input
                type="password"
                value={aiApiKey}
                onChange={(event) => setAiApiKey(event.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "6px 8px",
                  fontSize: 12
                }}
              />
            </label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: "#64748b" }}>{configStatusText}</div>
              <button
                type="button"
                onClick={() => void handleSaveConfig()}
                disabled={!conversationId || !configDirty || savingConfig}
                style={{
                  border: "1px solid #0ea5e9",
                  background:
                    !conversationId || !configDirty || savingConfig ? "#cbd5e1" : "#0ea5e9",
                  color: "#ffffff",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor:
                    !conversationId || !configDirty || savingConfig ? "not-allowed" : "pointer"
                }}>
                {savingConfig ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </>
        )}
      </div>

      {error ? (
        <div style={{ marginBottom: 4, fontSize: 12, color: "#dc2626" }}>{error}</div>
      ) : null}

      <div
        ref={messagesContainerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 8,
          background: `rgba(248, 250, 252, ${panelOpacity})`,
          flex: 1,
          minHeight: 140,
          minWidth: 0,
          overflowY: "auto",
          marginBottom: 6
        }}>
        {loadingMessages ? (
          <div style={{ fontSize: 12, color: "#64748b" }}>Cargando mensajes...</div>
        ) : null}

        {!loadingMessages && sortedMessages.length === 0 ? (
          <div style={{ fontSize: 12, color: "#64748b" }}>Sin mensajes aún.</div>
        ) : null}

        {!loadingMessages
          ? sortedMessages.map((item) => {
              const role = (item.role ?? "").toLowerCase()
              const isUser = role === "user"
              const isInterviewer = role === "interviewer"
              const isAssistant = role === "assistant" || (!isUser && !isInterviewer)

              const label = isUser ? "Tú" : isInterviewer ? "Interviewer" : "Hannah AI"
              const background = isUser ? "#0ea5e9" : isInterviewer ? "#fff7ed" : "#e2e8f0"
              const color = isUser ? "#ffffff" : "#0f172a"
              const border = isInterviewer ? "1px solid #fdba74" : "1px solid transparent"
              const labelColor = isUser ? "#bae6fd" : isInterviewer ? "#c2410c" : "#475569"

              return (
                <div
                  key={item.id}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    padding: "6px 8px",
                    borderRadius: 10,
                    background,
                    color,
                    border,
                    fontSize: 12,
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    opacity: messageOpacity
                  }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: labelColor }}>{label}</div>
                  <div>{item.content}</div>
                </div>
              )
            })
          : null}

        {/* Streaming message in progress */}
        {streamingContent !== null && (
          <div
            key={streamingMessageId ?? "streaming"}
            style={{
              alignSelf: "flex-start",
              maxWidth: "85%",
              padding: "6px 8px",
              borderRadius: 10,
              background: "#e2e8f0",
              color: "#0f172a",
              border: "1px solid #94a3b8",
              fontSize: 12,
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              opacity: messageOpacity
            }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569" }}>Hannah AI</div>
            <div>{streamingContent || "..."}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
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
            border: "1px solid #cbd5e1",
            background: `rgba(255, 255, 255, ${panelOpacity})`
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
