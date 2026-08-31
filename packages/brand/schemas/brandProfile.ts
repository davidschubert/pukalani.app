import { z } from 'zod'

/**
 * WAS IN EIN BRAND-PROFIL HINEIN DARF — Anlage und die vier Weichen.
 *
 * ── DIE INHALTSSPRACHE KOMMT AUS DER CONFIG, NICHT AUS DIESER DATEI ───────
 * `createBrandProfileCreateSchema` nimmt die erlaubten Sprachen als ARGUMENT
 * (`pukalani.brand.contentLocales`, App-Config-Form §3e). Hartkodiert wäre sie
 * eine Pukalani-Annahme im Layer — genau das, was die White-Label-Regel
 * ausschliesst („Keine hartkodierten Pukalani-, George- oder
 * Erstgespräch-Annahmen im Layer"). Die Liste ist zugleich der Grund, warum das
 * hier eine FACTORY ist und keine Konstante.
 *
 * ── `contentLocale` IST PFLICHT UND WIRD NIE GEPATCHT ─────────────────────
 * Bei der Anlage FIXIERT (Plan §6): ein UI-Wechsel von `/` nach `/de` darf
 * bestehende Inhalte nicht plötzlich in anderer Sprache weiterschreiben. Das
 * PATCH-Schema kennt das Feld deshalb gar nicht — eine spätere Änderung ist ein
 * ausdrücklicher Übersetzungs-Vorgang, kein Nebeneffekt.
 *
 * ── `relaunchScope` NUR AUF DEM RELAUNCH-PFAD ─────────────────────────────
 * Die pure Regel (`brandNamingIncluded`) IGNORIERT einen `relaunchScope` auf
 * dem Gründer-Pfad bereits — fail-closed gegen widersprüchliche Tatsachen. Das
 * Schema lehnt ihn zusätzlich AB, statt ihn still zu schlucken: was gar nicht
 * erst gespeichert wird, kann später auch niemanden verwirren, der die Zeile
 * von Hand liest.
 */

export const BRAND_TITLE_MAX = 256

const pathKind = z.enum(['new', 'relaunch'])
const relaunchScope = z.enum(['refine', 'recut'])
const team = z.enum(['solo', 'team'])
const subBrands = z.enum(['unknown', 'yes', 'no'])

export function createBrandProfileCreateSchema(contentLocales: readonly string[]) {
  // Leere Konfiguration ⇒ 'en'. Ein Schema ohne einzige gültige Sprache würde
  // JEDE Anlage mit 400 beantworten; die Hauptsprache des Layers ist Englisch
  // (Plan §6), und ein fehlender Config-Eintrag ist ein Betriebsfehler, kein
  // Grund, das Produkt abzuschalten.
  const locales = contentLocales.length ? [...contentLocales] : ['en']

  return z.object({
    // '' ist ausdrücklich erlaubt — „Neue Marke" darf namenlos starten.
    title: z.string().trim().max(BRAND_TITLE_MAX).default(''),
    contentLocale: z.string().refine(value => locales.includes(value), {
      message: 'brand.validation.contentLocale',
    }),
    pathKind,
    relaunchScope: relaunchScope.optional(),
    hasName: z.boolean(),
    team,
    subBrands: subBrands.default('unknown'),
    // Der Chip „Name auf den Prüfstand?" (Katalog §2.2, Default nein).
    namingOpted: z.boolean().default(false),
  }).strict().superRefine((value, ctx) => {
    if (value.pathKind !== 'relaunch' && value.relaunchScope) {
      ctx.addIssue({
        code: 'custom',
        path: ['relaunchScope'],
        message: 'brand.validation.relaunchScopeOnlyOnRelaunch',
      })
    }
  })
}

/**
 * WAS SICH SPÄTER NOCH ÄNDERN DARF: der Titel und die Weichen — mehr nicht.
 *
 * Fortschritt, Konfidenz, Story und Preset stehen bewusst NICHT hier: sie sind
 * ERGEBNISSE der Arbeit und werden von ihren eigenen Routen geschrieben. Ein
 * PATCH, der `progressPct` entgegennähme, wäre genau die „Manipulation von
 * Fortschritt/Konfidenz über den Client", die §3e ausschliesst.
 *
 * ALLE Felder sind OPTIONAL, und ein fehlendes Feld heisst „nicht angefasst" —
 * nie „zurücksetzen". Dieselbe Begründung wie beim `neutral`-Feld des
 * Branding-PATCH (CLAUDE.md): die Oberfläche legt EINE Weiche um, nicht alle.
 */
export function createBrandProfilePatchSchema() {
  return z.object({
    title: z.string().trim().max(BRAND_TITLE_MAX).optional(),
    hasName: z.boolean().optional(),
    team: team.optional(),
    subBrands: subBrands.optional(),
    relaunchScope: relaunchScope.optional(),
    namingOpted: z.boolean().optional(),
  }).strict().refine(
    value => Object.keys(value).length > 0,
    { message: 'brand.validation.emptyPatch' },
  )
}
