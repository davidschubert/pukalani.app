import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Die Fehlerseite muss ihre Sprache selbst am <html> anschreiben.
 *
 * WARUM EIN TEST AUF DIE QUELLE und nicht auf gerendertes Markup: `lang`/`dir`
 * entstehen erst im unhead-Kopf einer laufenden Nuxt-App; sie im Test zu
 * rendern hiesse, eine App samt i18n-Modul hochzufahren. Der Fehler, den es zu
 * verhindern gilt, ist aber ein WEGLASSEN — und das ist an der Quelle genauso
 * gut zu sehen.
 *
 * DER FEHLER, DEN DIESER TEST MEINT: `useLocaleSeoHead()` sitzt in `app.vue`,
 * und Nuxt rendert bei einem Fehler `error.vue` STATT app.vue. Der Kopf von
 * dort läuft also nie. Genau deshalb kam jede 404 mit nacktem `<html>` heraus
 * — auf allen vier Hosts, obwohl der Text korrekt übersetzt war (2026-08-15
 * gemessen). Wer `useHead` hier später „aufräumt", stellt das wieder her.
 */
const quelle = readFileSync(
  new URL('../app/components/core/ErrorPage.vue', import.meta.url),
  'utf8',
)

describe('CoreErrorPage', () => {
  it('setzt lang und dir am <html>', () => {
    expect(quelle).toContain('useLocaleHead(')
    expect(quelle).toMatch(/lang:\s*true/)
    expect(quelle).toMatch(/dir:\s*true/)
    // Tolerant gegenüber beiden Schreibweisen (`useHead({…})` und der
    // reaktiven `useHead(() => ({…}))`): geprüft wird, DASS htmlAttrs in den
    // Kopf geht — nicht, wie es formuliert ist. Ein Muster, das an einer
    // Formulierung klebt, bricht beim nächsten Umbau, ohne dass etwas kaputt
    // wäre (beim Bau genau so passiert).
    expect(quelle).toMatch(/useHead\([\s\S]{0,40}htmlAttrs/)
  })

  it('bietet Suchmaschinen KEIN canonical und keine hreflang-Alternates an', () => {
    // Eine Fehlerseite, die auf sich selbst kanonisiert, lädt zum Indexieren
    // von 404 ein. `seo: false` ist deshalb die tragende Hälfte des Aufrufs.
    expect(quelle).toMatch(/seo:\s*false/)
    // Gesucht ist der AUFRUF, nicht das Wort: der Kommentar darüber erklärt,
    // warum `useLocaleSeoHead()` hier nicht läuft, und nennt es dabei.
    expect(quelle).not.toMatch(/^\s*(?:const .*=\s*)?useLocaleSeoHead\(/m)
  })
})
