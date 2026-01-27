import type { PlasmoCSConfig } from "plasmo"
import React from "react"
import { createRoot } from "react-dom/client"

import { InterviewPanel } from "../components/InterviewPanel"

export const config: PlasmoCSConfig = {
  matches: [
    "https://meet.google.com/*",
    "https://teams.microsoft.com/*",
    "https://teams.live.com/*",
    "https://*.zoom.us/*"
  ],
  run_at: "document_idle",
  all_frames: true
}

const HOST_ID = "hannah-ai-root"
const CONTAINER_ID = "hannah-ai-container"

declare global {
  interface Window {
    __hannahPanelMounted?: boolean
  }
}

function ensureShadowContainer(): HTMLElement | null {
  const existingHost = document.getElementById(HOST_ID)
  if (existingHost?.shadowRoot) {
    const existingContainer = existingHost.shadowRoot.getElementById(CONTAINER_ID)
    if (existingContainer) {
      return existingContainer as HTMLElement
    }
  }

  const host = existingHost ?? document.createElement("div")
  host.id = HOST_ID
  host.style.position = "fixed"
  host.style.top = "0"
  host.style.left = "0"
  host.style.width = "0"
  host.style.height = "0"
  host.style.zIndex = "2147483647"

  if (!existingHost) {
    document.documentElement.appendChild(host)
  }

  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" })

  const baseStyle = document.createElement("style")
  baseStyle.textContent = `
    :host, :host * {
      box-sizing: border-box;
    }
  `

  const container = document.createElement("div")
  container.id = CONTAINER_ID

  shadowRoot.innerHTML = ""
  shadowRoot.append(baseStyle, container)

  return container
}

function mountPanel() {
  if (window.top !== window) {
    return
  }

  if (window.__hannahPanelMounted) {
    return
  }

  const container = ensureShadowContainer()
  if (!container) {
    return
  }

  window.__hannahPanelMounted = true

  console.log("[panel] mounting manual interview panel", {
    href: window.location.href,
    origin: window.location.origin,
    readyState: document.readyState
  })

  const root = createRoot(container)
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(InterviewPanel, null)
    )
  )
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", mountPanel, { once: true })
} else {
  mountPanel()
}
