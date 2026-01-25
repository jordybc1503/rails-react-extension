import React from "react"
import { NavLink, Outlet } from "react-router-dom"
import type { User } from "../types/auth"

interface DashboardProps {
  user: User
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: "6px 10px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
    color: isActive ? "white" : "#0f172a",
    backgroundColor: isActive ? "#0ea5e9" : "#e2e8f0"
  })

  return (
    <div style={{ padding: 16, width: 360, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Bienvenido, {user.email}</div>
        <button
          onClick={onLogout}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: "white",
            cursor: "pointer"
          }}>
          Cerrar sesión
        </button>
      </div>

      <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <NavLink to="chat" style={linkStyle}>
          Chat
        </NavLink>
        <NavLink to="settings" style={linkStyle}>
          Settings
        </NavLink>
      </nav>

      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
        <Outlet />
      </div>
    </div>
  )
}
