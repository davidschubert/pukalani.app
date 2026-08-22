<script setup lang="ts">
import { CONTACT, CTA_LABELS, CTA_NOTE } from '../data/contact'
import type { Lang } from '../data/localized'

/**
 * Abschluss-Band der Unterseiten (Muster der alten `PkCtaBand`): Erstgespräch
 * oder E-Mail, plus die zugesagten Fristen. Bewusst OHNE Verlauf und ohne
 * Fremdfarbe — im Syne-Design trägt die Fläche `--bg-soft`, der Akzent sitzt
 * nur auf dem primären Knopf.
 */
const props = defineProps<{
  title: string
  text: string
  lang: Lang
}>()

const localePath = useLocalePath()
const { trackFunnel } = useFunnelEvent()

const primary = computed(() => CTA_LABELS.primary[props.lang])
const secondary = computed(() => CTA_LABELS.secondary[props.lang])
const note = computed(() => CTA_NOTE[props.lang])
</script>

<template>
  <section class="section cta-band" aria-labelledby="cta-band-title">
    <div class="container">
      <h2 id="cta-band-title" class="section-title">{{ title }}</h2>
      <p class="section-lead">{{ text }}</p>
      <div class="cta-band__actions">
        <!-- Ziel ist der Wizard, nicht mehr cal.com direkt (W1) — die
             Beschriftung („Kostenloses Erstgespräch") stimmt unverändert. -->
        <NuxtLink
          :to="localePath('/erstgespraech')"
          class="btn btn--solid"
          @click="trackFunnel('studio_cta_erstgespraech', { source: 'band' })"
        >
          {{ primary }} →
        </NuxtLink>
        <a :href="`mailto:${CONTACT.email}`" class="btn">{{ secondary }}</a>
      </div>
      <p class="section-note">{{ note }}</p>
    </div>
  </section>
</template>

<style scoped>
.cta-band {
  background: var(--bg-soft);
  border-top: 1px solid var(--line);
}
.cta-band__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 2rem;
}
</style>
