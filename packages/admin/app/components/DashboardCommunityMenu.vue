<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { communityOrigin } from '../../../core/shared/notificationLinks'
import { switcherExternalLink } from '../../shared/communitySwitcherLinks'

/**
 * DER COMMUNITY-SWITCHER OBEN LINKS (F50, 2026-08-07 — Davids Entscheidung im
 * DECISION-LOG „Konto-Modell bestätigt, Community-Switcher kommt").
 *
 * Er ersetzt im Sidebar-Kopf das reine Branding (`DashboardBrand`) durch das
 * TeamsMenu-Muster des Nuxt-UI-Dashboard-Templates: der Name der Community, in
 * der man gerade arbeitet, mit einem Klappmenü darunter. Verdrahtet ist er in
 * `layouts/dashboard.vue`, und zwar nur, wo beides stimmt — der Schalter
 * `pukalani.chrome.communitySwitcher` UND ein Mandanten-Host.
 *
 * ── ERST BEIM ÖFFNEN LADEN ────────────────────────────────────────────────
 * Die Liste kostet einen Ruf ins Control Plane (JWT minten + zwei Tabellen).
 * Sie beim Seitenaufbau zu holen hieße: dieser Preis auf JEDER Dashboard-Seite,
 * für ein Menü, das die meisten Sitzungen nie aufklappen. Deshalb `$fetch` im
 * `watch` auf den Öffnungszustand — und danach EINMAL gemerkt (`loaded`), damit
 * mehrmaliges Auf- und Zuklappen nicht mehrfach fragt. Bewusst KEIN
 * `useLazyFetch`: die Antwort gehört nicht in die SSR-Payload jeder Seite (sie
 * nennt die anderen Communities des Betrachters), und ein Menü, das erst beim
 * Klick existiert, braucht keine Hydration.
 *
 * ── WARUM DIE TYPEN HIER NOCHMAL STEHEN ───────────────────────────────────
 * `admin` ist ein FUNDAMENT-Layer und darf `onboarding` nicht importieren
 * (A14, ESLint-Backstop) — die Route liegt aber dort, weil dort die
 * Service-Naht ins Control Plane wohnt. Also steht hier die Form der ANTWORT
 * als lokale Deklaration, wie schon bei `SearchResponse` in der
 * Dashboard-Hülle. Die Wahrheit ist `packages/onboarding/shared/communitySwitcher.ts`;
 * wer sie dort ändert, ändert sie hier mit.
 *
 * Bewusst nur die Felder, die dieses Menü RENDERT — die Route liefert daneben
 * noch die Rolle. Was eine Komponente nicht zeigt, gehört nicht in ihren Typ.
 */
interface SwitcherEntry {
  communityId: string
  name: string
  host: string
  current: boolean
}

/**
 * Dasselbe für die zwei Ausgänge (F50-Nachtrag, 2026-08-08): die Antwort von
 * `POST /api/community/control-handoff`. Wahrheit ist
 * `packages/onboarding/shared/controlExit.ts` (`ControlExitHandoff`) — hier
 * steht sie lokal, aus demselben A14-Grund wie oben.
 */
interface ControlExitHandoff {
  token: string
  host: string
  path: string
}

defineProps<{ collapsed?: boolean }>()

const { t } = useI18n()
const appConfig = useAppConfig() as {
  pukalani?: { tenancy?: { controlHosts?: string[], wizardHosts?: string[] } }
}

const brandName = useBrandName()

const open = ref(false)
const entries = ref<SwitcherEntry[]>([])
const loading = ref(false)
const loaded = ref(false)
const failed = ref(false)
/** Die Community, deren Sprung gerade gesiegelt wird (Spinner + Doppelklick-Sperre). */
const switching = ref<string | null>(null)
/** Der Ausgang, dessen Sprung gerade gesiegelt wird — dieselbe Rolle für die zwei Kontroll-Hosts. */
const exiting = ref<'create' | 'manage' | null>(null)
/** Irgendein Sprung ist unterwegs: der Rest des Menüs wartet, statt einen zweiten zu starten. */
const busy = computed(() => switching.value !== null || exiting.value !== null)

async function load() {
  if (loaded.value || loading.value) return
  loading.value = true
  failed.value = false
  try {
    const res = await $fetch<{ communities: SwitcherEntry[] }>('/api/community/switcher')
    entries.value = res.communities
    loaded.value = true
  }
  catch {
    // Fehlgeschlagen heißt NICHT „keine Communities": ein leeres Menü würde
    // behaupten, es gäbe nichts zu wechseln. Stattdessen ein Hinweis — und
    // `loaded` bleibt falsch, der nächste Klick versucht es erneut.
    entries.value = []
    failed.value = true
  }
  finally {
    loading.value = false
  }
}

watch(open, (isOpen) => { if (isOpen) void load() })

/**
 * Der Sprung in eine andere Community — EINGELOGGT.
 *
 * Session-Cookies sind host-only, die Anmeldung auf Community A gilt auf B
 * also nicht. Deshalb wird beim KLICK ein 60-Sekunden-Handoff-Token gesiegelt
 * (nicht beim Rendern: bei einem langsamen Leser wäre es abgelaufen), das der
 * Ziel-Host gegen Appwrite prüft, bevor er sein Cookie setzt — dasselbe
 * Verfahren wie im Kundenbereich auf `my.*` und am Ende des Wizards.
 *
 * Scheitert der Handoff, führt der Klick trotzdem zur Community — dann eben
 * mit Anmeldung. Ein kaputter Handoff darf keine Sackgasse sein.
 */
async function switchTo(entry: SwitcherEntry) {
  if (busy.value || entry.current) return
  switching.value = entry.communityId
  let target = `${communityOrigin(entry.host)}/dashboard`
  try {
    // Der Host der ANTWORT, nicht der aus dieser Liste: das Siegel ist an ihn
    // gebunden (Audit 2026-08-02), und ein Link, der woanders hinzeigt als das
    // Siegel erlaubt, führt verlässlich in einen 401. EINE Quelle, beide Male.
    const { token, host } = await $fetch<{ token: string, host: string }>('/api/community/switch', {
      method: 'POST',
      body: { communityId: entry.communityId },
    })
    target = `${communityOrigin(host)}/api/auth/site-session?token=${encodeURIComponent(token)}&to=%2Fdashboard`
  }
  catch {
    // Fallback: ohne Handoff wenigstens zur Community (dort Login).
  }
  window.location.href = target
}

/**
 * Die zwei Ausgänge auf die Kontroll-Hosts (pur + getestet, s. shared/).
 *
 * Sie entscheiden weiterhin, OB der Menüpunkt erscheint — und sie sind das
 * FALLBACK-Ziel. Das echte Sprungziel kommt seit dem F50-Nachtrag aus der
 * Antwort von `/api/community/control-handoff` (s. `exitTo`).
 */
const createUrl = computed(() => switcherExternalLink(appConfig.pukalani?.tenancy?.wizardHosts, '/start'))
const manageUrl = computed(() => switcherExternalLink(appConfig.pukalani?.tenancy?.controlHosts, '/communities'))

/**
 * Der Sprung auf einen KONTROLL-Host — EINGELOGGT (F50-Nachtrag, Davids
 * Entscheidung 2026-08-08).
 *
 * Bis hierher waren die zwei Ausgänge schlichte Links, und der Klickende stand
 * auf `start.*` bzw. `my.*` vor dem Anmeldeformular: dieselbe App, dasselbe
 * Pool-Projekt, aber Session-Cookies sind host-only. Also dasselbe Verfahren wie
 * beim Community-Wechsel eine Funktion höher — Siegel beim KLICK holen (60 s
 * Gültigkeit, ein beim Rendern erzeugtes wäre tot), Ziel aus der ANTWORT bauen.
 *
 * Host UND Pfad kommen aus der Antwort, nicht von hier: das Siegel ist an den
 * Host gebunden (Audit 2026-08-02), und den Pfad kennt der Server ohnehin
 * besser — er hat ihn aus derselben Regel wie den Host.
 *
 * Scheitert der Handoff, führt der Klick trotzdem zum Ziel — dann eben mit
 * Anmeldung. Ein kaputter Handoff darf keine Sackgasse sein.
 */
async function exitTo(target: 'create' | 'manage', fallbackUrl: string) {
  if (busy.value) return
  exiting.value = target
  let destination = fallbackUrl
  try {
    const { token, host, path } = await $fetch<ControlExitHandoff>('/api/community/control-handoff', {
      method: 'POST',
      body: { target },
    })
    destination = `${communityOrigin(host)}/api/auth/site-session?token=${encodeURIComponent(token)}&to=${encodeURIComponent(path)}`
  }
  catch {
    // Fallback: ohne Handoff wenigstens auf den Kontroll-Host (dort Login).
  }
  window.location.href = destination
}

const items = computed<DropdownMenuItem[][]>(() => {
  const list: DropdownMenuItem[] = []
  if (loading.value) {
    list.push({ label: t('dashboard.communitySwitcher.loading'), loading: true, disabled: true })
  }
  else if (failed.value) {
    list.push({ label: t('dashboard.communitySwitcher.failed'), icon: 'i-ph-warning-circle', disabled: true })
  }
  else if (entries.value.length === 0) {
    // Wer nur HIER Team-Mitglied ist, hat eine Zeile — die eigene. Ganz leer
    // ist die Liste für zwei reale Besucher: einen BETREIBER, der per
    // Break-Glass im Kunden-Dashboard steht, und einen `viewer`, der über
    // `dashboard.access` hereinkommt. Beide sollen einen Satz sehen statt
    // eines Lochs im Menü.
    list.push({ label: t('dashboard.communitySwitcher.empty'), disabled: true })
  }
  else {
    for (const entry of entries.value) {
      list.push({
        label: entry.name,
        // Der Host als zweite Zeile: zwei Communities können denselben Namen
        // tragen, die Adresse ist das Unterscheidungsmerkmal.
        description: entry.host,
        type: 'checkbox',
        checked: entry.current,
        loading: switching.value === entry.communityId,
        disabled: busy.value && switching.value !== entry.communityId,
        onSelect: (event: Event) => { event.preventDefault(); void switchTo(entry) },
      })
    }
  }

  // Die zwei Ausgänge sind seit dem F50-Nachtrag KEINE `to:`-Links mehr,
  // sondern gesiegelte Sprünge (s. `exitTo`) — sichtbar bleiben sie unter
  // derselben Bedingung wie vorher: nur mit konfiguriertem Kontroll-Host.
  const exits: DropdownMenuItem[] = []
  if (createUrl.value) {
    exits.push({
      label: t('dashboard.communitySwitcher.create'),
      icon: 'i-ph-plus',
      loading: exiting.value === 'create',
      disabled: busy.value && exiting.value !== 'create',
      onSelect: (event: Event) => { event.preventDefault(); void exitTo('create', createUrl.value) },
    })
  }
  if (manageUrl.value) {
    exits.push({
      label: t('dashboard.communitySwitcher.manage'),
      icon: 'i-ph-list-checks',
      loading: exiting.value === 'manage',
      disabled: busy.value && exiting.value !== 'manage',
      onSelect: (event: Event) => { event.preventDefault(); void exitTo('manage', manageUrl.value) },
    })
  }

  const heading: DropdownMenuItem[] = [{ type: 'label', label: t('dashboard.communitySwitcher.label') }]
  return [heading, list, exits].filter(group => group.length > 0)
})
</script>

<template>
  <UDropdownMenu
    v-model:open="open"
    :items="items"
    :external-icon="false"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-64' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      icon="i-ph-island"
      :label="collapsed ? undefined : brandName"
      :trailing-icon="collapsed ? undefined : 'i-ph-caret-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="font-bold tracking-tight data-[state=open]:bg-elevated"
      :ui="{ leadingIcon: 'text-primary', trailingIcon: 'text-dimmed' }"
      data-community-switcher
    />
  </UDropdownMenu>
</template>
