import type { H3Event } from 'h3'
import { InputFile } from 'node-appwrite/file'
import { COMMUNITY_FAVICON_BUCKET } from '../../shared/communityFavicon'

/**
 * DIE ABLAGE DES COMMUNITY-FAVICONS (Community-Favicon-Upload) — lesen,
 * schreiben, entfernen, vergessen. Vorlage ist `communitySeoStore.ts` (U15),
 * nur Storage statt TablesDB.
 *
 * ── WARUM DIESE DATEI IN core LIEGT ────────────────────────────────────────
 * Genau wie beim Sucheintrag: der LESER ist der Kern-nahe Auslieferungspfad
 * (`/icon/<key>.png` in apps/platform), der SCHREIBER die Owner-Route im
 * onboarding-Layer. Beide dürfen nach core greifen, keiner muss den anderen
 * kennen (A14). Core besitzt die Ablage, nicht die Bedienung — die Route
 * `POST /api/community/branding/favicon` und die Dashboard-Karte leben draußen.
 *
 * ── ES LIEST NIEMAND, ES WIRD GELESEN ──────────────────────────────────────
 * Der Bucket `favicons` (system-037) trägt KEIN Client-Recht (`permissions:
 * []`, `fileSecurity: false`). Kein Besucher, kein Mitglied, kein Owner kommt an
 * die Datei — der SERVER liest sie beim Ausliefern und schneidet/skaliert sie
 * in der Route. Beide Zugriffe hier laufen deshalb mit dem ADMIN-Client, in der
 * Haltung, die die Datentür `as: 'operator', actor: 'operator'` nennt: es
 * handelt kein Mensch, es arbeitet das System (keine M13-Sperre — ein Favicon
 * ist kein Inhalt; kein A5-Beitritt — der Owner tritt nichts bei).
 *
 * ── WARUM NICHT DURCH `tenantDb()` ─────────────────────────────────────────
 * Wortgleich die Begründung aus `communitySeoStore.ts`: die Tür würde eine
 * `communityId` prüfen, die es hier gar nicht gibt — die fileId IST die
 * Community. Die Mandanten-Grenze geht dadurch nicht verloren: `communityId`
 * kommt aus `useTenant(event)` (Host-Auflösung des Servers), NIE vom Aufrufer.
 * Eine fremde Community ist nicht adressierbar, egal was im Body steht. Die
 * ESLint-Regel gegen rohes `.tablesDB`/Storage zielt auf `server/api/**` und
 * `server/plugins/**`; diese Datei liegt bewusst in `server/utils/**`.
 *
 * ── EXISTENZ + `$updatedAt` ERSETZEN JEDE REFERENZ-SPALTE ──────────────────
 * `readCommunityFavicon` gibt `{ updatedAt }` zurück, wenn die Datei existiert,
 * sonst `null`. `$updatedAt` ist zugleich der Cache-Brecher für die immutable
 * Icon-URL (`uploadedBrandIconKey`): ein neuer Upload bekommt einen neuen
 * Zeitstempel, also eine neue URL. Deshalb braucht es weder eine Spalte in
 * `communities` noch einen Spiegel — die Wahrheit ist die Datei selbst.
 */

const TTL_MS = 30_000

/**
 * Microcache der Datei-Existenz + `$updatedAt`.
 *
 * USER-AGNOSTISCH: der Wert landet in einer Icon-URL, die für jeden Besucher
 * dieselbe ist. SCHLÜSSEL = MANDANT (`tenantCacheScope`), Pflicht im Pool —
 * ohne Scope bekäme Kunde A das Favicon von Kunde B.
 *
 * `null` WIRD MITGECACHT, und das ist der wichtigere Teil: die allermeisten
 * Communities haben KEIN eigenes Favicon. Ohne negatives Caching kostete jeder
 * Icon-Abruf jeder Community einen Appwrite-404.
 */
const cache = createMicrocache<{ updatedAt: string } | null>(TTL_MS)

function isFileNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 404
}

/**
 * Das hochgeladene Favicon dieser Community — oder `null` („keins").
 *
 * FAIL-SOFT bis zur letzten Zeile: fehlender Bucket (Instanz ohne system-037),
 * fehlende Datei, Appwrite gerade nicht erreichbar — alles endet in `null`, und
 * `null` heißt „das generierte Icon gilt". Ein Fehler hier nähme einer Community
 * ihr gesamtes App-Icon, für eine Bequemlichkeit; das generierte Favicon ist
 * der immer verfügbare Rückfall.
 */
export async function readCommunityFavicon(
  event: H3Event,
  communityId: string,
): Promise<{ updatedAt: string } | null> {
  if (!communityId) return null
  const key = tenantCacheScope(event)
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  let result: { updatedAt: string } | null = null
  try {
    const admin = createAdminClient(event)
    const file = await admin.storage.getFile({
      bucketId: COMMUNITY_FAVICON_BUCKET,
      fileId: communityId,
    })
    result = { updatedAt: file.$updatedAt }
  }
  catch (error) {
    // `result` bleibt `null` — das ist die Antwort in JEDEM Fehlerfall (s. Kopf).
    // Keine Datei ist dabei der NORMALFALL und kein Zwischenfall; nur alles
    // andere ist eine Meldung wert.
    if (!isFileNotFound(error)) {
      logEvent('warn', 'community.favicon_read_failed', {
        communityId,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  cache.set(key, result)
  return result
}

/**
 * Das Favicon dieser Community schreiben — den bisherigen Inhalt ersetzend.
 *
 * ERSETZEN = `deleteFile` (404 tolerieren) → `createFile` mit derselben Id:
 * Appwrite kann den Datei-INHALT nicht aktualisieren, nur die Datei ersetzen.
 * Es gibt keinen Realtime-Konsumenten, also auch kein upsert-Problem (D6).
 *
 * NICHT fail-soft (anders als das Lesen): wer auf „Hochladen" klickt, muss
 * erfahren, wenn nichts gespeichert wurde. Der Aufrufer ist die Owner-Route im
 * onboarding-Layer, die den Fehler in ein 500 übersetzt (fehlender Bucket ⇒
 * klare „run migrations"-Meldung, wie fonts/upload).
 */
export async function writeCommunityFavicon(
  event: H3Event,
  communityId: string,
  buffer: Buffer,
): Promise<{ updatedAt: string }> {
  const admin = createAdminClient(event)
  // Bestehende Datei entfernen — 404 heißt „gab es noch nicht" und ist kein
  // Fehler; jeder andere Fehler (z. B. fehlender Bucket) muss durchschlagen.
  await admin.storage
    .deleteFile({ bucketId: COMMUNITY_FAVICON_BUCKET, fileId: communityId })
    .catch((error) => { if (!isFileNotFound(error)) throw error })

  const created = await admin.storage.createFile({
    bucketId: COMMUNITY_FAVICON_BUCKET,
    fileId: communityId,
    // Dateiname trägt die Id — Appwrite verlangt einen, gelesen wird er nie.
    file: InputFile.fromBuffer(buffer, `${communityId}.png`),
  })
  forgetCommunityFavicon(event)
  return { updatedAt: created.$updatedAt }
}

/**
 * Das Favicon dieser Community entfernen — die Community fällt aufs generierte
 * Icon zurück.
 *
 * 404 ist KEIN Fehler: „entfernen, was nicht da ist" ist ein No-op, und die
 * Route soll darauf mit „ok" antworten (der Owner klickt „Entfernen", das Ziel
 * ist erreicht). Jeder andere Fehler schlägt durch — auch hier NICHT fail-soft.
 */
export async function removeCommunityFavicon(event: H3Event, communityId: string): Promise<void> {
  const admin = createAdminClient(event)
  await admin.storage
    .deleteFile({ bucketId: COMMUNITY_FAVICON_BUCKET, fileId: communityId })
    .catch((error) => { if (!isFileNotFound(error)) throw error })
  forgetCommunityFavicon(event)
}

/**
 * Nach dem Schreiben/Entfernen: der neue Stand ist sofort in der Auslieferung,
 * ohne 30 s auf die Ablaufzeit zu warten. `delete` statt `clear`, damit nicht
 * die Einträge aller anderen Mandanten mitgehen (die TTL bleibt als Netz für
 * Schreibwege außerhalb der Route — Konsole, Nachrüst-Skripte).
 */
export function forgetCommunityFavicon(event: H3Event): void {
  cache.delete(tenantCacheScope(event))
}
