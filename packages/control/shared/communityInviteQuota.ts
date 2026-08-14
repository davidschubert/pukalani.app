import type { CommunityRole } from '../../core/shared/communityAuthz'

/**
 * EINLADUNGEN DURCH MITGLIEDER — die Rechenregeln (F57 Mechanik 2).
 *
 * Davids Zuschnitt vom 2026-08-14: **5 Einladungen pro Woche je Mitglied** (ab
 * Rolle Leser/in), **je Community vom Owner abschaltbar**, die Zahl als
 * Config-Wert justierbar.
 *
 * PURE und unit-getestet. Dieselbe Arbeitsteilung wie bei `communityTeam.ts`:
 * hier stehen die REGELN, die Route setzt sie durch und die Oberfläche zeigt
 * sie an — drei Leser, EINE Wahrheit. Eine Regel, die nur in einer Route
 * lebt, ist in der Oberfläche schon eine Vermutung.
 *
 * ── WARUM DAS KONTINGENT AN DEN ERZEUGTEN ZEILEN HÄNGT ────────────────────
 * Gezählt werden die `community_invites`-Zeilen mit `invitedBy = ich` aus den
 * letzten sieben Tagen — rollierend, kein Kalender-Wochenwechsel, der um
 * Mitternacht fünf frische Versuche schenkt.
 *
 * Dass eine zweite Einladung an dieselbe Adresse die erste nur auf `revoked`
 * setzt statt sie zu LÖSCHEN (invite.post.ts), ist dabei die tragende
 * Eigenschaft und kein Zufall: eine gelöschte Vorgänger-Zeile hieße, dass
 * derselbe Empfänger beliebig oft angeschrieben werden kann, während der
 * Zähler bei 1 stehen bleibt. Wer hier je auf „aufräumen" umstellt, hebt das
 * Kontingent auf, ohne es anzufassen.
 *
 * Verbraucht ist eine Einladung deshalb mit ihrer ERZEUGUNG, nicht mit ihrer
 * Annahme. Alles andere wäre ein Freibrief: 500 nie angenommene Einladungen
 * kosteten dann nichts, und genau die sind der Missbrauchsfall.
 */

/** Rollierendes Fenster: sieben Tage, keine Kalenderwoche. */
export const MEMBER_INVITE_WINDOW_MS = 7 * 24 * 3_600_000

/** Davids Zahl (2026-08-14). Config: `pukalani.community.memberInvitesPerWeek`. */
export const MEMBER_INVITES_PER_WEEK_DEFAULT = 5

/**
 * Die Ablehnungsgründe, die der Einladende ERFÄHRT.
 *
 * Bewusst OHNE Anti-Enumerations-Theater: dass MEIN Kontingent leer ist, ist
 * eine Tatsache über mich selbst — sie zu verschleiern hilft niemandem und
 * produziert nur die Sorte Fehlermeldung, nach der man im Support fragt.
 * Über die eingeladene ADRESSE verrät keiner der drei Gründe etwas.
 */
export type MemberInviteDenial =
  | 'member_invites_disabled'
  | 'invite_role_forbidden'
  | 'invite_quota_exhausted'

export interface MemberInviteFacts {
  /**
   * Hält der Einladende `team.manage` (Owner/Admin)?
   *
   * Absichtlich die CAPABILITY und nicht die Rolle: die Frage ist „darf er
   * über die Besetzung bestimmen", und die Antwort darauf gehört der
   * Rechte-Matrix, nicht dieser Datei. Käme je eine sechste Rolle dazu,
   * stimmt diese Regel weiter.
   */
  managesTeam: boolean
  /** Die gewünschte Rolle aus dem Body. */
  role: CommunityRole
  /** Schalter der Community — schon durch `resolveTenantMemberInvitesEnabled`. */
  invitesEnabled: boolean
  /** Kontingent je Fenster. `0` = Mechanik plattformweit aus. */
  limit: number
  /** Bereits im Fenster erzeugte Einladungen dieses Mitglieds. */
  used: number
}

export type MemberInviteDecision =
  | { ok: true }
  | { ok: false, reason: MemberInviteDenial }

/**
 * PURE: Darf diese Person JETZT diese Einladung aussprechen?
 *
 * OWNER/ADMIN GEHEN UNGEBREMST DURCH — weder Schalter noch Kontingent. Das
 * ist keine Nachlässigkeit, sondern die Bedingung dafür, dass diese Mechanik
 * überhaupt gebaut werden durfte: sie soll ein Recht HINZUFÜGEN, nicht das
 * bestehende Recht des Owners beschneiden. Ein Owner, der seine eigene
 * Community nicht mehr voll besetzen kann, weil er den Schalter für seine
 * Mitglieder umgelegt hat, wäre ein Rückschritt.
 *
 * Die Reihenfolge der drei Prüfungen ist Absicht: erst die Frage, ob es die
 * Mechanik hier überhaupt gibt (Schalter/Config), dann die Rolle, dann die
 * Menge. So erfährt jemand bei abgeschalteter Mechanik „abgeschaltet" und
 * nicht „falsche Rolle" — die erste Antwort ist die wahre.
 *
 * 'owner' als Wunschrolle fällt hier NICHT durch: das lehnt `decideInvite`
 * ab, für JEDEN Einladenden. Diese Datei fügt nur hinzu, was für MITGLIEDER
 * zusätzlich gilt; die allgemeinen Regeln bleiben, wo sie sind.
 */
export function decideMemberInvite(facts: MemberInviteFacts): MemberInviteDecision {
  if (facts.managesTeam) return { ok: true }

  if (facts.limit <= 0 || !facts.invitesEnabled) {
    return { ok: false, reason: 'member_invites_disabled' }
  }
  if (facts.role !== 'viewer') {
    return { ok: false, reason: 'invite_role_forbidden' }
  }
  if (facts.used >= facts.limit) {
    return { ok: false, reason: 'invite_quota_exhausted' }
  }
  return { ok: true }
}

/** Was die Oberfläche über das eigene Kontingent anzeigt. */
export interface MemberInviteQuotaView {
  /** Darf ich hier überhaupt einladen? (Schalter + Config + Rolle) */
  enabled: boolean
  /** Owner/Admin: kein Kontingent — die Oberfläche zeigt dann keine Zahlen. */
  unlimited: boolean
  limit: number
  used: number
  remaining: number
}

/**
 * PURE: derselbe Zustand, den `decideMemberInvite` prüft — als Anzeige.
 *
 * Sie ruft die Entscheidung SELBST auf, statt die Bedingungen ein zweites Mal
 * hinzuschreiben. Zwei Formulierungen derselben Regel driften auseinander,
 * und die Oberfläche ist die, der man den Fehler zuerst glaubt: ein Knopf,
 * der da ist und dann 403 sagt, ist schlimmer als kein Knopf.
 */
export function memberInviteQuota(
  facts: Omit<MemberInviteFacts, 'role'>,
): MemberInviteQuotaView {
  // 'viewer' ist die Rolle, die ein MITGLIED vergeben kann — und nur für
  // Mitglieder ist „darf ich noch" überhaupt eine Frage. Owner/Admin fallen in
  // `decideMemberInvite` vor jeder Rollen-Prüfung heraus.
  const decision = decideMemberInvite({ ...facts, role: 'viewer' })
  const limit = Math.max(0, Math.floor(facts.limit))
  const used = Math.max(0, Math.floor(facts.used))
  return {
    enabled: decision.ok,
    unlimited: facts.managesTeam,
    limit,
    used,
    remaining: facts.managesTeam ? limit : Math.max(0, limit - used),
  }
}

/**
 * Der Anfang des Zählfensters als ISO-Zeitstempel (für `Query.greaterThan`).
 *
 * `now` wird hereingereicht statt hier gelesen — sonst wäre die Funktion
 * nicht prüfbar, und ein Kontingent, dessen Fenster niemand testen kann, ist
 * eine Behauptung.
 */
export function memberInviteWindowStart(now: number): string {
  return new Date(now - MEMBER_INVITE_WINDOW_MS).toISOString()
}

/**
 * PURE: das Kontingent aus der App-Config lesen — defensiv.
 *
 * Ein fehlender, kaputter oder negativer Wert ist NICHT „unbegrenzt", sondern
 * die Vorgabe. Eine vertippte Config darf ein Missbrauchs-Limit nicht
 * aufheben; abschalten geht ausdrücklich über die `0`.
 */
export function memberInviteLimitFrom(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return MEMBER_INVITES_PER_WEEK_DEFAULT
  if (value < 0) return MEMBER_INVITES_PER_WEEK_DEFAULT
  return Math.floor(value)
}
