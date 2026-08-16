import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * WELCHE ROUTEN ÜBERHAUPT IN DER DROSSEL STEHEN (Audit-Punkt AU2, 2026-08-15).
 *
 * Eine fehlende Zeile in `05.rate-limit.ts` sieht aus wie gar nichts: die Route
 * antwortet, die Seite funktioniert, nur ist sie eben unbegrenzt oft
 * aufrufbar. Genau so haben vier Einträge über Monate gefehlt — die
 * Handle-Suche war im Quelltext sogar ausdrücklich als „bekannte Lücke"
 * vermerkt und blieb es trotzdem.
 *
 * Der Test liest die LISTE, nicht das Verhalten. Das ist bewusst: die
 * Middleware hängt an Nitros Auto-Imports (`useRateLimitStore`,
 * `trustedClientIp`, `getRequestURL`) und ist ohne halbe Nitro-Attrappe nicht
 * aufrufbar; die Frage „steht die Route drin" ist aber genau die, die hier
 * schiefgegangen ist. Das VERHALTEN der Zählung deckt `rateLimitStore.test.ts`
 * ab, die Erkennung der 429 im Client `rateLimitedError.test.ts`.
 */
const quelle = readFileSync(
  new URL('../server/middleware/05.rate-limit.ts', import.meta.url),
  'utf8',
)

/** Der Teil ab der Liste — der Kopf-Kommentar erklärt Klassen, die er nennt. */
const listen = quelle.slice(quelle.indexOf('const ALWAYS_LIMITED'))

/**
 * Findet den Eintrag zu einem Pfad und gibt Bucket + Deckel zurück.
 *
 * Erwartet den Pfad GENAU so, wie er im Regex der Liste steht (also mit
 * `\/`) — gesucht wird die Zeile `{ re: /^…$/`, nicht der blosse Pfad. Sonst
 * fände ein `includes('/api/handles/search')` auch einen Kommentar, der die
 * Route nur erwähnt. Genau das war der Zustand vorher: erwähnt, nicht gelistet.
 */
function eintrag(regexRumpf: string): { bucket: string, max: number | null } | null {
  const zeile = listen
    .split('\n')
    .find(line => line.includes(`{ re: /^${regexRumpf}$/`))
  if (!zeile) return null
  const bucket = /bucket: '([^']+)'/.exec(zeile)?.[1] ?? ''
  const maxRoh = /max: ([A-Z_]+|\d+)/.exec(zeile)?.[1] ?? null
  if (maxRoh === null) return { bucket, max: null }
  const alsZahl = Number(maxRoh)
  if (Number.isFinite(alsZahl)) return { bucket, max: alsZahl }
  // Symbolische Deckel (READ_MAX, TOKEN_MAX, …) aus ihrer Deklaration lesen.
  const wert = new RegExp(`const ${maxRoh} = (\\d[\\d_]*)`).exec(quelle)?.[1]
  return { bucket, max: wert ? Number(wert.replace(/_/g, '')) : null }
}

describe('Drossel-Liste in 05.rate-limit.ts', () => {
  it('deckelt den Namenswechsel eng — er schreibt mit dem Admin-Client und ist ein Namens-Orakel', () => {
    const treffer = eintrag('PATCH \\/api\\/account\\/handle')
    expect(treffer, 'PATCH /api/account/handle fehlt in WRITE_LIMITED').not.toBeNull()
    // Ein Mensch benennt sich einmal in 30 Tagen um; alles über den fünf
    // Versuchen der Auth-Geschwister wäre hier ein Zugeständnis an Skripte.
    expect(treffer?.max).toBeLessThanOrEqual(5)
  })

  it('drosselt die Handle-Suche — und teilt ihren Eimer NICHT mit den Themen', () => {
    const suche = eintrag('GET \\/api\\/handles\\/search')
    const themen = eintrag('GET \\/api\\/posts\\/discussions\\/link-search')
    expect(suche, 'GET /api/handles/search fehlt in WRITE_LIMITED').not.toBeNull()
    // Beide Menüs leben in DERSELBEN Schreibfläche: ein gemeinsamer Eimer
    // hiesse, dass ein Beitrag mit Themen UND Erwähnungen sich selbst sperrt.
    expect(suche?.bucket).not.toBe(themen?.bucket)
    // Der Client entprellt um 150 ms, ein Mensch tippt langsamer — es fliegt
    // rund eine Anfrage je Zeichen. Vier Erwähnungen à acht Zeichen sind schon
    // gut 30 Anfragen; ein knapperer Deckel würde das Menü beim Schreiben
    // abwürgen statt Missbrauch zu bremsen.
    expect(suche?.max).toBeGreaterThanOrEqual(60)
  })

  it('nennt die Handle-Suche nicht mehr eine „bekannte Lücke"', () => {
    // Ein Kommentar, der eine geschlossene Lücke behauptet, schickt den
    // nächsten Leser auf eine falsche Fährte — und ein Kommentar, der eine
    // OFFENE Lücke bloss benennt, hat sie noch nie geschlossen.
    expect(quelle).not.toContain('bekannte Lücke')
  })

  it('drosselt das Mess-Ereignis wie sein Geschwister aus der Fehler-Inbox', () => {
    const stats = eintrag('POST \\/api\\/stats-event')
    const telemetry = eintrag('POST \\/api\\/telemetry\\/error')
    expect(stats, 'POST /api/stats-event fehlt in WRITE_LIMITED').not.toBeNull()
    // Gastoffen, ein ausgehender fetch je Aufruf: dieselbe Kostenklasse,
    // deshalb dieselbe Zahl. Eigener Eimer, weil es zwei Melder sind.
    expect(stats?.max).toBe(telemetry?.max)
    expect(stats?.bucket).not.toBe(telemetry?.bucket)
  })

  it('deckelt beide Reaktions-Umschalter, bevor sie ihr Ziel lesen', () => {
    const kommentare = eintrag('POST \\/api\\/comments\\/[^/]+\\/reactions')
    const themen = eintrag('POST \\/api\\/posts\\/discussions\\/reactions')
    expect(kommentare, 'POST /api/comments/:id/reactions fehlt').not.toBeNull()
    expect(themen, 'POST /api/posts/discussions/reactions fehlt').not.toBeNull()
    // Ohne eigenen `max` gilt der Standard-Schreibdeckel (60/min) — genau die
    // Zahl, die die Routen selbst je Mensch und Community führen.
    expect(kommentare?.max).toBeNull()
    expect(themen?.max).toBeNull()
    // Getrennte Eimer wie bei den Stimmen: wer eine Diskussion durchliest,
    // soll sich mit Antwort-Reaktionen nicht die Themen-Reaktionen sperren.
    expect(kommentare?.bucket).not.toBe(themen?.bucket)
  })
})
