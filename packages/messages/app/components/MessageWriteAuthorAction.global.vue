<script setup lang="ts">
/**
 * DIE VERDRAHTUNG VON „NACHRICHT SCHREIBEN" (F56, Konzept § 1).
 *
 * `MessageWriteButton` ist das Bauteil, das hier ist die Anmeldung an der
 * Registry `pukalani.chrome.authorActions` (core/shared/types/chrome.ts):
 * eine global registrierte Hülle, die `CoreAuthorActions` an jedem
 * Autorennamen aufrufen kann — im Beitrags-Kopf (`PostCard`) und in der
 * Kommentar-Kopfzeile (`CommentItem`).
 *
 * ── WARUM HIER UND NICHT IM BAUPLAN ─────────────────────────────────────
 * `nuxt.config.ts` dieses Layers sagt seit dem Bau: „Die Komposition
 * ‚Nachricht schreiben am Autorennamen' gehört nach A14 in `blueprint`."
 * Das war die richtige Regel und die falsche Adresse — beim Verdrahten
 * gemessen: `blueprint` komponiert SEITEN, die Autorenzeile liegt im INNEREN
 * von `PostCard` und `CommentItem`, und `CommentItem` hat überhaupt keinen
 * Slot. Der Bauplan käme nur über eine Slot-Kette durch zwei fremde Produkte
 * heran, und `blueprint` müsste `messages` in `requires` aufnehmen — womit
 * ein OPTIONALES Produkt zur Bedingung der Komposition würde.
 * Die Absicht der Regel bleibt gewahrt: NIEMAND importiert jemanden. core
 * besitzt den Vertrag, posts/comments rendern ihn, messages trägt sich ein.
 *
 * ── DIE ZWEI TORE, DIE NUR HIER GEPRÜFT WERDEN KÖNNEN ───────────────────
 * Plan (P4) und Laufzeit-Schalter (F2) stehen als Felder am Registry-Eintrag
 * und werden von `CoreAuthorActions` geprüft. Die anderen beiden sind
 * Laufzeit-Daten und gehören deshalb hierher:
 *  - der OWNER-SCHALTER (`useMessagesEnabled`, ab Werk AUS),
 *  - das RECHT ZU ERÖFFNEN (`messages.write`, hängt an Vertrauensstufe 1).
 * Beide führten sonst in ein 403, das der Knopf nicht einmal erklären dürfte
 * (§ 2.3). Die dritte Bedingung — angemeldet, nicht das eigene Profil, ein
 * Handle vorhanden — prüft der Knopf selbst und bleibt unverändert.
 */
const props = defineProps<{
  userId?: string | null
  handle?: string | null
  size?: 'xs' | 'sm' | 'md'
  iconOnly?: boolean
}>()

const enabled = useMessagesEnabled()
const mayWrite = useCommunityCapability('messages.write')
</script>

<template>
  <MessageWriteButton
    v-if="enabled && mayWrite"
    :user-id="props.userId"
    :handle="props.handle"
    :size="props.size"
    :icon-only="props.iconOnly"
  />
</template>
