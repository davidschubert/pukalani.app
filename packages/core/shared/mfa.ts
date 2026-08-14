/**
 * Zwei-Faktor (U15 Teil 4) — die reinen Regeln.
 *
 * Der Zweitfaktor ist Appwrites MFA (TOTP), NICHT selbst gebaut: kein eigener
 * Code-Speicher, keine eigene Krypto. Hier steht nur, was rund um Appwrite
 * pur entschieden werden kann — damit es testbar ist und nicht in einer
 * Route versteckt liegt.
 */

/** Der TOTP-Faktor heißt bei Appwrite schlicht `totp`. */
export const MFA_FACTOR_TOTP = 'totp'

/**
 * ACHTUNG, HIER STEHT ABSICHTLICH `recoveryCode` UND NICHT `recoverycode`.
 *
 * Appwrite 1.9.6 nimmt für den Wiederherstellungs-Code zwei verschiedene
 * Schreibweisen ernst, und die SDKs senden die FALSCHE:
 *
 *  - `Auth/MFA/Type::RECOVERY_CODE` ist **`'recoveryCode'`** (camelCase).
 *  - Der Enum-Wert `AuthenticationFactor.Recoverycode` aller offiziellen SDKs
 *    ist **`'recoverycode'`** (klein).
 *  - Die `WhiteList` beim Anlegen der Challenge prüft case-INsensitiv, das
 *    Kleinschreiben kommt also anstandslos durch und wird SO gespeichert.
 *  - `Challenges/Update.php` vergleicht danach mit `===` gegen
 *    `Type::RECOVERY_CODE`. `'recoverycode' === 'recoveryCode'` ist falsch,
 *    der Zweig fällt in `default => false`, und die Antwort ist ein
 *    ununterscheidbares `401 user_invalid_token` — als wäre der Code falsch.
 *
 * Ergebnis: mit dem SDK-Enum ist JEDER Wiederherstellungs-Code ungültig.
 * Am 2026-08-13 gegen die lokale 1.9.6 gemessen, A/B auf demselben Konto:
 *
 *   factor="recoverycode" -> gespeichert als "recoverycode" -> ABGELEHNT
 *   factor="recoveryCode" -> gespeichert als "recoveryCode" -> AKZEPTIERT
 *
 * Deshalb geht hier ein STRING an Appwrite und nicht das SDK-Enum. Wer das
 * „aufräumt" und auf `AuthenticationFactor.Recoverycode` umstellt, nimmt dem
 * Nutzer seinen letzten Weg zurück ins Konto — und der Fehler sieht dabei
 * exakt wie ein Tippfehler des Nutzers aus. Erst wieder anfassen, wenn
 * Appwrite den Vergleich repariert hat; der Beweis dafür ist Abschnitt 6 in
 * `packages/core/scripts/verify-mfa.mjs` (er prüft BEIDE Schreibweisen und
 * fällt, sobald die kleine wieder funktioniert).
 */
export const MFA_FACTOR_RECOVERY_CODE = 'recoveryCode'

/** Womit der Nutzer seinen zweiten Faktor belegt. */
export type MfaChallengeMode = 'totp' | 'recovery'

/** Modus (unsere Sprache) → Appwrite-Faktor (deren Sprache, inkl. Falle oben). */
export function mfaFactorFor(mode: MfaChallengeMode): string {
  return mode === 'recovery' ? MFA_FACTOR_RECOVERY_CODE : MFA_FACTOR_TOTP
}

/**
 * „Diese Session hat das Passwort geschafft, aber noch nicht den zweiten
 * Faktor." Appwrite antwortet darauf auf JEDEM Konto-Aufruf mit 401 und dem
 * Typ `user_more_factors_required` (app/controllers/shared/api.php, Schritt
 * 12/13: `minimumFactors = 2`, sobald `mfa` an ist und ein Faktor verifiziert
 * wurde). Die Session EXISTIERT dabei bereits und ihr Cookie ist gültig —
 * sie trägt nur erst `factors: ['password']`.
 */
export function isMoreFactorsRequired(error: unknown): boolean {
  return (error as { type?: string } | null)?.type === 'user_more_factors_required'
}

/**
 * „Der Code war falsch." Appwrite wirft beim Challenge-Abschluss
 * `user_invalid_token`; beim Bestätigen eines frischen Authenticators
 * zusätzlich `user_invalid_credentials`.
 */
export function isInvalidMfaCode(error: unknown): boolean {
  const type = (error as { type?: string } | null)?.type
  return type === 'user_invalid_token' || type === 'user_invalid_credentials'
}

/**
 * Ein TOTP-Code ist sechsstellig, ein Wiederherstellungs-Code zehn Zeichen
 * hex (`Type::generateBackupCodes`). Nutzer tippen Leerzeichen und
 * Bindestriche mit, Passwortmanager fügen sie sogar ein — deshalb wird VOR
 * der Prüfung geputzt statt hinterher abgelehnt.
 */
export function normalizeMfaCode(raw: string): string {
  return raw.replace(/[\s-]/g, '')
}
