import { useState } from "react"

import { Login } from "./components/Login"
import { Register } from "./components/Register"
import { useAuth } from "./hooks/useAuth"

function IndexPopup() {
  const { user, loading, error, isAuthenticated, login, register, logout } = useAuth()
  const [showRegister, setShowRegister] = useState(false)

  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          width: 320,
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center"
        }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onRegister={register}
          onSwitchToLogin={() => setShowRegister(false)}
          error={error}
          loading={loading}
        />
      )
    }

    return (
      <Login
        onLogin={login}
        onSwitchToRegister={() => setShowRegister(true)}
        error={error}
        loading={loading}
      />
    )
  }

  return (
    <div
      style={{
        padding: 20,
        width: 320,
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20
        }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Welcome!</h2>
        <button
          onClick={logout}
          style={{
            padding: "6px 12px",
            fontSize: 13,
            backgroundColor: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: 4,
            cursor: "pointer"
          }}>
          Logout
        </button>
      </div>

      <div
        style={{
          padding: 12,
          backgroundColor: "#f8f9fa",
          borderRadius: 6,
          marginBottom: 16
        }}>
        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
          <strong>Email:</strong> {user?.email}
        </p>
        {user?.name && (
          <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "#666" }}>
            <strong>Name:</strong> {user.name}
          </p>
        )}
      </div>

      <div
        style={{
          padding: 16,
          backgroundColor: "#e7f3ff",
          border: "1px solid #b3d9ff",
          borderRadius: 6
        }}>
        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>
          You're authenticated! 🎉
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
          Your extension is now connected to the Rails backend with JWT authentication.
        </p>
      </div>
    </div>
  )
}

export default IndexPopup
