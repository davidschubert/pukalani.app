import { createAdvisorSlotGenerator } from '../utils/advisorGenerator'
import type { BrandSlotGenerator } from '../utils/brandGenerators'
import { registerBrandSlotGenerator } from '../utils/brandGenerators'
import { MILO_PROMPT_VERSION, miloSlotInstruction } from '../utils/miloPrompt'

/**
 * MILO TREUHERZ (P3.1) — Baustein C · Werte.
 *
 * ── NUR `values`, OBWOHL MILO ZWEI BAUSTEINE HAT ──────────────────────────
 * `brandAdvisors.ts` gibt Milo `values` UND `archetype`. Registriert wird hier
 * nur `values`: für Baustein D gibt es noch keine Aufträge (P4), und eine
 * Registrierung ohne Aufträge wäre schlechter als gar keine — sie machte aus
 * „hier entwirft noch niemand" (`no_generator`, ein ruhiger Hinweis, der Stand
 * bleibt bearbeitbar) ein `provider_error`, also die Auskunft „der Anbieter ist
 * kaputt". Das Beraterteam bleibt davon unberührt: WER in Baustein D spricht,
 * sagt die Registry, nicht diese Datei.
 *
 * ── KEINE NACHPRÜFUNG ─────────────────────────────────────────────────────
 * Milos beide Slots (`c.candidates`, `c.definitions`) sind Listen, keine
 * Auswahlen — ihre Form trägt schon `brandSlotFormat.ts` in den Prompt, und ein
 * Beleg-Satz je Zeile lässt sich nicht mechanisch prüfen, ohne den Text zu
 * bewerten. Was hier zählt, entscheidet der Mensch beim Eingrenzen auf drei bis
 * fünf; eine Formprüfung, die ihm eine belegte Liste wegnähme, weil ein
 * Gedankenstrich fehlt, wäre teurer als der Fehler.
 *
 * ── `generator: 'candidates'` BRAUCHT KEINEN EIGENEN WEG ──────────────────
 * Die Registry unterscheidet `derive` · `draft` · `candidates`; Route und
 * Resolver fragen nur, ob überhaupt entworfen wird (`generator !== 'none'`).
 * Der Unterschied ist eine Aussage über den INHALT (eine Liste von Vorschlägen
 * statt eines Textes) und lebt deshalb im Auftrag, nicht im Protokoll — ein
 * dritter Zweig im Strom hätte nichts anderes zu übertragen.
 */

/** Milos Generator für Baustein C · Werte. */
export const miloValuesGenerator: BrandSlotGenerator = createAdvisorSlotGenerator({
  promptVersion: MILO_PROMPT_VERSION,
  instruction: miloSlotInstruction,
})

export default defineNitroPlugin(() => {
  registerBrandSlotGenerator('values', miloValuesGenerator)
})
