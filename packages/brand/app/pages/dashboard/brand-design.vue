<script setup lang="ts">
/**
 * BETREIBER: BRAND DESIGN FREISCHALTEN (Konzept docs/archiv/BRAND-DESIGN.md
 * §2.10, Prototyp-Screen 8 zweite Hälfte, Paket D1).
 *
 * ── WARUM EINE EIGENE SEITE UND KEINE SPALTE IN /dashboard/brands ─────────
 * `/dashboard/brands` ist KUNDEN-Fläche: sie zeigt die Marken DES ANGEMELDETEN
 * KONTOS im default-Layout mit der Wizard-Navigation (Begründung ausgeschrieben
 * im Kopf von `/dashboard/brand-scores`). Eine Betreiber-Spalte dort hiesse,
 * dass dieselbe Seite je nach Label zwei verschiedene Datenmengen zeigt — die
 * eigenen Marken plus fremde. Diese Seite ist die Schwester von
 * `/dashboard/waitlist`, `/dashboard/intro-calls` und `/dashboard/discover`:
 * dashboard-Shell, `users.manage`, `scope: 'operator'`.
 *
 * ── DAS GESCHÄFTSMODELL IST STUDIO-BEGLEITET (§1.11 d) ───────────────────
 * Kein Stripe, kein Preis, keine Selbstbedienung. Eine Marke bekommt Schicht 2,
 * wenn das Erstgespräch gelaufen ist — der Knopf hier ist die einzige Stelle,
 * an der das passiert, und er hinterlässt ein Ereignis.
 *
 * ── DER KNOPF IST AUS, SOLANGE DIE FOUNDATION OFFEN IST ──────────────────
 * Schicht 2 setzt das Ergebnis-Kapitel voraus. Eine Freischaltung davor öffnete
 * NICHTS (die Journey sperrt weiter) und stünde hier trotzdem als
 * „freigeschaltet" — eine Lüge in der Betreiber-Liste. Die Route lehnt denselben
 * Fall mit 409 ab; die Regel steht an beiden Enden, weil eine ausgegraute
 * Schaltfläche keine Durchsetzung ist.
 *
 * ── BESTÄTIGUNG VOR DEM KLICK ────────────────────────────────────────────
 * Freischalten ist eine Zusage an einen Kunden, und Zurücknehmen nimmt ihm ein
 * offenes Produkt mitten aus der Hand. Beides läuft deshalb über einen
 * Bestätigungs-Dialog, der sagt, was genau passiert.
 *
 * ── UTable IST GESETZT (Davids Entscheidung B6) ──────────────────────────
 * Sortierung und Paginierung verhalten sich damit überall gleich; der
 * Leerzustand läuft über `CoreEmptyState`.
 */
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type {
  BrandDesignUnlockItem,
  BrandDesignUnlockListResponse,
  BrandDesignUnlockResponse,
} from '../../../shared/types/brand'

/** Dieselbe Shell und dieselbe Begründung wie /dashboard/waitlist. */
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'admin'],
  requiredCapability: 'users.manage',
  dashboardScope: 'operator',
})

const { t, locale } = useI18n()
const toast = useToast()
useBrandTitle(() => t('brand.admin.designUnlock.title'))

const { data, refresh, status } = await useFetch<BrandDesignUnlockListResponse>(
  '/api/brand/admin/design-unlocks',
  { lazy: true, server: false },
)

const items = computed(() => data.value?.items ?? [])
const unlockedCount = computed(() => items.value.filter(item => item.designUnlockedAt).length)
const readyCount = computed(() => items.value.filter(
  item => item.foundationDone && !item.designUnlockedAt,
).length)

// ── Aktionen ───────────────────────────────────────────────────────────────

const busy = ref<string | null>(null)
/** Was gerade bestätigt werden soll — `null` heisst: kein Dialog offen. */
const confirming = ref<{ item: BrandDesignUnlockItem, action: 'unlock' | 'lock' } | null>(null)

async function apply(item: BrandDesignUnlockItem, action: 'unlock' | 'lock') {
  busy.value = item.id
  try {
    await $fetch<BrandDesignUnlockResponse>(
      `/api/brand/admin/profiles/${item.id}/design-${action}`,
      { method: 'POST' },
    )
    toast.add({ title: t(`brand.admin.designUnlock.done.${action}`), color: 'success' })
  }
  catch (error) {
    const reason = (error as { data?: { reason?: string } })?.data?.reason ?? ''
    toast.add({
      title: t('brand.admin.designUnlock.actionFailed'),
      description: t(reason === 'foundation_incomplete'
        ? 'brand.admin.designUnlock.error.foundation_incomplete'
        : 'brand.admin.designUnlock.error.generic'),
      color: 'error',
    })
  }
  finally {
    busy.value = null
    // Nachladen auch im Fehlerfall: bei einem 409 steht die Wahrheit schon in
    // der Ablage, und der Betreiber soll sie sehen statt sie zu raten.
    await refresh()
  }
}

async function confirmAction() {
  const pending = confirming.value
  if (!pending) return
  confirming.value = null
  await apply(pending.item, pending.action)
}

// ── Darstellung ────────────────────────────────────────────────────────────

const dateFormat = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }))
function formatDate(value: string | null): string {
  if (!value) return ''
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? dateFormat.value.format(parsed) : ''
}

const HIDE_MD = { td: 'hidden md:table-cell', th: 'hidden md:table-cell' }
const HIDE_LG = { td: 'hidden lg:table-cell', th: 'hidden lg:table-cell' }

const columns = computed<TableColumn<BrandDesignUnlockItem>[]>(() => [
  { accessorKey: 'title', header: () => t('brand.admin.designUnlock.col.brand') },
  { id: 'foundation', header: () => t('brand.admin.designUnlock.col.foundation'), meta: { class: HIDE_MD } },
  { id: 'design', header: () => t('brand.admin.designUnlock.col.design') },
  { accessorKey: 'createdAt', header: () => t('brand.admin.designUnlock.col.created'), meta: { class: HIDE_LG } },
  { id: 'actions', header: srOnlyHeader(() => t('ui.table.actions')) },
])

function rowActions(item: BrandDesignUnlockItem): DropdownMenuItem[][] {
  const actions: DropdownMenuItem[] = []
  if (item.designUnlockedAt) {
    actions.push({
      label: t('brand.admin.designUnlock.action.lock'),
      icon: 'i-ph-lock-simple',
      onSelect: () => { confirming.value = { item, action: 'lock' } },
    })
  }
  else {
    actions.push({
      label: t('brand.admin.designUnlock.action.unlock'),
      icon: 'i-ph-lock-simple-open',
      disabled: !item.foundationDone,
      onSelect: () => { confirming.value = { item, action: 'unlock' } },
    })
  }
  return [actions]
}
</script>

<template>
  <UDashboardPanel id="brand-design-unlock">
    <template #header>
      <UDashboardNavbar :title="t('brand.admin.designUnlock.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-ph-arrows-clockwise"
            color="neutral"
            variant="ghost"
            :loading="status === 'pending'"
            :aria-label="t('brand.admin.designUnlock.refresh')"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="mb-4 text-sm text-muted">{{ t('brand.admin.designUnlock.subtitle') }}</p>

      <div class="mb-6 grid grid-cols-3 gap-3" data-design-counts>
        <div class="rounded-xl border border-default p-4">
          <p class="text-2xl font-semibold tabular-nums">{{ items.length }}</p>
          <p class="text-sm text-muted">{{ t('brand.admin.designUnlock.counts.all') }}</p>
        </div>
        <div class="rounded-xl border border-default p-4">
          <p class="text-2xl font-semibold tabular-nums">{{ readyCount }}</p>
          <p class="text-sm text-muted">{{ t('brand.admin.designUnlock.counts.ready') }}</p>
        </div>
        <div class="rounded-xl border border-default p-4">
          <p class="text-2xl font-semibold tabular-nums">{{ unlockedCount }}</p>
          <p class="text-sm text-muted">{{ t('brand.admin.designUnlock.counts.unlocked') }}</p>
        </div>
      </div>

      <UTable :data="items" :columns="columns" data-design-list>
        <template #title-cell="{ row }">
          <div class="min-w-0">
            <p class="font-medium">{{ row.original.title || t('brand.brands.card.untitled') }}</p>
            <p class="text-xs text-muted">
              {{ t(`brand.brands.card.path.${row.original.pathKind}`) }} · {{ row.original.contentLocale }}
            </p>
            <p class="font-mono text-xs text-dimmed">{{ row.original.id }}</p>
          </div>
        </template>

        <template #foundation-cell="{ row }">
          <UBadge
            :color="row.original.foundationDone ? 'success' : 'neutral'"
            variant="subtle" size="sm"
          >
            {{ row.original.foundationDone
              ? t('brand.admin.designUnlock.foundation.done')
              : t('brand.admin.designUnlock.foundation.open', { pct: row.original.progressPct }) }}
          </UBadge>
        </template>

        <template #design-cell="{ row }">
          <UBadge v-if="row.original.designUnlockedAt" color="primary" variant="subtle" size="sm">
            {{ t('brand.admin.designUnlock.state.unlocked', { date: formatDate(row.original.designUnlockedAt) }) }}
          </UBadge>
          <span v-else class="text-sm text-dimmed">{{ t('brand.admin.designUnlock.state.locked') }}</span>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-sm text-dimmed">{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UDropdownMenu :items="rowActions(row.original)" :content="{ align: 'end' }">
              <UButton
                icon="i-ph-dots-three-vertical"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="t('brand.admin.designUnlock.rowActions')"
                :loading="busy === row.original.id"
              />
            </UDropdownMenu>
          </div>
        </template>

        <template #empty>
          <CoreEmptyState
            icon="i-ph-palette"
            :title="t('brand.admin.designUnlock.emptyTitle')"
            :description="t('brand.admin.designUnlock.empty')"
            data-design-empty
          />
        </template>
      </UTable>

      <!-- Bestätigung: der Satz nennt die Marke und was genau passiert (s. Kopf). -->
      <UModal
        :open="Boolean(confirming)"
        :title="confirming ? t(`brand.admin.designUnlock.confirm.${confirming.action}.title`) : ''"
        @update:open="(open) => { if (!open) confirming = null }"
      >
        <template #body>
          <p v-if="confirming" class="text-sm">
            {{ t(`brand.admin.designUnlock.confirm.${confirming.action}.body`, {
              brand: confirming.item.title || t('brand.brands.card.untitled'),
            }) }}
          </p>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" :label="t('ui.cancel')" @click="confirming = null" />
            <UButton
              v-if="confirming"
              :color="confirming.action === 'lock' ? 'warning' : 'primary'"
              :label="t(`brand.admin.designUnlock.confirm.${confirming.action}.action`)"
              data-design-confirm
              @click="confirmAction()"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
