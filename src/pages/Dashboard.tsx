import React from "react"
import { NavLink, Outlet } from "react-router-dom"
import type { User } from "../types/auth"

interface DashboardProps {
  user: User
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const compactLinkStyle = ({ isActive }) => ({
    padding: "4px 8px",
    fontSize: 12,
    borderRadius: 6,
    textDecoration: "none",
    border: "1px solid #e2e8f0",
    color: isActive ? "white" : "#0f172a",
    backgroundColor: isActive ? "#0ea5e9" : "#e2e8f0"
  })


  return (
    <div
      style={{
        padding: 12,
        width: "100%",
        minWidth: 300,
        height: "100%",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        gap: 8
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 6
        }}
      >
        {/* Usuario */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap"
          }}
        >
          {user.email}
        </div>

        {/* Nav */}
        <nav
          style={{
            display: "flex",
            gap: 6,
            flex: 1
          }}
        >
          <NavLink to="chat" style={compactLinkStyle}>
            Chat
          </NavLink>
          <NavLink to="conversations" style={compactLinkStyle}>
            Conversaciones
          </NavLink>
          <NavLink to="settings" style={compactLinkStyle}>
            Settings
          </NavLink>
        </nav>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: "white",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* CONTENT */}
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
        }}
      >
        <Outlet />
      </div>
    </div>
  )

}
