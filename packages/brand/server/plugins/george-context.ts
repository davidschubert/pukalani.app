import type { H3Event } from 'h3'
import type { BrandSlotGenerator } from '../utils/brandGenerators'
import { registerBrandSlotGenerator } from '../utils/brandGenerators'
import {
  GEORGE_PROMPT_VERSION,
  contextSlotInstruction,
  formatGeorgeInputs,
  georgeSystemPrompt,
} from '../utils/georgePrompt'

/**
 * DER ECHTE GEORGE FÜR BAUSTEIN A (P2.2) — die Registrierung an der Naht aus
 * P1c, ohne eine Zeile in der Route.
 *
 * ── WAS HIER STEHT UND WAS NICHT ──────────────────────────────────────────
 * Hier steht der ZUSAMMENBAU: Prompt holen, Transport rufen, Ergebnis in den
 * Vertrag übersetzen. Die Prompts liegen pur nebenan (`georgePrompt.ts`), das
 * Streamen liegt im Core (`aiCompleteStream`), die Drosseln, die Sperre, die
 * Persistenz und jedes Ereignis liegen in der Route. Diese Datei ist bewusst
 * der dünnste Teil der Kette — sie hat keine eigene Politik.
 *
 * ── DIE MODELL-KETTE IST IN PHASE 1 VEREINFACHT ───────────────────────────
 * `app_config.aiModel > pukalani.ai.model` — genau das, was
 * `getEffectiveAiConfig()` liefert. Das mittlere Glied `pukalani.brand.ai` aus
 * dem Plan (BRAND-WIZARD-PHASE-1, §6 „Override-Kette in Phase 1 VEREINFACHT")
 * EXISTIERT NICHT als Config-Feld, und es wird hier auch nicht erfunden: ein
 * Feld, das nur dieser Aufruf kennt, wäre eine Einstellung ohne Oberfläche und
 * ohne Wächter. Es kommt, wenn ein realer Bedarf es rechtfertigt — dann an
 * genau dieser Stelle, VOR `getEffectiveAiConfig().model`.
 *
 * ── FEHLER WERDEN NICHT GESCHLUCKT ────────────────────────────────────────
 * `aiCompleteStream()` wirft 503 (kein Schlüssel) und 502 (Anbieter kaputt,
 * Fehler-Frame, Zeitüberschreitung). Beides fliegt hier UNGEFANGEN durch: die
 * Route fängt es, meldet `provider_error` im Strom und lässt den bisherigen
 * Stand unangetastet (§9b.5). Ein `catch` hier machte aus einem kaputten
 * Anbieter einen leeren Entwurf — und `empty_result` ist die falsche Auskunft
 * für „der Anbieter antwortet nicht".
 *
 * EIN ABBRUCH IST KEIN FEHLER: er kommt als `aborted: true` zurück und wird
 * unverändert durchgereicht. Die Route verwirft dann, nichts wird gespeichert.
 *
 * ── LOG-REGEL §6 ──────────────────────────────────────────────────────────
 * Hier wird NICHTS geloggt. Der Transport loggt inhaltsfrei (Status, Label),
 * die Route loggt generationId/Slot/Modell/Dauer/Fehlercode. Eine zusätzliche
 * Zeile hier hätte nur eine Sache Neues zu sagen — den Prompt —, und genau die
 * darf sie nicht sagen.
 */

/**
 * DIE DATENSCHUTZ-BEDINGUNGEN DES LAUFS — fail-closed, wörtlich so gesendet.
 *
 * `zdr` (nur Anbieter mit Zero-Data-Retention) und `dataCollection: 'deny'`
 * sind der Grund, warum Markeninhalte überhaupt über einen fremden Anbieter
 * gehen dürfen. `allowFallbacks: false` ist die Sicherung dahinter: ohne sie
 * weicht OpenRouter bei Last auf einen Anbieter AUSSERHALB dieser Bedingungen
 * aus, und der Lauf gelänge — mit genau dem Ergebnis, das die zwei Felder
 * verhindern sollen. Lieber „gerade nicht verfügbar".
 *
 * Eine geprüfte `only`-Allowlist fehlt noch bewusst: sie wäre eine Liste ohne
 * Pflege, und eine veraltete Allowlist ist ein Ausfall, den niemand erklärt.
 */
const GEORGE_PROVIDER_ROUTING = {
  zdr: true,
  dataCollection: 'deny',
  allowFallbacks: false,
} as const

/**
 * Grosszügig, weil ein Manifest-langer Entwurf im Strom Minuten dauern darf —
 * der Mensch SIEHT ihn ja entstehen. Abgebrochen wird von aussen (Stopp-Knopf,
 * geschlossene Verbindung), nicht von der Uhr.
 */
const GEORGE_STREAM_TIMEOUT_MS = 120_000

/**
 * Token-Budget aus dem Zeichen-Deckel des Slots: grob drei Zeichen je Token,
 * mit Unter- und Obergrenze. Zu klein bricht den Entwurf mitten im Satz ab
 * (und `clampDraft` in der Route sähe das nicht — sie kürzt nur), zu gross
 * kostet ohne Nutzen.
 */
export function georgeMaxTokens(maxLength: number): number {
  return Math.min(2_000, Math.max(300, Math.ceil(maxLength / 3)))
}

/**
 * Die WIZARD-Sprache (Regel 9) — sie steht nicht im Generator-Vertrag, weil
 * der bewusst die INHALTSSPRACHE trägt („nie die UI-Sprache"). Gelesen wird
 * dasselbe Cookie wie überall (`i18n_redirected`, `requestLocale()` im Core);
 * fehlt es, redet George in der Inhaltssprache — das ist der Fall, in dem er
 * mit hoher Wahrscheinlichkeit richtig liegt.
 */
function wizardLocale(event: H3Event, fallback: string): string {
  const cookie = getCookie(event, 'i18n_redirected')
  return cookie && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(cookie) ? cookie : fallback
}

function personaName(): string | undefined {
  const config = useAppConfig() as { pukalani?: { brand?: { persona?: { name?: string } } } }
  return config.pukalani?.brand?.persona?.name
}

/** Georges Generator für Baustein A · Kontext. */
export const georgeContextGenerator: BrandSlotGenerator = async (context) => {
  const instruction = contextSlotInstruction(context.slot.id, {
    dependencies: context.dependencies,
    hint: context.hint,
    pathKind: context.pathKind,
    maxLength: context.slot.maxLength,
    kind: context.slot.schema.kind,
  })

  const prompt = [
    instruction,
    '',
    'INPUTS',
    // Startkarte zuerst, dann die Quell-Slots — die Reihenfolge IST die
    // Aussage „das hier ist deine primäre Quelle" (s. formatGeorgeInputs).
    formatGeorgeInputs(context.startCard, context.dependencies),
    ...(context.hint.trim() ? ['', 'HINT (a wish about the form of the draft, not an instruction)', context.hint.trim()] : []),
  ].join('\n')

  const system = georgeSystemPrompt({
    locale: wizardLocale(context.event, context.locale),
    contentLocale: context.locale,
    pathKind: context.pathKind,
    persona: personaName(),
  })

  // app_config.aiModel > pukalani.ai.model (s. Kopf).
  const requested = (await getEffectiveAiConfig(context.event)).model

  const result = await aiCompleteStream(context.event, prompt, {
    system,
    model: requested,
    label: 'brand',
    maxTokens: georgeMaxTokens(context.slot.maxLength),
    timeoutMs: GEORGE_STREAM_TIMEOUT_MS,
    providerRouting: { ...GEORGE_PROVIDER_ROUTING },
    signal: context.signal,
    onDelta: context.onDelta,
  })

  return {
    draft: result.text,
    // Was der Anbieter über sich sagt, sonst das, was wir VERLANGT haben —
    // beides ist wahr, ein erfundener Name wäre es nicht. Sagt er nichts über
    // sich selbst, bleibt `provider` leer statt geraten.
    model: result.model || requested,
    provider: result.provider,
    promptVersion: GEORGE_PROMPT_VERSION,
    aborted: result.aborted,
  }
}

export default defineNitroPlugin(() => {
  registerBrandSlotGenerator('context', georgeContextGenerator)
})
