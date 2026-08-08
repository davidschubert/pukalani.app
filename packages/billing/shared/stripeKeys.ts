/**
 * PURE Regeln über Stripe-Geheimnisse (F55) — Form, Modus, Maskierung.
 *
 * Warum eine eigene Datei und nicht „mach das inline in der Route": diese
 * Regeln entscheiden, WAS DIE OBERFLÄCHE ZU SEHEN BEKOMMT. Ein Fehler hier
 * ist kein Schönheitsfehler, sondern ein Leck — und ein Leck, das man nur
 * bemerkt, wenn jemand hinsieht. Deshalb pure Funktionen mit Unit-Tests statt
 * einer Handvoll `slice(-4)`-Aufrufe an verstreuten Stellen.
 *
 * Der Live-/Test-Modus ist am Key ABLESBAR. Das ist kein Trick, sondern die
 * Zusicherung von Stripe: `sk_live_…` spricht mit echtem Geld, `sk_test_…`
 * nie. Die Statuskarte fragt deshalb NICHT bei Stripe nach dem Modus (ein
 * Netzwerkfehler dürfte diese Auskunft nicht verunklaren) — sie liest ihn ab.
 */

/** Betriebsmodus, wie er sich aus dem Secret-Key ergibt. */
export type StripeKeyMode = 'live' | 'test' | 'none'

/** Herkunft eines Geheimnisses zur Laufzeit (DB schlägt Env, s. stripeSettings.ts). */
export type StripeSecretSource = 'db' | 'env' | 'none'

/**
 * Sichtbarer Rest eines Geheimnisses: die LETZTEN VIER Zeichen, mehr nie.
 *
 * Vier Zeichen reichen, um zwei Schlüssel auseinanderzuhalten („ist das der
 * rotierte?"), und tragen nichts zur Wiederherstellung bei. Ein kürzerer Key
 * als vier Zeichen ist kein Stripe-Key — dann gibt es hier nichts zu zeigen.
 */
export function secretTail(value: string | null | undefined): string {
  if (!value || value.length < 4) return ''
  return value.slice(-4)
}

/**
 * Modus aus dem Key-Präfix. Alles, was nicht eindeutig `sk_live_`/`sk_test_`
 * ist, heißt 'none' — auch ein syntaktisch falscher Key. Fail-closed: lieber
 * „kein Modus erkennbar" als eine erfundene Beruhigung „test".
 */
export function stripeModeFromKey(value: string | null | undefined): StripeKeyMode {
  if (!value) return 'none'
  if (value.startsWith('sk_live_')) return 'live'
  if (value.startsWith('sk_test_')) return 'test'
  return 'none'
}

/**
 * Sieht das wie ein Stripe-Secret-Key aus?
 *
 * BEWUSST NUR `sk_` — nicht `rk_` (Restricted Key) und nicht `pk_`. Die
 * F55-Seite legt Preise, Produkte und Webhook-Endpunkte an; ein Restricted
 * Key kann das nur mit exakt den richtigen Rechten, und ein Rechtefehler
 * äußert sich dann als kryptisches 403 mitten in einem halb angelegten
 * Katalog. Wer restricted arbeiten will, setzt weiter die Env — die
 * Auflösung nimmt jeden Wert, nur dieses EINGABEFELD ist streng.
 *
 * `pk_` ist der ÖFFENTLICHE Key und gehört hier gar nicht hin; die
 * Verwechslung ist der häufigste Kopierfehler und muss laut scheitern.
 */
export function looksLikeStripeSecretKey(value: string): boolean {
  return /^sk_(live|test)_[A-Za-z0-9_]{8,}$/.test(value)
}

/** Sieht das wie ein Webhook-Signatur-Secret aus? (`whsec_…`) */
export function looksLikeStripeWebhookSecret(value: string): boolean {
  return /^whsec_[A-Za-z0-9_]{8,}$/.test(value)
}
