import { describe, expect, it } from 'vitest'
import {
  KNOWN_OAUTH_PROVIDERS,
  OAUTH_UNAVAILABLE_CODE,
  isKnownOauthProvider,
  oauthFailureTarget,
  oauthLocalePrefix,
  oauthProviderAllowed,
  parseOauthProviderList,
  resolveOauthProviders,
} from '../shared/oauthProviders'
import de from '../i18n/locales/de.json'
import en from '../i18n/locales/en.json'

describe('isKnownOauthProvider', () => {
  it('kennt google und github', () => {
    expect(isKnownOauthProvider('google')).toBe(true)
    expect(isKnownOauthProvider('github')).toBe(true)
  })

  it('weist alles andere ab, ohne zu werfen', () => {
    for (const value of ['apple', 'Google ', '', 'facebook', null, undefined, 42, {}]) {
      expect(isKnownOauthProvider(value)).toBe(false)
    }
  })
})

describe('parseOauthProviderList', () => {
  it('liest die kommagetrennte Env-Liste', () => {
    expect(parseOauthProviderList('google,github')).toEqual(['google', 'github'])
  })

  it('verzeiht Leerzeichen und Großschreibung — Env-Werte werden getippt', () => {
    expect(parseOauthProviderList(' Google , GITHUB ')).toEqual(['google', 'github'])
  })

  it('lässt Unbekanntes still weg statt zu werfen', () => {
    expect(parseOauthProviderList('google,apple,tippfehler')).toEqual(['google'])
  })

  it('entdoppelt', () => {
    expect(parseOauthProviderList('google,google')).toEqual(['google'])
  })

  it('leer/kein String ⇒ leere Liste', () => {
    for (const value of ['', '   ', ',,', null, undefined, 7]) {
      expect(parseOauthProviderList(value)).toEqual([])
    }
  })
})

describe('resolveOauthProviders — ZWEI Bedingungen', () => {
  it('zeigt den Provider nur, wenn App UND Instanz ihn haben', () => {
    expect(resolveOauthProviders(['google'], 'google')).toEqual(['google'])
  })

  it('Config allein reicht NICHT — der Kern der Absicherung ohne Credentials', () => {
    expect(resolveOauthProviders(['google'], '')).toEqual([])
    expect(resolveOauthProviders(['google'], undefined)).toEqual([])
  })

  it('Env allein reicht NICHT — eine App, die ihn nicht anbietet, bekommt keinen Knopf', () => {
    expect(resolveOauthProviders([], 'google')).toEqual([])
    expect(resolveOauthProviders(undefined, 'google')).toEqual([])
  })

  it('bildet die Schnittmenge', () => {
    expect(resolveOauthProviders(['google', 'github'], 'github')).toEqual(['github'])
  })

  it('die Reihenfolge kommt aus der Config, nicht aus der Env', () => {
    expect(resolveOauthProviders(['github', 'google'], 'google,github')).toEqual(['github', 'google'])
  })

  it('entdoppelt und ignoriert Unbekanntes auf BEIDEN Seiten', () => {
    expect(resolveOauthProviders(['google', 'google', 'apple'], 'google,apple')).toEqual(['google'])
  })
})

describe('oauthProviderAllowed — die Route glaubt dem Klick nichts', () => {
  it('lässt den angebotenen Provider durch', () => {
    expect(oauthProviderAllowed('google', ['google'], 'google')).toBe(true)
  })

  it('weist einen NICHT angebotenen Provider ab, auch wenn der Code ihn kennt', () => {
    expect(oauthProviderAllowed('github', ['google'], 'google')).toBe(false)
  })

  it('weist ab, solange die Instanz keine Credentials meldet', () => {
    expect(oauthProviderAllowed('google', ['google'], '')).toBe(false)
  })

  it('weist Unbekanntes/Unsinn ab', () => {
    for (const value of ['apple', '', null, undefined, {}]) {
      expect(oauthProviderAllowed(value, ['google'], 'google')).toBe(false)
    }
  })
})

describe('oauthLocalePrefix', () => {
  it('en (Default) hat keinen Prefix', () => {
    expect(oauthLocalePrefix('en')).toBe('')
  })

  it('de bekommt seinen Prefix', () => {
    expect(oauthLocalePrefix('de')).toBe('/de')
  })

  it('Regionalformen bleiben erhalten', () => {
    expect(oauthLocalePrefix('de-AT')).toBe('/de-AT')
  })

  it('fehlt/leer ⇒ kein Prefix', () => {
    for (const value of ['', '   ', null, undefined, 3]) {
      expect(oauthLocalePrefix(value)).toBe('')
    }
  })

  it('ein Cookie ist EINGABE: alles Formfremde fällt auf den Default zurück', () => {
    // Ohne diese Prüfung landete ein fremder Cookie-Wert in einer Location-Kopfzeile.
    for (const value of [
      '../../evil',
      '/evil',
      'de/../../etc',
      'https://phishing.example',
      'de\nSet-Cookie: a=b',
      'de?x=1',
      'toolongcode',
    ]) {
      expect(oauthLocalePrefix(value)).toBe('')
    }
  })
})

describe('oauthFailureTarget', () => {
  it('führt auf die Anmeldeseite der eigenen Sprache, mit Grund', () => {
    expect(oauthFailureTarget('de')).toBe(`/de/login?error=${OAUTH_UNAVAILABLE_CODE}`)
    expect(oauthFailureTarget('en')).toBe(`/login?error=${OAUTH_UNAVAILABLE_CODE}`)
  })

  it('bleibt bei unsinniger Locale ein relativer Pfad auf DIESEM Host', () => {
    const target = oauthFailureTarget('https://phishing.example')
    expect(target.startsWith('/login?')).toBe(true)
  })
})

/**
 * Ein Grund-Schlüssel, den die Anmeldeseite anzeigen soll, braucht einen Text
 * in BEIDEN Sprachen — sonst steht dort der rohe Schlüssel (derselbe Fehler,
 * den `check:i18n-keys` für Config-Schlüssel abfängt; ein `?error=`-Wert ist
 * für den Wächter unsichtbar, deshalb hier).
 */
describe('i18n-Deckung der OAuth-Texte', () => {
  const locales = { de, en } as Record<string, Record<string, unknown>>

  function lookup(bundle: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>(
      (node, key) => (typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[key] : undefined),
      bundle,
    )
  }

  const REQUIRED = [
    'auth.oauth.google',
    'auth.oauth.github',
    'auth.oauth.privacy',
    `auth.oauth.${OAUTH_UNAVAILABLE_CODE}`,
  ]

  for (const [code, bundle] of Object.entries(locales)) {
    for (const key of REQUIRED) {
      it(`${code}: ${key} existiert und ist nicht leer`, () => {
        const value = lookup(bundle, key)
        expect(typeof value).toBe('string')
        expect((value as string).trim().length).toBeGreaterThan(0)
      })
    }
  }

  it('jeder bekannte Provider hat ein Label in beiden Sprachen', () => {
    for (const provider of KNOWN_OAUTH_PROVIDERS) {
      for (const [, bundle] of Object.entries(locales)) {
        expect(typeof lookup(bundle, `auth.oauth.${provider}`)).toBe('string')
      }
    }
  })

  it('die Datenschutz-Zeile nennt beide Seiten: was Google erfährt UND was nicht', () => {
    // Der Pflicht-Gedanke aus U14 — eine Zeile, die nur wirbt, wäre keine Haltung.
    expect(lookup(de, 'auth.oauth.privacy')).toMatch(/Werbe/i)
    expect(lookup(en, 'auth.oauth.privacy')).toMatch(/ad tracking/i)
  })

  it('keine spitzen Klammern in den OAuth-Texten (nuxt-i18n hielte sie für HTML)', () => {
    for (const [, bundle] of Object.entries(locales)) {
      for (const key of REQUIRED) {
        expect(String(lookup(bundle, key))).not.toMatch(/[<>]/)
      }
    }
  })
})
