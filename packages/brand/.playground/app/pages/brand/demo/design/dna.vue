<script setup lang="ts">
import {
  DS_BOARDS,
  DS_DNA_DIMENSIONS,
  DS_DNA_PROPOSAL,
  dsDnaLabel,
  dsSceneColors,
  dsSceneFonts,
} from '../../../../utils/demoDesign'

/**
 * KAPITEL „MOODBOARD" (Konzept docs/plans/BRAND-DESIGN.md §2.2, Prototyp-
 * Screen 1) — Visual DNA, drei Boards nebeneinander, Mix & Match.
 *
 * DIE DREI SESSIONS STEHEN UNTEREINANDER auf EINER Bühne und nicht als
 * Reiter: sie bauen aufeinander auf (Vorschlag ⇒ Varianten ⇒ Feinschliff),
 * und wer beim Mix steht, muss den Vorschlag darüber noch sehen können.
 *
 * MIX & MATCH IST DAS LOCK-MUSTER von Huemint/Fontjoy (Marktbefund §1.7):
 * festhalten, was gefällt — der Rest wird neu vorgeschlagen. Neu vorgeschlagen
 * heisst hier: aus einem der drei Boards, nicht aus dem Nichts. Ein Würfel
 * über 10 × 5 Werten erzeugt Kombinationen, die niemand verantwortet.
 */
const boards = DS_BOARDS

/** Die Wahl aus `g.board` — Ausgangspunkt für alles Weitere. */
const chosenBoard = ref(boards[0]!.id)

/** Je Dimension: aus WELCHEM Board der Wert kommt (`g.mix`). */
const source = ref<Record<string, string>>(
  Object.fromEntries(DS_DNA_DIMENSIONS.map(dimension => [dimension.id, boards[0]!.id])),
)
/** Festgehalten = beim Neu-Vorschlagen unangetastet. */
const held = ref<Record<string, boolean>>(
  Object.fromEntries(DS_DNA_DIMENSIONS.map(dimension => [dimension.id, false])),
)

/* Ein Board-Wechsel setzt den Mix zurück — alles andere wäre eine Mischung
 * aus einer Wahl, die es nicht mehr gibt. Festgehaltene bleiben festgehalten:
 * genau dafür hat man sie festgehalten. */
watch(chosenBoard, (id) => {
  for (const dimension of DS_DNA_DIMENSIONS) {
    if (!held.value[dimension.id]) source.value[dimension.id] = id
  }
})

function boardById(id: string) {
  return boards.find(board => board.id === id) ?? boards[0]!
}

/** „Nicht festgehaltene neu vorschlagen": jede offene Dimension rückt ein
 *  Board weiter — deterministisch, damit zweimal Klicken nachvollziehbar ist. */
function resuggest(): void {
  for (const dimension of DS_DNA_DIMENSIONS) {
    if (held.value[dimension.id]) continue
    const current = boards.findIndex(board => board.id === source.value[dimension.id])
    source.value[dimension.id] = boards[(current + 1) % boards.length]!.id
  }
}

const heldCount = computed(() => Object.values(held.value).filter(Boolean).length)

/* Die Szene des Mixes: Farbwelt kommt aus dem Board der Dimension
 * „Farb-Charakter", Typografie aus dem Board der Dimension „Typografie" —
 * Davids Satz „Farbwelt aus 1, Typografie aus 3", wörtlich verdrahtet. */
const mixColorBoard = computed(() => boardById(source.value.color ?? chosenBoard.value))
const mixTypeBoard = computed(() => boardById(source.value.typography ?? chosenBoard.value))
const mixColors = computed(() => dsSceneColors(mixColorBoard.value.base, mixColorBoard.value.accent, mixColorBoard.value.base))
const mixFonts = computed(() => dsSceneFonts(mixTypeBoard.value.fontPairId))

/** Womit sich ein Board vom Vorschlag unterscheidet — die Karte sagt es. */
function differences(boardId: string): string[] {
  const board = boardById(boardId)
  return DS_DNA_DIMENSIONS
    .filter(dimension => board.values[dimension.id] !== boards[0]!.values[dimension.id])
    .map(dimension => dimension.label)
}

/* Je Board eine fertige Szene — der Neutral-Ton kommt aus der Basisfarbe
 * (getönt), wie es die Farbwelt-Seite später als Vorgabe anbietet. */
const boardScenes = computed(() => boards.map(board => ({
  board,
  colors: dsSceneColors(board.base, board.accent, board.base),
  fonts: dsSceneFonts(board.fontPairId),
})))
</script>

<template>
  <FdDesignWorkspace chapter="dna">
    <!-- ── g.dna: der Vorschlag, zehn Zeilen mit Begründung ────────────── -->
    <section>
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 class="text-xl font-medium">Visual DNA</h2>
        <span class="bw-state bw-state--confirmed"><UIcon name="i-ph-check" /> bestätigt</span>
        <span class="bw-label ms-auto" style="color: var(--bw-muted)">g.dna · zehn Dimensionen</span>
      </div>
      <p class="bw-doc-text mt-2">
        Zehn Eigenschaften, die sich nicht gegenseitig erklären. Jede ist aus eurer Foundation hergeleitet — die Begründung steht daneben, damit ihr widersprechen könnt.
      </p>

      <div class="mt-4 flex flex-col gap-2">
        <div
          v-for="entry in DS_DNA_PROPOSAL" :key="entry.dimension"
          class="bw-frame grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[10rem_9rem_minmax(0,1fr)]"
          style="background: var(--bw-surface)"
        >
          <p class="text-sm font-medium">{{ DS_DNA_DIMENSIONS.find(d => d.id === entry.dimension)?.label }}</p>
          <p class="text-sm" style="color: var(--bw-ink)">{{ dsDnaLabel(entry.dimension, entry.value) }}</p>
          <p class="text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ entry.reason }}</p>
        </div>
      </div>
    </section>

    <!-- ── g.boards + g.board: drei Boards nebeneinander ────────────────── -->
    <section>
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 class="text-xl font-medium">Drei Moodboards</h2>
        <span class="bw-label ms-auto" style="color: var(--bw-muted)">g.boards · g.board</span>
      </div>
      <p class="bw-doc-text mt-2">
        Dieselbe DNA in drei Stärken. Alle drei zeigen dieselbe Anwendung — Kopf, Überschrift, Knopf, Karte, Rampe —, damit ihr an der Sache vergleicht und nicht an drei verschiedenen Bildern.
      </p>

      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <button
          v-for="entry in boardScenes" :key="entry.board.id"
          type="button"
          class="bw-choice-card block w-full rounded-2xl p-3 text-left"
          :class="chosenBoard === entry.board.id ? 'bw-choice-card--selected' : ''"
          :aria-pressed="chosenBoard === entry.board.id"
          @click="chosenBoard = entry.board.id"
        >
          <FdDesignScene compact :colors="entry.colors" :fonts="entry.fonts" scheme="light" />
          <span class="mt-3 flex items-start justify-between gap-2">
            <span class="text-sm font-medium">{{ entry.board.name }}</span>
            <UIcon
              v-if="chosenBoard === entry.board.id" name="i-ph-check-circle-fill"
              class="mt-0.5 size-4 flex-none" style="color: var(--bw-accent)"
            />
          </span>
          <span class="mt-1 block text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ entry.board.note }}</span>
          <span v-if="differences(entry.board.id).length" class="bw-label mt-2 block" style="color: var(--bw-muted)">
            Anders als der Vorschlag: {{ differences(entry.board.id).join(' · ') }}
          </span>
          <span v-else class="bw-label mt-2 block" style="color: var(--bw-muted)">Der Vorschlag selbst</span>
        </button>
      </div>
    </section>

    <!-- ── g.mix: festhalten, tauschen, neu vorschlagen ─────────────────── -->
    <section>
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 class="text-xl font-medium">Mix &amp; Match</h2>
        <span class="bw-label ms-auto" style="color: var(--bw-muted)">g.mix · {{ heldCount }} von {{ DS_DNA_DIMENSIONS.length }} festgehalten</span>
      </div>
      <p class="bw-doc-text mt-2">
        Haltet fest, was sitzt — den Rest schlage ich neu vor. „Farbwelt aus Board 1, Typografie aus Board 3" ist hier kein Sonderfall, sondern der Normalweg.
      </p>

      <div class="mt-4 flex flex-col gap-2">
        <div
          v-for="dimension in DS_DNA_DIMENSIONS" :key="dimension.id"
          class="bw-frame grid items-center gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]"
          style="background: var(--bw-surface)"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ dimension.label }}</p>
            <p class="bw-label" style="color: var(--bw-muted)">{{ dimension.hint }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="board in boards" :key="board.id"
              type="button"
              class="bw-chip"
              :class="source[dimension.id] === board.id ? 'bw-chip--selected' : ''"
              :aria-pressed="source[dimension.id] === board.id"
              @click="source[dimension.id] = board.id"
            >
              {{ dsDnaLabel(dimension.id, board.values[dimension.id] ?? '') }}
              <span class="bw-label ms-1" style="color: var(--bw-muted)">{{ board.name }}</span>
            </button>
          </div>
          <UButton
            size="xs" color="neutral" :variant="held[dimension.id] ? 'solid' : 'ghost'"
            class="rounded-full justify-self-end"
            :icon="held[dimension.id] ? 'i-ph-lock-simple-fill' : 'i-ph-lock-simple-open'"
            :label="held[dimension.id] ? 'Festgehalten' : 'Festhalten'"
            @click="held[dimension.id] = !held[dimension.id]"
          />
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <UButton
          icon="i-ph-sparkle" label="Nicht festgehaltene neu vorschlagen"
          color="neutral" variant="outline" class="rounded-full"
          style="background: var(--bw-surface-hi)" @click="resuggest"
        />
        <p class="bw-pending">Klickdummy: schaltet nur den Zustand um — im Produkt fragt der Knopf Frida.</p>
      </div>
    </section>

    <!-- Die Szene des MIXES: was aus der Mischung geworden ist. -->
    <section>
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 class="text-xl font-medium">Euer Stand</h2>
        <span class="bw-label ms-auto" style="color: var(--bw-muted)">
          Farbwelt aus „{{ mixColorBoard.name }}" · Typografie aus „{{ mixTypeBoard.name }}"
        </span>
      </div>
      <div class="mt-3">
        <FdDesignScene :colors="mixColors" :fonts="mixFonts" />
      </div>
      <p class="bw-pending mt-3">
        Diese Belegung ist die Vorbelegung aller folgenden Kapitel — Farbwelt, Typografie, Zeichen, Bildsprache und Bewegung fangen damit an.
      </p>
    </section>
  </FdDesignWorkspace>
</template>
