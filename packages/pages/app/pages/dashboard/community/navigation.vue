<script setup lang="ts">
/**
 * DAS MENÜ DER COMMUNITY ZUSAMMENSTELLEN (U15 Teil 1, Davids Zuschnitt vom
 * 2026-08-13) — Reiter des Community-Hubs.
 *
 * ── WARUM DIE SEITE IM pages-LAYER LIEGT ──────────────────────────────────
 * Dieselbe Regel wie überall (A14, „eine Seite reicht nur so weit wie ihre
 * Routen"), und hier fällt sie eindeutig aus:
 *
 *  - Die Schreib-Route (`PATCH /api/pages/navigation`) braucht KEINE Naht ins
 *    Control Plane — die Wahrheit steht im Runtime-Projekt. Damit entfällt der
 *    Grund, aus dem Branding und Mitglieder im onboarding-Layer sitzen.
 *  - Der Link-Wähler braucht die VERÖFFENTLICHTEN SEITEN dieser Community, und
 *    die gehören diesem Layer. Läge die Seite anderswo, zöge sie eine
 *    Produkt-Route über eine Zeichenkette herbei — genau die Kopplung, die
 *    A14 verbietet.
 *  - Der Layer hat sich hier selbst angekündigt: der Kommentar an
 *    `pukalani.admin.modules` sagt seit E9 „die Seiten SIND die Website einer
 *    Community; Navigation kommt später als zweiter Eintrag dazu".
 *
 * Die Registry-EINTRÄGE gehören trotzdem nicht diesem Layer, und das muss auch
 * so bleiben: die Seite liest sie über `pukalani.chrome.nav` aus der
 * App-Config und weiss von keinem Produkt-Layer etwas. Ihre Ids sind für sie
 * undurchsichtige Schlüssel.
 *
 * ── DIE FILTER LAUFEN HIER GENAUSO WIE IM LAYOUT ──────────────────────────
 * `filterChromeNavEntries` (core) ist dieselbe Funktion, die das
 * blueprint-Layout benutzt. Das ist kein Sparsamkeits-Trick: böte der Editor
 * eine andere Liste an als die Seite zeigt, verspräche er Einträge, die nie
 * erscheinen — oder verschwiege welche, die es tun.
 *
 * ── KEINE `UTable`, UND DER GRUND STEHT HIER ──────────────────────────────
 * `UTable` ist der Standard für Datenlisten im Dashboard (Davids Entscheidung
 * B6). Diese Liste ist keine: sie hat keine Sortierung (die REIHENFOLGE IST
 * der Inhalt), keine Auswahl und keine Seiten. Ihre Kernhandlung ist das
 * Ziehen, und ein sortierbares Raster, dessen Sortierung man nicht benutzen
 * darf, wäre eine Bedienhilfe, die in die Irre führt. Gezogen wird nativ
 * (HTML5, wie das Ticket-Board) — dazu Pfeiltasten-Knöpfe, denn eine
 * Reihenfolge, die nur mit der Maus zu ändern ist, kann ein Teil der Leute
 * gar nicht ändern.
 */
import {
  MAX_NAV_LABEL,
  type CommunityNavOverride,
  type CommunityNavOverrideEntry,
  filterChromeNavEntries,
  isSafeExternalNavTarget,
  nextCustomNavLinkId,
  resolveCommunityNav,
} from '../../../../../core/shared/communityNavigation'
import { isProductStateEnabled } from '../../../../../core/shared/types/config'
import type { PukalaniChromeNavEntry } from '../../../../../core/shared/types/chrome'
import { CMS_PAGE_NAV_ORDER, cmsPageNavId, isLegalPageSlug, type PublicPageNavItem } from '../../../../shared/types/page'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], requiredCapability: 'branding.manage' })

const { t, locale } = useI18n()
const toast = useToast()
const appConfig = useAppConfig()
const { isLoggedIn } = useCurrentUser()
const { planAllows } = useTenantPlan()
const runtimeFlags = useRuntimeFlags()

useBrandTitle(() => t('pages.navigation.title'))

interface ChromeNavConfig {
  nav?: Record<string, PukalaniChromeNavEntry | false>
}

/** Eine Zeile im Editor. `available: false` = gespeichert, aber gerade nicht
 *  angeboten (Produkt aus, Tarif zu klein, Seite zurückgezogen). */
interface EditorRow {
  id: string
  hidden: boolean
  /** Eigener Text; leer = die mitgelieferte Übersetzung. */
  label: string
  /** Der mitgelieferte Text (bei eigenen Links leer). */
  fallbackLabel: string
  to: string
  external: boolean
  custom: boolean
  available: boolean
}

const rows = ref<EditorRow[]>([])
const saving = ref(false)
const dragIndex = ref<number | null>(null)

/**
 * `useRequestFetch` statt `$fetch`: im Pool entscheidet der HOST über den
 * Mandanten, und im SSR trägt ein blankes `$fetch` ihn nicht mit — die Route
 * antwortet dann `404 Unknown host`. Hier fiel es besonders leise aus, weil
 * beide Abrufe ihren Fehler mit `.catch()` in einen leeren Wert verwandeln:
 * die Seite sah dann einfach unbefüllt aus. Wächter:
 * `packages/core/tests/ssrTenantFetch.test.ts`.
 */
const requestFetch = useRequestFetch()
const { data: navPages } = await useAsyncData(
  () => `nav-editor-pages-${locale.value}`,
  () => requestFetch<PublicPageNavItem[]>('/api/pages/public', { query: { locale: locale.value } })
    .catch(() => [] as PublicPageNavItem[]),
  { watch: [locale] },
)
const { data: saved } = await useAsyncData(
  () => 'nav-editor-override',
  () => requestFetch<CommunityNavOverride>('/api/pages/navigation').catch(() => null),
)

/**
 * Die angebotenen Einträge — Wort für Wort die Rechnung des blueprint-Layouts
 * (Registry nach ihren Gates + CMS-Seiten ohne die Rechtsseiten, die in den
 * Fuß gehören).
 */
const candidates = computed(() => {
  // Über `unknown`, und das ist keine Schludrigkeit: die App-Config ist tief
  // gemergt, ihr abgeleiteter Typ ist also je APP ein anderes Literal (in
  // apps/control ein anderes als in apps/platform). Die Registry ist trotzdem
  // ein Vertrag mit fester Form (core/shared/types/chrome.ts) — nur sieht der
  // Compiler sie hier als Sammlung konkreter Objekte und nicht als die
  // Record-Map, die sie ist. Dasselbe Muster wie im blueprint-Layout.
  const chrome = (appConfig.pukalani as unknown as { chrome?: ChromeNavConfig }).chrome
  const entries = filterChromeNavEntries(
    chrome?.nav,
    {
      isLoggedIn: isLoggedIn.value,
      productOn: (key?: string) => !key || isProductStateEnabled(runtimeFlags.value.products[key]),
      planAllows,
    },
  ).map(entry => ({
    id: entry.id,
    label: t(entry.labelKey),
    to: entry.to,
    icon: entry.icon,
    planProduct: entry.planProduct,
    order: entry.order ?? 50,
  }))
  const pages = (navPages.value ?? [])
    .filter(page => page.slug !== 'home' && !isLegalPageSlug(page.slug))
    .map(page => ({
      id: cmsPageNavId(page.slug),
      label: page.title,
      to: `/${page.slug}`,
      order: CMS_PAGE_NAV_ORDER,
    }))
  return [...entries, ...pages]
})

/** Seiten, auf die ein eigener Link zeigen darf (die Route prüft dieselbe Menge). */
const linkablePages = computed(() => [
  { label: t('pages.navigation.link.homePage'), value: '/' },
  ...(navPages.value ?? []).filter(page => page.slug !== 'home').map(page => ({
    label: page.title,
    value: `/${page.slug}`,
  })),
])

/**
 * Gespeicherte Wahl + Angebot ⇒ Editor-Zeilen.
 *
 * NICHT ERWÄHNTE EINTRÄGE HÄNGEN HINTEN AN und GESPEICHERTE UNBEKANNTE bleiben
 * STEHEN (dimmt, mit Hinweis) — beides exakt die Zusagen (2) und (3) von
 * `resolveCommunityNav`. Der zweite Punkt ist der wichtigere: würde der Editor
 * eine Zeile weglassen, deren Produkt gerade abgeschaltet ist, LÖSCHTE das
 * nächste Speichern sie endgültig — und mit ihr die Entscheidung, die der
 * Owner einmal getroffen hat.
 */
function buildRows(): EditorRow[] {
  const byId = new Map(candidates.value.map(c => [c.id, c]))
  const seen = new Set<string>()
  const out: EditorRow[] = []

  for (const entry of saved.value?.entries ?? []) {
    if (seen.has(entry.id)) continue
    seen.add(entry.id)
    const candidate = byId.get(entry.id)
    const custom = entry.to !== undefined || entry.external !== undefined
    out.push({
      id: entry.id,
      hidden: entry.hidden === true,
      label: entry.label ?? '',
      fallbackLabel: candidate?.label ?? '',
      to: entry.to ?? candidate?.to ?? '',
      external: entry.external === true,
      custom: !candidate && custom,
      available: !!candidate || (!candidate && custom),
    })
  }
  for (const candidate of [...candidates.value].sort((a, b) => a.order - b.order)) {
    if (seen.has(candidate.id)) continue
    out.push({
      id: candidate.id,
      hidden: false,
      label: '',
      fallbackLabel: candidate.label,
      to: candidate.to,
      external: false,
      custom: false,
      available: true,
    })
  }
  return out
}

watch([saved, candidates], () => { rows.value = buildRows() }, { immediate: true })

/** Was gespeichert würde — und damit auch, was die Vorschau rechnet. */
const draft = computed<CommunityNavOverride>(() => ({
  entries: rows.value.map((row) => {
    const entry: CommunityNavOverrideEntry = { id: row.id }
    if (row.hidden) entry.hidden = true
    const label = row.label.trim()
    if (label) entry.label = label
    if (row.custom) {
      entry.to = row.to
      if (row.external) entry.external = true
    }
    return entry
  }),
}))

/** Die Vorschau rechnet mit DERSELBEN Regel wie die Seite — nicht mit einer
 *  zweiten, die „ungefähr dasselbe" tut. */
const preview = computed(() => resolveCommunityNav(candidates.value, draft.value))

function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= rows.value.length) return
  const next = [...rows.value]
  const [row] = next.splice(index, 1)
  next.splice(target, 0, row!)
  rows.value = next
}

function onDragStart(index: number) {
  dragIndex.value = index
}
function onDragOver(index: number) {
  const from = dragIndex.value
  if (from === null || from === index) return
  const next = [...rows.value]
  const [row] = next.splice(from, 1)
  next.splice(index, 0, row!)
  rows.value = next
  dragIndex.value = index
}
function onDragEnd() {
  dragIndex.value = null
}

// ── Eigenen Link anlegen ──────────────────────────────────────────────────
const adding = ref(false)
const newKind = ref<'page' | 'external'>('page')
const newLabel = ref('')
const newPage = ref<string>('/')
const newUrl = ref('')

const newTargetValid = computed(() =>
  newKind.value === 'page' ? !!newPage.value : isSafeExternalNavTarget(newUrl.value.trim()))
const canAdd = computed(() => !!newLabel.value.trim() && newTargetValid.value)

function addLink() {
  if (!canAdd.value) return
  rows.value = [...rows.value, {
    id: nextCustomNavLinkId(rows.value),
    hidden: false,
    label: newLabel.value.trim(),
    fallbackLabel: '',
    to: newKind.value === 'page' ? newPage.value : newUrl.value.trim(),
    external: newKind.value === 'external',
    custom: true,
    available: true,
  }]
  adding.value = false
  newLabel.value = ''
  newUrl.value = ''
  newPage.value = '/'
}

function removeRow(index: number) {
  rows.value = rows.value.filter((_, i) => i !== index)
}

async function save() {
  saving.value = true
  try {
    saved.value = await $fetch<CommunityNavOverride>('/api/pages/navigation', {
      method: 'PATCH',
      body: draft.value,
    })
    toast.add({ title: t('pages.navigation.saved'), color: 'success' })
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } })?.data?.reason
    toast.add({
      title: reason === 'unknown_page' ? t('pages.navigation.errorUnknownPage') : t('pages.navigation.errorSave'),
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}

async function resetAll() {
  rows.value = []
  await save()
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold">{{ t('pages.navigation.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('pages.navigation.description') }}</p>
          </div>
          <UButton
            :loading="saving"
            icon="i-ph-floppy-disk"
            data-testid="nav-save"
            @click="save"
          >
            {{ t('ui.save') }}
          </UButton>
        </div>
      </template>

      <CoreEmptyState
        v-if="!rows.length"
        icon="i-ph-list-dashes"
        :title="t('pages.navigation.empty.title')"
        :description="t('pages.navigation.empty.description')"
      />

      <ul v-else class="divide-y divide-default" data-testid="nav-editor-list">
        <li
          v-for="(row, index) in rows"
          :key="row.id"
          class="flex items-center gap-3 py-2"
          :class="[dragIndex === index ? 'opacity-40' : '', row.hidden ? 'opacity-60' : '']"
          :data-nav-row="row.id"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent="onDragOver(index)"
          @dragend="onDragEnd"
        >
          <UIcon name="i-ph-dots-six-vertical" class="shrink-0 cursor-grab text-muted" />

          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <UInput
              v-model="row.label"
              size="sm"
              :maxlength="MAX_NAV_LABEL"
              :placeholder="row.fallbackLabel || t('pages.navigation.labelPlaceholder')"
              :aria-label="t('pages.navigation.labelAria')"
            />
            <span class="truncate text-xs text-muted">
              {{ row.to }}
              <template v-if="row.external"> · {{ t('pages.navigation.externalHint') }}</template>
              <template v-if="!row.available"> · {{ t('pages.navigation.unavailable') }}</template>
            </span>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <UButton
              :icon="row.hidden ? 'i-ph-eye-slash' : 'i-ph-eye'"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="row.hidden ? t('pages.navigation.show') : t('pages.navigation.hide')"
              :data-nav-toggle="row.id"
              @click="row.hidden = !row.hidden"
            />
            <UButton
              icon="i-ph-arrow-up"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="index === 0"
              :aria-label="t('pages.navigation.moveUp')"
              @click="move(index, -1)"
            />
            <UButton
              icon="i-ph-arrow-down"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="index === rows.length - 1"
              :aria-label="t('pages.navigation.moveDown')"
              @click="move(index, 1)"
            />
            <UButton
              v-if="row.custom"
              icon="i-ph-trash"
              color="error"
              variant="ghost"
              size="xs"
              :aria-label="t('pages.navigation.link.remove')"
              @click="removeRow(index)"
            />
          </div>
        </li>
      </ul>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <UButton
            icon="i-ph-plus"
            color="neutral"
            variant="subtle"
            data-testid="nav-add-link"
            @click="adding = !adding"
          >
            {{ t('pages.navigation.link.add') }}
          </UButton>
          <UButton color="neutral" variant="ghost" size="sm" @click="resetAll">
            {{ t('pages.navigation.reset') }}
          </UButton>
        </div>

        <div v-if="adding" class="mt-4 space-y-3 rounded-lg bg-elevated/50 p-3">
          <URadioGroup
            v-model="newKind"
            orientation="horizontal"
            :items="[
              { label: t('pages.navigation.link.kindPage'), value: 'page' },
              { label: t('pages.navigation.link.kindExternal'), value: 'external' },
            ]"
          />
          <UInput
            v-model="newLabel"
            :maxlength="MAX_NAV_LABEL"
            :placeholder="t('pages.navigation.link.labelPlaceholder')"
            :aria-label="t('pages.navigation.link.labelAria')"
            class="w-full"
          />
          <USelectMenu
            v-if="newKind === 'page'"
            v-model="newPage"
            value-key="value"
            :items="linkablePages"
            class="w-full"
          />
          <UInput
            v-else
            v-model="newUrl"
            type="url"
            placeholder="https://"
            :aria-label="t('pages.navigation.link.urlAria')"
            class="w-full"
          />
          <p v-if="newKind === 'external' && newUrl && !newTargetValid" class="text-xs text-error">
            {{ t('pages.navigation.validation.externalInvalid') }}
          </p>
          <UButton :disabled="!canAdd" size="sm" @click="addLink">
            {{ t('pages.navigation.link.confirm') }}
          </UButton>
        </div>
      </template>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ t('pages.navigation.preview.title') }}</h2>
        <p class="mt-1 text-sm text-muted">{{ t('pages.navigation.preview.description') }}</p>
      </template>
      <div class="flex flex-wrap items-center gap-4 text-sm" data-testid="nav-preview">
        <span v-if="!preview.length" class="text-muted">{{ t('pages.navigation.preview.emptyMenu') }}</span>
        <span v-for="item in preview" :key="item.id" class="flex items-center gap-1 text-muted">
          {{ item.label }}
          <UIcon v-if="item.external" name="i-ph-arrow-square-out" class="size-3" />
        </span>
      </div>
    </UCard>
  </div>
</template>
