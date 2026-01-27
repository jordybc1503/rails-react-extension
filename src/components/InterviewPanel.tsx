import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"

import IndexPopup from "../popup"

type PanelState = {
  isOpen: boolean
  isMinimized: boolean
  x: number
  y: number
  width: number
  height: number
}

type PanelStateByOrigin = Record<string, PanelState>

const PANEL_STATE_KEY = "interview_panel_state_v1"
const MARGIN = 8
const MINIMIZED_HEIGHT = 48
const MIN_WIDTH = 320
const MIN_HEIGHT = 280
const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 560
const DEFAULT_STATE: PanelState = {
  isOpen: true,
  isMinimized: false,
  x: 24,
  y: 24,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT
}
const PANEL_MAX_HEIGHT = 720
const MINIMIZED_WIDTH = 220

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}

function useOriginKey(): string {
  return useMemo(() => window.location.origin, [])
}

function usePanelPersistence(originKey: string) {
  const [ready, setReady] = useState(false)
  const [panelState, setPanelState] = useState<PanelState>(DEFAULT_STATE)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const result = await chrome.storage.local.get([PANEL_STATE_KEY])
        const allStates = (result[PANEL_STATE_KEY] ?? {}) as PanelStateByOrigin
        const storedState = allStates[originKey]
        if (isMounted && storedState) {
          setPanelState({ ...DEFAULT_STATE, ...storedState })
        }
      } finally {
        if (isMounted) {
          setReady(true)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [originKey])

  const persist = useCallback(
    async (nextState: PanelState) => {
      const result = await chrome.storage.local.get([PANEL_STATE_KEY])
      const allStates = (result[PANEL_STATE_KEY] ?? {}) as PanelStateByOrigin
      const nextStates: PanelStateByOrigin = {
        ...allStates,
        [originKey]: nextState
      }
      await chrome.storage.local.set({ [PANEL_STATE_KEY]: nextStates })
    },
    [originKey]
  )

  useEffect(() => {
    if (!ready) {
      return
    }

    void persist(panelState)
  }, [panelState, persist, ready])

  return { ready, panelState, setPanelState }
}

function getEffectiveDimensions(state: PanelState) {
  if (state.isMinimized) {
    return {
      width: MINIMIZED_WIDTH,
      height: MINIMIZED_HEIGHT
    }
  }

  return {
    width: state.width,
    height: state.height
  }
}

function getPositionBounds(width: number, height: number) {
  const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN)
  const maxY = Math.max(MARGIN, window.innerHeight - height - MARGIN)

  return { maxX, maxY }
}

function getMaxSizeAtPosition(x: number, y: number) {
  const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - x - MARGIN)
  const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - y - MARGIN)

  return {
    maxWidth,
    maxHeight: Math.min(maxHeight, PANEL_MAX_HEIGHT)
  }
}

export function InterviewPanel() {
  console.log("[panel] interview panel component mounted", {
    href: window.location.href,
    origin: window.location.origin,
    isTopFrame: window.top === window
  })

  const originKey = useOriginKey()
  const { ready, panelState, setPanelState } = usePanelPersistence(originKey)

  const draggingRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
  } | null>(null)

  const resizingRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  const updatePosition = useCallback(
    (nextX: number, nextY: number) => {
      setPanelState((prev) => {
        const { width, height } = getEffectiveDimensions(prev)
        const { maxX, maxY } = getPositionBounds(width, height)
        const x = clamp(nextX, MARGIN, maxX)
        const y = clamp(nextY, MARGIN, maxY)

        if (x === prev.x && y === prev.y) {
          return prev
        }

        return { ...prev, x, y }
      })
    },
    [setPanelState]
  )

  const updateSize = useCallback(
    (nextWidth: number, nextHeight: number) => {
      setPanelState((prev) => {
        if (prev.isMinimized) {
          return prev
        }

        const { maxWidth, maxHeight } = getMaxSizeAtPosition(prev.x, prev.y)
        const width = clamp(nextWidth, MIN_WIDTH, maxWidth)
        const height = clamp(nextHeight, MIN_HEIGHT, maxHeight)

        if (width === prev.width && height === prev.height) {
          return prev
        }

        return { ...prev, width, height }
      })
    },
    [setPanelState]
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const resize = resizingRef.current
      if (resize && resize.pointerId === event.pointerId) {
        const deltaX = event.clientX - resize.startX
        const deltaY = event.clientY - resize.startY
        updateSize(resize.startWidth + deltaX, resize.startHeight + deltaY)
        return
      }

      const drag = draggingRef.current
      if (!drag || drag.pointerId !== event.pointerId) {
        return
      }

      const nextX = event.clientX - drag.offsetX
      const nextY = event.clientY - drag.offsetY
      updatePosition(nextX, nextY)
    },
    [updatePosition, updateSize]
  )

  const stopInteraction = useCallback(
    (event: PointerEvent) => {
      const drag = draggingRef.current
      const resize = resizingRef.current

      const matchesDrag = drag && drag.pointerId === event.pointerId
      const matchesResize = resize && resize.pointerId === event.pointerId

      if (!matchesDrag && !matchesResize) {
        return
      }

      draggingRef.current = null
      resizingRef.current = null
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopInteraction)
    },
    [handlePointerMove]
  )

  const startDragging = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pointerId = event.pointerId
      const offsetX = event.clientX - panelState.x
      const offsetY = event.clientY - panelState.y

      draggingRef.current = { pointerId, offsetX, offsetY }
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", stopInteraction)
    },
    [handlePointerMove, panelState.x, panelState.y, stopInteraction]
  )

  const startResizing = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (panelState.isMinimized) {
        return
      }

      const pointerId = event.pointerId
      resizingRef.current = {
        pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: panelState.width,
        startHeight: panelState.height
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", stopInteraction)
    },
    [handlePointerMove, panelState.height, panelState.isMinimized, panelState.width, stopInteraction]
  )

  const toggleOpen = useCallback(() => {
    setPanelState((prev) => ({ ...prev, isOpen: !prev.isOpen, isMinimized: false }))
  }, [setPanelState])

  const toggleMinimized = useCallback(() => {
    setPanelState((prev) => {
      const nextIsMinimized = !prev.isMinimized
      const nextState = { ...prev, isMinimized: nextIsMinimized }
      const { width, height } = getEffectiveDimensions(nextState)
      const { maxX, maxY } = getPositionBounds(width, height)
      return {
        ...nextState,
        x: clamp(prev.x, MARGIN, maxX),
        y: clamp(prev.y, MARGIN, maxY)
      }
    })
  }, [setPanelState])

  useEffect(() => {
    const handleResize = () => {
      setPanelState((prev) => {
        let nextState = prev

        if (!prev.isMinimized) {
          const { maxWidth, maxHeight } = getMaxSizeAtPosition(prev.x, prev.y)
          const width = clamp(prev.width, MIN_WIDTH, maxWidth)
          const height = clamp(prev.height, MIN_HEIGHT, maxHeight)

          if (width !== prev.width || height !== prev.height) {
            nextState = { ...nextState, width, height }
          }
        }

        const { width, height } = getEffectiveDimensions(nextState)
        const { maxX, maxY } = getPositionBounds(width, height)
        const x = clamp(nextState.x, MARGIN, maxX)
        const y = clamp(nextState.y, MARGIN, maxY)

        if (x === nextState.x && y === nextState.y) {
          return nextState
        }

        return {
          ...nextState,
          x,
          y
        }
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [setPanelState])

  useEffect(() => {
    if (!ready) {
      return
    }

    setPanelState((prev) => {
      let nextState = prev

      if (!prev.isMinimized) {
        const { maxWidth, maxHeight } = getMaxSizeAtPosition(prev.x, prev.y)
        const width = clamp(prev.width, MIN_WIDTH, maxWidth)
        const height = clamp(prev.height, MIN_HEIGHT, maxHeight)

        if (width !== prev.width || height !== prev.height) {
          nextState = { ...nextState, width, height }
        }
      }

      const { width, height } = getEffectiveDimensions(nextState)
      const { maxX, maxY } = getPositionBounds(width, height)
      const x = clamp(nextState.x, MARGIN, maxX)
      const y = clamp(nextState.y, MARGIN, maxY)

      if (x === nextState.x && y === nextState.y) {
        return nextState
      }

      return { ...nextState, x, y }
    })
  }, [ready, setPanelState])

  if (!ready) {
    return null
  }

  const effectiveDimensions = getEffectiveDimensions(panelState)
  const contentMaxHeight = Math.max(160, effectiveDimensions.height - 44)

  const panelStyle: CSSProperties = {
    position: "fixed",
    top: panelState.y,
    left: panelState.x,
    width: effectiveDimensions.width,
    height: effectiveDimensions.height,
    zIndex: 2_147_483_647,
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, sans-serif"
  }

  const headerButtonStyle: CSSProperties = {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer"
  }

  return (
    <div>
      {!panelState.isOpen ? (
        <button
          type="button"
          onClick={toggleOpen}
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 2_147_483_647,
            border: "1px solid #0ea5e9",
            background: "#0ea5e9",
            color: "#ffffff",
            borderRadius: 999,
            padding: "10px 14px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 14px 30px rgba(14, 165, 233, 0.35)"
          }}>
          Abrir asistente
        </button>
      ) : (
        <div style={panelStyle}>
          <div
            onPointerDown={startDragging}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "8px 10px",
              background: "#0f172a",
              color: "#ffffff",
              cursor: "grab",
              userSelect: "none"
            }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Hannah AI</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={toggleMinimized} style={headerButtonStyle}>
                {panelState.isMinimized ? "Expandir" : "Minimizar"}
              </button>
              <button type="button" onClick={toggleOpen} style={headerButtonStyle}>
                Cerrar
              </button>
            </div>
          </div>

          {!panelState.isMinimized ? (
            <div
              style={{
                padding: 8,
                height: contentMaxHeight,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}>
              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <IndexPopup />
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "6px 10px",
                fontSize: 11,
                color: "#0f172a",
                background: "#f8fafc"
              }}>
              Asistente minimizado. Arrastrame o expandeme.
            </div>
          )}

          {!panelState.isMinimized ? (
            <div
              onPointerDown={startResizing}
              title="Arrastra para redimensionar"
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 18,
                height: 18,
                cursor: "nwse-resize",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0) 50%, rgba(148,163,184,0.85) 50%)"
              }}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
