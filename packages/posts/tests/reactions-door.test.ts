import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * DIE REAKTIONS-ROUTE AN DER QUELLE FESTGENAGELT (F57 Mechanik 1).
 *
 * ── WARUM STRUKTURELL UND NICHT LIVE ──────────────────────────────────────
 * Zwei der wichtigsten Zusagen lassen sich auf der Dev-Instanz nicht ueber
 * HTTP zeigen: `reddit-comments` ist EIN-mandantig, es gibt dort weder eine
 * fremde noch eine zahlungs-gesperrte Community. Beide Zusagen haengen aber
 * an EINER Zeile — der Tuerklinke:
 *
 *   const db = tenantDb(event)      // Klinke 'member', Actor 'member'
 *
 * Daran und nur daran haengen M13 (die Sperre friert Inhalte ein) und A5 (wer
 * schreibt, wird Mitglied). Wer sie auf `as: 'operator'` umstellt — etwa um
 * ein Rechte-Problem „schnell zu loesen" —, meldet die Reaktion still von
 * beidem ab, und NICHTS wuerde rot: die Route funktioniert danach besser als
 * vorher. Genau solche Umstellungen hat dieses Repo schon einmal bezahlt
 * (Audit-Befund C1c: fuenf zugesagte Inhaltsarten, EINE tatsaechlich gesperrt).
 *
 * ── UND DIE BADGE-NEUTRALITAET, VON DER ANDEREN SEITE ─────────────────────
 * `tests/reactions.test.ts` prueft den KATALOG (nur `first-reaction` weiss von
 * Reaktionen). Hier steht die Gegenprobe am SCHREIBWEG: die Route darf keinen
 * Upvote-Zaehler und keine Inhalts-Abzeichen melden. Beides zusammen macht
 * Davids Folgeregel (Konzept Teil 4 Punkt 3) pruefbar statt behauptet.
 */

const routeUrl = new URL('../server/api/posts/discussions/reactions.post.ts', import.meta.url)
const source = readFileSync(fileURLToPath(routeUrl), 'utf8')

/** Der Rumpf ohne Kommentare — sonst zaehlt eine Begruendung als Aufruf. */
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

describe('die Reaktions-Route schreibt durch die MITGLIEDER-Klinke', () => {
  it('nimmt die Datentuer ohne Klinken-Umschalter', () => {
    // Genau diese Form: kein `as`, kein `actor` — also Default 'member'.
    expect(code).toContain('const db = tenantDb(event)')
  })

  it('macht das Schreiben NICHT zum Operator', () => {
    /**
     * Die Gegenprobe zur Zeile darueber. `as: 'operator'` kommt in dieser
     * Datei gar nicht vor — das Ziel-Nachschlagen mit der Operator-Klinke
     * lebt bewusst in `server/utils/reactions.ts` (fremde Zeile, nur
     * Feststellung, kein Schreiben).
     */
    expect(code).not.toContain(`as: 'operator'`)
    expect(code).not.toContain(`actor: 'operator'`)
  })

  it('prueft den Wartungsmodus', () => {
    expect(code).toContain('maintenanceMode')
  })

  it('haelt die Erlaubnisliste fail-closed', () => {
    // Erst das Schema (Registry), dann die App-Konfiguration — eine der
    // beiden allein waere eine Anzeige-Empfehlung.
    expect(code).toContain('reactionToggleSchema.parse')
    expect(code).toContain('allowedReactionsFor()')
    expect(code).toContain('allowed.includes(reaction)')
  })
})

describe('BADGE-NEUTRAL am Schreibweg — die Gegenprobe zum Katalog', () => {
  it('meldet AUSSCHLIESSLICH den eigenen Reaktions-Zaehler', () => {
    expect(code).toContain(`kind: 'reactionsGiven'`)
    // Je einmal genannt: eine Reaktion bewegt EINEN Menschen, nicht zwei.
    expect(code.match(/recordUserCounterEvents/g)?.length).toBe(1)
  })

  it('ruehrt keinen Upvote-Zaehler an', () => {
    expect(code).not.toContain('upvotesGiven')
    expect(code).not.toContain('upvotesReceived')
  })

  it('meldet keine Inhalts-Abzeichen (kein zweiter „Like"-Weg)', () => {
    /**
     * `reportContentUpvotes` ist der Weg, ueber den „Nice/Good/Great Topic"
     * entsteht. Stuende er hier, waere eine Reaktion eine Stimme — und Davids
     * Entscheidung 4 („Like = Upvote") haette eine zweite Quelle.
     */
    expect(code).not.toContain('reportContentUpvotes')
  })

  it('schreibt nichts an die Beitrags-Zeile zurueck', () => {
    // Kein Recount, kein `score` — die Reaktion lebt in ihrer eigenen Tabelle.
    expect(code).not.toContain('POSTS_TABLE')
    expect(code).not.toContain('score')
  })
})
