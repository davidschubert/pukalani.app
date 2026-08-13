import type { H3Event } from 'h3'
import type { Models } from 'node-appwrite'
import {
  COMMUNITY_NAVIGATION_TABLE,
  type CommunityNavOverride,
  parseCommunityNavOverride,
} from '../../../core/shared/communityNavigation'

/**
 * DIE ABLAGE DES COMMUNITY-MENÜS (U15 Teil 1) — lesen, schreiben, vergessen.
 *
 * ── WARUM ADMIN-CLIENT UND NICHT `tenantDb()` ─────────────────────────────
 * Wort für Wort die Begründung von `core/server/utils/communityBrandingMirror.ts`,
 * weil es Wort für Wort dieselbe Form ist: das hier ist keine Nutzerzeile eines
 * Mandanten, sondern eine INFRASTRUKTUR-Zeile ÜBER einen Mandanten — ihre rowId
 * IST die Community. Die Datentür wäre dafür das falsche Werkzeug, und zwar
 * dreifach:
 *
 *  1. `create` stempelte eine `communityId`-Spalte, die es hier nicht gibt und
 *     nicht geben soll (die rowId sagt dasselbe, nur fälschungssicher).
 *  2. `create` legte Row-Permissions auf eine Tabelle, die BEWUSST table-weit
 *     `read(any)` trägt (system-033) — zwei Rechtequellen für eine Zeile.
 *  3. Die Türklinke 'member' löste über `actorJoinsByWriting` einen
 *     A5-Beitritt aus. Ein Owner, der sein Menü sortiert, tritt nichts bei.
 *
 * Die MANDANTEN-GRENZE geht dadurch nicht verloren, sie liegt nur woanders:
 * die `communityId` kommt in beiden Richtungen aus `useTenant(event)`, also aus
 * der Host-Auflösung des Servers — NIE aus dem Aufrufer. Eine fremde Community
 * ist damit nicht adressierbar, und zwar unabhängig davon, was im Body steht.
 *
 * Die ESLint-Regel gegen rohes `.tablesDB` zielt auf `server/api/**` und
 * `server/plugins/**` (Request-Routen); diese Datei liegt bewusst in
 * `server/utils/**` — dieselbe Stelle wie der Branding-Spiegel.
 *
 * ── KEIN `upsertRow` ──────────────────────────────────────────────────────
 * UPDATE, bei 404 CREATE. Appwrite 1.9.6 schreibt bei `upsertRow` korrekt,
 * PUBLIZIERT dafür aber KEIN Realtime-Event (live erwischt am 2026-08-01, D6).
 * Heute liest nur der Server, das Menü käme also auch mit `upsertRow` an — aber
 * die Tabelle ist `read(any)` gebaut, damit ein Browser sie später abonnieren
 * KANN, und ein `upsertRow` an dieser Stelle machte diese Möglichkeit still
 * zunichte. Zwei Aufrufe statt einem sind der Preis dafür, dass die Tür offen
 * bleibt.
 */

const TTL_MS = 30_000

/**
 * Microcache des Menüs.
 *
 * USER-AGNOSTISCH, und das ist die Bedingung (CLAUDE.md „Microcache"): das Menü
 * ist für jeden Besucher dasselbe — Anmeldung, Rolle und Tarif filtern es ERST
 * im Layout, aus Daten, die nie durch diesen Cache gehen. Hier liegt
 * ausschliesslich die gespeicherte Wahl des Owners.
 *
 * SCHLÜSSEL = MANDANT (`tenantCacheScope`). Pflicht: im Pool teilen sich alle
 * Communities einen Prozess, ein ungescopter Schlüssel gäbe Kunde A das Menü
 * von Kunde B — genau die Falle, die `publicPagesCache` daneben beschreibt.
 *
 * `null` WIRD MITGECACHT, und das ist der wichtigere Teil: die allermeisten
 * Communities haben keine Row. Ohne negatives Caching kostete JEDER
 * Seitenaufbau jeder Community einen Appwrite-404.
 */
const cache = createMicrocache<CommunityNavOverride | null>(TTL_MS)

function isRowNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 404
}

/**
 * Die gespeicherte Wahl dieser Community — oder `null` („keine eigene Wahl").
 *
 * FAIL-SOFT, und zwar absichtlich bis zur letzten Zeile: fehlende Tabelle
 * (Instanz ohne system-033), fehlende Row, kaputtes JSON, Appwrite gerade nicht
 * erreichbar — alles endet in `null`, und `null` heisst „Menü wie vor U15".
 * Ein Fehler hier nähme einer Community ihren gesamten Seitenkopf, für eine
 * Bequemlichkeit. Geloggt wird trotzdem, sonst wäre ein dauerhaft kaputter
 * Lesepfad unsichtbar.
 */
export async function readCommunityNavOverride(
  event: H3Event,
  communityId: string,
): Promise<CommunityNavOverride | null> {
  if (!communityId) return null
  const key = tenantCacheScope(event)
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  let override: CommunityNavOverride | null = null
  try {
    const config = useRuntimeConfig(event)
    const admin = createAdminClient(event)
    const row = await admin.tablesDB.getRow<Models.Row & { config?: string }>({
      databaseId: config.public.appwriteDatabaseId,
      tableId: COMMUNITY_NAVIGATION_TABLE,
      rowId: communityId,
    })
    override = parseCommunityNavOverride(row.config)
  }
  catch (error) {
    // `override` bleibt `null` — das ist die Antwort in JEDEM Fehlerfall
    // (s. Kopf). Keine Row ist dabei der NORMALFALL und kein Zwischenfall;
    // nur alles andere ist eine Meldung wert.
    if (!isRowNotFound(error)) {
      logEvent('warn', 'community.navigation_read_failed', {
        communityId,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  cache.set(key, override)
  return override
}

/**
 * Die Wahl dieser Community speichern.
 *
 * NICHT fail-soft (anders als das Lesen): wer auf „Speichern" klickt, muss
 * erfahren, wenn nichts gespeichert wurde. Der Aufrufer ist die Owner-Route,
 * die den Fehler in ein 500 übersetzt.
 */
export async function writeCommunityNavOverride(
  event: H3Event,
  communityId: string,
  override: CommunityNavOverride,
): Promise<void> {
  const config = useRuntimeConfig(event)
  const admin = createAdminClient(event)
  const target = {
    databaseId: config.public.appwriteDatabaseId,
    tableId: COMMUNITY_NAVIGATION_TABLE,
    rowId: communityId,
  }
  const data = { config: JSON.stringify(override) }
  try {
    await admin.tablesDB.updateRow({ ...target, data })
  }
  catch (error) {
    // 404 = erstes Menü dieser Community, die Zeile gibt es noch nicht.
    if (!isRowNotFound(error)) throw error
    await admin.tablesDB.createRow({ ...target, data })
  }
  forgetCommunityNavOverride(event)
}

/**
 * Nach dem Speichern: der neue Stand ist sofort sichtbar, ohne 30 Sekunden auf
 * die Ablaufzeit zu warten. Die TTL bleibt als Netz für Schreibwege, die nicht
 * durch diese Route gehen (Konsole, Nachrüst-Skripte) — und `delete` statt
 * `clear`, damit nicht die Einträge aller anderen Mandanten mitgehen.
 */
export function forgetCommunityNavOverride(event: H3Event): void {
  cache.delete(tenantCacheScope(event))
}
