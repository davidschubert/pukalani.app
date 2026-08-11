import { legacyControlRedirect } from '../../../../packages/core/shared/legacyControlHosts'
import { resolveControlHosts } from '../../../../packages/core/shared/controlCenter'

/**
 * AH-4 — die 301 des abgeschalteten Betreiber-Host-Namens (`control.`) auf den
 * heutigen (`admin.`). Davids Namensentscheidung vom 2026-08-11.
 *
 * Die REGEL ist dieselbe wie beim Kundenbereich-Cutover (AH-1): Ziel aus der
 * Config statt aus dem Request, Pfad und Query unverändert, Schleifen-Sperre.
 * Sie steht deshalb auch nur EINMAL im Repo — `core/shared/legacyControlHosts.ts`
 * wird hier bloß mit anderen Hosts gefüttert. Eine zweite Kopie hätte genau
 * einen Effekt: dass der nächste Fehler nur in einer der beiden behoben wird.
 *
 * WARUM DIESE APP EINE EIGENE MIDDLEWARE HAT UND NICHT
 * `pukalani.tenancy.legacyControlHosts` SETZT
 * -------------------------------------------------------------------------
 * Die core-Middleware `00.legacy-control-hosts.ts` nimmt ihr Ziel aus
 * `pukalani.tenancy.controlHosts[0]`. Diese Liste hier zu füllen wäre der
 * kürzere Weg gewesen und hätte drei Dinge kaputtgemacht, die alle NICHTS mit
 * Weiterleitungen zu tun haben — `controlHosts` ist in mehreren Konsumenten
 * die Antwort auf die Frage „läuft diese Seite im KUNDENBEREICH?", und die
 * Betreiber-Konsole hätte ab dem Cutover mit Ja geantwortet:
 *
 *  1. `DashboardUserMenu.vue` (packages/admin, von DIESER App geerbt) schickt
 *     das Konto-Menü dann auf `/profile` und `/settings` statt auf
 *     `/dashboard/settings`. Diese Seiten gehören dem onboarding-Layer, und
 *     den erbt apps/control bewusst NICHT — das Menü zeigte also auf zwei
 *     Adressen, die es hier nicht gibt. Der Kommentar an der Stelle sagt
 *     ausdrücklich, die Betreiber-Konsole sehe keinen Unterschied, „weil ohne
 *     konfigurierte Kontroll-Hosts immer false" — das Setzen der Liste ist
 *     genau die Annahme, auf der er steht.
 *  2. `NotificationBell.global.vue` (core) rechnet ihr Publikum aus
 *     `notificationAudienceFor(tenantId, isControlCenter)`. Der CLIENT käme
 *     damit auf `{kind:'account'}`, die SERVER-Leseroute weiterhin auf
 *     `{kind:'all'}` — denn die liest `event.context.controlCenter`, und das
 *     setzt `00.tenant.ts` nur bei aktivem Tenancy-Gate, das hier aus ist.
 *     Ergebnis wäre exakt der Fehler, vor dem notificationScope.ts warnt: eine
 *     Glocke, die live etwas einblendet, das der nächste Reload wegnimmt. Und
 *     sie hängt hier scharf (`chrome.accountBell: true`, C17).
 *  3. `RegisterForm.vue` + `OtpLoginForm.vue` (core) feuern dann
 *     `funnel_register_done` — der Betreiber-Login schriebe sich in den
 *     Kunden-Trichter (U18).
 *
 * Nichts davon würde rot; man sähe es erst an falschen Zahlen und toten
 * Menüpunkten in Produktion. Die zwei Fragen „welcher Name ist alt?" und „ist
 * das der Kundenbereich?" gehören also getrennt beantwortet, und dieser
 * Host beantwortet die zweite mit Nein.
 *
 * WARUM DIE DATEI SO HEISST: sie muss vor `docs-guard.ts` laufen, sonst
 * schickt der Türsteher einen Aufruf von `control.pukalani.app/docs` erst zum
 * Login, statt ihn weiterzuleiten. Innerhalb EINES middleware-Verzeichnisses
 * sortiert Nitro nach Dateinamen (`00.` < `docs-`), das ist nachprüfbar; über
 * Layer-Grenzen hinweg hinge die Reihenfolge an der Scan-Reihenfolge des
 * Frameworks. Deshalb liegt sie neben dem Guard und nicht in einem Layer.
 *
 * KEIN eigenes An/Aus: die Liste IST das Gate. Steht kein Altname da, ist der
 * Handler nach zwei Zeilen fertig.
 */
export default defineEventHandler((event) => {
  const appConfig = useAppConfig() as {
    pukalani?: { adminConsole?: { canonicalHost?: string, legacyHosts?: string[] } }
  }
  const publicConfig = useRuntimeConfig(event).public as {
    controlCanonicalHost?: string
    controlLegacyHosts?: string
  }

  const legacyHosts = resolveControlHosts(
    publicConfig.controlLegacyHosts,
    appConfig.pukalani?.adminConsole?.legacyHosts,
  )
  if (!legacyHosts.length) return

  // Laufzeit (Env) vor Build (app.config) — dieselbe Rangfolge wie überall
  // sonst bei Hostnamen, damit eine Umgebung ohne Deploy umgehängt werden kann.
  const canonical = resolveControlHosts(
    publicConfig.controlCanonicalHost,
    appConfig.pukalani?.adminConsole?.canonicalHost
      ? [appConfig.pukalani.adminConsole.canonicalHost]
      : [],
  )

  const target = legacyControlRedirect(
    getHeader(event, 'host'),
    event.path,
    legacyHosts,
    canonical[0] ?? '',
  )
  if (!target) return

  // 301 für ALLES, auch für `/api/**`. Ein Dienst, der hierher zeigt, gehört
  // umgehängt statt weitergeleitet — der Stripe-Webhook zum Beispiel folgt
  // KEINER Weiterleitung (Runbook ADMIN-CUTOVER.md, Schritt „Webhook").
  // Eine Ausnahme für `/api/**` würde das nur verdecken: der Aufruf käme
  // durch, die falsche Adresse bliebe stehen und niemand merkte es.
  return sendRedirect(event, target, 301)
})
