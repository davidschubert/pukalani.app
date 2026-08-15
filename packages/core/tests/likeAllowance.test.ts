import { describe, expect, it } from 'vitest'
import {
  booksLikeLimitDay,
  crossesLikeLimit,
  decideLikeSpend,
  likeLimitForLevel,
  likeLimitFrom,
  likeMechanicOff,
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

/**
 * DIE STAFFEL (F57-Stufen, 2026-08-14) — TL0/TL1 = 50, TL2 = 75, TL3+ = 100.
 *
 * Geprüft wird, was beim „Vereinfachen" kaputtgeht: dass eine halb kaputte
 * Config nicht die ganze Staffel auf die Vorgabe zurückwirft, dass die
 * ernannte Stufe 4 den obersten Eintrag bekommt statt gar keinen, und dass
 * „aus" nur heißt, was es sagt — KEINE Stufe hat ein Kontingent.
 */
describe('likeLimitForLevel — das Kontingent einer Stufe', () => {
  it('gibt Davids Staffel, wenn die Config schweigt', () => {
    expect(likeLimitForLevel(undefined, 0)).toBe(50)
    expect(likeLimitForLevel(undefined, 1)).toBe(50)
    expect(likeLimitForLevel(undefined, 2)).toBe(75)
    expect(likeLimitForLevel(undefined, 3)).toBe(100)
  })

  it('gibt der ERNANNTEN Stufe 4 den obersten Eintrag', () => {
    // Sie hat bewusst keinen eigenen: eine fünfte Zahl hieße zu entscheiden,
    // ob eine Ernennung mehr wert ist als der höchste erarbeitete Rang.
    expect(likeLimitForLevel(undefined, 4)).toBe(100)
    expect(likeLimitForLevel(undefined, 99)).toBe(100)
  })

  it('klemmt eine unlesbare Stufe auf die UNTERSTE, nicht auf die oberste', () => {
    // Die gutmütige Richtung wäre hier die falsche: ein kaputter Stufen-Wert
    // darf niemandem das größere Kontingent schenken.
    expect(likeLimitForLevel(undefined, Number.NaN)).toBe(50)
    expect(likeLimitForLevel(undefined, -3)).toBe(50)
    expect(likeLimitForLevel(undefined, null)).toBe(50)
  })

  it('nimmt die Config, wenn sie eine Liste ist', () => {
    expect(likeLimitForLevel([3, 4, 5, 6], 2)).toBe(5)
    expect(likeLimitForLevel([3], 3)).toBe(3)
  })

  it('ersetzt NUR den kaputten Eintrag, nicht die ganze Staffel', () => {
    // Ein Tippfehler an Stelle drei darf die bewusst gesetzte 0 an Stelle
    // eins nicht aufheben — sonst hebt ein Versehen ein Abschalten auf.
    const staffel = [0, 'viele', 75, 100]
    expect(likeLimitForLevel(staffel, 0)).toBe(0)
    expect(likeLimitForLevel(staffel, 1)).toBe(50)
    expect(likeLimitForLevel(staffel, 2)).toBe(75)
  })

  it('fällt bei allem, was keine Liste ist, auf die Vorgabe zurück', () => {
    expect(likeLimitForLevel(50, 2)).toBe(75)
    expect(likeLimitForLevel([], 2)).toBe(75)
    expect(likeLimitForLevel({ 2: 9 }, 2)).toBe(75)
  })
})

describe('likeMechanicOff — wann die Zeile ungelesen bleiben darf', () => {
  it('ist nur aus, wenn KEINE Stufe ein Kontingent hat', () => {
    expect(likeMechanicOff([0, 0, 0, 0])).toBe(true)
    expect(likeMechanicOff(undefined)).toBe(false)
  })

  it('ist NICHT aus, wenn nur die unterste Stufe frei ist', () => {
    // Sonst verlören die Stufen 1–3 ihr Limit stillschweigend.
    expect(likeMechanicOff([0, 50, 75, 100])).toBe(false)
  })
})

describe('booksLikeLimitDay — genau einmal je Tag, auch über einen Aufstieg hinweg', () => {
  it('bucht die Überschreitung eines noch nicht gebuchten Tages', () => {
    expect(booksLikeLimitDay(50, 50, '', '2026-08-14')).toBe(true)
    expect(booksLikeLimitDay(50, 50, '2026-08-13', '2026-08-14')).toBe(true)
  })

  /**
   * DER FALL, FÜR DEN ES DIE SPALTE GIBT: mit 50 das Kontingent leergeräumt,
   * dann mitten am Tag auf Stufe 2 aufgestiegen (der Aufstieg passiert beim
   * Schreiben), dann bei 75 ein zweites Mal die Gleichheit getroffen. Ohne den
   * gemerkten Tag stünden an EINEM Nachmittag zwei „Tage" für „Higher Love".
   */
  it('bucht denselben Tag NICHT ein zweites Mal, wenn das Limit dazwischen wächst', () => {
    expect(booksLikeLimitDay(50, 50, '', '2026-08-14')).toBe(true)
    expect(booksLikeLimitDay(75, 75, '2026-08-14', '2026-08-14')).toBe(false)
  })

  it('bucht am nächsten Tag wieder', () => {
    expect(booksLikeLimitDay(75, 75, '2026-08-14', '2026-08-15')).toBe(true)
  })
})
