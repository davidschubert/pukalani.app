import { buildSystemManifest } from './build/systemManifest'

/**
 * Produkt Layer: Admin-Dashboard (Grundgerüst + User-Verwaltung).
 * Eigene Table: `changelog` (A14). Administriert außerdem Appwrite-User und
 * die Daten anderer Layer (Moderation). Extended den Core nicht selbst —
 * die App komponiert: extends: [admin, comments, core].
 */
export default defineNuxtConfig({
  // MDC rendert die Markdown-Changelog-Bodies (öffentliche /changelog-Seite).
  // Liegt HIER statt in jeder App — der Layer bringt seine Renderer-Config mit.
  modules: ['@nuxtjs/mdc'],

  // Der Nuxt-UI-Editor (TipTap) braucht ProseMirror als EINE vorgebündelte Instanz,
  // sonst „Adding different instances of a keyed plugin" (Nuxt-UI-Editor-Doku).
  vite: {
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
      ],
    },
  },

  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },

  runtimeConfig: {
    /**
     * server-only! Das Versions-Manifest der Systemseite — ZUR BAUZEIT
     * ausgewertet, dasselbe Muster wie `buildSha` im Core. Grund: in
     * Produktion wird nur `.output/` deployt; die bisherige Laufzeit-Auflösung
     * (package.json-Lookups, Scan von `packages/*`) läuft dort ins Leere und
     * lieferte „unknown" bzw. „0 Dateien".
     *
     * JSON-STRING statt Objekt, mit Absicht: runtimeConfig-Werte sind je
     * Schlüssel env-überschreibbar, und ein verschachteltes Objekt mit Arrays
     * (Layer → Kategorien → Dateinamen) hätte eine Env-Var-Zuordnung, die
     * niemand sinnvoll bedienen kann. EIN String ist EIN Schlüssel.
     */
    adminSystemManifest: JSON.stringify(buildSystemManifest()),
  },
})
