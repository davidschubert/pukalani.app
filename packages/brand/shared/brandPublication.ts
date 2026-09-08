/**
 * DIE REGELN DER VERÖFFENTLICHUNG (docs/plans/DISCOVER-BRANDS.md §3, §4.3, §5,
 * Davids Entscheidung §9.1 „Freigabe VOR Veröffentlichung") — pur, ohne h3,
 * ohne Appwrite, ohne Vue.
 *
 * Drei Fragen leben hier, und nur hier:
 *  1. WIE HEISST DIE ADRESSE? (`brandPublicationSlug`)
 *  2. DARF ÜBERHAUPT EINGEREICHT WERDEN? (`brandPublicationCanSubmit`)
 *  3. WELCHER ZUSTAND FOLGT AUF WELCHE HANDLUNG? (`decideBrandPublication`)
 *
 * Die Routen setzen sie durch, die Leseansicht kennt sie (Knöpfe zeigen statt
 * verstecken), die Tests nageln sie fest — dieselbe Arbeitsteilung wie bei
 * `shared/brandCheckCorrections.ts` und `shared/brandWaitlistAdmin.ts`.
 *
 * ── WARUM DIE ZUSTANDSREGEL SCHON DIE BETREIBER-HANDLUNGEN KENNT ──────────
 * Freigeben, Ablehnen und Ausblenden gehören dem Paket D3 und haben hier noch
 * keine Route. Die REGEL steht trotzdem vollständig da: eine Zustandsmaschine,
 * die nur die halben Übergänge kennt, ist keine — sie wäre eine Liste von
 * Sonderfällen, und die zweite Hälfte würde später an einer anderen Stelle
 * entschieden. Der Preis ist eine ungenutzte Handlung, der Gewinn ist, dass
 * „was darf jetzt passieren?" genau einmal beantwortet wird.
 */

/**
 * DIE FÜNF ZUSTÄNDE EINER VERÖFFENTLICHUNG (§3.4).
 *
 *   pending   — eingereicht, wartet auf die Freigabe des Betreibers.
 *   published — freigegeben, öffentlich und indexierbar.
 *   declined  — abgelehnt, mit Begründung (der Kunde sieht sie).
 *   hidden    — vom Betreiber nachträglich ausgeblendet.
 *   withdrawn — vom Kunden zurückgezogen.
 */
export const BRAND_PUBLICATION_STATUSES = [
  'pending',
  'published',
  'declined',
  'hidden',
  'withdrawn',
] as const

export type BrandPublicationStatus = typeof BRAND_PUBLICATION_STATUSES[number]

/**
 * Der Zustand, wie ihn die OBERFLÄCHE kennt — die fünf plus „noch nie
 * eingereicht".
 *
 * `'none'` ist bewusst ein Wert und kein `null`: die Leseansicht und die Karte
 * stellen genau EINE Frage („in welchem Zustand ist diese Marke?"), und ein
 * `null` daneben zwänge jeden Leser zu zweien. Ein SPALTEN-Wert ist `'none'`
 * nie — die Zeile entsteht erst mit dem Einreichen.
 */
export type BrandPublicationViewStatus = BrandPublicationStatus | 'none'

/**
 * Der gelesene Spaltenwert — FAIL-CLOSED auf `pending`.
 *
 * Ein unbekannter Wert ist ein Datenfehler, und die einzige Antwort darauf,
 * die nichts kaputt macht, ist „das schaut sich der Betreiber an". `published`
 * darf NIE aus einem Rateschritt entstehen: das wäre eine Veröffentlichung,
 * die niemand freigegeben hat (dieselbe Haltung wie bei `marketVisibility`,
 * nur mit dem anderen sicheren Ende).
 */
export function normalizeBrandPublicationStatus(value: string | null | undefined): BrandPublicationStatus {
  const trimmed = (value ?? '').trim()
  return (BRAND_PUBLICATION_STATUSES as readonly string[]).includes(trimmed)
    ? trimmed as BrandPublicationStatus
    : 'pending'
}

/** Öffentlich sichtbar ist genau EIN Zustand — die Galerie (D2) fragt so. */
export function brandPublicationIsPublic(status: BrandPublicationViewStatus): boolean {
  return status === 'published'
}

// ── 1 · Die Adresse ─────────────────────────────────────────────────────────

/**
 * Der Adress-Deckel. 80 Zeichen tragen jeden echten Markennamen; alles darüber
 * ist keine Adresse mehr, sondern ein Satz.
 */
export const BRAND_PUBLICATION_SLUG_MAX = 80

/** Der Pfad-Präfix der Anatomie-Seite (§9 Nr. 2). EINE Stelle, drei Leser. */
export const BRAND_PUBLICATION_PATH_PREFIX = '/discover/'

/**
 * Umlaute und ß werden AUSGESCHRIEBEN, nicht abgeschnitten: „Grünmühle" wird
 * `gruenmuehle` und nicht `grnmhle`. Sie stehen vor der Diakritika-Entfernung,
 * weil `NFD` aus `ü` sonst ein nacktes `u` machte — und „Müller" heisst im
 * Deutschen nicht „Muller".
 */
const UMLAUTS: Readonly<Record<string, string>> = {
  ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue', ß: 'ss',
}

/**
 * DIE ADRESSE AUS DEM TITEL — klein, ASCII, mit Bindestrichen.
 *
 * ── DER RÜCKFALL BRAUCHT DIE PROFIL-ID ────────────────────────────────────
 * Ein Titel aus lauter Zeichen, die hier wegfallen (Emoji, chinesische
 * Schrift, „···"), ergäbe eine LEERE Adresse — und eine leere Adresse wäre
 * `/discover/`, also die Galerie selbst. Deshalb `brand-<6 Zeichen der Id>`:
 * eindeutig, kurz, und es sagt ehrlich, dass hier kein Name stand.
 *
 * ── ES WIRD NICHT AUF WORTGRENZEN GEKÜRZT ─────────────────────────────────
 * Ein hart abgeschnittenes Wort ist hässlich, ein an der Wortgrenze
 * abgeschnittener Name ist FALSCH („Nordsee Fischräucherei" → `nordsee`).
 * Gekürzt wird auf 80 Zeichen, danach fallen Rand-Bindestriche weg.
 */
export function brandPublicationSlug(title: string, profileId = ''): string {
  const mapped = [...(title ?? '')].map(char => UMLAUTS[char] ?? char).join('')
  const ascii = mapped
    .normalize('NFD')
    // Diakritika (é → e); die Klasse ist bewusst ein Bereich und keine Liste.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const slug = trimHyphens(ascii.replace(/[^a-z0-9]+/g, '-')).slice(0, BRAND_PUBLICATION_SLUG_MAX)
  const cleaned = trimHyphens(slug)
  if (cleaned) return cleaned

  const suffix = trimHyphens((profileId ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')).slice(0, 6)
  return suffix ? `brand-${suffix}` : 'brand'
}

function trimHyphens(value: string): string {
  return value.replace(/-{2,}/g, '-').replace(/^-+/, '').replace(/-+$/, '')
}

/**
 * DIE KANDIDATEN BEI EINER KOLLISION: `name`, `name-2`, `name-3`, …
 *
 * Der Zähler beginnt bei 1 = der blanke Name (es gibt kein `name-1`; die erste
 * Marke dieses Namens ist nicht „die erste von mehreren", sie ist die einzige).
 * Der Deckel bleibt: bei einem Namen, der die 80 schon ausschöpft, weicht das
 * ENDE dem Suffix — sonst wären zwei Kandidaten nach dem Abschneiden derselbe
 * Text und die „Kollisionsauflösung" löste nichts auf.
 */
export function brandPublicationSlugCandidate(base: string, attempt: number): string {
  if (attempt <= 1) return base
  const suffix = `-${attempt}`
  const room = BRAND_PUBLICATION_SLUG_MAX - suffix.length
  return `${trimHyphens(base.slice(0, room))}${suffix}`
}

/** Die Adresse, unter der die Anatomie steht (D2). */
export function brandPublicationPath(slug: string): string {
  return `${BRAND_PUBLICATION_PATH_PREFIX}${slug}`
}

// ── 2 · Die Voraussetzungen ─────────────────────────────────────────────────

/**
 * DIE KAPITEL, DIE ABGENOMMEN SEIN MÜSSEN (§3.3): A (`context`) und B (`pvm`).
 *
 * Ohne sie ist die Anatomie leer — sie zeigt Purpose, Vision, Mission und die
 * Herkunft, und beides kommt aus genau diesen zwei Bausteinen. Dieselbe
 * „Behauptungs"-Logik wie die Marktvergleich-Sperre: wer nichts festgelegt
 * hat, hat nichts zu zeigen.
 */
export const BRAND_PUBLICATION_REQUIRED_STEPS = ['context', 'pvm'] as const

/** Der Slot, der den Archetyp trägt (§3.3 „Archetyp gesetzt"). */
export const BRAND_PUBLICATION_ARCHETYPE_SLOT = 'd.primary'

/**
 * WAS FEHLT — als Codes, nicht als Sätze.
 *
 * Sie reisen im 409 (`data.code` → `reason`, plus die Liste) und werden erst
 * in der Oberfläche zu Text (`brand.publication.blocker.<code>`). Ein Server,
 * der fertige Sätze schickt, kann sie nicht übersetzen und nicht umformulieren.
 */
export const BRAND_PUBLICATION_BLOCKERS = [
  'title_missing',
  'context_open',
  'pvm_open',
  'archetype_missing',
] as const

export type BrandPublicationBlocker = typeof BRAND_PUBLICATION_BLOCKERS[number]

/** Kapitel → Grund. Eine Karte statt vier `if` (und die einzige Stelle dafür). */
const STEP_BLOCKERS: Readonly<Record<string, BrandPublicationBlocker>> = {
  context: 'context_open',
  pvm: 'pvm_open',
}

export interface BrandPublicationSubmitFacts {
  /** Der Titel der Marke, roh — hier wird getrimmt. */
  title: string
  /** Die Baustein-Schlüssel, die ABGENOMMEN sind (`state === 'done'`). */
  acceptedStepKeys: readonly string[]
  /** Ist `d.primary` bestätigt? */
  archetypeConfirmed: boolean
}

export interface BrandPublicationSubmitDecision {
  allowed: boolean
  /** Leer, wenn erlaubt. Sonst in der Reihenfolge, in der man sie abarbeitet. */
  blockers: BrandPublicationBlocker[]
}

/**
 * DARF DIESE MARKE EINGEREICHT WERDEN? (§3.3)
 *
 * ALLE Gründe auf einmal, nie nur der erste: der Dialog zeigt eine Liste, und
 * ein Mensch, der drei Dinge nachholen muss, soll das in einem Zug erfahren
 * und nicht in drei Anläufen.
 */
export function brandPublicationCanSubmit(
  facts: BrandPublicationSubmitFacts,
): BrandPublicationSubmitDecision {
  const blockers: BrandPublicationBlocker[] = []
  if (!facts.title.trim()) blockers.push('title_missing')
  for (const stepKey of BRAND_PUBLICATION_REQUIRED_STEPS) {
    if (!facts.acceptedStepKeys.includes(stepKey)) blockers.push(STEP_BLOCKERS[stepKey]!)
  }
  if (!facts.archetypeConfirmed) blockers.push('archetype_missing')
  return { allowed: blockers.length === 0, blockers }
}

/** Der Fehlercode des 409, wenn die Voraussetzungen fehlen (§4.3). */
export const BRAND_PUBLICATION_NOT_READY = 'publication_not_ready'

// ── 3 · Die Zustandsmaschine ────────────────────────────────────────────────

/**
 * DIE FÜNF HANDLUNGEN. `submit`/`withdraw` gehören dem KUNDEN,
 * `approve`/`decline`/`hide` dem BETREIBER (D3).
 */
export const BRAND_PUBLICATION_ACTIONS = ['submit', 'withdraw', 'approve', 'decline', 'hide'] as const
export type BrandPublicationAction = typeof BRAND_PUBLICATION_ACTIONS[number]

export type BrandPublicationTransition =
  | { action: 'apply', next: BrandPublicationStatus }
  | { action: 'refuse', code: 'publication_state' }

/**
 * WAS DARF JETZT PASSIEREN? — `null` heisst „es gibt noch keine Zeile".
 *
 * ┌────────────┬──────────────────────────────────────────────────────────┐
 * │ submit     │ (keine) · declined · withdrawn · published → pending      │
 * │ withdraw   │ pending · published · declined            → withdrawn     │
 * │ approve    │ pending                                    → published    │
 * │ decline    │ pending                                    → declined     │
 * │ hide       │ published                                  → hidden       │
 * └────────────┴──────────────────────────────────────────────────────────┘
 *
 * ── „ERNEUT EINREICHEN" AUS `published` IST DER INTERESSANTE FALL ─────────
 * Er setzt den Zustand auf `pending` zurück, und trotzdem BLEIBT die Marke
 * öffentlich, bis der Betreiber entschieden hat (§3.4: „bis dahin bleibt der
 * freigegebene alte Stand öffentlich"). Das ist kein Widerspruch, sondern die
 * Arbeitsteilung zwischen Zustand und Inhalt: der Zustand sagt, WORÜBER gerade
 * entschieden wird, die zwei Snapshot-Spalten sagen, WAS zu sehen ist —
 * `snapshot` ist der öffentliche Stand, `pendingSnapshot` der eingereichte.
 * Die Freigabe kopiert `pendingSnapshot` → `snapshot`. Ein einzelnes Feld
 * könnte beides nicht: der neue Stand überschriebe den freigegebenen, und die
 * Öffentlichkeit sähe während der Prüfung genau das, was noch niemand geprüft
 * hat.
 *
 * ── `hidden` IST EINE SACKGASSE, UND ZWAR ABSICHTLICH ─────────────────────
 * Ausblenden ist die Antwort des Betreibers auf einen Rechtsverstoss oder eine
 * Meldung (§3.4/§4.4). Dürfte der Kunde daraus neu einreichen, wäre der
 * Entzug ein Knopfdruck weit weg von seiner Aufhebung — dieselbe Trennung wie
 * zwischen `rankingOptIn` und `hidden` beim Brand-Check (brand-017): zwei
 * Flags, weil es zwei verschiedene Menschen sind. Der Weg zurück führt über
 * den Betreiber, nicht über die Selbstbedienung.
 */
export function decideBrandPublication(
  status: BrandPublicationStatus | null,
  action: BrandPublicationAction,
): BrandPublicationTransition {
  const refuse: BrandPublicationTransition = { action: 'refuse', code: 'publication_state' }
  switch (action) {
    case 'submit':
      return status === null || status === 'declined' || status === 'withdrawn' || status === 'published'
        ? { action: 'apply', next: 'pending' }
        : refuse
    case 'withdraw':
      return status === 'pending' || status === 'published' || status === 'declined'
        ? { action: 'apply', next: 'withdrawn' }
        : refuse
    case 'approve':
      return status === 'pending' ? { action: 'apply', next: 'published' } : refuse
    case 'decline':
      return status === 'pending' ? { action: 'apply', next: 'declined' } : refuse
    case 'hide':
      return status === 'published' ? { action: 'apply', next: 'hidden' } : refuse
  }
}

/**
 * BLEIBT DER ALTE STAND ÖFFENTLICH? — die zweite Hälfte des Falls oben.
 *
 * Sie steht als eigene Funktion da, weil zwei Stellen sie brauchen: die Route
 * (sie darf `snapshot` dann NICHT überschreiben) und die Oberfläche (sie sagt
 * „öffentlich · ein neuer Stand wartet auf Freigabe" statt bloss „wartet").
 */
export function brandPublicationKeepsPublicStand(
  previous: BrandPublicationStatus | null,
  action: BrandPublicationAction,
): boolean {
  return action === 'submit' && previous === 'published'
}

// ── 4 · Der Tages-Deckel ────────────────────────────────────────────────────

/**
 * ZEHN EINREICHUNGEN JE KONTO UND TAG (§6).
 *
 * Der Eimer `brand:publish` in `05.rate-limit.ts` zählt je MINUTE und je IP —
 * das ist das einzige Fenster, das die Middleware kennt. Der TAG und das KONTO
 * gehören hierher: ein Mensch veröffentlicht seine Marke einmal und aktualisiert
 * den Stand gelegentlich; wer zehnmal am Tag einreicht, füllt die Warteschlange
 * des Betreibers. Beide sind nötig und meinen Verschiedenes — die Minute
 * schützt den Server, der Tag die Arbeitsliste (dieselbe Begründung wie bei den
 * Korrekturvorschlägen).
 */
export const BRAND_PUBLICATION_DAY_LIMIT = 10
export const BRAND_PUBLICATION_DAY_WINDOW_MS = 24 * 60 * 60_000
export const BRAND_PUBLICATION_LIMIT_CODE = 'publication_limit'

export function brandPublicationDayKey(userId: string): string {
  return `brand-publication-day:${userId}`
}

/**
 * `>` statt `>=`, weil `store.hit()` den Zähler EINSCHLIESSLICH dieser
 * Einreichung liefert: die zehnte ist erlaubt, die elfte nicht.
 */
export function decideBrandPublicationQuota(
  count: number,
  limit: number = BRAND_PUBLICATION_DAY_LIMIT,
): typeof BRAND_PUBLICATION_LIMIT_CODE | null {
  return count > limit ? BRAND_PUBLICATION_LIMIT_CODE : null
}
