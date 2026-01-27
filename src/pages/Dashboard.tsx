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
    <div
      style={{
        padding: 16,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        gap: 10
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 4
        }}>
        <div style={{ fontSize: 14, fontWeight: 600, wordBreak: "break-word" }}>
          Bienvenido, {user.email}
        </div>
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

      <nav style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
        <NavLink to="chat" style={linkStyle}>
          Chat
        </NavLink>
        <NavLink to="conversations" style={linkStyle}>
          Conversaciones
        </NavLink>
        <NavLink to="settings" style={linkStyle}>
          Settings
        </NavLink>
      </nav>

      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 12,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
        <Outlet />
      </div>
    </div>
  )
}
