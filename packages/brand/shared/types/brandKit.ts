/**
 * DIE FORM DES KITS — DTCG-TOKENS, DATEI-REGISTRY UND DIE ZWEI ANTWORTEN
 * (Konzept docs/plans/BRAND-BOOK-KIT.md §2.6/§2.9, Paket K2).
 *
 * ── WARUM DIE TYPEN HIER STEHEN UND NICHT IN `brand.ts` ───────────────────
 * `shared/types/brand.ts` trägt die Wahrheit über MARKE und DESIGN (Preset,
 * Journey, Sessions) — sie wird von jeder Seite und fast jeder Route gelesen.
 * Das Kit ist eine AUSLIEFERUNG davon: eine Datei-Form, ein Manifest und zwei
 * Routen. Eine eigene Datei hält die 2 300 Zeilen daneben frei von einem
 * Format, das nur zwei Erzeuger und zwei Leser hat — und sie macht sichtbar,
 * dass K3 (Brand Context) und K6 (Bündel) hier andocken, nicht dort.
 *
 * ── DIE DTCG-FORM IST DIE NORM, NICHT UNSERE ─────────────────────────────
 * Alles unterhalb von `BrandTokenFile` folgt dem Design Tokens Format Module
 * 2025.10 (designtokens.org, erste stabile Fassung; Anhang A des Konzepts):
 * `$type`/`$value`/`$description`/`$extensions`, Farben als Objekt mit
 * `colorSpace`/`components`/`hex`, Maße und Dauern als Objekt mit `unit`,
 * Easing als vier Zahlen, Aliasse als `{gruppe.token}`. Wo wir etwas sagen
 * wollen, das die Norm nicht kennt (Kontrast-Belege, die Prozent-Rundung des
 * Zeichens, unsere Fassung), steht es unter `$extensions` mit dem Präfix
 * `supply.branding/` — genau dafür ist das Feld da, und ein Fremdfeld neben
 * `$value` würde jeden Importeur (Figma, Style Dictionary) stolpern lassen.
 *
 * ── GRUPPEN MIT FREIEN NAMEN TRAGEN EINE INDEX-SIGNATUR ──────────────────
 * Rollen, Skalen-Stufen und Bewegungs-Tokens heißen so, wie die Marke sie
 * nennt — ihre Gruppen haben deshalb `[name: string]` neben `$description`,
 * und der Wert-Typ schließt `string` ein, weil `$description` selbst ein
 * String ist. Wer eine solche Gruppe liest, überspringt Schlüssel mit `$` und
 * prüft mit `typeof` — beides steht in `brandTokensCss.ts` genau einmal.
 *
 * DIESE DATEI IST PUR: nur Typen, kein Code, kein i18n, kein H3.
 */

// ── DTCG-Werte ─────────────────────────────────────────────────────────────

/**
 * Eine Farbe nach 2025.10: Farbraum, Kanäle 0–1 und der Hex als RÜCKFALL.
 * Der Hex ist keine Doppelung, sondern der von Style Dictionary 5.4
 * dokumentierte Weg für Werkzeuge, die den Farbraum (noch) nicht lesen
 * (§2.17).
 */
export interface BrandTokenColorValue {
  colorSpace: 'srgb'
  /** Rot, Grün, Blau als 0–1, auf vier Nachkommastellen gerundet. */
  components: [number, number, number]
  hex: string
}

/** Ein Maß — die Norm kennt genau diese zwei Einheiten. */
export interface BrandTokenDimensionValue {
  value: number
  unit: 'px' | 'rem'
}

/** Eine Dauer — Millisekunden, wie das Preset sie führt. */
export interface BrandTokenDurationValue {
  value: number
  unit: 'ms'
}

/** Vier Zahlen, wie in CSS: x1, y1, x2, y2. */
export type BrandTokenCubicBezierValue = [number, number, number, number]

/**
 * Der Typografie-Verbund. `fontFamily` ist hier ein ALIAS (`{font.heading}`),
 * damit ein Schriftwechsel eine Stelle ist und nicht sechs.
 */
export interface BrandTokenTypographyValue {
  fontFamily: string
  fontSize: BrandTokenDimensionValue
  fontWeight: number
  lineHeight: number
  letterSpacing?: BrandTokenDimensionValue
}

// ── Unsere Erweiterungen (`$extensions`) ───────────────────────────────────

/** Der Schlüssel unter `$extensions` — EIN Präfix für alles Eigene. */
export const BRAND_TOKEN_EXTENSION_META = 'supply.branding/meta'
export const BRAND_TOKEN_EXTENSION_CONTRAST = 'supply.branding/contrast'
export const BRAND_TOKEN_EXTENSION_MARK = 'supply.branding/mark'
export const BRAND_TOKEN_EXTENSION_TYPE = 'supply.branding/type'
/**
 * DER GEHOBENE DUNKELMODUS-AKZENT (Davids Entscheidung §2.20 Nr. 7, 2026-09-09).
 *
 * Kailuas Akzent (#2f4a3a) erreicht auf der dunklen Fläche 1,8:1. Statt die
 * Markenfarbe wörtlich zu lassen und nur „unter AA" zu zeigen, bekommt
 * `color.dark.accent` einen eigenen Alias auf die erste Stufe der
 * Akzent-Rampe, die AA erreicht — und das GEMESSENE Urteil des Originals
 * bleibt hier als Beleg stehen. Der Leser sieht beides: was die Marke
 * wollte, und warum das Token davon abweicht.
 */
export const BRAND_TOKEN_EXTENSION_ACCENT_LIFT = 'supply.branding/accent-lift'

/** Beleg der Hebung: das Original, der Grund, die gewählte Stufe. */
export interface BrandTokenAccentLift {
  /** Der Alias des Originals — `{color.accent}`. */
  from: string
  /** Die dunkle Fläche, gegen die gemessen wurde (Hex). */
  ground: string
  /** Das Urteil des ORIGINALS auf dieser Fläche — der Grund der Hebung. */
  measured: { ratio: number, level: 'AAA' | 'AA' | 'AA18' | 'fail' }
  /** Die gewählte Stufe der Akzent-Rampe und ihr Urteil. */
  lifted: { shade: number, ratio: number, level: 'AAA' | 'AA' | 'AA18' | 'fail' }
}

/** Der Kopf der Datei: unsere Fassung, der Stand, wer sie gebaut hat. */
export interface BrandTokenMeta {
  /** Fassung UNSERES Aufbaus (nicht die der Norm). */
  formatVersion: number
  /** ISO-Stempel des jüngsten beteiligten Kapitels (`brandDesignStand`). */
  stand: string
  generator: string
  /** Die Fassung des Preset-Formats, aus dem gerechnet wurde. */
  presetVersion: number
}

/**
 * DER KONTRAST-BELEG EINER ROLLE — ein Verweis auf eines der sechs GEPRÜFTEN
 * Paare des Presets, nie eine eigene Messung.
 *
 * Er steht als Erweiterung und nicht als Token, weil ein Verhältnis kein Wert
 * ist, den jemand einsetzt (§2.6: „sie sind Beleg, kein Token"). Rollen, die
 * in keinem der sechs Paare vorkommen, bekommen KEINEN Beleg — ein erfundener
 * wäre schlimmer als keiner.
 */
export interface BrandTokenContrast {
  /** Id aus `preset.color.contrastPairs`. */
  pair: string
  ratio: number
  level: 'AAA' | 'AA' | 'AA18' | 'fail'
}

// ── DTCG-Tokens ────────────────────────────────────────────────────────────

export interface BrandColorToken {
  $type: 'color'
  $value: BrandTokenColorValue
  $description?: string
}

/** Eine Rolle: ein ALIAS in eine Rampe, plus ihr Beleg. */
export interface BrandColorAliasToken {
  $type: 'color'
  /** `{color.brand.600}` — ein Verweis, kein Wert. */
  $value: string
  $description?: string
  $extensions?: {
    [BRAND_TOKEN_EXTENSION_CONTRAST]?: BrandTokenContrast
    [BRAND_TOKEN_EXTENSION_ACCENT_LIFT]?: BrandTokenAccentLift
  }
}

export interface BrandFontFamilyToken {
  $type: 'fontFamily'
  /** Der vollständige Stack, erste Familie zuerst. */
  $value: string[]
  $description?: string
}

export interface BrandFontWeightToken {
  $type: 'fontWeight'
  $value: number
  $description?: string
}

export interface BrandDimensionToken {
  $type: 'dimension'
  $value: BrandTokenDimensionValue
  $description?: string
  $extensions?: { [BRAND_TOKEN_EXTENSION_MARK]?: { radiusPercent: number, referenceTileRem: number } }
}

export interface BrandDurationToken {
  $type: 'duration'
  $value: BrandTokenDurationValue
  $description?: string
}

export interface BrandCubicBezierToken {
  $type: 'cubicBezier'
  $value: BrandTokenCubicBezierValue
  $description?: string
}

export interface BrandTypographyToken {
  $type: 'typography'
  $value: BrandTokenTypographyValue
  $description?: string
  $extensions?: { [BRAND_TOKEN_EXTENSION_TYPE]?: { uppercase: boolean } }
}

// ── DTCG-Gruppen ───────────────────────────────────────────────────────────

/** Eine Rampe: elf Stufen, benannt wie die Themes-Engine sie nennt. */
export interface BrandRampTokenGroup {
  $description: string
  [shade: string]: string | BrandColorToken
}

/** Die Rollen eines Modus — freie Namen, deshalb die Index-Signatur (s. Kopf). */
export interface BrandColorRoleTokenGroup {
  $description: string
  [roleId: string]: string | BrandColorAliasToken
}

/** Die Größen-Leiter: je Stufe ein Verbund UND ein Einzel-Maß (`h1-size`). */
export interface BrandTypeScaleTokenGroup {
  $description: string
  [stepId: string]: string | BrandTypographyToken | BrandDimensionToken
}

export interface BrandDurationTokenGroup {
  $description: string
  [tokenId: string]: string | BrandDurationToken
}

export interface BrandEasingTokenGroup {
  $description: string
  [easingId: string]: string | BrandCubicBezierToken
}

// ── Die Datei ──────────────────────────────────────────────────────────────

/**
 * `tokens.json` — EINE Datei, Hell und Dunkel als GESCHWISTER-GRUPPEN
 * (Entscheidung §2.20 Nr. 1). Die Norm kennt keine Modi; Figma bildet die
 * Gruppen auf zwei Modi ab, Style Dictionary auf zwei Sets.
 */
export interface BrandTokenFile {
  $description: string
  $extensions: { [BRAND_TOKEN_EXTENSION_META]: BrandTokenMeta }
  color: {
    brand: BrandRampTokenGroup
    'brand-dark': BrandRampTokenGroup
    neutral: BrandRampTokenGroup
    accent: BrandColorToken
    /** Die Rampe des Akzents für den dunklen Modus — Ziel der Hebung (§2.20 Nr. 7). */
    'accent-dark': BrandRampTokenGroup
    light: BrandColorRoleTokenGroup
    dark: BrandColorRoleTokenGroup
  }
  font: {
    heading: BrandFontFamilyToken
    body: BrandFontFamilyToken
    mono: BrandFontFamilyToken
    weight: {
      heading: BrandFontWeightToken
      body: BrandFontWeightToken
    }
  }
  type: { scale: BrandTypeScaleTokenGroup }
  radius: { mark: BrandDimensionToken }
  motion: {
    duration: BrandDurationTokenGroup
    easing: BrandEasingTokenGroup
  }
}

/** Was `buildBrandTokens` außer dem Preset braucht — Marke, Stand, Sprache. */
export interface BrandTokenMetaInput {
  title: string
  /** ISO-Stempel, wie ihn `brandDesignStand` liefert; '' ist erlaubt. */
  stand: string
  /** Sprache der `$description`-Texte; Token-NAMEN sind sprachneutral (§2.17). */
  locale: string
}

// ── Die Registry und die zwei Antworten (§2.9) ────────────────────────────

/** Die geschlossene Liste der Kit-Dateien — s. `shared/brandKitFiles.ts`. */
export type BrandKitFileId =
  | 'tokens.json'
  | 'tokens.css'
  | 'licenses.md'
  | 'brand.md'
  | 'brand.json'
  | 'readme.md'

export interface BrandKitFile {
  id: BrandKitFileId
  /** Dateiname OHNE Marken-Stamm — den setzt die Route aus Slug und Stand. */
  filename: string
  mime: string
  /** Braucht sie das Design-Preset? Ohne Preset ⇒ 409 `kit_file_unavailable`. */
  needsDesign: boolean
}

/** Warum eine Datei (noch) nicht abrufbar ist. */
export type BrandKitFileReason = 'design_missing' | 'not_built_yet'

export interface BrandKitManifestFile {
  id: BrandKitFileId
  /** Der Dateiname, den der Download trägt (mit Slug und Stand). */
  filename: string
  available: boolean
  reason?: BrandKitFileReason
  /** Größe in Bytes — nur bei `available`, gerechnet wie der Download selbst. */
  bytes?: number
}

export interface BrandKitManifest {
  profileId: string
  title: string
  /** ISO-Stempel des jüngsten Design-Kapitels; '' ohne Preset. */
  stand: string
  designReady: boolean
  files: BrandKitManifestFile[]
}
