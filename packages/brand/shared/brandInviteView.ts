/**
 * WAS ZEIGT `/invite` GERADE? — die PURE Entscheidung der Einladungs-Seite.
 *
 * Sie steht hier und nicht in der `.vue`-Datei, weil sie die eigentliche Regel
 * IST: fünf Tatsachen gehen hinein, genau ein Zustand kommt heraus. In einem
 * Template verteilt sich dieselbe Regel auf ein halbes Dutzend `v-if`, die sich
 * überlappen dürfen — und der Fall, den niemand bedacht hat, zeigt dann zwei
 * Kästen gleichzeitig oder keinen. Als Funktion ist sie vollständig
 * durchprüfbar, ohne Browser, ohne Instanz, ohne Appwrite.
 *
 * ── DIE REIHENFOLGE IST DIE REGEL ─────────────────────────────────────────
 * Kein Code → nichts zu beurteilen. Ein Code, der nicht taugt → dieselbe
 * neutrale Ablehnung wie überall (`check.post.ts`: falsch, abgelaufen,
 * widerrufen, verbraucht, fremde Adresse und falscher Modus sehen gleich aus).
 * Erst danach zählt, WER davorsteht: ohne Konto entsteht eines, mit
 * unbestätigter Adresse wartet die Mail, und nur ein eingeloggtes,
 * verifiziertes Konto darf einlösen — genau die Vorbedingungen, die
 * `redeem.post.ts` sonst mit 404 beantwortet.
 *
 * ── `redeemed` IST DREIWERTIG, UND DAS IST WESENTLICH ─────────────────────
 * `null` heisst „noch kein Versuch" — der Automatik-Zweig läuft gleich, die
 * Seite zeigt solange den Einlöse-Zustand. `false` ist eine ANTWORT des
 * Servers und damit ein Urteil („dieser Code gibt DIESEM Konto keinen
 * Zugang", meist die Adressbindung). Ein Ja/Nein-Feld könnte beides nicht
 * unterscheiden und zeigte entweder eine Ablehnung, bevor gefragt wurde, oder
 * ewig einen Spinner.
 *
 * `true` bleibt bewusst `'redeeming'`: der Erfolg ist kein Bildschirm, sondern
 * eine Weiterleitung in die Brandings. Ein eigener Zustand dafür wäre ein
 * Zustand, den niemand je länger als einen Wimpernschlag sieht.
 *
 * ── WAS SIE NICHT WEISS ───────────────────────────────────────────────────
 * Ob gerade geprüft wird. Das ist eine Ladeanzeige, keine Aussage über die
 * Einladung — die Seite blendet sie über den Zustand, statt sie ihm
 * hinzuzufügen. Und den GRUND einer Ablehnung: den kennt hier niemand, weil
 * ihn der Server nie herausgibt.
 */

export type BrandInviteViewState =
  /** Kein Code — ruhiger Hinweis auf die geschlossene Beta plus Eingabefeld. */
  | 'enterCode'
  /** Der Code taugt nicht. Ein Grund wird bewusst nicht genannt. */
  | 'invalid'
  /** Gültig, aber kein Konto: hier entsteht es (mit `admissionCode`). */
  | 'register'
  /** Gültig, Konto da, Adresse unbestätigt: die Mail ist der nächste Schritt. */
  | 'verifyPending'
  /** Alle Vorbedingungen stehen — es wird eingelöst (oder gerade weitergeleitet). */
  | 'redeeming'
  /** Der Server hat die Einlösung abgelehnt. Neutral, mit Wiederholungs-Knopf. */
  | 'denied'

export interface BrandInviteViewInput {
  /** Liegt überhaupt ein Code vor (aus `?code=` oder aus dem Cookie)? */
  hasCode: boolean
  /** Antwort von `POST /api/brand/invite/check` — neutral, ohne Grund. */
  valid: boolean
  loggedIn: boolean
  /** `user.emailVerification` — die Einlösung verlangt sie ausdrücklich. */
  verified: boolean
  /** `null` = noch kein Einlöse-Versuch; sonst die Antwort des Servers. */
  redeemed: boolean | null
}

export function inviteViewState(input: BrandInviteViewInput): BrandInviteViewState {
  if (!input.hasCode) return 'enterCode'
  if (!input.valid) return 'invalid'
  if (!input.loggedIn) return 'register'
  if (!input.verified) return 'verifyPending'
  if (input.redeemed === false) return 'denied'
  return 'redeeming'
}
