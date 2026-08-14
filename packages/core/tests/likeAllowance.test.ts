import { describe, expect, it } from 'vitest'
import {
  crossesLikeLimit,
  decideLikeSpend,
  likeLimitFrom,
  utcDayKey,
  LIKES_PER_DAY_DEFAULT,
  LIKE_LIMIT_REACHED,
} from '../shared/likeAllowance'

/**
 * DAS TAGES-LIMIT FÜR LIKES — die Regeln (F57 Mechanik 3).
 *
 * Geprüft wird das, was die Mechanik AUSMACHT und was man beim „Aufräumen"
 * kaputtmachen könnte: der UTC-Tag, die defensive Config, der Tageswechsel —
 * und vor allem die beiden Zusagen, an denen alles hängt: die Rücknahme
 * erstattet nichts, und der Abzeichen-Tag wird genau EINMAL gebucht.
 */

describe('utcDayKey', () => {
  it('liefert den UTC-Kalendertag', () => {
    expect(utcDayKey(Date.parse('2026-08-14T12:00:00Z'))).toBe('2026-08-14')
  })

  it('wechselt um MITTERNACHT UTC, nicht um lokale Mitternacht', () => {
    expect(utcDayKey(Date.parse('2026-08-14T23:59:59Z'))).toBe('2026-08-14')
    expect(utcDayKey(Date.parse('2026-08-15T00:00:00Z'))).toBe('2026-08-15')
  })

  /**
   * DIE GEGENPROBE ZUR ZEITZONEN-ENTSCHEIDUNG: derselbe Augenblick ist in
   * Auckland schon der 15., der Schlüssel bleibt trotzdem der 14. Genau das ist
   * gewollt — ein Limit, das mit der Zonen-Wahl wandert, wäre manipulierbar.
   */
  it('kennt keine Nutzer-Zeitzone', () => {
    const moment = Date.parse('2026-08-14T22:00:00Z') // 10:00 des 15. in UTC+12
    expect(utcDayKey(moment)).toBe('2026-08-14')
  })
})

describe('likeLimitFrom', () => {
  it('nimmt eine gesetzte Zahl', () => {
    expect(likeLimitFrom(3)).toBe(3)
  })

  it('0 schaltet die Mechanik aus', () => {
    expect(likeLimitFrom(0)).toBe(0)
  })

  /**
   * Eine kaputte Config ist NICHT „unbegrenzt". Das ist der Unterschied
   * zwischen einer Sicherung und einer Bitte: abschalten geht über die 0,
   * nicht über einen Tippfehler.
   */
  it('fällt bei Unsinn auf die Vorgabe zurück, nie auf unbegrenzt', () => {
    expect(likeLimitFrom(undefined)).toBe(LIKES_PER_DAY_DEFAULT)
    expect(likeLimitFrom(null)).toBe(LIKES_PER_DAY_DEFAULT)
    expect(likeLimitFrom('viele')).toBe(LIKES_PER_DAY_DEFAULT)
    expect(likeLimitFrom(Number.NaN)).toBe(LIKES_PER_DAY_DEFAULT)
    expect(likeLimitFrom(-1)).toBe(LIKES_PER_DAY_DEFAULT)
  })

  it('die Vorgabe ist Davids Zahl', () => {
    expect(LIKES_PER_DAY_DEFAULT).toBe(50)
  })
})

describe('decideLikeSpend', () => {
  const today = '2026-08-14'

  it('ohne Limit wird gar nichts mitgeschrieben', () => {
    expect(decideLikeSpend({ limit: 0, today, storedDay: today, storedCount: 99 })).toEqual({ mode: 'off' })
  })

  it('erster Like überhaupt: neuer Tag', () => {
    expect(decideLikeSpend({ limit: 3, today, storedDay: '', storedCount: 0 })).toEqual({ mode: 'reset' })
  })

  it('erster Like eines neuen Tages setzt den gestrigen Stand zurück', () => {
    expect(decideLikeSpend({ limit: 3, today, storedDay: '2026-08-13', storedCount: 3 })).toEqual({ mode: 'reset' })
  })

  it('derselbe Tag mit Platz: hochzählen', () => {
    expect(decideLikeSpend({ limit: 3, today, storedDay: today, storedCount: 0 })).toEqual({ mode: 'count' })
    expect(decideLikeSpend({ limit: 3, today, storedDay: today, storedCount: 2 })).toEqual({ mode: 'count' })
  })

  it('aufgebraucht: abgewiesen', () => {
    expect(decideLikeSpend({ limit: 3, today, storedDay: today, storedCount: 3 })).toEqual({ mode: 'denied' })
  })

  /**
   * ÜBER DEM LIMIT bleibt abgewiesen. Der Fall entsteht, wenn jemand das Limit
   * SENKT — der Stand von heute ist dann höher als das neue Kontingent, und
   * die Antwort muss „nein" sein und nicht „noch mal von vorn".
   */
  it('ein gesenktes Limit sperrt sofort, statt neu zu zählen', () => {
    expect(decideLikeSpend({ limit: 3, today, storedDay: today, storedCount: 40 })).toEqual({ mode: 'denied' })
  })

  /**
   * DIE ZUSAGE, AUF DER DIE GANZE MECHANIK STEHT: es gibt keinen Weg zurück.
   * Die Funktion nimmt gar keinen Parameter entgegen, über den eine Rücknahme
   * etwas erstatten könnte — wer das ändern will, muss die Schnittstelle
   * ändern und stolpert über diesen Test.
   */
  it('kennt keine Erstattung — der Stand kennt nur den Verbrauch', () => {
    const nachDreiLikes = { limit: 3, today, storedDay: today, storedCount: 3 }
    expect(decideLikeSpend(nachDreiLikes)).toEqual({ mode: 'denied' })
    // Auch „nach einer Rücknahme" gibt es keinen anderen Aufruf: derselbe
    // gespeicherte Stand ⇒ dieselbe Antwort.
    expect(decideLikeSpend(nachDreiLikes)).toEqual({ mode: 'denied' })
  })
})

describe('crossesLikeLimit', () => {
  it('genau der Schritt AUF das Limit zählt', () => {
    expect(crossesLikeLimit(3, 3)).toBe(true)
  })

  /**
   * DIE IDEMPOTENZ JE TAG: alles davor und alles danach ist kein Übergang.
   * Mit `>=` bekäme jeder weitere Versuch desselben Tages einen zweiten Tag
   * gutgeschrieben — „an 5 Tagen" hieße dann „fünfmal dagegengelaufen".
   */
  it('davor und danach nicht', () => {
    expect(crossesLikeLimit(2, 3)).toBe(false)
    expect(crossesLikeLimit(4, 3)).toBe(false)
    expect(crossesLikeLimit(40, 3)).toBe(false)
  })

  it('ohne Limit gibt es keinen Übergang', () => {
    expect(crossesLikeLimit(0, 0)).toBe(false)
  })
})

describe('LIKE_LIMIT_REACHED', () => {
  /**
   * Der Wert steht in zwei Routen und zwei Oberflächen. Er ist damit ein
   * VERTRAG und keine Formulierung — ein Umbenennen bricht die Meldung an
   * einer Stelle, die kein Typ prüft.
   */
  it('ist der Schlüssel, den die Oberflächen lesen', () => {
    expect(LIKE_LIMIT_REACHED).toBe('like_limit_reached')
  })
})
