<script setup lang="ts">
import type { PublicPageNavItem } from '../../../../packages/pages/shared/types/page'
import { CONTACT } from '../data/contact'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

/**
 * Rechtsseiten aus dem pages-CMS (Muster blueprint-Layout): nur VERÖFFENT-
 * LICHTES erscheint — ein Entwurf im Dashboard erzeugt keinen toten Link.
 * useRequestFetch, damit SSR den Host-Header weiterreicht; fail-soft auf [].
 */
const LEGAL_SLUGS = ['imprint', 'impressum', 'privacy', 'datenschutz', 'terms', 'agb']
const requestFetch = useRequestFetch()
const { data: publicPages } = await useAsyncData(
  () => `footer-legal-pages-${locale.value}`,
  () => requestFetch<PublicPageNavItem[]>('/api/pages/public', { query: { locale: locale.value } })
    .catch(() => [] as PublicPageNavItem[]),
  { watch: [locale] },
)
const legalPages = computed(() => (publicPages.value ?? []).filter(page => LEGAL_SLUGS.includes(page.slug)))

const isGerman = computed(() => locale.value.startsWith('de'))
const lang = computed<'de' | 'en'>(() => (isGerman.value ? 'de' : 'en'))

/** Sprachwechsel: Ziel ist immer die ANDERE Sprache derselben Seite. */
const otherLocale = computed(() => (isGerman.value ? 'en' : 'de'))
const otherLocaleLabel = computed(() =>
  isGerman.value ? t('portfolio.footer.langEn') : t('portfolio.footer.langDe'),
)

const serviceLinks = computed(() => [
  { to: '/#brand-design', label: t('portfolio.footer.links.brand') },
  { to: '/ux-audit', label: t('portfolio.footer.links.audit') },
  { to: '/#corporate-website', label: t('portfolio.footer.links.website') },
  { to: '/#saas-design', label: t('portfolio.footer.links.product') },
  { to: '/#content-produktion', label: t('portfolio.footer.links.content') },
  { to: '/nuxt-entwickler-freelancer', label: t('portfolio.footer.links.development') },
])

const knowledgeLinks = computed(() => [
  { to: '/wissen/was-kostet-ux-design', label: t('portfolio.footer.links.costs') },
  { to: '/wissen/freelancer-oder-agentur', label: t('portfolio.footer.links.comparison') },
  { to: '/#faq', label: t('portfolio.nav.faq') },
])
</script>

<template>
  <footer class="footer">
    <div class="container footer__grid">
      <div class="footer__brandcol">
        <p class="footer__brand">Pukalani Studio</p>
        <p class="footer__about">{{ t('portfolio.footer.about') }}</p>
        <p class="footer__available">
          <span class="footer__dot" aria-hidden="true" />
          {{ t('portfolio.footer.available') }}
        </p>
        <ul class="footer__social" :aria-label="t('portfolio.footer.profiles')">
          <li><a href="https://www.linkedin.com/in/davidschubert-uiux/" target="_blank" rel="noopener me" class="footer__link">LinkedIn</a></li>
          <li><a href="https://github.com/davidschubert" target="_blank" rel="noopener me" class="footer__link">GitHub</a></li>
          <li><a href="https://www.instagram.com/davidschubert/" target="_blank" rel="noopener me" class="footer__link">Instagram</a></li>
        </ul>
      </div>

      <nav :aria-label="t('portfolio.footer.services')">
        <p class="footer__heading">{{ t('portfolio.footer.services') }}</p>
        <ul class="footer__list">
          <li v-for="link in serviceLinks" :key="link.to">
            <NuxtLink :to="localePath(link.to)" class="footer__link">{{ link.label }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <nav :aria-label="t('portfolio.footer.knowledge')">
        <p class="footer__heading">{{ t('portfolio.footer.knowledge') }}</p>
        <ul class="footer__list">
          <li v-for="link in knowledgeLinks" :key="link.to">
            <NuxtLink :to="localePath(link.to)" class="footer__link">{{ link.label }}</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="switchLocalePath(otherLocale)" class="footer__link">{{ otherLocaleLabel }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <address class="footer__contact" :aria-label="t('portfolio.footer.contact')">
        <p class="footer__heading">{{ t('portfolio.footer.contact') }}</p>
        <ul class="footer__list">
          <li><a :href="`mailto:${CONTACT.email}`" class="footer__link">{{ CONTACT.email }}</a></li>
          <li><a :href="`tel:${CONTACT.phoneTel}`" class="footer__link">{{ CONTACT.phoneHuman }}</a></li>
          <li>
            <a :href="CONTACT.calLink" target="_blank" rel="noopener nofollow" class="footer__link">
              {{ t('portfolio.footer.book') }}
            </a>
          </li>
          <li class="footer__muted">{{ CONTACT.location[lang] }}</li>
        </ul>
      </address>
    </div>

    <div class="container footer__base">
      <p class="footer__muted">© {{ new Date().getFullYear() }} David Schubert · Pukalani Studio. {{ t('portfolio.footer.rights') }}</p>
      <p class="footer__muted">
        <template v-for="page in legalPages" :key="page.slug">
          <NuxtLink :to="localePath(`/${page.slug}`)" class="footer__link">{{ page.title }}</NuxtLink>
          <span aria-hidden="true"> · </span>
        </template>
        {{ t('portfolio.footer.updated') }} {{ CONTACT.lastUpdatedHuman[lang] }}
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--line);
  padding-block: clamp(3rem, 6vw, 4.5rem) 2rem;
  background: var(--bg-soft);
}
.footer__grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: clamp(2rem, 4vw, 3.5rem);
  align-items: start;
}
.footer__brand {
  font-family: "Syne", ui-sans-serif, system-ui, sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  font-size: 1.1rem;
}
.footer__about {
  margin-top: 0.9rem;
  color: var(--text-soft);
  font-size: 0.88rem;
  max-width: 42ch;
}
.footer__available {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 1.1rem;
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
}
.footer__dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: var(--accent);
}
.footer__social,
.footer__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.1rem;
}
.footer__social {
  flex-direction: row;
  gap: 1.2rem;
}
.footer__heading {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--metal);
}
.footer__link {
  font-size: 0.88rem;
  color: var(--text-soft);
  transition: color 0.3s var(--ease);
}
.footer__link:hover {
  color: var(--accent);
}
.footer__contact {
  font-style: normal;
}
.footer__muted {
  color: var(--metal);
  font-size: 0.8rem;
}
.footer__base {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  padding-top: 1.6rem;
  border-top: 1px solid var(--line);
}
@media (max-width: 900px) {
  .footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 560px) {
  .footer__grid {
    grid-template-columns: 1fr;
  }
}
</style>
