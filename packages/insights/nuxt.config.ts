/**
 * insights-Layer — Brand Insights (Plan: docs/plans/BRAND-INSIGHTS.md).
 *
 * STAND: **PAKET I2**. Der Layer hat sein Schema (I1) UND seine Redaktion:
 * `server/api/insights/**` (Liste, Editor-Kontext, Speichern, Zustands-Gate,
 * Beleg-Ampel, Übersetzen, KI-Entwurf, Marken), `app/pages/dashboard/insights/**`
 * (Liste, Editor, Radar-Platzhalter) und die zwei Modell-Läufe. Was hier
 * BEWUSST noch fehlt: die ÖFFENTLICHEN Seiten (`/insights`, `/brands/…`, …) —
 * sie sind Paket I3 und hängen an den Anwaltsantworten (§6, §11.3).
 *
 * ── KEIN `extends`, UND ZWAR AUCH NICHT AUF `brand` ──────────────────────
 * `requires: ['brand']` im Manifest heisst NICHT `extends`. Der Layer hängt am
 * brand-Layer über einen EXPLIZITEN Vertrag (CONCEPT A14, Plan §9.1) — den
 * zieht I1, und er wird in `server/contracts/` liegen. Bis dahin importiert
 * hier NICHTS aus einem anderen Layer, und das ist im Prototyp prüfbar: die
 * Komponenten nehmen alles, was dem brand-Layer gehört, als Prop oder als
 * SLOT herein (der Score-Ring `BwScoreRing` etwa — dasselbe Muster wie
 * `MkBrandScore` im market-Layer). Ein `<BwScoreRing>` mitten in einer
 * `In*`-Komponente wäre genau die stille Auto-Import-Kopplung, die CLAUDE.md
 * verbietet: in einer App mit `insights` ohne `brand` bliebe sie leer, ohne
 * dass es jemand merkt.
 *
 * ── KEIN EIGENES STYLESHEET ─────────────────────────────────────────────
 * Die Optik ist der Token-Satz `.bw-root` aus
 * `packages/brand/app/assets/css/brand.css`. Zwei Token-Sätze für dieselbe
 * Marke wären zwei Wahrheiten über dieselbe Farbe — der Prototyp erbt sie über
 * das `extends` seines Playgrounds, die Umsetzung später über die App.
 *
 * DER KOMPONENTEN-PRÄFIX `In` STEHT IM DATEINAMEN, nicht in einer
 * `components`-Angabe — dieselbe Lösung wie `Bw*` (brand) und `Mk*` (market).
 * Eine `prefix`-Angabe zusätzlich zum Dateinamen ergäbe `InInPostCard`.
 */
export default defineNuxtConfig({
  /**
   * DAS INHALTSVERZEICHNIS DES ARTIKELS BRAUCHT DIESEN SCHALTER (§9.5).
   *
   * `InArticle` trägt sein sticky Verzeichnis in einem `UContentToc` — samt
   * Scrollspy, der damit MITGELIEFERT kommt statt handgebaut zu werden (der
   * Klickdummy hat ihn noch selbst gerechnet). Nuxt UI registriert die
   * Content-Komponenten NUR mit diesem Schalter oder mit installiertem
   * @nuxt/content; ohne ihn bleibt `<UContentToc>` ein unaufgelöstes Element:
   * leere Spalte, im Browser eine Vue-Warnung, KEIN Build- und KEIN Typfehler
   * (im brand-Playground am 2026-09-05 live erwischt).
   *
   * Er steht deshalb im LAYER und nicht im Playground: sonst funktionierte
   * der Prototyp und die spätere App nicht — und zwar lautlos. Der brand-Layer
   * setzt denselben Schalter; zweimal `true` ist kein Konflikt.
   */
  ui: {
    content: true,
  },

  // Layer-stores gibt es (noch) keine; die Locales schon: sie mergen über den
  // gleichen Sprachcode mit Core-, brand- und App-Katalog.
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
