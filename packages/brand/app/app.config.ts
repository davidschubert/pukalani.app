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
 * EINGELÖST MIT P1c (2026-08-31): `labelKey` war ein VERSPRECHEN ohne Deckung —
 * `brand.cta.book` existierte in keiner Locale-Datei, weil der Layer keine
 * hatte. Jetzt steht es in `i18n/locales/{de,en}.json`, und das Feld
 * `pukalani.brand.completionCta.labelKey` steht in der `FIELDS`-Tabelle von
 * `scripts/check-i18n-keys.mjs` — der Wächter prüft es über `apps/branding`,
 * die einzige App, die diesen Layer extended (bis zum Rückbau am 2026-08-31
 * war das `apps/portfolio`; Gegenprobe: Schlüssel entfernen
 * ⇒ ein Befund). Ohne beides stünde im Knopf am Ende wörtlich `brand.cta.book`
 * — genau der Fehler, der vier Tage lang im Fuß von comments.pukalani.app
 * stand.
 */
export default defineAppConfig({
  pukalani: {
    brand: {
      enabled: true,
      persona: { name: 'George', mark: '' },
      contentLocales: ['en', 'de'],
      completionCta: { type: 'route', to: '/erstgespraech', labelKey: 'brand.cta.book' },
      /**
       * DER ENTWICKLUNGS-ERSATZ FÜR GEORGES ENTWÜRFE (P1c).
       *
       * Steht er auf `true`, beantwortet ein deterministischer Stub jede
       * Generierung — das §3e-Streaming-Protokoll ist damit OHNE KI-Schlüssel
       * und ohne Anbieter end-to-end beweisbar. `false` ist der Default und
       * gehört in JEDE App: ein Ersatztext, der einmal in einem echten
       * Brand-Dokument landet, ist von einem Ergebnis nicht zu unterscheiden.
       * Eingeschaltet ist er ausschliesslich im `.playground`.
       *
       * Er ist ein RÜCKFALL, keine Registrierung: sobald P2 einen echten
       * Generator über `registerBrandSlotGenerator()` einträgt, gewinnt der
       * — unabhängig von diesem Schalter (s. `server/utils/brandGenerators.ts`).
       */
      devStubGenerator: false,
    },
  },
})
