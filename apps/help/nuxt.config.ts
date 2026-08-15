export default defineNuxtConfig({
  // Öffentliche Hilfe-Site für Community-Betreiber (Ziel-Host
  // help.pukalani.app — Annahme, siehe site.manifest.ts; heute Dev-only).
  // Bewusst NUR das Fundament (core + system) — kein admin/themes/comments:
  // die Seite ist öffentlich, liest nichts aus Appwrite und rendert
  // ausschließlich Markdown aus `content/`. Das Fundament liefert trotzdem
  // Fehlerseite (CoreErrorPage), Security-Header, Rate-Limits und i18n.
  extends: ['../../packages/core', '../../packages/system'],

  // @nuxt/ui, @pinia/nuxt und @nuxtjs/i18n kommen aus dem Core-Layer.
  modules: ['@nuxt/content'],

  // Port pro App eindeutig (3001 comments · 3002 template · 3003 photos ·
  // 3004 control · 3005 portfolio · 3006 platform · 3007 marketing).
  // 3005 war in der Tagesliste genannt, ist aber von portfolio belegt.
  devServer: {
    port: 3008,
  },

  /**
   * KEINE routeRules mehr für `/anleitung/produkte/diskussionen`.
   *
   * Die Seite über den Kommentar-Baustein hieß bis zum 2026-08-04
   * „Diskussionen"; die Umbenennung nach `/anleitung/produkte/kommentare` ließ
   * am selben Tag einen 301 auf dem alten Pfad zurück. Wenige Stunden später
   * bekam das ECHTE Produkt Discussions seine Hilfe-Seite — und die gehört
   * laut Davids Entscheidung genau dorthin.
   *
   * Beides gleichzeitig geht nicht: eine routeRule gewinnt gegen die Seite, der
   * 301 hätte die neue Seite unerreichbar gemacht. Die Wahl fiel auf die Seite,
   * weil der Pfad den ZUTREFFENDEN Inhalt tragen soll — der Umweg war einen
   * halben Tag alt, die interne Verlinkung zeigt längst auf `kommentare`, und
   * wer über einen alten externen Link hereinkommt, findet oben auf der neuen
   * Seite einen Hinweis samt Link auf die Kommentare. Ein 301 auf eine Adresse,
   * unter der seither ein anderes Produkt erklärt wird, wäre die schlechtere
   * Lüge.
   */

  content: {
    build: {
      markdown: {
        toc: { searchDepth: 1 },
      },
    },
    experimental: {
      // node:sqlite (Node 22.5+) — kein nativer better-sqlite3-Build nötig
      sqliteConnector: 'native',
    },
  },

  /**
   * Hausmuster 'prefix_except_default' — seit 2026-08-15, mit ÜBERSETZTEN
   * Inhalten. Vorher stand hier `no_prefix` mit der Begründung, es gebe die
   * Hilfe nur auf Deutsch, und mit dem ausdrücklichen Vermerk: „Sobald echte
   * englische Inhalte dazukommen, MUSS diese Site auf 'prefix_except_default'
   * zurückgeführt werden (sonst wäre EN unsichtbar für Suchmaschinen)." Genau
   * das ist jetzt der Fall.
   *
   * WARUM DIE UMSTELLUNG NÖTIG WAR, nicht nur schöner: mit `no_prefix` trägt
   * jede Sprache dieselbe URL. Der Leser bekam die Oberfläche in seiner
   * Browsersprache, den INHALT aber immer auf Deutsch — und `<html lang>`
   * stand auf `en-US` über deutschem Text (2026-08-14 auf help.pukalani.app
   * gemessen: englische Kopfzeile, deutsche Seitenleiste, deutscher Artikel).
   * Das ist nicht nur unschön: Screenreader sprechen den Text dann mit
   * englischer Aussprache, und Übersetzungsdienste lassen ihn in Ruhe, weil
   * die Seite behauptet, er sei schon englisch.
   *
   * `defaultLocale: 'de'` BLEIBT — anders als im übrigen Monorepo, wo Englisch
   * die Vorgabe ist. Grund ist hier kein Geschmack, sondern Bestand: die
   * deutschen Seiten liegen seit Monaten unter `/anleitung/...`, sind
   * verlinkt und indexiert. Mit englischer Vorgabe zögen sie nach
   * `/de/anleitung/...` und jede bestehende Adresse wäre eine Weiterleitung.
   * So bleibt jede deutsche URL unverändert, Englisch kommt unter `/en/...`
   * dazu.
   *
   * Route und Content-Pfad bleiben deckungsgleich: die Sammlungen tragen die
   * Prefixe `/anleitung` bzw. `/en/anleitung` (content.config.ts), die
   * Seiten-Abfrage bleibt `queryCollection(x).path(route.path)`.
   */
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'de',
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
