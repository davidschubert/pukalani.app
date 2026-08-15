<script setup lang="ts">
import type { DocsNavigation } from '../../shared/types/docs'

// Kopfzeile: Marke, Abschnitts-Umschalter (die zwei Sammlungen), Suche.
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const fallback = ref<DocsNavigation | null>(null)
const navigation = inject(docsNavigationKey, fallback)
const activeSection = computed(() => resolveDocsSection(route.path))
const sidebarItems = computed(() => docsSectionItems(navigation.value, activeSection.value, locale.value))

// Auf der Startseite ist KEIN Abschnitt aktiv — `resolveDocsSection` liefert
// dort die Anleitung als Rückfall, das ist für die Abfrage richtig, für die
// Kopfzeile aber falsch. Verglichen wird gegen `localePath('/')`, nicht gegen
// den festen String '/': die englische Startseite heißt `/en`.
const istStartseite = computed(() => route.path.replace(/\/$/, '') === localePath('/').replace(/\/$/, ''))

const sections = computed(() => DOCS_SECTIONS.map(section => ({
  label: t(section.labelKey),
  icon: section.icon,
  to: localePath(section.prefix),
  active: activeSection.value === section.key && !istStartseite.value,
})))
</script>

<template>
  <UHeader :to="localePath('/')">
    <template #title>
      <span class="font-bold">{{ t('docs.siteName') }}</span>
    </template>

    <UNavigationMenu
      :items="sections"
      variant="link"
    />

    <template #right>
      <UContentSearchButton :collapsed="false" class="hidden sm:flex" />
      <UContentSearchButton class="sm:hidden" />
      <!--
        Seit die Inhalte übersetzt sind, ist der Wähler PFLICHT und keine
        Zierde: Der Browser-Sprach-Redirect (redirectOn: 'all') schickt jeden
        mit deutschem Browser von `/en/…` zurück auf Deutsch. Ohne eine Stelle,
        an der man seinen Wunsch äußern kann, wären die englischen Seiten für
        genau diese Leser unerreichbar — sie existierten, aber niemand käme hin.
        `switchLocalePath` hält dabei die Seite, auf der man gerade steht.
      -->
      <CoreLocaleSwitcher />
      <UColorModeButton />
      <!-- Sprachbewusst wie in der Fußzeile: Englisch ist auf pukalani.app die
           Vorgabe (ohne Prefix), Deutsch liegt unter /de. -->
      <UButton
        :to="locale.startsWith('en') ? 'https://pukalani.app' : 'https://pukalani.app/de'"
        color="neutral"
        variant="ghost"
        icon="i-ph-arrow-square-out"
        :aria-label="t('docs.toWebsite')"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="sections"
        orientation="vertical"
        class="-mx-2.5 mb-4"
      />
      <UContentNavigation
        highlight
        :navigation="sidebarItems"
      />
    </template>
  </UHeader>
</template>
