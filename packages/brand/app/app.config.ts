/**
 * Die Config-FORM des Brand-Wizards (Plan §3e). Sie liegt in `app/` und nicht
 * im Package-Root — dort wird eine `app.config.ts` stillschweigend ignoriert.
 *
 * ── DREI HEBEL, DREI FRAGEN (Audit-7-Korrektur, Plan §3e) ─────────────────
 * `pukalani.brand.enabled` ist der BUILD-/KOMPOSITIONS-Schalter: „ist dieser
 * Layer Teil dieser App?" — er steht hier auf `true`, weil eine App, die
 * `brand` extended, ihn genau deshalb extended hat. Das ist die begründete
 * Ausnahme von „Core-Default ist immer aus": der Core kennt `brand` gar nicht,
 * es gibt also keinen Core-Default, den ein Layer überschreiben könnte, und
 * jede App ohne `brand` im `extends` sieht diesen Schlüssel nie.
 *
 * Die zwei anderen Hebel liegen bewusst NICHT hier, weil sie zur Laufzeit
 * umgelegt werden müssen: die ZULASSUNG ist `app_config.brandAdmissionMode`
 * (closed|invite|open, system-038), die Produkt-NOTABSCHALTUNG ist
 * `app_config.products.brand.enabled = false`. Wer einen davon in diese
 * Datei zöge, machte aus einem Schalter ein Deployment.
 *
 * ── `persona` ─────────────────────────────────────────────────────────────
 * George ist ein EIGENNAME und läuft deshalb nicht über i18n (de = en) —
 * dieselbe Regel wie bei den Theme-Namen. `mark` ist der Pfad zum Bildzeichen
 * und bleibt leer, bis es eines gibt: ein erfundener Standardpfad wäre ein
 * 404 in jeder Sprechblase.
 *
 * ── `contentLocales` ──────────────────────────────────────────────────────
 * Die Sprachen, in denen George INHALTE erzeugt. Sie sind NICHT die
 * Oberflächen-Sprachen der App: die Inhaltssprache wird bei der Anlage eines
 * Brandings FIXIERT (`brand_profiles.contentLocale`, Plan §6) und ändert sich
 * nicht mit dem Sprachumschalter — ein halb englisches, halb deutsches
 * Manifest wäre kein Ergebnis, sondern ein Schaden.
 *
 * ── `completionCta` ───────────────────────────────────────────────────────
 * Was am Ende steht. `type: 'route'` zeigt auf das Erstgespräch — das eine
 * Conversion-Ziel der Studio-Site.
 *
 * OFFEN UND BEWUSST SO COMMITTET: `labelKey` ist ein VERSPRECHEN, das der
 * Layer noch nicht hält — `brand.cta.book` existiert in keiner Locale-Datei,
 * weil `brand` noch keine hat. Heute ist das folgenlos (es rendert diesen
 * Knopf noch niemand, und `brand` steht in keiner App-`extends`, also sieht
 * ihn auch `pnpm check:i18n-keys` nicht). Mit den Routen/Seiten muss BEIDES
 * kommen: die Locale-Einträge in de UND en, und das Feld
 * `pukalani.brand.completionCta.labelKey` in der `FIELDS`-Tabelle von
 * `scripts/check-i18n-keys.mjs`. Ohne das steht im Knopf am Ende wörtlich
 * `brand.cta.book` — genau der Fehler, der vier Tage lang im Fuß von
 * comments.pukalani.app stand.
 */
export default defineAppConfig({
  pukalani: {
    brand: {
      enabled: true,
      persona: { name: 'George', mark: '' },
      contentLocales: ['en', 'de'],
      completionCta: { type: 'route', to: '/erstgespraech', labelKey: 'brand.cta.book' },
    },
  },
})
