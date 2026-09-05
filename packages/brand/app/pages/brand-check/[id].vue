<script setup lang="ts">
import type { BrandCheckResult, BrandCheckCategoryResult, BrandCheckCriterionResult } from '../../../shared/types/brand'

/**
 * DIE ERGEBNISSEITE DES BRAND-CHECKS — `/brand-check/<id>`
 * (Konzept: docs/archiv/BRAND-CHECK.md §4, Hybrid-Entscheidung §7).
 *
 * Aufbau von oben nach unten: Score-Kopf · acht Kategorien · die drei
 * wichtigsten Befunde · der Weg weiter · alle 40 Kriterien zum Aufklappen.
 * Sie RECHNET nichts — Score, Bänder, Punkte und die Auswahl der drei Befunde
 * kommen fertig vom Server; hier steht die Darstellung und sonst nichts.
 *
 * ── ÖFFENTLICH UND TEILBAR, ABER NICHT INDIZIERT ──────────────────────────
 * Kein Auth-Guard: der Check läuft ohne Konto, und ein Link, den man nicht
 * weiterschicken kann, ist kein Ergebnis. Deshalb SSR (der geteilte Link zeigt
 * sofort Inhalt) und `noindex, nofollow`: das Urteil über eine FREMDE Website
 * gehört nicht in eine Suchmaschine, solange die Badge-Frage offen ist (§6).
 *
 * ── DAS DATUM RECHNET IN UTC ──────────────────────────────────────────────
 * Server und Browser stehen in verschiedenen Zeitzonen; ohne feste Zone
 * lieferte dieselbe Zeichenkette zweimal ein anderes Ergebnis und die
 * Hydration bräche. Das Datum ist tagesgenau — die Zone ist hier kein Verlust.
 *
 * ── DER REPORT IST EHRLICH EIN VORAB-EINTRAG ──────────────────────────────
 * Die Details stehen unten auf der Seite (Hybrid: sichtbar, aber zugeklappt).
 * Der REPORT als Dokument kommt in Phase 2 — das Formular sagt genau das und
 * trägt `source: 'brand-check'` samt der geprüften Adresse.
 */
definePageMeta({ layout: 'default' })

const { t, te, locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const request = useRequestFetch()
const toast = useToast()
const { isLoggedIn } = useCurrentUser()

const id = computed(() => String(route.params.id ?? ''))

/**
 * Ein 404 ist hier kein Fehler, sondern ein Zustand: ein alter oder ein
 * getippter Link. `null` heisst „gibt es nicht (mehr)", die Seite zeigt dann
 * ihre ruhige Leerseite statt einer roten Fehlermeldung.
 */
const { data: result, status: loadStatus } = await useAsyncData<BrandCheckResult | null>(
  'brand-check',
  async () => {
    if (!id.value) return null
    try {
      return await request<BrandCheckResult>(`/api/brand/check/${encodeURIComponent(id.value)}`)
    }
    catch {
      return null
    }
  },
  { watch: [id] },
)

const host = computed(() => result.value?.host ?? '')

useSeoMeta({
  title: () => (host.value ? t('brand.check.result.seoTitle', { host: host.value }) : t('brand.check.result.seoTitleEmpty')),
  robots: 'noindex, nofollow',
})

const createdAt = computed(() => {
  const raw = result.value?.createdAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale.value === 'de' ? 'de-DE' : 'en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date)
})

/** Titel und nächster Schritt eines Kriteriums — mit Rückfall, falls der
 *  Katalog dem Server einmal voraus ist (ein roher Schlüssel im Text wäre
 *  schlimmer als ein neutraler Satz). */
function criterionTitle(criterionId: string): string {
  const key = `brand.check.criteria.${criterionId}.title`
  return te(key) ? t(key) : t('brand.check.result.criterionFallback')
}
function criterionNext(criterionId: string): string {
  const key = `brand.check.criteria.${criterionId}.next`
  return te(key) ? t(key) : t('brand.check.result.nextFallback')
}
function categoryLabel(key: string): string {
  const messageKey = `brand.check.categories.${key}`
  return te(messageKey) ? t(messageKey) : key
}

/** Der Balken einer Kategorie: erreichte Punkte am Gewicht gemessen. */
function categoryPercent(category: BrandCheckCategoryResult): number {
  if (category.weight <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((category.points / category.weight) * 100)))
}

/** Die Kriterien in der Reihenfolge ihrer Kategorien — die Liste unten liest
 *  sich damit wie der Katalog, nicht wie eine Datenbank-Antwort. */
const criteriaByCategory = computed<Array<{ category: BrandCheckCategoryResult, criteria: BrandCheckCriterionResult[] }>>(() => {
  const check = result.value
  if (!check) return []
  return check.categories.map(category => ({
    category,
    criteria: check.criteria.filter(criterion => criterion.category === category.key),
  }))
})

const detailsOpen = ref(false)

/** Eingeloggt in die Anlage mit vorgewähltem Pfad, sonst auf /invite —
 *  dieselbe Weiche wie auf der Startseite. */
const relaunchTarget = computed(() => (isLoggedIn.value
  ? localePath({ path: '/dashboard/brands/new', query: { path: 'relaunch' } })
  : localePath('/invite')))

async function copyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.add({ title: t('brand.check.result.copied'), duration: 2000 })
  }
  catch {
    toast.add({ title: t('brand.check.result.copyFailed'), duration: 2000, color: 'warning' })
  }
}
</script>

<template>
  <div class="pb-10">
    <div class="mx-auto mt-10 max-w-4xl">
      <!-- Die Reiter des Instruments: „Start" ist hier zugleich der Rückweg
           auf `/brand-check` (die Seite mit dem Formular). -->
      <div class="mb-8">
        <BwBrandCheckTabs current="start" />
      </div>

      <!-- Solange geladen wird, steht noch nichts fest — kein Urteil, keine
           Leermeldung, nur die Ansage, dass geholt wird. -->
      <div v-if="loadStatus === 'pending'" class="bw-card p-10 text-center" data-check-loading>
        <UIcon name="i-ph-circle-notch" class="mx-auto size-6 animate-spin" style="color: var(--bw-muted)" />
        <p class="mt-4 text-sm" style="color: var(--bw-ink-soft)">{{ t('brand.check.result.loading') }}</p>
      </div>

      <!-- Es gibt ihn nicht (mehr): ruhig, mit einem Weg zurück. -->
      <div v-else-if="!result" class="bw-card p-10 text-center" data-check-missing>
        <span class="mx-auto grid size-12 place-items-center rounded-full" style="background: var(--bw-surface-hi)">
          <UIcon name="i-ph-link-break" class="size-5" style="color: var(--bw-muted)" />
        </span>
        <h1 class="mt-6 text-balance text-3xl font-extralight tracking-tight">{{ t('brand.check.result.missingTitle') }}</h1>
        <p class="mx-auto mt-4 max-w-md text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.check.result.missingText') }}</p>
        <div class="mt-8">
          <!-- Zurück zum FORMULAR, nicht zur Startseite: dort steht der Check
               seit dem Teaser-Umbau nicht mehr (Plan §1). -->
          <UButton :label="t('brand.check.result.missingCta')" :to="localePath('/brand-check')" size="lg" color="neutral" class="rounded-full" />
        </div>
      </div>

      <template v-else>
        <!-- 1 · Score-Kopf -->
        <section class="bw-card p-10 sm:p-12" data-check-head>
          <div class="flex flex-wrap items-center gap-8">
            <BwScoreRing :value="result.score" :size="132" />
            <div class="min-w-0 flex-1">
              <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('brand.check.result.eyebrow') }}</p>
              <h1 class="mt-3 text-balance text-4xl font-extralight leading-tight tracking-tight sm:text-5xl">
                {{ t(`brand.check.bands.${result.band}`) }}
              </h1>
              <p class="bw-label mt-3 leading-relaxed" style="color: var(--bw-muted)">
                {{ t('brand.check.result.stand', { host: result.host, date: createdAt }) }}
              </p>
            </div>
          </div>
          <p class="mt-8 max-w-2xl text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.check.result.maturity') }}</p>
          <div class="mt-6">
            <UButton
              icon="i-ph-link-simple" size="sm" color="neutral" variant="ghost" class="rounded-full"
              :label="t('brand.check.result.copy')" data-check-copy @click="copyLink"
            />
          </div>
        </section>

        <!-- 2 · Die acht Kategorien -->
        <section class="bw-card mt-6 p-10 sm:p-12" data-check-categories>
          <h2 class="text-2xl font-extralight tracking-tight sm:text-3xl">{{ t('brand.check.result.categoriesTitle') }}</h2>
          <ul class="mt-8 space-y-5">
            <li v-for="category in result.categories" :key="category.key">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p class="font-medium tracking-tight">{{ categoryLabel(category.key) }}</p>
                <p class="bw-label" style="color: var(--bw-muted)">
                  {{ t('brand.check.result.points', { points: category.points, weight: category.weight }) }}
                </p>
              </div>
              <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full" style="background: var(--bw-line)">
                <div
                  class="h-full rounded-full"
                  :style="`inline-size: ${categoryPercent(category)}%; background: var(--bw-accent)`"
                />
              </div>
              <p v-if="category.locked" class="bw-label mt-2 flex items-center gap-1.5" style="color: var(--bw-muted)">
                <UIcon name="i-ph-lock-simple" class="size-3.5 flex-none" />
                {{ t('brand.check.result.locked') }}
              </p>
            </li>
          </ul>
        </section>

        <!-- 3 · Die drei wichtigsten Befunde -->
        <section v-if="result.findings.length" class="mt-6" data-check-findings>
          <h2 class="px-2 text-2xl font-extralight tracking-tight sm:text-3xl">{{ t('brand.check.result.findingsTitle') }}</h2>
          <p class="bw-label mt-2 px-2 leading-relaxed" style="color: var(--bw-muted)">{{ t('brand.check.result.findingsLead') }}</p>
          <div class="mt-6 grid gap-6 md:grid-cols-3">
            <article v-for="(finding, index) in result.findings" :key="finding.criterionId" class="bw-card p-8">
              <p class="bw-label" style="color: var(--bw-muted)">{{ index + 1 }}</p>
              <h3 class="mt-2 text-balance font-medium leading-snug tracking-tight">{{ criterionTitle(finding.criterionId) }}</h3>
              <blockquote
                v-if="finding.evidence"
                class="bw-frame mt-4 p-4 text-sm leading-relaxed"
                style="background: var(--bw-surface-hi); color: var(--bw-ink-soft)"
              >
                {{ finding.evidence }}
              </blockquote>
              <p class="bw-label mt-4" style="color: var(--bw-muted)">{{ t('brand.check.result.nextLabel') }}</p>
              <p class="mt-1.5 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ criterionNext(finding.criterionId) }}</p>
            </article>
          </div>
        </section>

        <!-- 4 · Der Weg weiter -->
        <section class="bw-card mt-6 grid items-start gap-10 p-10 sm:p-12 lg:grid-cols-2" data-check-next>
          <div class="min-w-0">
            <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.check.result.relaunchEyebrow') }}</p>
            <h2 class="mt-3 text-balance text-2xl font-extralight leading-snug tracking-tight sm:text-3xl">{{ t('brand.check.result.relaunchTitle') }}</h2>
            <p class="mt-4 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.check.result.relaunchBody') }}</p>
            <div class="mt-6">
              <UButton
                :label="t('brand.check.result.relaunchCta')" :to="relaunchTarget" size="lg"
                color="neutral" class="rounded-full" data-check-relaunch
              />
            </div>
          </div>
          <div class="min-w-0">
            <p class="bw-label" style="color: var(--bw-muted)">{{ t('brand.check.result.reportEyebrow') }}</p>
            <h2 class="mt-3 text-balance text-2xl font-extralight leading-snug tracking-tight sm:text-3xl">{{ t('brand.check.result.reportTitle') }}</h2>
            <p class="mt-4 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('brand.check.result.reportBody') }}</p>
            <div class="mt-6">
              <BwWaitlistForm source="brand-check" :website="result.url" />
            </div>
          </div>
        </section>

        <!-- 5 · Alle 40 Kriterien — sichtbar, aber zugeklappt (Hybrid §7) -->
        <section class="bw-card mt-6 p-10 sm:p-12" data-check-details>
          <button
            type="button" class="flex w-full items-center justify-between gap-4 text-left"
            :aria-expanded="detailsOpen" data-check-details-toggle
            @click="detailsOpen = !detailsOpen"
          >
            <span>
              <span class="block text-2xl font-extralight tracking-tight sm:text-3xl">{{ t('brand.check.result.allTitle') }}</span>
              <span class="bw-label mt-2 block" style="color: var(--bw-muted)">{{ t('brand.check.result.allLead') }}</span>
            </span>
            <UIcon
              :name="detailsOpen ? 'i-ph-caret-up' : 'i-ph-caret-down'"
              class="size-5 flex-none" style="color: var(--bw-muted)"
            />
          </button>

          <div v-if="detailsOpen" class="mt-8 space-y-8">
            <div v-for="group in criteriaByCategory" :key="group.category.key">
              <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ categoryLabel(group.category.key) }}</p>
              <ul class="mt-3 space-y-3">
                <li v-for="criterion in group.criteria" :key="criterion.id" class="bw-frame p-4" style="background: var(--bw-surface-hi)">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p class="text-sm font-medium tracking-tight">{{ criterionTitle(criterion.id) }}</p>
                    <p class="bw-label" style="color: var(--bw-muted)">
                      {{ criterion.score === null
                        ? t('brand.check.result.notAssessable')
                        : t('brand.check.result.criterionPoints', { score: criterion.score }) }}
                    </p>
                  </div>
                  <p v-if="criterion.evidence" class="bw-label mt-2 leading-relaxed" style="color: var(--bw-ink-soft)">{{ criterion.evidence }}</p>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
