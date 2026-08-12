/**
 * analytics meldet seine Einstiege bei der Reiter-Registry des
 * Community-Hubs an (pukalani.admin.communityTabs, deep-merged) —
 * capability-gefiltert (A14).
 *
 * ZWEI REITER, ZWEI FRAGEN: „Statistiken" zeigt die Zahlen, „Analytics" stellt
 * die Messung ein. Beide hängen an derselben Capability und demselben Produkt —
 * getrennt sind sie, weil man das eine täglich anschaut und das andere einmal
 * einstellt.
 *
 * Bis F51 (2026-08-07) war das ein Sidebar-Modul in der Gruppe
 * „Settings · Community". Der Eintrag in `pukalani.admin.modules` ist
 * ersatzlos weg: die Statistik ist eine Einstellung DIESER Community, kein
 * eigenes Produkt mit Inhalten, und Davids Hub ist der EINE Ort dafür.
 */
export default defineAppConfig({
  pukalani: {
    admin: {
      communityTabs: [
        {
          /**
           * BEWUSST OHNE `planProduct`: die anderen Tarif-gebundenen Einträge
           * (Beiträge, Events, Kurse) verschwinden, weil dahinter eine ganze
           * Arbeitsfläche liegt, die es für diesen Kunden nicht gibt. Hier
           * liegt ein einziges Feld — und die Antwort auf „warum sehe ich
           * keine Zahlen?" gehört auf DIESE Seite, nicht in ein leeres Menü.
           * Der Reiter bleibt also, die Seite sagt „ab Personal" und die
           * Route bleibt trotzdem zu (`requirePlanProduct`).
           *
           * `productKey` ist dagegen mit umgezogen — der Betreiber-Schalter
           * soll den Reiter genauso verschwinden lassen wie vorher den
           * Menüpunkt.
           */
          id: 'analytics',
          scope: 'community',
          productKey: 'analytics',
          labelKey: 'admin.nav.analytics',
          icon: 'i-ph-chart-line-up',
          to: '/dashboard/community/analytics',
          requiredCapability: 'community.analytics',
          order: 80,
        },
        {
          /**
           * DIE ZAHLEN, nicht die Einstellung — deshalb ein EIGENER Reiter und
           * kein weiterer Kasten auf der Seite daneben: der Owner kommt fast
           * immer zum Schauen und fast nie zum Umstellen, und wer schauen will,
           * soll nicht erst an einem Schalter vorbei.
           *
           * ORDNUNG 79 = DAVOR. Der Reiter mit dem Inhalt steht vor dem mit dem
           * Schalter; die Einstellungs-Seite behält ihre 80 und damit ihre
           * Adresse (sie ist von Links und Lesezeichen erreichbar).
           *
           * `planProduct` fehlt aus demselben Grund wie beim Eintrag darüber:
           * die Antwort auf „warum sehe ich keine Zahlen?" gehört auf DIESE
           * Seite (sie sagt „ab Personal"), nicht in ein leeres Menü. Die Route
           * bleibt trotzdem zu (`requirePlanProduct`).
           */
          id: 'analytics-statistics',
          scope: 'community',
          productKey: 'analytics',
          labelKey: 'admin.nav.statistics',
          icon: 'i-ph-squares-four',
          to: '/dashboard/community/statistics',
          requiredCapability: 'community.analytics',
          order: 79,
        },
      ],
    },
  },
})
