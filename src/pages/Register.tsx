import { useState } from "react"

import type { RegisterCredentials } from "../types/auth"

interface RegisterProps {
  onRegister: (credentials: RegisterCredentials) => Promise<void>
  onSwitchToLogin: () => void
  error?: string | null
  loading?: boolean
}

export function Register({ onRegister, onSwitchToLogin, error, loading }: RegisterProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [name, setName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== passwordConfirmation) {
      alert("Las contraseñas no coinciden")
      return
    }

    await onRegister({
      email,
      password,
      password_confirmation: passwordConfirmation,
      name: name || undefined
    })
  }

  return (
    <div
      style={{
        padding: 20,
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
      <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20 }}>
        Crear Cuenta
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="name"
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 500
            }}>
            Nombre (opcional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: 4,
              boxSizing: "border-box"
            }}
            placeholder="Tu nombre"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 500
            }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: 4,
              boxSizing: "border-box"
            }}
            placeholder="tu.email@ejemplo.com"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 500
            }}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: 4,
              boxSizing: "border-box"
            }}
            placeholder="••••••••"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="password_confirmation"
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 500
            }}>
            Confirmar Contraseña
          </label>
          <input
            id="password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: 4,
              boxSizing: "border-box"
            }}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: 16,
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: 4,
              color: "#c33",
              fontSize: 13
            }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: "white",
            backgroundColor: loading ? "#999" : "#28a745",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 12
          }}>
          {loading ? "Registrando..." : "Crear Cuenta"}
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: "#666" }}>
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0
            }}>
            Inicia sesión aquí
          </button>
        </div>
      </form>
    </div>
  )
}
