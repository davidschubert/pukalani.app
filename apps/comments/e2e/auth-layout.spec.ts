import { test, expect } from '@playwright/test'

/**
 * Das auth-Layout hält seine festen Bedienelemente frei.
 *
 * Der Zurück-Link (und im themes-Override das Anzeige-Menü) sitzt `fixed` bei
 * `top-4` und ist 32 px hoch. Der Inhalt wird mit `justify-center` zentriert —
 * und ein Flex-Container läuft bei zu hohem Inhalt nach BEIDEN Seiten über.
 * Ohne genügend obere Polsterung steht der Anfang des Inhalts dann unter den
 * Bedienelementen: auf /register überlappte der Markenname bis 768 px das Wort
 * „Startseite" (2026-08-14 live gemessen).
 *
 * Gemessen wird an der REGISTRIERUNG und schmal, weil nur dort beides
 * zusammenkommt — die Anmeldung ist kurz genug für echte Zentrierung und wäre
 * auch mit dem Fehler grün. Ein Test auf der falschen Seite hätte hier nichts
 * gemerkt.
 */
const SCHMAL = { width: 390, height: 844 }

test('Registrierung: Marke und Zurück-Link überlappen nicht', async ({ page }) => {
  await page.setViewportSize(SCHMAL)
  await page.goto('/register')

  const link = page.locator('[data-back-link]')
  const marke = page.locator('[data-auth-brand]')
  await expect(link).toBeVisible()
  await expect(marke).toBeVisible()

  const a = await link.boundingBox()
  const b = await marke.boundingBox()
  expect(a, 'Zurück-Link hat keine Ausdehnung').not.toBeNull()
  expect(b, 'Markenname hat keine Ausdehnung').not.toBeNull()

  const getrennt
    = a!.x + a!.width <= b!.x
      || b!.x + b!.width <= a!.x
      || a!.y + a!.height <= b!.y
      || b!.y + b!.height <= a!.y

  expect(
    getrennt,
    `Marke (${JSON.stringify(b)}) überlappt den Zurück-Link (${JSON.stringify(a)})`,
  ).toBe(true)

  // Der Grund, nicht nur das Symptom: der Inhalt muss UNTERHALB der festen
  // Leiste beginnen. Ohne diese Erwartung bliebe der Test grün, wenn die Marke
  // nur zufällig seitlich ausweicht — genau das war bei 1280 px der Fall.
  expect(b!.y, 'Inhalt beginnt im Band der festen Bedienelemente').toBeGreaterThanOrEqual(
    a!.y + a!.height,
  )
})
