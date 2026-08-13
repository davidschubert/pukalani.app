<script setup lang="ts">
/**
 * EIN REGLER, DER SICH BEIM SCREENREADER MELDET (AP10-Krümel, 2026-08-12).
 *
 * Der Theme-Editor lebt von seinen Reglern (THEMES-CONCEPT-V2: Einfachheit —
 * Standardansicht = wenige Entscheidungen). Für einen Screenreader waren sie
 * bis heute aber sechsmal derselbe namenlose Knopf: „Thumb", „Thumb", „Thumb".
 * Wer nicht sieht, welche Zeile er gerade greift, kann das Theme nicht bauen.
 *
 * ── WARUM DAS NICHT ÜBER DIE USlider-API GEHT (nachgelesen an Nuxt UI 4.10.0)
 * `Slider.vue` bindet die Beschriftung FEST an den Daumen:
 *
 *     <SliderThumb … :aria-label="thumbs === 1 ? 'Thumb' : `Thumb ${thumb} of ${thumbs}`" />
 *
 * Drei Wege wurden geprüft, alle drei sind zu:
 *   (1) EIN PROP gibt es nicht — `Slider.vue` deklariert kein `aria-label`.
 *   (2) `:ui` trägt NUR KLASSEN (tv-Slots), keine Attribute; `ui.thumb` landet
 *       in `:class`, nicht am Element.
 *   (3) ATTRS-DURCHREICHUNG hilft nicht: `Slider.vue` setzt kein
 *       `inheritAttrs: false`, ein `aria-label` am `<USlider>` fällt also auf
 *       den EINEN Wurzelknoten `SliderRoot` — und der ist ein `<span>` ohne
 *       Fokus und ohne `role="slider"`. Angesagt wird der DAUMEN.
 *
 * Die Ironie: reka-ui, das darunter liegt, macht es richtig — in
 * `SliderThumbImpl` steht `"aria-label": _ctx.$attrs["aria-label"] || label.value`,
 * eine eigene Beschriftung würde also gewinnen. Nuxt UI überschreibt sie nur
 * vorher mit 'Thumb'. Fällt diese Zeile dort weg (Upstream-Fix), kann dieser
 * Wrapper ersatzlos verschwinden und die Beschriftung direkt ans `<USlider>`.
 *
 * ── ALSO: NACHGETRAGEN AM DAUMEN ──────────────────────────────────────────
 * Gesetzt wird über `[data-slot="thumb"]` — Nuxt UIs eigener, stabiler Haken
 * am Element (dieselbe Kennung, die auch `:ui.thumb` adressiert). Fail-soft:
 * findet sich kein Daumen, passiert nichts — der Regler bleibt bedienbar, nur
 * eben unbeschriftet wie zuvor. Nachgezogen wird bei jedem Label-Wechsel, also
 * auch beim Sprachwechsel.
 *
 * ── DER WERT GEHÖRT NICHT INS LABEL ───────────────────────────────────────
 * `label` ist bewusst der BLANKE Name („Sättigung"), nicht die Feld-Beschriftung
 * inklusive Zahl („Sättigung (1.20)"). Der Daumen trägt bereits `aria-valuenow`;
 * stünde die Zahl zusätzlich im Namen, sagte der Screenreader sie zweimal — und
 * der Name des Bedienelements änderte sich bei JEDEM Schritt, was ihn als Name
 * wertlos macht. Sehende bekommen die Zahl unverändert über die `UFormField`-
 * Beschriftung.
 */
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** Blanker Name des Reglers (ohne Wert) — wird zum `aria-label` des Daumens. */
  label: string
}>()

const model = defineModel<number>({ required: true })

const root = useTemplateRef<HTMLElement>('root')

function labelThumbs() {
  root.value?.querySelectorAll('[data-slot="thumb"]').forEach((thumb) => {
    thumb.setAttribute('aria-label', props.label)
  })
}

onMounted(labelThumbs)
watch(() => props.label, labelThumbs)
</script>

<template>
  <div ref="root">
    <USlider v-model="model" v-bind="$attrs" />
  </div>
</template>
