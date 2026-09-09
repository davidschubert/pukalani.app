<script setup lang="ts">
import { INSIGHTS_RADAR_RETENTION_DAYS } from '../../../../shared/insightsPost'

/**
 * DER THEMENRADAR (§9.6, Adresse `/dashboard/insights/radar`) — in I2 seine
 * ADRESSE, noch nicht sein Inhalt.
 *
 * ── WARUM DIE SEITE SCHON DA IST ─────────────────────────────────────────
 * §11.2 Frage 3: „drei Adressen — Liste, Editor, Radar". Der Radar ist das
 * dritte Drittel der Redaktion, und sein Menüpunkt gehört zu den zwei anderen.
 * Was fehlt, ist nicht die Fläche, sondern die QUELLE: der Radar braucht einen
 * YouTube-Data-API-Schlüssel, und der ist eines der drei Gates aus §11.3 —
 * Davids Handgriff, nicht unserer.
 *
 * ── WARUM EIN HINWEIS UND KEIN VERSTECKTER MENÜPUNKT ─────────────────────
 * Ein Eintrag, der auf eine 404 zeigt, ist eine kaputte Navigation (Davids
 * 404-Audit vom 2026-09-03); ein Eintrag, den es gar nicht gibt, ist eine
 * Zusage, die niemand mehr findet. Die Seite sagt stattdessen, was fehlt und
 * wer es beibringen muss. `InRadar` steht mit LEERER Liste darunter — die
 * Form, die I4 füllt, samt ihrer 30-Tage-Zusage.
 */
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'admin'],
  requiredCapability: 'insights.manage',
  // Betreiber-Sache, wie Liste und Editor daneben.
  dashboardScope: 'operator',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
useBrandTitle(() => t('insights.radar.title'))

const readerLocale = computed(() => (locale.value === 'de' ? 'de' : 'en') as 'de' | 'en')
/** Ohne Lauf gibt es kein Datum — der heutige Tag ist die ehrlichste Angabe. */
const today = computed(() => new Date().toISOString().slice(0, 10))
</script>

<template>
  <UDashboardPanel id="insights-radar">
    <template #header>
      <UDashboardNavbar :title="t('insights.radar.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            :label="t('insights.editor.backToList')" icon="i-ph-arrow-left"
            color="neutral" variant="ghost"
            :to="localePath('/dashboard/insights')"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        icon="i-ph-key"
        color="info"
        variant="subtle"
        :title="t('insights.radar.pendingTitle')"
        :description="t('insights.radar.pendingText', { days: INSIGHTS_RADAR_RETENTION_DAYS })"
      />

      <div class="bw-root mt-6">
        <InRadar :videos="[]" :locale="readerLocale" :today="today" />
      </div>
    </template>
  </UDashboardPanel>
</template>
