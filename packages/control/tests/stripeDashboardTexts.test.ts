import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * STRUKTURELLER Test für die Texte der Stripe-Betreiberseite (F55-Nachpflege,
 * 2026-08-08).
 *
 * Warum strukturell: die Nachpflege hat der Seite ein Dutzend Schlüssel
 * hinzugefügt (Herkunfts-Hinweis, „Endpunkt neu anlegen", die
 * Live-Preis-Rückfrage, zwei neue Fehlerfälle). Ein vergessener Schlüssel
 * bricht nichts — vue-i18n rendert dann den SCHLÜSSEL, und zwar genau in dem
 * Bestätigungsdialog, den man einmal im Jahr sieht. Der Test prüft deshalb die
 * MENGE: jeder wörtliche `t('control.stripe.…')`-Aufruf der Seite muss in
 * beiden Sprachen ankommen, und beide Sprachen müssen dieselben Schlüssel
 * tragen.
 *
 * Er hält außerdem drei Regeln fest, die man nicht sieht, bis sie brechen:
 * KEIN leerer Wert (der frühere `source.none` war der einzige im Repo — er
 * funktionierte, war aber von einem VERGESSENEN Wert nicht zu unterscheiden),
 * KEINE spitzen Klammern (nuxt-i18n hält sie für HTML und der Nachrichten-
 * Compiler steigt auf dem CLIENT aus) und ein unmaskiertes `@` nur nach der
 * Escape-Regel.
 */
const REPO = resolve(import.meta.dirname, '../../..')
const PAGE = resolve(REPO, 'apps/control/app/pages/dashboard/stripe.vue')
const LOCALES = ['de', 'en'] as const

function localeStripeSubtree(locale: string): Record<string, unknown> {
  const raw = JSON.parse(readFileSync(resolve(REPO, `apps/control/i18n/locales/${locale}.json`), 'utf8'))
  return raw.control.stripe as Record<string, unknown>
}

/** Blattschlüssel in Punkt-Schreibweise, so wie `t()` sie erwartet. */
function flatten(node: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  if (typeof node === 'string') {
    out.set(prefix, node)
    return out
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      for (const [k, v] of flatten(value, prefix ? `${prefix}.${key}` : key)) out.set(k, v)
    }
  }
  return out
}

const page = readFileSync(PAGE, 'utf8')
const flat = Object.fromEntries(LOCALES.map(locale => [locale, flatten(localeStripeSubtree(locale))])) as Record<string, Map<string, string>>

/**
 * Wörtliche Schlüssel aus der Seite. Vorlagen-Zeichenketten (`t(\`…${x}\`)`)
 * bleiben bewusst draußen — für die beiden dynamischen Stellen gibt es weiter
 * unten eigene Prüfungen, die genauer sind als eine Regex.
 */
const usedKeys = [...page.matchAll(/\bt\('(control\.stripe\.[^']+)'/g)]
  .map(match => match[1]!.slice('control.stripe.'.length))

describe('Stripe-Betreiberseite: Texte', () => {
  it('die Seite benutzt überhaupt Schlüssel (sonst prüft dieser Test nichts)', () => {
    expect(usedKeys.length).toBeGreaterThan(30)
  })

  for (const locale of LOCALES) {
    it(`jeder benutzte Schlüssel existiert in ${locale}`, () => {
      const missing = [...new Set(usedKeys)].filter(key => !flat[locale]!.has(key))
      expect(missing).toEqual([])
    })
  }

  it('de und en tragen exakt dieselben Schlüssel', () => {
    const de = [...flat.de!.keys()].sort()
    const en = [...flat.en!.keys()].sort()
    expect(de).toEqual(en)
  })

  it('kein leerer Wert (der frühere source.none)', () => {
    for (const locale of LOCALES) {
      const empty = [...flat[locale]!.entries()].filter(([, value]) => value.trim() === '').map(([key]) => key)
      expect(empty).toEqual([])
    }
  })

  it('keine spitzen Klammern — nuxt-i18n hielte sie für HTML', () => {
    for (const locale of LOCALES) {
      const withAngles = [...flat[locale]!.entries()].filter(([, value]) => /[<>]/.test(value)).map(([key]) => key)
      expect(withAngles).toEqual([])
    }
  })

  it('kein unmaskiertes @', () => {
    for (const locale of LOCALES) {
      const withAt = [...flat[locale]!.entries()].filter(([, value]) => /@/.test(value) && !value.includes('{\'@\'}')).map(([key]) => key)
      expect(withAt).toEqual([])
    }
  })

  it('die Herkunfts-Zeile hat genau die zwei Fälle, die sie anzeigt (source.none ist WEG)', () => {
    // Die Seite blendet die Zeile per v-if aus, statt einen leeren Text zu
    // rendern — ein `none`-Schlüssel wäre wieder der leere Wert von vorher.
    for (const locale of LOCALES) {
      const sources = [...flat[locale]!.keys()].filter(key => key.startsWith('source.')).sort()
      expect(sources).toEqual(['source.db', 'source.env'])
    }
  })

  it('beide Intervalle der Preisliste sind übersetzt', () => {
    for (const locale of LOCALES) {
      expect(flat[locale]!.has('prices.interval.month')).toBe(true)
      expect(flat[locale]!.has('prices.interval.year')).toBe(true)
    }
  })

  it('stateIncomplete ist eine PLURALFORM (LOW 8), nicht ein Satz für alles', () => {
    // Vorher stand dort „{count} Ereignisse fehlen" — bei genau einem
    // fehlenden Ereignis also „1 Ereignisse fehlen".
    // Gemessen mit vue-i18n 11.4.8 (der gepinnten Fassung): zwei durch `|`
    // getrennte Formen ergeben mit t(key, { count }, count) für 1 die erste
    // und für alles andere die zweite.
    for (const locale of LOCALES) {
      const forms = flat[locale]!.get('webhook.stateIncomplete')!.split('|').map(form => form.trim())
      expect(forms).toHaveLength(2)
      for (const form of forms) expect(form).toContain('{count}')
      expect(forms[0]).not.toBe(forms[1])
    }
  })

  it('die Seite ruft stateIncomplete MIT Plural-Argument auf', () => {
    // Ohne das dritte Argument wählt vue-i18n immer die erste Form, und die
    // Pluralform oben wäre eine Attrappe.
    expect(page).toMatch(/stateIncomplete',\s*\{\s*count:[^}]+\},\s*[^)]+\)/)
  })
})
