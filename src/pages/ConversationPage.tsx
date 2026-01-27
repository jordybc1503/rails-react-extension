import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import type { Conversation } from "../types/conversation"
import { createConversation, getConversations } from "../api"
import { formatDateTime } from "../utils/date"

export function ConversationPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getConversations()
        if (isMounted) {
          setConversations(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error cargando conversaciones")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  const handleOpenModal = useCallback(() => {
    setNewTitle("")
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    if (!creating) {
      setIsModalOpen(false)
    }
  }, [creating])

  const handleCreateConversation = useCallback(async () => {
    try {
      setCreating(true)
      setError(null)
      const title = newTitle.trim()
      const created = await createConversation(title ? { title } : {})
      setConversations((prev) => [created, ...prev])
      setIsModalOpen(false)
      setNewTitle("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando la conversación")
    } finally {
      setCreating(false)
    }
  }, [newTitle])

  const handleOpenConversation = useCallback(
    (conversation: { id: string | number; title: string }) => {
      navigate(`/chat/${conversation.id}`, {
        state: { conversationTitle: conversation.title }
      })
    },
    [navigate]
  )

  const items = useMemo(() => {
    return conversations.map((conversation) => {
      const updatedAt = conversation.updatedAt || conversation.updated_at
      return {
        id: conversation.id,
        title: conversation.title || `Conversación ${conversation.id}`,
        lastMessage: conversation.lastMessage,
        updatedAt
      }
    })
  }, [conversations])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Conversaciones</div>
        <button
          type="button"
          onClick={handleOpenModal}
          disabled={creating}
          style={{
            border: "1px solid #0f172a",
            background: creating ? "#cbd5e1" : "#0f172a",
            color: "#ffffff",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: creating ? "not-allowed" : "pointer"
          }}>
          {creating ? "Creando..." : "Nueva conversación"}
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: "#64748b" }}>Cargando conversaciones...</div>
      ) : null}

      {!loading && error ? (
        <div style={{ fontSize: 13, color: "#dc2626" }}>{error}</div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div style={{ fontSize: 13, color: "#64748b" }}>No tienes conversaciones aún.</div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              onClick={() => handleOpenConversation(conversation)}
              style={{
                width: "100%",
                textAlign: "left",
                appearance: "none",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 10,
                background: "#ffffff",
                cursor: "pointer"
              }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{conversation.title}</div>
              {conversation.lastMessage ? (
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                  {conversation.lastMessage}
                </div>
              ) : null}
              {conversation.updatedAt ? (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                  {formatDateTime(conversation.updatedAt)}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {isModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000
          }}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleCreateConversation()
            }}
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 45px rgba(15, 23, 42, 0.18)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Nueva conversación</div>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              Nombre
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Ej. Seguimiento cliente"
                autoFocus
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13
                }}
              />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={creating}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: creating ? "not-allowed" : "pointer"
                }}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                style={{
                  border: "1px solid #0f172a",
                  background: creating ? "#cbd5e1" : "#0f172a",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: creating ? "not-allowed" : "pointer"
                }}>
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
