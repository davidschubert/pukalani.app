<script setup lang="ts">
import { CONTACT } from '../data/contact'

const { t } = useI18n()
const localePath = useLocalePath()

/**
 * Navigation nach dem Muster der alten Site. `priority` steuert, was auf
 * schmalen Viewports zuerst verschwindet: die Kopfzeile darf NIE überlaufen,
 * und ein Burger-Menü wäre für fünf Anker ein eigener Zustand mehr, als diese
 * Seite verdient. Die Sprungziele bleiben über die Fußzeile erreichbar.
 */
const links = computed(() => [
  { to: '/#leistungen', label: t('portfolio.nav.services'), priority: 2 },
  { to: '/ux-audit', label: t('portfolio.nav.uxAudit'), priority: 1 },
  { to: '/#referenzen', label: t('portfolio.nav.references'), priority: 3 },
  { to: '/#wissen', label: t('portfolio.nav.knowledge'), priority: 2 },
  { to: '/#faq', label: t('portfolio.nav.faq'), priority: 3 },
])
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <NuxtLink :to="localePath('/')" class="header__brand">
        david<span class="header__brand-accent">.</span>schubert
      </NuxtLink>
      <nav class="header__nav" :aria-label="t('portfolio.nav.label')">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="localePath(link.to)"
          class="header__link"
          :class="`header__link--p${link.priority}`"
        >
          {{ link.label }}
        </NuxtLink>
        <a
          :href="CONTACT.calLink"
          target="_blank"
          rel="noopener nofollow"
          class="header__link header__link--cta"
        >
          {{ t('portfolio.nav.cta') }}
        </a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  border-bottom: 1px solid var(--line);
}
.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 4.5rem;
}
.header__brand {
  font-weight: 800;
  letter-spacing: -0.02em;
  font-size: 1.05rem;
  white-space: nowrap;
}
.header__brand-accent {
  color: var(--accent);
}
.header__nav {
  display: flex;
  align-items: center;
  gap: clamp(0.9rem, 2.2vw, 1.8rem);
}
.header__link {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  white-space: nowrap;
  color: var(--text-soft);
  transition: color 0.3s var(--ease);
}
.header__link:hover {
  color: var(--accent);
}
.header__link--cta {
  color: var(--accent);
}
.header__link--cta:hover {
  color: var(--text);
}
/* Gestaffeltes Ausblenden statt Umbruch — die Kopfzeile bleibt einzeilig. */
@media (max-width: 1080px) {
  .header__link--p3 {
    display: none;
  }
}
@media (max-width: 820px) {
  .header__link--p2 {
    display: none;
  }
}
@media (max-width: 520px) {
  .header__link--p1 {
    display: none;
  }
}
</style>
