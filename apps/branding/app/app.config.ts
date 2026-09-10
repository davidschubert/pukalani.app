export default defineAppConfig({
  // App-spezifische Overrides (tiefer Merge, App > Layer > Core).
  pukalani: {
    /**
     * DER PRODUCTS-AUFKLAPPER (PS1, 2026-09-09 — Plan
     * docs/plans/PRODUCTS-SEITE.md §6, Davids Entscheidung e).
     *
     * ── WARUM DIE EINTRÄGE HIER STEHEN UND NICHT IM brand-LAYER ───────────
     * Die fünf Kinder zeigen auf die Marketing-Seiten von FÜNF Produkten, und
     * zwei davon gehören nicht dem brand-Layer (Marktvergleich = `market`,
     * Book & Kit = noch keiner). Ein Layer darf die anderen Produkt-Layer
     * nicht kennen (CONCEPT A14); die APP kennt laut `site.manifest.ts` alle
     * ihre Produkte und ist damit die einzige Stelle, an der diese Liste
     * vollständig und richtig sein kann. Genau dafür ist `pukalani.chrome.nav`
     * eine OBJEKT-Map: der tiefe Merge ergänzt die Layer-Registry, und wo eine
     * Id doppelt vorkommt, gewinnt die App.
     *
     * ── WAS DIESE ZEILEN AM LAYER ÄNDERN ──────────────────────────────────
     * `products` bekommt sein `to` zurück: der brand-Layer trägt `to: ''` („ein
     * Wort, das nur aufklappt"), weil es bis heute keine Übersichtsseite gab.
     * Jetzt gibt es sie, und `navMenuChildren()` stellt sie als ERSTEN Eintrag
     * in den Aufklapper (core entscheidet das, damit beide Renderer es gleich
     * tun — Begründung in core/shared/communityNavigation.ts).
     * `brand-check` bekommt ein neues Ziel: im Menü steht ab jetzt die
     * PRODUKTSEITE `/products/brand-check`, nicht mehr das Werkzeug
     * `/brand-check`. Der Weg zum Werkzeug führt über den einen Knopf auf
     * dieser Seite — sonst stünde ein Produkt im Aufklapper anders da als die
     * vier anderen, ohne dass jemand das entschieden hätte.
     *
     * ── DIE SCHLÜSSEL: DREI ALTE, DREI NEUE ───────────────────────────────
     * `brand.nav.brandCheck` und `brand.nav.foundation` gibt es im brand-Layer
     * bereits in beiden Sprachen („Brand-Check", „Brand Foundation"), ebenso
     * alle fünf Beschreibungen (`brand.nav.product.*` — sie standen seit dem
     * Klickdummy ungenutzt da und lösen genau hier ihr Versprechen ein). Die
     * drei Namen, die der Layer nicht kennt, gehören der App
     * (`products.nav.*`): Marktvergleich, Brand Design, Brand Book & Kit.
     *
     * MARKTVERGLEICH IST DIE EINE AUSNAHME VON DER EIGENNAMEN-REGEL, und zwar
     * dieselbe wie beim Slug: „Marktvergleich"/„Market Comparison" ist kein
     * Eigenname, sondern ein Wort — Davids Entscheidung b vom 2026-09-09
     * übersetzt genau dieses eine (und „Produkte"). Die vier anderen heissen
     * in beiden Sprachen gleich.
     *
     * `descriptionKey` ist seit PS1 Teil des Vertrags (core/shared/types/
     * chrome.ts) und wird von `pnpm check:i18n-keys` gedeckt.
     *
     * `insights` fehlt weiterhin bewusst: die Seite gibt es noch nicht, und
     * ein Registry-Eintrag ist ein Menüpunkt, der sofort erscheint (Davids
     * 404-Audit 2026-09-03). Ebenso fehlen Brand Experience und Brand
     * Monitoring: sie stehen als abgeblendete „kommt"-Karten auf der
     * Übersicht, haben aber keine Seite (Plan §3).
     *
     * `order` 11–15 hält die fünf beieinander und in der Reihenfolge des
     * Kundenwegs (Audit → Build → Compare → Build → Supply); die nächsten
     * Zehner bleiben für weitere Hauptpunkte frei.
     */
    chrome: {
      nav: {
        products: { labelKey: 'brand.nav.products', to: '/products', order: 10 },
        'brand-check': {
          labelKey: 'brand.nav.brandCheck',
          descriptionKey: 'brand.nav.product.score',
          icon: 'i-ph-gauge',
          to: '/products/brand-check',
          parent: 'products',
          order: 11,
        },
        'brand-foundation': {
          labelKey: 'brand.nav.foundation',
          descriptionKey: 'brand.nav.product.wizard',
          icon: 'i-ph-compass',
          to: '/products/brand-foundation',
          parent: 'products',
          order: 12,
        },
        'market-comparison': {
          labelKey: 'products.nav.marketComparison',
          descriptionKey: 'brand.nav.product.benchmark',
          icon: 'i-ph-scales',
          to: '/products/market-comparison',
          parent: 'products',
          order: 13,
        },
        'brand-design': {
          labelKey: 'products.nav.brandDesign',
          descriptionKey: 'brand.nav.product.design',
          icon: 'i-ph-palette',
          to: '/products/brand-design',
          parent: 'products',
          order: 14,
        },
        'brand-book-kit': {
          labelKey: 'products.nav.brandBookKit',
          descriptionKey: 'brand.nav.product.book',
          icon: 'i-ph-package',
          to: '/products/brand-book-kit',
          parent: 'products',
          order: 15,
        },
      },
    },
    /**
     * BILDER LESEN (Brand Design, Vorbilder-Lesung — docs/archiv/BRAND-DESIGN.md
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
    /**
     * DER REDAKTIONELLE BEREICH GEHÖRT AUF DIESE SITE (BI1 I1, 2026-09-09 —
     * Plan docs/plans/BRAND-INSIGHTS.md §11 Frage 1: „eigener Layer, KEINE
     * eigene Site — es lebt auf branding.supply").
     *
     * Der Layer-Default ist `false` und bleibt es (Begründung dort): die
     * Redaktion ist ein BETREIBER-Produkt, und die Site sagt mit dieser Zeile
     * ausdrücklich Ja. Damit steht an EINER Stelle, wer diesen Bereich
     * betreibt — bei einer zweiten Brand-Site wäre das eine echte
     * Entscheidung und keine Nebenwirkung des `extends`.
     *
     * ── DER SCHALTER STEHT SCHON AUF `true`, OBWOHL I1 NICHTS ZEIGT ──────
     * Anders als beim Marktvergleich daneben, wo das `true` erst NACH der
     * Prod-Migration kam — und aus einem Grund, der die Regel nicht bricht,
     * sondern sie einhält: I1 baut KEINE Route und KEINE Seite. Es gibt
     * nichts, was dieser Schalter sichtbar machen könnte, und deshalb auch
     * nichts, was ohne Tabelle in einen Fehler liefe. Was der Schalter
     * bewirkt, entsteht mit I2/I3 — und bis dahin ist er die Aussage „diese
     * Site betreibt die Redaktion", nicht „die Redaktion ist offen".
     *
     * Die REIHENFOLGE bleibt trotzdem unverändert: die Prod-Migrationen
     * insights-001…003 gehören VOR den Code-Deploy von I2, und ihr Gate ist
     * Davids Ja (CLAUDE.md). Rückweg ohne Deploy: der Runtime-Kill
     * `app_config.products.insights.enabled = false` (Produkt-Registry,
     * `apiPrefixes: ['/api/insights']`).
     *
     * EINE BEZAHL-SCHRANKE GIBT ES NICHT und soll es nicht geben: Insights
     * ist öffentlicher Inhalt, sein Zweck ist Reichweite (Entscheidung 9).
     */
    insights: {
      enabled: true,

      /**
       * DIE KURATIERTE KANALLISTE DES THEMENRADARS (BI1 I4, §9.6 Leitplanke c).
       *
       * ── WARUM SIE IN DER APP STEHT UND NICHT IM LAYER ──────────────────
       * Eine Kanalliste ist eine REDAKTIONELLE Entscheidung: wem hören wir zu?
       * Der Layer-Default ist bewusst leer — eine zweite Brand-Site soll nicht
       * über `extends` fremde Kanäle erben, ohne dass jemand sie ausgesucht
       * hat. Hier steht sie neben dem `enabled: true` derselben Site, und das
       * ist genau der Ort, an dem beide Entscheidungen zusammengehören.
       *
       * ── JEDE ID IST GEPRÜFT, KEINE IST GERATEN ─────────────────────────
       * Alle zwölf Kanal-Ids wurden am 2026-09-09 aus dem HTML der jeweiligen
       * Kanalseite gelesen (`"externalId":"UC…"` bzw. die kanonische
       * `youtube.com/channel/UC…`-Adresse) — beide Fundstellen stimmten je
       * Kanal überein. Das ist nicht Pedanterie: das erste naheliegende
       * Muster (`"channelId":"UC…"`) liefert auf einer Kanalseite den Kanal
       * eines EMPFOHLENEN Videos, nicht den der Seite; bei zwei der zwölf
       * Kanäle hätte es eine fremde Id ergeben. Ein Tippfehler oder eine
       * geratene Id kostet keinen Fehler, den man sieht — sie kostet einen
       * 404 je Lauf und einen Kanal, der still fehlt.
       *
       * MERKSATZ FÜR SPÄTERE ERGÄNZUNGEN: nur Ids aufnehmen, die auf der
       * Kanalseite selbst standen, mit Handle und Prüfdatum daneben. Ein
       * Handle (`@thefutur`) gehört NIE in `channelId` — `readInsightsRadarConfig`
       * wirft es still heraus, und dann fehlt der Kanal, ohne dass es auffällt.
       *
       * ── DAS `topic` IST DIE VORGABE, NICHT DAS URTEIL ──────────────────
       * Es sagt, wofür der Kanal im Normalfall steht. Der Titel eines
       * EINZELNEN Videos darf davon abweichen — die Schlagwortliste
       * (`insightsRadarClassify`) ordnet dann um, wenn sie es belegen kann.
       * Deshalb ist es kein Problem, dass hier zwei Cluster (`brand-analysis`
       * und `rebranding`) nur schwach vertreten sind: sie werden über die
       * Titel erreicht, nicht über einen eigenen Kanal.
       *
       * ── ZWÖLF UND NICHT FÜNFZIG ────────────────────────────────────────
       * Quota wäre kein Argument (zwölf Kanäle à 20 Videos = 18 der 10.000
       * Tageseinheiten; fünfzig wären 71). Das Argument ist die Redaktion: der
       * Radar soll eine Liste liefern, die ein Mensch am Morgen durchsieht.
       * Eine Liste, die niemand mehr liest, ist kein Signal.
       */
      radar: {
        channels: [
          // Marke & Strategie
          { channelId: 'UC-b3c7kxa5vU-bnmaROgvog', topic: 'brand-strategy', title: 'The Futur' }, // @thefutur, geprüft 2026-09-09
          { channelId: 'UCBFWrMRo37OVLM2l1pWnH7w', topic: 'brand-strategy', title: 'Brand Master Academy' }, // @BrandMasterAcademy, geprüft 2026-09-09
          { channelId: 'UCHzbxHV1205I4FlG5rFZsPg', topic: 'brand-psychology', title: 'Ogilvy' }, // @Ogilvy, geprüft 2026-09-09
          // Gestaltung & Identität
          { channelId: 'UCN7dywl5wDxTu1RM3eJ_h9Q', topic: 'visual-identity', title: 'Flux Academy' }, // @FluxAcademy, geprüft 2026-09-09
          { channelId: 'UCoeJKtPJLoIBqWq4o8TDLpA', topic: 'visual-identity', title: 'Satori Graphics' }, // @SatoriGraphics, geprüft 2026-09-09
          { channelId: 'UCIp9sEZiv36cDG7cEnrVU7Q', topic: 'visual-identity', title: 'Will Paterson' }, // @WillPatersonDesign, geprüft 2026-09-09
          { channelId: 'UCTXgprkT2GFY9eKZiz5Egew', topic: 'rebranding', title: 'Pentagram' }, // @PentagramDesign, geprüft 2026-09-09
          // Erlebnis & Sprache
          { channelId: 'UC2oCugzU6W8-h95W7eBTUEg', topic: 'brand-experience', title: 'Nielsen Norman Group' }, // @NNgroup, geprüft 2026-09-09
          { channelId: 'UC13ogyrw3DUgjlAIcWmWG3A', topic: 'brand-language', title: 'Marketing Examples' }, // @MarketingExamples, geprüft 2026-09-09
          // Sichtbarkeit
          { channelId: 'UCWquNQV8Y0_defMKnGKrFOQ', topic: 'seo-geo', title: 'Ahrefs' }, // @AhrefsCom, geprüft 2026-09-09
          { channelId: 'UCWf2ZlNsCGDS89VBF_awNvA', topic: 'seo-geo', title: 'Google Search Central' }, // @GoogleSearchCentral, geprüft 2026-09-09
          { channelId: 'UCj7v9UM1aGx6GR-nsY-9u8w', topic: 'seo-geo', title: 'Semrush' }, // @Semrush, geprüft 2026-09-09
        ],
      },
    },
  },
  ui: {},
})
