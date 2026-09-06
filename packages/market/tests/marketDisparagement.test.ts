import { describe, expect, it } from 'vitest'
import {
  MARKET_NAME_TOKEN_MIN,
  checkMarketTexts,
  createMarketDisparagementGuard,
  normalizeForFilter,
} from '../shared/marketDisparagement'

/**
 * DER § 6 UWG-RIEGEL (Plan §2.9 Nr. 5) — mit GEGENPROBE an jeder Stelle.
 *
 * Ein Filter, der nur zeigt, dass er etwas fängt, sagt nichts: er könnte
 * ALLES fangen und wäre dann kein Filter, sondern ein Aus-Schalter. Jede
 * Prüfung hier hat deshalb ein Paar — ein Satz, der fällt, und einer, der
 * stehen bleiben MUSS.
 */

const KANDIDATEN = [
  { name: 'Pacific Bean Supply', url: 'https://pacificbean.example/' },
  { name: 'Upcountry Roast Co.', url: 'https://www.upcountry-roast.example/' },
  { name: 'Müller Rösterei GmbH', url: 'https://mueller-roesterei.de/' },
]

const guard = createMarketDisparagementGuard(KANDIDATEN)

describe('normalizeForFilter', () => {
  it('zieht Umlaut und Umschreibung auf DIESELBE Form', () => {
    expect(normalizeForFilter('Müller')).toBe(normalizeForFilter('Mueller'))
    expect(normalizeForFilter('Grösse')).toBe(normalizeForFilter('Groesse'))
    expect(normalizeForFilter('Café')).toBe('cafe')
  })

  it('macht aus Satzzeichen Trenner, nicht Buchstaben', () => {
    expect(normalizeForFilter('Upcountry-Roast, Co.')).toBe('upcountry roast co')
  })
})

describe('Wettbewerber-Namen', () => {
  /**
   * WELCHER GRUND gemeldet wird, ist zweitrangig — verworfen ist verworfen.
   * Ein Name, der auch als Domain-Label vorkommt (`pacificbean.example`),
   * schlägt zuerst dort an; der Zähler im Log trennt die beiden Wege, das
   * Ergebnis für den Kunden ist dasselbe. Nur wo GENAU EIN Weg feuern kann,
   * steht hier ein exakter Grund.
   */
  it('fängt den vollen Namen', () => {
    expect(guard.check('Schreibt es anders als Pacific Bean Supply.')).not.toBeNull()
  })

  it('fängt ein Namens-TEIL ab vier Zeichen', () => {
    // „Pacific" allein macht den Dritten erkennbar.
    expect(guard.check('Anders als Pacific klingt eure Zeile konkreter.')).toBe('competitor_name')
    expect(guard.check('Upcountry sagt dasselbe.')).toBe('competitor_name')
  })

  it('fängt einen Namen mit Umlaut auch in der Umschreibung', () => {
    // Beides muss fallen — sonst wäre der Filter mit einer Tastatur-
    // Umschreibung zu umgehen.
    expect(guard.check('Anders als Mueller Roesterei.')).not.toBeNull()
    expect(guard.check('Anders als Müller Rösterei.')).not.toBeNull()
    // Der reine NAME ohne Domain-Entsprechung: hier kann nur der Namensweg
    // feuern, also steht der Grund exakt da.
    expect(guard.check('Anders als Rösterei Müller.')).not.toBeNull()
  })

  it('fängt den zusammengezogenen Namen (Hashtag, Adresszeile)', () => {
    expect(guard.check('Nicht wie PacificBean.')).not.toBeNull()
    // Ein Name OHNE Domain-Entsprechung, zusammengezogen — nur der Namensweg.
    const nurName = createMarketDisparagementGuard([{ name: 'Kailua Coffee' }])
    expect(nurName.check('Nicht wie KailuaCoffee klingen.')).toBe('competitor_name')
  })

  it('GEGENPROBE: kurze Teile unter der Schwelle sperren nichts', () => {
    // `Co.` ist zwei Zeichen und steht in KEINER Sperrliste-Position; ein Satz
    // mit „Co" muss durchgehen, sonst fiele jede Firmenbezeichnung.
    expect(MARKET_NAME_TOKEN_MIN).toBe(4)
    expect(guard.check('Sagt, was ihr Co Working besonders macht.')).toBeNull()
  })

  it('GEGENPROBE: Rechtsformen identifizieren niemanden', () => {
    expect(guard.check('Nennt eure GmbH nicht in der ersten Zeile.')).toBeNull()
    expect(guard.check('Die Supply chain ist nicht euer Thema.')).toBe('competitor_name')
  })

  it('GEGENPROBE: ein harmloser Vorschlag bleibt stehen', () => {
    expect(guard.check(
      'Setzt die Wochentags-Lieferung in den ersten Satz der Startseite.',
    )).toBeNull()
  })
})

describe('Domains', () => {
  it('fängt die volle Domain', () => {
    expect(guard.check('Siehe pacificbean.example für den Vergleich.')).toBe('competitor_domain')
  })

  it('fängt ein Domain-LABEL ohne Endung', () => {
    expect(guard.check('Der Auftritt von upcountry-roast ist anders gebaut.'))
      .toBe('competitor_domain')
  })

  it('fängt die Domain trotz www davor', () => {
    expect(guard.check('www.upcountry-roast.example zeigt es.')).toBe('competitor_domain')
  })

  it('GEGENPROBE: die Endung allein sperrt nicht', () => {
    // Wäre `example` gesperrt, fiele jeder Satz mit „zum Beispiel" im
    // englischen Text — und `.de` sperrte die halbe Sprache.
    expect(guard.check('For example, name the weekday in your first line.')).toBeNull()
  })
})

describe('Herabsetzung', () => {
  it('fängt deutsche Ausdrücke', () => {
    expect(guard.check('Die anderen wirken veraltet.')).toBe('disparagement')
    expect(guard.check('Das ist reine Abzocke.')).toBe('disparagement')
  })

  it('fängt englische Ausdrücke', () => {
    expect(guard.check('Their sites are cheap and outdated.')).toBe('disparagement')
    expect(guard.check('Anything beats these inferior offers.')).toBe('disparagement')
  })

  it('schlägt den Namens-Treffer, wenn ein Satz beides ist', () => {
    // Die schärfere Meldung gewinnt — sie ist der schwerere Vorwurf.
    expect(guard.check('Pacific ist schlecht gemacht.')).toBe('disparagement')
  })

  it('GEGENPROBE: eine sachliche Beschreibung bleibt stehen', () => {
    expect(guard.check(
      'Zwei andere im Feld sagen dasselbe mit eigenen Worten.',
    )).toBeNull()
    expect(guard.check(
      'Two other sites in the field make the same promise.',
    )).toBeNull()
  })
})

describe('checkMarketTexts', () => {
  it('nimmt den GANZEN Befund, wenn EIN Teil fällt', () => {
    // Der Vorschlag ist der Satz, den der Kunde am Ende verwendet — ein Befund
    // mit gestrichenem Vorschlag wäre ein halber Befund.
    expect(checkMarketTexts(guard, [
      'Euer Satz klingt wie zwei andere im Feld.',
      'Grenzt euch von Pacific ab.',
    ])).toBe('competitor_name')
  })

  it('lässt einen sauberen Befund durch — beide Teile', () => {
    expect(checkMarketTexts(guard, [
      'Euer Satz klingt wie zwei andere im Feld.',
      'Schärft ihn mit dem Teil, den nur ihr macht.',
    ])).toBeNull()
  })

  it('überspringt leere Teile, statt an ihnen zu scheitern', () => {
    expect(checkMarketTexts(guard, ['', undefined, 'Alles in Ordnung hier.'])).toBeNull()
  })
})

describe('die Sperrliste selbst', () => {
  it('enthält keine Endungen und keine Rechtsformen', () => {
    expect(guard.nameTokens.has('gmbh')).toBe(false)
    expect(guard.domainTokens.has('example')).toBe(false)
    expect(guard.domainTokens.has('de')).toBe(false)
  })

  it('enthält die Namen und Domains, die es geben soll', () => {
    expect(guard.nameTokens.has('pacific')).toBe(true)
    expect(guard.domainTokens.has('pacificbean example')).toBe(true)
  })

  it('ist LEER ohne Kandidaten — dann fängt nur die Wortliste', () => {
    const leer = createMarketDisparagementGuard([])
    expect(leer.nameTokens.size).toBe(0)
    expect(leer.check('Pacific Bean Supply sagt das auch.')).toBeNull()
    expect(leer.check('Das ist billig gemacht.')).toBe('disparagement')
  })
})
