/**
 * „Bestätigungslink erneut senden" — EINE Implementierung für alle Stellen,
 * die ihn anbieten (Banner im Chrome, Seite /verify).
 *
 * Warum gebündelt (Audit-Befund M3, 2026-08-09): `/verify` sagte bei einem
 * abgelaufenen Link „Fordere über das Banner einen neuen Bestätigungslink an" —
 * die Seite hat aber kein Banner, und die einzige Schaltfläche führte zur
 * Startseite. Der Nutzer musste raten, wo der Knopf steht. Ein zweiter,
 * abgeschriebener Resend hätte die nächste Abweichung nur vorbereitet; deshalb
 * liegt der Vorgang hier und die Oberflächen entscheiden nur, wie er aussieht.
 *
 * Die Route verlangt eine SESSION (verification.post.ts) — wer den Link auf
 * einem fremden Gerät öffnet, kann also nichts anfordern. Das ist kein Fehler,
 * sondern der Grund, warum die aufrufende Seite `isLoggedIn` prüfen muss,
 * bevor sie den Knopf zeigt.
 */
export function useEmailVerifyResend() {
  const { t } = useI18n()
  const toast = useToast()
  const { authErrorMessage } = useAuthErrorMessage()

  const sending = ref(false)
  const sent = ref(false)

  /** @returns true, wenn die Mail rausging */
  async function resend(): Promise<boolean> {
    sending.value = true
    try {
      await $fetch('/api/auth/verification', { method: 'POST' })
      toast.add({
        title: t('auth.verification.sentTitle'),
        description: t('auth.verification.sentDescription'),
        color: 'success',
      })
      sent.value = true
      return true
    }
    catch (error) {
      // Die Route ist mail-versendend und damit ALWAYS_LIMITED — wer zweimal
      // zu schnell klickt, sieht die Sperre und nicht „prüfe deine
      // Verbindung" (G7). Der Zusatzsatz passt dann nicht und bleibt weg.
      toast.add({
        title: authErrorMessage(error, t('auth.verification.sendFailed')),
        description: isRateLimited(error) ? undefined : t('auth.verification.sendFailedDescription'),
        color: 'error',
      })
      return false
    }
    finally {
      sending.value = false
    }
  }

  return { sending, sent, resend }
}
