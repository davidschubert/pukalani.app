<script setup lang="ts">
/**
 * LISTE ODER KARTE — der Umschalter über den beiden Mitglieder-Ansichten
 * (Mitglieder-Karte, Etappe 2 — 2026-08-23).
 *
 * WARUM EIN EIGENES BAUTEIL und keine zwei Knopfreihen: er steht auf ZWEI
 * Seiten (`members/` und `members/map`), und beide müssen dieselben zwei
 * Einträge in derselben Reihenfolge zeigen. Zwei Kopien wären die Sorte
 * Doppelpflege, bei der eines Tages nur eine Seite den Weg zurück kennt.
 *
 * WARUM KEIN DRITTER REITER IN DER COMMUNITY-HÜLLE: die Reiter dort
 * (`pukalani.admin.communityTabs`) sind die THEMEN einer Community —
 * Allgemein, Branding, Mitglieder, Plan. „Karte" ist kein eigenes Thema,
 * sondern eine zweite Ansicht auf dieselben Menschen; sie gehört unter den
 * Reiter „Mitglieder" und nicht daneben.
 *
 * ECHTE LINKS, kein `@click` mit `navigateTo`: so funktionieren Mittelklick,
 * Lesezeichen und der Zurück-Knopf, und die aktive Ansicht steht in der
 * Adresse statt in einem State, den ein Neuladen verliert.
 */
const props = defineProps<{ view: 'list' | 'map' }>()

const { t } = useI18n()
const localePath = useLocalePath()

const items = computed(() => [
  { value: 'list' as const, label: t('members.views.list'), icon: 'i-ph-list-bullets', to: localePath('/dashboard/community/members') },
  { value: 'map' as const, label: t('members.views.map'), icon: 'i-ph-map-trifold', to: localePath('/dashboard/community/members/map') },
])
</script>

<template>
  <UButtonGroup size="sm" data-members-view>
    <UButton
      v-for="item in items"
      :key="item.value"
      :to="item.to"
      :icon="item.icon"
      :color="props.view === item.value ? 'primary' : 'neutral'"
      :variant="props.view === item.value ? 'solid' : 'outline'"
      :aria-current="props.view === item.value ? 'page' : undefined"
      :data-members-view-option="item.value"
    >
      {{ item.label }}
    </UButton>
  </UButtonGroup>
</template>
