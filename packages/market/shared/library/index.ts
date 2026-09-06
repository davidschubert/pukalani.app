/**
 * DIE BIBLIOTHEKS-DATEI (Plan §7.2 Nr. 3) — versioniert im Repo, nie in der
 * Datenbank (Anhang B).
 *
 * ── HIER STEHEN NUR ERFUNDENE MARKEN ──────────────────────────────────────
 * Alle Einträge tragen `.example`-Adressen und existieren nicht. Das ist keine
 * Übergangslösung, sondern die Reihenfolge aus dem Plan: die MECHANIK gehört
 * zu M3, der INHALT zu **M6** — „Rechnen + Handprüfung der ersten Paare,
 * Rechts-Check der Namensnennung" (§7.6). Eine reale Marke einzutragen, bevor
 * jemand ihre Zitate am Original geprüft und die Namensnennung rechtlich
 * abgeklärt hat, wäre eine Behauptung über einen Dritten ohne Beleg — genau
 * das, was §1.4 dem Produkt verbietet.
 *
 * ── SEIT M6 IST DAS WERKZEUG DA, DER INHALT NOCH NICHT ────────────────────
 * `scripts/market-library-compute.mjs` rechnet vor, das Runbook
 * `docs/runbooks/MARKTVERGLEICH-BIBLIOTHEK.md` führt die Handprüfung, und
 * `--promote <schlüssel>` schreibt einen geprüften Entwurf HIER hinein. Was
 * das Werkzeug erzeugt, liegt bis dahin unter `drafts/` und trägt `status:
 * 'draft'`; das Bibliotheks-Schema kennt nur `'verified'` und weist einen
 * Entwurf ab. Deshalb steht das Feld an JEDEM Eintrag — auch an den beiden
 * erfundenen: eine Ausnahme „die zwei sind ja Testdaten" wäre die eine Zeile,
 * die die Prüfung später umgeht.
 *
 * ── DIE FASSUNG IST TEIL DES BERICHT-SCHLÜSSELS ───────────────────────────
 * `MARKET_LIBRARY_VERSION` geht in `market_reports.revisionKey` ein. Wer einen
 * Eintrag ÄNDERT und die Fassung stehen lässt, hinterlässt gespeicherte
 * Berichte, die sich für aktuell halten, obwohl sich ihre Grundlage bewegt
 * hat. Die Regel lautet deshalb: jede inhaltliche Änderung hebt die Zahl.
 *
 * ── DIE FORM WIRD GEPRÜFT, NICHT GEGLAUBT ─────────────────────────────────
 * `shared/marketLibrary.ts` hält diese Datei gegen ein Zod-Schema (Pflichtfeld
 * `verifiedAt`/`verifiedBy` je Eintrag, Quell-Adresse je Feld, Zitatschranke
 * ≤ 200 Zeichen), und `tests/marketLibrary.test.ts` tut dasselbe im CI. Eine
 * Bibliothek, die durchfällt, ist LEER — nicht „so gut wie möglich".
 */

/** Fassung dieser Datei. Jede inhaltliche Änderung hebt sie. */
export const MARKET_LIBRARY_VERSION = 'lib-2'

/**
 * Die Einträge. Bewusst `unknown[]`-frei getypt gelassen: die WAHRHEIT über
 * die Form ist das Zod-Schema in `marketLibrary.ts`, und ein zweiter
 * TypeScript-Typ daneben wäre eine zweite Wahrheit, die beim nächsten Feld
 * auseinanderläuft. Diese Datei ist Daten, kein Vertrag.
 */
export const MARKET_LIBRARY_ENTRIES = [
  {
    key: 'demo-atlas-roasters',
    status: 'verified',
    name: 'Atlas Roasters',
    homepage: 'https://atlas-roasters.example',
    category: 'Kaffeerösterei',
    verifiedAt: '2026-09-05',
    verifiedBy: 'MV1 M3 (Testeintrag)',
    fields: [
      {
        fieldId: 'categoryLanguage',
        value: 'Specialty coffee roastery',
        sourceUrl: 'https://atlas-roasters.example/about',
        quote: 'Atlas Roasters is a specialty coffee roastery.',
        confidence: 'stated',
      },
      {
        fieldId: 'pitch',
        value: 'Single-origin coffee, roasted to order and shipped the same week.',
        sourceUrl: 'https://atlas-roasters.example',
        quote: 'Single-origin coffee, roasted to order and shipped the same week.',
        confidence: 'stated',
      },
      {
        fieldId: 'audience',
        value: 'Independent cafes and their regulars',
        sourceUrl: 'https://atlas-roasters.example',
        quote: 'We roast for independent cafes and the people who sit in them.',
        confidence: 'stated',
      },
      {
        fieldId: 'firstChoice',
        value: 'Roasting to order instead of to stock',
        sourceUrl: 'https://atlas-roasters.example/about',
        quote: 'We roast to order, never to stock.',
        confidence: 'stated',
      },
      {
        fieldId: 'values',
        value: 'Origin, Craft, Patience',
        items: ['Origin', 'Craft', 'Patience'],
        sourceUrl: 'https://atlas-roasters.example/about',
        quote: 'Origin, craft and patience. In that order.',
        confidence: 'stated',
      },
      {
        fieldId: 'tagline',
        value: 'Roasted to order.',
        sourceUrl: 'https://atlas-roasters.example',
        quote: 'Roasted to order.',
        confidence: 'stated',
      },
    ],
  },
  {
    key: 'demo-northline-supply',
    status: 'verified',
    name: 'Northline Supply',
    homepage: 'https://northline-supply.example',
    category: 'Grosshandel',
    verifiedAt: '2026-09-05',
    verifiedBy: 'MV1 M3 (Testeintrag)',
    fields: [
      {
        fieldId: 'categoryLanguage',
        value: 'Wholesale beverage supplier',
        sourceUrl: 'https://northline-supply.example/about',
        quote: 'Northline Supply is a wholesale beverage supplier.',
        confidence: 'stated',
      },
      {
        fieldId: 'pitch',
        value: 'One order desk for every product a cafe needs, delivered weekly.',
        sourceUrl: 'https://northline-supply.example',
        quote: 'One order desk for everything a cafe needs, delivered every week.',
        confidence: 'stated',
      },
      {
        fieldId: 'audience',
        value: 'Cafes, hotels and canteens',
        sourceUrl: 'https://northline-supply.example',
        quote: 'We supply cafes, hotels and canteens.',
        confidence: 'stated',
      },
      {
        fieldId: 'firstChoice',
        value: 'Fixed delivery windows and one contact person',
        sourceUrl: 'https://northline-supply.example/about',
        quote: 'Fixed delivery windows and one contact person for everything.',
        confidence: 'stated',
      },
      {
        // OHNE Zitat und ausdrücklich als Beobachtung eingestuft: nicht jedes
        // Feld steht wörtlich auf einer Seite (§2.2, `implied`). Die
        // Quell-Adresse bleibt trotzdem Pflicht.
        fieldId: 'toneWords',
        value: 'plain, orderly, unexcited',
        items: ['plain', 'orderly', 'unexcited'],
        sourceUrl: 'https://northline-supply.example',
        confidence: 'implied',
      },
      {
        fieldId: 'tagline',
        value: 'Everything on one delivery note.',
        sourceUrl: 'https://northline-supply.example',
        quote: 'Everything on one delivery note.',
        confidence: 'stated',
      },
    ],
  },
]
