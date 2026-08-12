import { Query } from 'node-appwrite'
import type { DashboardStatValue } from '../../../core/shared/types/dashboard-stat'

/**
 * Die Nutzerzahl der INSTANZ — die einzige Kachel, die dem admin-Layer selbst
 * gehört (U9/K2, 2026-08-11).
 *
 * ZWEI SPERREN, ZWEI GRÜNDE, und beide braucht es:
 *
 *  1. Die Kachel trägt `scope: 'operator'` (app.config) — auf einem
 *     Mandanten-Host steht sie deshalb gar nicht erst da. Das ist die
 *     SICHT-Regel, dieselbe wie bei jedem Betreiber-Menüpunkt.
 *  2. Hier wird zusätzlich der POOL ausgeschlossen (Befund B2): `users.list()`
 *     zählt alle Konten des geteilten Appwrite-PROJEKTS. Im Pool ist das die
 *     Summe aller Communities, nicht „Nutzer dieser Site". Mandantengenau wäre
 *     nur ein Count über `community_members` im Control Plane — ein neuer
 *     Cross-Projekt-Vertrag, den eine Übersichtszahl nicht rechtfertigt.
 *
 * Die zweite Sperre ist nicht überflüssig geworden, als die erste kam: der
 * Kontroll-Host des Pools (`account.pukalani.app`) ist KEIN Mandanten-Host,
 * die Kachel wäre dort nach Regel 1 sichtbar — und die Zahl wäre die des
 * ganzen Pools. Lieber keine Zahl als eine fremde.
 *
 * `Query.limit(1)` — gelesen wird nur das `total`, nie eine Liste.
 */
export default defineNitroPlugin(() => {
  registerDashboardStatValueProvider({
    id: 'admin',
    async collect(event, ids): Promise<Record<string, DashboardStatValue>> {
      if (!ids.has('users')) return {}
      if (useTenant(event)?.mode === 'pool') return {}

      const users = await createAdminClient(event).users.list({ queries: [Query.limit(1)] })
      return { users: { value: users.total } }
    },
  })
})
