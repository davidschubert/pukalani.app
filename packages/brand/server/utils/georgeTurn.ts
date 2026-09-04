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
 *   OPTION: … je eine Antwort-Möglichkeit, ganz am Ende (Davids Anforderung
 *   2026-09-04)
 *
 * ── DER FÜNFTE MARKER IST EIN BEDIENELEMENT, KEIN TEXT ────────────────────
 * Stellt George eine Wahl zwischen zwei oder drei BENANNTEN Möglichkeiten
 * („der Handwerker, der sein Handwerk zeigt, oder der Mentor, der sein Wissen
 * teilt?"), stand die Frage bis hierhin als Fließtext da und der Mensch tippte
 * die Antwort ab. `OPTION:`-Zeilen machen daraus Knöpfe: sie verlassen den
 * sichtbaren Text VOLLSTÄNDIG (anders als BASIS/ASK, die nur ihr Etikett
 * verlieren — eine Beschriftung, die als loser Satz stehen bliebe, stünde
 * zweimal da) und reisen strukturiert im `generation.completed`-Frame.
 * Georges EMPFEHLUNG bleibt bewusst Prosa im Zug: sie ist ein Satz mit
 * Begründung, kein Etikett auf einem Knopf.
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

import {
  type BrandGenerationOutcome,
  normalizeBrandTurnOptions,
} from '../../shared/brandGeneration'

/** Die fünf Marker. Reihenfolge egal, aber jeder steht am ZEILENANFANG. */
export const GEORGE_TURN_MARKERS = ['QUESTION:', 'BASIS:', 'DRAFT:', 'ASK:', 'OPTION:'] as const

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
  const body = lines
    .slice(draftIndex + 1, askIndex >= 0 ? askIndex : lines.length)
    // EIN BEDIENELEMENT GEHÖRT NIE IN EIN FELD: eine verirrte `OPTION:`-Zeile
    // stünde sonst wörtlich im Brand-Dokument. Der Entwurfs-Fall kennt gar
    // keine Optionen (die Route liest sie nur bei einer Rückfrage) — hier fällt
    // trotzdem, was das Modell entgegen dem Auftrag schreibt.
    .filter(line => !line.startsWith('OPTION:'))
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
 * Eine reine `DRAFT:`-Zeile VERSCHWINDET ganz (sie trennt nur), eine
 * `OPTION:`-Zeile IMMER (sie ist ein Knopf, kein Satz — s. Kopf), jeder andere
 * Marker verliert nur sein Etikett. Das Ergebnis liest sich als zusammenhängender
 * Zug: ein Satz Begründung, der Entwurf, eine Frage.
 */
export function stripGeorgeTurnMarkers(text: string): string {
  const out: string[] = []
  for (const line of text.split('\n')) {
    const marker = markerAt(line)
    if (!marker) { out.push(line); continue }
    if (marker === 'OPTION:') continue
    const rest = line.slice(marker.length).replace(/^ +/, '')
    if (marker === 'DRAFT:' && rest === '') continue
    out.push(rest)
  }
  return out.join('\n')
}

/** Was aus einem Zug an Antwort-Möglichkeiten herauszulesen war. */
export interface GeorgeTurnOptions {
  /** Der Zug OHNE die `OPTION:`-Zeilen — die anderen Marker bleiben unberührt. */
  message: string
  /** Zwei oder drei Beschriftungen, sonst leer (s. u.). */
  options: string[]
}

/**
 * DIE ANTWORT-MÖGLICHKEITEN AUS EINEM ZUG ZIEHEN (Davids Anforderung
 * 2026-09-04).
 *
 * ── DIE ZEILEN GEHEN IMMER, DIE OPTIONEN NUR ZU ZWEIT ─────────────────────
 * Weniger als zwei gültige Beschriftungen heisst „keine Wahl" (die Begründung
 * steht bei `normalizeBrandTurnOptions`) — die ZEILEN verschwinden trotzdem aus
 * dem Text. Sonst stünde nach einer verunglückten Wahl ein rohes „OPTION: …"
 * in der Sprechblase, und der Marker-Vertrag wäre für den Menschen sichtbar.
 *
 * ── SIE WIRD AUF DEM ROHTEXT GERUFEN, VOR JEDEM STRIP ─────────────────────
 * `stripGeorgeTurnMarkers` wirft die Zeilen weg; wer danach fragt, findet
 * nichts mehr. Die Reihenfolge in beiden Routen ist deshalb: erst hier lesen,
 * dann den Rest putzen.
 */
export function parseGeorgeOptions(raw: string): GeorgeTurnOptions {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const kept: string[] = []
  const labels: string[] = []
  for (const line of lines) {
    if (!line.startsWith('OPTION:')) { kept.push(line); continue }
    labels.push(line.slice('OPTION:'.length))
  }
  // Deckel und Klemmung macht die geteilte Regel: mehr als drei sind kein Menü,
  // sondern ein Formular — die ersten drei gewinnen, weil sie im Zug zuerst
  // begründet wurden.
  return { message: kept.join('\n').trim(), options: normalizeBrandTurnOptions(labels) }
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
