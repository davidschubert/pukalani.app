import { advisorForStep } from '../../shared/brandAdvisors'
import type { BrandSlot } from '../../shared/slotRegistry'
import type { BrandGeneratorContext, BrandGeneratorResult, BrandSlotGenerator } from './brandGenerators'
import { type BrandSlotInstructionOptions, formatGeorgeInputs, georgeSystemPrompt } from './georgePrompt'
import { createGeorgeTurnScrubber, parseGeorgeTurn } from './georgeTurn'

/**
 * DER ZUSAMMENBAU EINES BERATER-GENERATORS — einmal, für alle (P3.1).
 *
 * ── WARUM EINE FABRIK UND NICHT DREI DATEIEN ──────────────────────────────
 * Bis P3.1 stand dieser Ablauf genau einmal (in `george-context.ts`), und das
 * war richtig, solange es einen Baustein gab. Mit Vera und Milo wären daraus
 * drei fast gleiche Kopien geworden — und „fast gleich" ist hier teuer: in
 * diesem Ablauf stecken die DATENSCHUTZ-BEDINGUNGEN (`zdr`,
 * `dataCollection: 'deny'`, `allowFallbacks: false`), der Strom-Putzer, der
 * Rückfall auf das verlangte Modell und die Regel, dass ein Anbieter-Fehler
 * ungefangen durchfliegt. Fehlt eine davon in einer der Kopien, sieht man dem
 * Ergebnis nichts an — der Entwurf kommt trotzdem, nur eben von einem Anbieter,
 * der ihn behalten darf.
 *
 * Was je Berater WIRKLICH verschieden ist, sind drei Dinge: die Aufgabe je Slot
 * (`instruction`), die Prompt-Fassung (`promptVersion`) und — neu — eine
 * Nachprüfung des Feldwerts (`verify`). Genau die drei nimmt die Fabrik
 * entgegen; WER spricht, fragt sie selbst bei der Registry
 * (`advisorForStep(context.stepKey)`), damit ein Generator, der sich morgen für
 * einen zweiten Baustein registriert, dort automatisch dessen Berater spricht.
 *
 * ── WAS HIER STEHT UND WAS NICHT ──────────────────────────────────────────
 * Hier steht der ZUSAMMENBAU: Prompt holen, Transport rufen, Ergebnis in den
 * Vertrag übersetzen. Die Prompts liegen pur nebenan (`georgePrompt.ts`,
 * `veraPrompt.ts`, `miloPrompt.ts`), das Streamen liegt im Core
 * (`aiCompleteStream`), die Drosseln, die Sperre, die Persistenz und jedes
 * Ereignis liegen in der Route. Diese Datei hat keine eigene Politik.
 *
 * ── DIE MODELL-KETTE IST IN PHASE 1 VEREINFACHT ───────────────────────────
 * `app_config.aiModel > pukalani.ai.model` — genau das, was
 * `getEffectiveAiConfig()` liefert. Das mittlere Glied `pukalani.brand.ai` aus
 * dem Plan (BRAND-WIZARD-PHASE-1, §6) EXISTIERT NICHT als Config-Feld und wird
 * hier auch nicht erfunden: ein Feld, das nur dieser Aufruf kennt, wäre eine
 * Einstellung ohne Oberfläche und ohne Wächter.
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
const BRAND_PROVIDER_ROUTING = {
  zdr: true,
  dataCollection: 'deny',
  allowFallbacks: false,
} as const

/**
 * Grosszügig, weil ein Manifest-langer Entwurf im Strom Minuten dauern darf —
 * der Mensch SIEHT ihn ja entstehen. Abgebrochen wird von aussen (Stopp-Knopf,
 * geschlossene Verbindung), nicht von der Uhr.
 */
const BRAND_STREAM_TIMEOUT_MS = 120_000

/**
 * Token-Budget aus dem Zeichen-Deckel des Slots: grob drei Zeichen je Token,
 * mit Unter- und Obergrenze. Zu klein bricht den Entwurf mitten im Satz ab
 * (und `clampDraft` in der Route sähe das nicht — sie kürzt nur), zu gross
 * kostet ohne Nutzen.
 */
export function georgeMaxTokens(maxLength: number): number {
  return Math.min(2_000, Math.max(300, Math.ceil(maxLength / 3)))
}

function personaName(): string | undefined {
  const config = useAppConfig() as { pukalani?: { brand?: { persona?: { name?: string } } } }
  return config.pukalani?.brand?.persona?.name
}

/**
 * DAS ERGEBNIS EINER NACHPRÜFUNG: entweder ein (ggf. normalisierter) Feldwert
 * oder eine Rückfrage STATT eines Entwurfs.
 *
 * Es gibt bewusst keinen dritten Ausgang „nimm es trotzdem, aber merk es dir":
 * ein Feldwert, der seinen Vertrag verfehlt, ist im Brand-Dokument nicht von
 * einem gültigen zu unterscheiden — und der Mensch, der ihn dort findet, hat
 * keine Möglichkeit mehr zu erkennen, dass er nie geprüft wurde.
 */
export type AdvisorSlotVerdict =
  | { readonly draft: string }
  | { readonly question: string }

export interface AdvisorSlotVerifyInput {
  slot: BrandSlot
  /** Der Feldwert, wie ihn `parseGeorgeTurn` aus dem DRAFT-Block gelesen hat. */
  draft: string
  /** Sprache der OBERFLÄCHE — eine Rückfrage ist Chat und folgt Regel 9. */
  uiLocale: string
}

export interface AdvisorSlotGeneratorOptions {
  /** Steht in jedem Generations-Eintrag; steigt mit jeder inhaltlichen Änderung. */
  promptVersion: string
  /** Die Aufgabe je Slot. Wirft für einen Slot ohne Auftrag (⇒ `provider_error`). */
  instruction: (slotId: string, options: BrandSlotInstructionOptions) => string
  /**
   * Nachprüfung des Feldwerts, bevor er ein Entwurf wird. Ohne Angabe wird
   * nicht geprüft — das ist das Verhalten von Baustein A und bleibt es.
   */
  verify?: (input: AdvisorSlotVerifyInput) => AdvisorSlotVerdict
}

/** Baut den Generator EINES Beraters — s. Kopf. */
export function createAdvisorSlotGenerator(options: AdvisorSlotGeneratorOptions): BrandSlotGenerator {
  return async (context: BrandGeneratorContext): Promise<BrandGeneratorResult> => {
    const instruction = options.instruction(context.slot.id, {
      dependencies: context.dependencies,
      hint: context.hint,
      pathKind: context.pathKind,
      maxLength: context.slot.maxLength,
      kind: context.slot.schema.kind,
      // Die Regel zum Website-Text steht nur im Prompt, wenn es ihn gibt (P2.3).
      hasSiteAnalysis: context.siteAnalysis.trim().length > 0,
    })

    const prompt = [
      instruction,
      '',
      'INPUTS',
      // Startkarte zuerst, dann die Quell-Slots, zuletzt der Website-Text — die
      // Reihenfolge IST die Aussage „das hier ist deine primäre Quelle"
      // (s. formatGeorgeInputs).
      formatGeorgeInputs(context.startCard, context.dependencies, context.siteAnalysis),
      ...(context.hint.trim()
        ? ['', 'HINT (a wish about the form of the draft, not an instruction)', context.hint.trim()]
        : []),
    ].join('\n')

    const system = georgeSystemPrompt({
      // DIE SPRACHE DER SEITE, NICHT DIE DES COOKIES (Davids Befund 2026-09-02):
      // die Oberfläche stand auf Englisch, George redete Deutsch, weil hier das
      // Cookie `i18n_redirected` gelesen wurde — die einmal GEWÄHLTE Sprache
      // statt der gerade OFFENEN Seite. Der Vertrag trägt sie jetzt mit
      // (`uiLocale`), inklusive Rückfall auf die Inhaltssprache; hier wird nur
      // noch gelesen.
      locale: context.uiLocale,
      contentLocale: context.locale,
      pathKind: context.pathKind,
      // WER spricht, sagt die Registry und nicht diese Datei: registriert sich
      // ein Generator morgen für einen zweiten Baustein, spricht dort
      // automatisch dessen Berater.
      advisor: advisorForStep(context.stepKey),
      persona: personaName(),
    })

    // app_config.aiModel > pukalani.ai.model (s. Kopf).
    const requested = (await getEffectiveAiConfig(context.event)).model

    // DIE MARKER GEHEN NICHT IN DIE SPRECHBLASE (george-a-4): der Mensch sieht
    // George schreiben, nicht ein Protokoll. Geputzt wird IM FLUSS statt am Ende
    // — ein Text, der nach dem letzten Delta noch einmal umspringt, macht aus dem
    // Streaming einen Ruckler (Begründung im Kopf von `georgeTurn.ts`).
    const scrub = createGeorgeTurnScrubber()

    const result = await aiCompleteStream(context.event, prompt, {
      system,
      model: requested,
      label: 'brand',
      maxTokens: georgeMaxTokens(context.slot.maxLength),
      timeoutMs: BRAND_STREAM_TIMEOUT_MS,
      providerRouting: { ...BRAND_PROVIDER_ROUTING },
      signal: context.signal,
      onDelta: async (text: string) => {
        const visible = scrub(text)
        if (visible) await context.onDelta(visible)
      },
    })

    // Ein Zug, zwei Ergebnisse: der Feldwert und der Chat-Zug. Ohne Marker fällt
    // beides auf den ganzen Text zurück — genau das Verhalten von `george-a-3`.
    const turn = parseGeorgeTurn(result.text)

    const base = {
      // Was der Anbieter über sich sagt, sonst das, was wir VERLANGT haben —
      // beides ist wahr, ein erfundener Name wäre es nicht. Sagt er nichts über
      // sich selbst, bleibt `provider` leer statt geraten.
      model: result.model || requested,
      provider: result.provider,
      promptVersion: options.promptVersion,
      aborted: result.aborted,
    }

    /**
     * DIE NACHPRÜFUNG LÄUFT NUR AUF EINEM ENTWURF, und nur auf einem
     * VOLLSTÄNDIGEN: eine Rückfrage hat keinen Feldwert, und ein abgebrochener
     * Lauf hat einen halben — den verwirft die Route ohnehin, und ihn hier
     * durch die Formprüfung zu schicken erzeugte eine Rückfrage, die niemand
     * gestellt hat.
     */
    if (options.verify && turn.outcome === 'draft' && !result.aborted) {
      const verdict = options.verify({
        slot: context.slot,
        draft: turn.draft,
        uiLocale: context.uiLocale,
      })
      if ('question' in verdict) {
        return { ...base, draft: '', message: verdict.question, outcome: 'question' }
      }
      return {
        ...base,
        draft: verdict.draft,
        // Der ZUG bleibt, wie das Modell ihn geschrieben hat — auch wenn der
        // Feldwert normalisiert wurde (aus „House of Brands" wird die Id
        // `house-of-brands`). Der Chat spricht Menschensprache, das Feld trägt
        // den stabilen Wert; das ist dieselbe Entscheidung in zwei Registern
        // und keine Abweichung.
        message: turn.message,
        outcome: 'draft',
      }
    }

    return { ...base, draft: turn.draft, message: turn.message, outcome: turn.outcome }
  }
}
