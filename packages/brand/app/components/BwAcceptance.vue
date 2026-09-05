<script setup lang="ts">
import {
  BRAND_SETTABLE_CONFIDENCE_VALUES,
  type BrandConfidence,
} from '../../shared/brandJourney'
import { brandChoiceDisplayLabel } from '../../shared/brandChoiceOptions'
import { brandSlotValueView } from '../../shared/brandSlotFormat'
import {
  resolveAcceptanceStage,
  restartWordMatches,
} from '../../shared/brandWorkspaceNav'
import {
  type BrandStepKey,
  slotById,
  slotsForStep,
} from '../../shared/slotRegistry'
import type {
  BrandAcceptanceSessionView,
  BrandFindingDecisionResponse,
  BrandRestartImpactResponse,
  BrandSessionAcceptResponse,
  BrandStepAcceptanceResponse,
  BrandStepRestartResponse,
  BrandStepReviewResponse,
} from '../../shared/types/brand'
import { useBrandWorkspaceStore } from '../stores/brandWorkspace'

/**
 * DIE FINALE ABNAHME EINES KAPITELS (BW2 Paket 3c-ii, Plan §5a — Ablauf von
 * David festgelegt am 2026-09-04).
 *
 * ── SIE IST EINE ANSICHT, KEINE ZWEITE SEITE ──────────────────────────────
 * Dieselbe Adresse wie die Sessions, nur `?s=acceptance`
 * (`BRAND_ACCEPTANCE_VIEW`). Die Werkstatt tauscht dafür ihre MITTE aus: kein
 * George, kein Prompt unten (§5a „Kein George auf dieser Seite"). Leiste und
 * Log bleiben stehen — der Mensch verlässt seine Werkstatt nicht, er schlägt
 * das Kapitel nur einmal ganz auf.
 *
 * ── DREI DINGE JE BLOCK, EIN ZÄHLER DARÜBER, DANN DIE FRAGE ───────────────
 * Bereich · Beispiel · eigene Eingabe (§5a Schritt 1), „7 von 10 abgenommen"
 * (Schritt 2), und ERST bei `acceptance.ready` der Hinweis und die Frage
 * „Passt dieses Kapitel?" (Schritt 3/4). Vorher steht dort die Blocker-Liste:
 * eine Weiche, die vor ihrer Bedingung erscheint, verspricht einen Abschluss,
 * den die Route danach abweist.
 *
 * ── EIN HÄKCHEN JE ZEILE, UND ZWAR GENAU EINES ────────────────────────────
 * „Abnehmen" IST Davids Häkchen (§5a; die erste Fassung des Abschnitts hatte
 * keines und wurde revidiert). Ein zweites Häkchen daneben gäbe es nicht zu
 * entscheiden — `confirmed` ist im Gespräch gefallen, `accepted` fällt hier.
 *
 * ── DIE `revision` IST LOKAL, UND DAS HAT EINEN GRUND ─────────────────────
 * Jede Handlung dieser Seite (Abnehmen, Restart) trägt die Revision der
 * Kapitel-Zeile mit; jede Antwort bringt die neue zurück. Sie wird deshalb
 * HIER geführt und nicht aus dem Store gelesen: in dieser Ansicht wird nichts
 * getippt, es gibt keinen Autosave, und ein zweiter Zähler daneben wäre die
 * zweite Antwort auf „welcher Stand gilt". Der Store bekommt trotzdem jede
 * Abnahme zu sehen (`applySessionAcceptance`) — Leiste und Zähler der
 * Werkstatt lesen daraus.
 *
 * ── DER SPEZIALIST LIEST DAS KAPITEL MIT (Paket 4, §5a) ───────────────────
 * Beim Öffnen der Seite geht EIN Aufruf an `POST …/review`: der Kapitel-Modus
 * des Schliess-Aufrufs, der die bestätigten Werte dieses Kapitels gegen das
 * ganze Dokument hält. Er ist FAIL-SOFT (die Seite steht auch ohne ihn) und
 * idempotent je Fassung (der Server lässt dieselbe `revision` nur einmal
 * durch). Sein Ergebnis ist eine neue Befund-Liste — deshalb wird danach die
 * Seite selbst neu gelesen und nicht ein Teilstück gepatcht.
 *
 * ── DIE BEFUND-CHIPS AM BLOCK (§8, Paket 5) ───────────────────────────────
 * Sie stehen unter der Kopfzeile jeder Zeile und lesen `session.findings` —
 * die OFFENEN Befunde, an denen genau dieses Feld beteiligt ist. Ein Konflikt
 * verbindet zwei Felder und erscheint deshalb an beiden Blöcken; entschieden
 * wird er einmal, und danach wird die SEITE neu gelesen: die Sperre der Weiche
 * unten rechnet der Server (§5a Schritt 3), nicht diese Ansicht.
 *
 * ── DER IMPACT-HINWEIS HÄNGT AN DER SEITE, NICHT HIER (§9, Paket 6) ───────
 * „Bearbeiten" und der Feld-Link eines Chips emittieren wie bisher nach oben;
 * die WERKSTATT-Seite legt den Hinweis davor (`correctThenGo`) und navigiert
 * danach. Grund: dieselbe Kette gilt für die Log-Karte und für einen
 * Feld-Link, der über die Kapitel-Grenze zeigt — dreimal derselbe `$fetch`
 * mit demselben Modal wäre dreimal dieselbe Pflege, und die Zustimmung muss
 * über die Sprünge hinweg gemerkt bleiben, sonst fragt der Layer zweimal.
 */
const props = defineProps<{
  profileId: string
  stepKey: BrandStepKey
}>()

const emit = defineEmits<{
  /** „Bearbeiten" und jeder Blocker-Link — die SEITE navigiert (sie spült aus). */
  session: [sessionId: string]
  /**
   * Ein Feld-Link eines Befund-Chips (§8). EIGENES Ereignis, weil ein Konflikt
   * ausdrücklich zwei KAPITEL verbinden darf (`b.purpose` ↔ `c.conflictRule`):
   * `session` meint eine Session DIESES Kapitels, `field` kann anderswo landen.
   */
  field: [slotId: string]
  /**
   * Ein Befund wurde HIER entschieden (§8). Die Seite liest sich selbst neu,
   * aber Log und Leiste der Werkstatt hängen am STORE — ohne dieses Ereignis
   * zeigten sie den Befund weiter, bis jemand neu lädt (Klick-Beweis
   * 2026-09-05: „1 Befund offen" blieb nach der Ablehnung stehen).
   */
  decided: [decision: BrandFindingDecisionResponse]
  /** Nach dem Abschluss: das nächste Kapitel mit seiner ersten Session. */
  advance: [target: { stepKey: BrandStepKey, sessionKey: string }]
  /** Nach „Nochmal von vorn": zurück auf die erste Session DIESES Kapitels. */
  restarted: [target: { sessionKey: string }]
}>()

const { t, te, locale } = useI18n()
const toast = useToast()
const store = useBrandWorkspaceStore()
const request = useRequestFetch()

/**
 * SSR-FÄHIG, wie der Rest der Werkstatt: `useAsyncData` mit dem
 * request-gebundenen `fetch` — sonst antwortet die Datentür beim Serverlauf
 * mit der Gast-Sicht (404) und die Seite hydratisiert als „kein Zugang".
 */
const acceptance = await useAsyncData<BrandStepAcceptanceResponse | null>(
  () => `brand-acceptance-${props.profileId}-${props.stepKey}`,
  () => request<BrandStepAcceptanceResponse>(
    `/api/brand/profiles/${props.profileId}/steps/${props.stepKey}/acceptance`,
  ),
  { watch: [() => props.profileId, () => props.stepKey], default: () => null },
)

const view = computed(() => acceptance.data.value)
const sessions = computed<BrandAcceptanceSessionView[]>(() => view.value?.sessions ?? [])

/** Der Stand der Kapitel-Zeile — s. Kopf, „die `revision` ist lokal". */
const revision = ref(0)
watch(view, (next) => { if (next) revision.value = next.revision }, { immediate: true })

/** Der Zähler-Stand; nach einer Abnahme aus der ANTWORT, nicht aus einem Abruf. */
const counter = ref<BrandStepAcceptanceResponse['acceptance'] | null>(null)
watch(view, (next) => { counter.value = next?.acceptance ?? null }, { immediate: true })

/**
 * DER KAPITEL-BLICK, EINMAL JE ÖFFNEN (s. Kopf).
 *
 * NUR IM BROWSER: beim SSR wäre er ein Modell-Aufruf im Seitenaufbau — jeder
 * Crawler, jeder Reload und jeder Prefetch bezahlte ihn mit. Und nur EINMAL je
 * geladener Seite: der Server hat seinen eigenen Riegel je `revision`, dieser
 * hier spart den Roundtrip.
 */
const chapterReviewed = ref('')

async function runChapterReview(): Promise<void> {
  const current = view.value
  if (!current) return
  const key = `${props.stepKey}:${current.revision}`
  if (chapterReviewed.value === key) return
  chapterReviewed.value = key
  try {
    const response = await $fetch<BrandStepReviewResponse>(
      `/api/brand/profiles/${props.profileId}/steps/${props.stepKey}/review`,
      // OHNE Rumpf: der Idempotenz-Schlüssel ist die `revision`, wie der SERVER
      // sie liest (s. dort). Der lokale Zähler oben ist nur der Sparhandgriff
      // gegen einen zweiten Roundtrip.
      { method: 'POST' },
    )
    // Neue Befunde können die Abnahme SPERREN (§5a Schritt 3) — die Zahlen und
    // Blocker rechnet der Server, also wird die Seite neu gelesen statt ein
    // Teilstück gepatcht.
    if (response.findings.length) await acceptance.refresh()
  }
  catch {
    // Fail-soft (§7): die Seite funktioniert ohne Befunde. Kein Toast — der
    // Mensch hat nichts angefordert.
  }
}

if (import.meta.client) {
  watch(view, () => { void runChapterReview() }, { immediate: true })
}

// ── Ein Block: Bereich · Beispiel · eigene Eingabe ────────────────────────

/**
 * EINE GLYPHE JE ZEILE, und die Rangfolge ist die Auskunft: was im Weg steht,
 * schlägt was erledigt ist. Eine abgenommene, aber VERALTETE Zeile als
 * „abgenommen" zu zeigen, versteckte genau den Grund, aus dem die Weiche unten
 * fehlt.
 */
const STATUS = {
  deferred: { key: 'brand.acceptance.status.deferred', icon: 'i-ph-clock', tone: 'var(--bw-ink-soft)' },
  stale: { key: 'brand.acceptance.status.stale', icon: 'i-ph-clock-counter-clockwise', tone: 'var(--bw-stale)' },
  accepted: { key: 'brand.acceptance.status.accepted', icon: 'i-ph-check-circle-fill', tone: 'var(--bw-accent)' },
  confirmed: { key: 'brand.acceptance.status.confirmed', icon: 'i-ph-check', tone: 'var(--bw-ink-soft)' },
  open: { key: 'brand.acceptance.status.open', icon: 'i-ph-circle-dashed', tone: 'var(--bw-muted)' },
} as const

function statusOf(session: BrandAcceptanceSessionView): typeof STATUS[keyof typeof STATUS] {
  if (session.deferred) return STATUS.deferred
  if (session.state === 'stale') return STATUS.stale
  if (session.accepted) return STATUS.accepted
  return session.confirmed ? STATUS.confirmed : STATUS.open
}

/**
 * EIN BLOCK, EINMAL GERECHNET (§5a Schritt 1). Beschriftung, Beispiel, Wert
 * und Status stehen im Template als FERTIGE Angaben — nicht als Aufruf je
 * Zeile: `valueView()` im Markup liefe bei jedem Neuzeichnen erneut durch den
 * Format-Leser, und die Typ-Umwege („ist das jetzt eine Liste?") stünden in
 * der Vorlage statt im Skript.
 *
 * Die BESCHRIFTUNG ist Kurz-Label vor Frage — exakt wie in Werkstatt und Log
 * (`slotLabel` dort). Ein zweiter Wortlaut hiesse, dass der Mensch das Feld
 * nicht wiedererkennt, das er gerade besprochen hat. Das BEISPIEL kommt in der
 * OBERFLÄCHEN-Sprache: der Server schickt beide, weil er die Anzeigesprache
 * des Browsers nicht besser kennt als der Browser selbst.
 */
interface AcceptanceRow {
  session: BrandAcceptanceSessionView
  label: string
  affects: string
  example: string
  value: ReturnType<typeof brandSlotValueView>
  status: { label: string, icon: string, tone: string }
  acceptable: boolean
}

const rows = computed<AcceptanceRow[]>(() => sessions.value.map((session) => {
  const meta = statusOf(session)
  const examples = locale.value === 'de' ? session.example.de : session.example.en
  return {
    session,
    label: te(session.labelKey) ? t(session.labelKey) : t(session.questionKey),
    affects: session.affects.count === 0
      ? t('brand.session.affectsNone')
      : t('brand.session.affects', {
          count: session.affects.count,
          steps: session.affects.steps.map(key => t(`brand.steps.${key}`)).join(' · '),
        }),
    example: examples[0] ?? '',
    // Eine geschlossene Auswahl zeigt ihren NAMEN, nicht die gespeicherte Id
    // (dieselbe Regel wie im Log); die FORM (`list`/`structured`) kommt aus
    // `brandSlotFormat.ts` — hier wird sie nur gelesen.
    value: brandSlotValueView(
      slotById(session.slotId)?.schema.kind ?? 'text',
      brandChoiceDisplayLabel(session.slotId, session.value, locale.value),
    ),
    status: { label: t(meta.key), icon: meta.icon, tone: meta.tone },
    // Abnehmbar ist, was bestätigt und noch nicht abgenommen ist (Schritt 2).
    acceptable: session.confirmed && !session.accepted,
  }
}))

// ── Abnehmen ──────────────────────────────────────────────────────────────

const accepting = ref<string | null>(null)

async function accept(session: BrandAcceptanceSessionView): Promise<void> {
  if (!session.confirmed || session.accepted || accepting.value) return
  accepting.value = session.slotId
  try {
    const response = await $fetch<BrandSessionAcceptResponse>(
      `/api/brand/profiles/${props.profileId}/steps/${props.stepKey}/sessions/${session.slotId}/accept`,
      { method: 'POST', body: { revision: revision.value } },
    )
    // DIE ANTWORT IST DER NEUE STAND — kein zweiter Abruf: `revision`, Zähler
    // und die eine geänderte Zeile stehen darin. Ohne die Revision liefe die
    // nächste Abnahme in einen 409.
    revision.value = response.revision
    counter.value = response.acceptance
    if (acceptance.data.value) {
      acceptance.data.value = {
        ...acceptance.data.value,
        revision: response.revision,
        acceptance: response.acceptance,
        sessions: acceptance.data.value.sessions.map(entry => (entry.slotId === response.sessionKey
          ? { ...entry, accepted: response.accepted, deferred: response.deferred }
          : entry)),
      }
    }
    // Leiste und Werkstatt-Zähler lesen aus dem Store — s. Kopf.
    store.applySessionAcceptance(response)
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } }).data?.reason
    const stale = reason === 'revision_conflict' || reason === 'not_confirmed'
    toast.add({
      color: 'warning',
      title: t('brand.acceptance.acceptFailed'),
      description: stale ? t('brand.acceptance.reloadHint') : undefined,
    })
    // Ein 409 heisst „dein Stand ist alt", nicht „du hast dich vertippt": die
    // Seite holt ihn nach, statt den Menschen mit einer Liste stehen zu lassen,
    // deren Knöpfe alle in denselben Fehler laufen. Die `revision` kommt
    // dabei mit — sie ist der Grund der Absage (s. Kopf).
    if (stale) await acceptance.refresh()
  }
  finally {
    accepting.value = null
  }
}

/**
 * „GILT WEITER" AUF EINER VERALTETEN ZEILE (BW2 Paket 6, §9).
 *
 * Eine `stale`-Zeile SPERRT die Abnahme (Blocker-Grund `stale`), und der
 * Ausweg gehört an die Zeile selbst: hier steht der Wert, hier sieht der
 * Mensch, ob er nach der Änderung davor noch stimmt. Der Server stempelt den
 * heutigen Quellen-Stand, der Wert bleibt Wort für Wort — wer stattdessen neu
 * besprechen will, geht über „Bearbeiten" in die Session.
 *
 * Danach wird die SEITE neu gelesen und nicht ein Teilstück gepatcht: an einer
 * gefallenen Sperre hängen Zähler, Blocker-Liste und die Weiche unten, und
 * alle drei rechnet der Server.
 */
const keeping = ref<string | null>(null)

async function keep(session: BrandAcceptanceSessionView): Promise<void> {
  if (keeping.value) return
  keeping.value = session.slotId
  try {
    const response = await $fetch<BrandSessionAcceptResponse>(
      `/api/brand/profiles/${props.profileId}/steps/${props.stepKey}/sessions/${session.slotId}/restamp`,
      { method: 'POST', body: { revision: revision.value } },
    )
    revision.value = response.revision
    counter.value = response.acceptance
    // Leiste und Werkstatt lesen aus dem Store — dort fällt das Bernstein.
    store.applySessionRestamp(response)
    await acceptance.refresh()
  }
  catch {
    toast.add({ color: 'warning', title: t('brand.session.keepFailed') })
    await acceptance.refresh()
  }
  finally {
    keeping.value = null
  }
}

/**
 * EIN BEFUND WURDE ENTSCHIEDEN (§8) — die SEITE wird neu gelesen.
 *
 * Nicht ein Teilstück gepatcht: an einem Befund hängen der Zähler, die
 * Blocker-Liste und die Weiche unten, und alle drei rechnet der Server
 * (`acceptance.ready`). Die `revision` kommt MIT der Antwort, weil ein
 * abgelehnter Befund seinen Grund als Notiz an die Quell-Session hängt — ohne
 * sie liefe das nächste „Abnehmen" in einen 409 (s. Kopf, „die `revision` ist
 * lokal").
 */
async function findingDecided(decision: BrandFindingDecisionResponse): Promise<void> {
  if (decision.revision > revision.value) revision.value = decision.revision
  emit('decided', decision)
  await acceptance.refresh()
}

/**
 * BEARBEITEN = SPRUNG IN DIE SESSION. Den Impact-Hinweis davor (§9, „berührt
 * 14 bestätigte Felder in vier Kapiteln") legt die SEITE dazwischen: sie hört
 * dieses Ereignis, holt die Hülle, zeigt den Layer und springt erst nach dem
 * Annehmen (`correctThenGo`, s. Kopf).
 */
function edit(session: BrandAcceptanceSessionView): void {
  emit('session', session.slotId)
}

// ── Die Weiche: Blocker, Frage oder „Weiter zu …" ─────────────────────────

const stage = computed(() => resolveAcceptanceStage({
  ready: counter.value?.ready === true,
  storedState: view.value?.storedState ?? 'open',
}))

/**
 * DIE DREI ANTWORTEN (§5a Schritt 4) — die zwei SETZBAREN Konfidenzen plus
 * „Nochmal von vorn". Der dritte Chip trägt KEINE Konfidenz mehr: seit BW2 ist
 * das eine Handlung mit Schnappschuss (`BRAND_CONFIDENCE_VALUES` behält den
 * Wert nur für Bestandszeilen). Die Beschriftungen bleiben die der Bühne —
 * derselbe Wortlaut, nur an seinem neuen Ort.
 */
const RESTART_OPTION = 'restart'

const answerOptions = computed(() => [
  ...BRAND_SETTABLE_CONFIDENCE_VALUES.map(value => ({
    id: value,
    label: t(`brand.workspace.confidence.${value}`),
    recommended: false,
  })),
  {
    id: RESTART_OPTION,
    label: t('brand.workspace.confidence.restart'),
    recommended: false,
    // Der Weg ZURÜCK steht abgesetzt — leiser als die beiden anderen (BwChips).
    tone: 'quiet' as const,
  },
])

const completing = ref(false)

async function pickAnswer(value: string): Promise<void> {
  if (value === RESTART_OPTION) {
    await openRestart()
    return
  }
  if (completing.value) return

  completing.value = true
  try {
    store.setConfidence(value as BrandConfidence)
    await store.completeStep(props.profileId)
    // Der gespeicherte Zustand steht jetzt auf `done` — die Weiche weicht dem
    // Knopf „Weiter zu …". Neu geladen, weil `complete` die Revision bewegt
    // und die Antwort sie nicht trägt.
    await acceptance.refresh()
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } }).data?.reason
    toast.add({
      color: 'warning',
      title: t('brand.acceptance.completeFailed'),
      description: reason === 'acceptance_incomplete' || reason === 'required_slots_missing'
        ? t('brand.acceptance.reloadHint')
        : undefined,
    })
  }
  finally {
    completing.value = false
  }
}

/** Das nächste Kapitel auf dem Weg — aus der Journey, die `complete` erneuert hat. */
const nextStep = computed<BrandStepKey | null>(() => store.neighbourStep(1))

function advance(): void {
  const target = nextStep.value
  if (!target) return
  const first = slotsForStep(target)[0]
  if (!first) return
  emit('advance', { stepKey: target, sessionKey: first.id })
}

// ── „Nochmal von vorn" — der Schutz-Layer (§5a) ───────────────────────────

const restartOpen = ref(false)
const impact = ref<BrandRestartImpactResponse | null>(null)
const impactLoading = ref(false)
const impactChanged = ref(false)
const downstreamOpen = ref(false)
const typedWord = ref('')
const restarting = ref(false)

const restartWord = computed(() => t('brand.acceptance.restart.word'))
/** Der Knopf ist zu, bis das Wort steht — Reibung gegen den Fehlklick. */
const restartArmed = computed(() => impact.value !== null
  && restartWordMatches(typedWord.value, restartWord.value))

const downstreamSteps = computed(() => Object.entries(impact.value?.downstream.byStep ?? {})
  .map(([stepKey, slots]) => ({
    stepKey,
    label: t(`brand.steps.${stepKey}`),
    fields: (slots ?? []).map(slotId => fieldLabel(slotId)),
  }))
  .filter(entry => entry.fields.length > 0))

/** Ein Feld eines SPÄTEREN Kapitels — dort liegt keine Antwort-Zeile vor. */
function fieldLabel(slotId: string): string {
  const labelKey = `brand.labels.${slotId}`
  if (te(labelKey)) return t(labelKey)
  const slot = slotById(slotId)
  return slot ? t(slot.questionKey) : slotId
}

/**
 * DIE HÜLLE HOLEN — ohne KI und ohne einen einzigen Schreibvorgang. Sie trägt
 * den `ack`, der den Restart überhaupt erst zulässt, UND die `revision`: beide
 * gehören zusammen, deshalb kommen sie aus DEMSELBEN Abruf.
 */
async function loadImpact(): Promise<void> {
  impactLoading.value = true
  try {
    const loaded = await $fetch<BrandRestartImpactResponse>(
      `/api/brand/profiles/${props.profileId}/steps/${props.stepKey}/restart-impact`,
    )
    impact.value = loaded
    revision.value = loaded.revision
  }
  catch {
    impact.value = null
    toast.add({ color: 'warning', title: t('brand.acceptance.restart.failed') })
  }
  finally {
    impactLoading.value = false
  }
}

async function openRestart(): Promise<void> {
  restartOpen.value = true
  typedWord.value = ''
  impactChanged.value = false
  downstreamOpen.value = false
  await loadImpact()
}

/**
 * BESTÄTIGEN — `acknowledge` UND der `impactAck` (§5a Schritt 2). Das getippte
 * Wort prüft der Server NIE; er prüft den Hash über genau die Hülle, die dem
 * Menschen gezeigt wurde. Passt er nicht mehr, hat sich seither etwas bewegt:
 * dann wird sie NEU GEZEIGT, statt zu löschen, was so nie angekündigt war.
 *
 * ── DER 409 TRÄGT SEINE HÜLLE NICHT MIT (Befund P1c, hier erneut) ─────────
 * `BrandRestartConflictData` beschreibt `{ code, impact }`, und die Route legt
 * genau das bei. Beim CLIENT kommt davon nichts an: der zentrale Fehler-Handler
 * (`packages/core/server/error.ts`) hebt AUSSCHLIESSLICH `data.code` als
 * `reason` ins Envelope und lässt die restliche `data` bewusst draussen. Diese
 * Stelle holt die Hülle deshalb mit EINEM zusätzlichen GET nach — wörtlich
 * dieselbe Lösung, die `useBrandAutosave` für den `revision_conflict` gewählt
 * hat. Ein Layer, der nach dem Wechsel die ALTE Hülle zeigte, wäre die einzige
 * Variante, die wirklich schadet: er behauptete Zahlen, die nicht mehr gelten,
 * über einem Knopf, der löscht.
 */
async function confirmRestart(): Promise<void> {
  const current = impact.value
  if (!current || !restartArmed.value || restarting.value) return
  restarting.value = true
  try {
    const response = await $fetch<BrandStepRestartResponse>(
      `/api/brand/profiles/${props.profileId}/steps/${props.stepKey}/restart`,
      {
        method: 'POST',
        body: { acknowledge: true, impactAck: current.ack, revision: revision.value },
      },
    )
    restartOpen.value = false
    impact.value = null
    revision.value = response.revision
    const next = response.next
    emit('restarted', {
      sessionKey: next && 'sessionKey' in next ? next.sessionKey : '',
    })
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } }).data?.reason
    if (reason === 'restart_unacknowledged' || reason === 'revision_conflict') {
      typedWord.value = ''
      impactChanged.value = true
      // Neu holen, nicht raten: der Knopf bleibt zu, bis der Mensch das Wort
      // ein zweites Mal getippt hat — er soll die neuen Zahlen lesen.
      await loadImpact()
      return
    }
    toast.add({ color: 'warning', title: t('brand.acceptance.restart.failed') })
  }
  finally {
    restarting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-6 pb-4">
    <div>
      <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">
        {{ t('brand.acceptance.title') }}
      </p>
      <h1 class="mt-1 text-[26px] font-extralight leading-tight tracking-tight">
        {{ t(`brand.steps.${stepKey}`) }}
      </h1>
      <p class="mt-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
        {{ t('brand.acceptance.lead') }}
      </p>
      <p v-if="counter" class="bw-label mt-3 tabular-nums" style="color: var(--bw-muted)">
        {{ t('brand.acceptance.counter', { accepted: counter.accepted, total: counter.total }) }}
      </p>
    </div>

    <p v-if="acceptance.error.value" class="bw-pending">{{ t('brand.acceptance.loadFailed') }}</p>

    <!-- DIE LISTE: ein Block je Session, in Registry-Reihenfolge. Eine
         optionale Session ohne Wert steht grau dabei — mit Beispiel und leerer
         Eingabe (§5a Schritt 1). -->
    <div
      v-for="row in rows" :key="row.session.slotId"
      class="rounded-2xl px-4 py-4"
      :style="row.session.confirmed ? 'background: var(--bw-surface-hi)' : 'background: var(--bw-surface)'"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p class="min-w-0 text-sm font-medium">{{ row.label }}</p>
        <span class="bw-label flex flex-none items-center gap-1" :style="`color: ${row.status.tone}`">
          <UIcon :name="row.status.icon" class="size-3.5" />{{ row.status.label }}
        </span>
      </div>
      <p class="bw-label mt-1" style="color: var(--bw-muted)">{{ row.affects }}</p>

      <!-- BEFUND-CHIPS (§8): offen, weil hier entschieden wird. Der Feld-Link
           kann in ein ANDERES Kapitel zeigen — deshalb `field`, nicht `session`. -->
      <div v-if="row.session.findings.length" class="mt-3 flex flex-col gap-2">
        <BwFindingChip
          v-for="finding in row.session.findings" :key="finding.id"
          :finding="finding" :profile-id="profileId"
          @field="emit('field', $event)"
          @decided="findingDecided"
          @stale="acceptance.refresh()"
        />
      </div>

      <div v-if="row.example" class="mt-3">
        <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.acceptance.exampleLabel') }}</p>
        <p class="mt-1 text-sm italic leading-relaxed" style="color: var(--bw-ink-soft)">{{ row.example }}</p>
      </div>

      <div class="mt-3">
        <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.acceptance.own') }}</p>
        <template v-if="row.session.value">
          <ul v-if="row.value.kind === 'list'" class="mt-1 space-y-1">
            <li
              v-for="(item, index) in row.value.items" :key="index"
              class="bw-doc-text flex gap-2" style="font-size: 0.875rem; line-height: 1.5"
            >
              <span class="flex-none" style="color: var(--bw-line-strong)">—</span>{{ item }}
            </li>
          </ul>
          <div v-else-if="row.value.kind === 'blocks'" class="mt-1 space-y-3">
            <div v-for="(block, index) in row.value.blocks" :key="index">
              <p class="bw-label" style="color: var(--bw-ink-soft)">{{ block.label }}</p>
              <p class="bw-doc-text mt-0.5 whitespace-pre-wrap" style="font-size: 0.875rem; line-height: 1.5">{{ block.body }}</p>
            </div>
          </div>
          <p v-else class="bw-doc-text mt-1 whitespace-pre-wrap" style="font-size: 0.875rem; line-height: 1.5">
            {{ row.value.text }}
          </p>
        </template>
        <p v-else class="bw-pending mt-1">{{ t('brand.acceptance.valueEmpty') }}</p>
      </div>

      <!-- Die Notiz des Schliess-Aufrufs (§4), eingeklappt — dazu die Gründe
           abgelehnter Befunde, die als Notiz an ihrer Quell-Session landen
           (§8). Ohne Inhalt fällt die Zeile weg, statt leer dazustehen. -->
      <details v-if="row.session.notes" class="mt-3">
        <summary class="bw-label cursor-pointer" style="color: var(--bw-muted)">{{ t('brand.acceptance.notes') }}</summary>
        <p class="mt-1 whitespace-pre-wrap text-sm" style="color: var(--bw-ink-soft)">{{ row.session.notes }}</p>
      </details>

      <div class="mt-3 flex flex-wrap items-center justify-end gap-2">
        <!-- Ein Knopf, der garantiert in eine Absage liefe, ist kein Angebot:
             statt seiner steht der GRUND mit dem Weg dorthin. -->
        <p v-if="!row.session.confirmed" class="bw-label mr-auto" style="color: var(--bw-muted)">
          {{ t('brand.acceptance.unconfirmed') }}
        </p>
        <!-- VERALTET (§9): der Wert steht, seine Grundlage hat sich bewegt.
             „Gilt weiter" stempelt sie neu — die Sperre fällt, ohne dass
             jemand ein Gespräch führen muss. -->
        <UButton
          v-if="row.session.state === 'stale'"
          size="xs" color="neutral" variant="ghost" class="rounded-full"
          icon="i-ph-check" :loading="keeping === row.session.slotId"
          :label="t('brand.session.keep')"
          @click="keep(row.session)"
        />
        <UButton
          size="xs" color="neutral" variant="ghost" class="rounded-full"
          icon="i-ph-pencil-simple" :label="t('brand.acceptance.edit')"
          @click="edit(row.session)"
        />
        <span v-if="row.session.accepted" class="bw-confirm bw-confirm--done bw-confirm--xs">
          <UIcon name="i-ph-check" class="size-3.5" />{{ t('brand.acceptance.accepted') }}
        </span>
        <button
          v-else
          type="button" class="bw-confirm bw-confirm--open bw-confirm--xs"
          :disabled="!row.acceptable || accepting !== null"
          @click="accept(row.session)"
        >
          <UIcon name="i-ph-check" class="size-3.5" />{{ t('brand.acceptance.accept') }}
        </button>
      </div>
    </div>

    <!-- NOCH NICHT SO WEIT: die Blocker als ruhige Liste, je Zeile der Grund
         und der Weg in seine Session (§5a Schritt 2/3). -->
    <div v-if="stage === 'blocked' && counter?.blockers.length">
      <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.acceptance.blockersTitle') }}</p>
      <ul class="mt-2 flex flex-col gap-1">
        <li
          v-for="(blocker, index) in counter.blockers" :key="`${blocker.slotId}-${index}`"
          class="bw-label flex flex-wrap items-baseline gap-x-2" style="color: var(--bw-ink-soft)"
        >
          <button type="button" class="underline" @click="emit('session', blocker.slotId)">
            {{ fieldLabel(blocker.slotId) }}
          </button>
          <span style="color: var(--bw-muted)">{{ t(`brand.acceptance.blocker.${blocker.reason}`) }}</span>
        </li>
      </ul>
    </div>

    <!-- ALLES ABGENOMMEN: der Hinweis und darunter die Frage (§5a Schritt 3/4). -->
    <div v-else-if="stage === 'question'">
      <p class="text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.acceptance.allClear') }}</p>
      <p class="mb-2 mt-4 font-medium">{{ t('brand.acceptance.question') }}</p>
      <BwChips
        :options="answerOptions"
        :selected="[]"
        :show-dont-know="false"
        @pick="pickAnswer"
      />
      <p v-if="completing" class="bw-label mt-2" style="color: var(--bw-muted)">{{ t('brand.acceptance.completing') }}</p>
    </div>

    <!-- SCHON ABGENOMMEN: der Weg weiter, nicht die Frage noch einmal. -->
    <div v-else-if="stage === 'done'">
      <p class="text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.acceptance.doneNote') }}</p>
      <UButton
        v-if="nextStep"
        class="mt-3 rounded-full" trailing-icon="i-ph-arrow-right"
        :label="t('brand.acceptance.continueTo', { step: t(`brand.steps.${nextStep}`) })"
        @click="advance"
      />
    </div>

    <!-- DER SCHUTZ-LAYER (§5a): er SAGT, was verloren geht, und lässt sich nur
         mit einem getippten Wort schliessen. NIE per v-if aus dem Baum nehmen
         (Reka-Falle) — `v-model:open` allein steuert ihn. -->
    <UModal v-model:open="restartOpen" :title="t('brand.acceptance.restart.title')">
      <template #content>
        <div class="bw-root bw-overlay max-h-[85vh] overflow-y-auto p-8">
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-stale)">
            {{ t(`brand.steps.${stepKey}`) }}
          </p>
          <h2 class="mt-1 text-[24px] font-extralight leading-tight tracking-tight">
            {{ t('brand.acceptance.restart.title') }}
          </h2>

          <p v-if="impactLoading" class="bw-pending mt-4">{{ t('brand.acceptance.restart.loading') }}</p>

          <template v-else-if="impact">
            <p v-if="impactChanged" class="mt-3 text-sm" style="color: var(--bw-stale)">
              {{ t('brand.acceptance.restart.changed') }}
            </p>
            <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
              {{ t('brand.acceptance.restart.loss', {
                values: impact.chapter.values,
                notes: impact.chapter.notes,
                accepted: impact.chapter.accepted,
              }) }}
            </p>

            <div v-if="impact.downstream.count > 0" class="mt-4">
              <p class="text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
                {{ t('brand.acceptance.restart.downstream', { count: impact.downstream.count }) }}
              </p>
              <ul class="mt-2 flex flex-col gap-1">
                <li v-for="entry in downstreamSteps" :key="entry.stepKey" class="bw-label" style="color: var(--bw-muted)">
                  {{ entry.label }} · {{ entry.fields.length }}
                </li>
              </ul>
              <button
                type="button" class="bw-label mt-2 underline" style="color: var(--bw-muted)"
                :aria-expanded="downstreamOpen" @click="downstreamOpen = !downstreamOpen"
              >
                {{ downstreamOpen
                  ? t('brand.acceptance.restart.downstreamHide')
                  : t('brand.acceptance.restart.downstreamShow') }}
              </button>
              <div v-if="downstreamOpen" class="mt-2 flex flex-col gap-3">
                <div v-for="entry in downstreamSteps" :key="entry.stepKey">
                  <p class="bw-label" style="color: var(--bw-ink-soft)">{{ entry.label }}</p>
                  <ul class="mt-1 flex flex-col gap-0.5">
                    <li v-for="(field, index) in entry.fields" :key="index" class="bw-label" style="color: var(--bw-muted)">
                      · {{ field }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <p class="mt-5 text-sm" style="color: var(--bw-ink-soft)">
              {{ t('brand.acceptance.restart.typeToConfirm', { word: restartWord }) }}
            </p>
            <UInput
              v-model="typedWord" size="sm" class="mt-2 w-full"
              :aria-label="t('brand.acceptance.restart.inputLabel')"
              :placeholder="restartWord"
            />
          </template>

          <p v-else class="bw-pending mt-4">{{ t('brand.acceptance.restart.failed') }}</p>

          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <UButton
              variant="ghost" color="neutral" class="rounded-full"
              :label="t('brand.acceptance.restart.cancel')" @click="restartOpen = false"
            />
            <UButton
              color="neutral" class="rounded-full"
              :disabled="!restartArmed" :loading="restarting"
              :label="t('brand.acceptance.restart.confirm')" @click="confirmRestart"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
