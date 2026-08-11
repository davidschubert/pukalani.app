import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import { accountActivityExcerpt, type AccountActivityEntry } from '../../../core/shared/accountActivity'
import { EVENTS_TABLE, EVENT_RSVPS_TABLE, type EventRow, type EventRsvpRow } from '../../shared/types/event'

/**
 * Aktivitäts-Contributor des events-Layers (Vertrag:
 * core/server/utils/accountActivity.ts, AH-3).
 *
 * ZUSAGEN, NICHT VERANSTALTETES. Davids AH-3-Beschreibung nennt „Event-
 * Zusagen", und dafür gibt es auch den Index: `event_rsvps.idx_user` auf
 * `userId` (events-001, dort ausdrücklich als „GDPR-Lookup" angelegt). Die
 * naheliegende Erweiterung „meine veranstalteten Events" wäre
 * `Query.equal('organizerId', …)` auf `events` — und dort gibt es KEINEN Index
 * auf `organizerId`. Das wäre ein Full-Scan über alle Events aller Communities
 * bei jedem Seitenaufruf. Wer das nachrüsten will, legt zuerst den Index an.
 *
 * 'declined' bleibt draußen: eine ABSAGE ist keine Zusage, und die Zeile trägt
 * ihren Status nicht in die Anzeige — „Du hast zugesagt" über einer Absage
 * wäre schlicht falsch. 'maybe' bleibt drin (Teilnahme-Absicht).
 */
type OwnedRsvp = EventRsvpRow & { communityId?: string }

export async function eventsListAccountActivity(
  event: H3Event,
  userId: string,
  limit: number,
): Promise<AccountActivityEntry[]> {
  const config = useRuntimeConfig(event)
  const { tablesDB } = createAdminClient(event)
  const databaseId = config.public.appwriteDatabaseId

  const res = await tablesDB.listRows<OwnedRsvp>({
    databaseId,
    tableId: EVENT_RSVPS_TABLE,
    queries: [
      Query.equal('userId', userId),
      Query.equal('status', ['going', 'maybe']),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ],
  })

  const rows = res.rows.filter(row => row.userId === userId && typeof row.communityId === 'string' && row.communityId !== '')

  /**
   * Titel GEBÜNDELT nachschlagen — eine Zusage trägt nur die `eventId`. Eine
   * Abfrage für alle Treffer, nie eine je Zeile.
   *
   * Ist das Event verschwunden (gelöscht), fällt die Zusage aus der Liste:
   * ein Eintrag ohne Titel wäre eine leere Zeile, und ein Link darauf endete
   * in einer 404.
   */
  const eventIds = [...new Set(rows.map(row => row.eventId).filter(Boolean))]
  const titles = new Map<string, string>()
  if (eventIds.length) {
    const events = await tablesDB.listRows<EventRow>({
      databaseId,
      tableId: EVENTS_TABLE,
      queries: [Query.equal('$id', eventIds), Query.limit(eventIds.length)],
    })
    for (const row of events.rows) titles.set(row.$id, row.title)
  }

  return rows
    .filter(row => titles.has(row.eventId))
    .map(row => ({
      id: row.$id,
      source: 'events',
      kind: 'rsvp' as const,
      communityId: row.communityId!,
      createdAt: row.$createdAt,
      title: accountActivityExcerpt(titles.get(row.eventId)),
      // Events haben keine Slug-Spalte — die Row-Id IST der Pfad.
      path: `/events/${row.eventId}`,
    }))
}
