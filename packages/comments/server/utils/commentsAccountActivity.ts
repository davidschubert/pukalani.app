import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import { accountActivityExcerpt, type AccountActivityEntry } from '../../../core/shared/accountActivity'
import { COMMENTS_TABLE, type Comment } from '../../shared/types/comment'

/**
 * Aktivitäts-Contributor des comments-Layers (Vertrag:
 * core/server/utils/accountActivity.ts, AH-3).
 *
 * Grenze wie überall in diesem Vertrag: `authorId` als `Query.equal` UND als
 * Nachprüfung an der gelesenen Zeile. Indiziert über `author` (comments-003),
 * also kein Full-Scan über den Pool.
 *
 * GAST-KOMMENTARE können hier per Konstruktion nicht auftauchen: sie tragen
 * `authorId: ''` (authorKind 'guest'), und `userId` ist nie leer. Es braucht
 * dafür also keinen zusätzlichen Filter — nur diesen Satz, damit der nächste
 * Mensch nicht einen erfindet.
 *
 * 'deleted' bleibt draußen (Historie, keine Ansicht), 'hidden' bleibt drin:
 * dass die eigene Wortmeldung moderiert wurde, ist eine Auskunft, die dem
 * Verfasser zusteht.
 */
type OwnedComment = Comment & { communityId?: string }

export async function commentsListAccountActivity(
  event: H3Event,
  userId: string,
  limit: number,
): Promise<AccountActivityEntry[]> {
  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId

  const res = await tablesDB.listRows<OwnedComment>({
    databaseId,
    tableId: COMMENTS_TABLE,
    queries: [
      Query.equal('authorId', userId),
      Query.notEqual('status', 'deleted'),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ],
  })

  return res.rows
    .filter(row => row.authorId === userId && typeof row.communityId === 'string' && row.communityId !== '')
    .map(row => ({
      id: row.$id,
      source: 'comments',
      kind: 'comment' as const,
      communityId: row.communityId!,
      createdAt: row.$createdAt,
      title: accountActivityExcerpt(row.content),
      /**
       * `targetUrl` ist der interne Pfad der Seite, auf der der Kommentar
       * steht — die Zeile trägt ihr Ziel also selbst, es braucht keinen
       * zweiten Lookup. `null` heißt „Startseite" im Leseweg des Layers; hier
       * wird daraus bewusst KEIN '/' geraten, sondern ein leerer Pfad: ein
       * Kommentar, dessen Ort unbekannt ist, bekommt keinen Link statt eines
       * Links auf die falsche Seite.
       */
      path: row.targetUrl && row.targetUrl.startsWith('/') ? row.targetUrl : '',
    }))
}
