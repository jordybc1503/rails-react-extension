import { MemoryRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Dashboard } from "./pages/Dashboard"
import { Chat } from "./pages/Chat"
import { ConversationPage } from "./pages/ConversationPage"
import { Settings } from "./pages/Settings"
import { useAuth } from "./hooks/useAuth"
import type { LoginCredentials, RegisterCredentials, User } from "./types/auth"

interface UnauthenticatedRoutesProps {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  error?: string | null
  loading?: boolean
}

function UnauthenticatedRoutes({ login, register, error, loading }: UnauthenticatedRoutesProps) {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Login
            onLogin={login}
            onSwitchToRegister={() => navigate("/register")}
            error={error}
            loading={loading}
          />
        }
      />
      <Route
        path="/register"
        element={
          <Register
            onRegister={register}
            onSwitchToLogin={() => navigate("/login")}
            error={error}
            loading={loading}
          />
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

interface AuthenticatedRoutesProps {
  user: User
  onLogout: () => void
}

function AuthenticatedRoutes({ user, onLogout }: AuthenticatedRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Dashboard user={user} onLogout={onLogout} />}>
        <Route index element={<Navigate to="chat" replace />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:conversationId" element={<Chat />} />
        <Route path="conversations" element={<ConversationPage />} />
        <Route path="settings" element={<Settings user={user} onLogout={onLogout} />} />
      </Route>
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}

function IndexPopup() {
  const { user, loading, error, isAuthenticated, login, register, logout } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center"
        }}>
        <p>Loading...</p>
      </div>
    )
  }

  const routerKey = isAuthenticated ? "auth" : "guest"
  const initialEntries = isAuthenticated ? ["/chat"] : ["/login"]

  if (isAuthenticated && user) {
    return (
      <MemoryRouter key={routerKey} initialEntries={initialEntries}>
        <AuthenticatedRoutes user={user} onLogout={logout} />
      </MemoryRouter>
    )
  }

  return (
    <MemoryRouter key={routerKey} initialEntries={initialEntries}>
      <UnauthenticatedRoutes
        login={login}
        register={register}
        error={error}
        loading={loading}
      />
    </MemoryRouter>
  )
}

export default IndexPopup
