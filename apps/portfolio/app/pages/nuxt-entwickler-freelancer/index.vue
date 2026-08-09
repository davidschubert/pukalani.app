<script setup lang="ts">
import { CONTACT } from '../../data/contact'
import type { Lang } from '../../data/localized'
import {
  NUXT_BENEFITS,
  NUXT_CTA,
  NUXT_FAQ_HEADING,
  NUXT_FAQS,
  NUXT_HERO,
  NUXT_HERO_STACK,
  NUXT_META,
  NUXT_SERVICES,
  NUXT_SERVICES_HEADING,
  NUXT_STACK_DETAIL,
  NUXT_STACK_HEADING,
  NUXT_WHY_HEADING,
} from '../../data/nuxtFreelancer'
import { jsonLdScript } from '../../utils/jsonLd'

definePageMeta({ layout: 'site' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

const lang = computed<Lang>(() => (locale.value.startsWith('de') ? 'de' : 'en'))

// Host+Port aus dem Request, SCHEMA aus der Env — dieselbe Rechnung, aus der
// `useLocaleSeoHead()` canonical/og:url baut (siehe useSiteOrigin). Roh aus
// `useRequestURL()` stünden hinter nginx `http`-Adressen im Graphen.
const origin = useSiteOrigin()
const homeUrl = computed(() => `${origin}${localePath('/')}`)
const pageUrl = computed(() => `${origin}${localePath('/nuxt-entwickler-freelancer')}`)
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
      'knowsAbout': ['Nuxt', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Appwrite', 'UI/UX Design'],
      'sameAs': CONTACT.socialProfiles,
    },
    {
      '@type': 'Service',
      '@id': `${pageUrl.value}#service`,
      'name': NUXT_META.serviceName[lang.value],
      'serviceType': NUXT_META.serviceType[lang.value],
      'description': NUXT_META.serviceDescription[lang.value],
      'url': pageUrl.value,
      'provider': { '@id': personId },
      'areaServed': [
        { '@type': 'Country', 'name': 'Deutschland' },
        { '@type': 'Country', 'name': 'Österreich' },
        { '@type': 'Country', 'name': 'Schweiz' },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl.value}#webpage`,
      'url': pageUrl.value,
      'name': NUXT_META.title[lang.value],
      'description': NUXT_META.description[lang.value],
      'inLanguage': lang.value,
      'dateModified': CONTACT.lastUpdated,
      'isPartOf': { '@id': `${origin}/#website` },
      'breadcrumb': { '@id': `${pageUrl.value}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl.value}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': t('portfolio.common.home'), 'item': homeUrl.value },
        { '@type': 'ListItem', 'position': 2, 'name': NUXT_HERO.breadcrumb[lang.value], 'item': pageUrl.value },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${pageUrl.value}#faq`,
      'mainEntity': NUXT_FAQS.map(faq => ({
        '@type': 'Question',
        'name': faq.question[lang.value],
        'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer[lang.value] },
      })),
    },
  ],
}))

useHead(() => ({
  title: NUXT_META.title[lang.value],
  meta: [
    // `robots` steht EINMAL in der app.vue (ohne index,follow) — siehe dort.
    { name: 'author', content: 'David Schubert' },
  ],
  script: [jsonLdScript(jsonLd.value)],
}))

useSeoMeta({
  description: () => NUXT_META.description[lang.value],
  ogType: 'website',
  ogSiteName: 'Pukalani Studio',
  ogTitle: () => NUXT_META.title[lang.value],
  ogDescription: () => NUXT_META.description[lang.value],
  twitterTitle: () => NUXT_META.title[lang.value],
  twitterDescription: () => NUXT_META.description[lang.value],
})
</script>

<template>
  <div>
    <header class="page-head">
      <div class="container reveal">
        <nav :aria-label="t('portfolio.common.contents')">
          <ol class="breadcrumb">
            <li><NuxtLink :to="localePath('/')">{{ t('portfolio.common.home') }}</NuxtLink></li>
            <li aria-hidden="true">→</li>
            <li aria-current="page">{{ NUXT_HERO.breadcrumb[lang] }}</li>
          </ol>
        </nav>
        <h1 class="page-head__title">{{ NUXT_HERO.title[lang] }}</h1>
        <p id="nuxt-answer" class="page-head__intro">{{ NUXT_HERO.intro[lang] }}</p>
        <ul class="chips head__stack" aria-label="Stack">
          <li v-for="tech in NUXT_HERO_STACK" :key="tech" class="chip">{{ tech }}</li>
        </ul>
        <div class="page-head__actions">
          <a :href="CONTACT.calLink" target="_blank" rel="noopener nofollow" class="btn btn--solid">
            {{ NUXT_HERO.ctaPrimary[lang] }} →
          </a>
          <NuxtLink :to="localePath('/nuxt-entwickler-freelancer#leistungen')" class="btn">
            {{ NUXT_HERO.ctaSecondary[lang] }}
          </NuxtLink>
        </div>
        <p class="section-note">
          {{ t('portfolio.common.state') }} {{ CONTACT.lastUpdatedHuman[lang] }} · {{ NUXT_HERO.note[lang] }}
        </p>
        <p class="note head__note">
          {{ NUXT_HERO.audienceNote[lang] }}
          <NuxtLink :to="localePath('/')" class="link-accent">{{ NUXT_HERO.audienceNoteLink[lang] }}</NuxtLink>.
        </p>
      </div>
    </header>

    <section class="section section--soft section--line" aria-labelledby="warum-nuxt-title">
      <div class="container">
        <h2 id="warum-nuxt-title" class="section-title">{{ NUXT_WHY_HEADING.title[lang] }}</h2>
        <p class="section-lead">{{ NUXT_WHY_HEADING.lead[lang] }}</p>
        <div class="grid-3">
          <div v-for="benefit in NUXT_BENEFITS" :key="benefit.title.en" class="card">
            <h3 class="card__title">{{ benefit.title[lang] }}</h3>
            <p class="card__text">{{ benefit.description[lang] }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="leistungen" class="section section--line" aria-labelledby="nuxt-leistungen-title">
      <div class="container container--narrow">
        <h2 id="nuxt-leistungen-title" class="section-title">{{ NUXT_SERVICES_HEADING.title[lang] }}</h2>
        <p class="section-lead">{{ NUXT_SERVICES_HEADING.lead[lang] }}</p>
        <div class="services">
          <article v-for="service in NUXT_SERVICES" :key="service.title.en" class="card">
            <div class="service__head">
              <h3 class="card__title">{{ service.title[lang] }}</h3>
              <p class="service__price">{{ service.price[lang] }}</p>
            </div>
            <p class="card__text">{{ service.description[lang] }}</p>
            <ul class="chips service__tags">
              <li v-for="tag in service.tags" :key="tag" class="chip">{{ tag }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <section class="section section--soft section--line" aria-labelledby="stack-title">
      <div class="container container--narrow">
        <h2 id="stack-title" class="section-title">{{ NUXT_STACK_HEADING.title[lang] }}</h2>
        <p class="section-lead">{{ NUXT_STACK_HEADING.lead[lang] }}</p>
        <dl class="stack">
          <div v-for="item in NUXT_STACK_DETAIL" :key="item.label.en">
            <dt class="stack__label">{{ item.label[lang] }}</dt>
            <dd class="stack__value">{{ item.value[lang] }}</dd>
          </div>
        </dl>
        <p class="note stack__note">
          <strong>{{ NUXT_STACK_HEADING.noteLabel[lang] }}</strong> {{ NUXT_STACK_HEADING.note[lang] }}
        </p>
      </div>
    </section>

    <section id="faq" class="section section--line" aria-labelledby="nuxt-faq-title">
      <div class="container container--narrow">
        <h2 id="nuxt-faq-title" class="section-title">{{ NUXT_FAQ_HEADING[lang] }}</h2>
        <div class="faq faq--top">
          <details v-for="faq in NUXT_FAQS" :key="faq.question.en" class="faq__item">
            <summary>
              <span>{{ faq.question[lang] }}</span>
              <span class="faq__sign" aria-hidden="true">+</span>
            </summary>
            <p class="faq__answer">{{ faq.answer[lang] }}</p>
          </details>
        </div>
      </div>
    </section>

    <CtaBand :title="NUXT_CTA.title[lang]" :text="NUXT_CTA.text[lang]" :lang="lang" />
  </div>
</template>

<style scoped>
.page-head__title {
  margin-top: 1.6rem;
  font-size: clamp(2rem, 5.2vw, 4rem);
  max-width: 20ch;
}
.page-head__intro {
  margin-top: 1.6rem;
  max-width: 66ch;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.8vw, 1.15rem);
}
.head__stack {
  margin-top: 1.8rem;
}
.page-head__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 2.2rem;
}
.head__note {
  margin-top: 1.8rem;
  max-width: 70ch;
}
.container--narrow {
  max-width: 62rem;
}
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
  margin-top: clamp(2rem, 4vw, 3rem);
}
.services {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-top: clamp(2rem, 4vw, 3rem);
}
.service__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.8rem;
}
.service__price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent);
}
.service__tags {
  margin-top: 1.1rem;
}
.stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.6rem clamp(1.5rem, 3vw, 2.5rem);
  margin-top: clamp(2rem, 4vw, 3rem);
}
.stack__label {
  font-weight: 800;
  font-size: 0.95rem;
}
.stack__value {
  margin-top: 0.5rem;
  color: var(--text-soft);
  font-size: 0.92rem;
}
.stack__note {
  margin-top: 2.2rem;
}
.faq--top {
  margin-top: 2rem;
}
@media (max-width: 960px) {
  .grid-3 {
    grid-template-columns: 1fr;
  }
  .stack {
    grid-template-columns: 1fr;
  }
}
</style>
