<script setup lang="ts">
const { t, locale } = useI18n()
const year = new Date().getFullYear()

/**
 * Die Fußzeile verlinkt auf die MARKETING-Site, nicht auf diese hier — deren
 * Adressen kennt `localePath()` also nicht, sie müssen von Hand gebildet
 * werden.
 *
 * Warum das nicht egal ist: `pukalani.app/impressum` leitet dort auf
 * `/imprint` weiter, und das ist die ENGLISCHE Fassung (am 2026-08-15
 * nachgemessen). Der deutsche Fuß schickte seine Leser also ins Englische. Die
 * Namen unterscheiden sich je Sprache — deutsch `/de/impressum` und
 * `/de/datenschutz`, englisch `/imprint` und `/privacy` (Englisch ist dort die
 * Vorgabe und trägt deshalb kein Prefix).
 */
const istEnglisch = computed(() => locale.value.startsWith('en'))
const marke = 'https://pukalani.app'

const links = computed(() => istEnglisch.value
  ? { website: marke, imprint: `${marke}/imprint`, privacy: `${marke}/privacy` }
  : { website: `${marke}/de`, imprint: `${marke}/de/impressum`, privacy: `${marke}/de/datenschutz` })
</script>

<template>
  <UFooter>
    <template #left>
      <span class="text-sm text-muted">{{ t('docs.footer.credits', { year }) }}</span>
    </template>

    <template #right>
      <UButton
        :to="links.website"
        color="neutral"
        variant="ghost"
        size="sm"
      >
        {{ t('docs.footer.website') }}
      </UButton>
      <UButton
        :to="links.imprint"
        color="neutral"
        variant="ghost"
        size="sm"
      >
        {{ t('docs.footer.imprint') }}
      </UButton>
      <UButton
        :to="links.privacy"
        color="neutral"
        variant="ghost"
        size="sm"
      >
        {{ t('docs.footer.privacy') }}
      </UButton>
    </template>
  </UFooter>
</template>
