import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import type { CommunityRole } from '../../../core/shared/communityAuthz'
import type { CommunityTeamResponse } from '../../../control/shared/communityTeam'
import { callControlPlane } from './controlPlane'
import { requireCommunityTeamGate } from './communityTeamGate'

/**
 * U20 — DER ANTEIL DES ONBOARDING-LAYERS AM COMMUNITY-BÜNDEL: das Team.
 *
 * ── DAVIDS ZUSCHNITT, UND ER IST BINDEND (DECISION-LOG 2026-08-12) ─────────
 * Im Bündel steht das TEAM mit NAME und ROLLE — sonst nichts über Menschen.
 * Gewöhnliche Mitglieder (`viewer`) erscheinen AUSSCHLIESSLICH in einer
 * anonymen Zahl. Was hier NIE herausgeht, in voller Länge, damit niemand es
 * später „der Vollständigkeit halber" nachträgt:
 *
 *  · **E-Mail-Adressen.** Sie sind die einzige echte PII, die das Control
 *    Plane überhaupt hält. Ein Bündel, das sie mitnimmt, ist eine
 *    Adressliste — und die verlässt beim Herunterladen unsere Obhut.
 *  · **`runtimeUserId`.** Ein Pseudonym ohne Auflösung für den Leser des
 *    Bündels, aber ein dauerhafter Wiedererkennungs-Schlüssel über
 *    Community-Grenzen hinweg.
 *  · **Die Row-Id der Mitgliedschaft** — eine Handhabe auf eine Zeile in
 *    einem fremden Projekt, die im Bündel nichts erklärt.
 *  · **`joinedAt`/`removedAt`.** Wann jemand kam oder ging, geht selbst den
 *    Owner beim EXPORT nichts an; das ist die Auskunft der Mitglieder-Seite,
 *    nicht der Inhalt eines Archivs.
 *  · **Einladungen.** Sie tragen die Adressen von Menschen, die nicht einmal
 *    Mitglied sind — der schlimmste denkbare Eintrag in einer Datei, die
 *    jemand weitergibt.
 *
 * Der Zuschnitt wird MECHANISCH durchgesetzt (Filter + neu gebautes Objekt),
 * nicht durch Weglassen beim Abschreiben: `CommunityMemberView` trägt all die
 * Felder oben, ein `...member`-Spread wäre das Leck.
 *
 * ── KEINE NEUE CONTROL-PLANE-ROUTE ────────────────────────────────────────
 * Gelesen wird über die BESTEHENDE Naht `/api/control/community/members/list`.
 * Sie verlangt auf ihrer Seite `team.manage` — der Owner trägt beides
 * (`community.export` UND `team.manage`, s. communityAuthz.ts), der Gate hier
 * verlangt trotzdem `community.export`: die schärfere der beiden gilt, und der
 * Export ist eine Owner-Sache.
 *
 * ── FAIL-FAST, ANDERS ALS DER DSGVO-BEITRAG NEBENAN ───────────────────────
 * `communityUserData.ts` degradiert bewusst zu `{}`, wenn die Naht nicht
 * antwortet: eine Auskunft ohne einen Abschnitt ist besser als gar keine, und
 * ein DSGVO-Export darf nie blockiert sein. HIER ist es umgekehrt — ein
 * Bündel, das sein Team stillschweigend verloren hat, SIEHT VOLLSTÄNDIG AUS
 * und ist falsch. Also wirft `callControlService` (503 nach oben), und der
 * Orchestrator bricht den ganzen Lauf ab. Der Owner bekommt einen Fehler
 * statt einer Datei, in der die halbe Wahrheit steht.
 */

/** Die Rollen, die als „Team" gelten — in DIESER Reihenfolge sortiert. */
const TEAM_ROLES: readonly CommunityRole[] = ['owner', 'admin', 'moderator', 'editor']

/** Ein Team-Mitglied, so wie es im Bündel steht. Zwei Felder, mehr nicht. */
export interface CommunityTeamExportEntry {
  /** Anzeigename aus dem Runtime-Projekt; '' = keiner hinterlegt. */
  name: string
  role: CommunityRole
}

/**
 * Die anonymen Zähler. Sie sind der EINZIGE Ort, an dem gewöhnliche
 * Mitglieder im Bündel vorkommen — als Zahl, nie als Zeile.
 */
export interface CommunityTeamExportCounts {
  /** Mitglieder MIT Zugang (status 'active'), Team eingeschlossen. */
  total: number
  /** Davon mit einer Team-Rolle. */
  team: number
  /** Der Rest — gewöhnliche Mitglieder. */
  members: number
}

export interface CommunityTeamExportData {
  team: CommunityTeamExportEntry[]
  memberCounts: CommunityTeamExportCounts
}

export async function communityTeamExportData(event: H3Event): Promise<CommunityTeamExportData> {
  const { communityId, jwt } = await requireCommunityTeamGate(event, 'community.export')

  const team = await callControlPlane<CommunityTeamResponse>(
    event,
    '/api/control/community/members/list',
    { jwt, communityId },
  )

  // Nur Zugang zählt. Wer entfernt wurde, ist kein Mitglied mehr — und dass er
  // einmal Moderator WAR, gehört nicht in ein Archiv (dieselbe Regel wie in
  // `publicTeamFrom`).
  const active = team.members.filter(member => member.status === 'active')
  const teamRows = active.filter(member => (TEAM_ROLES as readonly string[]).includes(member.role))

  /**
   * Namen kommen aus der RUNTIME — nur sie kennt die Nutzer ihres Projekts.
   * Gebündelt (100 Ids je Aufruf), nie je Zeile: dasselbe Muster wie in
   * api/community/members/index.get.ts.
   *
   * Gefragt wird NUR nach dem Team. Die Ids gewöhnlicher Mitglieder hier
   * mitzuschicken hieße, sie aufzulösen, um das Ergebnis dann wegzuwerfen.
   */
  const ids = [...new Set(teamRows.map(member => member.runtimeUserId).filter(Boolean))]
  const names = new Map<string, string>()
  if (ids.length > 0) {
    try {
      const admin = createAdminClient(event)
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100)
        const res = await admin.users.list({ queries: [Query.equal('$id', batch), Query.limit(batch.length)] })
        for (const user of res.users) {
          if (user.name) names.set(user.$id, user.name)
        }
      }
    }
    catch {
      // Namen sind Komfort, nicht Inhalt. Fehlen sie, bleibt das Feld LEER —
      // und ausdrücklich NICHT die E-Mail-Adresse, auf die die Mitglieder-
      // Seite zurückfällt. Ein Rückfall auf PII wäre genau das Leck, das der
      // Zuschnitt oben verbietet.
    }
  }

  /**
   * STABILE ORDNUNG: erst Rollen-Rang, dann Name, zuletzt die Runtime-Id.
   *
   * Zweimal exportiert ergibt so zweimal dieselbe Datei, solange sich an der
   * Community nichts geändert hat — die Reihenfolge des Control Plane hängt
   * sonst an Row-Anlagezeitpunkten. Die Id sortiert nur, sie wird NICHT
   * ausgegeben. `localeCompare` steht hier bewusst nicht: sein Ergebnis hängt
   * an der ICU-Sprache des Servers, ein einfacher Vergleich nicht.
   */
  const byName = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
  const entries = teamRows
    .map(member => ({
      name: names.get(member.runtimeUserId) ?? '',
      role: member.role,
      sortId: member.runtimeUserId,
    }))
    .sort((a, b) =>
      TEAM_ROLES.indexOf(a.role) - TEAM_ROLES.indexOf(b.role)
      || byName(a.name, b.name)
      || byName(a.sortId, b.sortId))

  return {
    // Neu gebaut, nicht gespreadet: was nicht dasteht, kann nicht mitreisen.
    team: entries.map(entry => ({ name: entry.name, role: entry.role })),
    memberCounts: {
      total: active.length,
      team: teamRows.length,
      members: active.length - teamRows.length,
    },
  }
}
