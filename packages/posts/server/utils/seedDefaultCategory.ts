import { Permission, Role } from 'node-appwrite'
import type { H3Event } from 'h3'
import { POST_CATEGORIES_TABLE, type PostCategory } from '../../shared/types/post'
import { defaultCategoryFor, defaultCategoryRowId } from '../../shared/defaultCategory'

/**
 * DIE ERSTE KATEGORIE SÄEN — die Begründung steht vollständig in
 * `shared/defaultCategory.ts`; hier steht nur, WIE geschrieben wird.
 *
 * Gerufen vom Wizard-Abschluss über dieselbe core-Registry wie der Beispiel-
 * Beitrag (`registerCommunityFirstContentProvider`, A14) und VOR ihm: der
 * Beitrag bekommt die Id dieser Zeile als `categoryId` und steht damit sofort
 * unter Discussions. Scheitert die Kategorie, wird der Beitrag trotzdem
 * geschrieben — dann eben ohne, wie bisher.
 *
 * ── WARUM NICHT ÜBER DIE DATENTÜR ──────────────────────────────────────────
 * Wörtlich derselbe Grund wie bei `seedWelcomePost` und `seedHomePage`: dieser
 * Aufruf läuft auf dem KONTROLL-Host, wo es keinen Mandanten-Kontext gibt und
 * damit keine Tür, die `communityId` stempeln könnte. Der Scope kommt als
 * Argument, und ohne ihn wird NICHTS geschrieben — im Pool wäre eine Zeile
 * ohne `communityId` die Zeile von allen.
 *
 * ── PERMISSIONS SIND PFLICHT ───────────────────────────────────────────────
 * `post_categories` steht auf `rowSecurity: true` mit LEEREN Table-Permissions
 * (Migration posts-007): eine Zeile ohne Row-Permission ist für niemanden
 * sichtbar. `read(any)` ist hier korrekt, weil eine frisch angelegte Community
 * `audience: 'public'` trägt (onboardingProvision) — dieselbe Permission, die
 * die Anlege-Route über `read: 'public'` für sie ausrechnet. Wird das
 * Lese-Publikum später umgestellt, zieht die vorhandene Umstellung diese Zeile
 * mit, wie jede andere auch. GESCHRIEBEN wird bewusst nichts vergeben:
 * Kategorien ändert man über die Route mit `posts.manage`, nie vom Client aus.
 */

export interface SeedDefaultCategoryInput {
  /** Zeilen-Scope im Pool (`communities.tenantId`) — ohne ihn wird nichts geschrieben. */
  tenantId: string
  /** Sprache des Wizards ('de' | 'en'). */
  locale: string
}

/**
 * Legt die erste Kategorie an und gibt ihre Zeilen-Id zurück — die ist das
 * Ergebnis, das der Aufrufer braucht (der Beispiel-Beitrag wird ihr
 * zugeordnet).
 *
 * Ein 409 gibt die Id EBENFALLS zurück und nicht `null`: die Zeile existiert
 * dann bereits aus einem ersten Lauf, und für den Beitrag ist sie genau die
 * richtige Kategorie. Ein Doppelklick auf „Community anlegen" ist damit kein
 * Fehler, sondern der gewünschte Ausgang — dieselbe Lesart wie in
 * `seedWelcomePost`, nur mit einem verwertbaren Rückgabewert.
 *
 * `null` heißt genau eine Sache: kein Scope, also wurde nichts geschrieben.
 */
export async function seedDefaultCategory(
  event: H3Event,
  input: SeedDefaultCategoryInput,
): Promise<string | null> {
  if (!input.tenantId) {
    logEvent('error', 'posts.seed_category_without_scope', { locale: input.locale })
    return null
  }

  const config = useRuntimeConfig(event)
  const admin = createAdminClient(event)
  const seed = defaultCategoryFor(input.locale)
  const rowId = defaultCategoryRowId(input.tenantId)

  try {
    const row = await admin.tablesDB.createRow<PostCategory & { communityId: string }>({
      databaseId: config.public.appwriteDatabaseId,
      tableId: POST_CATEGORIES_TABLE,
      rowId,
      // ALLE Felder ausdrücklich — dieselbe Regel wie beim Beispiel-Beitrag:
      // eine neue Spalte soll hier eine Entscheidung erzwingen, statt
      // stillschweigend aus einem Default zu fallen.
      data: {
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        sortOrder: 0,
        active: true,
        // Die jeweils andere Sprache kommt aus `defaultCategoryFor` mit —
        // beide Fassungen stehen dort ohnehin als Konstanten.
        translations: seed.translations,
        communityId: input.tenantId,
      },
      permissions: [Permission.read(Role.any())],
    })
    return row.$id
  }
  catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 409) {
      // Die Zeile gibt es schon — für den Beitrag ist sie trotzdem die
      // richtige Kategorie, also die abgeleitete Id zurückgeben statt `null`.
      return rowId
    }
    throw error
  }
}
