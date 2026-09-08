/**
 * DIE PURE REGEL VON BRAND DESIGN — aus den bestätigten Slot-Werten der sechs
 * Kapitel wird EIN `BrandDesignPreset` (Konzept docs/plans/BRAND-DESIGN.md
 * §2.8, Paket D0).
 *
 * ── DIESELBE WAHRHEIT WIE `buildBrandFoundation`, KEIN SPIEGEL ────────────
 * Das Preset wird nirgends gespeichert und nirgends nachgeführt: es entsteht
 * bei jedem Aufruf neu aus den Werten. Die einzige eingefrorene Fassung ist
 * die im Snapshot (§2.8) — und die ist ein ABBILD, kein zweiter Stand.
 * Deshalb gibt es hier auch keine Migration und kein `updatedAt`: was sich
 * ändert, sind die Werte, und die haben ihre eigene Zustandsmaschine.
 *
 * ── DER A14-VERTRAG ZUR THEMES-ENGINE (§2.3) ──────────────────────────────
 * Diese Datei ist die EINZIGE Stelle im brand-Layer, die relativ nach
 * `packages/themes` greift, und sie greift dort nur auf `shared/ramp.ts` — die
 * pure Bibliothek (kein `app/`, kein Server, kein Zustand). Nichts anderes aus
 * themes, nirgendwo sonst. Die Engine bleibt unverändert; Brand Design erzeugt
 * nur WERTE in ihrer Form, damit Produkt 03 daraus Tokens und die Platform
 * daraus ein Community-Theme machen KÖNNEN.
 *
 * Der Prototyp (`.playground/app/utils/demoDesign.ts`) hat denselben Import
 * mit derselben Zeilen-Ausnahme geführt — die Zahlen auf dem Bildschirm des
 * Klickdummys sind damit die Zahlen des Produkts.
 *
 * ── UNVOLLSTÄNDIG HEISST `null`, NICHT „halbes Preset" ────────────────────
 * Solange die Schicht läuft, fehlt fast immer etwas. Ein Preset mit leeren
 * Rampen wäre für jeden Leser (Kapitel 10, Vorschau-Szene, Produkt 03) eine
 * Farbwelt, die es nicht gibt; `null` ist die ehrliche Antwort „noch nicht
 * fertig", und jeder Leser hat für sie schon einen Zweig (die Schranke).
 *
 * DIESE DATEI IST PUR: kein i18n, kein H3, kein Appwrite.
 */

/* Der EINZIGE Cross-Layer-Import des brand-Layers (§2.3, CONCEPT.md A14):
 * `themes/shared/ramp.ts` ist die pure Ramp- und Kontrast-Mathematik. Die
 * Ausnahme steht als ZEILEN-Ausnahme, damit der Wächter für alles andere
 * scharf bleibt. */
// eslint-disable-next-line pukalani/no-cross-layer-relative -- Brand Design §2.3: pure Ramp-/Kontrast-Mathematik aus themes/shared, kein anderer themes-Zugriff.
import { contrastRatio, generateNeutralRamp, generateRamp, wcagLevel } from '../../themes/shared/ramp'
import {
  BRAND_DNA_DIMENSION_IDS,
  BRAND_MOTION_STAGGER_MS,
  BRAND_MOTION_TOKENS,
  BRAND_TEMPO_OPTIONS,
  isBrandDnaValue,
} from './brandDesignVocab'
import { brandFontPair } from './brandFontPairs'
import {
  BRAND_RAMP_SHADES,
  type BrandContrastPair,
  type BrandDesignPreset,
  type BrandDesignValues,
  type BrandRamp,
} from './types/brand'

/**
 * Die Fassung des PRESET-FORMATS. Sie steigt, wenn sich die FORM ändert —
 * nicht, wenn ein Vokabular einen Wert dazubekommt.
 */
export const BRAND_DESIGN_PRESET_VERSION = 1

/** Dieselbe Eingabe-Prüfung wie in der Themes-Engine. */
export const BRAND_HEX_RE = /^#[0-9a-f]{6}$/i

export function isBrandHex(value: string | undefined): value is string {
  return typeof value === 'string' && BRAND_HEX_RE.test(value)
}

/**
 * DIE DUNKEL-RAMPE — dieselbe Mathematik mit anderen Enden (Prototyp
 * `dsRampDark`).
 *
 * Die Engine kennt keine zweite Rampe (§2.3: Brand Design erzeugt nur Werte in
 * ihrer Form). Auf dunklem Grund braucht die Marke oben mehr Luft und unten
 * weniger Tiefe, sonst kippt die 900er-Stufe ins Schwarz des Grundes — die drei
 * Parameter sind wörtlich die des abgenommenen Prototyps.
 */
export function brandRampDark(hex: string): BrandRamp | null {
  return generateRamp(hex, { mode: 'perceived', lightnessMax: 92, lightnessMin: 11, saturation: 0.92 })
}

/** Die Hell-Rampe: die Vorgabe der Engine (wahrgenommene OKLCH-Stufen). */
export function brandRampLight(hex: string): BrandRamp | null {
  return generateRamp(hex, { mode: 'perceived' })
}

/** Die getönte Neutral-Rampe — nur der Farbton kommt aus der Quellfarbe. */
export function brandNeutralRamp(hex: string): BrandRamp | null {
  return generateNeutralRamp(hex)
}

export interface BrandContrastVerdict {
  ratio: number
  level: 'AAA' | 'AA' | 'AA18' | 'fail'
}

/** Kontrast zweier Farben mit WCAG-Urteil; `null` bei ungültigem Hex. */
export function brandContrast(foreground: string, background: string): BrandContrastVerdict | null {
  const ratio = contrastRatio(foreground, background)
  if (ratio === null) return null
  return { ratio, level: wcagLevel(ratio) }
}

/**
 * WELCHE FARBE TÖNT DIE NEUTRAL-RAMPE (§2.3 `h.neutral`).
 *
 * `tinted` nimmt die Basisfarbe; `warm` und `cool` verschieben den Ton, ohne
 * eine zweite Marken-Farbe einzuführen. Die zwei Konstanten stehen hier und
 * nicht im Vokabular: sie sind Rechen-Eingaben, keine Auswahl-Beschriftung.
 */
const NEUTRAL_WARM = '#8a7a68'
const NEUTRAL_COOL = '#68767a'

function neutralSourceFor(option: string | undefined, base: string): string {
  if (option === 'warm') return NEUTRAL_WARM
  if (option === 'cool') return NEUTRAL_COOL
  return base
}

/**
 * DIE PAARE DER KONTRAST-MATRIX (§2.3 `h.contrast`).
 *
 * ZWEI QUELLEN, DAMIT DIE PAARE STIMMEN (wörtlich aus dem Prototyp): eine
 * Stufe im VORDERGRUND kommt aus der MARKEN-Rampe (Text trägt die Marke), eine
 * Stufe im HINTERGRUND aus der NEUTRAL-Rampe (Flächen tragen sie nicht). Wer
 * das vertauscht, misst Paare, die auf keiner Seite vorkommen.
 */
interface ContrastPairSpec {
  readonly id: string
  readonly scheme: 'light' | 'dark'
  readonly fg: number | 'accent' | 'paper'
  readonly bg: number | 'paper' | 'ground' | 'accent'
}

const CONTRAST_PAIRS: readonly ContrastPairSpec[] = [
  { id: 'body-light', scheme: 'light', fg: 900, bg: 'paper' },
  { id: 'heading-light', scheme: 'light', fg: 800, bg: 'paper' },
  { id: 'button-light', scheme: 'light', fg: 'paper', bg: 'accent' },
  { id: 'muted-light', scheme: 'light', fg: 700, bg: 100 },
  { id: 'body-dark', scheme: 'dark', fg: 100, bg: 'ground' },
  { id: 'accent-dark', scheme: 'dark', fg: 400, bg: 'ground' },
]

interface ResolvedColors {
  rampLight: BrandRamp
  rampDark: BrandRamp
  neutral: BrandRamp
  accent: string
}

function shadeOf(ramp: BrandRamp, shade: number): string | null {
  const known = (BRAND_RAMP_SHADES as readonly number[]).includes(shade)
  return known ? ramp[shade as keyof BrandRamp] : null
}

function resolveEnd(
  end: ContrastPairSpec['fg'] | ContrastPairSpec['bg'],
  scheme: 'light' | 'dark',
  colors: ResolvedColors,
): string | null {
  if (end === 'accent') return colors.accent
  // „Papier" ist die hellste Stufe der NEUTRAL-Rampe, „Grund" ihre tiefste —
  // beides sind Flächen, und Flächen kommen nie aus der Marken-Rampe.
  if (end === 'paper') return colors.neutral[50]
  if (end === 'ground') return colors.neutral[950]
  const ramp = scheme === 'dark' ? colors.rampDark : colors.rampLight
  return shadeOf(ramp, end)
}

function buildContrastPairs(colors: ResolvedColors): BrandContrastPair[] {
  const pairs: BrandContrastPair[] = []
  for (const spec of CONTRAST_PAIRS) {
    const foreground = resolveEnd(spec.fg, spec.scheme, colors)
    const background = resolveEnd(spec.bg, spec.scheme, colors)
    if (!foreground || !background) continue
    const verdict = brandContrast(foreground, background)
    if (!verdict) continue
    pairs.push({
      id: spec.id,
      scheme: spec.scheme,
      foreground,
      background,
      ratio: verdict.ratio,
      level: verdict.level,
    })
  }
  return pairs
}

/**
 * IST DIE DNA VOLLSTÄNDIG UND GÜLTIG? Alle zehn Dimensionen, jede mit einem
 * Wert aus ihrem Vokabular (§2.2: „was hier steht, muss ein Preset belegen
 * können"). Eine erfundene Wert-Id ist kein „unbekanntes Extra", sondern eine
 * Zeile, die keine Vorschau und kein Token kennt.
 */
function dnaIsComplete(dna: Readonly<Record<string, string>> | undefined): dna is Readonly<Record<string, string>> {
  if (!dna) return false
  return BRAND_DNA_DIMENSION_IDS.every(dimensionId => isBrandDnaValue(dimensionId, dna[dimensionId] ?? ''))
}

/**
 * DIE ÜBERGANGS-TOKENS aus dem Tempo (§2.7 `l.transitions`) — drei Dauern plus
 * der Versatz, gerundet auf ganze Millisekunden.
 */
export function brandMotionTransitions(
  tempoId: string,
): { id: string, durationMs: number, easing: string }[] {
  const tempo = BRAND_TEMPO_OPTIONS.find(option => option.id === tempoId)
  if (!tempo) return []
  const tokens = BRAND_MOTION_TOKENS.map(token => ({
    id: token.id,
    durationMs: Math.round(tempo.base * token.factor),
    easing: tempo.easing,
  }))
  return [...tokens, { id: 'stagger', durationMs: BRAND_MOTION_STAGGER_MS, easing: tempo.easing }]
}

/**
 * DAS PRESET AUS DEN BESTÄTIGTEN WERTEN — `null`, solange etwas Tragendes
 * fehlt (s. Kopf).
 *
 * TRAGEND ist, was ein Leser braucht, um überhaupt etwas zu zeigen: die
 * vollständige DNA, eine gültige Basisfarbe, ein gültiger Akzent, ein Paar aus
 * dem Katalog, eine Hierarchie, eine Zeichen-Richtung und ein Tempo. Alles
 * andere (Regeln, Do-und-Don't, Setzungen, Entwürfe) darf leer sein — eine
 * Marke ohne aufgeschriebene Bewegungs-Regel hat trotzdem eine Farbwelt.
 */
export function buildBrandDesign(values: BrandDesignValues): BrandDesignPreset | null {
  if (!dnaIsComplete(values.dna)) return null
  if (!isBrandHex(values.base) || !isBrandHex(values.accent)) return null

  const rampLight = brandRampLight(values.base)
  const rampDark = brandRampDark(values.base)
  const neutral = brandNeutralRamp(neutralSourceFor(values.neutral, values.base))
  if (!rampLight || !rampDark || !neutral) return null

  const pair = values.pair ? brandFontPair(values.pair) : undefined
  if (!pair || !values.scale || !values.markKind || !values.tempo) return null
  if (!BRAND_TEMPO_OPTIONS.some(option => option.id === values.tempo)) return null

  const colors: ResolvedColors = { rampLight, rampDark, neutral, accent: values.accent }

  return {
    version: BRAND_DESIGN_PRESET_VERSION,
    // Nur die zehn bekannten Dimensionen, in Katalog-Reihenfolge: ein
    // durchgereichtes Fremd-Feld wäre im Preset ein Wert ohne Vokabular.
    dna: Object.fromEntries(
      BRAND_DNA_DIMENSION_IDS.map(dimensionId => [dimensionId, values.dna![dimensionId]!]),
    ),
    color: {
      base: values.base,
      rampLight,
      rampDark,
      neutral,
      accent: values.accent,
      // Eine Rolle ohne aufgelösten Hex ist eine Beschriftung, kein Token —
      // sie fällt heraus, statt mit '' im Preset zu stehen.
      roles: (values.roles ?? [])
        .filter(role => isBrandHex(role.hex))
        .map(role => ({ id: role.id, source: role.source, hex: role.hex! })),
      contrastPairs: buildContrastPairs(colors),
    },
    type: {
      pair: pair.id,
      scale: values.scale,
      rules: [...(values.typeRules ?? [])],
    },
    mark: {
      kind: values.markKind,
      brief: [...(values.markBrief ?? [])],
      examples: [...(values.markExamples ?? [])],
      keptDrafts: [...(values.keptDrafts ?? [])],
    },
    imagery: {
      principles: [...(values.imageryPrinciples ?? [])],
      illustration: values.illustration ?? '',
      icons: values.icons ?? '',
      dodont: (values.dodont ?? []).map(entry => ({ doText: entry.doText, dontText: entry.dontText })),
    },
    motion: {
      tempo: values.tempo,
      transitions: brandMotionTransitions(values.tempo),
      logo: values.logoMotion ?? '',
      rules: [...(values.motionRules ?? [])],
    },
  }
}
