/**
 * WER DARF DEN @NAMEN EINES KONTOS SEHEN? (AH-7, 2026-08-11)
 *
 * Seit AH-7 gehört ein Handle dem KONTO und nicht mehr der Community
 * (`account_handles`, global eindeutig). Damit fällt die Grenze weg, die
 * `community_handles` gratis mitbrachte: dort trug JEDE Zeile die
 * `communityId`, und die Row-Permission `read(label:<communityId>)` machte die
 * Namensliste einer Community zu ihrer Mitgliederliste — sichtbar nur für
 * Mitglieder. Eine konto-weite Zeile hat diese eine Community nicht mehr.
 *
 * ── DIE ZEILE TRÄGT IHR PUBLIKUM ALS LISTE ─────────────────────────────────
 * Statt einer Spalte trägt die Zeile MEHRERE Lese-Rollen: eine je Community,
 * in der dieser Mensch Mitglied ist. Das ist dieselbe Grenze wie vorher, nur
 * additiv geführt — `read("label:<c1>") read("label:<c2>") …`. Wer in einer
 * dieser Communities das Label trägt (A5: Mitglied), bekommt die Zeile von
 * Appwrite; wer nicht, bekommt sie nicht, ganz ohne Prüfung im Code.
 *
 * Daran hängen DREI Dinge, und deshalb ist diese Datei so wichtig wie
 * presencePermissions.ts:
 *  1. Das Erwähnungs-Menü (`GET /api/handles/search`, Session-Client) —
 *     vorgeschlagen wird, wer HIER dazugehört, nie der ganze Pool.
 *  2. Die AUFLÖSUNG einer Erwähnung (Admin-Client, deshalb ohne Appwrites
 *     Hilfe): `@name` darf nur auf jemanden zeigen, der in DIESER Community
 *     ist. Ohne diese Prüfung wäre ein Beitrag ein Fernzünder für eine
 *     Benachrichtigung an ein beliebiges fremdes Konto.
 *  3. Der Entzug: verliert jemand den Zugang, verschwindet seine Rolle wieder
 *     (der Name selbst bleibt ihm — er gehört dem Konto).
 *
 * ── WARUM ROHE STRINGS UND KEIN `Permission.read(Role.label(…))` ───────────
 * Dieselbe Begründung wie in presencePermissions.ts: die Regel wird auch dort
 * gebraucht, wo `node-appwrite` nicht hingehört, und ein Vergleich von
 * Berechtigungs-STRINGS ist ohnehin das, was am Ende zählt. `tests/
 * accountHandleAudience.test.ts` nagelt jede Zeile an `Permission`/`Role` fest.
 *
 * ── `read("user:<id>")` STEHT IMMER MIT DRIN ──────────────────────────────
 * Sonst könnte ein Mensch, der noch in keiner Community ist (frisches Konto
 * auf account.pukalani.app), seinen eigenen Namen nicht lesen. Die Zeile wäre
 * für IHN unsichtbar, während sie global seinen Namen belegt — genau die Art
 * stiller Widerspruch, die man erst bemerkt, wenn sich jemand beschwert.
 *
 * ── KEIN update/delete FÜR DEN BESITZER (bewusst) ─────────────────────────
 * Anders als bei der Presence darf der Browser hier NICHTS schreiben. Die
 * Sperrfrist (30 Tage), der Zeichensatz und die Reservierungsliste sind
 * Zusagen des Systems; ein Konto mit Schreibrecht auf seine eigene Zeile
 * könnte an allen dreien vorbei. Geschrieben wird ausschließlich über
 * `PATCH /api/account/handle` mit dem Admin-Client.
 */

/** Die Lese-Rolle EINER Community — der Baustein des Publikums. */
export function communityHandleReadRole(communityId: string): string {
  return `read("label:${communityId}")`
}

/** „Nur ich" — steht in jeder Zeile, siehe Kopf. */
export function ownerHandleReadRole(userId: string): string {
  return `read("user:${userId}")`
}

/**
 * Die Permissions einer FRISCHEN Zeile.
 *
 * `pool` = geteiltes Projekt (Mandanten-Betrieb). Im SILO und im
 * Single-Tenant-Betrieb ist das Projekt selbst die Grenze — dort steht
 * `read("users")`, exakt wie bei jeder anderen Mitglieder-Zeile
 * (tenantReadRolesFor). Ein Label wäre dort reine Zeremonie.
 *
 * Im Pool OHNE Community (Kontroll-Host: account.pukalani.app) bleibt es beim
 * Besitzer-Read. Das ist kein Mangel, sondern der richtige Zustand: der Name
 * ist vergeben, sichtbar wird er in einer Community, sobald der Mensch dort
 * auftaucht (`ensureAccountHandleAudience`).
 */
export function accountHandlePermissions(
  pool: boolean,
  communityId: string | null | undefined,
  userId: string,
): string[] {
  const roles = [ownerHandleReadRole(userId)]
  if (!pool) roles.push('read("users")')
  else if (communityId) roles.push(communityHandleReadRole(communityId))
  return roles
}

/**
 * Sieht diese Community die Zeile schon? Im Silo (`pool: false`) lautet die
 * Antwort immer ja — dort gibt es keine Community-Grenze.
 *
 * FAIL-CLOSED im Pool: ohne `communityId` (Kontroll-Host, Datenfehler) ist die
 * Antwort NEIN. Der einzige Leser, für den das zählt, ist die Auflösung einer
 * Erwähnung — und ohne Community gibt es dort nichts aufzulösen.
 */
export function handleAudienceIncludes(
  permissions: readonly string[],
  pool: boolean,
  communityId: string | null | undefined,
): boolean {
  if (!pool) return true
  if (!communityId) return false
  return permissions.includes(communityHandleReadRole(communityId))
}

/**
 * Das Publikum um EINE Community erweitern — oder `null`, wenn nichts zu tun
 * ist. Das `null` ist der Grund, warum diese Funktion existiert: der Aufrufer
 * läuft auf einem heissen Pfad (jeder Beitrag, jedes Öffnen der Kontoseite)
 * und soll NUR dann schreiben, wenn sich wirklich etwas ändert.
 */
export function handleAudienceWith(
  permissions: readonly string[],
  pool: boolean,
  communityId: string | null | undefined,
): string[] | null {
  if (!pool || !communityId) return null
  if (handleAudienceIncludes(permissions, pool, communityId)) return null
  return [...permissions, communityHandleReadRole(communityId)]
}

/**
 * Das Publikum um EINE Community verkleinern — oder `null`, wenn sie ohnehin
 * nicht drinsteht. Gegenstück zu `handleAudienceWith`, für den Entzug.
 */
export function handleAudienceWithout(
  permissions: readonly string[],
  communityId: string,
): string[] | null {
  const role = communityHandleReadRole(communityId)
  if (!permissions.includes(role)) return null
  return permissions.filter(entry => entry !== role)
}
