/**
 * DER ZUG-VERTRAG (george-a-4) — wie aus EINER Modell-Antwort ein Chat-Zug UND
 * ein Slot-Wert werden, und wie „ich frage lieber nach" überhaupt sagbar wird.
 *
 * ── WARUM ES DIESEN VERTRAG GIBT ──────────────────────────────────────────
 * Bis `george-a-3` war die Antwort des Modells der Slot-Wert und der Chat-Zug
 * zugleich: derselbe Text stand im Feld und in der Sprechblase. Der Live-Audit
 * hat daran zwei Dinge gefunden. (B2) Ein Entwurf ohne Rahmen ist eine
 * Behauptung — er sagt nicht, worauf er sich stützt, und er endet nicht mit
 * einer Frage, obwohl Regel 2 genau das verlangt. (B3) Und wenn das Material
 * nicht reicht, schreibt ein Modell trotzdem einen Entwurf, weil es keine
 * andere Form kennt — obwohl Davids Leitsatz das Gegenteil will: „ehrlich
 * benennen, was fehlt; eine kleine, leicht beantwortbare Frage zuerst."
 *
 * Beides braucht dieselbe Sache: eine Antwort, die MEHR als einen Teil hat.
 * Statt eines zweiten Aufrufs (Geld, Latenz) oder eines JSON-Modus (der das
 * Streaming zerstört) tragen VIER Marker am Zeilenanfang die Struktur:
 *
 *   BASIS: worauf sich der Entwurf stützt (ein Satz, Chat-Sprache)
 *   DRAFT:
 *   … der Feldwert, mehrzeilig erlaubt, Inhaltssprache …
 *   ASK: genau eine Abschlussfrage (Chat-Sprache)
 *
 *   QUESTION: … statt alledem, wenn das Material nicht reicht
 *
 * ── DREI DINGE, DIE MAN NICHT „VEREINFACHEN" DARF ─────────────────────────
 * 1. **Der Rückfall ist der Stand von vorher.** Findet `parseGeorgeTurn` keinen
 *    Marker (altes Modell, ignorierter Vertrag), ist der ganze Text Entwurf UND
 *    Chat — exakt `george-a-3`. Der schlimmste Fall dieses Umbaus ist damit
 *    „wie bisher", nie ein kaputter Slot.
 * 2. **Der Strom wird GEPUTZT, nicht nachträglich ersetzt.** Der Mensch sieht
 *    George schreiben; stünde dort erst „BASIS:" und am Ende spränge der Text
 *    um, wäre das Streaming eine Zierde mit Ruckler. `createGeorgeTurnScrubber`
 *    entfernt die Marker im Fluss — und hält dafür genau so lange zurück, wie
 *    eine angebrochene Zeile noch ein Marker werden könnte.
 * 3. **Die Marker sind ZEILENANKER.** Ein Marker mitten im Satz ist keiner.
 *    Sonst zerschnitte ein Slot-Text, der zufällig „ASK:" enthält, seinen
 *    eigenen Entwurf.
 */

import type { BrandGenerationOutcome } from '../../shared/brandGeneration'

/** Die vier Marker. Reihenfolge egal, aber jeder steht am ZEILENANFANG. */
export const GEORGE_TURN_MARKERS = ['QUESTION:', 'BASIS:', 'DRAFT:', 'ASK:'] as const

export interface GeorgeTurn {
  outcome: BrandGenerationOutcome
  /** Der SLOT-Wert. Bei einer Rückfrage leer — dann wird kein Feld angefasst. */
  draft: string
  /** Der CHAT-Zug: gerahmter Entwurf bzw. die Rückfrage. */
  message: string
}

function markerAt(line: string): (typeof GEORGE_TURN_MARKERS)[number] | null {
  return GEORGE_TURN_MARKERS.find(marker => line.startsWith(marker)) ?? null
}

/**
 * DIE LESE-SEITE. Ohne Marker: alles ist Entwurf und Chat zugleich (s. Kopf).
 *
 * `QUESTION:` gewinnt, sobald es eine solche Zeile gibt und KEIN `DRAFT:`
 * daneben steht — ein Modell, das beides schickt, hat einen Entwurf gemeint,
 * und der ist die verlässlichere Auskunft.
 */
export function parseGeorgeTurn(raw: string): GeorgeTurn {
  const text = raw.replace(/\r\n/g, '\n').trim()
  if (!text) return { outcome: 'draft', draft: '', message: '' }

  const lines = text.split('\n')
  const draftIndex = lines.findIndex(line => line.startsWith('DRAFT:'))
  const questionIndex = lines.findIndex(line => line.startsWith('QUESTION:'))

  if (questionIndex >= 0 && draftIndex < 0) {
    const body = [
      lines[questionIndex]!.slice('QUESTION:'.length),
      ...lines.slice(questionIndex + 1),
    ].join('\n').trim()
    return { outcome: 'question', draft: '', message: body }
  }

  if (draftIndex < 0) return { outcome: 'draft', draft: text, message: text }

  const basisIndex = lines.findIndex(line => line.startsWith('BASIS:'))
  let askIndex = -1
  for (let index = lines.length - 1; index > draftIndex; index -= 1) {
    if (lines[index]!.startsWith('ASK:')) { askIndex = index; break }
  }

  const head = lines[draftIndex]!.slice('DRAFT:'.length).trim()
  const body = lines.slice(draftIndex + 1, askIndex >= 0 ? askIndex : lines.length)
  const draft = [...(head ? [head] : []), ...body].join('\n').trim()

  const basis = basisIndex >= 0 && basisIndex < draftIndex
    ? lines[basisIndex]!.slice('BASIS:'.length).trim()
    : ''
  const ask = askIndex >= 0 ? lines[askIndex]!.slice('ASK:'.length).trim() : ''

  return {
    outcome: 'draft',
    draft,
    message: [basis, draft, ask].filter(part => part.length > 0).join('\n\n'),
  }
}

/**
 * Die Marker aus einem Text nehmen — für die Sprechblase, nie für den Slot.
 *
 * Eine reine `DRAFT:`-Zeile VERSCHWINDET ganz (sie trennt nur), jeder andere
 * Marker verliert nur sein Etikett. Das Ergebnis liest sich als zusammenhängender
 * Zug: ein Satz Begründung, der Entwurf, eine Frage.
 */
export function stripGeorgeTurnMarkers(text: string): string {
  const out: string[] = []
  for (const line of text.split('\n')) {
    const marker = markerAt(line)
    if (!marker) { out.push(line); continue }
    const rest = line.slice(marker.length).replace(/^ +/, '')
    if (marker === 'DRAFT:' && rest === '') continue
    out.push(rest)
  }
  return out.join('\n')
}

/**
 * Bis wohin ist das Putzen STABIL? Alles bis zum letzten Zeilenumbruch immer;
 * die angebrochene letzte Zeile nur dann, wenn sie kein Marker mehr werden kann.
 *
 * Ohne diese Bremse flösse ein „D" als Text in die Sprechblase und müsste eine
 * Zeichenkette später wieder verschwinden — und die Deltas kennen kein Zurück.
 */
function stableLength(raw: string): number {
  const lastBreak = raw.lastIndexOf('\n')
  const tail = raw.slice(lastBreak + 1)
  if (!tail) return raw.length
  const pending = GEORGE_TURN_MARKERS.some(
    marker => marker.startsWith(tail) && tail.length < marker.length,
  )
  return pending ? lastBreak + 1 : raw.length
}

/**
 * DER STROM-PUTZER: nimmt die Rohdeltas des Anbieters und gibt zurück, was
 * sichtbar werden darf — Marker-frei, in derselben Reihenfolge, jedes Zeichen
 * höchstens einmal.
 *
 * Gerechnet wird immer auf dem GANZEN bisherigen Text und ausgegeben nur der
 * Zuwachs. Das ist der Grund, warum ein an beliebiger Stelle zerrissener Chunk
 * (und genau so kommen sie an) dasselbe Ergebnis liefert wie ein Text am Stück.
 */
export function createGeorgeTurnScrubber(): (chunk: string) => string {
  let raw = ''
  let sent = 0
  return (chunk: string): string => {
    raw += chunk
    const clean = stripGeorgeTurnMarkers(raw.slice(0, stableLength(raw)))
    if (clean.length <= sent) return ''
    const out = clean.slice(sent)
    sent = clean.length
    return out
  }
}
