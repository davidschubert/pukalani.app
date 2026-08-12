/**
 * media meldet seine Dashboard-Sektion bei der Admin-Modul-Registry an
 * (pukalani.admin.modules, deep-merged). Das Admin-Layout rendert sie capability-
 * gefiltert — admin muss diesen Eintrag NICHT hart kennen (Layer-Grenze A14).
 */
export default defineAppConfig({
  pukalani: {
    admin: {
      modules: [
        {
          // E9: die Mediathek ist INHALT einer Community, kein Branding —
          // sie zieht aus dem entfallenen 'design' zu den Produkten (hinter
          // Beiträge/Events/Kurse).
          id: 'media',
          scope: 'community',
          productKey: 'media',
          // C2: im Pool erst ab personal (pukalani.tenancy.products) — ohne
          // das Feld stünde der Menüpunkt auch dort, wo /api/media längst
          // 404t. `productKey` ist der BETREIBER-Schalter (app_config),
          // `planProduct` der Vertrag des Kunden; beide sind nötig.
          planProduct: 'media',
          labelKey: 'admin.nav.media',
          icon: 'i-ph-images',
          to: '/dashboard/media',
          requiredCapability: 'media.manage',
          group: 'products',
          order: 80,
        },
      ],
      /**
       * KENNZAHL DES media-LAYERS (U9/K2, 2026-08-11) — die Kachel „Medien".
       *
       * SIE IST DIE „x von y"-KACHEL: der Speicher-Reiter rechnet Belegung
       * gegen Kontingent bereits, und zwar aus genau dieser Quelle
       * (`kind: 'media'` im Verbrauchs-Vertrag, Grenze aus `tenantLimitsFor`).
       * Die Übersicht zeigt dieselbe Rechnung als eine Zeile, damit der Owner
       * sein Kontingent sieht, ohne einen Reiter zu suchen — dieselben Zahlen,
       * kein zweiter Weg sie zu erheben.
       */
      stats: {
        media: {
          scope: 'community',
          productKey: 'media',
          planProduct: 'media',
          labelKey: 'media.stats.total',
          icon: 'i-ph-image',
          to: '/dashboard/media',
          requiredCapability: 'media.manage',
          order: 80,
        },
      },
    },
  },
})
