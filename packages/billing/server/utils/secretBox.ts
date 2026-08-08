import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * AES-256-GCM-Umschlag für Geheimnisse, die in einer Appwrite-Zeile liegen
 * (F55 — Davids Entscheidung 2026-08-08: Stripe-Keys wandern in die DB, der
 * ENTSCHLÜSSELUNGS-Schlüssel bleibt Server-Env).
 *
 * DER TRADE-OFF, AUSGESPROCHEN: bisher galt „Stripe-Keys nur in der
 * Server-Env". Diese Datei hebt das auf, aber nicht auf null: ein
 * DB-Dump allein nützt nichts, ein Env-Leck allein auch nicht — man braucht
 * BEIDES. Das war der Preis für Davids Kernanliegen (Go-Live ohne Terminal),
 * und er ist bewusst bezahlt.
 *
 * GCM statt CBC, weil die Antwort auf „wurde daran gedreht?" nicht „sieht
 * plausibel aus" heißen darf: der AuthTag macht Manipulation zu einem
 * FEHLER, nicht zu stillem Müll. Ohne ihn liefe ein verändertes Ciphertext
 * in einen zufälligen „Key", und der Fehler stünde erst bei Stripe als
 * 401 — an einer Stelle, an der niemand mehr an die Datenbank denkt.
 *
 * KEIN Fallback auf eine schwache Ableitung (etwa aus dem Appwrite-Key oder
 * einem Konstanten-Salt), wenn die Env fehlt. Eine Verschlüsselung, deren
 * Schlüssel im Repository steht, ist eine Verkleidung. Fehlt die Env, sagt
 * die Oberfläche ehrlich „nicht konfiguriert" und nennt den Variablennamen.
 */

/** 32 Bytes = 64 Hex-Zeichen. Erzeugen: `openssl rand -hex 32`. */
export const SECRET_BOX_KEY_HEX_LENGTH = 64

/** Format-Kennung im Umschlag — macht einen späteren Verfahrenswechsel lesbar. */
const ENVELOPE_PREFIX = 'v1.'
const IV_BYTES = 12
const TAG_BYTES = 16

/**
 * Hex-Env → Schlüsselmaterial. `null` heißt „nicht konfiguriert" und ist ein
 * gültiger Zustand (die Key-Verwaltung schaltet sich dann ab); ein GESETZTER,
 * aber falsch geformter Wert ist dagegen ein Konfigurationsfehler und wirft —
 * sonst verhielte sich ein Tippfehler wie eine bewusste Abschaltung.
 */
export function parseSecretBoxKey(hex: string | null | undefined): Buffer | null {
  if (!hex) return null
  const trimmed = hex.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length !== SECRET_BOX_KEY_HEX_LENGTH || !/^[0-9a-fA-F]+$/.test(trimmed)) {
    throw new Error(`NUXT_BILLING_SETTINGS_KEY muss ${SECRET_BOX_KEY_HEX_LENGTH} Hex-Zeichen haben (openssl rand -hex 32).`)
  }
  return Buffer.from(trimmed, 'hex')
}

/**
 * Klartext → `v1.<base64(iv|tag|ciphertext)>`.
 *
 * Der IV ist bei jedem Aufruf neu und steckt IM Umschlag: derselbe Key
 * zweimal gespeichert ergibt zwei verschiedene Zeichenketten. Das ist nicht
 * Kosmetik — ein fester IV macht GCM angreifbar.
 */
export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ENVELOPE_PREFIX + Buffer.concat([iv, tag, ciphertext]).toString('base64')
}

/**
 * Umschlag → Klartext. Wirft bei falschem Schlüssel, fremdem Format oder
 * manipuliertem AuthTag. Der Aufrufer behandelt das wie „kein Wert
 * gespeichert" (fail-soft in Richtung Env-Fallback), protokolliert es aber —
 * ein nicht entschlüsselbarer Key ist ein Betriebsvorfall, kein Leerzustand.
 */
export function decryptSecret(envelope: string, key: Buffer): string {
  if (!envelope.startsWith(ENVELOPE_PREFIX)) {
    throw new Error('Unbekanntes Umschlag-Format')
  }
  const raw = Buffer.from(envelope.slice(ENVELOPE_PREFIX.length), 'base64')
  if (raw.length <= IV_BYTES + TAG_BYTES) {
    throw new Error('Umschlag zu kurz')
  }
  const iv = raw.subarray(0, IV_BYTES)
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/**
 * Gleicher Schlüssel? Nur für Tests/Diagnose — vergleicht in konstanter Zeit.
 * (Ein Längenunterschied ist ohnehin öffentlich, `timingSafeEqual` wirft
 * darauf, deshalb die Vorprüfung.)
 */
export function sameSecretBoxKey(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b)
}
