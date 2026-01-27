import type { PlasmoCSConfig } from "plasmo"

import { createCaptionDispatcher } from "../captions/caption-pipeline"

export const config: PlasmoCSConfig = {
  matches: ["https://teams.microsoft.com/*"],
  run_at: "document_idle"
}

const dispatcher = createCaptionDispatcher("teams")
const lastTextBySpan = new WeakMap<Element, string>()

function extractSpeaker(span: Element): string {
  const container = span.closest("[data-tid='closed-caption-item']") ?? span.parentElement
  const speakerElement = container?.querySelector("[data-tid='closed-caption-speaker-name']")
  const speaker = speakerElement?.textContent?.trim()
  return speaker || "Interviewer"
}

function processSpan(span: Element) {
  const text = span.textContent?.trim()
  if (!text) {
    return
  }

  const lastText = lastTextBySpan.get(span)
  if (lastText === text) {
    return
  }

  lastTextBySpan.set(span, text)
  const speaker = extractSpeaker(span)
  dispatcher.enqueueCaption(speaker, text)
}

function scanCaptions() {
  const spans = document.querySelectorAll("span[data-tid='closed-caption-text']")
  spans.forEach((span) => processSpan(span))
}

const observer = new MutationObserver(() => {
  scanCaptions()
})

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true
})

scanCaptions()
console.log("[captions:teams] caption observer enabled")
