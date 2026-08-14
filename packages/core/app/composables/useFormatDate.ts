import { formatDate } from '../utils/format'

/**
 * formatDate, gebunden an die aktive i18n-Sprache (BCP-47-Tag aus der Locale-
 * Config, z.B. de-DE / en-US) UND an die Zeitzone des Kontos. Die Util bleibt
 * context-frei und unit-testbar — Locale und Zone werden nur hier im
 * Nuxt-Context aufgelöst. Ohne Bindung sähen EN-User sonst deutsche
 * dd.MM.yyyy-Daten.
 *
 * ZEITZONE (U15 Teil 5): `prefs.timezone` gesetzt ⇒ die Zeile wird in DIESER
 * Zone gerechnet, auf dem Server wie im Browser. Ohne Wahl (`''`) wird gar
 * keine `timeZone`-Option gesetzt und `Intl` rechnet wie eh und je in der Zone
 * der Laufzeit.
 */
export function useFormatDate() {
  const { locale, locales } = useI18n()
  const { timezone } = useAccountTimezone()

  const language = computed(() => {
    const entries = locales.value as Array<{ code: string, language?: string }>
    return entries.find(entry => entry.code === locale.value)?.language ?? locale.value
  })

  return {
    formatDate: (value: Date | string | number) =>
      formatDate(value, language.value, timezone.value || undefined),
  }
}
