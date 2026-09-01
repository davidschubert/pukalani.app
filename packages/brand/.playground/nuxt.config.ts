export default defineNuxtConfig({
  extends: ['..', '../../core'],

  devServer: {
    port: 3009,
  },

  // Der Klickdummy ist Davids Demo-Anker und auf Deutsch abgenommen — er
  // startet deshalb unter `/` auf DE (Core-Default wäre EN); EN liegt unter
  // /en/*. Gilt nur hier im Playground, keine App erbt diese Datei.
  i18n: {
    defaultLocale: 'de',
  },
})
