<script setup lang="ts">
import type { BwMessage } from '../../../components/BwGeorge.vue'
import type { BwRailLayer, BwRailStep } from '../../../components/BwProgressRail.vue'
import {
  BRAND_CONFIDENCE_VALUES,
  type BrandConfidence,
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
} from '../../../../shared/slotRegistry'
import { brandSlotDisplayValue } from '../../../../shared/brandAutosaveDiff'
import { brandAiRejectionMessageKey } from '../../../../shared/brandAiLimits'
import { type BrandAdvisorKey, advisorForStep } from '../../../../shared/brandAdvisors'
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
} from '../../../../shared/types/brand'
import { useBrandWorkspaceStore } from '../../../stores/brandWorkspace'
import { useBrandAutosave } from '../../../composables/useBrandAutosave'
import { useBrandGeneration } from '../../../composables/useBrandGeneration'

/**
 * DER VOLLBILD-WORKSPACE — die echte Werkstatt (Plan §3d Hauptansicht 4,
 * Route §3e `/brand/:profileId/:stepKey`).
 *
 * ── DIE OPTIK IST DIE ABGENOMMENE, DIE DATEN SIND ECHT ────────────────────
 * `BwWorkspace` (drei Zonen, USplitter, Responsive), `BwProgressRail`
 * (Fortschritt menschlich), `BwGeorge` (Monogramm, ein Zug pro Frage),
 * `BwChapter` und `BwChips` kommen unverändert aus dem Klickdummy. Was hier neu
 * ist, ist ausschliesslich die Herkunft der Inhalte: Journey aus
 * `GET /api/brand/profiles/:id`, Slots aus `GET …/steps/:stepKey`, Beschriftung
 * aus der SLOT-REGISTRY über i18n.
 *
 * ── DIE BÜHNE RENDERT DIE REGISTRY, NICHT EINE LISTE ──────────────────────
 * `slotsForStep(stepKey)` ist die einzige Quelle dafür, welche Felder dieser
 * Baustein hat, in welcher Reihenfolge, mit welchem Editor und welchem Deckel.
 * Eine zweite Liste hier wäre genau das „fünfte getrennte Regelwerk", das §3e
 * ausschliesst — und sie liefe beim nächsten Katalog-Update auseinander.
 *
 * ── GEORGE FÜHRT — UND SEIT P1c SCHREIBT ER AUCH ──────────────────────────
 * Die Spalte zeigt weiter die NÄCHSTE offene Frage (`resolveNextQuestion` +
 * `questionKeyFor` für den Pfad der Weiche W1). Dazu kommen seine ZÜGE aus dem
 * Strom: jeder generierbare Slot hat einen Knopf, der
 * `POST …/steps/:stepKey/generate` öffnet, die Deltas laufen live in eine
 * Sprechblase, und der fertige Entwurf landet MARKIERT im Editor (§3b.3) —
 * sichtbar als Entwurf, bis der Mensch bestätigt.
 *
 * WELCHER TEXT DABEI ENTSTEHT, entscheidet die Generator-Registry des Servers.
 * In P1c ist das der Entwicklungs-Ersatz (`pukalani.brand.devStubGenerator`,
 * nur im .playground); die echten Prompts kommen mit P2 an derselben Naht,
 * ohne eine Zeile hier.
 *
 * ── DREI ZUSTÄNDE, DIE KEINE FEHLERSEITE SIND ─────────────────────────────
 * `denied` (404 der Datentür — kein Beta-Zugang), `blocked` (403: der Baustein
 * liegt nicht auf dem Weg) und der KONFLIKT (409). Alle drei bekommen eine
 * Fläche mit Erklärung; geworfen wird hier nichts.
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

await useAsyncData(
  () => `brand-workspace-${profileId.value}-${routeStepKey.value}`,
  async () => {
    const ok = await store.loadProfile(profileId.value, request)
    if (ok) await store.loadStep(profileId.value, routeStepKey.value, request)
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

// ── Wer führt diesen Baustein? (Beraterteam, 2026-09-01) ──────────────────

/**
 * Der Chat-Kopf zeigt den Berater des AKTIVEN Bausteins — Vorname und
 * Rollen-Titel, mehr nicht. Gerechnet wird das an EINER Stelle
 * (`advisorForStep`, mit George als Rückfall), damit Kopf, Sprechblasen und
 * Übergabe nie auseinanderlaufen können.
 */
const advisor = computed(() => advisorForStep(stepKey.value ?? 'context'))
const advisorRole = computed(() => t(`brand.advisors.${advisor.value.key}.role`))

/**
 * DIE ÜBERGABE-ZEILE ist Anzeige, kein Verlauf: sie erscheint, wenn der
 * Baustein von einem ANDEREN Berater geführt wird als der zuvor besuchte, und
 * sie wird NICHT gespeichert. Persistiert müllte jedes Hin- und Herspringen
 * zwischen zwei Bausteinen den Verlauf mit immer derselben Zeile zu — und ein
 * KI-Aufruf wäre sie ohnehin nicht wert: der Text steht in den Locale-Dateien.
 */
const handover = ref<string | null>(null)
let previousAdvisor: BrandAdvisorKey | null = null
watch(advisor, (next) => {
  handover.value = previousAdvisor && previousAdvisor !== next.key
    ? t(`brand.advisors.${next.key}.handover`)
    : null
  previousAdvisor = next.key
}, { immediate: true })

// ── George: die nächste offene Frage ──────────────────────────────────────

/** Lokal übersprungen („Weiß ich nicht") — nichts wird gespeichert, der Zeiger rückt vor. */
const skipped = ref<string[]>([])
watch(routeStepKey, () => { skipped.value = [] })

const slotFacts = computed<Record<string, BrandSlotStateFacts>>(() => {
  const facts: Record<string, BrandSlotStateFacts> = {}
  for (const slot of slots.value) {
    facts[slot.id] = {
      hasValue: store.slotValue(slot.id).length > 0 || skipped.value.includes(slot.id),
      confirmed: store.slotConfirmed(slot.id),
    }
  }
  return facts
})

const nextQuestion = computed(() =>
  (stepKey.value ? resolveNextQuestion(stepKey.value, slotFacts.value) : null))

const nextSlot = computed<BrandSlot | null>(() =>
  slots.value.find(slot => slot.id === nextQuestion.value?.slotId) ?? null)

/** Georges Züge aus dem Strom — sie stehen VOR der nächsten Frage. */
const streamed = computed<BwMessage[]>(() => store.streamMessages.map(message => ({
  id: message.id,
  role: 'george' as const,
  text: message.text,
  pending: message.pending,
})))

/**
 * DIE EIGENEN ANTWORTEN, SICHTBAR (Audit-Befund B5a, 2026-09-01).
 *
 * Bis hierher verschwand jede getippte Antwort wortlos ins Feld: der Verlauf
 * zeigte nur Georges Seite, und ein Gespräch, in dem man sich selbst nicht
 * reden sieht, fühlt sich wie ein Formular an.
 *
 * SIE WERDEN NICHT ALS `brand_messages`-ZEILE GESPEICHERT, und das ist kein
 * Versehen: die SUBSTANZ ist längst persistiert — der Text steht im Slot und
 * geht über den normalen Autosave. Eine zweite Kopie im Verlauf bräuchte eine
 * eigene Schreib-Route, hätte ein zweites Bearbeiten-Problem (ändert der
 * Mensch das Feld, log der Verlauf die alte Fassung) und wäre bei der Löschung
 * eine zweite Stelle. Hier steht deshalb die ANSICHT des Besuchs.
 *
 * WAS BEWUSST FEHLT (B5b, gehört in die Konversations-Runde P3): George
 * REAGIERT nicht auf diese Antworten — jede Reaktion wäre ein KI-Aufruf je
 * Antwort und damit eine Kostenentscheidung, keine Anzeigefrage.
 */
const answers = ref<{ id: string, text: string }[]>([])
watch(routeStepKey, () => { answers.value = [] })

const georgeMessages = computed<BwMessage[]>(() => {
  const spoken: BwMessage[] = [
    ...streamed.value,
    ...answers.value.map(entry => ({ id: entry.id, role: 'user' as const, text: entry.text })),
  ]
  if (!nextSlot.value) {
    return [
      ...spoken,
      { id: 'done', role: 'george', text: t('brand.workspace.george.nothingOpen') },
    ]
  }
  return [
    ...spoken,
    {
      id: nextSlot.value.id,
      role: 'george',
      text: t(questionKeyFor(nextSlot.value, pathKind.value)),
      help: nextSlot.value.helpKey ? t(nextSlot.value.helpKey) : undefined,
    },
  ]
})

/**
 * DIE BEISPIEL-ANTWORT IM FELD (Davids Wunsch 2026-09-01, Muster Claude
 * Desktop): zur aktuellen Menschenfrage steht eine Mustervorlage GRAU im
 * Composer — Platzhalter, nie ein Wert, absenden kann man sie nicht. Die
 * Texte stehen statisch im Katalog (`brand.example.<id>`, pfadabhängig wie
 * die Frage selbst); eine KI-Fassung je Antwort wäre eine Kostenentscheidung
 * (B5b) und gehört in die Konversations-Runde P3. Auswahl-Fragen behalten den
 * generischen Platzhalter — geantwortet wird dort über Chips.
 */
const composerExample = computed<string>(() => {
  const slot = nextSlot.value
  if (!slot || slot.type !== 'question') return ''
  return t(exampleKeyFor(slot, pathKind.value))
})

function answerFromGeorge(text: string): void {
  const slot = nextSlot.value
  if (!slot) return
  store.setSlotValue(slot.id, text)
  answers.value = [...answers.value, { id: `answer-${slot.id}-${answers.value.length}`, text }]
  autosave.schedule()
}

function skipQuestion(): void {
  const slot = nextSlot.value
  if (!slot) return
  skipped.value = [...skipped.value, slot.id]
}

// ── Bühne: Eingaben ───────────────────────────────────────────────────────

const openHelp = ref<string | null>(null)

function onInput(slotId: string, value: string): void {
  store.setSlotValue(slotId, value)
  autosave.schedule()
}

async function confirmSlot(slotId: string): Promise<void> {
  store.setSlotConfirmed(slotId, true)
  await autosave.flush()
}

/**
 * „KORRIGIEREN" — die EINZIGE Tür zurück (Davids Entscheidung 2026-09-02).
 *
 * Ein bestätigter Slot ist zu: das Feld ist schreibgeschützt, George entwirft
 * nicht, frühere Fassungen lassen sich nicht übernehmen. Das ist kein
 * Schikane-Zustand, sondern die Bedingung dafür, dass „bestätigt" etwas
 * bedeutet — vorher schrieb der nächste Tastendruck still einen `latestDraft`
 * neben die bestätigte Fassung, und im Dokument stand weiter der alte Text.
 *
 * Aufheben ist eine Änderung wie jede andere: dieselbe `revision`-Rechnung,
 * derselbe Autosave, derselbe 409-Weg. Der Server bestätigt es, erst dann ist
 * der Slot wirklich offen — deshalb `flush()` und nicht `schedule()`.
 */
async function reviseSlot(slotId: string): Promise<void> {
  store.setSlotConfirmed(slotId, false)
  await autosave.flush()
}

// ── George entwirft (§3b.3) ───────────────────────────────────────────────

/** Der Hinweis je Slot („wärmer", „kürzer") — lokal, nie gespeichert. */
const hints = ref<Record<string, string>>({})
watch(routeStepKey, () => { hints.value = {} })

/**
 * ── DAS BEREITSCHAFTS-GATE, SCHON VOR DEM KLICK ──────────────────────────
 * Dieselbe pure Regel wie in der Route (`slotReadiness`) und aus denselben
 * Quellen: Startkarte, Website-Stand, Slot-Werte DIESES Bausteins. Zweimal
 * gerechnet, einmal beschrieben — die Route ist die Durchsetzung, das hier ist
 * die Ehrlichkeit: statt eines Knopfes, der gleich ein 409 kassiert, steht da
 * ein Satz, WAS fehlt.
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
    advisor: advisor.value.name,
    needs: readiness.missing.map(need => t(`brand.workspace.ready.need.${READINESS_KEYS[need]}`)).join(' · '),
  })
}

/**
 * ── DIE BÜHNE RECHNET IHRE ZUSTÄNDE EINMAL ────────────────────────────────
 *
 * Je Slot: WAS er gerade ist (leer · Entwurf · bestätigt) und WELCHE
 * Bedienelemente dazugehören. Die Entscheidung selbst liegt pur nebenan
 * (`brandSlotControls`) und ist dort vollständig getestet — hier steht nur die
 * Zuordnung von Store-Daten zu ihren Eingaben.
 *
 * Ein Paar aus Slot und Zustand statt einer Nachschlagetabelle: das Markup
 * läuft ohnehin über die Slots, und eine `Record`-Suche im Template hätte für
 * jeden Zugriff einen Undefined-Fall, den es hier nicht gibt.
 */
interface BrandStageSlot {
  slot: BrandSlot
  controls: BrandSlotControls
  /** Der Satz des Bereitschafts-Gates — nur, wenn er auch gezeigt wird. */
  note: string | null
}

const stageSlots = computed<BrandStageSlot[]>(() => slots.value.map((slot) => {
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

/** Der Balken DIESES Kapitels — der Gesamt-Weg steht unverändert in der Leiste. */
const chapterProgress = computed(() => brandChapterProgress(stageSlots.value.map(entry => entry.controls)))

async function generateSlot(slot: BrandSlot): Promise<void> {
  await generation.generate(slot.id, hints.value[slot.id] ?? '')
  // Der Hinweis hat gewirkt oder nicht — stehen bleiben soll er nicht, sonst
  // reist er stillschweigend in den nächsten Versuch.
  hints.value = { ...hints.value, [slot.id]: '' }
}

/**
 * `ai_disabled` und `no_generator` sind BETRIEBSZUSTÄNDE, kein Unglück: der
 * Stand bleibt voll bearbeitbar (§9b.5). Sie bekommen deshalb einen ruhigen
 * Hinweis an Ort und Stelle — keinen Toast, keine Farbe, keine Warnung.
 */
// ── Frühere Fassungen ─────────────────────────────────────────────────────

/**
 * DIE WIEDERHERSTELLUNG SCHREIBT IN DEN EDITOR, NICHT AUF DEN SERVER.
 *
 * Eine gewählte Fassung wird eine ganz gewöhnliche lokale Eingabe und geht über
 * den NORMALEN Autosave — mit derselben `revision`-Rechnung wie jeder Tastendruck.
 * Ein eigener Schreibweg hätte eine zweite Wahrheit über `revision` eingeführt,
 * und der 409-Konfliktdialog aus P1c hätte einen Fall mehr zu erklären, den er
 * nicht ausgelöst hat. Er bekommt durch diese Funktion deshalb NICHTS Neues:
 * kollidiert das Zurückholen mit einer Änderung aus einem anderen Tab, ist das
 * exakt der Konflikt, den er schon kennt.
 */
const versionsSlot = ref<BrandSlot | null>(null)
const versions = ref<BrandGenerationVersionsResponse | null>(null)
const versionsLoading = ref(false)

const versionsOpen = computed({
  get: () => versionsSlot.value !== null,
  set: (value: boolean) => { if (!value) versionsSlot.value = null },
})

/**
 * AUF EINEM BESTÄTIGTEN SLOT IST DIE LISTE LESBAR, DIE ÜBERNAHME NICHT.
 * `useVersion` schreibt eine gewöhnliche lokale Eingabe, und die weist der
 * Server jetzt mit `slot_confirmed` ab — ein Knopf, der einen Konflikt
 * erzeugt, den der Mensch nicht ausgelöst hat, wäre schlechter als ein
 * sichtbar abgeschalteter. Der Weg dorthin ist „Korrigieren".
 */
const versionsControls = computed<BrandSlotControls | null>(() =>
  stageSlots.value.find(entry => entry.slot.id === versionsSlot.value?.id)?.controls ?? null)

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
    // Eine unlesbare Historie ist kein Grund, die Werkstatt zu stören: das
    // Fenster zeigt dann seinen Leerzustand.
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

const generationNotice = computed<string | null>(() => {
  const code = generation.failureCode.value
  if (!code) return null
  // Die vier Drossel-Gründe zuerst: sie sind die einzigen, die dem Menschen
  // sagen, WANN es wieder geht (gleich · morgen · nicht an dir).
  const throttled = brandAiRejectionMessageKey(code)
  if (throttled) return t(throttled)
  if (code === 'ai_disabled') return t('brand.workspace.generate.aiDisabled')
  if (code === 'no_generator') return t('brand.workspace.generate.noGenerator')
  if (code === 'generation_active') return t('brand.workspace.generate.busy')
  if (code === 'aborted') return t('brand.workspace.generate.stopped')
  // Das Gate hat schon am Slot gesagt, WAS fehlt — hier reicht der Hinweis,
  // dass es daran lag und nicht an einer Störung.
  if (code === 'not_ready') return t('brand.workspace.generate.notReady')
  // Der Knopf ist am bestätigten Slot gar nicht sichtbar — dieser Zweig fängt
  // den Fall, dass ein zweiter Tab inzwischen bestätigt hat. Er sagt, was zu
  // tun ist, statt „hat nicht geklappt".
  if (code === 'slot_confirmed') return t('brand.workspace.generate.slotConfirmed')
  return t('brand.workspace.generate.failed')
})

// ── „Website lesen" (P2.3) ────────────────────────────────────────────────

/**
 * SICHTBAR, NICHT HEIMLICH (Plan §3d): das Anlage-Formular verspricht neben dem
 * URL-Feld „ich lese sie, damit du dich nicht wiederholen musst" — hier steht,
 * WANN das passiert, und es passiert erst auf Knopfdruck.
 *
 * NUR IM BAUSTEIN KONTEXT und nur mit hinterlegter Adresse: dort schöpfen die
 * Slots aus der Startkarte, dort nützt der Website-Text etwas, und ein Streifen
 * über jedem Baustein wäre eine Aufforderung ohne Anlass.
 *
 * ZWEI KLICKS, KEINE CHECKBOX: der erste zeigt den Satz „Ich darf diese Website
 * analysieren lassen", der zweite löst aus. Eine Checkbox, die man einmal setzt
 * und dann vergisst, ist keine Bestätigung — sie ist ein Zustand.
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

/**
 * Die Gründe kommen als `data.reason` (der zentrale Fehler-Handler hebt
 * `data.code` dorthin). Ein unbekannter Grund fällt auf den allgemeinen Satz
 * zurück — ein fehlender Zweig darf keinen leeren Hinweis erzeugen.
 */
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
    // Der Server ist die Wahrheit, aber ein zweiter Abruf des ganzen Profils
    // wäre für drei Zahlen zu viel: die Antwort trägt sie alle.
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

// ── Leiste + Fortschritt ──────────────────────────────────────────────────

function railState(state: string): BwRailStep['state'] {
  if (state === 'done') return 'done'
  if (state === 'active') return 'active'
  return 'open'
}

const railLayers = computed<BwRailLayer[]>(() => [{
  id: 'foundation',
  label: t('brand.workspace.railLayer'),
  steps: store.railSteps.map((entry): BwRailStep => ({
    id: entry.stepKey,
    label: t(`brand.steps.${entry.stepKey}`),
    icon: '',
    state: entry.stepKey === stepKey.value && entry.state !== 'done' ? 'active' : railState(entry.state),
  })),
}])

/**
 * DIE LEISTE ZÄHLT BESTÄTIGT (Davids Entscheidung 2026-09-02): dieselbe Zahl
 * wie die Sticky-Linie oben — eine Wahrheit, „grün = entschieden". Die
 * Füll-Formel aus Plan §3b (`stepProgress`) lebt unverändert weiter, wo sie
 * hingehört: in `progressPct` der Übersichts-Karten, wo sich der Balken
 * bewegen soll, sobald George etwas hinlegt.
 */
const progressNote = computed(() => t('brand.workspace.progressConfirmed', {
  confirmed: chapterProgress.value.confirmed,
  total: chapterProgress.value.total,
}))

/** `BwWorkspace` zeigt nur ABWEICHUNGEN — Stille heisst gespeichert (§3e). */
const workspaceSync = computed<'saving' | 'offline' | 'conflict' | 'error' | null>(
  () => (store.syncState === 'saved' ? null : store.syncState),
)
const workspaceSyncLabel = computed(() =>
  (store.syncState === 'saved' ? undefined : t(`brand.workspace.sync.${store.syncState}`)))

// ── Navigation ────────────────────────────────────────────────────────────

const previousStep = computed(() => store.neighbourStep(-1))
const nextStep = computed(() => store.neighbourStep(1))

async function goToStep(key: string | null): Promise<void> {
  if (!key) return
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
    // Nur ECHTE Abweichungen (Davids „same same"-Fund): wortgleiche Zeilen
    // böten eine Wahl ohne Unterschied. Den Ganz-gleich-Fall löst der Store
    // schon still auf — hier fällt der Mischfall (eine echte Abweichung,
    // daneben wortgleiche Slots) auf die relevanten Zeilen zusammen.
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

  <BwWorkspace
    v-else
    :progress-pct="chapterProgress.pct"
    :progress-note="progressNote"
    :content-locale="store.profile?.contentLocale ?? locale"
    :sync-state="workspaceSync"
    :sync-label="workspaceSyncLabel"
  >
    <template #brand>
      <span class="truncate font-semibold">{{ store.profile?.title || t('brand.brands.card.untitled') }}</span>
    </template>

    <template #rail>
      <BwProgressRail :layers="railLayers" />
    </template>

    <template #default>
      <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('brand.workspace.stage.title') }}</p>
      <h1 class="mt-1 text-4xl leading-tight">{{ stepKey ? t(`brand.steps.${stepKey}`) : '' }}</h1>

      <!-- Ein RUHIGER Hinweis, kein Toast-Gewitter: „KI ist aus" und „hier
           entwirft niemand" sind Zustände, in denen weitergearbeitet wird. -->
      <p v-if="generationNotice" class="bw-pending mt-3 flex items-center gap-2">
        <span>{{ generationNotice }}</span>
        <button type="button" class="underline" @click="generation.dismissFailure()">
          {{ t('brand.workspace.generate.dismiss') }}
        </button>
      </p>

      <!-- „Website lesen" (P2.3) — ein schmaler Streifen über der Bühne, nur im
           Baustein Kontext und nur mit hinterlegter Adresse. Er SAGT, dass
           gelesen wird, und er tut es erst nach einer Bestätigung. -->
      <div
        v-if="showSiteStrip"
        class="mt-4 rounded-2xl px-4 py-3"
        style="background: var(--bw-surface)"
      >
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

        <!-- Die Bestätigung steht ZWISCHEN Klick und Wirkung, nicht daneben. -->
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

      <BwChapter
        :title="stepKey ? t(`brand.steps.${stepKey}`) : ''"
        :state="store.currentJourneyStep?.state === 'done' ? 'confirmed' : store.currentJourneyStep?.state === 'active' ? 'active' : 'empty'"
        :progress-confirmed="chapterProgress.confirmed"
        :progress-total="chapterProgress.total"
      >
        <p v-if="!slots.length" class="bw-pending">{{ t('brand.workspace.stage.empty') }}</p>

        <div v-for="{ slot, controls, note } in stageSlots" :key="slot.id" class="mb-6">
          <div class="flex items-start justify-between gap-3">
            <p class="bw-label flex min-w-0 items-center gap-2" style="color: var(--bw-muted)">
              <!-- DIE AMPEL: beim Runterscrollen soll auf einen Blick zu sehen
                   sein, wo man steht. Sie steht NIE allein — daneben stehen die
                   Etiketten in Worten, und der Punkt trägt seinen Zustand als
                   Beschriftung (Regel „nie nur Farbe"). -->
              <span
                class="bw-dot"
                :class="!controls.countsForProgress ? 'bw-dot--derived' : controls.state === 'confirmed' ? 'bw-dot--confirmed' : controls.state === 'draft' ? 'bw-dot--draft' : ''"
                :title="t(!controls.countsForProgress ? 'brand.workspace.slotState.derived' : `brand.workspace.slotState.${controls.state}`)"
                :aria-label="t(!controls.countsForProgress ? 'brand.workspace.slotState.derived' : `brand.workspace.slotState.${controls.state}`)"
              >
                <UIcon v-if="controls.countsForProgress && controls.state === 'confirmed'" name="i-ph-check-bold" class="size-2.5" />
              </span>
              <span class="min-w-0">{{ slotLabel(slot) }}</span>
              <!-- §3b.3: Georges Entwurf ist bis zur Bestätigung als Entwurf
                   ERKENNBAR — Etikett UND gestrichelter Rahmen, nie nur Farbe.
                   Mit der Bestätigung wird daraus SEIN Text: das Etikett
                   wechselt, es steht nie eines neben dem anderen. -->
              <span v-if="controls.showDraftBadge" class="bw-state bw-state--draft">
                {{ t('brand.workspace.draftBadge') }}
              </span>
              <span v-else-if="controls.showConfirmedBadge" class="bw-state bw-state--confirmed">
                {{ t('brand.workspace.confirmedBadge') }}
              </span>
            </p>
            <button
              v-if="slot.helpKey"
              type="button"
              class="bw-label flex-none underline"
              style="color: var(--bw-muted)"
              :aria-expanded="openHelp === slot.id"
              @click="openHelp = openHelp === slot.id ? null : slot.id"
            >
              {{ t('brand.workspace.help') }}
            </button>
          </div>
          <p
            v-if="slot.helpKey && openHelp === slot.id"
            class="mt-2 rounded-xl px-3 py-2.5 text-sm"
            style="background: var(--bw-surface); color: var(--bw-ink-soft)"
          >
            {{ t(slot.helpKey) }}
          </p>

          <!-- Der Paarvergleich ist ein eigenes Instrument (Katalog §12). -->
          <p v-if="slot.type === 'special'" class="bw-pending mt-2">{{ t('brand.workspace.stage.pairsPlaceholder') }}</p>

          <!-- Der gestrichelte Rahmen umfasst den EDITOR, nicht die Zeile:
               er sagt „dieser Text ist ein Entwurf", nicht „dieses Feld". -->
          <div :class="controls.showDraftBadge ? 'bw-draft-frame mt-2' : ''">
            <template v-if="slot.editor === 'none'">
              <p v-if="store.slotValue(slot.id)" class="mt-2 text-sm" style="color: var(--bw-ink-soft)">{{ store.slotValue(slot.id) }}</p>
              <p v-else class="bw-pending mt-2">{{ t('brand.workspace.stage.notEditable') }}</p>
            </template>

            <!-- BESTÄTIGT HEISST SCHREIBGESCHÜTZT (Davids Entscheidung): das
                 Feld bleibt sichtbar und lesbar, nimmt aber nichts mehr an.
                 `readonly` statt `disabled` — der Text soll normal lesbar und
                 markierbar bleiben, nicht ausgegraut wie ein totes Feld. -->
            <UTextarea
              v-else-if="slot.editor === 'textarea' || slot.editor === 'stage'"
              class="mt-2 w-full"
              :rows="slot.editor === 'stage' ? 6 : 3"
              :maxlength="slot.maxLength"
              :readonly="!controls.editable"
              :model-value="store.slotValue(slot.id)"
              :placeholder="t('brand.workspace.stage.pending')"
              @update:model-value="value => onInput(slot.id, String(value))"
              @blur="autosave.flush()"
            />

            <UInput
              v-else
              class="mt-2 w-full"
              :maxlength="slot.maxLength"
              :readonly="!controls.editable"
              :model-value="store.slotValue(slot.id)"
              :placeholder="t('brand.workspace.stage.pending')"
              @update:model-value="value => onInput(slot.id, String(value))"
              @blur="autosave.flush()"
            />
          </div>

          <!-- ZU WENIG IST ZU WENIG: statt eines Knopfes, der in ein 409 läuft,
               steht hier ruhig, was fehlt (Bereitschafts-Gate). -->
          <p v-if="note" class="bw-pending mt-2">{{ note }}</p>

          <!-- „George, versuch's nochmal" — mit optionalem Hinweis (§3b.3).
               Am bestätigten Slot ist beides weg: es gibt nichts nachzujustieren,
               solange nichts geändert werden darf. -->
          <div v-if="controls.showGenerate" class="mt-2 flex flex-wrap items-center gap-2">
            <UInput
              v-if="controls.showHint"
              class="min-w-40 flex-1"
              size="sm"
              maxlength="500"
              :model-value="hints[slot.id] ?? ''"
              :placeholder="t('brand.workspace.generate.hintPlaceholder')"
              :aria-label="t('brand.workspace.generate.hintLabel')"
              :disabled="generation.streaming.value"
              @update:model-value="value => hints = { ...hints, [slot.id]: String(value) }"
            />
            <UButton
              v-if="generation.isStreamingSlot(slot.id)"
              size="sm" variant="outline" color="neutral" class="rounded-full"
              icon="i-ph-stop"
              :label="t('brand.workspace.generate.stop')"
              @click="generation.stop()"
            />
            <UButton
              v-else
              size="sm" variant="ghost" color="neutral" class="rounded-full"
              icon="i-ph-sparkle"
              :loading="generation.streaming.value"
              :disabled="generation.streaming.value"
              :label="store.slotValue(slot.id) ? t('brand.workspace.generate.again') : t('brand.workspace.generate.start')"
              @click="generateSlot(slot)"
            />
          </div>

          <div v-if="controls.showConfirm || controls.showVersions" class="mt-2 flex flex-wrap items-center justify-end gap-2">
            <!-- „Frühere Fassungen" bleibt auch am bestätigten Slot sichtbar —
                 lesen darf man immer, übernehmen erst nach „Korrigieren". -->
            <UButton
              v-if="controls.showVersions"
              size="sm" variant="ghost" color="neutral" class="mr-auto rounded-full"
              icon="i-ph-clock-counter-clockwise"
              :label="t('brand.workspace.versions.open')"
              @click="openVersions(slot)"
            />
            <UButton
              v-if="controls.showRevise"
              size="sm" variant="ghost" color="neutral" class="rounded-full"
              icon="i-ph-pencil-simple"
              :label="t('brand.workspace.reviseSlot')"
              @click="reviseSlot(slot.id)"
            />
            <!-- DERSELBE KNOPF, ZWEI FARBEN (Davids Wortlaut): bernstein
                 umrandet „Bestätigen", grün gefüllt „Bestätigt". Vorher war er
                 im bestätigten Zustand nur ausgegraut und las sich wie ein
                 Etikett — man sah dem Slot nicht an, ob er entschieden war. -->
            <button
              v-if="controls.showConfirm"
              type="button"
              class="bw-confirm"
              :class="controls.state === 'confirmed' ? 'bw-confirm--done' : 'bw-confirm--open'"
              :disabled="!controls.confirmEnabled"
              @click="confirmSlot(slot.id)"
            >
              <UIcon :name="controls.state === 'confirmed' ? 'i-ph-check-circle-fill' : 'i-ph-check'" class="size-4" />
              {{ controls.state === 'confirmed' ? t('brand.workspace.confirmedSlot') : t('brand.workspace.confirmSlot') }}
            </button>
          </div>
        </div>
      </BwChapter>

      <div class="mt-6 flex items-center justify-between gap-3">
        <UButton
          variant="ghost" color="neutral" icon="i-ph-arrow-left" class="rounded-full"
          :disabled="!previousStep" :label="t('brand.workspace.back')"
          @click="goToStep(previousStep)"
        />
        <UButton
          variant="outline" color="neutral" trailing-icon="i-ph-arrow-right" class="rounded-full"
          :disabled="!nextStep" :label="t('brand.workspace.next')"
          @click="goToStep(nextStep)"
        />
      </div>
    </template>

    <template #george>
      <BwGeorge
        :messages="georgeMessages"
        :advisor-name="advisor.name"
        :advisor-role="advisorRole"
        :advisor-avatar="advisor.avatar"
        :handover="handover"
        :placeholder="composerExample"
        @send="answerFromGeorge"
      >
        <template #chips>
          <div v-if="nextSlot" class="flex flex-col items-stretch gap-2">
            <button class="bw-chip bw-chip--ghost" @click="skipQuestion">{{ t('brand.workspace.dontKnow') }}</button>
          </div>
          <div v-else class="flex flex-col items-stretch gap-2">
            <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.confidence.question') }}</p>
            <BwChips
              :options="confidenceOptions"
              :selected="store.confidence ? [store.confidence] : []"
              :show-dont-know="false"
              @pick="pickConfidence"
            />
            <p v-if="completing" class="bw-label" style="color: var(--bw-muted)">{{ t('brand.workspace.completeStep') }}</p>
          </div>
        </template>
      </BwGeorge>
    </template>
  </BwWorkspace>

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

        <!-- Lesen ja, übernehmen nein — s. `versionsControls`. Der Satz sagt,
             wo der Weg zurück steht, statt nur einen toten Knopf zu zeigen. -->
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
