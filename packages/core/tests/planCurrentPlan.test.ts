import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * „AKTUELLER PLAN" HEISST: DAFÜR ZAHLST DU.
 *
 * Die Plan-Seite blendet den Kauf-Knopf aus, wenn ein Plan der „aktuelle" ist.
 * Solange das nur den PLAN-SCHLÜSSEL verglich, galt die Pro-Testphase als
 * gekauftes Pro — denn eine Testphase setzt `plan: 'pro'`. Folge: Wer in der
 * Testphase auf Pro bleiben wollte (der wahrscheinlichste Kauf überhaupt),
 * fand auf der Pro-Karte keinen Knopf, sondern das Etikett „Aktueller Plan".
 * Kaufbar war nur Personal — eine Herabstufung. Nach Ablauf der Testphase wird
 * die Community nur-lesend (M13), der Weg führte also ins Warten oder in den
 * falschen Plan. Gefunden beim Durchspielen der Kundenreise (2026-08-15).
 *
 * Die Unterscheidung „zahlt diese Community?" kann `plan` nicht leisten; dafür
 * gibt es `billingStatus` (U4) — es war nur nie gelesen worden. Dieser Test
 * hält fest, dass die Seite es liest, denn der Rückbau auf den reinen
 * Schlüsselvergleich sieht harmlos aus und ist es nicht.
 *
 * Geprüft wird die QUELLE: die Regel ist eine Zeile in einer Vue-Komponente,
 * und ein Laufzeit-Test müsste dafür Nuxt, i18n und den Mandanten-Kontext
 * hochfahren. Der Fehler, um den es geht, ist ein WEGLASSEN — und das ist an
 * der Quelle genauso gut zu sehen.
 */
const quelle = readFileSync(
  new URL('../../onboarding/app/pages/dashboard/community/plan.vue', import.meta.url),
  'utf8',
)

describe('Plan-Seite: „aktueller Plan"', () => {
  it('fragt nach dem Abo, nicht nur nach dem Plan-Schlüssel', () => {
    const zeile = quelle.split('\n').find(l => l.includes('const isCurrent'))
    expect(zeile, 'isCurrent nicht gefunden').toBeTruthy()
    expect(
      zeile,
      'isCurrent vergleicht nur den Plan-Schlüssel — die Testphase gilt dann als gekaufter Plan',
    ).toContain('hasSubscription')
  })

  it('zählt `past_due` als bestehendes Abo', () => {
    // Ein überfälliges Abo ist ein Abo: dort ist die Antwort das Stripe-Portal,
    // nicht ein zweiter Kauf desselben Plans.
    const zeile = quelle.split('\n').find(l => l.includes('const hasSubscription'))
    expect(zeile, 'hasSubscription nicht gefunden').toBeTruthy()
    expect(zeile).toContain('active')
    expect(zeile).toContain('past_due')
  })

  it('holt den Zahlungs-Zustand von der gegateten Route', () => {
    // `billingStatus` steht bewusst NICHT im SSR-Payload (es verriete jedem
    // Gast den Vertragszustand) — es kommt über dieselbe capability-gegatete
    // Route wie `trialEndsAt`.
    expect(quelle).toContain('/api/community/billing/trial')
    expect(quelle).toContain('billingStatus')

    const route = readFileSync(
      new URL('../../onboarding/server/api/community/billing/trial.get.ts', import.meta.url),
      'utf8',
    )
    expect(route).toContain('billingStatus')
    expect(route, 'die Route muss weiterhin capability-gegated sein').toContain('community.billing')
  })
})
