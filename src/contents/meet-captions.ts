import type { PlasmoCSConfig } from "plasmo"

import { createCaptionDispatcher } from "../captions/caption-pipeline"

export const config: PlasmoCSConfig = {
  matches: ["https://meet.google.com/*"],
  run_at: "document_idle"
}

const dispatcher = createCaptionDispatcher("meet")
const lastTextByRow = new WeakMap<Element, string>()

function pickText(selectors: string[], root: Element): string | null {
  for (const selector of selectors) {
    const element = root.querySelector(selector)
    const text = element?.textContent?.trim()
    if (text) {
      return text
    }
  }

  return null
}

function extractCaption(row: Element): { speaker: string; text: string } | null {
  const captionText = pickText(
    ['div[jsname="tgaKEf"]', 'span[jsname="tgaKEf"]', "div.VbkSUe"],
    row
  )

  if (!captionText) {
    return null
  }

  const speakerText = pickText(["div.YTbUzc", "div.Zmm6We", "span.YTbUzc"], row)
  return {
    speaker: speakerText || "Interviewer",
    text: captionText
  }
}

function processRow(row: Element) {
  const extracted = extractCaption(row)
  if (!extracted) {
    return
  }

  const lastText = lastTextByRow.get(row)
  if (lastText === extracted.text) {
    return
  }

  lastTextByRow.set(row, extracted.text)
  dispatcher.enqueueCaption(extracted.speaker, extracted.text)
}

function scanCaptions() {
  const rows = document.querySelectorAll("div.nMcdL.bj4p3b")
  rows.forEach((row) => processRow(row))
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
console.log("[captions:meet] caption observer enabled")
