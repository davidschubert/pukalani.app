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
    admin: {
      /**
       * DIE BETREIBER-FLÄCHE DIESES LAYERS (2026-09-05) — bisher hatte `brand`
       * keinen einzigen Eintrag in der Dashboard-Registry, weil seine Seiten
       * (`/dashboard/brands/*`) KUNDEN-Fläche sind und über das
       * default-Layout laufen. Die Warteliste ist die erste Ausnahme: sie
       * verwaltet den Zugang zur Beta und gehört damit dem Betreiber.
       *
       * `scope: 'operator'` — dieselbe Aussage wie beim AI-Runner: auf einem
       * Mandanten-Host wäre das die Verwaltung einer fremden Plattform. Dass
       * `branding` gar keine Mandanten hat, ändert die richtige EBENE nicht.
       *
       * `users.manage` statt `sites.manage`: die Liste entscheidet, wer ein
       * Konto in dieser Beta bekommt — Sites gibt es hier keine (Begründung
       * ausführlich in `server/utils/brandWaitlistAdmin.ts`). Beide sind
       * ohnehin nur im Admin-Wildcard.
       *
       * `group: 'management'` (Betreiber-Werkzeuge), `order: 130` — der nächste
       * freie Zehner-Block nach der Vergabe-Regel in
       * `core/shared/dashboardNav.ts` (posts 10–40 … comments 110–120).
       *
       * KEIN `productKey`: das Produkt-Gate `brand` schaltet den WIZARD ab, und
       * genau dann muss die Warteliste erst recht erreichbar bleiben — sie ist
       * die Liste derer, die auf seine Öffnung warten.
       */
      modules: [
        {
          id: 'brand-waitlist',
          scope: 'operator',
          labelKey: 'brand.admin.waitlist.nav',
          icon: 'i-ph-list-checks',
          to: '/dashboard/waitlist',
          requiredCapability: 'users.manage',
          group: 'management',
          order: 130,
        },
        /**
         * DIE KORREKTUR-WARTESCHLANGE (2026-09-05, Plan §3b) — der zweite
         * Betreiber-Eintrag dieses Layers, und zwar direkt unter der
         * Warteliste (`order: 131`): beide sind Arbeitslisten desselben
         * Menschen, und zwischen ihnen gehört keine fremde Sache.
         *
         * Dieselbe Capability wie die Warteliste: `users.manage`. Sie ist die
         * Betreiber-Klammer dieses Layers — wer über den Beta-Zugang
         * entscheidet, entscheidet auch über eine falsch zugeordnete Branche.
         * Eine eigene Capability dafür wäre eine Rolle, die es hier nicht gibt.
         *
         * KEIN `productKey`, aus demselben Grund wie oben: das Produkt-Gate
         * `brand` schaltet den WIZARD ab, nicht die Pflichten, die aus einem
         * öffentlichen Ranking über fremde Auftritte folgen (§3 „Recht").
         */
        {
          id: 'brand-check-corrections',
          scope: 'operator',
          labelKey: 'brand.admin.checkCorrections.nav',
          icon: 'i-ph-chats-circle',
          to: '/dashboard/brand-check/corrections',
          requiredCapability: 'users.manage',
          group: 'management',
          order: 131,
        },
      ],
    },
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
      /**
       * DER INSTANZWEITE TAGES-DECKEL für echte KI-Generierungen (P2.1) —
       * Gesamtzahl über ALLE Konten, das Kosten-Netz des Betreibers. Zahl,
       * Begründung und die Prüfung stehen in `shared/brandAiLimits.ts`
       * (`resolveBrandAiInstanceCap`): nur eine ganze Zahl > 0 gilt, alles
       * andere fällt auf den Default zurück. AUSSCHALTEN geht hierüber
       * BEWUSST nicht — dafür gibt es `app_config.brandAiEnabled`, und nur
       * dort sagt die Oberfläche auch den richtigen Satz dazu.
       */
      aiDailyInstanceCap: 1000,
      /**
       * DAS MODELL DER STUFE 1 DES SPEZIALISTEN (BW2 Paket 4, Plan §7/§13).
       *
       * ── WARUM ES DIESEN SCHLÜSSEL GIBT UND KEINEN FÜR STUFE 2 ───────────
       * Davids Entscheidung vom 2026-09-04 ist ZWEISTUFIG: Stufe 1 prüft jede
       * geschlossene Session mit einem günstigen Modell, Stufe 2 schaut nur
       * dort genau hin, wo Stufe 1 einen Konflikt vermutet — und zwar mit dem
       * GEORGE-Modell. Für Stufe 2 gibt es deshalb bewusst KEINEN eigenen
       * Schalter: zwei getrennt einstellbare Urteile driften auseinander, und
       * der teure Blick soll derselbe sein, der auch die Entwürfe schreibt
       * (`getEffectiveAiConfig()`: app_config.aiModel > pukalani.ai.model).
       *
       * ── WARUM DER DEFAULT DERSELBE STRING IST WIE DER CORE-DEFAULT ──────
       * `anthropic/claude-haiku-4.5` ist das EINZIGE Modell, das dieses
       * Projekt je durch die ZDR-Bedingungen des Wizards geschickt hat
       * (`BRAND_PROVIDER_ROUTING`: zdr, dataCollection deny, keine
       * Ausweich-Anbieter) — und damit das einzige, von dem wir wissen, dass
       * es unter ihnen erreichbar ist. Ein billigeres Modell hier
       * hineinzuschreiben, ohne es gegen diese Bedingungen geprüft zu haben,
       * wäre eine Behauptung: „allowFallbacks: false" macht daraus keinen
       * langsameren Lauf, sondern gar keinen.
       *
       * Der Schlüssel steht trotzdem GETRENNT da und zeigt nicht einfach auf
       * die George-Kette: hebt der Betreiber `app_config.aiModel` auf ein
       * teures Modell an (weil Georges Entwürfe besser werden sollen), bleibt
       * Stufe 1 hier stehen, wo sie steht. Genau dafür ist die Trennung da.
       */
      ai: { reviewModel: 'anthropic/claude-haiku-4.5' },
      /**
       * WOHIN DIE WARTELISTE MELDET — die Adresse des Betreibers, an die
       * `POST /api/brand/waitlist` eine neue Anfrage schickt.
       *
       * LEER ist der Default und heißt „keine Mail": die Zeile steht dann
       * trotzdem in `brand_waitlist`, sie holt sich nur niemand ab. Ein
       * erfundener Standard-Empfänger (`hallo@…`) wäre schlimmer als keiner —
       * eine Zustellung ins Nichts sieht wie eine Zustellung aus.
       *
       * Sie steht als CONFIG und nicht in der Env, weil sie kein Geheimnis ist
       * und je App verschieden sein darf; `apps/branding` setzt sie bewusst
       * NICHT — David trägt sie ein, wenn er benachrichtigt werden will. Ein
       * Mail-Fehler ändert die Antwort der Route nie (fail-soft).
       */
      waitlistNotify: '',
    },
  },
})
