import { trialDaysLeft } from '../../../control/shared/onboarding'
import type { DashboardStatValue } from '../../../core/shared/types/dashboard-stat'
import { hasActiveCommunitySubscription } from '../../shared/gettingStarted'
import { resolveCommunityTeamSnapshot } from '../utils/communityTeamSnapshot'

/**
 * Die zwei Kennzahlen, die der COMMUNITY selbst gehören (U9/K2, 2026-08-11) —
 * wie viele Menschen sind hier, und woran ist sie vertraglich?
 *
 * Beide leben im onboarding-Layer, weil hier die Service-Naht zum Control
 * Plane liegt (A14). Der admin-Layer, dem die Übersichtsseite gehört, könnte
 * keine der beiden beantworten.
 *
 * MITGLIEDER kosten den einen Ruf, den die Willkommens-Checkliste ohnehin macht
 * (`resolveCommunityTeamSnapshot`, 30 s gecacht) — die Karte und die Kachel
 * stehen auf derselben Seite, also zahlt nur die erste von beiden. `null` =
 * keine Auskunft ⇒ keine Kachel: lieber keine Zahl als eine erfundene 0. Der
 * Owner zählt mit, die Zahl ist deshalb nie 0 — der Leerzustand liegt bei 1
 * („du bist allein hier"), und genau dort setzt `emptyBelow: 2` in der
 * Deklaration an.
 *
 * DER PLAN kostet GAR NICHTS: `plan`, `trialEndsAt` und `billingStatus` stehen
 * im Mandanten-Kontext, den der Resolver ohnehin für jeden Request auflöst
 * (30-s-Cache). Sie sind BEWUSST nicht im SSR-Payload gespiegelt
 * (core/shared/types/tenant.ts) — deshalb kann diese Kachel ihre Antwort nicht
 * im Browser ausrechnen, und deshalb steht sie hier.
 *
 * WARUM DIE KACHEL EINEN TEXT-SCHLÜSSEL LIEFERT statt einer Zahl: „Pro" ist
 * die Antwort auf die Frage nach dem Plan, und sie ist keine Zahl. Der
 * Schlüssel gehört diesem Layer (er liefert auch die Übersetzung); die
 * Übersicht rendert ihn, ohne den Layer zu kennen — dasselbe Verhältnis wie
 * beim `labelKey` der Deklaration.
 *
 * NUR BEKANNTE PLÄNE BEKOMMEN IHREN NAMEN. `basic` ist seit F49 kein Angebot
 * mehr, sondern der Zustand OHNE Abo, und hat folgerichtig keinen Katalog-
 * Eintrag. Ein aus dem Plan-Schlüssel zusammengebauter i18n-Key stünde für ihn
 * roh auf der Seite (`onboarding.subscription.plans.basic.name`) — vue-i18n
 * gibt bei fehlender Übersetzung den SCHLÜSSEL aus. Deshalb eine
 * ERLAUBNISLISTE statt eines Template-Literals: was nicht drinsteht, heißt
 * „Kein Abo".
 *
 * DIE TESTPHASE WIEDERHOLT DIE HINWEIS-KARTE NICHT: `CommunityTrialNotice`
 * meldet sich erst, wenn es eng wird (`trialNotice`, letzte Tage + Nachfrist).
 * Die Kachel sagt dagegen den ganzen Zeitraum über ruhig, woran man ist —
 * dieselbe Tatsache, aber als Zustand statt als Warnung.
 */

/** Pläne mit Namen im Katalog (F49: `basic` ist kein Angebot und hat keinen). */
const PLAN_NAME_KEYS: Record<string, string> = {
  personal: 'onboarding.subscription.plans.personal.name',
  pro: 'onboarding.subscription.plans.pro.name',
}

export default defineNitroPlugin(() => {
  registerDashboardStatValueProvider({
    id: 'onboarding',
    async collect(event, ids): Promise<Record<string, DashboardStatValue>> {
      const tenant = useTenant(event)
      // Kein Pool-Mandant (Silo, Kontroll-Host, Playground) ⇒ es gibt hier
      // weder Team im Control Plane noch Abo. Beide Kacheln entfallen.
      if (tenant?.mode !== 'pool' || !tenant.communityId) return {}

      const out: Record<string, DashboardStatValue> = {}

      if (ids.has('members')) {
        const snapshot = await resolveCommunityTeamSnapshot(event, tenant.communityId)
        if (snapshot) out.members = { value: snapshot.members }
      }

      if (ids.has('plan')) {
        const planKey = PLAN_NAME_KEYS[tenant.plan ?? '']
        const daysLeft = tenant.trialEndsAt ? trialDaysLeft(tenant.trialEndsAt, Date.now()) : 0
        const inTrial = !hasActiveCommunitySubscription(tenant.billingStatus) && daysLeft > 0
        out.plan = {
          value: null,
          textKey: planKey && (inTrial || hasActiveCommunitySubscription(tenant.billingStatus))
            ? planKey
            : 'onboarding.stats.planNone',
          ...(inTrial ? { hintKey: 'onboarding.communities.trialEnding', hintCount: daysLeft } : {}),
        }
      }

      return out
    },
  })
})
