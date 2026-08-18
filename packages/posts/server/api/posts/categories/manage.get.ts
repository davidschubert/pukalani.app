import type { CategoryManageResponse } from '../../../../shared/types/post'

/**
 * Kategorien für die VERWALTUNG: alle (auch stillgelegte), immer mit
 * Topic-Anzahl — die Zahl ist dort keine Deko, sondern die Antwort auf „darf
 * ich das löschen?" (die DELETE-Route verweigert bei belegten Kategorien).
 *
 * Eigene Route statt eines Query-Flags auf der öffentlichen Liste: die
 * Berechtigungs-Prüfung soll am Pfad hängen und nicht an einem Parameter, den
 * jemand später versehentlich durchreicht.
 *
 * Sie liefert die Zeilen ROH — mitsamt `translations`. Die öffentliche Liste
 * tut das auch (der Browser löst die Sprache selbst auf, siehe
 * `useCategoryText`); hier ist es zusätzlich der Bearbeitungs-Stand: das
 * Formular muss zeigen können, was gespeichert IST, nicht was gerade
 * angezeigt wird.
 */
export default defineEventHandler(async (event): Promise<CategoryManageResponse> => {
  requirePlanProduct(event, 'posts')
  await requireCommunityPermission(event, 'posts.manage')

  // Lesen bleibt die Mitglieder-Klinke: die Verwaltung braucht keinen
  // Admin-Client, um die eigenen Kategorien zu sehen.
  const db = tenantDb(event)
  const categories = await listCategories(db)
  const counts = await topicCountsFor(db, categories)
  return {
    rows: categories.map(category => ({ category, topicCount: counts.get(category.$id) ?? 0 })),
    /**
     * Ob der Übersetzungs-Knopf überhaupt erscheinen darf — dieselbe Auskunft
     * wie `aiAssist` in der Moderations-Liste, und aus demselben Grund vom
     * SERVER: ob ein KI-Schlüssel hinterlegt ist, weiß nur er. Das TARIF-Gate
     * ('ai') prüft die Oberfläche zusätzlich selbst (planAllows) — die Route
     * `translate.post.ts` setzt beides ohnehin durch.
     */
    aiTranslate: isAiAvailable(event),
  }
})
