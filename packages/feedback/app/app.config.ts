/**
 * feedback meldet zwei Dinge an: den schwebenden Feedback-Knopf (Chrome-
 * Registry) und den Dashboard-Abschnitt „Customer Feedback" (Admin-Modul-
 * Registry) — beides deep-merged, das Layout rendert gefiltert (A14).
 */
export default defineAppConfig({
  pukalani: {
    // Chrome-Registry (S9): der schwebende Feedback-Knopf (fixed unten links)
    // — Zone 'overlay', gehört semantisch nicht in die Header-Nav. Er sitzt
    // laut Plan auf JEDER Community- und Website-Seite.
    chrome: {
      utilities: {
        feedback: { component: 'FeedbackButton', order: 10, zone: 'overlay' },
      },
    },
    admin: {
      modules: [
        {
          /**
           * DAVIDS NAVIGATION (Plan § Navigation):
           *   Management → Customer Feedback → { Feedback · Roadmap · Changelog }
           *
           * EBENE 'account', und das ist eine bewusste Abweichung von der
           * Faustregel „eine Gruppe mischt keine Ebenen": der Feedback-Bereich
           * ist laut Plan „Bestandteil ALLER Dashboards, nicht nur des
           * Betreiber-Dashboards" — dort wird gewählt und kommentiert. Wäre er
           * 'operator', verschwände er auf jedem Mandanten-Host und damit
           * genau dort, wo die Stimmen entstehen sollen. Wäre er 'community',
           * fehlte er im Kundenbereich und beim Betreiber.
           *
           * Die GRUPPE bleibt trotzdem 'management', weil David sie so
           * gezeichnet hat. Auf einem Mandanten-Host steht dort dann dieser
           * eine Eintrag — kein Leck: die Betreiber-Werkzeuge derselben Gruppe
           * (Board) tragen 'operator' und verschwinden weiterhin.
           *
           * Der CHANGELOG-Unterpunkt ist der Menü-Umzug aus dem Plan: die
           * SEITE bleibt, wo sie ist (/dashboard/admin/changelog, admin-Layer),
           * nur ihr Eintrag zieht hierher — „was in Complete landet, ist genau
           * das, was dort verkündet wird". Seine eigene Capability
           * (changelog.manage) sorgt dafür, dass ihn nur der Betreiber sieht;
           * N7 (öffentlicher Changelog 404 auf Mandanten-Hosts) ist davon
           * unberührt, das hier ist die Verwaltungsseite.
           */
          id: 'customer-feedback',
          scope: 'account',
          productKey: 'feedback',
          labelKey: 'feedback.nav.section',
          icon: 'i-ph-megaphone-simple',
          to: '/dashboard/feedback',
          requiredCapability: 'dashboard.access',
          // U7/G8 (2026-08-11): GRUPPE `account` statt `management`. Die Ebene
          // ('account' = überall, für jeden Angemeldeten) ist unverändert —
          // Davids E10-Entscheidung bleibt unangetastet. Falsch war nur die
          // Schublade: ein Mitglied einer Kunden-Community sah eine Gruppe
          // „Management" mit genau diesem einen Eintrag darin und konnte
          // nichts managen. Beim BETREIBER steht der Punkt weiterhin an
          // derselben Stelle, weil die neue Gruppe direkt hinter „Management"
          // einsortiert ist (packages/admin/app/layouts/dashboard.vue).
          group: 'account',
          order: 10,
          children: [
            { id: 'customer-feedback-list', labelKey: 'feedback.nav.feedback', icon: 'i-ph-chats-circle', to: '/dashboard/feedback', exact: true },
            { id: 'customer-feedback-roadmap', labelKey: 'feedback.nav.roadmap', icon: 'i-ph-map-trifold', to: '/dashboard/roadmap' },
            { id: 'customer-feedback-changelog', labelKey: 'feedback.nav.changelog', icon: 'i-ph-megaphone', to: '/dashboard/admin/changelog', requiredCapability: 'changelog.manage' },
          ],
        },
      ],
    },
  },
})
