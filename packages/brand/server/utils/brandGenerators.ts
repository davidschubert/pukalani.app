import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import type { Models } from 'node-appwrite'
import {
  type BrandGenerationLockEntry,
  brandGenerationHashInput,
  brandGenerationLockHeld,
  brandGenerationLockKey,
} from '../../shared/brandGeneration'
import {
  type BrandSlot,
  type BrandStepKey,
  dependencyClosure,
} from '../../shared/slotRegistry'
import { type BrandSlotRecord, brandSlotStoredValue } from './brandStore'

/**
 * WER GEORGES ENTWÜRFE SCHREIBT — die Registry, die Sperre, der inputHash und
 * der Entwicklungs-Ersatz.
 *
 * ── DER GENERATOR IST EINSTECKBAR, UND ZWAR AUS EINEM GRUND ───────────────
 * P1c baut das PROTOKOLL (§3e), nicht die Prompts. Ein Protokoll, das man nur
 * mit einem KI-Schlüssel ausprobieren kann, ist eines, das niemand ausprobiert:
 * jeder Beweis kostete dann Geld, einen Anbieter und eine Internetverbindung.
 * Deshalb entscheidet `resolveBrandSlotGenerator()`, WER schreibt, und die Route
 * kennt nur noch „es gibt einen" oder „es gibt keinen". P2 registriert die
 * echten Prompts über `registerBrandSlotGenerator()` — an derselben Naht, ohne
 * eine Zeile in der Route.
 *
 * ── DER DEV-STUB IST EIN RÜCKFALL, KEINE REGISTRIERUNG ────────────────────
 * Er hängt an `pukalani.brand.devStubGenerator` (Core-Default `false`, im
 * .playground `true`) und greift NUR, wenn nichts registriert ist. Als
 * Registrierung in einem Nitro-Plugin wäre er von der Plugin-REIHENFOLGE
 * abhängig: registrierte P2 ihre Prompts früher, gewönne der Stub, und in
 * Produktion stünde ein Entwicklungstext im Brand-Dokument. Als Rückfall kann
 * das nicht passieren — ein echter Generator schlägt ihn immer.
 *
 * ── DIE SPERRE LEBT IM PROZESS ────────────────────────────────────────────
 * Eine Map, mehr nicht. Das ist für Phase 1 richtig und die Grenze steht hier,
 * damit sie niemand später sucht: bei mehreren Node-Prozessen (pm2-Cluster)
 * sperrt sie nur INNERHALB eines Prozesses. Der Schaden bliebe klein — zwei
 * gleichzeitige Läufe schreiben nacheinander, der zweite gewinnt, und der
 * Autosave des Clients bemerkt den revision-Sprung. Eine prozessübergreifende
 * Sperre (Appwrite-Row mit 409-Idempotenz, wie `notify()`) ist der nächste
 * Schritt, wenn branding je im Cluster läuft.
 */

// ── Der Vertrag ────────────────────────────────────────────────────────────

export interface BrandGeneratorContext {
  event: H3Event
  stepKey: BrandStepKey
  slot: BrandSlot
  /** Inhaltssprache des Brandings (`brand_profiles.contentLocale`) — nie die UI-Sprache. */
  locale: string
  /** Die Weiche W1, für pfadabhängige Prompts. */
  pathKind: 'new' | 'relaunch'
  /** Freier Hinweis des Menschen („wärmer", „kürzer") — bereits auf 500 Zeichen geklemmt. */
  hint: string
  /** Werte der (transitiven) Quell-Slots in Katalog-Reihenfolge. */
  dependencies: readonly BrandSlotDependency[]
  /** Abbruch durch den Menschen ODER durch eine geschlossene Verbindung. */
  signal: AbortSignal
  /** Jedes Text-Delta genau einmal — hier hängt `message.delta` dran. */
  onDelta: (text: string) => Promise<void> | void
}

export interface BrandSlotDependency {
  slotId: string
  value: string
}

export interface BrandGeneratorResult {
  draft: string
  model: string
  provider: string
  /** Steigt, sobald sich der Prompt ändert — sie steht im Generations-Eintrag. */
  promptVersion: string
  /** Der Lauf wurde abgebrochen; `draft` ist unvollständig und wird VERWORFEN. */
  aborted: boolean
}

export type BrandSlotGenerator = (context: BrandGeneratorContext) => Promise<BrandGeneratorResult>

/** `'*'` gilt für jeden Baustein, der keinen eigenen Generator hat. */
export type BrandGeneratorScope = BrandStepKey | '*'

const GENERATORS = new Map<BrandGeneratorScope, BrandSlotGenerator>()

export function registerBrandSlotGenerator(scope: BrandGeneratorScope, generator: BrandSlotGenerator): void {
  GENERATORS.set(scope, generator)
}

/** Nur für Beweise/Tests: die Registry leeren. */
export function clearBrandSlotGenerators(): void {
  GENERATORS.clear()
}

function devStubEnabled(): boolean {
  const config = useAppConfig() as { pukalani?: { brand?: { devStubGenerator?: boolean } } }
  return config.pukalani?.brand?.devStubGenerator === true
}

/**
 * Der zuständige Generator: eigener Baustein, sonst `'*'`, sonst der Dev-Stub
 * (wenn erlaubt). `null` heisst „niemand schreibt hier" — die Route meldet
 * `generation.failed` mit `no_generator`, und der Stand bleibt bearbeitbar.
 */
export function resolveBrandSlotGenerator(stepKey: BrandStepKey): BrandSlotGenerator | null {
  return GENERATORS.get(stepKey)
    ?? GENERATORS.get('*')
    ?? (devStubEnabled() ? brandDevStubGenerator : null)
}

// ── Der KI-Kill-Switch der Laufzeit ────────────────────────────────────────

/**
 * `app_config.brandAiEnabled` (system-038, Default `false`). Gelesen wird die
 * Zeile DIREKT, nicht über `getAppConfig()` — dieselbe Begründung wie bei
 * `readBrandAdmissionMode`: ein `brand`-Feld in der Core-Form hiesse, dass der
 * Core den Layer kennt.
 *
 * FAIL-CLOSED: fehlende Spalte (Deploy vor der Migration), fehlende Zeile oder
 * Lesefehler ⇒ `false`. Ein nicht lesbarer Kill-Switch darf die KI nicht
 * einschalten. Der Preis ist gering und ausdrücklich vorgesehen (§9b.5): ohne
 * KI bleibt der Stand VOLL bearbeitbar, es kommen nur keine neuen Entwürfe.
 */
export async function readBrandAiEnabled(event: H3Event): Promise<boolean> {
  try {
    const config = useRuntimeConfig(event)
    const { tablesDB } = createAdminClient(event)
    const row = await tablesDB.getRow<Models.Row & { brandAiEnabled?: unknown }>({
      databaseId: config.public.appwriteDatabaseId,
      tableId: 'app_config',
      rowId: 'global',
    })
    return row.brandAiEnabled === true
  }
  catch {
    return false
  }
}

// ── inputHash ──────────────────────────────────────────────────────────────

/**
 * Die Quell-Werte eines Slots, in Katalog-Reihenfolge. Genommen wird der
 * GELTENDE Wert (bestätigt vor Entwurf) — der Hash soll sagen, woraus der
 * Entwurf entstand, und das ist der Stand, den der Prompt gesehen hat.
 * Abhängigkeiten OHNE Wert bleiben mit leerem Wert drin: sonst hätten „Slot
 * fehlt" und „Slot ist leer" denselben Hash, und ein nachgetragener Wert
 * bewegte ihn nicht.
 */
export function collectSlotDependencies(
  slotId: string,
  records: Readonly<Record<string, BrandSlotRecord>>,
): BrandSlotDependency[] {
  return dependencyClosure(slotId).map(dependencyId => ({
    slotId: dependencyId,
    value: brandSlotStoredValue(records[dependencyId]),
  }))
}

/** sha256 über die kanonische Zeichenkette aus `shared/brandGeneration.ts`. */
export function brandGenerationInputHash(
  slotId: string,
  locale: string,
  dependencies: readonly BrandSlotDependency[],
): string {
  return createHash('sha256')
    .update(brandGenerationHashInput(slotId, locale, dependencies))
    .digest('hex')
}

// ── Die Sperre ─────────────────────────────────────────────────────────────

const LOCKS = new Map<string, BrandGenerationLockEntry>()

export interface BrandGenerationLockHandle {
  release: () => void
}

/**
 * `null` = jemand generiert hier gerade (die Route antwortet
 * `generation_active`). Sonst die Freigabe, die im `finally` gerufen gehört.
 */
export function acquireBrandGenerationLock(
  profileId: string,
  stepKey: string,
  generationId: string,
): BrandGenerationLockHandle | null {
  const key = brandGenerationLockKey(profileId, stepKey)
  if (brandGenerationLockHeld(LOCKS.get(key), Date.now())) return null
  LOCKS.set(key, { generationId, startedAt: Date.now() })
  return {
    release: () => {
      // Nur die EIGENE Sperre freigeben: hat ein verwaister Eintrag inzwischen
      // einem neuen Lauf Platz gemacht, dürfte dessen Sperre hier nicht fallen.
      if (LOCKS.get(key)?.generationId === generationId) LOCKS.delete(key)
    },
  }
}

// ── Der Entwicklungs-Ersatz ────────────────────────────────────────────────

function stubSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * DETERMINISTISCHER ERSATZ-ENTWURF aus Slot-Id und Abhängigkeits-Werten, in
 * fünf Deltas mit kleinen Pausen. Er macht das Protokoll OHNE KI end-to-end
 * beweisbar: Start, Deltas, Slot, Abschluss, Abbruch — alles echt, nur der Text
 * nicht.
 *
 * Er sagt in seinem eigenen Text, dass er ein Ersatz ist. Ein Stub, der wie ein
 * Ergebnis aussieht, landet irgendwann in einem Screenshot.
 */
export const brandDevStubGenerator: BrandSlotGenerator = async (context) => {
  const filled = context.dependencies.filter(dependency => dependency.value.trim().length > 0)
  const pieces = [
    `Entwurf für ${context.slot.id} (${context.locale}, Pfad ${context.pathKind}). `,
    filled.length
      ? `Gestützt auf ${filled.length} Vorentscheidung${filled.length === 1 ? '' : 'en'}: `
        + `${filled.slice(0, 3).map(dependency => dependency.value.slice(0, 60)).join(' · ')}. `
      : 'Noch ohne Vorentscheidungen — gestützt allein auf die Startkarte. ',
    context.hint ? `Hinweis aufgenommen: ${context.hint}. ` : '',
    'Dieser Text stammt vom Entwicklungs-Ersatz, nicht von einem Sprachmodell. ',
    'Die echten Prompts kommen mit Phase 2 über dieselbe Generator-Registry.',
  ].filter(piece => piece.length > 0)

  let draft = ''
  for (const piece of pieces) {
    if (context.signal.aborted) break
    draft += piece
    await context.onDelta(piece)
    await stubSleep(60)
  }

  return {
    draft,
    model: 'dev-stub',
    provider: 'local',
    promptVersion: 'stub-1',
    aborted: context.signal.aborted,
  }
}
