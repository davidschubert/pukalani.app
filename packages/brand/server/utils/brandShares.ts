import { createHash } from 'node:crypto'

/**
 * DER SHARE-TOKEN — hier steht nur seine EINE Rechnung, und die steht hier,
 * damit sie nicht zweimal existiert: das Veröffentlichen bildet den Hash, der
 * öffentliche Abruf vergleicht ihn. Zwei Kopien derselben Zeile wären der Weg
 * dahin, dass eine davon irgendwann `sha1` oder ein Salz benutzt und keiner der
 * beiden Links mehr funktioniert.
 *
 * KEIN SALZ, UND DAS IST RICHTIG: der Token hat 256 Bit Zufall aus
 * `randomBytes`. Ein Salz schützt gegen Wörterbuch-Angriffe auf RATBARE
 * Geheimnisse (Passwörter) — hier gibt es nichts zu erraten, und ein
 * deterministischer Hash ist genau das, was den UNIQUE-Index auf `tokenHash`
 * überhaupt erst benutzbar macht. Dasselbe Muster wie `community_invites`.
 */
export function hashBrandShareToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}
