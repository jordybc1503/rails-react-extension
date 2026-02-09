import { useCallback, useEffect, useState } from "react"

import { getProfile, updateProfile } from "../api"
import type { User } from "../types/auth"

interface SettingsProps {
  user: User
  onLogout: () => void
}

export function Settings({ user, onLogout }: SettingsProps) {
  const [profileText, setProfileText] = useState("")
  const [originalText, setOriginalText] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const profile = await getProfile()
        if (isMounted) {
          setProfileText(profile.profile_text || "")
          setOriginalText(profile.profile_text || "")
        }
      } catch {
        // Profile may not exist yet, that's ok
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

  const handleSave = useCallback(async () => {
    setSaving(true)
    setMessage(null)

    try {
      await updateProfile(profileText)
      setOriginalText(profileText)
      setMessage({ type: "success", text: "Perfil guardado correctamente" })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al guardar"
      })
    } finally {
      setSaving(false)
    }
  }, [profileText])

  const hasChanges = profileText !== originalText

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, marginBottom: 4 }}>
        Usuario: <strong>{user.email}</strong>
      </div>

      <div>
        <label
          htmlFor="profile-text"
          style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          Tu perfil / CV (experiencia, skills, educación)
        </label>
        <textarea
          id="profile-text"
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          placeholder={`Ejemplo:\n\n• 5 años de experiencia en desarrollo web\n• Tecnologías: React, Node.js, Python, AWS\n• Educación: Ing. en Sistemas, Universidad XYZ\n• Certificaciones: AWS Solutions Architect\n• Proyectos destacados: Sistema de recomendaciones ML...`}
          disabled={loading || saving}
          style={{
            width: "100%",
            minHeight: 180,
            padding: 10,
            fontSize: 12,
            lineHeight: 1.5,
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            resize: "vertical",
            fontFamily: "inherit"
          }}
        />
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
          Esta información se usará para personalizar las respuestas del asistente durante tus
          entrevistas.
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            fontSize: 12,
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#991b1b"
          }}>
          {message.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving || loading}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            borderRadius: 6,
            border: "none",
            background: hasChanges && !saving ? "#0ea5e9" : "#94a3b8",
            color: "white",
            cursor: hasChanges && !saving ? "pointer" : "not-allowed"
          }}>
          {saving ? "Guardando..." : "Guardar perfil"}
        </button>

        <button
          type="button"
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
    </div>
  )
}
