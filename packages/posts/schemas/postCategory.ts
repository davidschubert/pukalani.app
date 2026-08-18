import { z } from 'zod'
import { LOCALE_CODE_PATTERN } from '../shared/categoryI18n'
import {
  MAX_CATEGORIES,
  MAX_CATEGORY_DESCRIPTION,
  MAX_CATEGORY_NAME,
  MAX_CATEGORY_SLUG,
  MAX_CATEGORY_SORT_ORDER,
} from '../shared/types/post'

/**
 * Kategorien der Discussions (F1 Stufe 1). Factory-Muster wie alle Schemas des
 * Repos: die UI übergibt `t`, der Server nimmt die Key-Fassung.
 *
 * ZWEI SCHEMAS, und das ist der Punkt: der Slug steht NUR im Anlege-Schema.
 * Der Kategorie-Name ist frei änderbar, der Slug nach der Anlage fest — die
 * Kategorie-SEITE (/discussions/<slug>) trägt keine Id, über die sich ein alter
 * Link selbst heilen könnte (dieselbe Regel wie beim pages-Layer). Ein
 * Alt-Slug-Gedächtnis wäre eine spätere Ausbaustufe, keine Stufe 1.
 */

type TranslateFn = (key: string) => string
const identity: TranslateFn = key => key

/** Kleinbuchstaben, Ziffern, Bindestrich als Trenner — kein führender/
 *  abschließender Bindestrich, keine Doppelungen. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Reservierte Slugs: `/discussions/<kategorie>` liegt im selben Namensraum wie
 * die Unterseiten des Bereichs. Ohne diese Sperre könnte eine Kategorie
 * „categories" die Kategorien-Übersicht verdecken.
 *
 * `about` und `badges` sind ECHTE Seiten des Bereichs — und `about` fehlte
 * hier seit Stufe 2 (beim Bau der Abzeichen-Seite aufgefallen). Ein statischer
 * Pfad gewinnt gegen `[category]`, die Kategorie wäre also nicht verdeckt,
 * sondern unerreichbar: sie ließe sich anlegen, in der Übersicht anklicken —
 * und der Klick landete auf der About-Seite. Die Sperre wirkt nur für NEUE
 * Kategorien; eine bestehende mit diesem Slug ist schon heute nicht
 * erreichbar und braucht einen neuen (Slug ist nach der Anlage fest).
 */
export const RESERVED_CATEGORY_SLUGS = ['categories', 'new', 'all', 'search', 'api', 'about', 'badges'] as const

const nameField = (t: TranslateFn) => z.string().trim()
  .min(1, t('posts.validation.categoryNameRequired'))
  .max(MAX_CATEGORY_NAME, t('posts.validation.categoryNameMax'))

const descriptionField = (t: TranslateFn) => z.string().trim()
  .max(MAX_CATEGORY_DESCRIPTION, t('posts.validation.categoryDescriptionMax'))
  .optional()

// Die Reihenfolge kommt seit dem Ziehen aus `PATCH /categories/order`; das
// Feld bleibt hier für Aufrufer, die eine Position ausdrücklich mitgeben.
const sortOrderField = () => z.number().int().min(0).max(MAX_CATEGORY_SORT_ORDER).optional()

/**
 * Übersetzungen: Sprachcode → Name/Beschreibung, beide OPTIONAL und beide
 * derselben Längengrenze unterworfen wie die Grundfassung (ein übersetzter
 * Name, der länger sein darf als der Originalname, wäre eine zweite Regel für
 * dieselbe Sache).
 *
 * `.catchall(z.never())` gibt es hier bewusst NICHT: der Schlüssel ist ein
 * Sprachcode, also ein offener Wertebereich — geprüft wird seine FORM. Alles
 * andere räumt `normalizeCategoryTranslations` beim Serialisieren weg, und
 * leere Felder fallen dabei ganz heraus („leer heißt nicht übersetzt").
 *
 * Höchstens 20 Sprachen — kein Produkt-Limit, sondern ein Riegel gegen einen
 * aufgeblähten Body, der die 4000 Zeichen der Spalte sprengen würde.
 */
const translationsField = (t: TranslateFn) => z.record(
  z.string().regex(LOCALE_CODE_PATTERN, t('posts.validation.categoryLocaleInvalid')),
  z.object({
    name: z.string().trim().max(MAX_CATEGORY_NAME, t('posts.validation.categoryNameMax')).optional(),
    description: z.string().trim().max(MAX_CATEGORY_DESCRIPTION, t('posts.validation.categoryDescriptionMax')).optional(),
  }),
).refine(value => Object.keys(value).length <= 20, t('posts.validation.categoryTranslationsMax')).optional()

export function createCategorySchema(t: TranslateFn = identity) {
  return z.object({
    name: nameField(t),
    slug: z.string().trim().toLowerCase()
      .min(1, t('posts.validation.categorySlugRequired'))
      .max(MAX_CATEGORY_SLUG, t('posts.validation.categorySlugMax'))
      .regex(SLUG_PATTERN, t('posts.validation.categorySlugFormat'))
      .refine(
        value => !(RESERVED_CATEGORY_SLUGS as readonly string[]).includes(value),
        t('posts.validation.categorySlugReserved'),
      ),
    description: descriptionField(t),
    sortOrder: sortOrderField(),
    active: z.boolean().optional(),
    translations: translationsField(t),
  })
}

/** Ändern: alles außer dem Slug. */
export function createCategoryEditSchema(t: TranslateFn = identity) {
  return z.object({
    name: nameField(t),
    description: descriptionField(t),
    sortOrder: sortOrderField(),
    active: z.boolean().optional(),
    translations: translationsField(t),
  })
}

/**
 * Die Reihenfolge speichern: die VOLLSTÄNDIGE Liste der Kategorie-Ids, von
 * oben nach unten.
 *
 * Nur Ids — bewusst keine Zahlen vom Aufrufer: die Positionen rechnet der
 * Server (`planCategoryOrder`), sonst gäbe es zwei Stellen, an denen eine
 * Reihenfolge entsteht, und die Oberfläche könnte Lücken oder Doppelungen
 * festschreiben. `min(1)` statt `min(0)`: eine leere Liste wäre entweder ein
 * Fehler der Oberfläche oder eine Community ohne Kategorien — in beiden
 * Fällen gibt es nichts zu sortieren.
 */
export function createCategoryOrderSchema(t: TranslateFn = identity) {
  return z.object({
    ids: z.array(z.string().trim().min(1))
      .min(1, t('posts.validation.categoryOrderRequired'))
      .max(MAX_CATEGORIES, t('posts.validation.categoryOrderMax')),
  })
}

/**
 * Der KI-Auftrag: „übersetze DIESEN Text in DIESE Sprache".
 *
 * Name und Beschreibung kommen aus dem FORMULAR und nicht aus der Datenbank —
 * sonst könnte man nur übersetzen, was schon gespeichert ist, und der Vorschlag
 * käme beim Anlegen einer neuen Kategorie zu spät.
 */
export function createCategoryTranslateSchema(t: TranslateFn = identity) {
  return z.object({
    locale: z.string().trim().regex(LOCALE_CODE_PATTERN, t('posts.validation.categoryLocaleInvalid')),
    name: nameField(t),
    description: z.string().trim().max(MAX_CATEGORY_DESCRIPTION, t('posts.validation.categoryDescriptionMax')).default(''),
  })
}

// Server-seitige Instanzen (Fehlertexte = Keys; die UI validiert mit t())
export const categorySchema = createCategorySchema()
export const categoryEditSchema = createCategoryEditSchema()
export const categoryOrderSchema = createCategoryOrderSchema()
export const categoryTranslateSchema = createCategoryTranslateSchema()
