/**
 * DIE ÜBERNAHME (AH-7, 2026-08-11) — aus n Community-Namen wird EIN Konto-Name.
 *
 * Bis AH-7 galt ein Handle je Community (`community_handles`, eindeutig je
 * `(communityId, handleLower)`). Derselbe Mensch konnte in Community A
 * `@david` heissen und in B `@dave`; ZWEI verschiedene Menschen konnten in A
 * und B beide `@david` heissen. Beim Zusammenziehen in EIN globales Register
 * ist deshalb die einzige interessante Frage: wer behält den Namen?
 *
 * ── DAVIDS REGEL: WER ZUERST KAM, BEHÄLT ──────────────────────────────────
 * Umgesetzt als reine Rechnung, damit sie prüfbar ist statt geglaubt:
 *
 *  1. Nur AKTIVE Zeilen sind Kandidaten. Eine `former`-Zeile ist ein früherer
 *     Name; sie hat ihre Aufgabe (alte Erwähnungen auflösen) im Alt-Bestand
 *     und wandert nicht mit — sonst nähme die Vergangenheit eines Menschen
 *     Namen weg, die er selbst gar nicht mehr benutzt.
 *  2. Je Konto genau EIN Kandidat: der ÄLTESTE eigene Handle. „Ältester" ist
 *     die Anlage-Zeit der Zeile — das ist die einzige Angabe, die überhaupt
 *     sagt, wer wann da war.
 *  3. Die Kandidaten werden nach derselben Zeit sortiert und der Reihe nach
 *     vergeben. Wer einen Namen findet, den ein FRÜHERER Kandidat schon
 *     bekommen hat, geht LEER AUS — er bekommt keinen Ersatznamen.
 *
 * ── WARUM LEER AUSGEHEN UND NICHT `@david2` ───────────────────────────────
 * Eine automatische Umbenennung wäre die schlechteste aller Antworten: der
 * Mensch findet einen Namen vor, den er nie gewählt hat, und erfährt nichts
 * davon. Ohne Eintrag dagegen passiert genau das Richtige — beim nächsten
 * Öffnen des Profils vergibt `ensureAccountHandle` einen Vorschlag aus dem
 * Anzeigenamen ODER er wählt selbst. Nichts wird dabei zerstört: die
 * `community_handles`-Zeilen bleiben stehen und lösen alte Erwähnungen weiter
 * auf (Alt-Bestand, Lese-Fallback).
 *
 * ── DIE TATSÄCHLICHE AUTORITÄT BLEIBT DER UNIQUE-INDEX ────────────────────
 * Diese Rechnung PLANT nur. Geschrieben wird blind, ein 409 heisst „schon
 * vergeben" — dieselbe Mechanik wie bei der laufenden Vergabe. Das ist der
 * Grund, warum ein zweiter Lauf der Übernahme nichts kaputt macht und warum
 * ein Konto, das sich zwischen zwei Läufen selbst einen Namen gewählt hat,
 * ihn behält.
 *
 * Getestet in packages/core/tests/handleAdoption.test.ts.
 */

/** Eine Zeile aus `community_handles`, soweit die Übernahme sie braucht. */
export interface AdoptionSourceRow {
  userId: string
  handle: string
  handleLower: string
  status: string
  /** `$createdAt` der Zeile — die einzige Angabe zu „wer war zuerst da". */
  createdAt: string
  /** '' im Silo/Single-Tenant. */
  communityId: string
}

export interface AdoptionCandidate {
  userId: string
  /** Die Schreibweise, die der Mensch gewählt hat — sie zieht mit um. */
  handle: string
  handleLower: string
  /**
   * ALLE Communities, in denen dieser Mensch aktuell einen Namen trägt. Sie
   * werden das Publikum der neuen Zeile (accountHandlePermissions +
   * handleAudienceWith): ohne sie stünde nach der Übernahme jedes
   * Erwähnungs-Menü leer, bis jeder Mensch einmal irgendwo geschrieben hat.
   */
  communityIds: string[]
}

export interface AdoptionPlan {
  /** In der Reihenfolge, in der geschrieben werden soll (ältester zuerst). */
  candidates: AdoptionCandidate[]
  /**
   * Konten, die leer ausgehen, weil ein Früherer denselben Namen trägt —
   * samt des Namens, um den es ging. Nur für den Bericht des Laufs; ohne
   * diese Liste wäre „12 von 40 übernommen" eine Zahl ohne Erklärung.
   */
  collisions: Array<{ userId: string, handleLower: string }>
}

/**
 * Zeitstempel vergleichbar machen. Ein unlesbares Datum landet ganz HINTEN
 * (`Infinity`) statt vorn: eine kaputte Angabe soll niemandem einen Vorrang
 * verschaffen, den er nicht belegen kann.
 */
function createdAtValue(row: AdoptionSourceRow): number {
  const parsed = Date.parse(row.createdAt)
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
}

export function planHandleAdoption(rows: readonly AdoptionSourceRow[]): AdoptionPlan {
  const active = rows.filter(row => row.status === 'active' && row.userId && row.handleLower)

  // Je Konto: der älteste eigene Handle. Bei exakt gleicher Zeit entscheidet
  // der Name alphabetisch — nicht weil das gerecht wäre, sondern damit zwei
  // Läufe dasselbe Ergebnis haben (die Reihenfolge einer Appwrite-Liste ist
  // keine Zusage).
  const oldestPerUser = new Map<string, AdoptionSourceRow>()
  const communitiesPerUser = new Map<string, Set<string>>()

  for (const row of active) {
    if (row.communityId) {
      const known = communitiesPerUser.get(row.userId) ?? new Set<string>()
      known.add(row.communityId)
      communitiesPerUser.set(row.userId, known)
    }

    const current = oldestPerUser.get(row.userId)
    if (!current) {
      oldestPerUser.set(row.userId, row)
      continue
    }
    const delta = createdAtValue(row) - createdAtValue(current)
    if (delta < 0 || (delta === 0 && row.handleLower < current.handleLower)) {
      oldestPerUser.set(row.userId, row)
    }
  }

  const ordered = [...oldestPerUser.values()].sort((a, b) => {
    const delta = createdAtValue(a) - createdAtValue(b)
    if (delta !== 0) return delta
    // Gleichstand: erst der Name, dann die Konto-Id — beides nur, damit das
    // Ergebnis reproduzierbar ist.
    if (a.handleLower !== b.handleLower) return a.handleLower < b.handleLower ? -1 : 1
    return a.userId < b.userId ? -1 : 1
  })

  const candidates: AdoptionCandidate[] = []
  const collisions: AdoptionPlan['collisions'] = []
  const claimed = new Set<string>()

  for (const row of ordered) {
    if (claimed.has(row.handleLower)) {
      collisions.push({ userId: row.userId, handleLower: row.handleLower })
      continue
    }
    claimed.add(row.handleLower)
    candidates.push({
      userId: row.userId,
      handle: row.handle || row.handleLower,
      handleLower: row.handleLower,
      communityIds: [...(communitiesPerUser.get(row.userId) ?? [])].sort(),
    })
  }

  return { candidates, collisions }
}
