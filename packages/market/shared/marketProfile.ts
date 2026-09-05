/**
 * DER VERGLEICHS-VERTRAG — das Marktprofil (Plan §2.2,
 * docs/plans/BRAND-MARKTVERGLEICH.md).
 *
 * PROTOTYP (M0) — ERSTE FASSUNG, die M1 fortführt: hier stehen die TYPEN und
 * die Abbildung `MARKET_FIELDS` auf die Slot-Ids der brand-Registry. Was
 * BEWUSST noch fehlt und mit M1 kommt: das Zod-Schema, die Prüfung
 * `evidence ⊂ rawText` und der Test, der jede Abbildung gegen die
 * brand-Registry hält (jede Id muss auf einen existierenden, nicht
 * deaktivierten Slot zeigen).
 *
 * ── WARUM DIE SLOT-IDS HIER ALS ZEICHENKETTEN STEHEN ──────────────────────
 * `market` importiert `brand` NICHT (CONCEPT A14, Plan §2.1): die Kopplung
 * wird ein EXPLIZITER Vertrag, kein relativer Sprung in ein fremdes Paket.
 * Bis der Vertrag steht, ist die Id eine Zeichenkette — und der Test aus M1
 * ist genau die Sicherung, die eine Zeichenkette braucht. Ein Tippfehler wäre
 * sonst eine Zeile, die im Vergleich einfach leer bleibt.
 *
 * ── WAS NICHT INS MARKTPROFIL GEHÖRT (§2.2, Absatz „Nicht im Marktprofil") ─
 * Gründungsimpuls, Beschwerden, Konfliktregel, Vision-Zehnjahres-Bild und
 * Manifest. Sie sind von aussen nicht ehrlich ableitbar; ein Modell, das sie
 * trotzdem füllt, erfindet sie.
 */

/** Die zehn Felder, die man von AUSSEN über eine Marke sagen kann (§2.2). */
export const MARKET_FIELD_IDS = [
  'categoryLanguage',
  'pitch',
  'audience',
  'firstChoice',
  'purpose',
  'values',
  'toneWords',
  'tagline',
  'keyMessages',
  'distinctiveAsset',
] as const

export type MarketFieldId = (typeof MARKET_FIELD_IDS)[number]

/**
 * DIE FORM eines Feldes — sie steuert die Anzeige (eine Zeile, ein Satz, eine
 * Liste) UND später die Klemmung der Modell-Antwort. Sie steht am Feld und
 * nicht in der Komponente, damit beide Enden dieselbe Erwartung haben.
 */
export type MarketFieldForm = 'shortText' | 'sentence' | 'list'

export interface MarketFieldDefinition {
  readonly id: MarketFieldId
  /**
   * Die EIGENEN Felder, gegen die verglichen wird — Slot-Ids der
   * brand-Registry. Mehrere heisst: der Vergleich zieht sie zusammen
   * (`categoryLanguage` liest `a.category` UND `b.positioningCategory`).
   */
  readonly slotIds: readonly string[]
  readonly form: MarketFieldForm
  /** Deckel für `list`-Felder (§2.2: Werte ≤ 5, Tonwörter ≤ 5, Botschaften ≤ 3). */
  readonly maxItems?: number
}

/** Die Abbildung aus §2.2, in der Reihenfolge der Tabelle dort. */
export const MARKET_FIELDS: readonly MarketFieldDefinition[] = [
  { id: 'categoryLanguage', slotIds: ['a.category', 'b.positioningCategory'], form: 'shortText' },
  { id: 'pitch', slotIds: ['a.pitch'], form: 'sentence' },
  { id: 'audience', slotIds: ['a.audienceSketch'], form: 'sentence' },
  { id: 'firstChoice', slotIds: ['b.positioningFirstChoice'], form: 'sentence' },
  { id: 'purpose', slotIds: ['b.purpose'], form: 'sentence' },
  { id: 'values', slotIds: ['c.final'], form: 'list', maxItems: 5 },
  { id: 'toneWords', slotIds: ['d.toneWords'], form: 'list', maxItems: 5 },
  { id: 'tagline', slotIds: ['ep.taglines'], form: 'shortText' },
  { id: 'keyMessages', slotIds: ['ep.keyMessages'], form: 'list', maxItems: 3 },
  { id: 'distinctiveAsset', slotIds: ['ep.distinctiveAsset'], form: 'shortText' },
]

/** Zitatschranke je Feld (§1.7 Nr. 4) — die Zahl gehört zum Vertrag. */
export const MARKET_EVIDENCE_MAX = 200

/** Höchstzahl Wettbewerber je Branding (§2.9 Nr. 8). */
export const MARKET_COMPETITORS_MAX = 5

/**
 * WIE SICHER IST DIE AUSSAGE? `stated` = wörtlich so gesagt, `implied` = aus
 * mehreren Stellen abgeleitet. Ein drittes Wort gibt es bewusst nicht:
 * „geraten" wäre kein Zustand, sondern ein Grund zum Verwerfen.
 */
export type MarketEvidenceConfidence = 'stated' | 'implied'

/** Der Beleg — ohne ihn gibt es das Feld nicht (§1.10, Halluzinations-Riegel). */
export interface MarketEvidence {
  /** Wörtliches Zitat, höchstens `MARKET_EVIDENCE_MAX` Zeichen. */
  readonly quote: string
  /** Die Seite, auf der es steht — vollständige URL. */
  readonly sourceUrl: string
  /** Abrufdatum (ISO, Tagesgenauigkeit reicht). */
  readonly fetchedAt: string
  readonly confidence: MarketEvidenceConfidence
}

/**
 * EIN FELD EINES MARKTPROFILS. `value` LEER heisst „nicht öffentlich
 * formuliert" — und das ist eine Aussage über die Kategorie, kein Fehler
 * (§1.10). Deshalb bleibt das Feld in der Liste stehen, statt zu fehlen.
 */
export interface MarketProfileField {
  readonly fieldId: MarketFieldId
  readonly value: string
  /** Nur bei `form: 'list'` gefüllt. */
  readonly items?: readonly string[]
  /** Fehlt, wenn `value` leer ist — sonst Pflicht. */
  readonly evidence?: MarketEvidence
}

export type MarketCompetitorStatus = 'pending' | 'reading' | 'fetched' | 'excluded' | 'failed'

/**
 * WARUM EIN WETTBEWERBER NICHT AUSGEWERTET WIRD. Die Gründe sind AUFZÄHLBAR,
 * weil der Kunde sie in ehrlichen Worten lesen soll (§2.3) — ein freier Text
 * vom Server wäre in der zweiten Sprache nicht übersetzt.
 */
export type MarketExclusionReason = 'robots' | 'tdm' | 'noText' | 'unreachable'

export interface MarketCompetitor {
  readonly id: string
  /** Kommt als VORSCHLAG aus `a.competitors` — die Adresse trägt der Kunde ein. */
  readonly name: string
  readonly url: string
  readonly status: MarketCompetitorStatus
  readonly excludedReason?: MarketExclusionReason
  /** Welche Seiten gelesen wurden — die Belege zeigen darauf. */
  readonly pagesRead?: readonly string[]
  readonly fetchedAt?: string
}

/** Das Marktprofil EINES Wettbewerbers. */
export interface MarketProfile {
  readonly competitorId: string
  readonly fields: readonly MarketProfileField[]
}

/** Ein Beleg MIT Absender — für die drei Listen und die Profil-Karten. */
export interface MarketCitation {
  readonly competitorId: string
  readonly competitorName: string
  readonly evidence: MarketEvidence
}

export type MarketClaimKind = 'convention' | 'overlap' | 'whitespace'

/**
 * EIN EINTRAG DER DREI LISTEN (§2.3 Schritt 4).
 *
 * `statement` steht in der INHALTSSPRACHE der Marke und läuft NICHT über
 * i18n — es ist der Satz, den jemand gesagt hat (oder bei `whitespace` die
 * Frage, die niemand beantwortet). Die Zahlen daneben („3 von 3 sagen das")
 * sind Oberfläche und tragen Platzhalter.
 */
export interface MarketClaimEntry {
  readonly id: string
  readonly fieldId: MarketFieldId
  readonly statement: string
  /** Nur bei `convention`/`overlap`: wie viele im Feld sagen es, von wie vielen. */
  readonly sharedBy?: number
  readonly of?: number
  readonly citations?: readonly MarketCitation[]
}

export interface MarketClaimList {
  readonly kind: MarketClaimKind
  readonly entries: readonly MarketClaimEntry[]
}

/**
 * EIN MARKT-BEFUND (§2.3, Art `market` im Befund-Speicher des brand-Layers).
 *
 * EIN EIGENES FELD, nie zwei: ein Markt-Befund richtet sich IMMER an die
 * eigene Marke („euer Satz klingt wie …"), nie an einen Dritten — anders als
 * ein `conflict`, der zwei eigene Felder gegeneinander stellt. Und er nennt
 * keinen Wettbewerber: § 6 UWG greift, sobald ein Mitbewerber erkennbar ist
 * (§2.9 Nr. 5).
 */
export type MarketFindingStatus = 'open' | 'accepted' | 'dismissed'

export interface MarketFinding {
  readonly id: string
  /** Slot-Id des EIGENEN Feldes. */
  readonly slotId: string
  readonly why: string
  /** Bei Markt-Befunden Pflicht — ein Hinweis ohne Vorschlag ist eine Sorge. */
  readonly suggestion: string
  readonly status: MarketFindingStatus
}

/** Der Lauf-Zustand eines Wettbewerbers (Oberfläche des Fortschritts, §2.11 Nr. 2). */
export interface MarketRunStep {
  readonly competitorId: string
  readonly name: string
  readonly status: MarketCompetitorStatus
  readonly robotsChecked: boolean
  readonly pagesRead: number
  readonly excludedReason?: MarketExclusionReason
}

export type MarketRunPhase = 'idle' | 'running' | 'comparing' | 'done'

/** Der Bericht je Stand (§2.6 `market_reports`). */
export interface MarketReport {
  readonly createdAt: string
  /** Hash über Foundation-Revisionen, URL-Liste und Abrufstände (§2.3 Nr. 5). */
  readonly revisionKey: string
  readonly own: readonly MarketProfileField[]
  readonly competitors: readonly MarketCompetitor[]
  readonly profiles: readonly MarketProfile[]
  readonly claims: readonly MarketClaimList[]
  readonly findings: readonly MarketFinding[]
}

/** Das Feld einer Profil-Liste holen — fehlt es, gilt „nicht formuliert". */
export function marketField(
  fields: readonly MarketProfileField[],
  fieldId: MarketFieldId,
): MarketProfileField | undefined {
  return fields.find(field => field.fieldId === fieldId)
}
