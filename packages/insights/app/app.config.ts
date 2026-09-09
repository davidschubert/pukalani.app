/**
 * Die Config-FORM von Brand Insights. Sie liegt in `app/` und nicht im
 * Package-Root — dort wird eine `app.config.ts` stillschweigend ignoriert.
 *
 * ── WARUM DER DEFAULT `false` IST ───────────────────────────────────────
 * „Core-Default ist immer aus" gilt hier ohne Ausnahme: die Redaktion ist ein
 * BETREIBER-Produkt — eine App, die den Layer montiert, sagt mit einer eigenen
 * Zeile Ja (`apps/branding/app/app.config.ts`). Genau dort sieht man, WER
 * diesen Bereich betreibt. Seit I2 hängt am selben Schalter auch der
 * Nav-Eintrag unten (`configFlag: 'insights.enabled'`): ohne das Ja der App
 * gibt es keinen Menüpunkt.
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

    admin: {
      /**
       * DIE REDAKTION IM DASHBOARD (BI1 I2, §9.4) — der erste und einzige
       * Nav-Eintrag dieses Layers.
       *
       * `scope: 'operator'` (PFLICHT, kein Default): die Redaktion ist
       * Betreiber-Sache. Auf einem Mandanten-Host gäbe es sie nicht — dass
       * `branding` ein Silo ist und der Eintrag dort immer steht, ist die
       * Folge, nicht die Ausnahme.
       *
       * `productKey: 'insights'` — anders als die drei Betreiber-Listen des
       * brand-Layers (Warteliste, Korrekturen, Gespräche) trägt dieser Eintrag
       * den Produkt-Schlüssel: hinter ihm liegt DAS PRODUKT selbst und nicht
       * eine Pflicht, die es überlebt. Die Notabschaltung
       * (`app_config.products.insights.enabled = false`) lässt `/api/insights/**`
       * 404 antworten — ein Menüpunkt, der auf lauter 404 zeigt, ist eine
       * kaputte Navigation.
       *
       * `configFlag: 'insights.enabled'` — die App muss Ja gesagt haben. Der
       * Layer-Default ist `false` (s. oben), und ohne diesen Riegel erschiene
       * der Eintrag in JEDER App, die den Layer montiert, auch bevor sie ihn
       * betreibt. Fail-closed: unbekannter Pfad oder etwas anderes als `true`
       * ⇒ kein Eintrag.
       *
       * `order: 133` schliesst an die drei brand-Listen (130–132) an: sie
       * gehören demselben Menschen, und zwischen sie gehört nichts Fremdes.
       *
       * `children` führt Liste UND Radar auf: der Radar ist eine eigene
       * Adresse (§11.2 Frage 3, „drei Adressen"), und ohne Unterpunkt käme man
       * nur über einen Link in der Liste dorthin. Die Modul-Seite steht als
       * erster Unterpunkt mit `exact` — sonst wäre sie auf jeder Unterseite
       * mit-aktiv.
       */
      modules: [
        {
          id: 'insights',
          scope: 'operator',
          productKey: 'insights',
          configFlag: 'insights.enabled',
          labelKey: 'insights.admin.nav',
          icon: 'i-ph-newspaper',
          to: '/dashboard/insights',
          requiredCapability: 'insights.manage',
          group: 'management',
          order: 133,
          children: [
            { id: 'insights-posts', labelKey: 'insights.admin.navPosts', to: '/dashboard/insights', exact: true },
            { id: 'insights-radar', labelKey: 'insights.admin.navRadar', to: '/dashboard/insights/radar' },
          ],
        },
      ],
    },
  },
})
