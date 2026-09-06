/**
 * Die Config-FORM des Marktvergleichs. Sie liegt in `app/` und nicht im
 * Package-Root — dort wird eine `app.config.ts` stillschweigend ignoriert.
 *
 * ── WARUM DER DEFAULT HIER `false` BLEIBT UND IM brand-LAYER `true` IST ───
 * Der brand-Layer argumentiert (zu Recht): „wer den Layer extended, hat ihn
 * genau deshalb extended". Für `market` gilt das AUCH NACH M1 nicht: der
 * Layer ist ab jetzt zwar montiert (`apps/branding`), aber hinter dem
 * Schalter liegt bis M2/M4 keine Route und keine Seite — und die Schranke
 * davor ist ohnehin eine ZUTEILUNG (§1.9 „frei bauen, bezahlt anwenden"),
 * kein Deployment-Schalter. Ein Default `true` versprächen also zwei Dinge,
 * die es noch nicht gibt: ein sichtbares Produkt und einen bezahlten Zugang.
 * Die App sagt deshalb ausdrücklich Ja (`apps/branding/app/app.config.ts`),
 * und das ist genau die Stelle, an der man später sieht, WER dieses Produkt
 * anbietet.
 *
 * DIE ZWEITE UND DRITTE STUFE stehen bewusst NICHT hier, weil sie zur Laufzeit
 * umgelegt werden müssen (dasselbe Muster wie beim brand-Layer): die
 * Produkt-NOTABSCHALTUNG ist `app_config.products.market.enabled = false`
 * (der generische Runtime-Kill über die Produkt-Registry — er braucht keine
 * eigene Zeile Code, nur den Manifest-Schlüssel `market`), die
 * BEZAHL-Schranke ist eine Zuteilung — sie entscheidet je Branding und nie je
 * Deployment.
 */
export default defineAppConfig({
  pukalani: {
    market: {
      enabled: false,
    },
  },
})
