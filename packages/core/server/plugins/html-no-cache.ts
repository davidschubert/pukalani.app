/**
 * SSR-HTML IST NIE CACHEBAR — jetzt steht es auch im Header (U14-Livefund,
 * 2026-08-20).
 *
 * Der Grundsatz war längst beschlossen („kein SSR-Seiten-SWR: Session-State
 * steckt im HTML", Microcache-Regeln im Core), aber kein Header hat ihn je
 * durchgesetzt: die Seiten gingen OHNE `Cache-Control` raus, und ohne Header
 * darf ein Browser HEURISTISCH cachen. Gefunden beim ersten echten
 * Google-Login: der OAuth-Callback setzt das Session-Cookie und leitet auf
 * `/` um — der Browser bediente das Redirect-Ziel aus seinem Cache und
 * zeigte die GAST-Fassung der Startseite. Der frisch angemeldete Mensch sah
 * „Anmelden" statt seines Profils, bis er von Hand neu lud. Kein Auth-Fehler,
 * ein Cache-Fehler — die Session war da, nur das HTML war alt.
 *
 * `no-cache` (nicht `no-store`): die Seite DARF im Cache liegen, muss aber
 * vor jeder Wiederverwendung beim Server nachfragen — genau die Semantik für
 * personalisiertes HTML. `??=` lässt bewusst jede Route gewinnen, die ihren
 * Cache-Header selbst setzt.
 *
 * Der Haken sitzt am RENDER-Hook und trifft damit NUR SSR-Seiten: API-Routen
 * (eigene Cache-Entscheidungen, Microcache) und `/_nuxt/*`-Assets (immutable
 * gecacht, hashed) laufen hier nie durch.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    response.headers ??= {}
    response.headers['cache-control'] ??= 'no-cache'
  })
})
