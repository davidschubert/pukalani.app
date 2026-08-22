import { expect, test } from '@playwright/test'

/**
 * Der Erstgespräch-Wizard (W1) — geprüft wird die MECHANIK, nicht der Text:
 * dass Schritt 1 steht, dass „Weiter" ohne Auswahl NICHT weiterschaltet, und
 * dass es mit Auswahl weitergeht. Die Texte kommen aus
 * `app/data/erstgespraech.ts` und dürfen sich ändern; die Fortschritts-Anzeige
 * und die Fehlerzeile sind die stabile Zusage.
 *
 * BEWUSST OHNE ABSENDEN: der letzte Schritt spricht mit Appwrite und dem
 * Mailserver. Ein Test, der beides braucht, wäre auf einem Laptop ohne lokale
 * Instanz rot — und ein rot-durch-Umgebung-Test wird weggeklickt statt gelesen.
 * Budget und Wartezeiten wie in `smoke.spec.ts` (Kaltstart des Dev-Servers).
 */
test.describe('Erstgespräch-Wizard', () => {
  test('Schritt 1 steht, „Weiter" ohne Auswahl meldet, mit Auswahl geht es zu Schritt 2', async ({ page }) => {
    await page.goto('/erstgespraech')

    // Erst wenn der Teilbaum hydratisiert ist, trägt ein Klick (F10-Lektion:
    // vorher ist es ein toter SSR-Klick, und die Spec stirbt 60 s später an
    // einer Zeile, die mit der Ursache nichts zu tun hat). Das Attribut setzt
    // die Seite selbst in ihrem `onMounted`.
    await expect(page.locator('.wizard[data-ready="true"]')).toBeVisible({ timeout: 60_000 })

    const counter = page.locator('.wizard__count')
    await expect(counter).toContainText('1')
    await expect(page.locator('#wizard-step-title')).toBeVisible()

    // Ohne Auswahl: die Fehlerzeilen erscheinen, der Schritt bleibt stehen.
    await page.getByRole('button', { name: /weiter|next/i }).click()
    await expect(page.locator('.field__error').first()).toBeVisible()
    await expect(counter).toContainText('1')

    // Erste Ziel-Karte und erste Projektart wählen — danach trägt „Weiter".
    await page.locator('.opt').first().click()
    await page.locator('fieldset.field').nth(1).locator('.opt').first().click()
    await page.getByRole('button', { name: /weiter|next/i }).click()
    await expect(counter).toContainText('2')
    await expect(page.locator('.field__error')).toHaveCount(0)
  })
})
