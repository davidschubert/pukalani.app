/**
 * Die Config-FORM des Marktvergleichs. Sie liegt in `app/` und nicht im
 * Package-Root — dort wird eine `app.config.ts` stillschweigend ignoriert.
 *
 * ── WARUM DER DEFAULT HIER `false` IST UND IM brand-LAYER `true` ──────────
 * Der brand-Layer argumentiert (zu Recht): „wer den Layer extended, hat ihn
 * genau deshalb extended". Für `market` gilt das HEUTE nicht — der Layer ist
 * ein PROTOTYP, keine App montiert ihn (`apps/branding/site.manifest.ts`
 * bekommt ihn erst mit M1), und hinter dem Schalter liegt noch keine Route
 * und keine Tabelle. Ein Default `true` verspräche also ein Produkt, das es
 * nicht gibt. Mit M1 entscheidet die Umsetzung neu.
 *
 * DIE ZWEITE UND DRITTE STUFE stehen bewusst NICHT hier, weil sie zur Laufzeit
 * umgelegt werden müssen (dasselbe Muster wie beim brand-Layer): die
 * Produkt-NOTABSCHALTUNG wird `app_config.products.market.enabled = false`,
 * die BEZAHL-Schranke ist eine Zuteilung, keine Config — sie entscheidet je
 * Branding und nie je Deployment (§1.9).
 */
export default defineAppConfig({
  pukalani: {
    market: {
      enabled: false,
    },
  },
})
