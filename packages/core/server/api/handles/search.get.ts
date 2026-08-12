import { Query } from 'node-appwrite'
import { z } from 'zod'
import { HANDLE_MAX_LENGTH, normalizeHandle } from '../../../shared/handles'
import { handleAudienceIncludes } from '../../../shared/accountHandleAudience'
import { ACCOUNT_HANDLES_TABLE, type AccountHandleRow } from '../../../shared/types/handle'

/** Kurze Liste — das Menü in der Schreibfläche zeigt ohnehin nur eine Handvoll. */
const LIMIT = 8
/** Reserve für den Publikums-Filter, der erst nach der Abfrage greift. */
const READ_LIMIT = 50

const querySchema = z.object({
  q: z.string().trim().max(HANDLE_MAX_LENGTH).optional(),
})

/**
 * Vorschläge für das Erwähnungs-Menü der Schreibfläche.
 *
 * Seit AH-7 (2026-08-11) kommen sie aus dem KONTO-Register (`account_handles`)
 * statt aus `community_handles` — vorgeschlagen wird also der eine Name, den
 * dieser Mensch überall trägt. Was sich NICHT ändert, ist die Grenze:
 * vorgeschlagen werden nur MITGLIEDER DIESER Community, nie der ganze Pool.
 *
 * ── DIE GRENZE BRAUCHT SEIT AH-7 ZWEI SCHICHTEN, UND EINE DAVON IST NEU ────
 * Bis AH-7 hielten hier zwei unabhängige Dinge: der Mandanten-FILTER der
 * Datentür (`Query.equal('communityId', …)`) und die Row-Permissions
 * (`read(label:<communityId>)`). Beide sind mit dem konto-weiten Register
 * angefasst worden, und zwar so:
 *
 *  1. DER FILTER FÄLLT WEG — es gibt keine `communityId`-Spalte mehr, ein
 *     `tenantDb()` fände hier nie eine Zeile.
 *  2. DIE ROW-PERMISSIONS ALLEIN REICHEN NICHT MEHR. Das ist der Punkt, den
 *     man leicht übersieht: eine Konto-Zeile trägt eine Lese-Rolle JE
 *     Mitgliedschaft, und ein LESER trägt ebenso Labels aus mehreren
 *     Communities. Wer in A und B ist, darf die Zeilen von A UND B lesen —
 *     Appwrite fragt nicht, auf welchem HOST er gerade steht. Ohne weiteres
 *     Zutun stünden also A-Mitglieder im Erwähnungs-Menü von B (gemessen beim
 *     Bau von AH-7 an `verify-handle-search-boundary.mjs`, Abschnitt 5/6).
 *
 * Deshalb hier jetzt BEIDES, und beides ist nötig:
 *  (a) EIN MITGLIEDER-GATE. Eine Namensliste IST die Mitgliederliste einer
 *      Community; wer nicht dazugehört, bekommt gar keine Antwort. Das ist die
 *      Umkehrung der Vor-AH-7-Begründung („kein Gate nötig, die Datenebene
 *      erledigt es") — dort stand ausdrücklich, dass es hierher gehört, sobald
 *      die Datenebene die Frage nicht mehr allein beantwortet. Genau das ist
 *      eingetreten. Kosten: eine Rollen-Auflösung, die für diesen Request
 *      ohnehin schon gelaufen ist (Label-Middleware, 30 s Cache).
 *  (b) DER PUBLIKUMS-FILTER auf DIESE Community. Er beantwortet die zweite
 *      Frage: gehört die gefundene Zeile hierher? Gelesen wird weiter mit dem
 *      SESSION-Client — die Row-Permissions bleiben die harte Schicht darunter,
 *      dieser Filter ist die mandantengenaue darüber.
 *
 * NACHGELESEN WIRD GROSSZÜGIGER ALS AUSGEGEBEN (`READ_LIMIT` > `LIMIT`), weil
 * der Publikums-Filter erst NACH der Abfrage greift: würden 8 gelesen und 6
 * davon verworfen, zeigte das Menü 2 Vorschläge, obwohl es mehr gäbe.
 *
 * `status: 'active'` filtert richtig: vorgeschlagen wird, wie jemand HEUTE
 * heisst. Frühere Namen lösen weiterhin auf (resolveHandleOwners), aber
 * niemand soll sie neu tippen.
 *
 * Im SILO (apps/comments) laufen beide Schichten bewusst ins Leere:
 * `resolveCommunityMembership` sagt dort ja (das Projekt IST die Grenze), die
 * Zeilen tragen `read("users")`, und `handleAudienceIncludes` gibt ohne Pool
 * ebenfalls ja zurück. Ein Gate wäre dort keine Grenze, sondern eine
 * Aussperrung.
 */
export default defineEventHandler(async (event) => {
  // (a) Das Gate. Wirft 401 ohne Sitzung und 403 mit fachlichem Grund für
  //     Fremde — im Silo und auf Single-Tenant-Instanzen lässt es jeden durch.
  await requireCommunityMembership(event)

  const { q } = await getValidatedQuery(event, querySchema.parse)
  const prefix = normalizeHandle(q ?? '')

  const { tablesDB } = createSessionClient(event)
  const databaseId = useRuntimeConfig(event).public.appwriteDatabaseId

  const { rows } = await tablesDB.listRows<AccountHandleRow>({
    databaseId,
    tableId: ACCOUNT_HANDLES_TABLE,
    queries: [
      Query.equal('status', 'active'),
      ...(prefix ? [Query.startsWith('handleLower', prefix)] : []),
      Query.orderAsc('handleLower'),
      Query.limit(READ_LIMIT),
    ],
  })

  // (b) Der Publikums-Filter: gehört diese Zeile in DIESE Community?
  const tenant = useTenant(event)
  const pool = tenant?.mode === 'pool'
  const communityId = pool ? (tenant?.communityId ?? '') : ''

  // `id` UND `label` tragen denselben Wert: das Menü fügt den Handle als
  // gewöhnlichen Text ein, es gibt keine Id im Fliesstext (siehe
  // shared/mentions.ts). Ein Feld mit einer Nutzer-Id wäre hier ein
  // Datenleck ohne Zweck.
  return rows
    .filter(row => handleAudienceIncludes(row.$permissions, pool, communityId))
    .slice(0, LIMIT)
    .map(row => ({ id: row.handle, label: row.handle }))
})
