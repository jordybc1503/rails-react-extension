import { useState } from "react"

export function Chat() {
  const [message, setMessage] = useState("")

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 13, color: "#475569" }}>
        Aquí irá el chat en tiempo real.
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe tu pregunta..."
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
          disabled={!message.trim()}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            borderRadius: 6,
            border: "none",
            background: message.trim() ? "#0ea5e9" : "#94a3b8",
            color: "white",
            cursor: message.trim() ? "pointer" : "not-allowed"
          }}>
          Enviar
        </button>
      </div>
    </div>
  )
}
