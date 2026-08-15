import { AuthenticatorType } from 'node-appwrite'
import type { AuthenticationFactor } from 'node-appwrite'
import { createSessionClient } from '../../../lib/appwrite'
import { mfaChallengeSchema } from '../../../../schemas/auth'
import { isInvalidMfaCode, mfaFactorFor } from '../../../../shared/mfa'
import type { MfaDisableResponse } from '../../../../shared/types/auth-responses'

/**
 * Zwei-Faktor abschalten.
 *
 * APPWRITE VERLANGT DAFÜR NICHTS (gemessen 2026-08-13): `updateMFA(false)` und
 * `deleteMFAAuthenticator` gehen mit nichts als einer Session durch — kein
 * Passwort, kein Code. Damit wäre der Schutz nur so stark wie ein
 * unbeaufsichtigter Bildschirm, und ein gestohlenes Session-Cookie könnte ihn
 * abräumen. Die Bestätigung ist deshalb UNSERE, und sie ist bewusst ein
 * gültiger ZWEITER FAKTOR statt des Passworts: wer den Zweitfaktor entfernt,
 * soll belegen, dass er ihn noch hat. Der Wiederherstellungs-Code zählt auch —
 * sonst wäre ein verlorenes Telefon eine Sackgasse.
 *
 * BEIDES abschalten, nicht nur das Flag: bliebe der verifizierte Authenticator
 * stehen (oder auch nur eine verifizierte E-Mail), rechnet Appwrite bei einem
 * späteren `mfa: true` sofort wieder mit zwei Faktoren.
 */
export default defineEventHandler(async (event): Promise<MfaDisableResponse> => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const { mode, code } = await readValidatedBody(event, mfaChallengeSchema.parse)
  const { account } = createSessionClient(event)

  // Eine Challenge geht auch aus einer bereits vollwertigen Session heraus —
  // sie fügt den Faktor dann nur erneut hinzu. Genau das macht sie hier zum
  // Code-Prüfer, ohne dass wir irgendetwas selbst nachrechnen müssten.
  try {
    // Cast, weil `recoveryCode` im SDK-Enum GAR NICHT vorkommt — genau das ist
    // der in shared/mfa.ts beschriebene Appwrite-Fehler. Der Typ ist hier die
    // falsche Autorität: er bildet die kaputte Schreibweise ab.
    const challenge = await account.createMFAChallenge({ factor: mfaFactorFor(mode) as AuthenticationFactor })
    await account.updateMFAChallenge({ challengeId: challenge.$id, otp: code })
  }
  catch (error) {
    if (isInvalidMfaCode(error)) {
      await logAuthEvent(event, 'user.mfa_challenge_failed', { userId: event.context.user.$id, method: mode })
      throw createError({ status: 400, statusText: 'Invalid code', data: { code: 'mfa_invalid_code' } })
    }
    throw createError({ status: 400, statusText: 'MFA disable failed' })
  }

  await account.updateMFA({ mfa: false })
  // Best effort: das Flag ist schon aus, die Anmeldung verlangt also keinen
  // zweiten Faktor mehr. Ein hängengebliebener Authenticator wäre unschön,
  // aber kein Grund, dem Nutzer ein „hat nicht geklappt" zu zeigen.
  await account.deleteMFAAuthenticator({ type: AuthenticatorType.Totp }).catch(() => {})

  await logAuthEvent(event, 'user.mfa_disabled', { userId: event.context.user.$id, name: event.context.user.name })
  return { ok: true }
})
