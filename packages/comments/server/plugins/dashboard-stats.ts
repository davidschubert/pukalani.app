import { decideCommunityAccess } from '../../../core/shared/communityAccess'
import type { DashboardStatValue } from '../../../core/shared/types/dashboard-stat'

/**
 * Kennzahl des comments-Layers für die Übersicht (U9/K2, 2026-08-11).
 *
 * NUR NOCH EINE ZAHL: die GESAMTZAHL der Kommentare kommt seit U9 aus dem
 * Verbrauchs-Vertrag, den dieser Layer ohnehin bedient
 * (`registerCommunityUsageCounter({ kind: 'comments' })`, Nachbardatei) — der
 * generische Zähler in core erhebt sie mandantendicht und mit demselben
 * Kontingent wie der Speicher-Reiter. Zwei Stellen, die dieselbe Tabelle
 * zählen, wären zwei Stellen, die auseinanderlaufen können.
 *
 * ÜBRIG BLEIBT, WAS NIEMAND SONST WEISS: offene Meldungen sind kein
 * Zeilen-Zähler, sondern eine Frage an den moderation-Vertrag
 * (`openReportsByTarget`). Der `targetType 'comment'` ist Konsumenten-Wissen
 * und gehört deshalb HIERHER, nicht in den target-agnostischen
 * moderation-Layer.
 *
 * DIE ZWEITE SPERRE (C1) steht bewusst noch einmal hier: offene Meldungen sind
 * Moderations-Wissen, kein Gemeingut der Community — ein `viewer` oder
 * `editor` soll nicht ablesen können, wie viel gerade in der Warteschlange
 * liegt. Die Route filtert die Kachel schon anhand ihrer
 * `requiredCapability`; ein falsch deklariertes Gate in einer Registry trägt
 * aber weit, und diese Zahl ist es wert, zweimal geprüft zu werden.
 *
 * WARUM NICHT `requireCommunityPermission`: die Funktion schreibt bei einem
 * Betreiber-Zugriff eine Break-Glass-Zeile ins Protokoll (das ist ihr Zweck).
 * Ein Provider, der sie ein zweites Mal ruft, protokolliert denselben Zugriff
 * doppelt. Die pure Entscheidung beantwortet dieselbe Frage ohne Nebenwirkung
 * — es ist wörtlich die Prüfung, die bis U9 in der Route stand.
 */
export default defineNitroPlugin(() => {
  registerDashboardStatValueProvider({
    id: 'comments',
    async collect(event, ids): Promise<Record<string, DashboardStatValue>> {
      if (!ids.has('commentsReported')) return {}

      const user = event.context.user
      const allowed = decideCommunityAccess({
        capability: 'comments.moderate',
        labels: user?.labels ?? [],
        tenantScoped: Boolean(useTenant(event)),
        role: await resolveCommunityRole(event),
      }).allowed
      if (!allowed) return {}

      // Ohne moderation-Layer/reports-Tabelle gibt es die Zahl nicht — die
      // Kachel entfällt dann, statt eine 0 zu behaupten.
      const reported = await openReportsByTarget(event, 'comment')
      return { commentsReported: { value: reported.order.length } }
    },
  })
})
