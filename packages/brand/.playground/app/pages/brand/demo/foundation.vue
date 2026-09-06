<script setup lang="ts">
import type { BwRailLayer, BwRailStep } from '../../../../../app/components/BwProgressRail.vue'
import type { BwSidebarBrand } from '../../../../../app/components/BwWorkspaceSidebar.vue'
import { demoRail } from '../../../utils/demoRail'
import { demoDirectionChapter, demoFoundation } from '../../../utils/demoFoundation'

/**
 * KLICKDUMMY „BRAND FOUNDATION" — die PRIVATE Leseansicht (Konzept
 * docs/plans/BRAND-FOUNDATION-LESEANSICHT.md §2.11, Screens 1–4 und 6).
 *
 * Sie ist NICHT der Ersatz für `/brand/demo/ergebnis` (Iteration 2, bleibt als
 * Protokoll stehen), sondern die zweite Ansicht desselben Dokuments: „Euer
 * Branding" ist die Arbeitsansicht (abnehmen, prüfen, korrigieren), DIESE
 * Seite liest dieselben bestätigten Werte als GUIDELINES.
 *
 * Das Chrome kommt aus der ECHTEN Dokument-Seite
 * (`packages/brand/app/pages/brand/[profileId]/document.vue`): BwWorkspace
 * ohne Topbar, feste Nav-Breite, `BwWorkspaceSidebar` links, der STAND rechts.
 * Der Prototyp ist später die Komponenten-Vorlage — nichts wird zweimal gebaut.
 *
 * Screens auf dieser Seite:
 *   1  private Leseansicht (Inhaltsverzeichnis + gefüllte Kapitel)
 *   2  Kapitel „Persönlichkeit & Stimme" (Do & Don't) + „Regeln für KI-Texte"
 *   3a Kapitel „Visuelle Identität" als Schranke
 *   3b dasselbe MIT gewählter Richtung — `?richtung=warm`
 *   4  Share-Dialog (Knopf „Teilen")
 *   6  Druck-Vorschau (Knopf „Drucken / PDF" im Export-Menü)
 */

const route = useRoute()

/* Screen 3b: eine Richtung ist gewählt — Kapitel 10 zeigt sie STATT der
 * Schranke. Im Echtbetrieb hängt das an `result.direction` (G4). */
const directionChosen = computed(() => route.query.richtung === 'warm')

const chapters = computed(() => demoFoundation.chapters.map(chapter =>
  chapter.id === 'visuell' && directionChosen.value ? demoDirectionChapter : chapter))

/* DER EINZIGE ZÄHLER DER SEITE (§2.6) — und er zählt, was abnehmbar IST:
 * das gesperrte Kapitel gehört der Schranke, nicht der Abnahme. */
const counted = computed(() => chapters.value.filter(c => c.state !== 'locked'))
const acceptedCount = computed(() => counted.value.filter(c => c.state === 'done').length)
const acceptedPct = computed(() => Math.round((acceptedCount.value / counted.value.length) * 100))

/* Die Rail der Werkstatt, einmal umgestellt: die Foundation ist FERTIG, und
 * die vormals gesperrte `result`-Kachel ist jetzt der Einstieg in diese Seite
 * (Entscheidung §6 d). „Erreichbar" heisst für einen Ergebnis-Punkt `done` —
 * die Sidebar sperrt jeden anderen Zustand (BwWorkspaceSidebar.stepDisabled). */
const railLayers = computed<BwRailLayer[]>(() => demoRail.map((layer) => {
  if (layer.id !== 'foundation' || !layer.steps) return layer
  const steps: BwRailStep[] = layer.steps.map(step => step.kind === 'result'
    ? { ...step, label: 'Brand Foundation', state: 'done', to: '/brand/demo/foundation' }
    : { ...step, state: 'done', slots: undefined, minutes: undefined })
  return { ...layer, steps }
}))

const sidebarBrands: BwSidebarBrand[] = [
  { id: 'kailua', title: 'Kailua Coffee Co.', path: 'Neue Marke', flag: 'i-circle-flags-us', current: true },
  { id: 'schubert', title: 'Schubert UX Studio', path: 'Marken-Relaunch', flag: 'i-circle-flags-de', to: '/brand/demo/archetyp' },
]

const railCollapsed = ref(false)
const standCollapsed = ref(false)

function print(): void {
  if (import.meta.client) window.print()
}

/**
 * DAS EXPORT-MENÜ ZEIGT ALLE AUSGABEFORMEN DER SUITE (§2.6) — frei und
 * gesperrt nebeneinander, dieselbe Ehrlichkeit wie die visuelle Schranke.
 * Ein Menü, das nur „Drucken" kennt, verschweigt, was es noch gibt.
 */
interface FdExportItem {
  label: string
  icon?: string
  sub?: string
  locked?: boolean
  disabled?: boolean
  onSelect?: () => void
}
const exportItems: FdExportItem[][] = [
  [{ label: 'Drucken / PDF', icon: 'i-ph-printer', sub: 'Browser-Druck mit Print-Layout', onSelect: print }],
  [
    { label: 'brand.md · brand.json', icon: 'i-ph-brackets-curly', sub: 'Brand Context für KI-Agenten · Brand Book & Kit', locked: true, disabled: true },
    { label: 'Design-Tokens', icon: 'i-ph-palette', sub: 'CSS, Tailwind, JSON · Brand Book & Kit', locked: true, disabled: true },
    { label: 'Assets.zip', icon: 'i-ph-file-zip', sub: 'Logos, Vorlagen, Pressekit · Brand Book & Kit', locked: true, disabled: true },
  ],
]

/* Screen 4: der Share-Dialog. Er schaltet nur seinen Zustand um — kein
 * Backend, kein Token, kein Ablauf-Rechnen (das kann `share.post.ts` längst). */
const shareOpen = ref(false)
const shareLive = ref(false)
const shareUrl = 'https://branding.supply/brand/share/7f3a9c2e41b8'
const shareCopied = ref(false)

function copyShareUrl(): void {
  shareCopied.value = true
  window.setTimeout(() => { shareCopied.value = false }, 1600)
}

/* Das Inhaltsverzeichnis (UContentToc) ist der Baustein `FdToc` — geteilt mit
 * der Share-Seite; hier bekommt er nur seine Hülle (UPageAside, s. Template). */

useHead({ title: `Brand Foundation · ${demoFoundation.brand.title}` })
</script>

<template>
  <BwWorkspace
    class="fd-page"
    :progress-pct="acceptedPct"
    :content-locale="demoFoundation.brand.locale.toLowerCase()"
    :locale-in-topbar="false"
    :topbar="false"
    :rail-footer="false"
    rail-width="300px"
    :rail-collapsed="railCollapsed"
    :george-collapsed="standCollapsed"
    initial-mode="stage"
    style="--bw-rail-pad-x: 1rem; --bw-rail-pad-y: 0.75rem"
  >
    <template #rail>
      <BwWorkspaceSidebar
        :layers="railLayers"
        :brands="sidebarBrands"
        @select="() => {}"
        @select-brand="to => navigateTo(to)"
      />
    </template>

    <template #stage-bar>
      <div class="flex min-w-0 flex-1 items-center gap-1.5">
        <UButton
          size="sm" color="neutral" variant="ghost"
          icon="i-ph-sidebar-simple"
          :aria-label="railCollapsed ? 'Navigation einblenden' : 'Navigation ausblenden'"
          @click="railCollapsed = !railCollapsed"
        />
        <div class="min-w-0 leading-tight">
          <p class="bw-label uppercase tracking-wider" style="color: var(--bw-muted)">Brand Foundation</p>
          <p class="truncate font-semibold">{{ demoFoundation.brand.title }}</p>
        </div>

        <!-- KEIN „Bearbeiten" (§2.6): korrigiert wird in der Werkstatt. -->
        <div class="ml-auto flex flex-none items-center gap-1.5">
          <UButton
            size="sm" color="neutral" variant="ghost" icon="i-ph-share-network"
            label="Teilen" class="max-sm:hidden" @click="shareOpen = true"
          />
          <UDropdownMenu :items="exportItems" :content="{ align: 'end' }" :ui="{ content: 'bw-root bw-overlay w-72' }">
            <UButton size="sm" color="neutral" variant="ghost" icon="i-ph-export" label="Exportieren" class="max-sm:hidden" />
            <template #item="{ item }">
              <UIcon v-if="item.icon" :name="item.icon" class="size-4 flex-none" style="color: var(--bw-muted)" />
              <span class="min-w-0 flex-1 text-left leading-tight">
                <span class="block truncate">{{ item.label }}</span>
                <span v-if="item.sub" class="bw-label block truncate" style="color: var(--bw-muted)">{{ item.sub }}</span>
              </span>
              <UIcon v-if="item.locked" name="i-ph-lock-simple" class="size-4 flex-none" style="color: var(--bw-muted)" />
            </template>
          </UDropdownMenu>
          <UButton
            size="sm" color="neutral" variant="ghost" class="max-md:hidden"
            icon="i-ph-sidebar-simple" :ui="{ leadingIcon: '-scale-x-100' }"
            :aria-label="standCollapsed ? 'Inhalt einblenden' : 'Inhalt ausblenden'"
            @click="standCollapsed = !standCollapsed"
          />
        </div>
      </div>
    </template>

    <template #default>
      <!-- Lesebreite (§2.6): die Foundation ist zum LESEN gebaut. -->
      <div class="fd-read mx-auto flex max-w-3xl flex-col gap-10 pb-6">
        <!-- Nur im Druck: Kopfzeile mit Marke und Stand auf jeder Seite. -->
        <p class="fd-print-head bw-label">{{ demoFoundation.brand.title }} · Brand Foundation · Stand {{ demoFoundation.brand.standDate }}</p>

        <div>
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Brand Foundation</p>
          <h1 class="mt-1 text-4xl font-extralight leading-tight tracking-tight">{{ demoFoundation.brand.title }}</h1>
          <p class="bw-label mt-3" style="color: var(--bw-muted)">
            Stand {{ demoFoundation.brand.standDate }} · {{ acceptedCount }} von {{ counted.length }} Kapiteln abgenommen · Inhaltssprache {{ demoFoundation.brand.locale }}
          </p>
        </div>

        <!-- „AUF EINER SEITE" (§1.5, HubSpot-Muster): der Schnellzugriff über
             Kapitel 0 — kein eigenes Kapitel, nur vorhandene Felder. -->
        <div class="bw-card p-8">
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Auf einer Seite</p>
          <p class="mt-4 text-lg font-extralight leading-snug tracking-tight">{{ demoFoundation.onePage.purpose }}</p>
          <div class="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p class="bw-label" style="color: var(--bw-muted)">Werte</p>
              <ul class="mt-2 space-y-2">
                <li v-for="v in demoFoundation.onePage.values" :key="v.word">
                  <p class="text-sm font-medium">{{ v.word }}</p>
                  <p class="text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ v.line }}</p>
                </li>
              </ul>
            </div>
            <div class="space-y-4">
              <div>
                <p class="bw-label" style="color: var(--bw-muted)">Archetyp</p>
                <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ demoFoundation.onePage.archetype }}</p>
              </div>
              <div>
                <p class="bw-label" style="color: var(--bw-muted)">Tagline</p>
                <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ demoFoundation.onePage.tagline }}</p>
              </div>
              <div>
                <p class="bw-label" style="color: var(--bw-muted)">Zeile für die Wand</p>
                <p class="mt-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ demoFoundation.onePage.wallLine }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Die Kapitel — EIN Renderer für beide Ansichten (§2.1). -->
        <FdChapter
          v-for="(chapter, i) in chapters" :key="chapter.id"
          :chapter="chapter" :index="i" variant="private"
        />
      </div>
    </template>

    <!-- RECHTS: das Inhaltsverzeichnis mit Sprungmarken. Dieselbe Stelle, an
         der das Arbeits-Dokument den STAND zeigt — hier ist der Stand die
         Kapitel-Liste (Haken · Kreis · Schloss), unten der Zähler. -->
    <template #george>
      <div class="flex min-h-0 flex-1 flex-col">
        <!-- UPageAside ist im Vorbild ein sticky Seitenrand unter dem Header;
             hier lebt sie in der scrollenden Spalte des Workspace — deshalb
             `static` statt `sticky` und keine Header-Höhe. -->
        <UPageAside
          :ui="{
            root: 'block static min-h-0 flex-1 overflow-y-auto max-h-none px-6 py-4 lg:ps-6 lg:ms-0 lg:pe-6 lg:max-h-none lg:static',
            container: 'relative',
          }"
        >
          <FdToc :chapters="chapters" />
        </UPageAside>

        <div class="flex-none border-t px-6 pb-5" style="border-color: var(--bw-line)">
          <BwRailFooter
            :progress-pct="acceptedPct"
            progress-title="Kapitel"
            :progress-count="`${acceptedCount}/${counted.length}`"
          />
        </div>
      </div>
    </template>
  </BwWorkspace>

  <!-- SCREEN 4 — DER SHARE-DIALOG (§2.6). Er sagt VORHER, was der Empfänger
       sieht und was nicht: das ist der Grund, warum es ihn gibt. -->
  <UModal v-model:open="shareOpen">
    <template #content>
      <div class="bw-root relative max-h-[85vh] overflow-y-auto p-8" style="background: var(--bw-surface-hi)">
        <button
          class="absolute right-5 top-5 grid size-8 place-items-center rounded-full"
          aria-label="Schließen" @click="shareOpen = false"
        >
          <UIcon name="i-ph-x" class="size-4.5" style="color: var(--bw-ink-soft)" />
        </button>
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">Teilen</p>
        <h2 class="mt-1 text-[28px] font-extralight leading-tight tracking-tight">Brand Foundation teilen</h2>
        <p class="mt-3 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
          So sehen Empfänger das Dokument: eine Momentaufnahme des bestätigten Stands, lesbar über einen Link — ohne Konto, ohne Anmeldung.
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl px-5 py-4" style="background: var(--bw-surface)">
            <p class="bw-label" style="color: var(--bw-accent)">Wird sichtbar</p>
            <ul class="mt-2 space-y-1.5 text-sm" style="color: var(--bw-ink-soft)">
              <li>Brand Story</li>
              <li>Kapitel 01–09 in ihrer abgenommenen Fassung</li>
              <li>Stand-Datum der Momentaufnahme</li>
            </ul>
          </div>
          <div class="rounded-2xl px-5 py-4" style="background: var(--bw-surface)">
            <p class="bw-label" style="color: var(--bw-stale)">Bleibt drin</p>
            <ul class="mt-2 space-y-1.5 text-sm" style="color: var(--bw-ink-soft)">
              <li>Gespräche mit George</li>
              <li>Entwürfe und Rohantworten</li>
              <li>Wettbewerber und Beschwerden</li>
              <li>Zähler, Notizen, Befunde</li>
            </ul>
          </div>
        </div>

        <p class="bw-label mt-5" style="color: var(--bw-muted)">Läuft ab nach 30 Tagen · bis 5. Oktober 2026</p>

        <template v-if="shareLive">
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <p class="min-w-0 flex-1 truncate rounded-full px-4 py-2 text-sm" style="background: var(--bw-surface); color: var(--bw-ink-soft)">{{ shareUrl }}</p>
            <UButton
              :label="shareCopied ? 'Kopiert' : 'Kopieren'" :icon="shareCopied ? 'i-ph-check' : 'i-ph-copy'"
              color="neutral" variant="outline" class="rounded-full" style="background: var(--bw-surface-hi)"
              @click="copyShareUrl"
            />
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <UButton to="/brand/demo/share" label="Empfänger-Ansicht öffnen" trailing-icon="i-ph-arrow-up-right" class="rounded-full" />
            <UButton label="Widerrufen" color="neutral" variant="ghost" @click="shareLive = false" />
          </div>
          <p class="bw-pending mt-4">Ein neuer Link ersetzt den alten — der alte antwortet danach nicht mehr.</p>
        </template>
        <template v-else>
          <UButton class="mt-4 rounded-full" icon="i-ph-link" label="Link erzeugen" @click="shareLive = true" />
          <p class="bw-pending mt-4">Ein neuer Link ersetzt den alten — der alte antwortet danach nicht mehr.</p>
        </template>
      </div>
    </template>
  </UModal>
</template>

<style>
/* SCREEN 6 — DRUCK (§2.6). Nicht `scoped`: die Zonen der Werkstatt (Rail,
 * Balken, Stand-Spalte) sind fremde Komponenten, an die eine scoped Regel
 * nicht heranreicht. Die Klasse `.fd-page` am Werkstatt-Wurzelknoten hält
 * die Regeln trotzdem bei DIESER Seite. */
.fd-print-head { display: none; }
@media print {
  .fd-page header,
  .fd-page .bw-rail,
  .fd-page .bw-stage-bar,
  .fd-page .bw-george,
  .fd-page .bw-modeswitch { display: none !important; }
  .fd-page,
  .fd-page .bw-shell { display: block !important; height: auto !important; }
  .fd-page .bw-stage { overflow: visible !important; padding: 0 !important; }
  .fd-page .bw-stage-inner { max-width: none !important; }
  .fd-page .fd-read { max-width: none !important; }
  .fd-page .fd-print-head { display: block; }
  .fd-page .bw-card { box-shadow: none !important; background: transparent !important; border: 1px solid #ddd; border-radius: 8px; }
}
</style>
