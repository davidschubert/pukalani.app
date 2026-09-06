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
    brand: { name: 'Branding Supply' },
    /**
     * „Anmelden mit Google" (Davids Auftrag 2026-09-03). Das ist der
     * DESIGN-Schalter (welche Anbieter, in welcher Reihenfolge); der Knopf
     * erscheint erst, wenn auch der BETRIEBS-Schalter der Site gesetzt ist
     * (`NUXT_PUBLIC_AUTH_OAUTH_PROVIDERS=google` in der Server-.env) UND das
     * Appwrite-Projekt `branding` einen Google-Client trägt — Rezept:
     * docs/runbooks/GOOGLE-LOGIN.md (Redirect-URI endet auf `/branding`).
     * Bis dahin ändert diese Zeile nichts Sichtbares; das ist Absicht.
     */
    auth: { providers: ['google'] },
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
