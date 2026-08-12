<script setup lang="ts">
import { isProductStateEnabled } from '../../shared/types/config'
import { resolveAuthorActions } from '../../shared/chromeAuthorActions'
import type { PukalaniChromeAuthorActionConfig } from '../../shared/types/chrome'

/**
 * DIE STELLE NEBEN DEM NAMEN (F56) — was hier steht, entscheiden die Layer.
 *
 * Gerendert wird sie von den Produkten, die Autorenzeilen besitzen (heute
 * `PostCard` und `CommentItem`); EINGETRAGEN wird in sie über
 * `pukalani.chrome.authorActions` (Vertrag + Begründung:
 * core/shared/types/chrome.ts). Ohne Eintrag rendert sie NICHTS — kein
 * Element, kein Abstand, keine leere Lücke im Layout.
 *
 * `userId` ist Pflicht, `handle` nicht: ein Gast-Kommentar hat keinen
 * Menschen dahinter, und ein Konto ohne @-Namen ist nicht adressierbar. Was
 * daraus folgt, entscheidet jede eingetragene Komponente selbst — sie
 * bekommt beides durchgereicht und blendet sich aus, wenn sie nichts
 * bewirken kann.
 */
const props = defineProps<{
  /** Die Person, neben deren Namen die Aktion steht. */
  userId?: string | null
  /** Ihr @-Name in dieser Community (ohne @), soweit vorhanden. */
  handle?: string | null
  size?: 'xs' | 'sm' | 'md'
  /** Nur das Symbol — für gedrängte Zeilen wie eine Kommentar-Kopfzeile. */
  iconOnly?: boolean
}>()

const appConfig = useAppConfig()
const runtimeFlags = useRuntimeFlags()
const { planAllows } = useTenantPlan()

const actions = computed(() => resolveAuthorActions(
  (appConfig.pukalani as { chrome?: { authorActions?: PukalaniChromeAuthorActionConfig } })
    .chrome?.authorActions,
  {
    productOn: key => !key || isProductStateEnabled(runtimeFlags.value.products[key]),
    planAllows: key => !key || planAllows(key),
  },
))
</script>

<template>
  <!--
    KEIN Wrapper-Element, solange nichts eingetragen ist: die Autorenzeilen
    sind flex-Reihen mit `gap` — ein leeres <span> bekäme dort seinen eigenen
    Abstand und verschöbe den Zeitstempel in jeder App ohne messages.
  -->
  <template v-if="userId && actions.length">
    <component
      :is="action.component"
      v-for="action in actions"
      :key="action.id"
      :user-id="props.userId"
      :handle="props.handle"
      :size="props.size"
      :icon-only="props.iconOnly"
    />
  </template>
</template>
