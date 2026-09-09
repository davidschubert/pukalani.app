export default defineAppConfig({
  // App-spezifische Overrides (tiefer Merge, App > Layer > Core).
  pukalani: {
    /**
     * BILDER LESEN (Brand Design, Vorbilder-Lesung — docs/plans/BRAND-DESIGN.md
     * §2.2/§2.12): das Vision-Modell ist Davids Entscheidung vom 2026-09-08
     * (DECISION-LOG). Nur hier gesetzt, weil branding.supply der einzige
     * Konsument ist; der Core-Default bleibt leer (= aus). Der ZDR-Filter
     * (`provider.data_collection = 'deny'`) sitzt fest im Core-Transport,
     * nicht in dieser Wahl. Ein Laufzeit-Override (`app_config.aiVisionModel`)
     * ist im Core vorbereitet, die Spalte gibt es noch nicht — bis dahin gilt
     * dieser Wert.
     */
    ai: {
      visionModel: 'google/gemini-2.5-flash',
      /**
       * BILDER ERZEUGEN (Zeichen, Stufe 3 — KI-Entwürfe, D5c): Davids
       * Entscheidung vom 2026-09-08 (DECISION-LOG). Dieselbe Anbieter-Familie
       * wie die Lesung; die ZDR-Klemme sitzt im Core-Transport `aiImage`.
       * Der zuerst genannte Preview-Slug (`…-image-preview`) hat bei OpenRouter
       * seit 2026-09 keine Endpunkte mehr („No endpoints found", echter Lauf
       * 2026-09-08) — dies ist das freigegebene Nachfolgemodell derselben
       * Familie; der Lauf unter `data_collection: deny` + `zdr` lieferte
       * vier Bilder.
       */
      imageModel: 'google/gemini-2.5-flash-image',
    },
    /**
     * DER NAME, DEN DER BESUCHER SIEHT.
     *
     * `useBrandName()` im Core geht die Kette Mandanten-Name → App-Marke →
     * Rückfall „Pukalani". Diese Site ist ein Silo ohne Mandanten, also gilt
     * die App-Marke — ohne diesen Eintrag stünde im Tab-Titel und auf der
     * Fehlerseite „Pukalani", während die Domain „branding.supply" heisst.
     *
     * ACHTUNG, GETEILTER NAMENSRAUM: `pukalani.brand` trägt hier ZWEI Dinge —
     * `name`/`homeUrl` gehören dem Core (Marke der App), `enabled`/`persona`/
     * `contentLocales`/`completionCta`/`devStubGenerator` gehören dem
     * brand-Layer (Produkt-Config). Der tiefe Merge hält beide nebeneinander;
     * ein `brand: { … }` hier ERSETZT also nichts, es ergänzt.
     *
     * `pukalani.brand.devStubGenerator` ist deshalb BEWUSST NICHT gesetzt: der
     * Layer-Default ist `false`, und der Entwicklungs-Ersatz für Georges
     * Entwürfe läuft ausschliesslich im `.playground`. Ein Ersatztext, der
     * einmal in einem echten Brand-Dokument landet, ist von einem Ergebnis
     * nicht zu unterscheiden — hier streamt erst, was ein echter Generator
     * (P2, `registerBrandSlotGenerator()`) liefert.
     */
    brand: {
      name: 'Branding Supply',
      /**
       * DAS ERSTGESPRÄCH IST ZURÜCK IN DER MARKE (BS1 Z0, 2026-09-07) —
       * DESHALB STEHT HIER KEIN `completionCta` MEHR.
       *
       * Bis Z0 stand an dieser Stelle die R0-Notlösung: `type: 'url'` auf
       * `https://pukalani.studio/erstgespraech?source=branding-supply`, mit
       * `target: '_blank'`. Sie hat den 404 abgestellt und dafür einen
       * Markenbruch mitten im Trichter gekauft — wer gerade eine halbe Stunde
       * an SEINER Marke gearbeitet hatte, landete in einem neuen Tab auf einer
       * FREMDEN.
       *
       * Seit Z0 gibt es `/erstgespraech` im `brand`-Layer. Der Layer-Default
       * (`type: 'route'`, `to: '/erstgespraech'`, `labelKey:
       * 'brand.cta.book'`) ist damit für diese Site die richtige Antwort, und
       * ein Eintrag hier wäre nur eine zweite Kopie davon. Der tiefe Merge der
       * `app.config` liefert ihn unverändert durch — weglassen ist die
       * Entscheidung, nicht das Vergessen.
       *
       * WER IHN WIEDER SETZT, setzt ihn ganz: `type: 'url'` verlangt `href`
       * (nicht `to`), und ohne `target` bleibt es derselbe Tab
       * (`packages/brand/shared/brandCompletionCta.ts`).
       *
       * Die Herkunft `?source=branding-supply` ist damit ebenfalls Geschichte
       * und wird nicht gebraucht: die eigene Seite kennt ihre Herkunft aus dem
       * `?source=`-Parameter ihrer eigenen Aufrufer und legt sie in
       * `brand_intro_requests.source` ab — sie steht jetzt also in der
       * Anfrage, nicht nur in einer fremden Web-Analyse.
       */
      /**
       * WOHIN DIE ERSTGESPRÄCH-ANFRAGEN GEMELDET WERDEN (BS1 Z0).
       *
       * LEER ist der Default und heisst „keine Betreiber-Mail" — dieselbe
       * Entscheidung wie bei `waitlistNotify` daneben. Die Anfrage geht dann
       * trotzdem nicht verloren: sie steht in `brand_intro_requests` und unter
       * /dashboard/intro-calls, und der Absender bekommt seine Bestätigung.
       *
       * DAVIDS ADRESSE (gesetzt 2026-09-07: hello@branding.supply). Ein
       * erfundener Standard-Empfänger wäre schlimmer als keiner: eine
       * Zustellung ins Nichts sieht wie eine Zustellung aus.
       */
      introCallNotify: 'hello@branding.supply',
      /**
       * DIE ÖFFENTLICHE KONTAKTADRESSE (BS1 R2a/R2, David 2026-09-07):
       * dieselbe wie `introCallNotify` — die Methodik-Seite des Brand-Checks
       * nennt sie für Entfernung, Sperre und Rückfragen, statt nur aufs
       * Impressum zu zeigen. Zwei Schlüssel, weil Postfach (intern) und
       * Anzeige (öffentlich) getrennte Fragen sind.
       */
      contactEmail: 'hello@branding.supply',
      /**
       * DIE DREI RECHTSWÖRTER IM FUSS SIND SEIT BS1 R1 ECHTE LINKS
       * (2026-09-07). Bis dahin standen sie hier bewusst leer — der
       * Layer-Default lässt die Zeile dann ganz weg, weil ein Wort ohne Ziel
       * schlechter ist als kein Wort (Begründung in
       * `packages/brand/shared/brandLegalLinks.ts`).
       *
       * Die Pfade sind die Routen des `pages`-Layers (`app/pages/[slug].vue`);
       * das Sprach-Präfix legt `BwSiteFooter` per `localePath()` darum, auf
       * /de also `/de/imprint`. Sie zeigen ab R1 auf ein ENTWURFS-Gerüst —
       * dass das kein fertiger Text ist, sagt `pukalani.pages.draftNotice`
       * unten, nicht ein fehlender Link.
       */
      legalLinks: { imprint: '/imprint', privacy: '/privacy', terms: '/terms' },
    },
    /**
     * „Anmelden mit Google" (Davids Auftrag 2026-09-03). Das ist der
     * DESIGN-Schalter (welche Anbieter, in welcher Reihenfolge); der Knopf
     * erscheint erst, wenn auch der BETRIEBS-Schalter der Site gesetzt ist
     * (`NUXT_PUBLIC_AUTH_OAUTH_PROVIDERS=google` in der Server-.env) UND das
     * Appwrite-Projekt `branding` einen Google-Client trägt — Rezept:
     * docs/runbooks/GOOGLE-LOGIN.md (Redirect-URI endet auf `/branding`).
     * Bis dahin ändert diese Zeile nichts Sichtbares; das ist Absicht.
     */
    auth: {
      providers: ['google'],
      /**
       * DAS AGB-HÄKCHEN STEHT AB SOFORT — MIT DEM ENTWURF (Davids
       * Entscheidung 7 vom 2026-09-07, Plan
       * docs/plans/BRANDING-SUPPLY-RECHT-UND-BEZAHLUNG.md §9).
       *
       * Die Empfehlung war „erst die fertigen Texte, dann der Schalter".
       * Dagegen entschieden, weil die Site seit dem 2026-09-01 Konten aufnimmt
       * und jedes Konto ohne Häkchen eines ohne jede Zusage ist. Der Preis der
       * Abweichung wird an drei Stellen bezahlt:
       *
       *   1. `termsDraft` — „Entwurf, in anwaltlicher Prüfung" steht NEBEN dem
       *      Häkchen, in allen drei Anmeldewegen (Passwort, Code, Google).
       *   2. `pages.draftNotice` (unten) — derselbe Hinweis als erster Block
       *      der Seite, dazu `noindex`.
       *   3. `termsVersion` — die Fassung wird beim Konto gespeichert
       *      (`termsAcceptedAt`/`termsVersion` in den Prefs). Ohne sie wäre
       *      „hat zugestimmt" nach der Prüfung wertlos: man wüsste nicht mehr,
       *      WELCHEM Text.
       *
       * `/terms` ist die Route des `pages`-Layers; `localePath()` im Formular
       * schickt einen deutschen Leser nach `/de/terms`. NACH DER PRÜFUNG (R3):
       * neue `termsVersion`, `termsDraft` weg, `draftNotice` weg.
       */
      termsUrl: '/terms',
      termsVersion: '2026-09-draft-1',
      termsDraft: true,
      /**
       * NUR FÜR UNTERNEHMEN UND SELBSTSTÄNDIGE (BS1 R1c, Davids Entscheidung
       * vom 2026-09-08): branding.supply ist ein B2B-Angebot. In jedem
       * Registrierungsweg steht deshalb ein zweites Pflicht-Häkchen „Ich
       * handle als Unternehmer/in oder Selbstständige/r", und der Zeitpunkt
       * landet als `businessConfirmedAt` in den Prefs des Kontos.
       *
       * WARUM DAS EINE ZUSAGE UND KEIN HINWEIS SEIN MUSS: einem VERBRAUCHER
       * steht bei einem Fernabsatzvertrag ein Widerrufsrecht zu, einem
       * Unternehmer nicht. Ein Satz auf der Preisseite ist dafür zu wenig —
       * ohne die Bestätigung am Konto wäre später nicht mehr sagbar, dass
       * dieses Konto sie überhaupt abgegeben hat. Dieselbe Lehre wie bei der
       * AGB-Fassung eine Zeile darüber (R1).
       *
       * Der Google-Weg trägt sie mit: der Knopf ist gesperrt, solange EINES
       * der beiden Häkchen offen ist (`oauthBlockedBy` in `RegisterForm.vue`).
       *
       * BLEIBT NACH R3 STEHEN — anders als `termsDraft`/`draftNotice`: der
       * Schalter sagt nichts über den Reifegrad der Texte, sondern über den
       * Zuschnitt des Angebots.
       */
      businessOnly: true,
    },
    /**
     * DIE DREI RECHTSSEITEN SIND VERÖFFENTLICHT UND TROTZDEM ENTWÜRFE
     * (BS1 R1). Der Kasten „Entwurf, in anwaltlicher Prüfung" steht als
     * ERSTER Block über dem Text, und die Seiten tragen `noindex, follow` —
     * ein Impressums-Platzhalter im Suchindex wäre schlimmer als keiner.
     * Warum das eine App-Ansage ist und keine neue Spalte, steht im Kopf von
     * `packages/pages/shared/pageDraftNotice.ts`.
     *
     * DIESE ZEILE FÄLLT MIT PAKET R3, zusammen mit `auth.termsDraft` — und
     * zwar erst dann: sie ist die einzige Stelle, an der ein Besucher erfährt,
     * dass er einen ungeprüften Text vor sich hat.
     */
    /**
     * DIE HÜLLE UNTEN LINKS HEISST „WEBSITE-EINSTELLUNGEN" (Davids Entscheidung
     * 2026-09-08, DECISION-LOG „Navigation anpassen"): diese Site ist ein Silo
     * ohne Community, und der Menüpunkt hieß trotzdem „Community-Einstellungen"
     * — eine falsche Auskunft über eine Fläche, in der die Rechtsseiten und
     * die Navigation DIESER Website stehen. Der Schalter ist derselbe wie in
     * apps/comments (Begründung dort und an `instanceTabs` in
     * packages/core/app/app.config.ts): er benennt die Hülle um UND hängt die
     * vier Betreiber-Reiter Produkte · Speicher · Konfiguration · System
     * hinein — hier richtig, denn der Betreiber dieser Instanz ist David.
     */
    admin: { instanceTabs: true },
    pages: {
      draftNotice: ['imprint', 'privacy', 'terms'],
    },
    /**
     * DER MARKTVERGLEICH GEHÖRT AUF DIESE SITE — ANGESCHALTET SEIT 2026-09-06
     * (MV1 M1/M4, Plan docs/archiv/BRAND-MARKTVERGLEICH.md §2.1).
     *
     * Der Layer-Default ist `false` und bleibt es (Begründung dort): market
     * ist ein ZUSATZ zum Wizard, kein Teil von ihm, und die Site entscheidet
     * ausdrücklich selbst (mit diesem `true`). Damit steht an
     * EINER Stelle, wer dieses Produkt anbietet — bei einer zweiten Brand-Site wäre das eine echte
     * Entscheidung und keine Nebenwirkung des `extends`.
     *
     * Der Schalter sagt „dieses Deployment kann es". WER es benutzen darf,
     * entscheidet die Zuteilung je Branding (§1.9), und ausschalten im
     * Notfall kann der Betreiber über `app_config.products.market.enabled`
     * ohne Deploy.
     *
     * ── SEIT 2026-09-06 AUF `true` — DIE REIHENFOLGE WAR MIGRATION, DANN SCHALTER
     * Die Prod-Migrationen brand-018/019 und market-001…004 sind am 2026-09-06
     * mit Davids Ja auf der Instanz `branding` gelaufen (zweiter Lauf komplett
     * idempotent, Schema-Parität grün) — erst danach dieses `true`, in einem
     * eigenen Commit (Runbook docs/runbooks/MARKTVERGLEICH-EINFUEHRUNG.md).
     * Der Schalter hält bei `false` die App komplett dunkel: Seite, Leiste UND
     * Routen lesen ihn (`market.vue`, `resolveWorkspaceNavExtras`,
     * `requireMarketEnabled`). Rückweg ohne Deploy: der Runtime-Kill
     * `app_config.products.market.enabled = false` (Produkt-Registry).
     */
    market: { enabled: true },
  },
  ui: {},
})
