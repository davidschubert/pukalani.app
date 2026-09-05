/**
 * market-Layer — Marktvergleich (Plan: docs/plans/BRAND-MARKTVERGLEICH.md).
 *
 * STAND: **PROTOTYP (Paket M0)**. Der Layer trägt heute AUSSCHLIESSLICH die
 * Komponenten-Vorlagen (`app/components`, `Mk*`) und den Vertrags-Anfang
 * (`shared/marketProfile.ts`). Es gibt KEIN `server/`, KEINE Tabellen, KEINE
 * Migrationen und keinen KI-Aufruf — die kommen mit M1–M4, und sie übernehmen
 * genau diese Komponenten („nichts wird zweimal gebaut", §2.11).
 *
 * KEIN `extends`: der Layer hängt am brand-Layer über einen EXPLIZITEN Vertrag
 * (Plan §2.1, CONCEPT A14) und nicht über die Kette. Solange dieser Vertrag
 * nicht gebaut ist, kennt `market` `brand` gar nicht — die Beschriftung der
 * EIGENEN Felder reicht die Seite als Prop herein (`fieldLabels`), statt dass
 * eine Komponente die brand-Registry auflöst. Der Prototyp macht die Grenze
 * damit sichtbar, statt sie zu verschieben.
 *
 * DER KOMPONENTEN-PRÄFIX `Mk` STEHT IM DATEINAMEN, nicht in einer
 * `components`-Angabe — dieselbe Lösung wie `Bw*` im brand-Layer. Eine
 * `prefix`-Angabe zusätzlich zum Dateinamen ergäbe `MkMkEvidence`.
 *
 * KEIN eigenes Stylesheet: die Werkstatt-Optik ist der Token-Satz `.bw-root`
 * aus `packages/brand/app/assets/css/brand.css`. Zwei Token-Sätze für dieselbe
 * Werkstatt wären zwei Wahrheiten über dieselbe Farbe — der Prototyp erbt sie
 * über das `extends` seines Playgrounds, die Umsetzung über die App.
 *
 * Der Prototyp läuft im `.playground` — Punkt-Ordner erfasst weder der
 * Manifest-Scan noch `extends`.
 */
export default defineNuxtConfig({
  // Layer-stores gibt es (noch) keine; die Locales aber schon: sie mergen
  // über den gleichen Sprachcode mit Core-, brand- und App-Katalog.
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
