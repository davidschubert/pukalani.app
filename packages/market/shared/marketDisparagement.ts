/**
 * DER § 6 UWG-RIEGEL (Plan §1.7 Nr. 5, §2.9 Nr. 5) — PUR, damit die
 * Gegenprobe ohne Modell, ohne Route und ohne Ablage läuft.
 *
 * ── WAS ER VERHINDERT ─────────────────────────────────────────────────────
 * Vergleichende Werbung ist in Deutschland erlaubt, solange sie den
 * Wettbewerber nicht HERABSETZT (§ 6 Abs. 2 Nr. 5 UWG). Der Marktvergleich
 * geht bewusst noch einen Schritt weiter (Plan §2.9 Nr. 5, Davids Zuschnitt):
 * er erzeugt **keinen veröffentlichungsfähigen Vergleichs-Claim**. Ein
 * Markt-Befund sagt „euer Satz klingt wie zwei andere im Feld" — nie „anders
 * als X". Damit kann der Kunde einen Vorschlag von hier ohne Rückfrage
 * verwenden, und genau das ist der Produktwert.
 *
 * Zwei Dinge werden deshalb geprüft:
 *
 *  (a) NENNT DER TEXT EINEN WETTBEWERBER? — sein Name, ein Namens-Teil ab vier
 *      Zeichen, oder seine Domain (auch ein Domain-Label). Wer „anders als
 *      Pacific" schreibt, hat einen Dritten erkennbar gemacht, auch ohne den
 *      vollen Firmennamen.
 *  (b) SETZT DER TEXT HERAB? — eine Wortliste in beiden Inhaltssprachen.
 *
 * ── VERWORFEN, NICHT UMFORMULIERT ─────────────────────────────────────────
 * Ein Treffer LÖSCHT das Element. Umschreiben hiesse, dem Modell den Satz zu
 * korrigieren, den es gerade falsch gebaut hat — mit demselben Modell. Ein
 * fehlender Befund ist ein verlorener Hinweis; ein durchgelassener ist eine
 * Abmahnung.
 *
 * ── DER STÄRKSTE TEIL DES RIEGELS STEHT NICHT HIER ────────────────────────
 * Der Vergleichs-Prompt bekommt die Wettbewerber gar nicht mit NAMEN, sondern
 * nur als `c1 … c5` (s. `server/prompts/marketReportPrompt.ts`). Ein Modell
 * kann einen Namen also nicht einmal versehentlich abschreiben — es kennt ihn
 * nicht. Diese Datei ist das Netz darunter: sie fängt den Fall, dass ein Name
 * ÜBER DEN ROHTEXT ins Modell gelangt ist (ein Zitat nennt oft die eigene
 * Marke) oder dass jemand die Anonymisierung später „vereinfacht".
 *
 * ── LIEBER ZU VIEL ALS ZU WENIG ───────────────────────────────────────────
 * Ein Wettbewerber „Kailua Coffee" macht das Token `coffee` gesperrt, und ein
 * Vorschlag über Kaffee fällt damit weg. Das ist der bewusste Preis: der
 * Riegel ist fail-closed, weil die eine Seite einen Hinweis kostet und die
 * andere Geld. Ausgenommen sind nur RECHTSFORMEN und Bindewörter (`GmbH`,
 * `Ltd`, `Company`, `und`, …) — sie identifizieren niemanden, und ohne diese
 * Ausnahme sperrte ein einziger Kandidat „Müller GmbH" jedes Wort `gmbh` in
 * jedem Vorschlag.
 */

/**
 * WORTSTAMM-NORMALISIERUNG: Umlaute, ß, Akzente und Kleinschreibung.
 *
 * `Müller` und `mueller` sind derselbe Name; ein Filter, der das nicht sieht,
 * ist mit einer Tastatur-Umschreibung zu umgehen. Beides wird auf DIESELBE
 * Form gebracht (`ue`), nicht nur die Akzente entfernt: sonst wären `mller`
 * und `mueller` zwei verschiedene Dinge.
 */
export function normalizeForFilter(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Die kürzeste Zeichenkette, die als Namens-TEIL noch identifiziert. */
export const MARKET_NAME_TOKEN_MIN = 4

/**
 * Was in einem Firmennamen niemanden identifiziert: Rechtsformen,
 * Gesellschafts- und Bindewörter. Sie fliegen aus der Sperrliste, sonst
 * sperrte ein Kandidat „Müller GmbH & Co. KG" die halbe deutsche Sprache.
 * Bewusst KURZ gehalten — jedes Wort hier ist ein Loch im Netz.
 */
const NAME_STOP_TOKENS = new Set([
  'gmbh', 'mbh', 'ohg', 'kgaa', 'gbr', 'ug', 'ltd', 'limited', 'inc', 'incorporated',
  'corp', 'corporation', 'llc', 'plc', 'company', 'holding', 'holdings', 'group',
  'gruppe', 'und', 'and', 'the', 'der', 'die', 'das', 'von', 'for', 'with',
  'www', 'com', 'net', 'org', 'info', 'shop', 'online', 'example', 'test',
])

/**
 * Die Domain-Endungen, die als LABEL nichts identifizieren. Mehrteilige
 * Endungen (`co.uk`) sind darin enthalten, weil jedes Label einzeln geprüft
 * wird.
 */
const DOMAIN_STOP_LABELS = new Set([
  'www', 'com', 'net', 'org', 'info', 'biz', 'shop', 'de', 'at', 'ch', 'io', 'app',
  'co', 'uk', 'eu', 'us', 'nl', 'fr', 'it', 'es', 'dev', 'supply', 'example', 'test', 'local',
])

/**
 * DIE HERABSETZENDEN AUSDRÜCKE (de + en). Sie prüfen den Text ÜBER Befunde,
 * Konventionen, Überschneidungen UND freie Stellen — jede der vier Formen ist
 * ein Satz, den ein Kunde am Ende in seiner eigenen Kommunikation verwendet.
 *
 * Geprüft wird auf WORTGRENZE nach der Normalisierung (`billiger` trifft
 * `billig` nicht — dafür steht es selbst in der Liste, wo es gemeint ist).
 * Eine Stammform-Erkennung wäre hier die falsche Genauigkeit: sie fiele über
 * `schlechthin` und liesse `Abzocke` durch.
 */
export const MARKET_DISPARAGING_TERMS: readonly string[] = [
  // Deutsch
  'billig', 'billiger', 'billigste', 'schlecht', 'schlechter', 'schlechteste',
  'veraltet', 'altbacken', 'unseriös', 'unserioes', 'abzocke', 'betrug', 'betrueger',
  'dilettantisch', 'lieblos', 'austauschbar', 'minderwertig', 'schwaecher', 'schwächer',
  'rueckstaendig', 'rückständig', 'ueberteuert', 'überteuert', 'unfaehig', 'unfähig',
  'laecherlich', 'lächerlich', 'primitiv', 'schwammig', 'nichtssagend',
  // Englisch
  'worse', 'worst', 'cheap', 'cheaper', 'cheapest', 'outdated', 'inferior', 'scam',
  'sloppy', 'lazy', 'dishonest', 'shady', 'overpriced', 'incompetent', 'ridiculous',
  'clueless', 'generic', 'bland', 'lousy', 'mediocre', 'obsolete', 'dated',
]

const DISPARAGING_SET = new Set(MARKET_DISPARAGING_TERMS.map(normalizeForFilter))

/** Woran ein Element gescheitert ist — Zahl fürs Log, nie der Text. */
export type MarketFilterReason = 'competitor_name' | 'competitor_domain' | 'disparagement'

export interface MarketGuardCandidate {
  readonly name: string
  /** Leer bei den Nicht-Website-Quellen (Foundation, Bibliothek). */
  readonly url?: string
}

/**
 * DER RIEGEL, EINMAL GEBAUT UND N-MAL GEFRAGT.
 *
 * Er wird je Bericht EINMAL aus den Kandidaten gebaut und dann über jedes
 * erzeugte Element gezogen. Ein `check` je Aufruf neu zu bauen wäre bei fünf
 * Kandidaten × vier Listen dieselbe Rechnung dreissigmal.
 */
export interface MarketDisparagementGuard {
  /** `null` = sauber. Sonst der Grund, aus dem das Element verworfen wird. */
  readonly check: (text: string) => MarketFilterReason | null
  /** Die Sperrliste — nur für Tests und die Erklärung im Beweis. */
  readonly nameTokens: ReadonlySet<string>
  readonly domainTokens: ReadonlySet<string>
}

function nameTokensOf(name: string): string[] {
  const normalized = normalizeForFilter(name)
  if (!normalized) return []
  const tokens: string[] = []
  // Der GANZE Name (ohne Trenner) zählt immer — auch wenn er kurz ist:
  // „Ada" identifiziert eine Marke, obwohl das Token unter der Mindestlänge
  // liegt. Nur die TEILE tragen die Vier-Zeichen-Schwelle.
  const whole = normalized.replace(/\s+/g, '')
  if (whole.length >= 3) tokens.push(whole)
  if (normalized.includes(' ')) tokens.push(normalized)
  for (const part of normalized.split(' ')) {
    if (part.length < MARKET_NAME_TOKEN_MIN) continue
    if (NAME_STOP_TOKENS.has(part)) continue
    tokens.push(part)
  }
  return tokens
}

function domainTokensOf(rawUrl: string): string[] {
  let host: string
  try {
    host = new URL(rawUrl).hostname.toLowerCase()
  }
  catch {
    return []
  }
  if (!host) return []
  const tokens = [host]
  // `www.` weg — sonst fände der Filter `www.marke.de` und nicht `marke.de`.
  const bare = host.replace(/^www\./, '')
  if (bare !== host) tokens.push(bare)
  for (const label of bare.split('.')) {
    if (label.length < MARKET_NAME_TOKEN_MIN) continue
    if (DOMAIN_STOP_LABELS.has(label)) continue
    tokens.push(label)
  }
  return tokens.map(normalizeForFilter).filter(token => token.length >= 3)
}

/**
 * DEN RIEGEL AUS DEN KANDIDATEN BAUEN.
 *
 * Die EIGENE Marke gehört ausdrücklich NICHT hinein: der Bericht redet über
 * sie, und ein Befund, der ihren Namen nennt, ist genau richtig.
 */
export function createMarketDisparagementGuard(
  candidates: readonly MarketGuardCandidate[],
): MarketDisparagementGuard {
  const nameTokens = new Set<string>()
  const domainTokens = new Set<string>()

  for (const candidate of candidates) {
    for (const token of nameTokensOf(candidate.name)) nameTokens.add(token)
    if (candidate.url) for (const token of domainTokensOf(candidate.url)) domainTokens.add(token)
  }

  function check(text: string): MarketFilterReason | null {
    const normalized = normalizeForFilter(text)
    if (!normalized) return null
    const words = normalized.split(' ')
    const wordSet = new Set(words)

    // (b) zuerst: eine Herabsetzung ist der schwerere Vorwurf, und ein Text
    // kann beides sein — die Meldung soll dann die schärfere sein.
    for (const word of wordSet) {
      if (DISPARAGING_SET.has(word)) return 'disparagement'
    }
    // Mehrwortige Einträge der Liste (heute keine, morgen vielleicht).
    for (const term of DISPARAGING_SET) {
      if (term.includes(' ') && normalized.includes(term)) return 'disparagement'
    }

    // (a) Domain vor Name: eine Adresse im Text ist der eindeutigere Treffer.
    // Der Vergleich läuft über die ZUSAMMENGEZOGENE Form, weil
    // `normalizeForFilter` den Punkt zu einem Leerzeichen macht — „marke.de"
    // steht danach als „marke de" da, und `marke de` fände `hausmarke de`
    // nicht als Wort. Deshalb wird zusätzlich ohne Trenner geprüft.
    const joined = words.join('')
    for (const token of domainTokens) {
      const bare = token.replace(/ /g, '')
      if (wordSet.has(token) || (bare.length >= MARKET_NAME_TOKEN_MIN && joined.includes(bare))) {
        return 'competitor_domain'
      }
    }
    for (const token of nameTokens) {
      if (token.includes(' ')) {
        if (normalized.includes(token)) return 'competitor_name'
        continue
      }
      // Als WORT — und zusätzlich in der zusammengezogenen Form, weil ein
      // Name auch ohne Leerzeichen auftaucht („KailuaCoffee", ein Hashtag,
      // eine Adresse). Die Vier-Zeichen-Schwelle gilt dort weiter: ohne sie
      // fände `ada` jedes „Kanada".
      if (wordSet.has(token)) return 'competitor_name'
      if (token.length >= MARKET_NAME_TOKEN_MIN && joined.includes(token)) return 'competitor_name'
    }
    return null
  }

  return { check, nameTokens, domainTokens }
}

/**
 * DER RIEGEL ÜBER MEHRERE TEXTE EINES ELEMENTS.
 *
 * Ein Befund besteht aus `why` UND `suggestion`, eine Konvention aus
 * `statement`. Fällt EIN Teil, fällt das ganze Element — ein Befund mit
 * gestrichenem Vorschlag wäre ein halber Befund, und `suggestion` ist Pflicht
 * (Plan §2.3 Nr. 4).
 */
export function checkMarketTexts(
  guard: MarketDisparagementGuard,
  texts: readonly (string | undefined)[],
): MarketFilterReason | null {
  for (const text of texts) {
    if (!text) continue
    const reason = guard.check(text)
    if (reason) return reason
  }
  return null
}
