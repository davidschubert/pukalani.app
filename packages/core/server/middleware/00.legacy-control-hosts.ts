/**
 * AH-1 — die 301 der abgeschalteten Kontroll-Host-Namen (`my.`/`start.`) auf
 * den heutigen (`account.`). Regel + Begründung: shared/legacyControlHosts.ts.
 *
 * WARUM DIESE DATEI HIER LIEGT UND NICHT IN DER PLATFORM-APP: sie muss VOR
 * `00.tenant.ts` laufen, denn dort bekommt jeder unbekannte Host sein 404 —
 * und `my.`/`start.` sind nach dem Cutover unbekannt. Innerhalb EINES
 * middleware-Verzeichnisses sortiert Nitro nach Dateinamen (`legacy` < `tenant`),
 * das ist nachprüfbar; über Layer-Grenzen hinweg hängt die Reihenfolge an der
 * Scan-Reihenfolge der Verzeichnisse, also an einer Eigenschaft des Frameworks
 * statt an einer des Repos. Eine Weiterleitung, die je nach Layer-Auflösung
 * greift oder nicht, wäre genau die Art Fehler, die erst in Produktion auffällt.
 *
 * KEIN eigenes Config-Gate: die Liste IST das Gate. `legacyControlHosts` ist
 * Core-Default leer, damit ist diese Middleware in jeder anderen App (comments,
 * control, help, marketing, portfolio, Playground) ein sofortiger No-Op.
 */
import { resolveControlHosts } from '../../shared/controlCenter'
import { legacyControlRedirect } from '../../shared/legacyControlHosts'

export default defineEventHandler((event) => {
  const appConfig = useAppConfig() as {
    pukalani?: { tenancy?: { controlHosts?: string[], legacyControlHosts?: string[] } }
  }
  const publicTenancy = (useRuntimeConfig(event).public as {
    tenancy?: { controlHosts?: string, legacyControlHosts?: string }
  }).tenancy

  const legacyHosts = resolveControlHosts(
    publicTenancy?.legacyControlHosts,
    appConfig.pukalani?.tenancy?.legacyControlHosts,
  )
  if (!legacyHosts.length) return

  // Das Ziel ist der KANONISCHE Kontroll-Host (erster Eintrag) — dieselbe
  // „erster Eintrag gewinnt"-Regel wie bei den Ausgängen des Switchers.
  const controlHosts = resolveControlHosts(
    publicTenancy?.controlHosts,
    appConfig.pukalani?.tenancy?.controlHosts,
  )

  const target = legacyControlRedirect(
    getHeader(event, 'host'),
    event.path,
    legacyHosts,
    controlHosts[0] ?? '',
  )
  if (!target) return

  return sendRedirect(event, target, 301)
})
