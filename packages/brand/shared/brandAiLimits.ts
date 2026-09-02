/**
 * DER KI-DROSSEL-VERTRAG DES BRAND-WIZARDS (Plan §6 / §9b.5) — die Zahlen, die
 * Schlüssel und die Entscheidung, alles pur und ohne Vue, h3 oder Appwrite.
 *
 * ── WARUM DIESE DATEI EXISTIERT ───────────────────────────────────────────
 * Die Drossel ist ein LAUNCH-GATE: solange der einzige Generator der Dev-Stub
 * ist, kostet ein Lauf nichts — mit dem ersten echten Prompt kostet jeder Lauf
 * Geld beim Anbieter. Ein Deckel, der als abgeschriebene Zeichenkette in zwei
 * Routen lebt, ist beim ersten Umbenennen zwei verschiedene Deckel; deshalb
 * sind die Eimer-Schlüssel FUNKTIONEN und die Zahlen KONSTANTEN, genau wie bei
 * der UGC-Übersetzung (`core/shared/ugcTranslations.ts`).
 *
 * ── FÜNF FRAGEN, FÜNF ZÄHLER ──────────────────────────────────────────────
 *  1. „Wie viele laufen JETZT?"    — Burst, je Konto, im Prozess (2).
 *  2. „Wie oft heute AN DIESER Stelle?" — je Brand × Slot-Typ (10).
 *  2b. „Wie viel wurde heute in diesem Branding GEREDET?" — je Brand (40).
 *  3. „Wie oft heute ÜBERHAUPT?"   — je Konto, über alle Brands (200).
 *  4. „Was kostet das die INSTANZ?" — Gesamtzahl über alle Konten (Default
 *     1000, konfigurierbar).
 * Sie beantworten verschiedene Fragen und dürfen sich deshalb nicht ersetzen:
 * (1) begrenzt das Tempo, (2) das Ausfransen an einer einzigen Frage, (2b) das
 * Ausfransen des GESPRÄCHS, (3) die Rechnung eines Menschen, (4) die Rechnung
 * des Betreibers.
 *
 * ── WARUM DAS GESPRÄCH EINEN EIGENEN EIMER HAT (P3.2) ─────────────────────
 * Naheliegend wäre, eine Konversations-Reaktion auf den Slot-Eimer der Frage
 * zu buchen, die gerade beantwortet wurde. Das wäre aus drei Gründen falsch:
 *
 *  · ZWECK. Der Slot-Eimer begrenzt ANLÄUFE AN EINEM ENTWURF („zehn Versuche
 *    am Elevator-Pitch sind reichlich"). Eine Antwort im Gespräch ist kein
 *    Anlauf an einem Entwurf — sie ist das INTERVIEW, aus dem der Entwurf
 *    später überhaupt erst entsteht. Beides in einen Zähler zu legen hiesse:
 *    wer ausführlich antwortet, verliert genau dadurch die Entwürfe, für die
 *    er geantwortet hat.
 *  · REICHWEITE. Eine FREIE Frage („was meinst du mit Positionierung?") hat
 *    gar keinen Slot. Der Slot-Eimer hätte für die Hälfte der Fälle keinen
 *    Schlüssel und bräuchte ohnehin einen Rückfall.
 *  · AUSKUNFT. Zwei Kostenarten unter einem Zähler können nicht mehr sagen,
 *    WELCHE aufgebraucht ist — „für dieses Feld hat George genug Anläufe
 *    gemacht" wäre nach einem Gespräch schlicht gelogen.
 *
 * Der Eimer hängt am BRANDING (nicht am Konto): das Gespräch gehört zu EINEM
 * Branding, und wer zwei Marken baut, führt zwei Gespräche. Die Rechnung des
 * MENSCHEN begrenzt weiterhin der Konto-Deckel dahinter.
 *
 * ── DER KILL-SWITCH IST NICHT HIER ────────────────────────────────────────
 * `app_config.brandAiEnabled` (system-038) ist die LAUFZEIT-Klinke und wird in
 * der Route VOR jeder Buchung gelesen (`readBrandAiEnabled`). Ein Deckel von 0
 * wäre der falsche Aus-Schalter — er sähe aus wie ein Ausfall, statt zu sagen,
 * dass George gerade nicht entwirft. Deshalb kennt `resolveBrandAiInstanceCap`
 * keine 0.
 */

// ── Die Zahlen ─────────────────────────────────────────────────────────────

/**
 * Der Deckel des KONTOS, über alle Brands hinweg. Ohne `profileId` im
 * Schlüssel, und das ist der Punkt: wer drei Marken baut, hat trotzdem EINE
 * Rechnung (dieselbe Begründung wie bei `ugcTranslationDayKey`).
 */
export const BRAND_AI_ACCOUNT_DAILY_LIMIT = 200

/**
 * Der Deckel je Brand UND Slot-Typ (`slotId` IST der Typ). Er begrenzt das
 * Ausfransen: zehn Anläufe an einem Elevator-Pitch sind reichlich, der elfte
 * ist kein Entwurf mehr, sondern eine Suche nach dem Zufall.
 */
export const BRAND_AI_SLOT_DAILY_LIMIT = 10

/**
 * Der Deckel des GESPRÄCHS je Branding (P3.2): so viele Berater-Reaktionen auf
 * getippte Antworten und freie Fragen an EINEM Tag.
 *
 * 40 ist aus der Arbeit gerechnet, nicht geschätzt: die neun Bausteine haben
 * zusammen rund vierzig Menschenfragen. Ein voller Durchgang durch das ganze
 * Fundament passt also an einem Tag hinein — wer darüber hinaus in EINEM
 * Branding weiterredet, führt kein Interview mehr. Dahinter greifen unverändert
 * der Konto-Deckel (200) und der Instanz-Deckel.
 */
export const BRAND_AI_TALK_DAILY_LIMIT = 40

/**
 * Höchstens zwei GLEICHZEITIGE Läufe je Konto. Gezählt wird im Prozess — mit
 * derselben bewussten Grenze wie die Generierungs-Sperre in
 * `server/utils/brandGenerators.ts`: bei mehreren Node-Prozessen (pm2-Cluster)
 * zählt jeder für sich, aus 2 würden 2×Worker. Der Schaden bliebe klein (die
 * drei TAGES-Deckel liegen im geteilten Rate-Limit-Store und greifen weiter),
 * und ein prozessübergreifender Burst-Zähler ist der nächste Schritt, sobald
 * `branding` je im Cluster läuft.
 */
export const BRAND_AI_PARALLEL_LIMIT = 2

/**
 * DAS KOSTEN-NETZ DES BETREIBERS: höchstens so viele echte Generierungen je
 * Tag über ALLE Konten. 1000 ist bewusst konservativ gewählt — bei 200 je
 * Konto sind das fünf Konten, die ihr Tageskontingent voll ausschöpfen, und in
 * der Beta-Phase des Wizards gibt es keine fünf solchen Konten. Der Deckel ist
 * kein Produktversprechen, sondern die Reissleine gegen die Rechnung, die
 * niemand kommen sah (ein Skript mit fünfzig Einladungscodes, ein Fehler in
 * einem künftigen Auto-Retry). Er gehört ANGEHOBEN, wenn er echte Nutzung
 * abschneidet — dafür ist er konfigurierbar (`pukalani.brand.aiDailyInstanceCap`).
 */
export const BRAND_AI_INSTANCE_DAILY_DEFAULT = 1000

/**
 * Das Fenster aller drei Tages-Deckel: rollierende 24 Stunden, kein
 * Kalendertag — sonst wäre um Mitternacht schlagartig wieder alles offen.
 */
export const BRAND_AI_DAY_WINDOW_MS = 24 * 60 * 60_000

export interface BrandAiLimits {
  parallel: number
  slotDay: number
  talkDay: number
  accountDay: number
  instanceDay: number
}

export const BRAND_AI_LIMITS: BrandAiLimits = {
  parallel: BRAND_AI_PARALLEL_LIMIT,
  slotDay: BRAND_AI_SLOT_DAILY_LIMIT,
  talkDay: BRAND_AI_TALK_DAILY_LIMIT,
  accountDay: BRAND_AI_ACCOUNT_DAILY_LIMIT,
  instanceDay: BRAND_AI_INSTANCE_DAILY_DEFAULT,
}

/**
 * Der Instanz-Deckel aus der App-Konfiguration — oder der Default. Nur eine
 * endliche GANZE Zahl grösser als 0 zählt: ein `0`, ein `-5` oder ein
 * versehentliches `"1000"` würden sonst die KI abschalten, ohne dass irgendwo
 * „aus" stünde. Abschalten geht über `app_config.brandAiEnabled`, und nur dort
 * sagt die Oberfläche auch den richtigen Satz dazu.
 */
export function resolveBrandAiInstanceCap(configured: unknown): number {
  return typeof configured === 'number' && Number.isInteger(configured) && configured > 0
    ? configured
    : BRAND_AI_INSTANCE_DAILY_DEFAULT
}

// ── Die Eimer-Schlüssel ────────────────────────────────────────────────────

/** Alle Generierungen EINES Kontos, über alle Brands und alle Slots. */
export function brandAiAccountDayKey(userId: string): string {
  return `brand-ai-day:${userId}`
}

/**
 * Ein Brand, ein Slot-TYP. `slotId` ist der Typ (`a.pitch`, `b.purpose`) — es
 * gibt je Brand höchstens einen davon, deshalb braucht es hier keinen dritten
 * Bestandteil.
 */
export function brandAiSlotDayKey(profileId: string, slotId: string): string {
  return `brand-ai-slot-day:${profileId}:${slotId}`
}

/**
 * DAS GESPRÄCH EINES BRANDINGS (P3.2) — ohne Slot und ohne Konto im Schlüssel.
 * Ohne Slot, weil eine freie Frage keinen hat; ohne Konto, weil zwei Marken
 * zwei Gespräche sind (die Rechnung des Menschen deckelt `brandAiAccountDayKey`).
 */
export function brandAiTalkDayKey(profileId: string): string {
  return `brand-ai-talk-day:${profileId}`
}

/**
 * EIN Eimer für die ganze Instanz — ohne Konto, ohne Brand. Er liegt im
 * geteilten Rate-Limit-Store und ist damit auch über mehrere Prozesse hinweg
 * EIN Deckel (mit Redis; ohne Redis zählt jede Instanz für sich, wie überall).
 */
export function brandAiInstanceDayKey(): string {
  return 'brand-ai-instance-day'
}

// ── Die Ablehnungsgründe ───────────────────────────────────────────────────

/**
 * Sie reisen als `data.code` in der 429 und werden vom zentralen Fehler-Handler
 * (`core/server/error.ts`) als `reason` ins Envelope gehoben. FÜNF Codes statt
 * eines, weil sie dem Menschen VERSCHIEDENE Dinge sagen: „gleich wieder" (busy)
 * ist etwas anderes als „morgen wieder" (Tag), als „nicht an dir" (Instanz) und
 * als „für dieses Feld genug Anläufe" gegenüber „für heute genug geredet".
 */
export const BRAND_AI_BUSY_CODE = 'brand_ai_busy'
export const BRAND_AI_SLOT_LIMIT_CODE = 'brand_ai_slot_limit'
export const BRAND_AI_TALK_LIMIT_CODE = 'brand_ai_talk_limit'
export const BRAND_AI_DAILY_LIMIT_CODE = 'brand_ai_daily_limit'
export const BRAND_AI_INSTANCE_LIMIT_CODE = 'brand_ai_instance_limit'

export type BrandAiRejectionCode =
  | typeof BRAND_AI_BUSY_CODE
  | typeof BRAND_AI_SLOT_LIMIT_CODE
  | typeof BRAND_AI_TALK_LIMIT_CODE
  | typeof BRAND_AI_DAILY_LIMIT_CODE
  | typeof BRAND_AI_INSTANCE_LIMIT_CODE

const REJECTION_CODES: readonly string[] = [
  BRAND_AI_BUSY_CODE,
  BRAND_AI_SLOT_LIMIT_CODE,
  BRAND_AI_TALK_LIMIT_CODE,
  BRAND_AI_DAILY_LIMIT_CODE,
  BRAND_AI_INSTANCE_LIMIT_CODE,
]

/** Kam da ein Grund zurück, den wir kennen? (Der Client liest fremde Antworten.) */
export function isBrandAiRejectionCode(value: unknown): value is BrandAiRejectionCode {
  return typeof value === 'string' && REJECTION_CODES.includes(value)
}

/**
 * WELCHER HINWEIS ERSCHEINT — Abbildung Code → i18n-Schlüssel, pur und hier,
 * damit sie ohne Vue prüfbar ist (dasselbe Muster wie
 * `ugcTranslationErrorKey`). `null` heisst „kein Drossel-Grund" — die Seite
 * fällt dann auf ihren bisherigen Text zurück.
 */
export function brandAiRejectionMessageKey(value: unknown): string | null {
  if (!isBrandAiRejectionCode(value)) return null
  if (value === BRAND_AI_BUSY_CODE) return 'brand.workspace.generate.parallelLimit'
  if (value === BRAND_AI_SLOT_LIMIT_CODE) return 'brand.workspace.generate.slotLimit'
  // Der Gesprächs-Deckel liegt im `generate.*`-Knoten, obwohl er das Gespräch
  // betrifft: das ist der EINE Ort für Drossel-Hinweise, und ein zweiter
  // Knoten hiesse, dass diese Abbildung künftig zwei Präfixe kennen muss.
  if (value === BRAND_AI_TALK_LIMIT_CODE) return 'brand.workspace.generate.talkLimit'
  if (value === BRAND_AI_DAILY_LIMIT_CODE) return 'brand.workspace.generate.dailyLimit'
  return 'brand.workspace.generate.instanceLimit'
}

// ── Die Entscheidung ───────────────────────────────────────────────────────

export interface BrandAiQuotaCounts {
  /** Laufende Generierungen dieses Kontos, EINSCHLIESSLICH der neuen. */
  parallel: number
  /** Zählerstand des Slot-Eimers nach dieser Buchung. */
  slotDay: number
  /**
   * Zählerstand des Gesprächs-Eimers nach dieser Buchung (P3.2).
   *
   * In EINEM Aufruf ist immer nur einer der beiden engen Zähler belegt — ein
   * Entwurf bucht `slotDay`, ein Gesprächszug `talkDay`, der jeweils andere
   * bleibt 0 und kann deshalb nie ein Nein erzeugen.
   */
  talkDay: number
  /** Zählerstand des Konto-Eimers nach dieser Buchung. */
  accountDay: number
  /** Zählerstand des Instanz-Eimers nach dieser Buchung. */
  instanceDay: number
}

/**
 * DER ERSTE VERLETZTE DECKEL — oder `null`, wenn der Lauf laufen darf.
 *
 * ── DIE REIHENFOLGE IST DIE AUSSAGE: ENG VOR WEIT ─────────────────────────
 * Burst → Slot bzw. Gespräch → Konto → Instanz. Der Aufrufer BUCHT in genau dieser Folge und
 * hört beim ersten Nein auf, denn ein `hit` zählt IMMER: stünde der Konto-Eimer
 * vor dem Slot-Eimer, fräse jeder am Slot-Deckel abgewiesene Versuch ein
 * Tageskontingent — wer an einer Frage hängen bleibt, verlöre seinen Tag
 * (dieselbe Sorgfalt wie in `posts/.../translate.post.ts`). Und der Instanz-
 * Deckel steht zuletzt, weil kein Einzelner an seinem eigenen Limit die
 * Rechnung des Betreibers belasten soll.
 *
 * NOCH NICHT GEMESSENE Zähler übergibt der Aufrufer als `0`. Das ist keine
 * Krücke, sondern der Normalfall eines leeren Eimers — und weil jedes Limit
 * mindestens 1 ist, kann eine 0 nie ein Nein erzeugen.
 *
 * `>` statt `>=`, weil `store.hit()` den Zähler EINSCHLIESSLICH dieses Laufs
 * zurückgibt: der 200. Lauf des Tages ist erlaubt, der 201. nicht.
 */
export function decideBrandAiQuota(
  counts: BrandAiQuotaCounts,
  limits: BrandAiLimits = BRAND_AI_LIMITS,
): BrandAiRejectionCode | null {
  if (counts.parallel > limits.parallel) return BRAND_AI_BUSY_CODE
  if (counts.slotDay > limits.slotDay) return BRAND_AI_SLOT_LIMIT_CODE
  if (counts.talkDay > limits.talkDay) return BRAND_AI_TALK_LIMIT_CODE
  if (counts.accountDay > limits.accountDay) return BRAND_AI_DAILY_LIMIT_CODE
  if (counts.instanceDay > limits.instanceDay) return BRAND_AI_INSTANCE_LIMIT_CODE
  return null
}
