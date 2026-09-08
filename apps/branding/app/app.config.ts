export default defineAppConfig({
  // App-spezifische Overrides (tiefer Merge, App > Layer > Core).
  pukalani: {
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
       * DAS ERSTGESPRÄCH LIEGT (NOCH) AUF pukalani.studio (BS1 R0,
       * 2026-09-07 — Davids Entscheidung).
       *
       * Der Layer-Default ist `type: 'route'` auf `/erstgespraech`. Diese
       * Seite gibt es ausschliesslich in `apps/portfolio`; auf
       * branding.supply führten deshalb BEIDE Aufrufer des einen
       * Conversion-Wegs ins 404 — der Knopf am Ende der Brand Foundation und
       * die Schranke des Marktvergleichs. Bis die eigene Erstgespräch-Seite im
       * brand-Layer steht (Paket Z1), zeigt der Trichter dieser Site auf die
       * Studio-Seite.
       *
       * WARUM HIER UND NICHT IM LAYER: die SITE entscheidet, wohin ihr
       * Trichter zeigt. Der Layer-Default bleibt richtig für pukalani.studio,
       * wo `brand` später ebenfalls laufen könnte und die Seite im eigenen
       * Haus liegt.
       *
       * `?source=branding-supply` ist die HERKUNFT. Achtung, was sie heute
       * ist und was nicht: die Studio-Seite liest keine Query, und
       * `POST /api/intro-call` nimmt sie auch nicht entgegen (das Zod-Schema
       * ist `.strict()`, ein `source`-Feld gibt es nicht) — die Angabe landet
       * also NICHT in `intro_requests`, sondern nur in der Web-Analyse der
       * Studio-Site. Der Name `source` ist frei gewählt, weil es keinen
       * bestehenden gab; wer die Herkunft später in der Anfrage haben will,
       * erweitert Seite und Route und behält diesen Namen.
       *
       * `target: '_blank'` erhält das bisherige Verhalten des Knopfes in der
       * Brand Foundation: der Leser verliert sein Dokument nicht. `rel`
       * ergänzt die pure Regel selbst (`noopener noreferrer`) — ein `_blank`
       * ohne das gäbe der Zielseite `window.opener` in die Hand.
       */
      completionCta: {
        type: 'url',
        href: 'https://pukalani.studio/erstgespraech?source=branding-supply',
        labelKey: 'brand.cta.book',
        target: '_blank',
      },
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
