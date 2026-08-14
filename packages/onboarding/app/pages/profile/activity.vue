<script setup lang="ts">
import type { AccountActivityEntry, AccountActivityResponse } from '../../../../core/shared/accountActivity'

/**
 * `/profile/activity` — was ich getan habe, über alle Communities hinweg
 * (AH-3).
 *
 * NUR EIGENES. Die Route dahinter (`/api/account/activity`) nimmt die
 * Nutzer-Id ausschließlich aus der Session und jeder Produkt-Layer filtert
 * hart auf seine Besitz-Spalte — diese Seite kann fremden Inhalt gar nicht
 * anzeigen, weil sie ihn nie bekommt. Die Community-Grenzen bleiben also
 * unberührt: sie zeigt eine Selbstauskunft, keinen Querblick.
 *
 * GRUPPIERTE LISTE STATT `UTable`, bewusst abweichend von Davids Regel B6.
 * Drei Gründe, alle spezifisch:
 *  1. Die Ansicht ist GRUPPIERT (eine Überschrift je Community) — genau das
 *     kann eine Tabelle nicht, ohne zur Fake-Gruppierung über eine Spalte zu
 *     werden, in der derselbe Name zwanzigmal untereinander steht.
 *  2. Jeder Eintrag ist ein SPRUNG AUF EINEN ANDEREN HOST, kein Datensatz zum
 *     Vergleichen — dieselbe Begründung wie auf `/communities`.
 *  3. Sortierung und Auswahl, die eine Tabelle mitbringt, gibt es hier nicht
 *     zu holen: die Reihenfolge ist immer „neueste zuerst", und ausgewählt
 *     wird nichts.
 *
 * ABSOLUTES DATUM, KEINE RELATIVE ANGABE („vor 3 Tagen"). `formatRelativeTime`
 * rechnet gegen `Date.now()`; serverseitig gerendert stünde im HTML eine
 * andere Zahl als danach im Browser — dieselbe Falle, wegen der die
 * Testphasen-Zeile auf `/communities` erst nach `onMounted` erscheint. Ein
 * festes Datum hat diese Falle nicht und ist in einer Liste über Monate
 * ohnehin die nützlichere Angabe.
 */
definePageMeta({ layout: 'onboarding', middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()

const { data, status, error } = await useFetch<AccountActivityResponse>('/api/account/activity', {
  default: () => ({ groups: [], truncated: false, unavailable: [] } as AccountActivityResponse),
})

/**
 * Die NAMEN der Communities. Die Aktivitäts-Antwort kennt nur Hosts (sie wird
 * aus dem gebündelten Host-Resolver gebaut, der genau das liefert) — der Name
 * steht in der Mitgliedschaftsliste, die diese Seite ohnehin geteilt bekommt
 * (useMyCommunities, gemeinsamer Abruf-Schlüssel).
 *
 * Verbunden wird über den HOST, nicht über eine Id: die beiden Quellen zählen
 * verschiedene Schlüssel (`communities.$id` dort, `communities.tenantId` hier),
 * der kanonische Host ist der einzige Wert, den beide gleich schreiben.
 *
 * Kein Treffer heißt nicht „Fehler", sondern meistens: dort bin ich kein
 * Mitglied mehr. Dann steht der Host als Überschrift, und das ist die
 * ehrlichste verfügbare Auskunft.
 */
const { data: mine } = useMyCommunities()
const namesByHost = computed(() => {
  const map = new Map<string, string>()
  for (const community of mine.value?.communities ?? []) map.set(community.host, community.name)
  return map
})

const groups = computed(() => data.value?.groups ?? [])

/**
 * Datum über `useFormatDate()` statt über die rohe Util (U15 Teil 5): der
 * Composable bindet BEIDES — die Sprache (das tat die abgelöste Zeile
 * `dateLocale` von Hand) und die Zeitzone des Kontos aus `prefs.timezone`.
 * Eine Seite, die ausdrücklich absolute Daten zeigt, ist der letzte Ort, an
 * dem eine zweite Rechnung stehen sollte.
 */
const { formatDate } = useFormatDate()

function groupLabel(host: string): string {
  if (!host) return t('onboarding.account.activity.unknownCommunity')
  return namesByHost.value.get(host) ?? host
}

/** Absolute URL auf den Community-Host — nur wenn BEIDES bekannt ist. */
function entryLink(host: string, entry: AccountActivityEntry): string | null {
  if (!host || !entry.path) return null
  return `https://${host}${entry.path}`
}

const KIND_ICONS: Record<AccountActivityEntry['kind'], string> = {
  post: 'i-ph-chat-teardrop-text',
  comment: 'i-ph-chat-circle-text',
  rsvp: 'i-ph-calendar-check',
  enrollment: 'i-ph-graduation-cap',
}

useBrandTitle(() => t('onboarding.account.activity.title'))
</script>

<template>
  <div class="space-y-6" data-account-activity>
    <div v-if="status === 'pending' && !groups.length" class="space-y-3">
      <USkeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-xl" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      :title="t('onboarding.account.activity.errorTitle')"
      :description="t('onboarding.account.activity.errorText')"
    />

    <CoreEmptyState
      v-else-if="!groups.length"
      icon="i-ph-clock-counter-clockwise"
      :title="t('onboarding.account.activity.emptyTitle')"
      :description="t('onboarding.account.activity.emptyText')"
      :action-label="t('onboarding.account.activity.emptyAction')"
      action-icon="i-ph-users-three"
      :action-to="localePath('/communities')"
    />

    <template v-else>
      <!--
        Ein ausgefallener Layer wird BENANNT, nicht verschwiegen: eine leere
        Liste und eine nicht geladene Liste sehen gleich aus, sagen aber das
        Gegenteil.
      -->
      <UAlert
        v-if="data?.unavailable.length"
        color="warning"
        variant="subtle"
        icon="i-ph-warning"
        :description="t('onboarding.account.activity.unavailable')"
        data-activity-unavailable
      />

      <section
        v-for="group in groups"
        :key="group.communityId"
        class="space-y-3"
        :data-activity-group="group.communityId"
        :data-activity-host="group.host"
      >
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 class="font-semibold text-highlighted">{{ groupLabel(group.host) }}</h2>
          <span v-if="group.host && namesByHost.get(group.host)" class="text-sm text-muted">{{ group.host }}</span>
        </div>

        <ul class="divide-y divide-default overflow-hidden rounded-xl border border-default">
          <li v-for="entry in group.entries" :key="`${entry.source}:${entry.id}`">
            <component
              :is="entryLink(group.host, entry) ? 'a' : 'div'"
              :href="entryLink(group.host, entry) ?? undefined"
              class="flex items-start gap-3 p-4"
              :class="entryLink(group.host, entry) ? 'transition-colors hover:bg-elevated/50' : ''"
              :data-activity-kind="entry.kind"
            >
              <UIcon :name="KIND_ICONS[entry.kind]" class="mt-0.5 size-5 shrink-0 text-dimmed" />
              <span class="min-w-0 flex-1 space-y-1">
                <span class="block text-sm font-medium text-highlighted">
                  {{ t(`onboarding.account.activity.kinds.${entry.kind}`) }}
                </span>
                <span class="block truncate text-sm text-muted">{{ entry.title }}</span>
              </span>
              <time :datetime="entry.createdAt" class="shrink-0 text-sm text-dimmed">
                {{ formatDate(entry.createdAt) }}
              </time>
            </component>
          </li>
        </ul>
      </section>

      <p v-if="data?.truncated" class="text-sm text-muted" data-activity-truncated>
        {{ t('onboarding.account.activity.truncated') }}
      </p>
    </template>
  </div>
</template>
