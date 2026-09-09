/**
 * Die Config-FORM von Brand Insights. Sie liegt in `app/` und nicht im
 * Package-Root — dort wird eine `app.config.ts` stillschweigend ignoriert.
 *
 * ── WARUM DER DEFAULT `false` IST ───────────────────────────────────────
 * „Core-Default ist immer aus" gilt hier ohne Ausnahme: hinter dem Schalter
 * liegt im Stand I0 keine Route und keine Seite, und die Redaktion ist ein
 * BETREIBER-Produkt — eine App, die den Layer montiert, sagt mit einer
 * eigenen Zeile Ja (`apps/branding/app/app.config.ts`, ab I1). Genau dort
 * sieht man später, WER diesen Bereich betreibt.
 *
 * Die zweite Stufe steht bewusst NICHT hier, weil sie zur Laufzeit umgelegt
 * werden muss: die Produkt-NOTABSCHALTUNG ist
 * `app_config.products.insights.enabled = false` (die Produkt-Registry über
 * den Manifest-Schlüssel `insights`, ohne eine Zeile Code hier).
 *
 * EINE BEZAHL-SCHRANKE GIBT ES NICHT und soll es nicht geben: Insights ist
 * öffentlicher Inhalt, sein Zweck ist Reichweite (Entscheidung 9). Bezahlt
 * wird, was der Leser danach tut (Brand-Check, Wizard).
 */
export default defineAppConfig({
  pukalani: {
    insights: {
      enabled: false,
    },
  },
})
