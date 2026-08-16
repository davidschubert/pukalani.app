import type { H3Event } from 'h3'

/**
 * EINE EINLADUNG ÖFFNET DIE REGISTRIERUNG — für genau eine Adresse.
 *
 * Eine Community mit geschlossener Registrierung (`communities.openRegistration
 * = false`) nimmt neue Mitglieder nur auf Einladung auf. Bis heute hiess das
 * für die Eingeladene ohne Pukalani-Konto: gar nicht. Sie landete auf
 * „Nur auf Einladung … melde dich einfach an" — sie HAT eine Einladung, aber
 * kein Konto, mit dem sie sich anmelden könnte. Der Einladungs-Dialog des
 * Owners sagt dagegen ausdrücklich zu: „Sonst legt sie über den Link eins an."
 * (Beim Durchspielen der eingeloggten Kundenreise am 2026-08-15 gefunden,
 * Davids Entscheidung am selben Tag: der Token soll die Registrierung öffnen.)
 *
 * WARUM EINE REGISTRY (A14): `community_invites` gehört dem CONTROL PLANE, und
 * die Service-Naht dorthin (Secret + JWT) besitzt der onboarding-Layer. Core
 * darf von einem Produkt-Layer nicht abhängen — also derselbe Vertrag wie bei
 * `registerCommunityJoinHandler` und dem Rollen-Resolver: core erklärt die
 * Frage, die App verdrahtet die Antwort. Ohne registrierten Resolver bleibt
 * alles hier `null` und die Sperre gilt unverändert (Silo-Apps, Playground, CI).
 *
 * ZWEI DINGE, DIE MAN NICHT WEGLASSEN DARF:
 *
 * 1. **Die Adresse bindet.** Der Resolver liefert die eingeladene Adresse
 *    zurück, und der Aufrufer lässt die Anmeldung NUR für sie durch. Sonst
 *    wäre ein weitergeleiteter Einladungs-Link ein Generalschlüssel: wer ihn
 *    hat, legte auf einer geschlossenen Community ein Konto auf beliebige
 *    Adresse an. Der Vergleich läuft normalisiert (klein, getrimmt) — Appwrite
 *    speichert Konto-Mails ebenfalls klein.
 *
 * 2. **Es ist KEIN Beitritt.** Der Token öffnet die TÜR ZUR ANMELDUNG, mehr
 *    nicht. Mitglied wird man weiterhin erst durch das Annehmen der Einladung
 *    (`/api/community/members/accept`), und das verlangt zusätzlich eine
 *    bestätigte E-Mail-Adresse. Diese Trennung ist Absicht: ein Konto anzulegen
 *    und einer Community beizutreten sind zwei Entscheidungen, und die zweite
 *    trägt die Rolle.
 */

/** Was der Resolver über eine gültige, offene Einladung verrät. */
export interface CommunityInviteLookup {
  /** Die eingeladene Adresse — normalisiert (klein). */
  email: string
  /** Die vorgesehene Rolle. Nur zur Anzeige; verbindlich wird sie beim Annehmen. */
  role: string
}

/**
 * Prüft einen Einladungs-Token GEGEN DEN MANDANTEN DES REQUESTS.
 *
 * Liefert `null` für alles, was nicht eindeutig gültig ist: unbekannter Token,
 * abgelaufen, schon angenommen, widerrufen, oder zu einer ANDEREN Community
 * gehörend. Ein `null` ist nie eine Auskunft darüber, welcher dieser Fälle
 * vorlag — der Aufrufer antwortet einheitlich mit der geschlossenen Tür.
 */
export type CommunityInviteResolver = (
  event: H3Event,
  token: string,
) => Promise<CommunityInviteLookup | null> | CommunityInviteLookup | null

let resolver: CommunityInviteResolver | null = null

/** Von der App (Nitro-Plugin) registriert — EINE Autorität pro Deployment. */
export function registerCommunityInviteResolver(fn: CommunityInviteResolver): void {
  if (resolver) {
    throw new Error('Community invite resolver already registered')
  }
  resolver = fn
}

/** Nur für Tests: Registrierung zurücksetzen. */
export function resetCommunityInviteResolver(): void {
  resolver = null
}

/**
 * Öffnet dieser Token die Registrierung für DIESE Adresse?
 *
 * FAIL-CLOSED an jeder Kante: kein Resolver, kein Token, ein Fehler im
 * Control Plane oder eine abweichende Adresse ⇒ `false`, und die Sperre gilt.
 * Der Fehlerfall wird bewusst geschluckt statt geworfen: eine nicht erreichbare
 * Naht darf die Registrierung nicht mit einem 500 beantworten, sondern mit
 * demselben „geht hier nicht", das auch ohne Einladung käme.
 */
export async function inviteOpensRegistrationFor(
  event: H3Event,
  token: string | undefined | null,
  email: string,
): Promise<boolean> {
  if (!resolver || !token) return false
  try {
    const invite = await resolver(event, token)
    if (!invite) return false
    return invite.email.trim().toLowerCase() === email.trim().toLowerCase()
  }
  catch {
    return false
  }
}
