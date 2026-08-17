import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import { COURSES_TABLE, ENROLLMENTS_TABLE, LESSON_PROGRESS_TABLE, type CourseRow, type EnrollmentRow, type LessonProgressRow } from '../../shared/types/course'

/**
 * GDPR-Contributor des courses-Layers: Enrollments + Progress = reine
 * Verhaltensdaten des Users → Hard-Delete; auf verfassten Kursen wird der
 * authorName anonymisiert (der Kurs selbst ist Content der Community).
 */
export async function coursesExportUserData(event: H3Event, userId: string) {
  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId

  const enrollments = await listAllRows<EnrollmentRow>(tablesDB, databaseId, ENROLLMENTS_TABLE, [Query.equal('userId', userId)])
  const progress = await listAllRows<LessonProgressRow>(tablesDB, databaseId, LESSON_PROGRESS_TABLE, [Query.equal('userId', userId)])
  const authored = await listAllRows<CourseRow>(tablesDB, databaseId, COURSES_TABLE, [Query.equal('authorId', userId)])

  return {
    enrollments: enrollments.map(e => ({ courseId: e.courseId, completedAt: e.completedAt, createdAt: e.$createdAt })),
    lessonProgress: progress.map(p => ({ lessonId: p.lessonId, courseId: p.courseId, completedAt: p.completedAt })),
    authoredCourses: authored.map(cr => ({ title: cr.title, slug: cr.slug, status: cr.status })),
  }
}

export async function coursesDeleteUserData(event: H3Event, userId: string): Promise<UserDataDeleteResult> {
  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId
  let deleted = 0
  let anonymized = 0

  // STRIKT — kein `.catch(() => [])` (Muster events/eventsUserData.ts): ein
  // geschluckter List-Fehler löschte 0 Zeilen, und `deleteUserCompletely`
  // (gated auf Voll-Erfolg) liefe danach in `users.delete` — es blieben
  // verwaiste Verhaltens-Zeilen eines gelöschten Kontos zurück (GDPR-Lücke,
  // Audit-Runde 5 2026-08-16). Ein Fehler MUSS die ganze Löschung abbrechen.
  const progress = await listAllRows<LessonProgressRow>(tablesDB, databaseId, LESSON_PROGRESS_TABLE, [Query.equal('userId', userId)])
  for (const row of progress) {
    await tablesDB.deleteRow({ databaseId, tableId: LESSON_PROGRESS_TABLE, rowId: row.$id })
    deleted++
  }

  const enrollments = await listAllRows<EnrollmentRow>(tablesDB, databaseId, ENROLLMENTS_TABLE, [Query.equal('userId', userId)])
  for (const row of enrollments) {
    await tablesDB.deleteRow({ databaseId, tableId: ENROLLMENTS_TABLE, rowId: row.$id })
    deleted++
  }

  const authored = await listAllRows<CourseRow>(tablesDB, databaseId, COURSES_TABLE, [Query.equal('authorId', userId)])
  for (const row of authored) {
    if (row.authorName === '') continue
    await tablesDB.updateRow({ databaseId, tableId: COURSES_TABLE, rowId: row.$id, data: { authorName: '' } })
    anonymized++
  }

  return { deleted, anonymized }
}
