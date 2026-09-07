<script setup lang="ts">
import type { BwTocLink } from '../../../components/BwReadingToc.vue'
import { buildBrandFoundation } from '../../../../shared/brandFoundation'
import type { BrandShareViewResponse } from '../../../../shared/types/brand'

/**
 * DIE ÖFFENTLICHE LESEANSICHT — was der zweite Leser sieht (Konzept
 * docs/plans/BRAND-FOUNDATION-LESEANSICHT.md §2.6 „Öffentliche Ansicht",
 * Paket G3; Form abgenommen am Klickdummy `/brand/demo/share`).
 *
 * ── DERSELBE RENDERER, DERSELBE BAUSTEIN ─────────────────────────────────
 * `buildBrandFoundation` bekommt hier den eingefrorenen Snapshot statt der
 * Live-Werte — er ist WÖRTLICH die Eingabeform der Regel (Kopf von
 * `shared/brandFoundation.ts`), also gibt es keine Umformung und keinen
 * zweiten Weg. Ein Unterschied zwischen privat und geteilt ist damit ein
 * Testfall und kein Zufall (§2.1).
 *
 * ── KEIN LAYOUT, WEIL DIE APP EINES HAT ──────────────────────────────────
 * `layout: false` statt `default`: das Default-Layout von branding.supply
 * trägt `BwSiteNav` und `BwSiteFooter` — eine Produkt-Navigation über einem
 * fremden Markenhandbuch. §2.6 will einen SCHLANKEN Kopf: Titel, Marke,
 * Stand, ein Druck-Knopf. Der Rahmen steht deshalb hier, wie im Dummy; der
 * einzige Marketing-Zug ist der Fuß.
 *
 * ── WAS DIESE SEITE NICHT HAT (und warum) ────────────────────────────────
 * Keinen Zähler (der Empfänger will wissen, WAS gilt, nicht wie weit die
 * Abnahme ist), keinen Vermerk „noch nicht abgenommen" (im Snapshot steht
 * ohnehin nur Bestätigtes), keinen Preisanker an der Schranke — sie schrumpft
 * auf EINEN Satz (`variant="share"` im Renderer). Und kein „Auf einer Seite":
 * der Schnellzugriff ist eine Arbeitshilfe des Besitzers.
 *
 * ── UNBEKANNT, WIDERRUFEN, ABGELAUFEN ⇒ DIESELBE 404 ─────────────────────
 * Die Route unterscheidet die drei bewusst nicht (ihr Kopf sagt warum), und
 * die Seite hebt den Unterschied nicht wieder auf: sie wirft die normale
 * Fehlerseite der App. Ein eigener Text „dieser Link ist abgelaufen" verriete,
 * dass es ihn gab.
 *
 * ── DIE KÖPFE STEHEN NICHT HIER ──────────────────────────────────────────
 * `noindex` steht als META hier UND als `X-Robots-Tag` an der Antwort
 * (`server/middleware/10.brand-share-headers.ts`), weil ein Crawler mal das
 * eine und mal das andere liest. `frame-ancestors 'none'` kommt aus der
 * Registry des Core (`server/plugins/share-frame.ts`) — eine Seite kann sich
 * diesen einen Kopf nicht selbst setzen, der `render:response`-Hook
 * überschriebe ihn (§2.8).
 *
 * DER TOKEN bleibt im Pfad: keine Query, kein Log, keine Analytics-Marke.
 * `Referrer-Policy: no-referrer` sorgt dafür, dass ihn auch kein Klick auf
 * einen Link im Dokument weiterträgt. (Im Kopf steht er trotzdem: `canonical`
 * und `og:url` tragen die Adresse, unter der die Seite abgerufen wurde — das
 * ist genau der Link, den der Empfänger ohnehin hat, und ohne ihn gäbe es
 * keine Messenger-Vorschau.)
 *
 * ROUTEN-VORRANG: `/brand/share/:token` steht neben `/brand/:profileId/:stepKey`.
 * Der statische Abschnitt gewinnt (Vue-Router-Ordnung) — ein Branding mit der
 * Id `share` gäbe es ohnehin nicht, Appwrite vergibt sie.
 */
definePageMeta({ layout: false })

const route = useRoute()
const { t, locale } = useI18n()

const token = computed(() => String(route.params.token ?? ''))

const { data, error } = await useFetch<BrandShareViewResponse>(
  () => `/api/brand/share/${encodeURIComponent(token.value)}`,
  { key: 'brand-share', watch: [token] },
)

if (error.value || !data.value) {
  throw createError({ status: 404, statusText: 'Not Found', fatal: true })
}

const snapshot = computed(() => data.value?.snapshot ?? null)
const title = computed(() => snapshot.value?.title ?? '')
const stand = computed(() => {
  const value = Date.parse(data.value?.publishedAt ?? '')
  return Number.isFinite(value)
    ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(value)
    : ''
})

const chapters = computed(() => {
  const source = snapshot.value
  if (!source) return []
  return buildBrandFoundation({
    title: source.title,
    contentLocale: source.contentLocale,
    story: source.story,
    chapters: source.chapters,
  }).chapters
})

const tocLinks = computed<BwTocLink[]>(() => chapters.value.map((chapter, index) => ({
  id: chapter.anchor,
  text: t(chapter.titleKey),
  // Der Snapshot kennt nur Bestätigtes — `pending` kann es hier nicht geben.
  state: chapter.state === 'locked' ? 'locked' : 'done',
  counter: String(index).padStart(2, '0'),
})))

/**
 * DIE MESSENGER-VORSCHAU (§2.6): `og:title`/`og:description` trotz `noindex`
 * — ein geteilter Link wird verschickt, und eine nackte Adresse in einem Chat
 * sieht aus wie Spam. Die Beschreibung ist der ERSTE Satz der Story; fehlt
 * sie, der erste Leitsatz des Dokuments. Erfunden wird nichts: ohne beides
 * bleibt sie leer.
 */
const ogDescription = computed(() => {
  const story = (snapshot.value?.story ?? '').trim()
  const source = story || firstLead()
  if (!source) return ''
  const sentence = source.split(/(?<=[.!?])\s/)[0] ?? source
  return sentence.length > 200 ? `${sentence.slice(0, 197)}…` : sentence
})

function firstLead(): string {
  for (const chapter of chapters.value) {
    for (const block of chapter.blocks) if (block.kind === 'lead') return block.text
  }
  return ''
}

const pageTitle = computed(() => t('brand.foundation.share.seoTitle', { brand: title.value }))

useSeoMeta({
  title: () => pageTitle.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => ogDescription.value,
  robots: 'noindex, nofollow',
})

function print(): void {
  if (import.meta.client) window.print()
}
</script>

<template>
  <div class="bw-root fd-share min-h-dvh px-6 pb-16" style="--ui-header-height: 0px">
    <div class="mx-auto max-w-5xl">
      <!-- Schlanker Kopf statt Seiten-Navigation: der Empfänger hat hier
           nichts zu bedienen ausser dem Druck. -->
      <header
        class="fd-share-head flex flex-wrap items-end justify-between gap-4 border-b py-8"
        style="border-color: var(--bw-line)"
      >
        <div class="min-w-0">
          <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">
            {{ t('brand.foundation.title') }}
          </p>
          <h1 class="mt-1 text-3xl font-extralight leading-tight tracking-tight">{{ title }}</h1>
          <p v-if="stand" class="bw-label mt-2" style="color: var(--bw-muted)">
            {{ t('brand.foundation.share.stand', { date: stand }) }}
          </p>
        </div>
        <UButton
          class="fd-noprint rounded-full" color="neutral" variant="outline" icon="i-ph-printer"
          :label="t('brand.foundation.share.print')" style="background: var(--bw-surface-hi)"
          @click="print"
        />
      </header>

      <!-- 7 + 3 Spalten statt 8 + 2: bei zwei Spalten kürzt das Verzeichnis
           lange Kapitelnamen ab (im Dummy am Screenshot gemessen). -->
      <UPage :ui="{ root: 'lg:gap-12', center: 'lg:col-span-7 min-w-0', right: 'lg:col-span-3' }">
        <div class="mt-10 flex flex-col gap-10">
          <BwFoundationChapter
            v-for="(chapter, index) in chapters" :key="chapter.id"
            :chapter="chapter" :index="index" variant="share"
          />
        </div>
        <template #right>
          <UPageAside class="fd-noprint" :ui="{ root: 'py-10 lg:pe-0' }">
            <BwReadingToc :links="tocLinks" :title="t('brand.foundation.toc')" />
          </UPageAside>
        </template>
      </UPage>

      <!-- Der einzige Marketing-Zug, dezent (§2.6). -->
      <footer class="fd-noprint mt-14 border-t pt-6" style="border-color: var(--bw-line)">
        <p class="bw-label" style="color: var(--bw-muted)">
          {{ t('brand.foundation.share.madeWith') }}
          <NuxtLink to="/" class="underline" style="color: var(--bw-ink-soft)">
            {{ t('brand.foundation.share.product') }}
          </NuxtLink>
        </p>
      </footer>
    </div>
  </div>
</template>

<style>
/* Druck der Empfänger-Ansicht: dieselbe Regel wie privat — keine Knöpfe,
 * volle Lesebreite. Der Kopf mit Marke und Stand bleibt stehen. Hier gibt es
 * KEINE 100dvh-Falle wie im Workspace-Layout (G2): die Seite trägt ihr Layout
 * selbst und scrollt mit dem Fenster. */
@media print {
  .fd-share .fd-noprint { display: none !important; }
  .fd-share { padding: 0 !important; }
}
</style>
