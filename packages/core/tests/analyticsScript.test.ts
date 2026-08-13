import { describe, expect, it } from 'vitest'
import {
  ANALYTICS_PROXY_EVENT_PATH,
  ANALYTICS_PROXY_SCRIPT_PATH,
  ANALYTICS_SCRIPT_ID_RE,
  analyticsUpstreamBase,
  effectiveScriptId,
  headScriptId,
  isPlausibleScriptId,
  plausibleScriptUrl,
  proxiedScriptSrc,
  scriptIdFromUrl,
} from '../shared/analyticsScript'

describe('isPlausibleScriptId', () => {
  it('erkennt echte v3-Ids und den Leerstring (= aus)', () => {
    expect(isPlausibleScriptId('pa-NFzv_HzyhC-TnVE577Kx6')).toBe(true)
    expect(isPlausibleScriptId('')).toBe(true)
  })

  it('weist alles ab, was eine HERKUNFT benennen könnte', () => {
    for (const value of [
      'https://boese.example/js/x.js',
      '//boese.example/x.js',
      'pa-abcdefgh.js',
      'pa-abcdefgh/../evil',
      'pa-abcdefgh?x=1',
      'pa-abcdefgh:8080',
    ]) {
      expect(isPlausibleScriptId(value)).toBe(false)
    }
  })

  it('ist ein Typ-Wächter — Nicht-Strings fallen durch', () => {
    expect(isPlausibleScriptId(undefined)).toBe(false)
    expect(isPlausibleScriptId(null)).toBe(false)
    expect(isPlausibleScriptId(42)).toBe(false)
  })

  it('das Muster ist verankert (kein Treffer irgendwo in der Mitte)', () => {
    expect(ANALYTICS_SCRIPT_ID_RE.test('x pa-abcdefgh')).toBe(false)
    expect(ANALYTICS_SCRIPT_ID_RE.test('pa-abcdefgh x')).toBe(false)
  })
})

describe('plausibleScriptUrl', () => {
  it('baut die Adresse aus Instanz + Id', () => {
    expect(plausibleScriptUrl('https://plausible.hawaii.studio', 'pa-abcdefgh'))
      .toBe('https://plausible.hawaii.studio/js/pa-abcdefgh.js')
  })

  it('normalisiert Schrägstriche am Ende der Instanz', () => {
    expect(plausibleScriptUrl('https://plausible.hawaii.studio//', 'pa-abcdefgh'))
      .toBe('https://plausible.hawaii.studio/js/pa-abcdefgh.js')
  })

  /**
   * Die Gegenprobe, ohne die der Rest wertlos wäre: eine ungeprüfte Id würde
   * hier zu einer Adresse mit fremder Herkunft — genau das darf nicht gehen.
   */
  it('gibt LEER zurück statt eine fremde Adresse zu bauen', () => {
    expect(plausibleScriptUrl('https://plausible.hawaii.studio', 'https://boese.example/x.js')).toBe('')
    expect(plausibleScriptUrl('https://plausible.hawaii.studio', '../../boese')).toBe('')
  })

  it('gibt LEER zurück, wenn eine Seite fehlt', () => {
    expect(plausibleScriptUrl('', 'pa-abcdefgh')).toBe('')
    expect(plausibleScriptUrl('https://plausible.hawaii.studio', '')).toBe('')
    expect(plausibleScriptUrl(undefined, undefined)).toBe('')
  })
})

describe('effectiveScriptId', () => {
  const OWN = 'pa-NFzv_HzyhC-TnVE577Kx6'
  const SHARED = { scriptId: 'pa-nw6c94JiRWqzOc-zDcn1a' }

  it('die eigene Site gewinnt — auch gegen einen eingeschalteten Schalter', () => {
    expect(effectiveScriptId({ plausibleScriptId: OWN }, SHARED)).toBe(OWN)
    expect(effectiveScriptId({ plausibleScriptId: OWN, enabled: true }, SHARED)).toBe(OWN)
    expect(effectiveScriptId({ plausibleScriptId: OWN, enabled: false }, SHARED)).toBe(OWN)
  })

  it('sonst zählt der Schalter — mit der Id der Sammel-Site', () => {
    expect(effectiveScriptId({ plausibleScriptId: '', enabled: true }, SHARED)).toBe(SHARED.scriptId)
    expect(effectiveScriptId({ enabled: true }, SHARED)).toBe(SHARED.scriptId)
  })

  it('aus heißt aus — kein Rückfall auf irgendeine Vorgabe', () => {
    expect(effectiveScriptId({ plausibleScriptId: '', enabled: false }, SHARED)).toBe('')
    expect(effectiveScriptId({}, SHARED)).toBe('')
    expect(effectiveScriptId(null, SHARED)).toBe('')
    expect(effectiveScriptId(undefined, SHARED)).toBe('')
  })

  it('ohne Sammel-Site ist der Schalter wirkungslos (Silo, lokale Entwicklung)', () => {
    expect(effectiveScriptId({ enabled: true }, {})).toBe('')
    expect(effectiveScriptId({ enabled: true }, { scriptId: '' })).toBe('')
  })

  /**
   * Die Prüfung gilt BEIDEN Herkünften: auch ein Wert aus der App-Config wird
   * zu einem `<script src>`, und ein Tippfehler dort ist kein Freibrief.
   */
  it('lässt keine unbrauchbare Id durch — weder aus der Zeile noch aus der Config', () => {
    expect(effectiveScriptId({ plausibleScriptId: 'https://boese.example/x.js' }, SHARED)).toBe('')
    expect(effectiveScriptId({ plausibleScriptId: 'https://boese.example/x.js', enabled: true }, SHARED)).toBe(SHARED.scriptId)
    expect(effectiveScriptId({ enabled: true }, { scriptId: 'https://boese.example/x.js' })).toBe('')
  })
})

/* ─── Adblock-Proxy (F47/Paket 5) ──────────────────────────────────────── */

describe('analyticsUpstreamBase', () => {
  it('nimmt die Instanz, wenn es eine gibt (Selbstbedienung)', () => {
    expect(analyticsUpstreamBase({ instance: 'https://plausible.hawaii.studio' }))
      .toBe('https://plausible.hawaii.studio')
    expect(analyticsUpstreamBase({ instance: 'https://plausible.hawaii.studio//' }))
      .toBe('https://plausible.hawaii.studio')
  })

  it('rechnet sie sonst aus dem statischen src zurück (marketing, portfolio)', () => {
    expect(analyticsUpstreamBase({ src: 'https://plausible.hawaii.studio/js/pa-abcdefgh.js' }))
      .toBe('https://plausible.hawaii.studio')
  })

  it('die Instanz schlägt den src — dieselbe Rangfolge wie beim Script-Tag', () => {
    expect(analyticsUpstreamBase({
      instance: 'https://eigene.example',
      src: 'https://andere.example/js/pa-abcdefgh.js',
    })).toBe('https://eigene.example')
  })

  /**
   * Der Rückgabewert wird zur Ziel-Adresse eines server-seitigen `fetch`. Was
   * kein http(s)-Ursprung ist, darf gar nicht erst herauskommen — sonst wäre
   * eine verrutschte Config ein Zugriff auf das Dateisystem oder das interne
   * Netz.
   */
  it('lässt nur echte http(s)-Ursprünge durch', () => {
    expect(analyticsUpstreamBase({ instance: 'file:///etc/passwd' })).toBe('')
    expect(analyticsUpstreamBase({ instance: 'javascript:alert(1)' })).toBe('')
    expect(analyticsUpstreamBase({ instance: '//plausible.hawaii.studio' })).toBe('')
    expect(analyticsUpstreamBase({ instance: 'plausible.hawaii.studio' })).toBe('')
    expect(analyticsUpstreamBase({ instance: 'https://mit pause.example' })).toBe('')
  })

  it('ohne alles: leer (dann proxyt der Host nicht)', () => {
    expect(analyticsUpstreamBase({})).toBe('')
    expect(analyticsUpstreamBase(null)).toBe('')
    expect(analyticsUpstreamBase(undefined)).toBe('')
    expect(analyticsUpstreamBase({ src: '/js/pa-abcdefgh.js' })).toBe('')
  })
})

describe('scriptIdFromUrl', () => {
  it('holt die Id aus einer fertigen Script-Adresse', () => {
    expect(scriptIdFromUrl('https://plausible.hawaii.studio/js/pa-ZnNaY3DI2-T4g_llEUh5l.js'))
      .toBe('pa-ZnNaY3DI2-T4g_llEUh5l')
  })

  /**
   * Das Legacy-Script hat keine `pa-…`-Id — der Proxy MUSS dort aussteigen,
   * sonst bauten wir eine Adresse, die es auf der Instanz nicht gibt.
   */
  it('steigt beim Legacy-Script aus', () => {
    expect(scriptIdFromUrl('https://plausible.io/js/script.js')).toBe('')
    expect(scriptIdFromUrl('https://plausible.io/js/script.hash.outbound-links.js')).toBe('')
  })

  it('gibt nichts zurück, was nicht die Form einer Id hat', () => {
    expect(scriptIdFromUrl('https://boese.example/js/../../etc/passwd.js')).toBe('')
    expect(scriptIdFromUrl('https://plausible.hawaii.studio/pa-abcdefgh.js')).toBe('')
    expect(scriptIdFromUrl('')).toBe('')
    expect(scriptIdFromUrl(undefined)).toBe('')
  })
})

describe('headScriptId', () => {
  it('die Zeile der Community schlägt die gebaute Config', () => {
    expect(headScriptId(
      { src: 'https://plausible.hawaii.studio/js/pa-ausderconfig.js' },
      'pa-ausderzeile',
    )).toBe('pa-ausderzeile')
  })

  it('ohne Selbstbedienung bleibt die Config', () => {
    expect(headScriptId({ src: 'https://plausible.hawaii.studio/js/pa-abcdefgh.js' }, ''))
      .toBe('pa-abcdefgh')
    expect(headScriptId({ src: 'https://plausible.hawaii.studio/js/pa-abcdefgh.js' }, undefined))
      .toBe('pa-abcdefgh')
  })

  it('eine unbrauchbare Selbstbedienungs-Id fällt auf die Config zurück', () => {
    expect(headScriptId(
      { src: 'https://plausible.hawaii.studio/js/pa-abcdefgh.js' },
      'https://boese.example/x.js',
    )).toBe('pa-abcdefgh')
  })

  it('ohne beides: leer', () => {
    expect(headScriptId({}, '')).toBe('')
    expect(headScriptId(null, undefined)).toBe('')
  })
})

describe('proxiedScriptSrc', () => {
  it('zeigt auf den eigenen Host und trägt die Id im Query', () => {
    expect(proxiedScriptSrc('pa-abcdefgh')).toBe('/api/stats-script.js?id=pa-abcdefgh')
  })

  /**
   * DER SICHERHEITSGURT: ohne gültige Id `''` — der Aufrufer fällt dann auf die
   * direkte Adresse zurück, statt ein kaputtes Script-Tag zu bauen.
   */
  it('ohne gültige Id: leer', () => {
    expect(proxiedScriptSrc('')).toBe('')
    expect(proxiedScriptSrc(undefined)).toBe('')
    expect(proxiedScriptSrc('script')).toBe('')
    expect(proxiedScriptSrc('https://boese.example/x.js')).toBe('')
  })

  /**
   * Die Pfade stehen in Filterlisten-Nähe und in der Ereignis-Option des
   * Scripts. Wer sie ändert, hebt entweder die Wirkung auf oder trennt Script
   * und Ereignis — dieser Test ist die Erinnerung daran.
   */
  it('die Pfade sind neutral benannt (kein plausible/analytics/track)', () => {
    for (const path of [ANALYTICS_PROXY_SCRIPT_PATH, ANALYTICS_PROXY_EVENT_PATH]) {
      expect(path.startsWith('/api/')).toBe(true)
      expect(/plausible|analytics|track/i.test(path)).toBe(false)
    }
  })
})
