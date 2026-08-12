import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import { HANDLE_MAX_LENGTH, normalizeHandle } from '../../shared/handles'
import { HANDLES_TABLE, type CommunityHandleRow } from '../../shared/types/handle'
import { accountHandleOwners, accountHandlesForUsers } from './accountHandles'

/**
 * DIE AUFLÖSUNGS-KETTE (AH-7, 2026-08-11) — von `@name` zum Menschen.
 *
 * Seit AH-7 gehört ein Handle dem KONTO (`account_handles`, Migration
 * system-031, Dienst nebenan in accountHandles.ts). `community_handles`
 * (system-029) ist ALT-BESTAND: dort wird nichts mehr vergeben, die Zeilen
 * bleiben aber stehen. Diese Datei ist die einzige Stelle, die beides kennt:
 *
 *   1. KONTO-Register — die Wahrheit. Global eindeutig, Historien-Zeilen
 *      inklusive (ein früherer Name zeigt weiter auf denselben Menschen).
 *   2. COMMUNITY-Alt-Bestand — nur für das, was Schritt 1 NICHT beantwortet.
 *
 * ── WARUM DAS KONTO ZUERST KOMMT, UND WAS DAS KOSTET ──────────────────────
 * Ein Name kann in beiden Registern stehen und dort auf VERSCHIEDENE Menschen
 * zeigen: in Community X hiess A einmal `@david`, global hat B den Namen
 * gewonnen (Übernahme-Regel „wer zuerst kam, behält", shared/handleAdoption.ts).
 * Ein alter Beitrag in X meinte A, aufgelöst wird jetzt B.
 *
 * Das ist die BEWUSSTE Wahl (Davids Entscheidung: eine Pukalani-ID, ein Handle
 * überall — der Name bedeutet ab jetzt überall dieselbe Person), und der Preis
 * ist klein gehalten: die Übernahme hat jedem Konto genau seinen ÄLTESTEN
 * Namen mitgegeben, der Alt-Bestand greift also nur noch für Namen, die im
 * Konto-Register gar keinen Besitzer haben — Kollisions-Verlierer und Menschen,
 * die seither gegangen sind. Die Gegenrichtung (Community zuerst) hätte den
 * Fehler nur verschoben und dazu die Zusage gebrochen, dass `@david` überall
 * derselbe ist.
 *
 * Beide Schritte sind mandantengebunden: Schritt 1 filtert am Publikum der
 * Zeile (accountHandleOwners), Schritt 2 an der Datentür. Eine Erwähnung
 * erreicht nie jemanden ausserhalb DIESER Community.
 */

/** Der Zugang zum ALT-Bestand — Begründung für die Operator-Klinke unten. */
function legacyDb(event: H3Event) {
  /**
   * `as: 'operator'` + `actor: 'operator'` unverändert aus der Zeit vor AH-7:
   *  1. Die Tabelle trägt keine Tabellen-Rechte, ein Session-Client liest dort
   *     nur, was ihm die Row-Permissions geben — für die Auflösung fremder
   *     Erwähnungen zu wenig.
   *  2. EIN HANDLE IST KEIN INHALT. M13 friert Inhalte ein und lässt
   *     persönliche Einstellungen offen; ein `actor: 'member'` hätte das
   *     Auflösen einer Erwähnung in einer zahlungsgesperrten Community
   *     gesperrt, obwohl nur gelesen wird.
   */
  return tenantDb(event, { as: 'operator', actor: 'operator' })
}

/** Schritt 2 der Kette: `handleLower` → `userId` aus dem Alt-Bestand. */
async function legacyHandleOwners(event: H3Event, handleLowers: string[]): Promise<Map<string, string>> {
  if (handleLowers.length === 0) return new Map()
  try {
    const { rows } = await legacyDb(event).list<CommunityHandleRow>(HANDLES_TABLE, [
      Query.equal('handleLower', handleLowers),
      Query.limit(handleLowers.length),
    ])
    return new Map(rows.map(row => [row.handleLower, row.userId]))
  }
  catch {
    return new Map()
  }
}

/** Schritt 2 der Kette in der anderen Richtung: `userId` → aktueller Name. */
async function legacyHandlesForUsers(event: H3Event, userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()
  const map = new Map<string, string>()
  try {
    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100)
      const { rows } = await legacyDb(event).list<CommunityHandleRow>(HANDLES_TABLE, [
        Query.equal('userId', batch),
        Query.equal('status', 'active'),
        Query.limit(batch.length),
      ])
      for (const row of rows) map.set(row.userId, row.handle)
    }
    return map
  }
  catch {
    return map
  }
}

/**
 * `handleLower` → `userId`. Konto-Register zuerst, Alt-Bestand für den Rest.
 *
 * Eine Abfrage je Register für ALLE Kandidaten (nie eine je Name — eine
 * Beitragsliste hat schnell 25 davon). Der zweite Zugriff entfällt ganz, wenn
 * das Konto-Register schon alles beantwortet hat, und das ist nach der
 * Übernahme der Normalfall.
 *
 * Gibt im Fehlerfall eine leere Map zurück (fail-soft: `splitMentions` hebt
 * dann nichts hervor, der Text bleibt Text).
 */
export async function resolveHandleOwners(
  event: H3Event,
  handles: string[],
): Promise<Map<string, string>> {
  const wanted = [...new Set(handles.map(normalizeHandle).filter(h => h && h.length <= HANDLE_MAX_LENGTH))]
  if (wanted.length === 0) return new Map()

  const owners = await accountHandleOwners(event, wanted)

  const missing = wanted.filter(handle => !owners.has(handle))
  if (missing.length > 0) {
    for (const [handle, userId] of await legacyHandleOwners(event, missing)) {
      owners.set(handle, userId)
    }
  }
  return owners
}

/**
 * Die AKTIVEN Handles VIELER Menschen (`userId` → Name) — die Umkehrung.
 * Dieselbe Kette: Konto-Register zuerst, Alt-Bestand nur für die Menschen, die
 * dort noch keinen Eintrag haben (Kollisions-Verlierer der Übernahme, solange
 * sie ihr Profil nicht geöffnet haben).
 */
export async function resolveUserHandles(event: H3Event, userIds: string[]): Promise<Map<string, string>> {
  const wanted = [...new Set(userIds.filter(Boolean))]
  if (wanted.length === 0) return new Map()

  const map = await accountHandlesForUsers(event, wanted)

  const missing = wanted.filter(userId => !map.has(userId))
  if (missing.length > 0) {
    for (const [userId, handle] of await legacyHandlesForUsers(event, missing)) {
      map.set(userId, handle)
    }
  }
  return map
}
