import { expect, test } from '@playwright/test'

/**
 * Die 301-Weiterleitungen aus der alten Sprachstruktur.
 *
 * Im alten Portfolio-Repo lag Deutsch auf `/` und Englisch unter `/en`; hier
 * gilt `prefix_except_default` (Englisch ohne Präfix, Deutsch unter `/de/*`).
 * `/en` und `/en/**` sind damit VERÖFFENTLICHTE und verlinkte Adressen — sie
 * stehen in Backlinks, in der alten llms.txt und in Suchmaschinen-Indizes.
 *
 * WARUM DAS EINEN TEST BRAUCHT: die Regel lebt als zwei Zeilen in den
 * `routeRules` der nuxt.config. Fällt sie bei einem Config-Umbau heraus oder
 * wird sie mit umbenannt (eine Weiterleitung beschreibt die VERGANGENHEIT —
 * nur ihr Ziel folgt der heutigen Struktur), antwortet die Site einfach 404.
 * Nichts wird rot, kein Log schreit; nur der Suchmaschinen-Rang wandert.
 *
 * Geprüft wird über die request-API mit `maxRedirects: 0`, nicht über
 * `page.goto()`: der Browser FOLGT einer Weiterleitung und käme auch dann grün
 * heraus, wenn die Site einen 302 (temporär) statt eines 301 (dauerhaft)
 * schickte — und genau dieser Unterschied entscheidet, ob Google den Rang der
 * alten Adresse übernimmt.
 */

test.describe('301-Weiterleitungen der alten /en-Struktur', () => {
  test('/en leitet dauerhaft auf die Startseite', async ({ request }) => {
    const response = await request.get('/en', { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(new URL(response.headers().location!, 'http://placeholder').pathname).toBe('/')
  })

  test('/en/ux-audit leitet dauerhaft auf /ux-audit', async ({ request }) => {
    const response = await request.get('/en/ux-audit', { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(new URL(response.headers().location!, 'http://placeholder').pathname).toBe('/ux-audit')
  })

  test('/en/wissen/was-kostet-ux-design behält den vollen Restpfad', async ({ request }) => {
    // Der Restpfad-Fall ist der eigentliche Grund für `'/en/**'`: eine Regel,
    // die nur die erste Ebene trifft, sähe im Test oben grün aus und würfe die
    // Guides trotzdem auf die Startseite.
    const response = await request.get('/en/wissen/was-kostet-ux-design', { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(new URL(response.headers().location!, 'http://placeholder').pathname)
      .toBe('/wissen/was-kostet-ux-design')
  })
})
