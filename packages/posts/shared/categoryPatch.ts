/**
 * Was ein Kategorie-PATCH tatsächlich schreibt.
 *
 * PURE und unit-getestet, obwohl es nur vier Felder sind — genau hier ist beim
 * Bau (2026-08-03) ein Fehler durchgerutscht, den keine Typprüfung sieht: mit
 * `active: body.active ?? true` hat ein bloßes Umbenennen eine STILLGELEGTE
 * Kategorie wieder scharf geschaltet, und `sortOrder ?? 0` warf die
 * Reihenfolge weg. Die Antwort war 200, die Oberfläche zufrieden, der Zustand
 * falsch.
 *
 * DIE REGEL: weggelassen heißt UNVERÄNDERT, nicht „Vorgabewert". Ein PATCH,
 * der ungenannte Felder zurücksetzt, ist ein PUT mit falschem Namen.
 * Ausdrücklich mitgeschickte leere Werte ('' beim Text, 0 bei der Reihenfolge,
 * false beim Schalter) sind dagegen echte Ansagen und werden geschrieben.
 */

import { serializeCategoryTranslations } from './categoryI18n'

export interface CategoryPatchInput {
  name: string
  description?: string
  sortOrder?: number
  active?: boolean
  /** Sprachcode → Überschreibung; weggelassen heißt auch hier UNVERÄNDERT. */
  translations?: unknown
}

export function categoryUpdateData(input: CategoryPatchInput): Record<string, unknown> {
  // `name` ist Pflicht: eine Kategorie ohne Namen gibt es nicht, und das
  // Formular schickt ihn immer mit.
  const data: Record<string, unknown> = { name: input.name }
  if (input.description !== undefined) data.description = input.description
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder
  if (input.active !== undefined) data.active = input.active
  // Mitgeschickt heißt: DAS ist ab jetzt der ganze Satz Übersetzungen — eine
  // entfernte Sprache verschwindet also wirklich. Das ist kein Widerspruch zur
  // Regel oben: das Formular schickt immer alle Sprachen mit, die es anbietet,
  // und `serializeCategoryTranslations` wirft leere Felder ohnehin weg.
  if (input.translations !== undefined) data.translations = serializeCategoryTranslations(input.translations)
  return data
}
