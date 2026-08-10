import { expect, test } from '@playwright/test'

/**
 * robots.txt, llms.txt und sitemap.xml — die drei Crawler-Adressen.
 *
 * Alle drei waren bis vor Kurzem statische Dateien in `public/` und
 * verdrahteten `https://pukalani.studio` (llms.txt zwölf Mal). Sobald diese
 * Site ihre zweite Domain bedient (Kundendomain über den `domains`-Layer),
 * zeigte jede genannte Adresse auf den falschen Host — und eine Sitemap unter
 * fremder Domain ignoriert Google. Heute sind es Server-Routen, die ihren
 * Origin aus dem REQUEST rechnen (`siteRequestOrigin`, Schema aus der Env).
 *
 * DIESER TEST PRÜFT GENAU DAS: er vergleicht gegen die Basis-URL, unter der er
 * selbst läuft. Fiele die Origin-Rechnung auf eine feste Domain zurück, wäre
 * er sofort rot — eine Prüfung auf „enthält irgendeine Sitemap-Zeile" wäre auf
 * der alten, kaputten Fassung genauso grün gewesen.
 *
 * Und die Inhalte kommen aus derselben Quelle wie die sichtbaren Seiten:
 * `SITE_ROUTES` (Sitemap + llms.txt) und `SERVICES` (Preise in llms.txt). Der
 * Preis-Griff unten ist deshalb kein Textvergleich um seiner selbst willen: er
 * beweist, dass llms.txt die Preise NACHSCHLÄGT, statt sie ein zweites Mal zu
 * behaupten. Eine falsche Preisangabe gegenüber einer Antwortmaschine ist
 * teurer als eine falsche Beschriftung.
 */

/** Origin ohne Schrägstrich am Ende — so, wie die Routen ihn schreiben. */
function originOf(baseURL: string | undefined): string {
  return new URL(baseURL!).origin
}

test.describe('robots.txt', () => {
  test('sperrt /api/ und nennt die Sitemap unter DIESEM Host', async ({ request, baseURL }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')

    const body = await response.text()
    expect(body).toContain('User-agent: *')
    expect(body).toContain('Disallow: /api/')
    expect(body).toContain('Disallow: /dashboard')
    // Die dynamische Zeile — der Kern der Umstellung.
    expect(body).toContain(`Sitemap: ${originOf(baseURL)}/sitemap.xml`)
    // Gegenprobe: die alte, fest verdrahtete Domain darf hier nicht mehr stehen.
    expect(body).not.toContain('https://pukalani.studio/sitemap.xml')

    // Die AI-Crawler stehen einzeln da — das ist eine ausdrückliche Zusage
    // (GEO), keine Wirkung: `User-agent: *` erlaubt sie längst. Wer die Liste
    // kürzt, ändert nichts am Verhalten, verliert aber die Aussage.
    expect(body).toContain('User-agent: GPTBot')
    expect(body).toContain('User-agent: ClaudeBot')
  })
})

test.describe('llms.txt', () => {
  test('nennt Preise aus SERVICES und Adressen unter DIESEM Host', async ({ request, baseURL }) => {
    const response = await request.get('/llms.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')

    const body = await response.text()
    const origin = originOf(baseURL)

    // Aus `SERVICES[…].price.de` — die Preisspanne des UX-Audits.
    expect(body).toContain('€2.500')
    // Aus `SITE_ROUTES`: jede Seite mit deutscher UND englischer Adresse.
    expect(body).toContain(`${origin}/de/ux-audit`)
    expect(body).toContain(`${origin}/ux-audit`)
    expect(body).not.toContain('https://pukalani.studio')
  })
})

test.describe('sitemap.xml', () => {
  test('liefert XML mit beiden Sprachfassungen unter DIESEM Host', async ({ request, baseURL }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('xml')

    const body = await response.text()
    const origin = originOf(baseURL)

    expect(body).toContain('<urlset')
    expect(body).toContain(`<loc>${origin}</loc>`)
    expect(body).toContain(`<loc>${origin}/ux-audit</loc>`)
    expect(body).toContain(`<loc>${origin}/de/ux-audit</loc>`)
    // Die Startseite ist `/de`, nicht `/de/` — mit Schrägstrich wäre es eine
    // zweite Adresse für dieselbe Seite (dePathFor).
    expect(body).toContain(`<loc>${origin}/de</loc>`)
    expect(body).not.toContain('<loc>https://pukalani.studio')

    // WEITERLEITUNGEN GEHÖREN NICHT IN EINE SITEMAP: `/en/**` sind 301er aus
    // der alten Struktur (siehe redirects.spec.ts). Eine Sitemap darf nur
    // Zieladressen anbieten.
    expect(body).not.toContain(`<loc>${origin}/en`)
  })
})
