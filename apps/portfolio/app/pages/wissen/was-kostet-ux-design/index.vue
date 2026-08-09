<script setup lang="ts">
import { CONTACT } from '../../../data/contact'
import type { Lang } from '../../../data/localized'
import {
  COST_FACTORS,
  KOSTEN_BFSG,
  KOSTEN_CTA,
  KOSTEN_FAQ_TITLE,
  KOSTEN_FAQS,
  KOSTEN_FACTORS_TITLE,
  KOSTEN_HERO,
  KOSTEN_META,
  KOSTEN_MODELS,
  KOSTEN_PROJECTS,
  KOSTEN_RATES,
  KOSTEN_ROI,
  KOSTEN_SOURCES,
  KOSTEN_SOURCES_TITLE,
  KOSTEN_TOC,
  PROJECT_ROWS,
  RATE_ROWS,
  ROI_STATS,
} from '../../../data/wissenKosten'
import { jsonLdScript } from '../../../utils/jsonLd'

definePageMeta({ layout: 'site' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

const lang = computed<Lang>(() => (locale.value.startsWith('de') ? 'de' : 'en'))

// Host+Port aus dem Request, SCHEMA aus der Env — dieselbe Rechnung, aus der
// `useLocaleSeoHead()` canonical/og:url baut (siehe useSiteOrigin). Roh aus
// `useRequestURL()` stünden hinter nginx `http`-Adressen im Graphen.
const origin = useSiteOrigin()
const homeUrl = computed(() => `${origin}${localePath('/')}`)
const knowledgeUrl = computed(() => `${origin}${localePath('/#wissen')}`)
const pageUrl = computed(() => `${origin}${localePath('/wissen/was-kostet-ux-design')}`)
const personId = `${origin}/#david-schubert`

const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': personId,
      'name': 'David Schubert',
      'jobTitle': 'Senior UI/UX Designer & Creative Technologist',
      'url': homeUrl.value,
      'sameAs': CONTACT.socialProfiles,
    },
    {
      '@type': 'Article',
      '@id': `${pageUrl.value}#article`,
      'headline': KOSTEN_META.headline[lang.value],
      'description': KOSTEN_META.description[lang.value],
      'url': pageUrl.value,
      'inLanguage': lang.value,
      'author': { '@id': personId },
      'publisher': { '@id': personId },
      'datePublished': CONTACT.lastUpdated,
      'dateModified': CONTACT.lastUpdated,
      'image': `${origin}/images/og-pukalani-studio.png`,
      'isPartOf': { '@id': `${origin}/#website` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl.value}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': t('portfolio.common.home'), 'item': homeUrl.value },
        { '@type': 'ListItem', 'position': 2, 'name': t('portfolio.common.knowledge'), 'item': knowledgeUrl.value },
        { '@type': 'ListItem', 'position': 3, 'name': KOSTEN_HERO.breadcrumb[lang.value], 'item': pageUrl.value },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${pageUrl.value}#faq`,
      'mainEntity': KOSTEN_FAQS.map(faq => ({
        '@type': 'Question',
        'name': faq.question[lang.value],
        'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer[lang.value] },
      })),
    },
  ],
}))

useHead(() => ({
  title: KOSTEN_META.title[lang.value],
  meta: [
    // `robots` steht EINMAL in der app.vue (ohne index,follow) — siehe dort.
    { name: 'author', content: 'David Schubert' },
  ],
  script: [jsonLdScript(jsonLd.value)],
}))

useSeoMeta({
  description: () => KOSTEN_META.description[lang.value],
  ogType: 'article',
  ogSiteName: 'Pukalani Studio',
  ogTitle: () => KOSTEN_META.title[lang.value],
  ogDescription: () => KOSTEN_META.description[lang.value],
  articlePublishedTime: CONTACT.lastUpdated,
  articleModifiedTime: CONTACT.lastUpdated,
  articleAuthor: ['David Schubert'],
  twitterTitle: () => KOSTEN_META.title[lang.value],
  twitterDescription: () => KOSTEN_META.description[lang.value],
})
</script>

<template>
  <article>
    <header class="page-head section--line">
      <div class="container container--narrow reveal">
        <nav :aria-label="t('portfolio.common.contents')">
          <ol class="breadcrumb">
            <li><NuxtLink :to="localePath('/')">{{ t('portfolio.common.home') }}</NuxtLink></li>
            <li aria-hidden="true">→</li>
            <li><NuxtLink :to="localePath('/#wissen')">{{ t('portfolio.common.knowledge') }}</NuxtLink></li>
            <li aria-hidden="true">→</li>
            <li aria-current="page">{{ KOSTEN_HERO.breadcrumb[lang] }}</li>
          </ol>
        </nav>
        <h1 class="page-head__title">{{ KOSTEN_HERO.title[lang] }}</h1>
        <p class="page-head__intro">{{ KOSTEN_HERO.intro[lang] }}</p>
        <div class="byline">
          <p>
            {{ KOSTEN_HERO.bylineLead[lang] }}
            <NuxtLink :to="localePath('/#ueber-mich')" class="link-accent">David Schubert</NuxtLink>
            {{ KOSTEN_HERO.bylineRole[lang] }}
          </p>
          <p>
            {{ t('portfolio.common.updatedAt') }}
            <time :datetime="CONTACT.lastUpdated">{{ CONTACT.lastUpdatedHuman[lang] }}</time>
            {{ KOSTEN_HERO.updatedNote[lang] }}
          </p>
        </div>
      </div>
    </header>

    <nav class="toc section--line" :aria-label="t('portfolio.common.contents')">
      <div class="container container--narrow">
        <p class="toc__label">{{ t('portfolio.common.contents') }}</p>
        <ol class="toc__list">
          <li v-for="item in KOSTEN_TOC" :key="item.href">
            <a :href="item.href" class="toc__link">{{ item.label[lang] }}</a>
          </li>
        </ol>
      </div>
    </nav>

    <div class="container container--narrow guide-body">
      <!-- STUNDENSÄTZE -->
      <section id="stundensaetze" aria-labelledby="stundensaetze-title" class="chapter">
        <h2 id="stundensaetze-title" class="section-title">{{ KOSTEN_RATES.title[lang] }}</h2>
        <div class="prose">
          <p>{{ KOSTEN_RATES.lead[lang] }}</p>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <caption>{{ KOSTEN_RATES.caption[lang] }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ KOSTEN_RATES.columns.metric[lang] }}</th>
                <th scope="col">{{ KOSTEN_RATES.columns.value[lang] }}</th>
                <th scope="col">{{ KOSTEN_RATES.columns.source[lang] }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in RATE_ROWS" :key="row.metric.en">
                <th scope="row">{{ row.metric[lang] }}</th>
                <td class="is-accent">{{ row.value[lang] }}</td>
                <td>
                  <a :href="row.sourceUrl" target="_blank" rel="noopener external" class="link-accent">{{ row.source }}</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="section-note">{{ KOSTEN_RATES.note[lang] }}</p>
      </section>

      <!-- PROJEKTPREISE -->
      <section id="projektpreise" aria-labelledby="projektpreise-title" class="chapter">
        <h2 id="projektpreise-title" class="section-title">{{ KOSTEN_PROJECTS.title[lang] }}</h2>
        <div class="prose">
          <p>{{ KOSTEN_PROJECTS.lead[lang] }}</p>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <caption>{{ KOSTEN_PROJECTS.caption[lang] }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ KOSTEN_PROJECTS.columns.project[lang] }}</th>
                <th scope="col">{{ KOSTEN_PROJECTS.columns.market[lang] }}</th>
                <th scope="col">{{ KOSTEN_PROJECTS.columns.mine[lang] }}</th>
                <th scope="col">{{ KOSTEN_PROJECTS.columns.duration[lang] }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in PROJECT_ROWS" :key="row.project.en">
                <th scope="row">{{ row.project[lang] }}</th>
                <td>{{ row.market[lang] }}</td>
                <td class="is-accent">{{ row.mine[lang] }}</td>
                <td>{{ row.duration[lang] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="prose">
          <p>{{ KOSTEN_PROJECTS.note[lang] }}</p>
        </div>
        <ul class="chips source-links">
          <li v-for="link in KOSTEN_PROJECTS.noteLinks" :key="link.href">
            <a :href="link.href" target="_blank" rel="noopener external" class="chip chip--accent">{{ link.label }}</a>
          </li>
        </ul>
      </section>

      <!-- KOSTENFAKTOREN -->
      <section id="faktoren" aria-labelledby="faktoren-title" class="chapter">
        <h2 id="faktoren-title" class="section-title">{{ KOSTEN_FACTORS_TITLE[lang] }}</h2>
        <ol class="steps">
          <li v-for="(factor, index) in COST_FACTORS" :key="factor.title.en" class="step">
            <span class="step__index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <h3 class="card__title">{{ factor.title[lang] }}</h3>
              <p class="card__text">{{ factor.description[lang] }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- ROI -->
      <section id="roi" aria-labelledby="roi-title" class="chapter">
        <h2 id="roi-title" class="section-title">{{ KOSTEN_ROI.title[lang] }}</h2>
        <div class="prose">
          <p>{{ KOSTEN_ROI.lead[lang] }}</p>
        </div>
        <ul class="stats">
          <li v-for="stat in ROI_STATS" :key="stat.sourceUrl" class="card">
            <p class="stats__claim">{{ stat.claim[lang] }}</p>
            <p class="card__text">
              {{ KOSTEN_ROI.sourceLabel[lang] }}
              <a :href="stat.sourceUrl" target="_blank" rel="noopener external" class="link-accent">{{ stat.source }}</a>
            </p>
          </li>
        </ul>
      </section>

      <!-- ABRECHNUNGSMODELLE -->
      <section id="modelle" aria-labelledby="modelle-title" class="chapter">
        <h2 id="modelle-title" class="section-title">{{ KOSTEN_MODELS.title[lang] }}</h2>
        <div class="prose">
          <p>{{ KOSTEN_MODELS.paragraph1[lang] }}</p>
          <p>
            {{ KOSTEN_MODELS.paragraph2Lead[lang] }}
            <NuxtLink :to="localePath('/wissen/freelancer-oder-agentur')" class="link-accent">
              {{ KOSTEN_MODELS.paragraph2Link[lang] }}
            </NuxtLink>.
          </p>
        </div>
      </section>

      <!-- BFSG -->
      <section id="bfsg" aria-labelledby="bfsg-title" class="chapter">
        <h2 id="bfsg-title" class="section-title">{{ KOSTEN_BFSG.title[lang] }}</h2>
        <div class="prose">
          <p>
            {{ KOSTEN_BFSG.paragraphLead[lang] }}
            <a :href="KOSTEN_BFSG.linkUrl" target="_blank" rel="noopener external" class="link-accent">
              {{ KOSTEN_BFSG.linkLabel[lang] }}
            </a>
            {{ KOSTEN_BFSG.paragraphRest[lang] }}
            <NuxtLink :to="localePath('/ux-audit')" class="link-accent">{{ KOSTEN_BFSG.auditLinkLabel[lang] }}</NuxtLink>
            {{ KOSTEN_BFSG.paragraphEnd[lang] }}
          </p>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" aria-labelledby="kosten-faq-title" class="chapter">
        <h2 id="kosten-faq-title" class="section-title">{{ KOSTEN_FAQ_TITLE[lang] }}</h2>
        <div class="faq faq--top">
          <details v-for="faq in KOSTEN_FAQS" :key="faq.question.en" class="faq__item">
            <summary>
              <span>{{ faq.question[lang] }}</span>
              <span class="faq__sign" aria-hidden="true">+</span>
            </summary>
            <p class="faq__answer">{{ faq.answer[lang] }}</p>
          </details>
        </div>
      </section>

      <!-- QUELLEN -->
      <section id="quellen" aria-labelledby="quellen-title" class="chapter">
        <h2 id="quellen-title" class="section-title">{{ KOSTEN_SOURCES_TITLE[lang] }}</h2>
        <ul class="sources">
          <li v-for="source in KOSTEN_SOURCES" :key="source.url">
            <a :href="source.url" target="_blank" rel="noopener external" class="link-accent">{{ source.label }}</a>
          </li>
        </ul>
      </section>
    </div>

    <CtaBand :title="KOSTEN_CTA.title[lang]" :text="KOSTEN_CTA.text[lang]" :lang="lang" />
  </article>
</template>

<style scoped>
.container--narrow {
  max-width: 52rem;
}
.page-head__title {
  margin-top: 1.6rem;
  font-size: clamp(1.9rem, 4.6vw, 3.4rem);
}
.page-head__intro {
  margin-top: 1.6rem;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.8vw, 1.15rem);
}
.byline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
  margin-top: 2rem;
  color: var(--metal);
  font-size: 0.82rem;
}

/* INHALTSVERZEICHNIS --------------------------------------------------- */
.toc {
  background: var(--bg-soft);
  padding-block: 1.6rem;
  border-bottom: 1px solid var(--line);
}
.toc__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--metal);
}
.toc__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem 1.5rem;
  margin-top: 0.8rem;
  list-style: none;
}
.toc__link {
  font-size: 0.88rem;
  color: var(--text-soft);
  transition: color 0.3s var(--ease);
}
.toc__link:hover {
  color: var(--accent);
}

/* KAPITEL -------------------------------------------------------------- */
.guide-body {
  padding-block: clamp(3rem, 7vw, 5rem);
}
.chapter + .chapter {
  margin-top: clamp(3rem, 7vw, 4.5rem);
}
.steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}
.step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.2rem;
  align-items: start;
}
.step__index {
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  color: var(--accent);
  padding-top: 0.15rem;
}
.stats {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}
.stats__claim {
  font-weight: 700;
  color: var(--text);
}
.sources {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.6rem;
  font-size: 0.88rem;
}
.source-links {
  margin-top: 1.2rem;
}
.faq--top {
  margin-top: 1.8rem;
}
@media (max-width: 680px) {
  .toc__list {
    grid-template-columns: 1fr;
  }
}
</style>
