import { AuthenticatorType } from 'node-appwrite'
import { createSessionClient } from '../../../lib/appwrite'

/**
 * Einrichtung Schritt 1: TOTP-Authenticator anlegen und dem Nutzer zeigen.
 *
 * Läuft als der User selbst (SessionClient) und braucht eine VOLLE Session —
 * `event.context.user` ist genau dann gesetzt.
 */
export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const { account } = createSessionClient(event)

  let authenticator
  try {
    // Ein ZWEITER Aufruf ersetzt das Geheimnis stillschweigend (gemessen
    // 2026-08-13) — genau richtig für „Einrichtung abgebrochen, neu
    // begonnen". Aufräumen kann man hier ohnehin nicht: das Löschen eines
    // noch UNVERIFIZIERTEN Authenticators lehnt Appwrite mit
    // `user_challenge_required` ab (die Challenge, die man dafür bräuchte,
    // gibt es ja noch nicht).
    authenticator = await account.createMFAAuthenticator({ type: AuthenticatorType.Totp })
  }
  catch (error) {
    if ((error as { type?: string } | null)?.type === 'user_authenticator_already_verified') {
      throw createError({ status: 409, statusText: 'Already enabled', data: { code: 'mfa_already_enabled' } })
    }
    throw createError({ status: 400, statusText: 'MFA setup failed' })
  }

  // Das QR-Bild macht APPWRITE (Avatars-API) — kein neues npm-Paket und kein
  // selbst gebauter QR-Encoder. Es reist als data:-URI IN dieser Antwort mit,
  // statt über eine eigene Bild-Route: die otpauth-URL enthält das Geheimnis,
  // und Geheimnisse gehören nie in eine URL (Verlauf, Proxy-Logs, Referer).
  // Fehlschlag ist NICHT tödlich — darunter stehen Geheimnis und Link im
  // Klartext, die Einrichtung bleibt also ohne Bild vollständig bedienbar.
  let qr = ''
  try {
    const png = await createSessionClient(event).avatars
      .getQR({ text: authenticator.uri, size: 240, margin: 1, download: false })
    qr = `data:image/png;base64,${Buffer.from(png).toString('base64')}`
  }
  catch {
    // Bewusst leer: `qr` bleibt '' und die Karte zeigt nur Geheimnis + Link.
  }

  return { secret: authenticator.secret, uri: authenticator.uri, qr }
})
