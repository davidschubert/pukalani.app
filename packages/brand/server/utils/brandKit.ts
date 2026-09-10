import type { H3Event } from 'h3'
import { BRAND_DIRECTIONS_VERSION, brandDirectionById } from '../../shared/brandDirections'
import { resolveDerivationAccess } from '../../shared/brandDerivation'
import { brandDesignSnapshotPreset } from '../../shared/brandDesignValues'
import { type BrandFoundationView, buildBrandFoundation } from '../../shared/brandFoundation'
import { resolveBrandJourney } from '../../shared/brandJourney'
import { type BrandStepKey, isBrandDesignStep } from '../../shared/slotRegistry'
import {
  BRAND_KIT_BUILDERS,
  type BrandKitBuildInput,
  brandKitAvailability,
  brandKitDownloadName,
  brandKitSlug,
} from '../../shared/brandKitFiles'
import type { BrandDesignSnapshotPreset } from '../../shared/types/brand'
import type { BrandKitFile, BrandKitManifestFile } from '../../shared/types/brandKit'
import { BRAND_KIT_FILES } from '../../shared/brandKitFiles'
import { brandDesignStand, loadBrandDesignPreset } from './brandDesignPreset'
import {
  type BrandProfileRow,
  type BrandStepRow,
  confirmedSlotValues,
  loadOwnedProfile,
  loadStepRows,
  profileFacts,
  requireProfileIdParam,
  toStepFacts,
  toStoryView,
} from './brandStore'

/**
 * DER GEMEINSAME ZUGANG ZUM KIT (Konzept docs/plans/BRAND-BOOK-KIT.md
 * §2.9/§2.12, Paket K2) — EINE Stelle für Besitz, Schranke und Preset.
 *
 * ── DREI TÜREN, IN DIESER REIHENFOLGE ────────────────────────────────────
 *  1. `requireBrandAccess` — das Zugangs-Gate jeder privaten `/api/brand/**`-
 *     Route (404 ohne Beta-Zulassung, Datentür-Muster). Es liefert nebenbei
 *     die BETA-TATSACHE, die die Schranke unten braucht.
 *  2. `loadOwnedProfile` — fremdes oder erfundenes Branding ⇒ 404 (§2.12
 *     Nr. 3). Der Download ist eine EIGENTÜMER-Route.
 *  3. `resolveDerivationAccess` — die Ableitung muss freigeschaltet sein
 *     (K1). Hier steht bewusst 403 mit `data.code` und nicht 404: die
 *     Oberfläche soll die Schranke ZEIGEN können („Teil der Ableitung"), und
 *     dass es diese Marke gibt, weiß der Eigentümer ohnehin.
 *
 * Die Reihenfolge ist der Punkt: die Schranke wird erst gefragt, wenn Besitz
 * belegt ist. Andersherum verriete eine 403 an einer fremden Marke, dass es
 * sie gibt.
 *
 * ── DAS PRESET KOMMT ALS SNAPSHOT ────────────────────────────────────────
 * `brandDesignSnapshotPreset` nimmt die behaltenen KI-Entwürfe heraus
 * (§1.11 b: Entwürfe reisen nie in Snapshot, Share — oder Kit). Für die
 * Tokens spielt das keine Rolle, für `marks/*.svg` in K6 sehr wohl; die
 * Entscheidung gehört an diese eine Stelle und nicht in jeden Erzeuger.
 *
 * ── GERECHNET, NIE GESPEICHERT ───────────────────────────────────────────
 * Es gibt keine Spalte, keinen Cache, keine Datei (§2.6). Zwei Abfragen
 * (Profil, Kapitel-Zeilen), der Rest ist reine Rechnung.
 */
export interface BrandKitContext {
  profile: BrandProfileRow
  stepRows: BrandStepRow[]
  /** `null`, solange Schicht 2 nicht abgenommen ist. */
  preset: BrandDesignSnapshotPreset | null
  /** ISO-Stempel des jüngsten Design-Kapitels; '' ohne Preset. */
  stand: string
  /** Der Dateinamens-Stamm dieser Marke (Allowlist `[a-z0-9-]`). */
  slug: string
  /**
   * DIE LESEANSICHT DES FUNDAMENTS (K3) — dieselbe, die das Book rendert.
   *
   * Sie steht IM Kontext und nicht in jedem Erzeuger, weil sie einmal je
   * Abruf gebaut wird und drei Dateien sie lesen (`brand.md`, `brand.json`
   * und, über die Verfügbarkeit, die README).
   */
  view: BrandFoundationView
  userId: string
}

/**
 * DIE LESEANSICHT AUS DEN LIVE-WERTEN (Paket K3) — Zwilling der Route
 * `foundation.get.ts`.
 *
 * ── EIN RENDERER FÜR BOOK UND KIT (§2.6) ─────────────────────────────────
 * Der Brand Context wird NICHT aus Slots gebaut, sondern aus derselben
 * `BrandFoundationView`, die die Leseansicht rendert. Damit ist die Reise-Regel
 * die Export-Regel (§2.12 Nr. 1): `buildBrandFoundation` schickt jeden Wert
 * durch `isBrandSlotShareable`, bevor er ein Block wird — die Kit-Dateien
 * sehen `a.competitors` und `a.facts` nie, auch nicht gefiltert.
 *
 * ── OHNE EINE EINZIGE ZUSÄTZLICHE ABFRAGE ────────────────────────────────
 * Profil und Kapitel-Zeilen sind geladen; Journey und Fakten sind reine
 * Rechnung darüber (`profileFacts` + `toStepFacts` + `resolveBrandJourney`,
 * genau wie in `loadBrandDocumentContext`). Das Kit bleibt bei zwei Abfragen.
 *
 * ── ZWEI AUSLASSUNGEN, EINE ABWEICHUNG ───────────────────────────────────
 * Wie die Route fallen ÜBERSPRUNGENE Kapitel heraus (sie sind nicht, was diese
 * Marke IST) und die sechs DESIGN-Kapitel (ihr Ergebnis reist als Preset, ihre
 * rohen Werte sind Vokabular-Ids und Hex-Töne).
 *
 * Die Kapitel der SCHICHT 3 (`nomenclature`, `aiguide`, `presskit`) werden hier
 * ABSICHTLICH NICHT übersprungen, anders als in `foundation.get.ts`. Der Grund
 * ist derselbe, aus dem die Route sie heute überspringt — der Renderer baut für
 * sie noch keine Blöcke (K4) —, nur die Folge ist eine andere: hineingereicht
 * ändern sie heute NICHTS (ein Kapitel ohne Block entfällt), und sobald K4
 * ihre Bauer schreibt, stehen sie in `brand.md` und `brand.json`, ohne dass
 * jemand daran denken muss. Ein `continue` hier wäre die Zeile, die K4 vergisst.
 */
function brandKitFoundationView(
  profile: BrandProfileRow,
  stepRows: readonly BrandStepRow[],
  betaAccount: boolean,
  preset: BrandDesignSnapshotPreset | null,
): BrandFoundationView {
  const journey = resolveBrandJourney(profileFacts(profile, betaAccount), toStepFacts(stepRows))
  const byStepKey = new Map(stepRows.map(row => [row.stepKey, row]))

  const values: { stepKey: BrandStepKey, slots: { slotId: string, value: string }[] }[] = []
  for (const entry of journey) {
    if (entry.state === 'skipped') continue
    if (isBrandDesignStep(entry.stepKey)) continue
    const row = byStepKey.get(entry.stepKey)
    values.push({ stepKey: entry.stepKey, slots: row ? confirmedSlotValues(row) : [] })
  }

  /*
   * DIE GEWÄHLTE RICHTUNG kommt wie in der Route von AUSSEN: `result.direction`
   * ist `audience: 'internal'` und fiele durch das Tor des Renderers. Ohne
   * Preset ist sie das, was Kapitel 10 überhaupt zeigen kann; mit Preset tritt
   * sie zurück (D8). Für `brand.md` spielt sie keine Rolle — der visuelle
   * Abschnitt kommt aus dem Preset —, für die VOLLSTÄNDIGKEIT der Ansicht
   * schon: sie soll Zeichen für Zeichen die des Books sein.
   */
  const chosenDirection = values
    .find(chapter => chapter.stepKey === 'result')?.slots
    .find(slot => slot.slotId === 'result.direction')?.value ?? ''
  const direction = brandDirectionById(chosenDirection.trim())

  return buildBrandFoundation({
    title: profile.title ?? '',
    contentLocale: profile.contentLocale,
    story: toStoryView(profile).body,
    chapters: values,
    pathKind: profile.pathKind === 'relaunch' ? 'relaunch' : 'new',
    team: profile.team === 'team' ? 'team' : 'solo',
    ...(direction
      ? { direction: { id: direction.id, version: String(BRAND_DIRECTIONS_VERSION) } }
      : {}),
    ...(preset ? { design: preset } : {}),
  })
}

export function brandDerivationLocked(): Error {
  return createError({
    status: 403,
    statusText: 'Derivation is locked',
    data: { code: 'derivation_locked' },
  })
}

export async function loadBrandKitContext(event: H3Event): Promise<BrandKitContext> {
  const { userId, betaAccount } = await requireBrandAccess(event)
  const profileId = requireProfileIdParam(event)
  const profile = await loadOwnedProfile(event, userId, profileId)

  const access = resolveDerivationAccess({
    betaAccount,
    unlockedAt: profile.derivationUnlockedAt,
    via: profile.derivationUnlockedVia,
  })
  if (!access.unlocked) throw brandDerivationLocked()

  const stepRows = await loadStepRows(event, profile.$id)
  const { preset } = await loadBrandDesignPreset(event, profile, stepRows)
  const snapshotPreset = preset ? brandDesignSnapshotPreset(preset) : null

  return {
    profile,
    stepRows,
    preset: snapshotPreset,
    view: brandKitFoundationView(profile, stepRows, betaAccount, snapshotPreset),
    // Ohne Preset kein Stand — dieselbe Regel wie am Ergebnis-Board (D8):
    // ein Datum an einer Sperr-Fläche behauptete eine Entscheidung.
    stand: preset ? brandDesignStand(stepRows) : '',
    slug: brandKitSlug(profile.title ?? ''),
    userId,
  }
}

/** Die Eingabe der puren Erzeuger aus dem geladenen Zustand. */
export function brandKitBuildInput(context: BrandKitContext): BrandKitBuildInput {
  return {
    preset: context.preset,
    view: context.view,
    title: context.profile.title ?? '',
    stand: context.stand,
    locale: context.profile.contentLocale,
  }
}

/**
 * DER INHALT EINER DATEI — `null`, wenn ihr Erzeuger fehlt oder das Preset
 * fehlt. Die ROUTE entscheidet, was daraus wird (409 mit Grund); hier steht
 * nur die Rechnung, damit das Manifest dieselbe benutzen kann.
 */
export function brandKitFileContent(file: BrandKitFile, context: BrandKitContext): string | null {
  const availability = brandKitAvailability(file, !!context.preset)
  if (!availability.available) return null
  const builder = BRAND_KIT_BUILDERS[file.id]
  return builder ? builder(brandKitBuildInput(context)) : null
}

/**
 * DAS MANIFEST — je Datei Name, Verfügbarkeit, Grund und Größe.
 *
 * Die Größe wird GERECHNET, indem die Datei gebaut wird. Das ist Absicht: eine
 * geschätzte Zahl neben einem Download-Knopf ist eine Zahl, die irgendwann
 * nicht mehr stimmt, und die drei Dateien dieses Pakets sind reine
 * String-Arbeit über einem schon geladenen Preset. Sobald in K6 das Bündel
 * dazukommt, bekommt es seine eigene Antwort — es ist die einzige teure
 * Rechnung (§2.11).
 */
export function brandKitManifestFiles(context: BrandKitContext): BrandKitManifestFile[] {
  return BRAND_KIT_FILES.map((file) => {
    const availability = brandKitAvailability(file, !!context.preset)
    const filename = brandKitDownloadName(file, context.slug, context.stand)
    if (!availability.available) {
      return { id: file.id, filename, available: false, reason: availability.reason }
    }
    const content = brandKitFileContent(file, context)
    if (content === null) {
      // Kann nach `brandKitAvailability` nicht mehr vorkommen — steht trotzdem
      // da, damit ein künftiger Erzeuger, der `null` liefert, nicht eine
      // Datei mit 0 Bytes verspricht.
      return { id: file.id, filename, available: false, reason: 'not_built_yet' }
    }
    return {
      id: file.id,
      filename,
      available: true,
      bytes: Buffer.byteLength(content, 'utf8'),
    }
  })
}
