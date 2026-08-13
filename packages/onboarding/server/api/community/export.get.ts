import type { CommunityExport } from '../../../../core/server/utils/communityExport'

/**
 * U20 — DAS COMMUNITY-BÜNDEL HERUNTERLADEN. Eine Datei, ein Klick, alles drin,
 * was diese Community an Inhalten hat.
 *
 * ── WARUM GET ─────────────────────────────────────────────────────────────
 * Weil es ein LESEN ist. Es entsteht keine Zeile, es ändert sich nichts, ein
 * zweiter Aufruf liefert dasselbe. Ein POST wäre hier nur Zeremonie — und er
 * kostete den Browser die Möglichkeit, die Antwort als Datei zu behandeln.
 * Gegen Missbrauch steht kein Verb, sondern die Bremse: `community:export`,
 * 2 Läufe je Fenster (core/server/middleware/05.rate-limit.ts).
 *
 * ── WARUM IM ONBOARDING-LAYER ─────────────────────────────────────────────
 * Dieselbe Begründung wie bei allen Geschwistern in diesem Ordner: hier hängt
 * der Community-Hub, und hier liegt die Naht zum Control Plane, aus der der
 * Team-Abschnitt kommt. Eine Silo-App ohne onboarding bekommt so WEDER die
 * Route NOCH den Menüpunkt — kein Einstieg, der ins Leere greift.
 *
 * ── DER EXPORT LÄUFT AUCH BEI GESPERRTER COMMUNITY ────────────────────────
 * Und das ist Absicht. Die M13-Sperre (`suspension: 'billing'`) friert
 * INHALTE ein — sie sitzt an der Datentür, an der Türklinke `member`, und
 * greift nur beim SCHREIBEN. Diese Route schreibt nichts, also berührt sie
 * `assertWritable` nie. Wer nicht zahlt, soll zum Zahlen bewegt werden; seine
 * Daten als Pfand einzubehalten ist nicht die Aufgabe der Sperre — und wäre
 * ausgerechnet in dem Moment zu, in dem jemand gehen möchte.
 */
export default defineEventHandler(async (event): Promise<CommunityExport> => {
  // Das `await` ist PFLICHT: requireCommunityPermission ist asynchron, ohne
  // await wäre der Gate fail-OPEN (ein Promise ist wahrheitswertig).
  await requireCommunityPermission(event, 'community.export')

  const tenant = useTenant(event)
  // Kein Mandant (Silo, Kontroll-Host, Playground) ⇒ es gibt keine Community,
  // die man exportieren könnte. 404 wie bei den Geschwister-Routen.
  if (!tenant?.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const payload = await exportCommunityCompletely(event)

  // Dateiname aus der kanonischen Adresse, ersatzweise der Community-Id —
  // beide sind serverseitig und nie Eingabe. Entschärft wie beim CSV-Export
  // der Nutzerliste (packages/admin/server/api/admin/users/export-csv.get.ts):
  // alles außer Wortzeichen, Punkt und Bindestrich wird zu '_'.
  const safe = (tenant.canonicalHost || tenant.communityId).replace(/[^\w.-]/g, '_')
  const day = new Date().toISOString().slice(0, 10)

  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  setHeader(event, 'content-disposition', `attachment; filename="community-export-${safe}-${day}.json"`)
  // NIEMALS in einen Microcache: diese Antwort hängt an der Session (und an
  // der Rolle) des Abrufenden — die Core-Regel lässt dort nur user-agnostische
  // GETs zu. `no-store` sagt dasselbe jedem Zwischenspeicher davor.
  setHeader(event, 'cache-control', 'no-store')

  return payload
})
