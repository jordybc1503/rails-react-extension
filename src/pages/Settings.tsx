import type { User } from "../types/auth"

interface SettingsProps {
  user: User
  onLogout: () => void
}

export function Settings({ user, onLogout }: SettingsProps) {
  return (
    <div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        Usuario: <strong>{user.email}</strong>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
        Aquí puedes agregar ajustes del chat, API keys, tema, etc.
      </div>
      <button
        onClick={onLogout}
        style={{
          padding: "8px 12px",
          fontSize: 13,
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: "white",
          cursor: "pointer"
        }}>
        Cerrar sesión
      </button>
    </div>
  )
}
