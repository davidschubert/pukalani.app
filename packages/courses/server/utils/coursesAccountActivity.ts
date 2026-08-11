import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import { accountActivityExcerpt, type AccountActivityEntry } from '../../../core/shared/accountActivity'
import { COURSES_TABLE, ENROLLMENTS_TABLE, type CourseRow, type EnrollmentRow } from '../../shared/types/course'

/**
 * Aktivitäts-Contributor des courses-Layers (Vertrag:
 * core/server/utils/accountActivity.ts, AH-3).
 *
 * EINSCHREIBUNGEN, NICHT VERFASSTE KURSE — dieselbe Begründung wie bei den
 * Events: `enrollments.idx_user` auf `userId` existiert (courses-001),
 * `courses.authorId` hat KEINEN Index. Ein Contributor, der bei jedem
 * Seitenaufruf die Kurs-Tabelle des ganzen Pools durchsucht, gehört nicht in
 * eine Konto-Seite.
 *
 * Der Zeitpunkt ist die EINSCHREIBUNG (`$createdAt`), nicht `completedAt`:
 * `completedAt` ist nullable (der Kurs ist meist noch offen), und ein Eintrag,
 * der erst beim Abschluss erscheint, wäre für die häufigste Lage unsichtbar.
 */
type OwnedEnrollment = EnrollmentRow & { communityId?: string }

export async function coursesListAccountActivity(
  event: H3Event,
  userId: string,
  limit: number,
): Promise<AccountActivityEntry[]> {
  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId

  const res = await tablesDB.listRows<OwnedEnrollment>({
    databaseId,
    tableId: ENROLLMENTS_TABLE,
    queries: [
      Query.equal('userId', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ],
  })

  const rows = res.rows.filter(row => row.userId === userId && typeof row.communityId === 'string' && row.communityId !== '')

  /**
   * Titel UND Slug gebündelt nachschlagen — die Einschreibung trägt nur die
   * `courseId`, der Pfad ist aber `/courses/<slug>`. Eine Abfrage für alle
   * Treffer. Verschwundene Kurse fallen aus der Liste (kein leerer Eintrag,
   * kein toter Link).
   */
  const courseIds = [...new Set(rows.map(row => row.courseId).filter(Boolean))]
  const courses = new Map<string, CourseRow>()
  if (courseIds.length) {
    const res2 = await tablesDB.listRows<CourseRow>({
      databaseId,
      tableId: COURSES_TABLE,
      queries: [Query.equal('$id', courseIds), Query.limit(courseIds.length)],
    })
    for (const row of res2.rows) courses.set(row.$id, row)
  }

  return rows
    .filter(row => courses.has(row.courseId))
    .map((row) => {
      const course = courses.get(row.courseId)!
      return {
        id: row.$id,
        source: 'courses',
        kind: 'enrollment' as const,
        communityId: row.communityId!,
        createdAt: row.$createdAt,
        title: accountActivityExcerpt(course.title),
        path: course.slug ? `/courses/${course.slug}` : '',
      }
    })
}
