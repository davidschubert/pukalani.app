import { categoryOrderSchema } from '../../../../schemas/postCategory'
import { planCategoryOrder } from '../../../../shared/categoryOrder'
import { POST_CATEGORIES_TABLE, type CategoryOrderResponse, type PostCategory } from '../../../../shared/types/post'

/**
 * Die Reihenfolge der Kategorien speichern (U-Reihe, Ziehen + Pfeiltasten).
 *
 * ── WARUM EINE EIGENE ROUTE UND NICHT N × `PATCH /categories/:id` ─────────
 * Ein Zug verschiebt fast nie eine Zeile: wer den letzten Eintrag nach oben
 * zieht, ändert die Position ALLER. Als Einzel-PATCHes wären das ebenso viele
 * Requests, die einzeln scheitern können — und ein halb geschriebener Stand
 * ist bei einer Reihenfolge kein „teilweise gespeichert", sondern eine andere
 * Reihenfolge. Hier kommt die ganze Ordnung in EINEM Aufruf an, wird EINMAL
 * geprüft und danach geschrieben.
 *
 * ── `order` GEWINNT GEGEN `[id]` ──────────────────────────────────────────
 * Nitro bevorzugt statische Segmente vor dynamischen — `/categories/order`
 * landet also hier und nie in `[id].patch.ts`. (Eine Appwrite-Row-Id heißt
 * ohnehin nie so; die Regel trägt trotzdem, nicht der Zufall.)
 *
 * ── DIE KLINKE: `as: 'operator'`, `actor: 'operator'` ─────────────────────
 * Wort für Wort die Begründung aus `index.post.ts`: `post_categories` trägt
 * keine Client-Schreibrechte (Migration posts-007), und eine Kategorie ist
 * kein INHALT, sondern der Rahmen, in dem Inhalt entsteht. Deshalb weder die
 * Zahlungssperre (M13 — ein Owner mit Verzug soll seine Community weiter
 * ordnen können) noch der Beitritt-durch-Schreiben (A5).
 */
export default defineEventHandler(async (event): Promise<CategoryOrderResponse> => {
  requirePlanProduct(event, 'posts')
  await requireCommunityPermission(event, 'posts.manage')

  const body = await readValidatedBody(event, categoryOrderSchema.parse)
  const db = tenantDb(event, { as: 'operator', actor: 'operator' })

  // Der IST-Stand ist die Autorität darüber, welche Kategorien es gibt — und
  // er kommt aus der Datentür, ist also schon auf diese Community begrenzt.
  // Eine fremde Id kann damit gar nicht erst durchkommen: sie steht nicht in
  // dieser Liste und fällt als `order_stale` heraus, bevor irgendwas
  // geschrieben wird.
  const categories = await listCategories(db)

  const plan = planCategoryOrder(categories, body.ids)
  if (!plan.ok) {
    // 409, nicht 400: der Aufrufer hat nichts falsch gemacht, sein Stand ist
    // nur älter als die Datenbank (nebenan wurde angelegt oder gelöscht). Die
    // Oberfläche lädt daraufhin neu, statt eine halbe Ordnung festzuhalten.
    throw createError({
      status: 409,
      statusText: 'Category order is stale',
      data: { code: plan.reason },
    })
  }

  // Nacheinander, nicht parallel: jede Schreibung geht durch die Tür, die
  // vorher die Zugehörigkeit belegt (also 2 Requests je Zeile). Bei bis zu
  // hundert Kategorien wären das parallel zweihundert gleichzeitige Anfragen
  // an Appwrite — für eine Handbewegung, die niemand zweimal pro Sekunde
  // macht. Geschrieben wird ohnehin nur, was sich ÄNDERT.
  for (const entry of plan.writes) {
    await db.update<PostCategory>(
      POST_CATEGORIES_TABLE,
      entry.id,
      { sortOrder: entry.sortOrder },
      'Category not found',
    ).catch((error) => {
      throw toH3Error(error, 'Could not save category order')
    })
  }

  return { order: plan.order }
})
