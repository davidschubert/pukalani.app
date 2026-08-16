import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * DIE QUER-LINKS DER AUTH-SEITEN TRAGEN `?redirect=` MIT.
 *
 * Anmelden, Registrieren und die beiden Code-Varianten verweisen aufeinander.
 * Die FORMULARE behandeln das Ziel längst richtig (`useAuthRedirect()` →
 * `afterAuthTarget()`); verloren ging es auf dem WEG zwischen ihnen: neun Links
 * zeigten auf den nackten Pfad, und mit dem ersten Klick war das Ziel weg.
 *
 * WAS DAS KOSTETE, am Einladungs-Link durchgespielt (2026-08-15): Wer
 * eingeladen wird und noch KEIN Konto hat, kommt über `/join?token=…` →
 * Auth-Guard → `/login?redirect=…` genau richtig an — klickt dann „Registrieren"
 * und steht ohne Ziel da. Nach der Registrierung ging es auf die Startseite
 * statt zur Einladung. Sichtbarer Schaden: die Einladung blieb `pending`, und
 * die darin vergebene ROLLE war still verloren — der A5-Beitritt macht die
 * Person zum `viewer`, egal ob der Owner sie als Editor eingeladen hatte.
 * Gemessen: vorher `viewer` + `pending`, nachher `editor` + `accepted`.
 *
 * NACHTRAG (Audit 2026-08-15, Schnitt C): der erste Durchgang deckte VIER
 * Dateien, und „Passwort vergessen" war keine davon. Der Weg
 * `/login?redirect=…` → „Passwort vergessen?" → „Zurück zur Anmeldung" warf das
 * Ziel also weiter weg — mit demselben Schadensbild, nur eine Seite später.
 * Deshalb steht `/forgot-password` jetzt sowohl in den Dateien als auch in den
 * Pfaden: es ist beides, ein Absender und ein Ziel.
 *
 * Geprüft wird die QUELLE, weil der Fehler ein WEGLASSEN ist. Ein Laufzeit-Test
 * müsste dafür jede Auth-Seite mit Query rendern.
 */
const DATEIEN = [
  'packages/core/app/components/auth/LoginForm.vue',
  'packages/core/app/pages/register/index.vue',
  'packages/core/app/pages/login/code.vue',
  'packages/core/app/pages/register/code.vue',
  'packages/core/app/pages/forgot-password.vue',
]

/** Die Pfade, zwischen denen die Auth-Seiten hin- und herschicken. */
const AUTH_PFADE = ['/login', '/register', '/login/code', '/register/code', '/forgot-password']

const wurzel = new URL('../../../', import.meta.url)

describe('Quer-Links zwischen den Auth-Formularen', () => {
  for (const datei of DATEIEN) {
    it(`${datei.split('/').pop()} verliert das Rückkehr-Ziel nicht`, () => {
      const quelle = readFileSync(new URL(datei, wurzel), 'utf8')

      /**
       * Gesucht sind nur LINKS (`:to=` / `to=`), nicht die `navigateTo`-Rückwege
       * nach einer abgeschlossenen Handlung: wer sein Konto gelöscht hat oder
       * einen Code-Schritt abbricht, soll KEIN altes Ziel mitschleppen.
       */
      const nackt = [...quelle.matchAll(/:?to="localePath\('([^']+)'\)"/g)]
        .map(m => m[1]!)
        .filter(pfad => AUTH_PFADE.includes(pfad))

      expect(
        nackt,
        `Diese Ziele gehen ohne ?redirect= — authLinkTarget() nehmen: ${nackt.join(', ')}`,
      ).toEqual([])
    })
  }

  /**
   * DIE ZWEI ENDEN DER „Passwort vergessen"-SCHLEIFE, POSITIV geprüft.
   *
   * Die Regel oben ist eine VERBOTS-Regel — sie sieht `localePath('/login')`,
   * aber kein hartkodiertes `:to="'/login'"` und kein stillschweigendes
   * Entfernen des Links. Für die zwei Stellen, an denen der Audit-Befund
   * hing, wird deshalb zusätzlich verlangt, dass der Helfer WIRKLICH dort
   * steht.
   */
  const SCHLEIFE: Array<[string, string]> = [
    ['packages/core/app/components/auth/LoginForm.vue', '/forgot-password'],
    ['packages/core/app/pages/forgot-password.vue', '/login'],
  ]

  for (const [datei, ziel] of SCHLEIFE) {
    it(`${datei.split('/').pop()} verlinkt ${ziel} über authLinkTarget()`, () => {
      const quelle = readFileSync(new URL(datei, wurzel), 'utf8')
      expect(quelle).toContain(`authLinkTarget('${ziel}')`)
    })
  }

  it('useAuthRedirect bietet den Helfer überhaupt an', () => {
    const quelle = readFileSync(
      new URL('packages/core/app/composables/useAuthRedirect.ts', wurzel),
      'utf8',
    )
    expect(quelle).toContain('function authLinkTarget')
    // Das Weiterreichen läuft durch dieselbe Prüfung wie das Landen: was wir
    // nicht annehmen würden, geben wir auch nicht weiter (Open-Redirect).
    const helfer = quelle.slice(quelle.indexOf('function authLinkTarget'))
    expect(helfer).toContain('safeRedirectTarget')
  })
})
