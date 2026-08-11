import type { H3Event } from 'h3'
import type { AccountActivityEntry } from '../../shared/accountActivity'

/**
 * AccountActivityContributor-Vertrag (AH-3, CONCEPT A14).
 *
 * BAUGLEICH ZU `registerUserDataContributor` (userData.ts) und aus demselben
 * Grund: der onboarding-Layer rendert `/profile/activity`, darf aber kein
 * einziges Produkt-Schema kennen. Jeder Produkt-Layer registriert beim
 * Serverstart (Nitro-Plugin `server/plugins/user-activity.ts`), was er über
 * EINEN Nutzer weiß; core sammelt ein und mischt (shared/accountActivity.ts).
 * Eine App ohne den Layer hat dessen Plugin nicht — die Registry ist damit
 * automatisch korrekt besetzt, ohne Konfiguration.
 *
 * ZWEI PFLICHTEN, die JEDE Implementierung einhalten MUSS — sie sind der
 * gesamte Sicherheitsgehalt dieses Vertrags, denn Contributors lesen mit dem
 * ADMIN-Client (auf dem Kontroll-Host gibt es keinen Mandanten, also keine
 * Datentür, die scopen könnte):
 *
 *  1. HART auf den übergebenen `userId` filtern — `Query.equal` auf die eigene
 *     Besitz-Spalte (`authorId`/`userId`), und die gelesene Zeile danach noch
 *     einmal dagegen prüfen. `userId` kommt IMMER aus der Session der
 *     aufrufenden Route, NIE aus Query oder Body.
 *  2. `communityId` je Treffer MITGEBEN. Ohne ihn wäre der Eintrag nicht
 *     zuzuordnen, und die Seite müsste raten, auf welchem Host er lebt.
 *
 * Was ein Contributor NICHT tut: fremde Zeilen lesen, Zeilen anderer Nutzer
 * mitzählen, oder mehr als `limit` Zeilen zurückgeben.
 *
 * ── ABGRENZUNG ZU `registerUserActivityProvider` ───────────────────────────
 * In `userContentActivity.ts` steht eine zweite, ÄLTERE Aktivitäts-Registry
 * (F1 Stufe 3). Sie sieht ähnlich aus und beantwortet eine ANDERE Frage —
 * beides gehört nebeneinander, und der Unterschied ist genau die
 * Mandantengrenze:
 *
 *   registerUserActivityProvider  „wo war ich IN DIESER COMMUNITY zuletzt?"
 *     · liest über `tenantDb` (Klinke `member`) — MANDANTEN-GESCOPT
 *     · liefert nur {targetType, targetId, at}, keine Titel, keine Pfade
 *     · entdoppelt je ZIEL (zehn Kommentare an einem Beitrag = ein Eintrag)
 *     · Konsument: die Seitenleiste der Discussions, auf einem Community-Host
 *
 *   registerAccountActivityContributor (diese Datei)
 *     · liest mit dem Admin-Client — MANDANTENÜBERGREIFEND
 *     · liefert communityId, Titel und Pfad je Eintrag
 *     · entdoppelt je ZEILE, gruppiert danach nach Community
 *     · Konsument: `/profile/activity` auf dem Kontroll-Host
 *
 * ZUSAMMENLEGEN GEHT NICHT, und zwar in beide Richtungen: die erste darf die
 * Mandantengrenze NICHT überschreiten (ihr Docblock nennt das ausdrücklich ein
 * Leck), die zweite MUSS es. Wer sie eint, verliert entweder die Grenze oder
 * die Seite. Dass beide `mergeAccountActivity`/`mergeUserActivity` heißen,
 * ist deshalb kein Versehen, sondern der Grund für die verschiedenen Präfixe.
 */

export interface AccountActivityContributor {
  /** stabil + eindeutig, z. B. 'posts', 'comments' — zugleich `entry.source`. */
  id: string
  /**
   * Die neuesten eigenen Einträge dieses Layers, höchstens `limit` Stück,
   * absteigend nach Entstehung. Darf werfen — der Aufrufer meldet den Ausfall
   * als `unavailable`, statt ihn als „nichts getan" auszugeben.
   */
  listAccountActivity(event: H3Event, userId: string, limit: number): Promise<AccountActivityEntry[]>
}

const contributors = new Map<string, AccountActivityContributor>()

/** Registrierung ist idempotent (HMR/Doppel-Plugin überschreibt nur sich selbst). */
export function registerAccountActivityContributor(contributor: AccountActivityContributor): void {
  contributors.set(contributor.id, contributor)
}

/** Deterministische Reihenfolge — unabhängig von der Plugin-Ladereihenfolge. */
export function listAccountActivityContributors(): AccountActivityContributor[] {
  return [...contributors.values()].sort((a, b) => a.id.localeCompare(b.id))
}

/** Nur für Tests: Registry zurücksetzen. */
export function __resetAccountActivityContributors(): void {
  contributors.clear()
}
