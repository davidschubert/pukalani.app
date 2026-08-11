import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import type { AccountActivityEntry } from '../../../core/shared/accountActivity'
import { discussionTopicPath, topicSlug } from '../../shared/discussionUrl'
import { POSTS_TABLE, POST_CATEGORIES_TABLE, type CommunityPost, type PostCategory } from '../../shared/types/post'
import { topicTitle } from './discussions'

/**
 * Aktivitäts-Contributor des posts-Layers (Vertrag:
 * core/server/utils/accountActivity.ts, AH-3).
 *
 * BEWUSST AUSSERHALB der Datentür (tenantDb) — aus demselben Grund wie der
 * GDPR-Contributor nebenan: die Frage ist user-zentriert und damit per
 * Definition mandantenübergreifend, und gestellt wird sie auf dem
 * Kontroll-Host, wo es GAR KEINEN Mandanten gibt, dem die Tür folgen könnte.
 * Die Grenze ist deshalb NICHT die Tür, sondern die `authorId`-Zeile unten —
 * und die ist doppelt gezogen: einmal als `Query.equal` (die Datenbank liefert
 * nichts anderes) und einmal als Nachprüfung an der gelesenen Zeile (falls
 * jemand die Query je „optimiert").
 *
 * `Query.equal('authorId', …)` OHNE communityId ist indiziert (`idx_author`,
 * posts-001) — ohne diesen Index wäre es ein Full-Scan über den ganzen Pool.
 * Wer die Query hier ändert, prüft das mit.
 *
 * 'deleted' bleibt draußen: der Soft-Delete des Autors ist Historie, keine
 * Ansicht — dieselbe Regel wie in `posts/mine.get.ts`. 'scheduled' und
 * 'hidden' bleiben DRIN: es sind die eigenen Beiträge, und ihr Zustand ist
 * genau das, was der Verfasser hier sehen will.
 */
type OwnedPost = CommunityPost & { communityId?: string }

export async function postsListAccountActivity(
  event: H3Event,
  userId: string,
  limit: number,
): Promise<AccountActivityEntry[]> {
  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId

  const res = await tablesDB.listRows<OwnedPost>({
    databaseId,
    tableId: POSTS_TABLE,
    queries: [
      Query.equal('authorId', userId),
      Query.notEqual('status', 'deleted'),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ],
  })

  const rows = res.rows.filter(row => row.authorId === userId && typeof row.communityId === 'string' && row.communityId !== '')

  /**
   * Kategorie-Slugs GEBÜNDELT — der kanonische Topic-Pfad ist
   * `/discussions/<kategorie>/<id>/<slug>`, und die Kategorie steht nur als Id
   * an der Zeile. Eine Abfrage für alle Treffer statt einer je Zeile: 20
   * Beiträge wären sonst 20 Rundreisen (dieselbe Lehre wie beim
   * Community-Host-Resolver).
   *
   * Findet sich eine Kategorie nicht, bleibt der Pfad LEER statt geraten — ein
   * Link, der verlässlich in einer 404 endet, ist schlechter als keiner.
   */
  const categoryIds = [...new Set(rows.map(row => row.categoryId).filter(Boolean))]
  const slugs = new Map<string, string>()
  if (categoryIds.length) {
    const categories = await tablesDB.listRows<PostCategory>({
      databaseId,
      tableId: POST_CATEGORIES_TABLE,
      queries: [Query.equal('$id', categoryIds), Query.limit(categoryIds.length)],
    })
    for (const category of categories.rows) slugs.set(category.$id, category.slug)
  }

  return rows.map((row) => {
    const categorySlug = slugs.get(row.categoryId)
    return {
      id: row.$id,
      source: 'posts',
      kind: 'post' as const,
      communityId: row.communityId!,
      createdAt: row.$createdAt,
      title: topicTitle(row),
      path: categorySlug ? discussionTopicPath(categorySlug, row.$id, topicSlug(row.title, row.body)) : '',
    }
  })
}
