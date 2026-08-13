import {
  communityPostponedProfileSignal,
  profileSignalAnswered,
  resolveProfileSignalVisibility,
  PROFILE_SIGNAL_PREF_KEY,
  type ProfileSignalResponse,
} from '../../../shared/profileSignal'

/**
 * ERSCHEINT DIE MARKT-SIGNAL-KARTE? (U19)
 *
 * Die Regel steht pur in `shared/profileSignal.ts`; hier wird nur ERMITTELT.
 * Leitsatz wie bei der Willkommens-Checkliste nebenan: **kein neues
 * Datenmodell, keine neue Service-Naht für das LESEN.**
 *
 * | Tatsache      | Quelle                                      | Kosten            |
 * |---------------|---------------------------------------------|-------------------|
 * | beantwortet?  | `tenant.profileSignal` (Mandanten-Kontext)  | 0 (30-s-Cache)    |
 * | verschoben?   | Konto-prefs des Anfragenden                 | 0 (liegt vor)     |
 * | eigener Inhalt| core-Vertrag, beantwortet vom posts-Layer   | 1 Zählabfrage     |
 *
 * DIE REIHENFOLGE IST DIE SPARSAMKEIT: erst die zwei kostenlosen Tatsachen,
 * und nur wenn beide die Karte noch nicht ausschliessen, die eine Abfrage. Die
 * Übersicht ist die meistbesuchte Seite des Dashboards, und die überwiegende
 * Mehrheit der Aufrufe endet hier bei „schon beantwortet".
 *
 * ── WARUM `team.manage` ─────────────────────────────────────────────────────
 * Dieselbe Capability wie die Willkommens-Checkliste und der Reiter
 * „Allgemein". Die Frage „wie gross seid ihr, was habt ihr vor?" beantwortet,
 * wer die Community AUFBAUT — Owner und Admin. Ein `viewer` sieht die Karte
 * deshalb nie: der Registry-Eintrag blendet sie aus, und diese Route würde ihm
 * ohnehin 403 antworten. Genauso wenig sieht sie ein Moderator einer fremden
 * Community, der nur zum Aufräumen dazugestossen ist.
 *
 * ── FAIL-SOFT MIT RICHTUNG ──────────────────────────────────────────────────
 * Fällt die Inhalts-Abfrage aus, gilt „kein eigener Inhalt" ⇒ KEINE Karte.
 * Das ist die Gegenrichtung zur Checkliste (dort heisst ein Fehler „erledigt"),
 * und beide Male ist es dieselbe Haltung: im Zweifel nichts fordern. Eine
 * Aufgabenliste, die aus einem technischen Fehler eine Aufgabe erfindet, ist
 * unsterblich — eine freiwillige Bitte, die aus einem technischen Fehler
 * entsteht, ist schlicht unhöflich.
 */
export default defineEventHandler(async (event): Promise<ProfileSignalResponse> => {
  const tenant = useTenant(event)
  // Kein Pool-Mandant (Silo, Kontroll-Host, Playground) ⇒ es gibt hier kein
  // `communities.profile`. 404 wie bei den Geschwister-Routen; die Karte
  // rendert dann einfach nicht.
  if (tenant?.mode !== 'pool' || !tenant.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  await requireCommunityPermission(event, 'team.manage')

  const answered = profileSignalAnswered(tenant.profileSignal)
  const postponed = communityPostponedProfileSignal(
    (event.context.user?.prefs as Record<string, unknown> | undefined)?.[PROFILE_SIGNAL_PREF_KEY],
    tenant.communityId,
  )

  // Die zwei kostenlosen Tatsachen schliessen die Karte schon aus — die
  // Zählabfrage erübrigt sich.
  if (answered || postponed) {
    return resolveProfileSignalVisibility({ answered, postponed, hasOwnContent: false })
  }

  const hasOwnContent = (await communityHasAuthoredContent(event)) ?? false

  return resolveProfileSignalVisibility({ answered, postponed, hasOwnContent })
})
