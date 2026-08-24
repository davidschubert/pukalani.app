/**
 * Produkt Layer: Onboarding — der öffentliche Trichter „Community in 60
 * Sekunden" (SAAS-ROADMAP #1). Lebt NUR in apps/platform und dort nur auf den
 * KONTROLL-Hosts (pukalani.tenancy.controlHosts, z. B. account.pukalani.app): dort gibt
 * es bewusst keinen Mandanten, weil hier erst einer entsteht.
 *
 * BESITZT KEINE Appwrite-Tables. Alles, was entsteht, gehört dem Control Plane
 * (communities/community_members) und wird über die auditierte Service-Naht
 * dort angelegt (POST /api/control/onboarding/site) — dieser Layer hält
 * ausschließlich die Oberfläche und den Aufruf.
 */
export default defineNuxtConfig({
  runtimeConfig: {
    // server-only! Dasselbe Geheimnis wie NUXT_CONTROL_ONBOARDING_SECRET im
    // Control Plane. Leer = der Trichter antwortet 503 (Fehlkonfiguration
    // sichtbar machen, statt still eine kaputte Seite zu zeigen).
    onboardingServiceSecret: '',
    // Basis-URL des Control Plane (z. B. https://admin.pukalani.app).
    // Leer = 503. Env: NUXT_ONBOARDING_CONTROL_URL
    onboardingControlUrl: '',
  },

  /**
   * ALT-PFADE DES COMMUNITY-HUBS (F51, 2026-08-07). Fünf Flächen dieses Layers
   * sind an einen Ort gezogen; die alten Adressen stehen in Lesezeichen, in
   * verschickten Mails (`PAST_DUE_NOTICE_LINK`) und — der teuerste Fall — in
   * bereits eröffneten Stripe-Checkout-Sitzungen, deren Rücksprung-URL beim
   * Anlegen eingefroren wurde. Ein 301 kostet nichts und fängt alle drei.
   *
   * JE ZWEIMAL, weil die i18n-Strategie `prefix_except_default` heißt: `en` ist
   * ohne Prefix erreichbar, `de` unter `/de/*`. Eine routeRule kennt keine
   * Locales — sie sieht nur den Pfad, und der ist ein anderer.
   *
   * Nitro-seitig, also nur für echte Requests (Lesezeichen, Rücksprünge). Für
   * die Navigation IM Dashboard gibt es die alten Pfade nirgends mehr; jeder
   * interne Verweis wurde mit umgezogen.
   */
  routeRules: {
    '/dashboard/settings/community': { redirect: { to: '/dashboard/community', statusCode: 301 } },
    '/de/dashboard/settings/community': { redirect: { to: '/de/dashboard/community', statusCode: 301 } },
    '/dashboard/branding': { redirect: { to: '/dashboard/community/branding', statusCode: 301 } },
    '/de/dashboard/branding': { redirect: { to: '/de/dashboard/community/branding', statusCode: 301 } },
    /**
     * DIE MITGLIEDER ZIEHEN ZUM ZWEITEN MAL — und wieder dorthin zurück, wo sie
     * herkamen. Die Kette in einer Zeile: bis F51 `/dashboard/members`, dann
     * (2026-08-07) als Reiter des Community-Hubs
     * `/dashboard/community/members`, seit dem 2026-08-23 (Davids Entscheidung:
     * Mitglieder stellt man nicht ein, man blättert sie durch) wieder
     * `/dashboard/members`. Die Regel darüber lief bis heute in die
     * GEGENRICHTUNG; sie ist ersetzt, nicht ergänzt — zwei Regeln über Kreuz
     * wären eine Schleife.
     *
     * JE ZWEI ZEILEN PRO SPRACHE, weil eine routeRule Kind-Pfade NICHT
     * mitnimmt: die Schlüssel sind statisch, `/dashboard/community/members/map`
     * und `/dashboard/community/members/<id>` liefen ohne die `/**`-Regel ins
     * 404. Die Wildcard-Regel hängt den Rest-Pfad an das Ziel an (Nitro
     * schneidet dafür die Basis des Schlüssels ab) — `.../members/map` landet
     * also auf `/dashboard/members/map`. Der exakte Schlüssel bleibt trotzdem
     * stehen: ob `/**` auch null Segmente trifft, hängt am Router und ist keine
     * Zusage, auf die man eine 301 stellt.
     */
    '/dashboard/community/members': { redirect: { to: '/dashboard/members', statusCode: 301 } },
    '/dashboard/community/members/**': { redirect: { to: '/dashboard/members/**', statusCode: 301 } },
    '/de/dashboard/community/members': { redirect: { to: '/de/dashboard/members', statusCode: 301 } },
    '/de/dashboard/community/members/**': { redirect: { to: '/de/dashboard/members/**', statusCode: 301 } },
    '/dashboard/settings/domain': { redirect: { to: '/dashboard/community/domain', statusCode: 301 } },
    '/de/dashboard/settings/domain': { redirect: { to: '/de/dashboard/community/domain', statusCode: 301 } },
    '/dashboard/settings/subscription': { redirect: { to: '/dashboard/community/plan', statusCode: 301 } },
    '/de/dashboard/settings/subscription': { redirect: { to: '/de/dashboard/community/plan', statusCode: 301 } },
    /**
     * DIE ZWEI DEUTSCHEN SPRACHPFADE (U8, Trichter-Befund M5, 2026-08-11).
     * Der Kundenbereich lokalisiert seine Adressen nicht mehr; beide Seiten
     * heißen jetzt in beiden Sprachen englisch (Begründung an den Seiten).
     *
     * Hier steht NUR die `/de/`-Zeile, und das ist kein vergessenes Paar: mit
     * `prefix_except_default` gab es `/request-access` (en) und `/de/anfragen`
     * (de) — ein unprefixtes `/anfragen` hat es NIE gegeben. Eine Regel dafür
     * wäre eine Weiterleitung von einer Adresse, die nie jemand hatte.
     */
    '/de/anfragen': { redirect: { to: '/de/request-access', statusCode: 301 } },
    '/de/missbrauch-melden': { redirect: { to: '/de/report-abuse', statusCode: 301 } },
  },

  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
