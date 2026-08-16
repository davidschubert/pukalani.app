/**
 * DIE RECHENREGELN DER MITSCHREIBENDEN ZÄHLER (F1, gemeinsames Paket).
 *
 * PURE und unit-getestet — hier steht, WAS gerechnet wird; WO es landet und wie
 * die Zähler-NAMEN des Core-Vertrags heißen, steht in
 * `server/utils/memberCounters.ts`. Diese Datei kennt bewusst keinen
 * Zähler-Namen: `shared/` läuft auch im Browser, und die Namen gehören einem
 * Server-Vertrag.
 */

/** Die Spalten, die additiv geführt werden (ohne `seeded`). */
export const MEMBER_COUNTER_COLUMNS = [
  'topicsCreated',
  'repliesCreated',
  'upvotesGiven',
  'upvotesReceived',
  'edits',
  'reactionsGiven',
  'invitesAccepted',
  'likeLimitDays',
  'linksMade',
  'inviteesBasic',
  'inviteesMember',
] as const

export type MemberCounterColumn = (typeof MEMBER_COUNTER_COLUMNS)[number]

/** Die Zahlen einer Zähler-Zeile, ohne Appwrite-Beiwerk. */
export type MemberCounterValues = Record<MemberCounterColumn, number>

export function emptyMemberCounterValues(): MemberCounterValues {
  return { topicsCreated: 0, repliesCreated: 0, upvotesGiven: 0, upvotesReceived: 0, edits: 0, reactionsGiven: 0, invitesAccepted: 0, likeLimitDays: 0, linksMade: 0, inviteesBasic: 0, inviteesMember: 0 }
}

/**
 * Was die Aggregat-Quellen zum Eichen beisteuern können — mehr gibt der Bestand
 * nicht her (Begründung bei `seedValuesFrom`).
 */
export interface MemberCounterSeedInput {
  topicsCreated: number
  repliesCreated: number
  upvotesGiven: number
  /**
   * Abgegebene Emoji-Reaktionen (F57) — exakt, wie `upvotesGiven`, und aus
   * demselben Grund: JEDE Quelle zählt ihre eigenen Reaktions-Zeilen und der
   * Core-Vertrag summiert sie (`mergeUserCounters`).
   *
   * DAS „JEDE" IST DIE GANZE ZUSAGE (Audit 2026-08-15, Schnitt A): solange nur
   * `posts` meldete, war die Zahl der halbe Bestand — und weil der Seed die
   * eichbaren Spalten ABSOLUT setzt, machte ein Blick in die Galerie aus der
   * Untermeldung eine Rücksetzung. Eine neue Inhaltsart mit Reaktionen muss
   * ihren Provider also mitzählen lassen, sonst schrumpft dieser Zähler wieder.
   */
  reactionsGiven: number
}

/** PURE: eine gemeldete Zahl auf eine brauchbare Anzahl bringen. */
function whole(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

/**
 * PURE: die STARTWERTE aus den Aggregat-Zählern (Lazy-Seed).
 *
 * ── VIER VON NEUN, UND DAS IST KEINE LÜCKE, SONDERN DIE WAHRHEIT ───────────
 * Geeicht werden kann nur, was sich aus dem BESTAND ausrechnen lässt:
 *  - `topicsCreated` / `repliesCreated` — eine `count`-Abfrage je Quelle, exakt.
 *  - `upvotesGiven` — der Zähler `likesGiven`, den die Quellen ohnehin melden.
 *  - `reactionsGiven` — dieselbe Bauart (F57): jede abgegebene Reaktion ist
 *    eine Zeile (`discussion_reactions` in posts, `comment_reactions` in
 *    comments), also exakt zählbar. Summiert wird nur über die QUELLEN, wie bei
 *    `upvotesGiven` — nicht über eine Spalte wie bei `upvotesReceived`.
 *
 * Die anderen FÜNF STARTEN BEI 0, und jedes Mal ist das unvermeidlich:
 *  - `upvotesReceived` wäre die SUMME der `upvotes`-Spalte über alle eigenen
 *    Inhalte. Appwrite kann eine Spalte nicht summieren; man müsste jeden
 *    eigenen Beitrag und jede eigene Antwort seitenweise laden — bei einem
 *    langjährigen Mitglied Dutzende Abfragen, ausgelöst durch das Öffnen einer
 *    Galerie. Verworfen.
 *  - `edits` wäre gar nicht erst ausrechenbar: eine Bearbeitung hinterlässt
 *    einen ZEITSTEMPEL, keine Anzahl. Wer vor der Umstellung zehnmal
 *    nachgebessert hat, ist von seiner Vergangenheit nicht zu unterscheiden.
 *  - `invitesAccepted` (F57 Mechanik 2) hat seine Quelle in einem ANDEREN
 *    PROJEKT: die angenommenen Einladungen stehen in `community_invites` im
 *    Control Plane, zu dem die Runtime keinen Schlüssel hat. Hier gibt es also
 *    grundsätzlich kein Aggregat, nicht bloß ein zu teures — gemeldet wird die
 *    Annahme von der Route, die sie abwickelt.
 *
 *  - `likeLimitDays` (F57 Mechanik 3) hat ÜBERHAUPT KEINE Quelle, nicht bloß
 *    eine unerreichbare. „An diesem Tag war das Kontingent aufgebraucht" ist
 *    ein Zustand, der vergeht: die Stimmen jenes Tages stehen zwar noch in
 *    `comment_votes`/`post_votes`, aber eine zurückgenommene ist dort
 *    gelöscht — und gerade sie hat gezählt (die Rücknahme erstattet nichts).
 *    Aus dem Bestand ließe sich der Tag also nicht einmal falsch
 *    rekonstruieren.
 *
 *  - `inviteesBasic` / `inviteesMember` (F57-Stufen) haben ZWEI Quellen, und
 *    beide fehlen zugleich: die Zuordnung „wer hat wen eingeladen" liegt in
 *    `community_invites` im Control Plane (unerreichbar, wie bei
 *    `invitesAccepted`), und die Stufe der Eingeladenen liegt in DEREN
 *    Zähler-Zeilen — sie zu ermitteln hieße, zu jedem Einladenden alle
 *    Eingeladenen zu laden und je Person eine weitere Zeile. Beides für eine
 *    Zahl, die ab jetzt ohnehin mitläuft.
 *
 *  - `linksMade` (F57, Themen-Verlinkung) hat seine Quelle ABSICHTLICH nicht:
 *    die Rückverweis-Zeilen (`discussion_links`) gäbe es zwar, sie tragen aber
 *    bewusst kein `authorId` — eine Zeile aus zwei Row-Ids ist nichts
 *    Personenbezogenes und soll es nicht werden. Wer sie gesetzt hat, ist
 *    damit nicht nachträglich zu ermitteln, und das ist der Preis, den diese
 *    Entscheidung kostet.
 *
 * Was das praktisch heißt, gehört ausgesprochen: das Abzeichen „Editor" zählt
 * ab der Umstellung, und eine spätere Trust-Level-Schwelle „erhaltene
 * Zustimmung" ebenso. Das ist der Preis dafür, dass es diese Zahlen überhaupt
 * gibt — und der Grund, warum sie JETZT mitgeschrieben werden statt später.
 *
 * EIN MASSEN-BACKFILL WAR NIE EINE OPTION: die Zeilen liegen in jedem
 * Runtime-Projekt einzeln (Pool, jede Silo-Instanz), ein Lauf bekäme genau
 * EINEN Schlüssel für EINE Instanz, müsste über alle Mitglieder aller
 * Communities rechnen — und wäre in dem Moment veraltet, in dem der nächste
 * Mensch etwas schreibt. Deshalb beim ersten Hinsehen, für genau einen
 * Menschen, genau einmal.
 */
export function seedValuesFrom(input: Partial<MemberCounterSeedInput>): MemberCounterValues {
  return {
    topicsCreated: whole(input.topicsCreated),
    repliesCreated: whole(input.repliesCreated),
    upvotesGiven: whole(input.upvotesGiven),
    upvotesReceived: 0,
    edits: 0,
    reactionsGiven: whole(input.reactionsGiven),
    invitesAccepted: 0,
    likeLimitDays: 0,
    linksMade: 0,
    inviteesBasic: 0,
    inviteesMember: 0,
  }
}

/**
 * PURE: Ist der geeichte Stand hinter dem Aggregat zurückgefallen?
 *
 * WOFÜR: die Meldungen sind fail-soft (ein Zähler darf nie einen Kommentar
 * kosten), also KANN ein Ereignis untergehen — bei einem Deploy mitten im
 * Schreibvorgang, bei einer Störung des Datenbank-Schritts. Nach unten darf
 * dieser Verlust nicht bleiben: er würde ein verdientes Abzeichen dauerhaft
 * verhindern, und niemand käme je darauf, warum.
 *
 * Die Selbstheilung ist billig, weil das Aggregat an der Auswertestelle
 * OHNEHIN gerechnet wird (die Schwellen-Fragen brauchen es). Nur die Richtung
 * ist einseitig: ein Aggregat, das HÖHER liegt, zieht den Zähler nach; ein
 * niedrigeres wird ignoriert — sonst machte jeder Aufruf die zusätzlich
 * mitgeschriebenen Spalten (`edits`, `upvotesReceived`) wieder platt.
 */
export function counterFellBehind(
  stored: MemberCounterValues,
  input: Partial<MemberCounterSeedInput>,
): boolean {
  const seed = seedValuesFrom(input)
  return seed.topicsCreated > stored.topicsCreated
    || seed.repliesCreated > stored.repliesCreated
    || seed.upvotesGiven > stored.upvotesGiven
    || seed.reactionsGiven > stored.reactionsGiven
}

/**
 * PURE: den nachgezogenen Stand bilden — die eichbaren Spalten auf das Aggregat
 * heben, die rein mitgeschriebenen unangetastet lassen.
 */
export function healedValues(
  stored: MemberCounterValues,
  input: Partial<MemberCounterSeedInput>,
): MemberCounterValues {
  const seed = seedValuesFrom(input)
  return {
    topicsCreated: Math.max(stored.topicsCreated, seed.topicsCreated),
    repliesCreated: Math.max(stored.repliesCreated, seed.repliesCreated),
    upvotesGiven: Math.max(stored.upvotesGiven, seed.upvotesGiven),
    upvotesReceived: stored.upvotesReceived,
    edits: stored.edits,
    reactionsGiven: Math.max(stored.reactionsGiven, seed.reactionsGiven),
    invitesAccepted: stored.invitesAccepted,
    likeLimitDays: stored.likeLimitDays,
    linksMade: stored.linksMade,
    inviteesBasic: stored.inviteesBasic,
    inviteesMember: stored.inviteesMember,
  }
}

/** PURE: die Zahlen einer gelesenen Zeile, defensiv (fehlend/kaputt ⇒ 0). */
export function memberCounterValues(row: Partial<Record<MemberCounterColumn, unknown>> | null): MemberCounterValues {
  const values = emptyMemberCounterValues()
  if (!row) return values
  for (const column of MEMBER_COUNTER_COLUMNS) {
    const raw = row[column]
    values[column] = whole(typeof raw === 'number' ? raw : undefined)
  }
  return values
}
