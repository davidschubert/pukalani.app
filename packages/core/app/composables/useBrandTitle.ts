import type { MaybeRefOrGetter } from 'vue'

export interface BrandTitleOptions {
  /**
   * meta description + og:description (Audit-Befund S5). Leer/undefined =
   * kein Tag — ein leeres description-Meta ist schlechter als keines.
   */
  description?: MaybeRefOrGetter<string | undefined>
  /**
   * Markenname abweichend von `useBrandName()`. Gedacht für die EINE Sorte
   * App, deren Marke ein ÜBERSETZTER Ausdruck ist statt eines Eigennamens:
   * die Hilfe heißt „Pukalani Hilfe" bzw. „Pukalani Help". `useBrandName()`
   * liefert dort einen festen String aus der app.config, weshalb auf jeder
   * englischen Seite ein deutscher Markenname im Titel stünde.
   *
   * Ein Community-Name bleibt bewusst unübersetzt — „Morgenlicht" heißt in
   * jeder Sprache so. Deshalb ist das eine OPTION und nicht der Normalfall;
   * ohne sie bleibt die Kette Tenant → App-Brand → „Pukalani" unverändert.
   *
   * Leer oder nur Leerzeichen ⇒ ignoriert (Rückfall auf `useBrandName()`),
   * damit ein noch nicht geladener Übersetzungs-Schlüssel nicht einen
   * titellosen Kopf erzeugt.
   */
  brand?: MaybeRefOrGetter<string | undefined>
}

/**
 * Seitenkopf einer öffentlichen Seite: Titel im Muster „<Seite> · <Brand>"
 * (i18n-Key `ui.metaTitle`) plus die gespiegelten Social-Tags.
 *
 * Warum eine Composable und kein useHead je Seite: die Titel der Tenant-Seiten
 * waren markenlos und in EN wie DE identisch („Feed", „About me" — Audit-Befund
 * S8), geteilte Links kamen ohne description/og:* an (S5). Beides hängt an
 * derselben Brand-Kette wie Header/Footer/404 (useBrandName: Tenant vor
 * App-Brand vor „Pukalani"), also gehört es an EINE Stelle.
 *
 * Reaktiv gedacht: `page`/`description` werden als Getter übergeben, damit ein
 * Sprachwechsel oder ein nachgeladener Inhalt den Kopf mitzieht.
 *
 * og:image gehört bewusst NICHT hierher, sondern in `useLocaleSeoHead()`: das
 * Vorschaubild einer Community ist pro HOST gleich, nicht pro Seite, und seine
 * URL muss dieselbe Origin-Rechnung nehmen wie canonical (B1/B2). Der
 * Bildmarken-Layer meldet es über `useBrandOgImage()` an.
 */
export function useBrandTitle(page: MaybeRefOrGetter<string>, options: BrandTitleOptions = {}): void {
  const { t } = useI18n()
  const fallbackBrand = useBrandName()

  const brand = computed<string>(() => {
    const override = toValue(options.brand)?.trim()
    return override && override.length > 0 ? override : fallbackBrand.value
  })

  // Ohne Seitenname (Inhalt noch nicht da) bleibt der Brand allein stehen —
  // nie „ · Morgenlicht" mit führendem Trenner.
  const title = computed<string>(() => {
    const name = toValue(page).trim()
    return name.length > 0 ? t('ui.metaTitle', { page: name, brand: brand.value }) : brand.value
  })

  const description = computed<string | null>(() => {
    const text = toValue(options.description)?.trim()
    return text && text.length > 0 ? text : null
  })

  useSeoMeta({
    title: () => title.value,
    ogTitle: () => title.value,
    description: () => description.value,
    ogDescription: () => description.value,
  })
}
