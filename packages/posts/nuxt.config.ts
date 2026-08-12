/**
 * Produkt Layer: Community-Feed (Posts, Polls, Questions) — Member-Content,
 * Plan: docs/archiv/COMMUNITY-POSTS.md. Eigenes Datenmodell (community_posts,
 * poll_votes — Regel 3: eigene Tables, niemals Core). Antworten liefert der
 * comments-Layer via targetType 'post' — komponiert in der APP (A14), hier
 * KEIN comments-Import. Extended den Core NICHT selbst.
 */
export default defineNuxtConfig({
  /**
   * ALT-URLS. Je ZWEIMAL, weil die i18n-Strategie `prefix_except_default`
   * heißt: `en` ist ohne Prefix erreichbar, `de` unter `/de/*`. Eine routeRule
   * kennt keine Locales — sie sieht nur den Pfad.
   *
   *  - `/community` → `/feed` (Rename 2026-07-19): Bookmarks und Alt-Links in
   *    Bestandsdaten (Notification-/Activity-Rows, targetUrl).
   *  - `/dashboard/discussions` → `/dashboard/categories` und
   *    `/dashboard/discussion-leaders` → `/dashboard/trust-levels` (U8/G4,
   *    2026-08-11): zwei Adressen, deren Segmente in keiner Oberfläche
   *    vorkamen. `discussion-leaders` war überdies eine Wortneuschöpfung —
   *    die Seite heißt „Vertrauensstufen", die Sache heißt in
   *    communityAuthz.ts `posts.appoint`.
   */
  routeRules: {
    '/community': { redirect: { to: '/feed', statusCode: 301 } },
    '/de/community': { redirect: { to: '/de/feed', statusCode: 301 } },
    '/dashboard/discussions': { redirect: { to: '/dashboard/categories', statusCode: 301 } },
    '/de/dashboard/discussions': { redirect: { to: '/de/dashboard/categories', statusCode: 301 } },
    '/dashboard/discussion-leaders': { redirect: { to: '/dashboard/trust-levels', statusCode: 301 } },
    '/de/dashboard/discussion-leaders': { redirect: { to: '/de/dashboard/trust-levels', statusCode: 301 } },
  },
  // Eigene Layer-Strings — mergen mit Core- und App-Locales (gleiche codes)
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
