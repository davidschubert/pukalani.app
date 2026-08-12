/**
 * EIN Satz für die zwei Fehler, die JEDES Auth-Formular gleich beantworten
 * muss: Server weg (Netzwerk) und Ratenbegrenzung (429).
 *
 * Warum gebündelt (Audit-Befund G7, 2026-08-09): die Minuten-Sperre trug
 * keinen Grund, also fiel sie in jedem Formular in dessen allgemeine Meldung —
 * „Anmeldung fehlgeschlagen, bitte E-Mail und Passwort prüfen" bzw. „Code
 * konnte nicht angefordert werden, bitte erneut versuchen". Beide Sätze sind
 * falsch, und beide fordern genau die Handlung, die gerade geblockt wird; wer
 * seine Zugangsdaten daraufhin für falsch hält, läuft in die
 * Passwort-Zurücksetzen-Schleife. Drei Formulare, ein Zweig — der nächste
 * Auth-Aufruf erbt ihn, statt ihn zu vergessen.
 *
 * Der FALLBACK bleibt beim Aufrufer: nur das Formular weiß, ob ein 409
 * „Adresse vergeben" oder „Code abgelaufen" heißt.
 */
export function useAuthErrorMessage() {
  const { t } = useI18n()

  /**
   * @param error   der gefangene $fetch-Fehler
   * @param fallback Text für alles, was weder Netzwerk noch Sperre ist
   */
  function authErrorMessage(error: unknown, fallback: string): string {
    if (isNetworkError(error)) return t('auth.networkError')
    if (isRateLimited(error)) {
      // Die Wartezeit nur nennen, wenn die Antwort sie wirklich hergibt —
      // eine geratene Minute wäre dieselbe Sorte Lüge wie „Passwort falsch".
      const seconds = rateLimitRetrySeconds(error)
      return seconds === null
        ? t('auth.rateLimited')
        : t('auth.rateLimitedIn', seconds)
    }
    return fallback
  }

  return { authErrorMessage }
}
