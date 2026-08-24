<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

/**
 * LISTE ODER KARTE — die Reiter über den beiden Mitglieder-Ansichten
 * (Mitglieder-Karte, Etappe 2 — 2026-08-23).
 *
 * WARUM REITER UND KEINE KNOPFREIHE (Davids Entscheidung 2026-08-23): so
 * sehen Ansichts-Wechsel in diesem Haus überall aus — Profil/Aktivität, die
 * Konto-Reiter, der Community-Hub. Ein eigenes Bedienmuster für genau diese
 * eine Stelle wäre eine Ausnahme ohne Grund; `UNavigationMenu … highlight`
 * ist das gemeinsame Muster.
 *
 * WARUM EIN EIGENES BAUTEIL und keine zwei Kopien: die Reiter stehen auf ZWEI
 * Seiten (`members/` und `members/map`) und müssen dieselben Einträge in
 * derselben Reihenfolge zeigen. Zwei Kopien wären die Sorte Doppelpflege, bei
 * der eines Tages nur eine Seite den Weg zurück kennt.
 *
 * WARUM KEIN ZWEITER MENÜPUNKT: „Karte" ist kein eigenes Thema, sondern eine
 * zweite Ansicht auf dieselben Menschen — sie gehört UNTER den Menüpunkt
 * „Mitglieder" und nicht daneben.
 *
 * WELCHER REITER AKTIV IST, ENTSCHEIDET DIE ADRESSE, nicht ein Prop: das
 * Menü vergleicht `to` mit der Route. `exact` trägt deshalb NUR der
 * Listen-Eintrag — ohne ihn bliebe „Liste" auch auf `/members/map` und auf
 * jeder Detailseite mit hervorgehoben, weil beide unter seinem Pfad liegen
 * (dieselbe Regel wie bei den Konto-Reitern in ACCOUNT_SETTINGS_TABS).
 *
 * ECHTE LINKS, kein `@click` mit `navigateTo`: so funktionieren Mittelklick,
 * Lesezeichen und der Zurück-Knopf.
 */
const { t } = useI18n()
const localePath = useLocalePath()

const links = computed<NavigationMenuItem[]>(() => [
  { label: t('members.views.list'), icon: 'i-ph-list-bullets', to: localePath('/dashboard/members'), exact: true },
  { label: t('members.views.map'), icon: 'i-ph-map-trifold', to: localePath('/dashboard/members/map') },
])
</script>

<template>
  <UNavigationMenu :items="links" highlight class="-mx-1" data-members-view />
</template>
