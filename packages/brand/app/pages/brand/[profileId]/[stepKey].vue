<script setup lang="ts">
import type { BwSidebarBrand } from '../../../components/BwWorkspaceSidebar.vue'
import type { BwRailLayer, BwRailStep, BwRailStepInfo } from '../../../components/BwProgressRail.vue'
import {
  BRAND_CONFIDENCE_VALUES,
  type BrandConfidence,
  type BrandJourneyStep,
  brandStepCompletion,
  resolveNextQuestion,
} from '../../../../shared/brandJourney'
import {
  BRAND_STEP_KEYS,
  type BrandPathKind,
  type BrandSlot,
  type BrandSlotStateFacts,
  type BrandStepKey,
  exampleKeyFor,
  questionKeyFor,
  slotsForStep,
  stepProgress,
} from '../../../../shared/slotRegistry'
import {
  brandSlotDisplayValue,
  brandSlotIsConfirmed,
} from '../../../../shared/brandAutosaveDiff'
import { brandAiRejectionMessageKey } from '../../../../shared/brandAiLimits'
import {
  BRAND_ADVISORS,
  BRAND_VOICE,
  type BrandAdvisorKey,
  colleagueForStep,
} from '../../../../shared/brandAdvisors'
import {
  type BrandReadinessNeed,
  type BrandSlotReadiness,
  slotReadiness,
} from '../../../../shared/brandSlotReadiness'
import {
  type BrandSlotControls,
  brandChapterProgress,
  brandSlotControls,
} from '../../../../shared/brandSlotControls'
import type {
  BrandGenerationVersionsResponse,
  BrandSiteAnalysisView,
  BrandSiteAnalyzeResponse,
  BrandSlotView,
  BrandStepDetailResponse,
} from '../../../../shared/types/brand'
import { useBrandWorkspaceStore } from '../../../stores/brandWorkspace'
import { useBrandAutosave } from '../../../composables/useBrandAutosave'
import { useBrandConversation } from '../../../composables/useBrandConversation'
import { useBrandGeneration } from '../../../composables/useBrandGeneration'

/**
 * DIE WERKSTATT — „GESPRÄCH ALS BÜHNE" (Davids Konzept-Revision 2026-09-02,
 * in 39 Korrekturrunden am Klickdummy `/brand/demo/gespraech` abgenommen;
 * Auftrag: docs/plans/BRAND-WIZARD-GESPRAECH-UMBAU.md).
 *
 * ── WAS SICH GEDREHT HAT ──────────────────────────────────────────────────
 * Bis hierher war die BÜHNE das Dokument (alle Slots untereinander) und die
 * rechte Spalte der Chat. Jetzt ist es umgekehrt, und zwar aus Davids Grund:
 * „der ki markenberater muss zentral in der mitte sein … und rechts, wo jetzt
 * der chat ist, der LOG-bereich … nach jeder frage einmal final confirmen."
 *
 *   LINKS   `BwWorkspaceSidebar` — Marken-Wähler, Bereiche/Bausteine, Sync
 *   MITTE   das GESPRÄCH: Züge, Antwort-Module im Zug, Prompt fest unten
 *   RECHTS  der LOG: je Kapitel eine Sektion, je Entscheidung eine Karte
 *
 * Die Topbar entfällt (`topbar=false`), der Rail-Fuß auch
 * (`railFooter=false`) — der GESAMT-Fortschritt steht unten rechts im Log.
 *
 * ── DIE SERVER-LOGIK IST UNANGETASTET ─────────────────────────────────────
 * Slots, Zustandsmaschine, Bestätigen-als-Server-Zustand, Readiness-Gate,
 * Drosseln, Autosave/409 und der SSE-Strom sind exakt die von vorher; dieser
 * Umbau verdrahtet sie NEU, er ändert sie nicht. Keine Route, kein
 * shared-Vertrag wurde dafür angefasst.
 *
 * ── DREI STELLEN, AN DENEN DUMMY UND ECHTE DATENLAGE AUSEINANDERGEHEN ─────
 * 1. Der Dummy bestätigt JEDE Antwort sofort im nächsten Zug. Hier bleibt die
 *    bestehende Reihenfolge: `resolveNextQuestion` gilt ein Feld schon als
 *    beantwortet, sobald ein WERT drinsteht (`slotIsFilled`) — der Server
 *    rechnet genauso, und `nextSlotId` der converse-Route hängt daran. Also
 *    laufen erst die Fragen, dann die Bestätigungen; bestätigen kann man
 *    jederzeit rechts im Log, wo jede offene Karte ihren Knopf trägt.
 * 2. Der Dummy sperrt das Prompt, sobald kein answer-Zug offen ist. Hier
 *    bleibt es zusätzlich für die FREIE Frage offen — das ist gebautes
 *    P3.2-Verhalten („wer am Ende eines Kapitels ‚was meinst du mit
 *    Positionierung?' schreibt, bekommt eine Antwort"). Gesperrt ist es nur,
 *    wenn eine AUSWAHL dran ist: die beantwortet ihr eigenes Modul.
 * 3. Die Erklär-Layer der Leiste bauen ihre Entscheidungs-Listen aus der
 *    Slot-Registry. Den erklärenden ABSATZ je Baustein gibt es im echten
 *    Layer noch nicht (im Dummy steht er als deutsches Literal in
 *    `demoRail`) — er bleibt weg, statt erfunden zu werden.
 *
 * ── DREI ZUSTÄNDE, DIE KEINE FEHLERSEITE SIND ─────────────────────────────
 * `denied` (404 der Datentür — kein Beta-Zugang), `blocked` (403: der
 * Baustein liegt nicht auf dem Weg) und der KONFLIKT (409). Alle drei
 * bekommen eine Fläche mit Erklärung; geworfen wird hier nichts.
 */
definePageMeta({ layout: 'brand-workspace' })

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const store = useBrandWorkspaceStore()
const request = useRequestFetch()

const profileId = computed(() => String(route.params.profileId ?? ''))
const routeStepKey = computed(() => String(route.params.stepKey ?? ''))

const autosave = useBrandAutosave(profileId)
// ERST SPEICHERN, DANN GENERIEREN: der Server baut den Entwurf aus den
// GESPEICHERTEN Quell-Slots. Ohne dieses Ausspülen entwürfe George aus einem
// Stand, den der Mensch eine Sekunde vorher überholt hat.
const generation = useBrandGeneration(profileId, { beforeGenerate: () => autosave.flush() })
// Dieselbe Regel für den Gesprächszug: der Server rechnet aus dem GESPEICHERTEN
// Stand, welche Frage als nächste dran ist.
const conversation = useBrandConversation(profileId, { beforeSend: () => autosave.flush() })

await useAsyncData(
  () => `brand-workspace-${profileId.value}-${routeStepKey.value}`,
  async () => {
    const ok = await store.loadProfile(profileId.value, request)
    if (ok) await store.loadStep(profileId.value, routeStepKey.value, request)
    // Der Marken-Wähler in der Sidebar braucht die Liste des Kontos. FAIL-SOFT:
    // ohne sie zeigt er nur die aktive Marke und die zwei Ausgänge — eine
    // Werkstatt, die an einer Auswahlliste scheitert, wäre die schlechtere
    // Antwort auf einen Listen-Fehler.
    await store.loadProfiles(request).catch(() => {})
    return true
  },
  { watch: [profileId, routeStepKey] },
)

const stepKey = computed<BrandStepKey | null>(() =>
  (BRAND_STEP_KEYS as readonly string[]).includes(routeStepKey.value)
    ? (routeStepKey.value as BrandStepKey)
    : null)

const pathKind = computed<BrandPathKind>(() => store.profile?.pathKind ?? 'new')

const slots = computed<readonly BrandSlot[]>(() => (stepKey.value ? slotsForStep(stepKey.value) : []))

/** Die Beschriftung eines Slots: gefragt wird pfadabhängig, beschriftet nicht. */
function slotLabel(slot: BrandSlot): string {
  return slot.type === 'question' || slot.type === 'choice'
    ? t(questionKeyFor(slot, pathKind.value))
    : t(slot.questionKey)
}

/**
 * Die BESCHREIBUNGS-SUBLINE einer Log-Karte (Runde 25, David: „dieselben
 * Texte wie der Erklär-Layer"). Sie kommt aus dem vorhandenen Lehrblock des
 * Slots; wo es keinen gibt, bleibt die Zeile weg — ein erfundener Halbsatz
 * wäre schlimmer als eine Karte ohne Untertitel.
 */
function slotNote(slot: BrandSlot): string {
  return slot.helpKey ? t(slot.helpKey) : ''
}

// ── Eine Stimme: George, das Team im Rücken (Davids Entscheidung 2026-09-02) ─

/**
 * WER SPRICHT, IST KEINE FRAGE MEHR: George, in jedem Baustein
 * (`BRAND_VOICE`). Bis zum 2026-09-02 rechnete hier `advisorForStep()`, und im
 * Baustein `pvm` stand deshalb ein „V" im Avatar — vier Sprecherwechsel in
 * einer Sitzung heissen viermal Beziehung neu aufbauen (DECISION-LOG).
 * Der Avatar öffnet den Steckbrief; eine eigene Berater-Zeile gibt es seit dem
 * Werkstatt-Umbau nicht mehr.
 */
const voice = BRAND_VOICE
const voiceRole = computed(() => t(`brand.advisors.${voice.key}.role`))
const advisorInfoOpen = ref(false)

/** Das Team im Steckbrief — alle ausser George, in Registry-Reihenfolge. */
const voiceTeam = computed(() => BRAND_ADVISORS
  .filter(member => member.key !== voice.key)
  .map(member => ({
    key: member.key,
    line: `${member.fullName} — ${t(`brand.advisors.${member.key}.role`)} · ${t(`brand.advisors.${member.key}.focus`)}`,
  })))

/**
 * DAS PHASEN-INTRO ist Anzeige, kein Verlauf: es erscheint, wenn das Kapitel
 * die Technik einer ANDEREN Kollegin bzw. eines anderen Kollegen trägt als das
 * zuvor besuchte, und wird NICHT gespeichert (wer zwischen zwei Bausteinen
 * hin- und herspringt, bekäme sonst bei jedem Sprung eine Zeile in seinen
 * Verlauf geschrieben).
 *
 * Aus der Übergabe („Ab hier übernimmt Vera") ist eine ERWÄHNUNG geworden
 * („Ich habe das mit Vera durchgesehen — sie liest hier streng mit"): George
 * gibt nichts ab, er sagt nur, mit wessen Blick er dieses Kapitel angeht.
 */
const phaseIntro = ref<string | null>(null)
const introKey = computed(() => colleagueForStep(stepKey.value ?? 'context')?.key ?? voice.key)
let previousIntroKey: BrandAdvisorKey | null = null
watch(introKey, (next) => {
  phaseIntro.value = previousIntroKey && previousIntroKey !== next
    ? t(`brand.advisors.${next}.intro`)
    : null
  previousIntroKey = next
}, { immediate: true })

// ── George: die nächste offene Frage ──────────────────────────────────────

/**
 * Ein Baustein-Wechsel beginnt ein neues Gespräch (§3e) — die Züge räumt der
 * Store beim Laden weg, was der letzte Zug GETAN hat, muss hier fallen. Die
 * Bedien-Zustände der Bühne räumt der zweite Beobachter weiter unten (sie
 * werden erst dort angelegt).
 */
watch(routeStepKey, () => { conversation.reset() })

/**
 * DER LOKALE „WEISS ICH NICHT"-ÜBERSPRINGER IST WEG (Runde 24, David): „das
 * kann man tippen, es ist derselbe Antwort-Weg" — Georges Ehrlichkeits-Umgang
 * übernimmt. Damit rechnet der Browser jetzt GENAU wie der Server: gefüllt ist,
 * was einen Wert hat. Vorher war der lokale Übersprung eine sechste Tatsache,
 * die nur hier existierte.
 */
const slotFacts = computed<Record<string, BrandSlotStateFacts>>(() => {
  const facts: Record<string, BrandSlotStateFacts> = {}
  for (const slot of slots.value) {
    facts[slot.id] = {
      hasValue: store.slotValue(slot.id).length > 0,
      confirmed: store.slotConfirmed(slot.id),
    }
  }
  return facts
})

const nextQuestion = computed(() =>
  (stepKey.value ? resolveNextQuestion(stepKey.value, slotFacts.value) : null))

const nextSlot = computed<BrandSlot | null>(() =>
  slots.value.find(slot => slot.id === nextQuestion.value?.slotId) ?? null)

/**
 * DIE ZÜGE DIESES BESUCHS, IN IHRER REIHENFOLGE — Berater UND Mensch (P3.2).
 * Eine Liste im Store, damit sie beim Baustein-Wechsel mit allem anderen fällt.
 */
interface StageTurn {
  id: string
  role: 'george' | 'user'
  text: string
  help?: string
  pending?: boolean
}

const streamed = computed<StageTurn[]>(() => store.streamMessages.map(message => ({
  id: message.id,
  role: message.role,
  text: message.text,
  pending: message.pending,
})))

/**
 * DIE KATALOG-FRAGE STEHT NUR DA, WENN SIE NICHT SCHON GESTELLT WURDE (P3.2).
 * Weggelassen wird sie, solange der Berater SCHREIBT und wenn sein fertiger
 * Zug genau diese Frage getragen hat (`coveredSlotId` aus dem Abschluss-Frame
 * — der Server sagt es, geraten wird es nicht). Der Lehrblock hängt an der
 * FRAGE, nicht an ihrer Formulierung, und wandert dann unter den Zug.
 */
const turns = computed<StageTurn[]>(() => {
  const spoken: StageTurn[] = [...streamed.value]
  const busy = conversation.pending.value

  if (!nextSlot.value) {
    if (busy || conversation.spoke.value) return spoken
    return [...spoken, { id: 'done', role: 'george', text: t('brand.workspace.george.nothingOpen') }]
  }

  const help = nextSlot.value.helpKey ? t(nextSlot.value.helpKey) : undefined
  if (busy || conversation.coveredSlotId.value === nextSlot.value.id) {
    const last = spoken.at(-1)
    return last && !busy ? [...spoken.slice(0, -1), { ...last, help }] : spoken
  }

  return [
    ...spoken,
    {
      id: nextSlot.value.id,
      role: 'george',
      text: t(questionKeyFor(nextSlot.value, pathKind.value)),
      help,
    },
  ]
})

/* Runde 55 (David) für die BÜHNE: der Verlauf ankert unten und wächst nach
 * oben. Gescrollt wird auf den Anker am Ende — die Bühne ist ihr eigener
 * Scroller (.bw-stage). */
const tail = ref<HTMLElement | null>(null)
watch(() => turns.value.length, async () => {
  await nextTick()
  tail.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
})

/**
 * DIE BEISPIEL-ANTWORT (Davids Wunsch 2026-09-01, Muster Claude Desktop).
 * Sie steht seit dem Umbau als aufklappbarer Link DIREKT UNTER DER FRAGE
 * (Runde 23) statt als grauer Platzhalter im Feld — Klick ODER Tab übernimmt
 * sie ins leere Prompt. Die Texte stehen statisch im Katalog
 * (`brand.example.<id>`, pfadabhängig wie die Frage selbst).
 */
const composerExample = computed<string>(() => {
  const slot = nextSlot.value
  if (!slot || slot.type !== 'question') return ''
  return t(exampleKeyFor(slot, pathKind.value))
})

const exampleOpen = ref(false)
const promptDraft = ref('')

function takeExample(): void {
  if (!composerExample.value) return
  promptDraft.value = composerExample.value
}

/** Tab übernimmt die Beispiel-Antwort — nur im LEEREN Feld, wie im Composer. */
function promptTab(event: KeyboardEvent): void {
  if (event.shiftKey || !exampleOpen.value || !composerExample.value || promptDraft.value.length > 0) return
  event.preventDefault()
  takeExample()
}

/**
 * EINE GETIPPTE ANTWORT — und was daraus folgt (P3.2, unverändert).
 * Der Text gehört in den SLOT; danach macht der Berater dazu einen Zug. Ohne
 * offene Frage ist er eine FREIE Frage ohne Slot — geschrieben wird dann nichts.
 */
async function answerFromGeorge(text: string): Promise<void> {
  const slot = nextSlot.value
  const question = slot ? t(questionKeyFor(slot, pathKind.value)) : ''

  if (slot) store.setSlotValue(slot.id, text)
  store.addUserMessage(`answer-${slot?.id ?? 'free'}-${store.streamMessages.length}`, text)
  if (slot) autosave.schedule()

  const upcoming = nextSlot.value
  await conversation.converse({
    text,
    slotId: slot?.id,
    question,
    nextSlotId: upcoming?.id,
    nextQuestion: upcoming ? t(questionKeyFor(upcoming, pathKind.value)) : '',
  })
}

/**
 * Das Prompt bedient den offenen answer-Zug — und die freie Frage (s. Kopf,
 * Abweichung 2). Gesperrt ist es nur, wenn eine AUSWAHL dran ist: die hat ihr
 * eigenes Modul im Zug.
 */
const promptEnabled = computed(() => nextSlot.value?.type !== 'choice')

async function submitPrompt(): Promise<void> {
  const said = promptDraft.value.trim()
  if (!said || !promptEnabled.value || conversation.pending.value) return
  promptDraft.value = ''
  exampleOpen.value = false
  await answerFromGeorge(said)
}

// ── Slot-Zustände: eine Rechnung, zwei Leser (Bühne + Log) ────────────────

/**
 * WELCHE Karte gerade im Feld-Modus steht — höchstens EINE, in der Bühne wie
 * im Log. „Korrigieren" ist ein Umschalter, kein Dauerzustand: eine Spalte
 * voller offener Textfelder wäre wieder das Formular, das dieser Umbau ersetzt.
 */
const editingSlotId = ref<string | null>(null)

function onInput(slotId: string, value: string): void {
  store.setSlotValue(slotId, value)
  autosave.schedule()
}

async function confirmSlot(slotId: string): Promise<void> {
  editingSlotId.value = null
  store.setSlotConfirmed(slotId, true)
  await autosave.flush()
}

/**
 * „KORRIGIEREN" — die EINZIGE Tür zurück (Davids Entscheidung 2026-09-02).
 * Ein bestätigter Slot ist zu; Aufheben ist eine Änderung wie jede andere
 * (dieselbe `revision`-Rechnung, derselbe 409-Weg). Deshalb `flush()` und
 * nicht `schedule()`: erst wenn der Server es bestätigt, ist der Slot offen.
 */
async function reviseSlot(slotId: string): Promise<void> {
  store.setSlotConfirmed(slotId, false)
  editingSlotId.value = slotId
  await autosave.flush()
}

/** Der Hinweis je Slot („wärmer", „kürzer") — lokal, nie gespeichert. */
const hints = ref<Record<string, string>>({})
const hintOpen = ref(false)

/** Die Bedien-Zustände der Bühne hängen am BAUSTEIN und fallen mit ihm. */
watch(routeStepKey, () => {
  hints.value = {}
  hintOpen.value = false
  promptDraft.value = ''
  exampleOpen.value = false
  editingSlotId.value = null
})

/**
 * ── DAS BEREITSCHAFTS-GATE, SCHON VOR DEM KLICK ──────────────────────────
 * Dieselbe pure Regel wie in der Route (`slotReadiness`), aus denselben
 * Quellen. Die Route ist die Durchsetzung, das hier ist die Ehrlichkeit:
 * statt eines Knopfes, der gleich ein 409 kassiert, steht da ein Satz, WAS
 * fehlt. `coveredSteps` ist bewusst nur der GELADENE Baustein — Quell-Slots
 * anderer Bausteine kennt der Browser nicht, und die Regel lässt im Zweifel
 * durch (der Server prüft mit allen neun Zeilen).
 */
const slotValues = computed<Record<string, string>>(() => {
  const values: Record<string, string> = {}
  for (const id of new Set([...Object.keys(store.serverSlots), ...Object.keys(store.localEdits)])) {
    values[id] = store.slotValue(id)
  }
  return values
})

function readinessOf(slot: BrandSlot): BrandSlotReadiness {
  return slotReadiness(slot.id, {
    startCard: store.profile?.startCard ?? { websiteUrl: '', industry: '', about: '', audience: '' },
    hasSiteAnalysis: Boolean(store.profile?.siteAnalysis.analyzedAt),
    records: slotValues.value,
    coveredSteps: store.stepKey ? [store.stepKey] : [],
  })
}

/** Die Bedarfs-Schlüssel tragen Punkte (`startcard.about`), i18n-Knoten nicht. */
const READINESS_KEYS: Record<BrandReadinessNeed, string> = {
  'startcard.about': 'startcardAbout',
  'startcard.audience': 'startcardAudience',
  'startcard.industry': 'startcardIndustry',
  'competitor_names': 'competitorNames',
  'source_texts': 'sourceTexts',
  'source_slots': 'sourceSlots',
}

function readinessNote(readiness: BrandSlotReadiness): string | null {
  if (readiness.ready) return null
  return t('brand.workspace.ready.needs', {
    advisor: voice.name,
    needs: readiness.missing.map(need => t(`brand.workspace.ready.need.${READINESS_KEYS[need]}`)).join(' · '),
  })
}

/**
 * Je Slot: WAS er gerade ist (leer · Entwurf · bestätigt) und WELCHE
 * Bedienelemente dazugehören. Die Entscheidung liegt pur nebenan
 * (`brandSlotControls`) und ist dort vollständig getestet.
 */
interface BrandSlotCard {
  slot: BrandSlot
  controls: BrandSlotControls
  /** Der Satz des Bereitschafts-Gates — nur, wenn er auch gezeigt wird. */
  note: string | null
}

const slotCards = computed<BrandSlotCard[]>(() => slots.value.map((slot) => {
  const readiness = readinessOf(slot)
  const controls = brandSlotControls({
    confirmed: store.slotConfirmed(slot.id),
    hasValue: store.slotValue(slot.id).length > 0,
    isGeorgeDraft: store.slotIsGeorgeDraft(slot.id),
    hasEditor: slot.editor !== 'none',
    // Der Paarvergleich (Katalog §12) hat kein Feld und keine Bestätigung.
    confirmable: slot.type !== 'special',
    generatable: slot.generator !== 'none',
    hasHistory: Boolean(store.serverSlots[slot.id]?.firstDraft),
    ready: readiness.ready,
  })
  return { slot, controls, note: controls.showReadinessNote ? readinessNote(readiness) : null }
}))

function cardFor(slotId: string): BrandSlotCard | null {
  return slotCards.value.find(entry => entry.slot.id === slotId) ?? null
}

/** Der Balken DIESES Kapitels — der Gesamt-Weg steht unten rechts im Log. */
const chapterProgress = computed(() => brandChapterProgress(slotCards.value.map(entry => entry.controls)))

async function generateSlot(slot: BrandSlot): Promise<void> {
  await generation.generate(slot.id, hints.value[slot.id] ?? '')
  // Der Hinweis hat gewirkt oder nicht — stehen bleiben soll er nicht, sonst
  // reist er stillschweigend in den nächsten Versuch.
  hints.value = { ...hints.value, [slot.id]: '' }
  hintOpen.value = false
}

/**
 * `ai_disabled` und `no_generator` sind BETRIEBSZUSTÄNDE, kein Unglück: der
 * Stand bleibt voll bearbeitbar (§9b.5). Vom GESPRÄCH kommt hier nur die
 * Drossel an — ein ausgefallener Zug bleibt still (s. `useBrandConversation`).
 */
const generationNotice = computed<string | null>(() => {
  const code = generation.failureCode.value ?? conversation.failureCode.value
  if (!code) return null
  const throttled = brandAiRejectionMessageKey(code)
  if (throttled) return t(throttled)
  if (code === 'ai_disabled') return t('brand.workspace.generate.aiDisabled')
  if (code === 'no_generator') return t('brand.workspace.generate.noGenerator')
  if (code === 'generation_active') return t('brand.workspace.generate.busy')
  if (code === 'aborted') return t('brand.workspace.generate.stopped')
  if (code === 'not_ready') return t('brand.workspace.generate.notReady')
  if (code === 'slot_confirmed') return t('brand.workspace.generate.slotConfirmed')
  return t('brand.workspace.generate.failed')
})

// ── Das Antwort-Modul im Zug ──────────────────────────────────────────────

/**
 * GENAU EIN MODUL IST DRAN — die Bühne fragt nie zwei Dinge gleichzeitig.
 *
 * 'answer'  offene Menschenfrage → Beispiel-Link, geantwortet wird im Prompt
 * 'options' offene Auswahl       → volle Zeilen, „Übermitteln" unten rechts
 * 'draft'   George entwirft/hat entworfen → Nochmal · Korrigieren · Übernehmen
 * 'confirm' es steht ein Text, der nur noch bestätigt werden muss
 * 'gate'    alle Pflicht-Slots bestätigt → die Konfidenz-Weiche
 * 'none'    nichts offen und nichts zu bestätigen (kommt praktisch nur vor,
 *           während der Baustein gerade abgeschlossen wird)
 */
type StageModule = 'answer' | 'options' | 'draft' | 'confirm' | 'gate' | 'none'

const completion = computed(() =>
  (stepKey.value ? brandStepCompletion(stepKey.value, slotFacts.value) : null))

/** Der erste Pflicht-Slot ohne Bestätigung — in Registry-Reihenfolge. */
const pendingCard = computed<BrandSlotCard | null>(() => {
  const first = completion.value?.missingRequired[0]
  return first ? cardFor(first) : null
})

const stageModule = computed<StageModule>(() => {
  if (nextSlot.value) return nextSlot.value.type === 'choice' ? 'options' : 'answer'
  if (completion.value && !completion.value.slotsReady) {
    const card = pendingCard.value
    if (!card) return 'none'
    return card.controls.showGenerate ? 'draft' : 'confirm'
  }
  return completion.value?.slotsReady ? 'gate' : 'none'
})

/**
 * Die offenen Felder in der Sprache der Bühne: GENAU die Beschriftung, unter
 * der sie im Log stehen — ein zweiter Wortlaut hiesse, dass der Mensch das
 * gesuchte Feld nicht wiedererkennt.
 */
const pendingConfirmations = computed<string[]>(() =>
  (completion.value?.missingRequired ?? []).map((slotId) => {
    const slot = slots.value.find(entry => entry.id === slotId)
    return slot ? slotLabel(slot) : slotId
  }))

/**
 * DIE AUSWAHL-OPTIONEN kommen aus dem Feld selbst (P3.1): George legt sie als
 * Text hinein, hier gibt es keine zweite Liste. Solange nichts drinsteht,
 * bleibt das Modul eine Zeile mit „Übermitteln" für die eigene Formulierung —
 * ein erfundener Options-Katalog wäre genau der Schaden, den
 * `brandChoiceOptions` verhindert.
 */
const ownChoice = ref('')
watch(nextSlot, () => { ownChoice.value = '' })

async function submitChoice(): Promise<void> {
  const said = ownChoice.value.trim()
  if (!said) return
  ownChoice.value = ''
  await answerFromGeorge(said)
}

// ── Der Log: Kapitel-Sektionen und ihre Karten ────────────────────────────

/**
 * EINE KARTE IM LOG. Für das LAUFENDE Kapitel kommt sie aus `slotCards`
 * (voll bedienbar); für ein anderes Kapitel aus einem eigenen, LESENDEN Abruf
 * derselben GET-Route — der Store darf dafür nicht benutzt werden, denn
 * `applyStepDetail` würde den offenen Baustein ersetzen.
 */
interface LogCard {
  id: string
  label: string
  note: string
  value: string
  confirmed: boolean
  /** Nur im laufenden Kapitel: die Bedienelemente. */
  controls: BrandSlotControls | null
}

const logChaptersOpen = ref<Set<string>>(new Set())
const foreignSlots = ref<Record<string, Record<string, BrandSlotView>>>({})

watch(routeStepKey, (key) => {
  logChaptersOpen.value = new Set(key ? [key] : [])
  foreignSlots.value = {}
}, { immediate: true })

interface LogChapter {
  stepKey: string
  label: string
  state: BrandJourneyStep['state']
  confirmed: number
  total: number
  current: boolean
}

const logChapters = computed<LogChapter[]>(() => store.railSteps.map((entry) => {
  const current = entry.stepKey === stepKey.value
  const confirmed = current
    ? (completion.value?.confirmed ?? 0)
    : entry.progress.requiredTotal - entry.missingRequired.length
  return {
    stepKey: entry.stepKey,
    label: t(`brand.steps.${entry.stepKey}`),
    state: entry.state,
    confirmed,
    total: current ? (completion.value?.total ?? 0) : entry.progress.requiredTotal,
    current,
  }
}))

function chapterCards(chapter: LogChapter): LogCard[] {
  if (chapter.current) {
    return slotCards.value.map(entry => ({
      id: entry.slot.id,
      label: slotLabel(entry.slot),
      note: slotNote(entry.slot),
      value: store.slotValue(entry.slot.id),
      confirmed: entry.controls.state === 'confirmed',
      controls: entry.controls,
    }))
  }
  const loaded = foreignSlots.value[chapter.stepKey]
  if (!loaded) return []
  return slotsForStep(chapter.stepKey as BrandStepKey).map(slot => ({
    id: slot.id,
    label: slotLabel(slot),
    note: slotNote(slot),
    value: brandSlotDisplayValue(loaded[slot.id]),
    confirmed: brandSlotIsConfirmed(loaded[slot.id]),
    controls: null,
  }))
}

/**
 * Ein fremdes Kapitel wird beim AUFKLAPPEN gelesen, nicht auf Vorrat: neun
 * Abrufe beim Betreten der Werkstatt wären neun Anfragen für etwas, das
 * niemand aufgeschlagen hat. FAIL-SOFT — bleibt der Abruf aus, ist die
 * Sektion eben leer.
 */
async function toggleChapter(chapter: LogChapter): Promise<void> {
  const open = new Set(logChaptersOpen.value)
  if (open.has(chapter.stepKey)) {
    open.delete(chapter.stepKey)
    logChaptersOpen.value = open
    return
  }
  open.add(chapter.stepKey)
  logChaptersOpen.value = open
  if (chapter.current || foreignSlots.value[chapter.stepKey]) return
  try {
    const detail = await $fetch<BrandStepDetailResponse>(
      `/api/brand/profiles/${profileId.value}/steps/${chapter.stepKey}`,
    )
    foreignSlots.value = { ...foreignSlots.value, [chapter.stepKey]: detail.slots }
  }
  catch {
    foreignSlots.value = { ...foreignSlots.value, [chapter.stepKey]: {} }
  }
}

function chapterGlyph(chapter: LogChapter): { name: string, style: string } {
  if (chapter.state === 'done') return { name: 'i-ph-check-circle-fill', style: 'color: var(--bw-accent)' }
  if (chapter.state === 'locked') return { name: 'i-ph-lock-simple', style: 'color: var(--bw-muted)' }
  if (chapter.state === 'active' || chapter.current) return { name: 'i-ph-circle-half-fill', style: 'color: var(--bw-ink)' }
  return { name: 'i-ph-circle', style: 'color: var(--bw-muted)' }
}

// ── Frühere Fassungen ─────────────────────────────────────────────────────

/**
 * DIE WIEDERHERSTELLUNG SCHREIBT IN DEN EDITOR, NICHT AUF DEN SERVER — eine
 * gewöhnliche lokale Eingabe über den NORMALEN Autosave, mit derselben
 * `revision`-Rechnung wie jeder Tastendruck.
 */
const versionsSlot = ref<BrandSlot | null>(null)
const versions = ref<BrandGenerationVersionsResponse | null>(null)
const versionsLoading = ref(false)

const versionsOpen = computed({
  get: () => versionsSlot.value !== null,
  set: (value: boolean) => { if (!value) versionsSlot.value = null },
})

/** Auf einem bestätigten Slot ist die Liste lesbar, die Übernahme nicht. */
const versionsControls = computed<BrandSlotControls | null>(() =>
  (versionsSlot.value ? cardFor(versionsSlot.value.id)?.controls ?? null : null))

async function openVersions(slot: BrandSlot): Promise<void> {
  versionsSlot.value = slot
  versions.value = null
  versionsLoading.value = true
  try {
    versions.value = await $fetch<BrandGenerationVersionsResponse>(
      `/api/brand/profiles/${profileId.value}/steps/${routeStepKey.value}/generations`,
      { query: { slotId: slot.id } },
    )
  }
  catch {
    // Eine unlesbare Historie ist kein Grund, die Werkstatt zu stören.
    versions.value = null
  }
  finally {
    versionsLoading.value = false
  }
}

function useVersion(text: string): void {
  const slot = versionsSlot.value
  if (!slot) return
  store.setSlotValue(slot.id, text)
  autosave.schedule()
  versionsSlot.value = null
}

// ── „Website lesen" (P2.3) ────────────────────────────────────────────────

/**
 * NUR IM BAUSTEIN KONTEXT und nur mit hinterlegter Adresse. ZWEI KLICKS,
 * KEINE CHECKBOX: der erste zeigt den Satz, der zweite löst aus.
 */
const siteUrl = computed(() => store.profile?.startCard.websiteUrl ?? '')
const showSiteStrip = computed(() => stepKey.value === 'context' && siteUrl.value.length > 0)

const siteAnalysis = ref<BrandSiteAnalysisView | null>(null)
watch(
  () => store.profile?.siteAnalysis,
  (value) => { siteAnalysis.value = value ?? null },
  { immediate: true },
)

const siteConsent = ref(false)
const siteRunning = ref(false)
const siteError = ref<string | null>(null)
const siteDone = ref<BrandSiteAnalyzeResponse | null>(null)

watch(routeStepKey, () => {
  siteConsent.value = false
  siteError.value = null
  siteDone.value = null
})

/** Die Gründe kommen als `data.reason`; ein unbekannter fällt auf den allgemeinen Satz. */
const SITE_ERROR_KEYS: Record<string, string> = {
  no_url: 'brand.workspace.site.error.noUrl',
  blocked_target: 'brand.workspace.site.error.blocked',
  not_html: 'brand.workspace.site.error.notHtml',
  too_large: 'brand.workspace.site.error.tooLarge',
  fetch_failed: 'brand.workspace.site.error.unreachable',
  brand_analyze_daily_limit: 'brand.workspace.site.error.dailyLimit',
}

function siteDate(iso: string): string {
  return iso ? new Date(iso).toLocaleDateString(locale.value) : ''
}

async function readSite(): Promise<void> {
  siteRunning.value = true
  siteError.value = null
  siteDone.value = null
  try {
    const response = await $fetch<BrandSiteAnalyzeResponse>(
      `/api/brand/profiles/${profileId.value}/analyze`,
      { method: 'POST', body: {} },
    )
    siteDone.value = response
    siteAnalysis.value = {
      url: siteUrl.value,
      analyzedAt: response.analyzedAt,
      textLength: response.textLength,
      stale: false,
    }
    siteConsent.value = false
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } }).data?.reason ?? ''
    siteError.value = SITE_ERROR_KEYS[reason] ?? 'brand.workspace.site.error.failed'
  }
  finally {
    siteRunning.value = false
  }
}

// ── Leiste, Balken, Fortschritt ───────────────────────────────────────────

function railState(state: string): BwRailStep['state'] {
  if (state === 'done') return 'done'
  if (state === 'active') return 'active'
  return 'open'
}

/**
 * DAS INFO-PAKET EINES BAUSTEINS kommt aus der Slot-Registry: die
 * Entscheidungen sind seine Pflicht-Slots, „erledigt" ist bestätigt. Für den
 * OFFENEN Baustein steht der Live-Stand darin, für die anderen der Stand aus
 * der Journey (`missingRequired`) — mehr weiss der Browser über sie nicht,
 * und mehr behauptet der Layer auch nicht.
 */
function railInfo(entry: BrandJourneyStep): BwRailStepInfo {
  const done = new Set(
    entry.stepKey === stepKey.value
      ? slots.value.filter(slot => store.slotConfirmed(slot.id)).map(slot => slot.id)
      : slotsForStep(entry.stepKey).filter(slot => slot.required && !entry.missingRequired.includes(slot.id)).map(slot => slot.id),
  )
  return {
    bausteine: slotsForStep(entry.stepKey)
      .filter(slot => slot.required)
      .map(slot => ({ label: slotLabel(slot), note: slotNote(slot), done: done.has(slot.id) })),
  }
}

const railLayers = computed<BwRailLayer[]>(() => [{
  id: 'foundation',
  label: t('brand.workspace.railLayer'),
  steps: store.railSteps.map((entry): BwRailStep => ({
    id: entry.stepKey,
    label: t(`brand.steps.${entry.stepKey}`),
    icon: '',
    state: entry.stepKey === stepKey.value && entry.state !== 'done' ? 'active' : railState(entry.state),
    info: railInfo(entry),
  })),
}])

/** Die Marken des Kontos für den Wähler oben in der Sidebar. */
const LOCALE_FLAGS: Record<string, string> = { en: 'i-circle-flags-us', de: 'i-circle-flags-de' }

const sidebarBrands = computed<BwSidebarBrand[]>(() => store.profiles.map(profile => ({
  id: profile.id,
  title: profile.title || t('brand.brands.card.untitled'),
  path: t(`brand.brands.card.path.${profile.pathKind}`),
  flag: LOCALE_FLAGS[profile.contentLocale],
  to: localePath(`/brand/${profile.id}/${profile.currentStepKey}`),
  current: profile.id === profileId.value,
})))

/**
 * DER GESAMT-FORTSCHRITT unten rechts. Er zählt über ALLE Bausteine auf dem
 * Weg; für den OFFENEN nimmt er den LIVE-Stand (`stepProgress` aus denselben
 * Slot-Tatsachen wie die Bühne), für die anderen den der Journey. Der
 * Server-Cache `profile.progressPct` bewegt sich erst beim Speichern — hier
 * soll sich der Balken beim Tippen bewegen.
 */
const overallProgress = computed(() => {
  let total = 0
  let filled = 0
  for (const entry of store.railSteps) {
    if (entry.stepKey === stepKey.value) {
      const live = stepProgress(entry.stepKey, slotFacts.value)
      total += live.requiredTotal
      filled += live.requiredFilled
      continue
    }
    total += entry.progress.requiredTotal
    filled += entry.progress.requiredFilled
  }
  return { total, filled, pct: total === 0 ? 100 : Math.round((filled / total) * 100) }
})

/** Grobe Restzeit — dieselbe Zahl wie auf der Übersicht (Interaktionsbilanz). */
const TOTAL_MINUTES = 45
const remainingTime = computed(() => t('brand.brands.card.remaining', {
  minutes: Math.max(1, Math.round(((100 - overallProgress.value.pct) / 100) * TOTAL_MINUTES)),
}))

/** `BwWorkspace` zeigt nur ABWEICHUNGEN — Stille heisst gespeichert (§3e). */
const workspaceSync = computed<'saving' | 'offline' | 'conflict' | 'error' | null>(
  () => (store.syncState === 'saved' ? null : store.syncState),
)
const workspaceSyncLabel = computed(() =>
  (store.syncState === 'saved' ? undefined : t(`brand.workspace.sync.${store.syncState}`)))

/* Runde 20/33 (David): beide Spalten sind über den Bühnen-Balken einklappbar. */
const railCollapsed = ref(false)
const logCollapsed = ref(false)

// ── Navigation ────────────────────────────────────────────────────────────

async function goToStep(key: string | null): Promise<void> {
  if (!key || key === routeStepKey.value) return
  if (!store.canEnter(key)) return
  // §3e „vor interner Navigation": der Baustein-Wechsel bleibt in derselben
  // Komponente, `onBeforeRouteLeave` feuert dafür NICHT.
  await autosave.flush()
  await navigateTo(localePath(`/brand/${profileId.value}/${key}`))
}

// ── Konfidenz-Weiche ──────────────────────────────────────────────────────

const confidenceOptions = computed(() => BRAND_CONFIDENCE_VALUES.map(value => ({
  id: value,
  label: t(`brand.workspace.confidence.${value}`),
  recommended: false,
  // „Nochmal von vorn" ist der Weg ZURÜCK und steht deshalb abgesetzt — leiser
  // als die beiden anderen, nicht lauter (s. `BwChips`).
  ...(value === 'restart' ? { tone: 'quiet' as const } : {}),
})))

const completing = ref(false)

async function pickConfidence(value: string): Promise<void> {
  const confidence = value as BrandConfidence
  store.setConfidence(confidence)
  await autosave.flush()
  // Nur „Passt" schliesst ab — „Fast" und „Nochmal von vorn" sind
  // Vertiefungsrunden (§3b.8) und bleiben im Baustein.
  if (confidence !== 'fits') return

  completing.value = true
  try {
    await store.completeStep(profileId.value)
    await goToStep(store.neighbourStep(1))
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } }).data?.reason
    toast.add({
      color: 'warning',
      title: t('brand.workspace.completeFailed'),
      description: reason === 'required_slots_missing'
        ? t('brand.workspace.missingRequired')
        : undefined,
    })
  }
  finally {
    completing.value = false
  }
}

// ── 409 ───────────────────────────────────────────────────────────────────

const conflictOpen = computed({
  get: () => store.conflict !== null,
  // Wegklicken löst den Konflikt NICHT auf — der Autosave bleibt angehalten,
  // bis eine der beiden Aktionen gewählt wurde.
  set: () => {},
})

interface ConflictRow { slotId: string, label: string, mine: string, server: string }

const conflictRows = computed<ConflictRow[]>(() => {
  const current = store.conflict
  if (!current) return []
  return Object.keys(store.localEdits)
    .map((slotId) => {
      const slot = slots.value.find(entry => entry.id === slotId)
      return {
        slotId,
        label: slot ? slotLabel(slot) : slotId,
        mine: store.slotValue(slotId),
        server: brandSlotDisplayValue(current.slots[slotId]),
      }
    })
    // Nur ECHTE Abweichungen (Davids „same same"-Fund).
    .filter(row => row.mine !== row.server)
})

const copied = ref<'ok' | 'failed' | null>(null)

async function copyMine(): Promise<void> {
  const text = conflictRows.value.map(row => `${row.label}\n${row.mine}`).join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = 'ok'
  }
  catch {
    copied.value = 'failed'
  }
}

function loadServerVersion(): void {
  copied.value = null
  store.resolveWithServer()
}

useBrandTitle(() => (store.profile?.title || t('brand.brands.card.untitled')))
</script>

<template>
  <!-- Kein Beta-Zugang oder gesperrter Baustein: eine Fläche, keine Fehlerseite. -->
  <div v-if="store.denied || store.blocked" class="bw-root grid min-h-dvh place-items-center px-6">
    <div class="max-w-md text-center">
      <BwIllustration variant="journey" class="mx-auto h-16 w-auto" style="color: var(--bw-ink-soft)" />
      <p class="mt-4 font-medium">
        {{ store.denied ? t('brand.workspace.noAccess.title') : t('brand.workspace.stepLocked.title') }}
      </p>
      <p class="mt-1 text-sm" style="color: var(--bw-muted)">
        {{ store.denied ? t('brand.workspace.noAccess.description') : t('brand.workspace.stepLocked.description') }}
      </p>
      <UButton
        class="mt-5 rounded-full" variant="outline" :to="localePath('/dashboard/brands')"
        :label="t('brand.brands.title')"
      />
    </div>
  </div>

  <!-- Runde 16/20/31 (David): Sidebar-Muster links, keine Topbar, kein
       Rail-Fuß — der Gesamt-Fortschritt wohnt unten rechts im Log. Die
       feste Rail-Breite schaltet in BwWorkspace zugleich den Pre-Mount-Zweig
       frei (R30), damit beim Laden nichts springt. -->
  <BwWorkspace
    v-else
    :progress-pct="chapterProgress.pct"
    :content-locale="store.profile?.contentLocale ?? locale"
    :locale-in-topbar="false"
    :topbar="false"
    :rail-footer="false"
    rail-width="300px"
    :rail-collapsed="railCollapsed"
    :george-collapsed="logCollapsed"
    :sync-state="workspaceSync"
    :sync-label="workspaceSyncLabel"
    style="--bw-rail-pad-x: 1rem; --bw-rail-pad-y: 0.75rem"
  >
    <template #rail>
      <BwWorkspaceSidebar
        :layers="railLayers"
        :brands="sidebarBrands"
        :manage-to="localePath('/dashboard/brands')"
        :sync-state="workspaceSync"
        :sync-label="workspaceSyncLabel"
        @select="goToStep"
      />
    </template>

    <!-- Der Balken gehört NUR zur Gesprächs-Spalte (Runde 32): links das
         Nav-Icon, dann zweizeilig BEREICH über Kapitel, rechts das
         gespiegelte Gegenstück für den Log. -->
    <template #stage-bar>
      <div class="flex min-w-0 flex-1 items-center gap-1.5">
        <UButton
          size="sm" color="neutral" variant="ghost"
          icon="i-ph-sidebar-simple"
          :aria-label="railCollapsed ? t('brand.workspace.bar.showNav') : t('brand.workspace.bar.hideNav')"
          @click="railCollapsed = !railCollapsed"
        />
        <div class="min-w-0 leading-tight">
          <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">{{ t('brand.workspace.railLayer') }}</p>
          <p class="truncate font-semibold">{{ stepKey ? t(`brand.steps.${stepKey}`) : '' }}</p>
        </div>
        <UButton
          size="sm" color="neutral" variant="ghost" class="ml-auto"
          icon="i-ph-sidebar-simple" :ui="{ leadingIcon: '-scale-x-100' }"
          :aria-label="logCollapsed ? t('brand.workspace.bar.showLog') : t('brand.workspace.bar.hideLog')"
          @click="logCollapsed = !logCollapsed"
        />
      </div>
    </template>

    <!-- MITTE: die Bühne IST das Gespräch. -->
    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-7 pb-4">
        <!-- Ein RUHIGER Hinweis, kein Toast-Gewitter: „KI ist aus" und „hier
             entwirft niemand" sind Zustände, in denen weitergearbeitet wird. -->
        <p v-if="generationNotice" class="bw-pending flex items-center gap-2">
          <span>{{ generationNotice }}</span>
          <button type="button" class="underline" @click="generation.dismissFailure(); conversation.dismissFailure()">
            {{ t('brand.workspace.generate.dismiss') }}
          </button>
        </p>

        <!-- „Website lesen" (P2.3) — nur im Baustein Kontext und nur mit
             hinterlegter Adresse. Er SAGT, dass gelesen wird, und tut es erst
             nach einer Bestätigung. -->
        <div v-if="showSiteStrip" class="rounded-2xl px-4 py-3" style="background: var(--bw-surface)">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.site.label') }}</p>
              <p class="mt-0.5 truncate text-sm" style="color: var(--bw-ink-soft)">
                <template v-if="siteAnalysis?.analyzedAt">
                  {{ t('brand.workspace.site.read', { date: siteDate(siteAnalysis.analyzedAt) }) }}
                </template>
                <template v-else>{{ t('brand.workspace.site.never') }}</template>
              </p>
            </div>

            <div class="flex flex-none items-center gap-2">
              <template v-if="siteConsent">
                <UButton
                  size="sm" class="rounded-full" :loading="siteRunning"
                  :label="t('brand.workspace.site.confirm')" @click="readSite"
                />
                <UButton
                  size="sm" variant="ghost" color="neutral" class="rounded-full"
                  :disabled="siteRunning"
                  :label="t('brand.workspace.site.cancel')" @click="siteConsent = false"
                />
              </template>
              <UButton
                v-else
                size="sm" variant="ghost" color="neutral" class="rounded-full"
                icon="i-ph-globe"
                :label="siteAnalysis?.analyzedAt ? t('brand.workspace.site.again') : t('brand.workspace.site.start')"
                @click="siteConsent = true"
              />
            </div>
          </div>

          <p v-if="siteConsent" class="mt-2 text-sm" style="color: var(--bw-ink-soft)">
            {{ t('brand.workspace.site.consent') }}
          </p>
          <p v-if="siteRunning" class="bw-pending mt-2">{{ t('brand.workspace.site.running') }}</p>
          <p v-else-if="siteDone" class="mt-2 text-sm" style="color: var(--bw-ink-soft)">
            {{ t('brand.workspace.site.done', { chars: siteDone.textLength }) }}
          </p>
          <p v-else-if="siteError" class="mt-2 text-sm" style="color: var(--bw-stale)">{{ t(siteError) }}</p>
          <p v-else-if="siteAnalysis?.stale" class="mt-2 text-sm" style="color: var(--bw-stale)">
            {{ t('brand.workspace.site.stale') }}
          </p>
        </div>

        <p v-if="phaseIntro" class="bw-label" style="color: var(--bw-muted); padding-left: 2.65rem">{{ phaseIntro }}</p>

        <div v-for="(turn, index) in turns" :key="turn.id" class="bw-msg" :class="turn.role === 'user' ? 'bw-msg--user' : ''">
          <!-- Der Avatar IST der Weg zum Steckbrief (Runde 20) — eine eigene
               Berater-Zeile gibt es seit dem Umbau nicht mehr. Er trägt IMMER
               George: die Stimme wechselt nicht mit dem Kapitel. -->
          <button
            v-if="turn.role === 'george'" class="flex-none self-start rounded-full"
            :aria-label="t('brand.workspace.advisorInfo.open', { name: voice.name })"
            @click="advisorInfoOpen = true"
          >
            <BwGeorgeAvatar size="md" :src="voice.avatar" :initial="voice.name.slice(0, 1)" :alt="voice.name" />
          </button>
          <div class="bw-msg-body">
            <!-- Interpolation statt v-html: der Text kommt aus einem
                 Sprachmodell und wird escaped gerendert. -->
            <p class="whitespace-pre-wrap">{{ turn.text }}<span v-if="turn.pending" class="bw-caret" aria-hidden="true">▍</span></p>
            <p v-if="turn.help" class="bw-msg-help">{{ turn.help }}</p>

            <!-- Die Antwort-Module hängen am LETZTEN Zug: die Frage steht
                 immer ÜBER den Aktionen (Davids Korrekturrunde 1). -->
            <template v-if="index === turns.length - 1 && turn.role === 'george'">
              <!-- ANSWER: nur der Beispiel-Ausweg; geantwortet wird im Prompt. -->
              <div v-if="stageModule === 'answer' && composerExample" class="mt-2">
                <button class="bw-label underline" style="color: var(--bw-muted)" @click="exampleOpen = !exampleOpen">
                  {{ exampleOpen ? t('brand.workspace.example.hide') : t('brand.workspace.example.show') }}
                </button>
                <button v-if="exampleOpen" class="bw-pending mt-2 block text-left" @click="takeExample">
                  „{{ composerExample }}“ — {{ t('brand.workspace.example.take') }}
                </button>
              </div>

              <!-- OPTIONS: die Auswahl beantwortet sich im eigenen Modul.
                   Ohne „Überspringen" (Runde 39, David): die Positionierung
                   ist die Kernentscheidung, nicht eine Frage unter vielen. -->
              <div v-else-if="stageModule === 'options'" class="mt-3 rounded-2xl p-4" style="background: var(--bw-surface-hi)">
                <div class="rounded-xl px-4 py-3" style="background: var(--bw-paper)">
                  <span class="block text-sm font-medium">{{ nextSlot ? slotLabel(nextSlot) : '' }}</span>
                  <UInput
                    v-model="ownChoice" size="sm" class="mt-2 w-full"
                    :placeholder="t('brand.workspace.ownAnswerPlaceholder')"
                    :aria-label="t('brand.workspace.sendOwnAnswer')"
                    @keydown.enter="submitChoice"
                  />
                </div>
                <div class="mt-3 flex items-center justify-end gap-2">
                  <UButton
                    color="neutral" variant="ghost" class="bw-send rounded-full"
                    :label="t('brand.workspace.submitChoice')"
                    :disabled="!ownChoice.trim() || conversation.pending.value"
                    @click="submitChoice"
                  />
                </div>
              </div>

              <!-- DRAFT: der Entwurfs-Moment. Basis-Zeile, gestrichelter
                   Rahmen (fällt mit der Bestätigung), drei Wege heraus. -->
              <div v-else-if="stageModule === 'draft' && pendingCard" class="mt-3">
                <div :class="pendingCard.controls.showDraftBadge ? 'bw-draft-frame' : ''">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="bw-label" style="color: var(--bw-muted)">{{ slotLabel(pendingCard.slot) }}</p>
                    <span v-if="pendingCard.controls.showDraftBadge" class="bw-state bw-state--draft">
                      <UIcon name="i-ph-pen-nib" />
                      {{ t('brand.workspace.draftBadge') }}
                    </span>
                  </div>
                  <UTextarea
                    v-if="editingSlotId === pendingCard.slot.id && pendingCard.controls.editable"
                    class="mt-3 w-full" :rows="4" :maxlength="pendingCard.slot.maxLength"
                    :model-value="store.slotValue(pendingCard.slot.id)"
                    @update:model-value="value => onInput(pendingCard!.slot.id, String(value))"
                    @blur="autosave.flush()"
                  />
                  <p v-else-if="store.slotValue(pendingCard.slot.id)" class="bw-doc-text mt-3 whitespace-pre-wrap">
                    {{ store.slotValue(pendingCard.slot.id) }}
                  </p>
                  <p v-else class="bw-pending mt-3">{{ t('brand.workspace.stage.pending') }}</p>
                </div>

                <!-- ZU WENIG IST ZU WENIG: statt eines Knopfes, der in ein 409
                     läuft, steht hier ruhig, was fehlt. -->
                <p v-if="pendingCard.note" class="bw-pending mt-2">{{ pendingCard.note }}</p>

                <!-- Links die WEITER-Wege (nochmal, frühere Fassungen),
                     rechts die ABSCHLUSS-Wege (korrigieren, übernehmen) —
                     dieselbe Aufteilung wie im Dummy. -->
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <template v-if="generation.isStreamingSlot(pendingCard.slot.id)">
                    <UButton
                      size="sm" variant="outline" color="neutral" class="rounded-full"
                      icon="i-ph-stop" :label="t('brand.workspace.generate.stop')"
                      @click="generation.stop()"
                    />
                  </template>
                  <template v-else>
                    <!-- Leerer Slot: George legt vor. Steht schon etwas da,
                         geht es nur noch MIT Hinweis weiter — „nochmal
                         genauso" wäre ein Klick ins Ungefähre. -->
                    <UButton
                      size="sm" color="neutral" variant="ghost" class="rounded-full"
                      icon="i-ph-sparkle"
                      :label="pendingCard.controls.showHint ? t('brand.workspace.retryWithHint') : t('brand.workspace.generate.start')"
                      :loading="generation.streaming.value"
                      :disabled="generation.streaming.value"
                      @click="pendingCard.controls.showHint ? (hintOpen = !hintOpen) : generateSlot(pendingCard.slot)"
                    />
                    <UButton
                      v-if="pendingCard.controls.showVersions"
                      size="sm" variant="ghost" color="neutral" class="rounded-full"
                      icon="i-ph-clock-counter-clockwise"
                      :label="t('brand.workspace.versions.open')"
                      @click="openVersions(pendingCard.slot)"
                    />
                    <UButton
                      v-if="pendingCard.controls.editable"
                      size="sm" color="neutral" variant="ghost" class="ml-auto rounded-full"
                      icon="i-ph-pencil-simple"
                      :label="editingSlotId === pendingCard.slot.id ? t('brand.workspace.reviseDone') : t('brand.workspace.reviseSlot')"
                      @click="editingSlotId = editingSlotId === pendingCard.slot.id ? null : pendingCard.slot.id"
                    />
                    <button
                      v-if="pendingCard.controls.showConfirm"
                      type="button" class="bw-confirm bw-confirm--open"
                      :class="pendingCard.controls.editable ? '' : 'ml-auto'"
                      :disabled="!pendingCard.controls.confirmEnabled"
                      @click="confirmSlot(pendingCard.slot.id)"
                    >
                      <UIcon name="i-ph-check" class="size-4" />
                      {{ t('brand.workspace.acceptAndConfirm') }}
                    </button>
                  </template>
                </div>
                <div v-if="hintOpen && pendingCard.controls.showHint" class="mt-2 flex items-center gap-2">
                  <UInput
                    size="sm" class="flex-1" maxlength="500"
                    :model-value="hints[pendingCard.slot.id] ?? ''"
                    :placeholder="t('brand.workspace.generate.hintPlaceholder')"
                    :aria-label="t('brand.workspace.generate.hintLabel')"
                    :disabled="generation.streaming.value"
                    @update:model-value="value => hints = { ...hints, [pendingCard!.slot.id]: String(value) }"
                    @keydown.enter="generateSlot(pendingCard!.slot)"
                  />
                  <UButton
                    size="sm" color="neutral" variant="ghost" class="bw-send rounded-full"
                    icon="i-ph-arrow-right" :aria-label="t('brand.workspace.generate.hintLabel')"
                    :disabled="generation.streaming.value"
                    @click="generateSlot(pendingCard.slot)"
                  />
                </div>
              </div>

              <!-- CONFIRM: die Karte trägt als Kopf die URSPRUNGSFRAGE des
                   Inhalts (Runde 37c), die Abschluss-Frage steht über den
                   Knöpfen, „Korrigieren" links neben „Bestätigen". -->
              <div v-else-if="stageModule === 'confirm' && pendingCard" class="mt-3">
                <div class="bw-draft-frame mb-3">
                  <p class="bw-label" style="color: var(--bw-muted)">{{ slotLabel(pendingCard.slot) }}</p>
                  <UTextarea
                    v-if="editingSlotId === pendingCard.slot.id && pendingCard.controls.editable"
                    class="mt-2 w-full" :rows="3" :maxlength="pendingCard.slot.maxLength"
                    :model-value="store.slotValue(pendingCard.slot.id)"
                    @update:model-value="value => onInput(pendingCard!.slot.id, String(value))"
                    @blur="autosave.flush()"
                  />
                  <p v-else-if="store.slotValue(pendingCard.slot.id)" class="bw-doc-text mt-2 whitespace-pre-wrap">
                    {{ store.slotValue(pendingCard.slot.id) }}
                  </p>
                  <p v-else class="bw-pending mt-2">{{ t('brand.workspace.stage.pending') }}</p>
                </div>
                <p class="mb-2 font-medium">{{ t('brand.workspace.confirmQuestion') }}</p>
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <button
                    v-if="pendingCard.controls.editable"
                    type="button" class="bw-confirm bw-confirm--ghost"
                    @click="editingSlotId = editingSlotId === pendingCard.slot.id ? null : pendingCard.slot.id"
                  >
                    <UIcon name="i-ph-pencil-simple" class="size-4" />
                    {{ editingSlotId === pendingCard.slot.id ? t('brand.workspace.reviseDone') : t('brand.workspace.reviseSlot') }}
                  </button>
                  <button
                    v-if="pendingCard.controls.showConfirm"
                    type="button" class="bw-confirm bw-confirm--open"
                    :disabled="!pendingCard.controls.confirmEnabled"
                    @click="confirmSlot(pendingCard.slot.id)"
                  >
                    <UIcon name="i-ph-check" class="size-4" />
                    {{ t('brand.workspace.confirmSlot') }}
                  </button>
                </div>
              </div>

              <!-- GATE: die Konfidenz-Weiche steht IM Gespräch, nicht daneben —
                   und erst, wenn `brandStepCompletion` sie halten kann. -->
              <div v-else-if="stageModule === 'gate'" class="mt-3">
                <p class="mb-2 font-medium">{{ t('brand.workspace.confidence.question') }}</p>
                <BwChips
                  :options="confidenceOptions"
                  :selected="store.confidence ? [store.confidence] : []"
                  :show-dont-know="false"
                  @pick="pickConfidence"
                />
                <p v-if="completing" class="bw-label mt-2" style="color: var(--bw-muted)">{{ t('brand.workspace.completeStep') }}</p>
              </div>
            </template>
          </div>
        </div>

        <!-- NOCH NICHT SO WEIT: eingerückt auf die Text-Flucht des Gesprächs
             (Avatar 2rem + Lücke 0.65rem). -->
        <div
          v-if="completion && !completion.slotsReady && !nextSlot"
          style="padding-left: 2.65rem"
        >
          <p class="bw-label" style="color: var(--bw-muted)">
            {{ t('brand.workspace.confidence.pending', {
              open: completion.missingRequired.length,
              total: completion.total,
            }) }}
          </p>
          <!-- Die NAMEN der offenen Felder, nicht nur ihre Zahl: der Hinweis
               soll zum nächsten Handgriff führen. Sie tragen genau die
               Beschriftung, unter der sie rechts im Log stehen. -->
          <ul class="bw-label mt-1 flex flex-col gap-1" style="color: var(--bw-ink-soft)">
            <li v-for="(label, index) in pendingConfirmations" :key="index">· {{ label }}</li>
          </ul>
        </div>

        <div ref="tail" />
      </div>
    </template>

    <!-- Das Chat-Prompt aus dem Nuxt-UI-Chat-Template, fest am unteren Rand —
         nur Feld und Pfeil-nach-oben. Fokus-Overrides sind PFLICHT: Textareas
         gelten im Browser immer als focus-visible, deshalb Outline UND den
         dunklen ring-primary neutralisieren (Runde 29/29c). -->
    <template #stage-footer>
      <UChatPrompt
        v-model="promptDraft" :placeholder="t('brand.workspace.george.placeholder')"
        :disabled="!promptEnabled" :autofocus="false" class="w-full"
        :ui="{ root: 'has-[textarea:focus-visible]:outline-none has-[textarea:focus-visible]:ring-default' }"
        @submit="submitPrompt" @keydown.tab="promptTab"
      >
        <template #footer>
          <UChatPromptSubmit
            class="ml-auto" size="sm" color="neutral"
            :disabled="!promptEnabled || !promptDraft.trim() || conversation.pending.value"
          />
        </template>
      </UChatPrompt>
    </template>

    <!-- RECHTS: der Log — je Kapitel eine Sektion, je Entscheidung eine
         Karte, unten NUR der Gesamtfortschritt (Runde 27/31/35). -->
    <template #george>
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div v-for="chapter in logChapters" :key="chapter.stepKey" class="bw-log-chapter">
            <button
              class="flex w-full items-start gap-2.5 py-1 text-left"
              :aria-expanded="logChaptersOpen.has(chapter.stepKey)"
              @click="toggleChapter(chapter)"
            >
              <UIcon :name="chapterGlyph(chapter).name" class="mt-0.5 size-5 flex-none" :style="chapterGlyph(chapter).style" />
              <span class="min-w-0 flex-1 leading-tight">
                <span class="block text-sm font-medium">{{ chapter.label }}</span>
                <span class="bw-label block tabular-nums" style="color: var(--bw-muted)">
                  {{ chapter.current
                    ? t('brand.workspace.log.confirmedOf', { confirmed: chapter.confirmed, total: chapter.total })
                    : t('brand.workspace.log.count', { confirmed: chapter.confirmed, total: chapter.total }) }}
                </span>
              </span>
              <UIcon
                name="i-ph-caret-down"
                class="mt-1 size-4 flex-none transition-transform"
                :class="logChaptersOpen.has(chapter.stepKey) ? '' : '-rotate-90'"
                style="color: var(--bw-muted)"
              />
            </button>

            <div v-if="logChaptersOpen.has(chapter.stepKey)" class="mt-2 space-y-3">
              <!-- Jede Karte liest sich wie der Erklär-Layer: Ampel + Headline,
                   Beschreibungs-Subline, DANN die Antwort. „Korrigieren"
                   erscheint erst bei Hover/Fokus (`bw-fix`), „Bestätigen"
                   bleibt bei offenen Einträgen immer sichtbar. -->
              <div
                v-for="card in chapterCards(chapter)" :key="card.id"
                class="bw-log-card rounded-xl px-3 py-2.5" style="background: var(--bw-surface-hi)"
              >
                <p class="flex items-center gap-2 text-sm font-medium">
                  <span
                    class="bw-dot"
                    :class="card.confirmed ? 'bw-dot--confirmed' : card.value ? 'bw-dot--draft' : ''"
                    :title="t(card.confirmed ? 'brand.workspace.slotState.confirmed' : card.value ? 'brand.workspace.slotState.draft' : 'brand.workspace.slotState.empty')"
                    :aria-label="t(card.confirmed ? 'brand.workspace.slotState.confirmed' : card.value ? 'brand.workspace.slotState.draft' : 'brand.workspace.slotState.empty')"
                  >
                    <UIcon v-if="card.confirmed" name="i-ph-check-bold" class="size-2.5" />
                  </span>
                  <span class="min-w-0">{{ card.label }}</span>
                </p>
                <p v-if="card.note" class="mt-0.5 text-xs" style="color: var(--bw-muted)">{{ card.note }}</p>

                <UTextarea
                  v-if="card.controls && editingSlotId === card.id && card.controls.editable"
                  class="mt-1.5 w-full" :rows="3"
                  :model-value="card.value"
                  @update:model-value="value => onInput(card.id, String(value))"
                  @blur="autosave.flush()"
                />
                <p v-else-if="card.value" class="bw-doc-text mt-1.5 whitespace-pre-wrap" style="font-size: 0.875rem; line-height: 1.5">{{ card.value }}</p>
                <p v-else class="bw-pending mt-1.5">{{ t('brand.workspace.stage.pending') }}</p>

                <div class="mt-1 flex items-center justify-end gap-2">
                  <!-- Ein Kapitel, das NICHT offen ist, wird nicht hier
                       korrigiert: der Weg dorthin ist der Baustein selbst. -->
                  <UButton
                    v-if="!card.controls"
                    size="xs" color="neutral" variant="ghost" class="bw-fix rounded-full"
                    icon="i-ph-pencil-simple" :label="t('brand.workspace.reviseSlot')"
                    :disabled="!store.canEnter(chapter.stepKey)"
                    @click="goToStep(chapter.stepKey)"
                  />
                  <UButton
                    v-else-if="card.confirmed"
                    size="xs" color="neutral" variant="ghost" class="bw-fix rounded-full"
                    icon="i-ph-pencil-simple" :label="t('brand.workspace.reviseSlot')"
                    @click="reviseSlot(card.id)"
                  />
                  <template v-else-if="card.controls.showConfirm">
                    <UButton
                      v-if="card.controls.editable"
                      size="xs" color="neutral" variant="ghost" class="rounded-full"
                      icon="i-ph-pencil-simple"
                      :label="editingSlotId === card.id ? t('brand.workspace.reviseDone') : t('brand.workspace.reviseSlot')"
                      @click="editingSlotId = editingSlotId === card.id ? null : card.id"
                    />
                    <button
                      type="button" class="bw-confirm bw-confirm--open bw-confirm--xs"
                      :disabled="!card.controls.confirmEnabled"
                      @click="confirmSlot(card.id)"
                    >
                      <UIcon name="i-ph-check" class="size-3.5" /> {{ t('brand.workspace.confirmSlot') }}
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Unten rechts NUR der dreizeilige Gesamtfortschritt (Runde 31/35) —
             der „Euer Branding"-Einstieg wohnt an der Kachel der Übersicht. -->
        <div class="flex-none border-t px-6 pb-5" style="border-color: var(--bw-line)">
          <BwRailFooter
            :progress-pct="overallProgress.pct"
            :progress-title="t('brand.workspace.log.overall')"
            :progress-count="`${overallProgress.filled}/${overallProgress.total}`"
            :progress-time="remainingTime"
          />
        </div>
      </div>
    </template>
  </BwWorkspace>

  <!-- GEORGES STECKBRIEF — geöffnet über den Avatar im Gespräch. Er zeigt die
       EINE Stimme und das Team dahinter (Davids Entscheidung 2026-09-02):
       Beschreibung, die Kolleginnen und Kollegen mit ihrem Schwerpunkt, eine
       typische Frage und Georges Arbeitsweise-Zeile. Alles lokalisiert — die
       `personal`-Zeile der Registry ist Prompt-/About-Ebene und deutsch-only. -->
  <UModal v-model:open="advisorInfoOpen">
    <template #content>
      <div class="bw-root max-h-[85vh] overflow-y-auto p-7" style="background: var(--bw-surface-hi)">
        <div class="flex items-center gap-3">
          <BwGeorgeAvatar :src="voice.avatar" :initial="voice.name.slice(0, 1)" :alt="voice.name" />
          <span class="min-w-0 leading-tight">
            <span class="block text-base font-medium">{{ voice.fullName }}</span>
            <span class="bw-label block" style="color: var(--bw-muted)">{{ voiceRole }}</span>
          </span>
          <UButton
            size="xs" color="neutral" variant="ghost" class="ml-auto rounded-full"
            icon="i-ph-x" :aria-label="t('brand.common.close')" @click="advisorInfoOpen = false"
          />
        </div>
        <p class="bw-doc-text mt-4">{{ t('brand.workspace.advisorInfo.desc') }}</p>
        <ul class="mt-2 space-y-1">
          <li
            v-for="member in voiceTeam" :key="member.key"
            class="flex gap-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)"
          >
            <span class="flex-none" style="color: var(--bw-line-strong)">—</span>{{ member.line }}
          </li>
        </ul>
        <p class="bw-label mt-4" style="color: var(--bw-muted)">{{ t('brand.workspace.advisorInfo.asksTitle') }}</p>
        <p class="mt-1 text-sm italic">{{ t('brand.workspace.advisorInfo.asks') }}</p>
        <p class="bw-label mt-4 leading-relaxed" style="color: var(--bw-muted)">
          {{ t('brand.workspace.advisorInfo.personal') }}
        </p>
      </div>
    </template>
  </UModal>

  <!-- Frühere Fassungen: Auswahl schreibt in den EDITOR, gespeichert wird über
       den normalen Autosave (kein eigener Schreibweg — s. `useVersion`). -->
  <UModal v-model:open="versionsOpen">
    <template #content>
      <div class="bw-root max-h-[85vh] overflow-y-auto p-8" style="background: var(--bw-surface-hi)">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">
          {{ versionsSlot ? slotLabel(versionsSlot) : '' }}
        </p>
        <h2 class="mt-1 text-[24px] font-extralight leading-tight tracking-tight">{{ t('brand.workspace.versions.title') }}</h2>
        <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.workspace.versions.description') }}</p>

        <!-- Lesen ja, übernehmen nein — s. `versionsControls`. -->
        <p v-if="versionsControls && !versionsControls.canRestoreVersion" class="bw-pending mt-3">
          {{ t('brand.workspace.versions.confirmedLock') }}
        </p>

        <p v-if="versionsLoading" class="bw-pending mt-5">{{ t('brand.workspace.versions.loading') }}</p>

        <template v-else>
          <div v-for="item in versions?.items ?? []" :key="item.generationId" class="mt-5">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="bw-label" style="color: var(--bw-muted)">
                {{ new Date(item.createdAt).toLocaleString(locale) }} · {{ item.model }} · {{ item.promptVersion }}
              </p>
              <UButton
                size="xs" variant="outline" color="neutral" class="rounded-full"
                :disabled="!item.draft || versionsControls?.canRestoreVersion === false"
                :label="t('brand.workspace.versions.use')"
                @click="useVersion(item.draft ?? '')"
              />
            </div>
            <p v-if="item.draft" class="mt-1 whitespace-pre-wrap rounded-xl p-3 text-sm" style="background: var(--bw-surface)">{{ item.draft }}</p>
            <!-- Ein Eintrag ohne Text ist dem Spalten-Deckel gewichen; seine
                 Herkunft bleibt sichtbar, damit die Lücke erklärt ist. -->
            <p v-else class="bw-pending mt-1">{{ t('brand.workspace.versions.dropped') }}</p>
          </div>

          <div v-if="versions?.firstDraft" class="mt-6 border-t pt-4" style="border-color: var(--bw-line)">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.versions.first') }}</p>
              <UButton
                size="xs" variant="outline" color="neutral" class="rounded-full"
                :disabled="versionsControls?.canRestoreVersion === false"
                :label="t('brand.workspace.versions.use')"
                @click="useVersion(versions.firstDraft ?? '')"
              />
            </div>
            <p class="mt-1 whitespace-pre-wrap rounded-xl p-3 text-sm" style="background: var(--bw-surface)">{{ versions.firstDraft }}</p>
          </div>

          <p v-if="!versions?.items.length && !versions?.firstDraft" class="bw-pending mt-5">
            {{ t('brand.workspace.versions.empty') }}
          </p>
        </template>

        <div class="mt-6 flex justify-end">
          <UButton
            variant="ghost" color="neutral" class="rounded-full"
            :label="t('brand.workspace.versions.close')" @click="versionsSlot = null"
          />
        </div>
      </div>
    </template>
  </UModal>

  <!-- 409: BEIDE Fassungen, nichts wird automatisch überschrieben (§3e). -->
  <UModal v-model:open="conflictOpen">
    <template #content>
      <div class="bw-root max-h-[85vh] overflow-y-auto p-8" style="background: var(--bw-surface-hi)">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-stale)">{{ t('brand.workspace.sync.conflict') }}</p>
        <h2 class="mt-1 text-[24px] font-extralight leading-tight tracking-tight">{{ t('brand.workspace.conflict.title') }}</h2>
        <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.workspace.conflict.description') }}</p>

        <div v-for="row in conflictRows" :key="row.slotId" class="mt-5">
          <p class="bw-label" style="color: var(--bw-muted)">{{ row.label }}</p>
          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl p-3" style="background: var(--bw-surface)">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.conflict.mineLabel') }}</p>
              <p class="mt-1 whitespace-pre-wrap text-sm">{{ row.mine }}</p>
            </div>
            <div class="rounded-xl p-3" style="background: var(--bw-surface)">
              <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.conflict.serverLabel') }}</p>
              <p class="mt-1 whitespace-pre-wrap text-sm">{{ row.server }}</p>
            </div>
          </div>
        </div>

        <p v-if="copied" class="bw-label mt-4" style="color: var(--bw-muted)">
          {{ copied === 'ok' ? t('brand.workspace.conflict.copied') : t('brand.workspace.conflict.copyFailed') }}
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <UButton
            variant="outline" color="neutral" class="rounded-full"
            :label="t('brand.workspace.conflict.copyMine')" @click="copyMine"
          />
          <UButton class="rounded-full" :label="t('brand.workspace.conflict.loadServer')" @click="loadServerVersion" />
        </div>
      </div>
    </template>
  </UModal>
</template>
