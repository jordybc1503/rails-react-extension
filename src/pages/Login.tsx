import { useState } from "react"

import type { LoginCredentials } from "../types/auth"

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>
  onSwitchToRegister: () => void
  error?: string | null
  loading?: boolean
}

export function Login({ onLogin, onSwitchToRegister, error, loading }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onLogin({ email, password })
  }

  return (
    <div
      style={{
        padding: 20,
        width: 320,
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
      <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20 }}>
        Sign In
      </h2>

      <form onSubmit={handleSubmit}>
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
            placeholder="your.email@example.com"
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
            Password
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
            backgroundColor: loading ? "#999" : "#007bff",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 12
          }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: "#666" }}>
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0
            }}>
            Regístrate aquí
          </button>
        </div>
      </form>
    </div>
  )
}
