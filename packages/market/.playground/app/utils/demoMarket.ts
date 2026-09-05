import type {
  MarketClaimList,
  MarketCompetitor,
  MarketEvidence,
  MarketFinding,
  MarketProfile,
  MarketProfileField,
} from '../../../shared/marketProfile'

/**
 * PROTOTYP (M0) — die Daten der vier Screens (Plan §2.11).
 *
 * ── ALLES ERFUNDEN, UND ZWAR ABSICHTLICH ─────────────────────────────────
 * Die Marke ist „Kailua Coffee Co." (das Beispiel-Branding des Wizards), das
 * Feld sind DREI ERFUNDENE Wettbewerber mit `.example`-Adressen. Eine reale
 * Marke im Klickdummy wäre genau das, was §2.9 dem Produkt verbietet — und
 * ein Screenshot davon wandert weiter, als man denkt (Plan §4).
 * Ihre „Websites" liegen als statische Seiten unter
 * `.playground/public/demo-sites/**` — deshalb ist der Prototyp OHNE NETZ
 * vorführbar, und jedes Zitat zeigt auf eine Textstelle, die es wirklich gibt.
 *
 * ── WAS HIER SPRACHE IST UND WAS INHALT ──────────────────────────────────
 * Beschriftungen, Zustände und Zählzeilen sind Oberfläche und laufen über
 * `market.*` (de+en). Die Aussagen, Zitate und Befund-Texte sind INHALT und
 * stehen in der Inhaltssprache der Marke (hier Englisch) — genau wie im
 * Produkt: der Bericht steht in der Sprache, in der die Marke gebaut wurde
 * (§3, Nicht-Ziele: „das Marktprofil steht in der Inhaltssprache der Marke").
 * Ein übersetztes Zitat wäre kein Beleg mehr.
 *
 * ── DIE ZITATE STEHEN WÖRTLICH IN DEN DEMO-SEITEN ────────────────────────
 * Das ist keine Kosmetik, sondern der Halluzinations-Riegel aus §2.2 im
 * Kleinen: `evidence ⊂ rawText`. Wer hier einen Satz ändert, muss ihn auch in
 * der HTML-Datei ändern — sonst zeigt der Beleg auf eine Stelle, die es nicht
 * gibt, und der Prototyp lügt an genau der Stelle, an der das Produkt es nie
 * darf.
 */

/** Abrufdatum aller Demo-Belege — ein Bericht ist ein Stand, kein Strom. */
const FETCHED = '2026-09-05'

/** Der eigene Markenname (Beispiel-Branding des Wizards). */
export const DEMO_BRAND = 'Kailua Coffee Co.'

/**
 * DIE PROTOTYP-NAHT ZU DEN DEMO-SEITEN. In der Umsetzung gibt es sie nicht:
 * dort IST `sourceUrl` das Ziel. Hier bildet sie die erfundene Adresse auf die
 * statische Seite im `public/`-Ordner ab, damit ein Klick etwas öffnet.
 */
export function demoHref(sourceUrl: string): string {
  const path = sourceUrl.replace(/^https?:\/\//, '')
  const [host, page] = [path.split('/')[0] ?? '', path.split('/')[1] ?? '']
  const slug = host.replace('.example', '')
  return `/demo-sites/${slug}/${page === 'about' ? 'about' : 'index'}.html`
}

function evidence(quote: string, sourceUrl: string, confidence: 'stated' | 'implied' = 'stated'): MarketEvidence {
  return { quote, sourceUrl, fetchedAt: FETCHED, confidence }
}

// ── Die eigene Marke ──────────────────────────────────────────────────────

/**
 * Die eigenen Werte kommen aus den BESTÄTIGTEN Feldern der Foundation (§2.3
 * Nr. 4) und tragen deshalb keinen Beleg: sie sind nicht abgelesen, sondern
 * entschieden. `keyMessages` steht LEER — das ist der Fall, den der Bericht
 * benennen muss („bei euch noch nicht bestätigt", §2.4), und deshalb ist er
 * im Prototyp vorgeführt statt weggelassen.
 */
export const DEMO_OWN: readonly MarketProfileField[] = [
  { fieldId: 'categoryLanguage', value: 'Small-batch roastery' },
  { fieldId: 'pitch', value: 'We roast coffee in small batches for cafes on Maui and deliver it ourselves.' },
  { fieldId: 'audience', value: 'Cafes and restaurants on Maui that buy 5 to 40 kilos a month.' },
  { fieldId: 'firstChoice', value: 'We know every farm personally.' },
  { fieldId: 'purpose', value: 'Coffee should stay traceable to the person who grew it.' },
  { fieldId: 'values', value: 'Origin, Closeness, Reliability', items: ['Origin', 'Closeness', 'Reliability'] },
  { fieldId: 'toneWords', value: 'direct, warm, concrete', items: ['direct', 'warm', 'concrete'] },
  { fieldId: 'tagline', value: 'Every bag has an address.' },
  { fieldId: 'keyMessages', value: '' },
  { fieldId: 'distinctiveAsset', value: 'Roasted Wednesday. At your door Thursday.' },
]

// ── Die Kandidaten ────────────────────────────────────────────────────────

/** Vor dem Lauf: Namen aus `a.competitors`, Adressen vom Kunden eingetragen. */
export const DEMO_CANDIDATES: readonly MarketCompetitor[] = [
  { id: 'upcountry', name: 'Upcountry Roast Co.', url: 'https://upcountry-roast.example', status: 'pending' },
  { id: 'pacific', name: 'Pacific Bean Supply', url: 'https://pacificbean.example', status: 'pending' },
  { id: 'kona', name: 'Kona Trading', url: 'https://kona-trading.example', status: 'pending' },
]

/**
 * Nach dem Lauf. „Kona Trading" ist AUSGESCHLOSSEN, und zwar absichtlich: der
 * Zustand, in dem eine Website nein sagt, ist der wichtigste des ganzen
 * Ablaufs (§1.7 Nr. 2) — ein Prototyp, in dem alles klappt, zeigt ihn nie.
 * Die robots.txt dazu liegt wirklich im Playground.
 */
export const DEMO_COMPETITORS: readonly MarketCompetitor[] = [
  {
    id: 'upcountry',
    name: 'Upcountry Roast Co.',
    url: 'https://upcountry-roast.example',
    status: 'fetched',
    pagesRead: ['https://upcountry-roast.example', 'https://upcountry-roast.example/about'],
    fetchedAt: FETCHED,
  },
  {
    id: 'pacific',
    name: 'Pacific Bean Supply',
    url: 'https://pacificbean.example',
    status: 'fetched',
    pagesRead: ['https://pacificbean.example', 'https://pacificbean.example/about'],
    fetchedAt: FETCHED,
  },
  {
    id: 'kona',
    name: 'Kona Trading',
    url: 'https://kona-trading.example',
    status: 'excluded',
    excludedReason: 'robots',
  },
]

// ── Die Marktprofile ──────────────────────────────────────────────────────

export const DEMO_PROFILES: readonly MarketProfile[] = [
  {
    competitorId: 'upcountry',
    fields: [
      {
        fieldId: 'categoryLanguage',
        value: 'Craft coffee roastery',
        evidence: evidence('We are a craft coffee roastery in Upcountry Maui.', 'https://upcountry-roast.example/about'),
      },
      {
        fieldId: 'pitch',
        value: 'Small-batch coffee, roasted upcountry, direct from the farm.',
        evidence: evidence('Small-batch coffee, roasted upcountry, direct from the farm.', 'https://upcountry-roast.example'),
      },
      {
        fieldId: 'audience',
        value: 'Cafes, restaurants and offices island-wide',
        evidence: evidence('We roast for cafes, restaurants and offices across the island.', 'https://upcountry-roast.example'),
      },
      {
        fieldId: 'firstChoice',
        value: 'Buying direct from the farm and passing the story on',
        evidence: evidence('Why choose us? Because we buy direct from the farm and pass the story on.', 'https://upcountry-roast.example/about'),
      },
      // LEER heisst „nicht öffentlich formuliert" — und das ist eine Aussage
      // über die Kategorie, kein Loch im Bericht (§1.10).
      { fieldId: 'purpose', value: '' },
      {
        fieldId: 'values',
        value: 'Craft, Community, Sustainability',
        items: ['Craft', 'Community', 'Sustainability'],
        evidence: evidence('Craft, community and sustainability guide everything we do.', 'https://upcountry-roast.example/about'),
      },
      {
        fieldId: 'toneWords',
        value: 'warm, crafted, unhurried',
        items: ['warm', 'crafted', 'unhurried'],
        evidence: evidence('Pull up a chair. We will talk beans all afternoon.', 'https://upcountry-roast.example', 'implied'),
      },
      {
        fieldId: 'tagline',
        value: 'Coffee with a story.',
        evidence: evidence('Coffee with a story.', 'https://upcountry-roast.example'),
      },
      {
        fieldId: 'keyMessages',
        value: 'Small batches, farm-direct sourcing, weekly freshness',
        items: [
          'Roasted in small batches, never in bulk.',
          'We buy direct from the farm and pass the story on.',
          'Fresh every week, all across Maui.',
        ],
        evidence: evidence('Roasted in small batches, never in bulk.', 'https://upcountry-roast.example'),
      },
      { fieldId: 'distinctiveAsset', value: '' },
    ],
  },
  {
    competitorId: 'pacific',
    fields: [
      {
        fieldId: 'categoryLanguage',
        value: 'Wholesale coffee supplier',
        evidence: evidence('Pacific Bean Supply is a wholesale coffee supplier based in Kahului.', 'https://pacificbean.example/about'),
      },
      {
        fieldId: 'pitch',
        value: 'Reliable wholesale coffee, direct from the farm, delivered on schedule.',
        evidence: evidence('Reliable wholesale coffee for the islands, direct from the farm, delivered on schedule.', 'https://pacificbean.example'),
      },
      {
        fieldId: 'audience',
        value: 'Hotels, cafes and grocery stores on four islands',
        evidence: evidence('We supply hotels, cafes and grocery stores on four islands.', 'https://pacificbean.example'),
      },
      {
        fieldId: 'firstChoice',
        value: 'Shipping on schedule, every week, island-wide',
        evidence: evidence('Customers choose us because we ship on schedule, every week, island-wide.', 'https://pacificbean.example/about'),
      },
      { fieldId: 'purpose', value: '' },
      {
        fieldId: 'values',
        value: 'Reliability, Scale, Service',
        items: ['Reliability', 'Scale', 'Service'],
        evidence: evidence('Reliability, scale and service. That is the whole list.', 'https://pacificbean.example/about'),
      },
      {
        fieldId: 'toneWords',
        value: 'plain, businesslike',
        items: ['plain', 'businesslike'],
        evidence: evidence('One order desk for every island. Fixed windows, no surprises.', 'https://pacificbean.example', 'implied'),
      },
      {
        fieldId: 'tagline',
        value: 'On schedule. Island-wide.',
        evidence: evidence('On schedule. Island-wide.', 'https://pacificbean.example'),
      },
      {
        fieldId: 'keyMessages',
        value: 'Fixed delivery windows, one order desk, every grade',
        items: [
          'Fixed delivery windows, every week.',
          'One order desk for every island.',
          'Direct from the farm, in every grade.',
        ],
        evidence: evidence('Fixed delivery windows, every week.', 'https://pacificbean.example'),
      },
      { fieldId: 'distinctiveAsset', value: '' },
    ],
  },
]

// ── Die drei Listen ───────────────────────────────────────────────────────

/**
 * KONVENTIONEN zählen die EIGENE Marke mit (3 von 3): die Frage lautet „was
 * sagen alle im Feld", und wir sind Teil des Feldes. ÜBERSCHNEIDUNGEN zählen
 * sie NICHT mit (1 von 2): dort ist die eigene Aussage der Massstab, und die
 * Frage lautet „wer sagt sie AUCH".
 */
export const DEMO_CLAIMS: readonly MarketClaimList[] = [
  {
    kind: 'convention',
    entries: [
      {
        id: 'conv-farm',
        fieldId: 'firstChoice',
        statement: 'Closeness to the farm is the reason to choose us.',
        sharedBy: 3,
        of: 3,
        citations: [
          {
            competitorId: 'upcountry',
            competitorName: 'Upcountry Roast Co.',
            evidence: evidence('Why choose us? Because we buy direct from the farm and pass the story on.', 'https://upcountry-roast.example/about'),
          },
          {
            competitorId: 'pacific',
            competitorName: 'Pacific Bean Supply',
            evidence: evidence('Reliable wholesale coffee for the islands, direct from the farm, delivered on schedule.', 'https://pacificbean.example'),
          },
        ],
      },
      {
        id: 'conv-small-batch',
        fieldId: 'pitch',
        statement: 'Roasting in small batches.',
        sharedBy: 2,
        of: 3,
        citations: [
          {
            competitorId: 'upcountry',
            competitorName: 'Upcountry Roast Co.',
            evidence: evidence('Roasted in small batches, never in bulk.', 'https://upcountry-roast.example'),
          },
        ],
      },
    ],
  },
  {
    kind: 'overlap',
    entries: [
      {
        id: 'ovl-first-choice',
        fieldId: 'firstChoice',
        statement: 'We know every farm personally.',
        sharedBy: 1,
        of: 2,
        citations: [
          {
            competitorId: 'upcountry',
            competitorName: 'Upcountry Roast Co.',
            evidence: evidence('Why choose us? Because we buy direct from the farm and pass the story on.', 'https://upcountry-roast.example/about'),
          },
        ],
      },
      {
        id: 'ovl-reliability',
        fieldId: 'values',
        statement: 'Reliability as a stated value.',
        sharedBy: 1,
        of: 2,
        citations: [
          {
            competitorId: 'pacific',
            competitorName: 'Pacific Bean Supply',
            evidence: evidence('Reliability, scale and service. That is the whole list.', 'https://pacificbean.example/about'),
          },
        ],
      },
    ],
  },
  {
    kind: 'whitespace',
    entries: [
      {
        id: 'ws-delivery',
        fieldId: 'distinctiveAsset',
        statement: 'Nobody in the field says who carries the coffee to the door. Delivery is named as a schedule, never as a person. Do you want that to be yours?',
      },
      {
        id: 'ws-price',
        fieldId: 'keyMessages',
        statement: 'Nobody in the field states a minimum order or a price range in public. Do you want to be the one who does?',
      },
    ],
  },
]

// ── Die Befunde ───────────────────────────────────────────────────────────

/**
 * ZWEI BEFUNDE, BEIDE AM EIGENEN FELD (§2.9 Nr. 5): kein Wettbewerber wird
 * genannt, keiner wird bewertet, und kein Vorschlag entwirft einen Satz, der
 * einen Dritten erkennbar macht („anders als X …"). Die Formulierung „zwei
 * andere im Feld" ist die Grenze, die das Produkt einhält.
 */
export const DEMO_FINDINGS: readonly MarketFinding[] = [
  {
    id: 'f-first-choice',
    slotId: 'b.positioningFirstChoice',
    why: 'Your reason to be chosen first — knowing every farm personally — is the promise two other sites in the field make in their own words.',
    suggestion: 'Sharpen it with the part only you do: you deliver every bag yourself, on a fixed weekday.',
    status: 'open',
  },
  {
    id: 'f-tagline',
    slotId: 'ep.taglines',
    why: 'Your tagline carries an idea the field already states plainly, while the weekly rhythm you actually run is stated nowhere in the field.',
    suggestion: 'Try a line built on that rhythm — roasted Wednesday, at the door Thursday.',
    status: 'open',
  },
]

/** Der Stand des Berichts (Kopf der rechten Spalte). */
export const DEMO_REPORT_DATE = FETCHED
