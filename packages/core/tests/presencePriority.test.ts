import { describe, expect, it } from 'vitest'
import {
  PRESENCE_VISIBLE_FRESH_MS,
  type PresencePrioritySnapshot,
  yieldsToForeignVisiblePresence,
} from '../shared/presencePriority'
import { PRESENCE_FRESH_MS } from '../server/utils/presenceFilter'

/**
 * Vorfahrt „sichtbar schlägt away (fremder Mandant)" — die Regel hinter dem
 * flackernden Online-Zähler (2026-08-18): zwei Dashboards verschiedener
 * Communities teilen sich EINE Presence, und der gedrosselte Hintergrund-Tab
 * stahl dem sichtbaren Tab den Mandanten-Stempel.
 *
 * Jeder TRUE-Fall („der Schreiber weicht") steht hier neben seiner Gegenprobe:
 * eine Bedingung gekippt ⇒ false. Sonst könnte die Regel auch pauschal
 * blockieren und wäre trotzdem grün.
 */

const NOW = Date.parse('2026-08-18T12:00:00.000Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

/** Der Normalfall: der sichtbare Tab von Kunde A, gerade eben geschrieben. */
function visible(overrides: Partial<PresencePrioritySnapshot> = {}): PresencePrioritySnapshot {
  return { updatedAt: ago(5_000), away: false, tenantId: 't-kunde-a', ...overrides }
}

describe('yieldsToForeignVisiblePresence — wann weicht ein away-Schreiber?', () => {
  it('keine bestehende Presence → schreiben (es gibt nichts zu schützen)', () => {
    expect(yieldsToForeignVisiblePresence(null, 't-kunde-b', NOW)).toBe(false)
  })

  it('DER KERNFALL: fremder Mandant, sichtbar, frisch → weichen', () => {
    expect(yieldsToForeignVisiblePresence(visible(), 't-kunde-b', NOW)).toBe(true)
  })

  it('Gegenprobe zum Kernfall: bestehende Presence ist selbst away → Letzter gewinnt', () => {
    // Bewusst so: away über away zu blockieren hieße im Grenzfall, dass niemand
    // mehr die Expiry verlängert und die Presence stirbt. Beide Seiten zeigen
    // ohnehin denselben away-Badge.
    expect(yieldsToForeignVisiblePresence(visible({ away: true }), 't-kunde-b', NOW)).toBe(false)
  })

  it('Gegenprobe zum Kernfall: GLEICHER Mandant → Letzter gewinnt', () => {
    // Hier gibt es das Problem gar nicht (derselbe Stempel), und ein einzelner
    // Tab muss seine eigene away-Meldung durchbekommen: seine letzte non-away-
    // Presence trägt genau diesen Mandanten.
    expect(yieldsToForeignVisiblePresence(visible(), 't-kunde-a', NOW)).toBe(false)
  })

  it('Gegenprobe zum Kernfall: veraltet (>= 60 s) → übernehmen', () => {
    // Der sichtbare Tab ist abgestürzt (drei verpasste 20-s-Heartbeats). Der
    // away-Tab hält den User damit wenigstens in SEINER Community sichtbar.
    expect(yieldsToForeignVisiblePresence(
      visible({ updatedAt: ago(PRESENCE_VISIBLE_FRESH_MS + 1_000) }), 't-kunde-b', NOW,
    )).toBe(false)
  })

  it('genau auf der 60-s-Grenze zählt als veraltet (>= ist stale)', () => {
    expect(yieldsToForeignVisiblePresence(
      visible({ updatedAt: ago(PRESENCE_VISIBLE_FRESH_MS) }), 't-kunde-b', NOW,
    )).toBe(false)
    // eine Millisekunde jünger ⇒ frisch, also Vorrang
    expect(yieldsToForeignVisiblePresence(
      visible({ updatedAt: ago(PRESENCE_VISIBLE_FRESH_MS - 1) }), 't-kunde-b', NOW,
    )).toBe(true)
  })

  it('ohne updatedAt ist „frisch" nicht entscheidbar → Alt-Verhalten', () => {
    expect(yieldsToForeignVisiblePresence(visible({ updatedAt: undefined }), 't-kunde-b', NOW)).toBe(false)
    expect(yieldsToForeignVisiblePresence(visible({ updatedAt: '' }), 't-kunde-b', NOW)).toBe(false)
  })

  it('unlesbarer Zeitstempel → Alt-Verhalten (nie „frisch" raten)', () => {
    expect(yieldsToForeignVisiblePresence(visible({ updatedAt: 'irgendwas' }), 't-kunde-b', NOW)).toBe(false)
  })
})

describe('tenantlose Hosts (Kontroll-Host / Silo) — die \'\'-Normalisierung', () => {
  it('tenantloser Schreiber gegen frische sichtbare Mandanten-Presence → weichen', () => {
    expect(yieldsToForeignVisiblePresence(visible(), '', NOW)).toBe(true)
  })

  it('Mandanten-Schreiber gegen frische sichtbare tenantlose Presence → weichen', () => {
    expect(yieldsToForeignVisiblePresence(visible({ tenantId: '' }), 't-kunde-a', NOW)).toBe(true)
  })

  it('Gegenprobe: BEIDE tenantlos ist derselbe „Mandant" → Letzter gewinnt', () => {
    expect(yieldsToForeignVisiblePresence(visible({ tenantId: '' }), '', NOW)).toBe(false)
  })

  it('Gegenprobe: tenantlos + veraltet → übernehmen', () => {
    expect(yieldsToForeignVisiblePresence(
      visible({ updatedAt: ago(120_000) }), '', NOW,
    )).toBe(false)
  })
})

describe('Konstanten-Kette', () => {
  it('Vorrang-Fenster < Frische-Fenster des Lesers (180 s) < Expiry (240 s)', () => {
    // Nagelt die Reihenfolge fest: der Vorrang muss enden, BEVOR ein Leser die
    // Presence als veraltet ausblendet — sonst hielte ein toter sichtbarer Tab
    // den away-Tab aus einer Anzeige heraus, in der er längst allein steht.
    expect(PRESENCE_VISIBLE_FRESH_MS).toBe(60_000)
    // PRESENCE_FRESH_MS ist die ECHTE Konstante des server-seitigen Lesers
    // (presenceFilter.ts); der Client spiegelt sie als FRESH_MS, die Expiry
    // liegt mit 240 s darüber (heartbeat.post.ts).
    expect(PRESENCE_VISIBLE_FRESH_MS).toBeLessThan(PRESENCE_FRESH_MS)
  })
})
