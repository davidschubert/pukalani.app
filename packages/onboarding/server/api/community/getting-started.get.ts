import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import type { CommunityTeamResponse } from '../../../../control/shared/communityTeam'
// Der pages-Layer BESITZT die Tabelle und stellt Typ + Id bereit (A14,
// dasselbe explizite Konsumieren wie `seedHomePage` im Wizard-Abschluss).
import { PAGES_TABLE, type PageRow } from '../../../../pages/shared/types/page'
import {
  communityDismissedGettingStarted,
  hasActiveCommunitySubscription,
  homePageEdited,
  GETTING_STARTED_PREF_KEY,
  type GettingStartedResponse,
} from '../../../shared/gettingStarted'
import { callControlPlane, mintRuntimeJwt } from '../../utils/controlPlane'

/**
 * DIE FÜNF TATSACHEN HINTER DER WILLKOMMENS-CHECKLISTE (U4).
 *
 * Die Regel steht pur in `shared/gettingStarted.ts`; hier wird nur ERMITTELT.
 * Leitsatz der ganzen Route: **kein neues Datenmodell, keine neue
 * Service-Naht.** Jeder Punkt wird aus der billigsten Quelle berechnet, die es
 * ohnehin gibt:
 *
 * | Punkt      | Quelle                                   | Kosten                        |
 * |------------|------------------------------------------|-------------------------------|
 * | Farbwelt   | `tenant.theme` aus dem Mandanten-Kontext  | 0 (30-s-Resolver-Cache)       |
 * | Abo        | `tenant.billingStatus`, ebendaher         | 0 (dito)                      |
 * | Beitrag    | `db.count()` auf die Tabelle, die der      | 1 Zählabfrage, `limit(1)`,    |
 * |            | posts-Layer per Usage-Registry meldet      | index-gestützt über communityId|
 * | Startseite | `pages`-Zeilen mit slug 'home'             | 1 Abfrage, ≤ 4 Zeilen         |
 * | Einladen   | Team-Route der BESTEHENDEN Service-Naht    | 1 Ruf, 30 s gecacht           |
 *
 * WARUM DER MITGLIEDER-PUNKT TROTZDEM ÜBER DAS CONTROL PLANE GEHT: sowohl
 * `community_members` als auch `community_invites` leben dort, und der
 * Mandanten-Host hat auf beide keinen Schlüssel — das ist dieselbe Grenze wie
 * bei `revokeCommunityLabel` (A5). Billiger wäre nur `resolveRecentJoinCount`,
 * das aber offene EINLADUNGEN nicht kennt: der Owner hätte eingeladen und
 * bekäme den Punkt trotzdem nicht abgehakt. Deshalb der volle Ruf — aber über
 * die schon vorhandene Route, ohne die Namens-Anreicherung von
 * `/api/community/members` (die kostet zusätzlich `users.list`), und mit einem
 * kleinen Cache: die Übersicht ist die meistbesuchte Seite des Dashboards.
 *
 * WARUM `team.manage` UND NICHT `community.billing`: die Liste ist eine
 * AUFBAU-Liste. Owner und Admin bauen die Community auf; ein Moderator, der zu
 * einer fremden Community dazugestoßen ist, braucht keine Startliste — und
 * bekäme in ihr vier Links in 403-Seiten. Dieselbe Capability trägt deshalb
 * auch der Registry-Eintrag in `app.config.ts`.
 *
 * WEGGEKLICKT WIRD ZUERST GEPRÜFT: wer die Karte nicht will, soll dafür nicht
 * bei jedem Seitenaufruf drei Abfragen und einen Control-Ruf bezahlen.
 *
 * FAIL-SOFT MIT RICHTUNG: fällt eine der drei Abfragen aus (Tabelle fehlt,
 * Produkt nicht komponiert, Appwrite hustet), gilt der Punkt als ERLEDIGT.
 * Andersherum wäre die Karte unsterblich — ein technischer Fehler darf keine
 * Aufgabe erfinden, die niemand erledigen kann.
 */

/** Mitglieder/Einladungen: 30 s, wie der Mandanten-Resolver. */
const teamCache = createMicrocache<boolean>(30_000)

export default defineEventHandler(async (event): Promise<GettingStartedResponse> => {
  const tenant = useTenant(event)
  // Kein Pool-Mandant (Silo, Kontroll-Host, Playground) ⇒ es gibt hier weder
  // Farbwelt-Zeile noch Abo noch Team im Control Plane. 404 wie bei den
  // Geschwister-Routen; die Karte rendert dann einfach nicht.
  if (tenant?.mode !== 'pool' || !tenant.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const { actor } = await requireCommunityPermission(event, 'team.manage')

  const communityId = tenant.communityId
  const dismissed = communityDismissedGettingStarted(
    (event.context.user?.prefs as Record<string, unknown> | undefined)?.[GETTING_STARTED_PREF_KEY],
    communityId,
  )
  // Die Karte ist weg — die Tatsachen interessieren niemanden mehr.
  if (dismissed) {
    return {
      steps: { post: false, branding: false, invite: false, homePage: false, plan: false },
      dismissed: true,
    }
  }

  // `as: 'operator'`, weil die Liste den AUFBAU-Zustand der Community meldet:
  // ein Entwurf oder ein ausgeblendeter erster Beitrag ist geschrieben worden.
  // Der `actor` wird durchgereicht (C1c) — gehandelt hat der Owner, nicht die
  // Klinke.
  const db = tenantDb(event, { as: 'operator', actor })

  const [post, homePage, invite] = await Promise.all([
    countsFirstPost(db),
    homePageTouched(db),
    teamHasReach(event, communityId),
  ])

  return {
    steps: {
      post,
      // '' heißt „nichts gewählt, Instanz-Einstellung gilt" (B5) — also hat
      // der Owner seine Farbwelt noch nicht gesetzt.
      branding: Boolean(tenant.theme),
      invite,
      homePage,
      plan: hasActiveCommunitySubscription(tenant.billingStatus),
    },
    dismissed: false,
  }
})

type TenantDb = ReturnType<typeof tenantDb>

/**
 * „Es gibt einen ersten Beitrag." — gezählt wird jeder Beitrag DIESER
 * Community, nicht nur der eigene: in einer frischen Community schreibt
 * ohnehin der Owner, und schreibt ausnahmsweise ein Mitglied zuerst, ist die
 * Community trotzdem nicht mehr leer (genau das ist der Punkt). Der Preis
 * wäre sonst ein zweiter Filter auf `authorId` — index-gestützt zwar, aber für
 * eine Unterscheidung ohne Bedeutung.
 *
 * WELCHE Tabelle das ist, sagt die Usage-Registry: dieser Layer darf
 * `POSTS_TABLE` nicht importieren (A14), und eine App ohne posts-Layer hat den
 * Posten schlicht nicht — dann gilt der Punkt als erledigt, statt eine
 * Aufgabe ohne Ziel anzuzeigen.
 */
async function countsFirstPost(db: TenantDb): Promise<boolean> {
  const counter = listCommunityUsageCounters().find(entry => entry.kind === 'posts')
  if (!counter) return true
  // Ohne eigene Queries: `count()` hängt sein `limit(1)` selbst an, ein
  // zweites Limit wäre eine widersprüchliche Abfrage.
  return await db.count(counter.tableId).then(total => total > 0).catch(() => true)
}

/**
 * „Die Startseite wurde angepasst." — die Saat legt sie beim Anlegen an (in
 * BEIDEN Sprachen, M4), also zählt nicht ihre Existenz, sondern ihre
 * Bearbeitung (`homePageEdited`). Eine Sprache genügt: wer den deutschen Text
 * überarbeitet hat, hat die Startseite angepasst.
 */
async function homePageTouched(db: TenantDb): Promise<boolean> {
  return await db
    .list<PageRow>(PAGES_TABLE, [Query.equal('slug', 'home'), Query.limit(4)])
    .then(res => res.rows.some(row => homePageEdited(row.$createdAt, row.$updatedAt)))
    .catch(() => true)
}

/**
 * „Es ist jemand eingeladen." — erledigt, sobald die Community außer dem Owner
 * noch jemanden erreicht: ein weiteres Mitglied MIT Zugang oder eine offene
 * (nicht abgelaufene) Einladung. Beides steht in derselben Antwort, also
 * kostet die Frage genau einen Ruf.
 */
async function teamHasReach(event: H3Event, communityId: string): Promise<boolean> {
  const cached = teamCache.get(communityId)
  if (cached !== undefined) return cached
  try {
    const jwt = await mintRuntimeJwt(event)
    const team = await callControlPlane<CommunityTeamResponse>(
      event, '/api/control/community/members/list', { jwt, communityId },
    )
    const reach = team.members.filter(member => member.status !== 'removed').length > 1
      || team.invites.length > 0
    teamCache.set(communityId, reach)
    return reach
  }
  catch {
    // Fail-soft wie die zwei Abfragen darüber, und in dieselbe Richtung —
    // aber NICHT gecacht: ein Aussetzer der Naht soll den Punkt nicht 30 s
    // lang als erledigt festschreiben.
    return true
  }
}
