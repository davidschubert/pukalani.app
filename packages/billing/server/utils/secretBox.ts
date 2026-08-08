import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * AES-256-GCM-Umschlag für Geheimnisse, die in einer Appwrite-Zeile liegen
 * (F55 — Davids Entscheidung 2026-08-08: Stripe-Keys wandern in die DB, der
 * ENTSCHLÜSSELUNGS-Schlüssel bleibt Server-Env).
 *
 * WOGEGEN DAS SCHÜTZT — UND WOGEGEN NICHT (präzisiert 2026-08-08, Audit-Befund
 * NOTE 9; die frühere Fassung behauptete „man braucht BEIDES" und war damit
 * eine Beruhigung, die nicht trägt):
 *
 * - GEGEN EIN DB-LECK: ja, und das ist der Zweck. Ein Dump der Appwrite-Tabelle
 *   (Backup auf einer Storage-Box, ein zweites Auge auf dem DB-Container, eine
 *   fehlgeleitete Wiederherstellung) enthält nur Ciphertext.
 * - GEGEN EIN ENV-LECK: NEIN. Wer die Server-Env liest, hat neben
 *   NUXT_BILLING_SETTINGS_KEY auch NUXT_APPWRITE_KEY — also den Admin-Zugang zu
 *   genau der Zeile, die der Schlüssel öffnet. Der Angreifer mit Env-Zugriff
 *   braucht keine zwei Geheimnisse, er hat beide im selben Griff.
 *
 * DARAUS FOLGT: diese Verschlüsselung darf NIE die Begründung dafür sein, das
 * Geheimnis überhaupt in die DB zu legen. Der Grund dafür war Davids
 * Kernanliegen „Go-Live ohne Terminal"; der Umschlag senkt danach nur noch die
 * Kosten des wahrscheinlichsten Unfalls (ein DB-Dump wandert weiter als
 * gedacht). Wer den Angreifer mit Env-Zugriff aussperren will, braucht einen
 * anderen Aufbewahrungsort (KMS/HSM), nicht einen zweiten String daneben.
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
 * Länge der Schlüssel-Kennung im Umschlag (Hex-Zeichen). Vier Bytes reichen:
 * sie muss ZWEI gleichzeitig konfigurierte Schlüssel auseinanderhalten, nicht
 * kollisionsfrei über ein Universum von Schlüsseln sein.
 */
const KEY_ID_HEX_LENGTH = 8

/**
 * Domänen-Trennung für die Kennung. Ohne sie wäre die Kennung ein blanker
 * Präfix von sha256(key) — dieselbe Zahl, die anderswo als Fingerabdruck
 * desselben Schlüssels auftauchen könnte. Mit Label ist sie NUR hier gültig.
 */
const KEY_ID_LABEL = 'pukalani-secretbox-kid-v1'

/**
 * KURZE KENNUNG EINES SCHLÜSSELS (LOW 7, 2026-08-08). Steht im Umschlag und
 * beantwortet die Frage, die eine Rotation überhaupt erst bedienbar macht:
 * „mit WELCHEM der konfigurierten Schlüssel wurde das hier zugemacht?"
 *
 * Sie verrät nichts: 32 zufällige Bytes hinter sha256 sind nicht ratbar, und
 * ein Angreifer, der einen Schlüssel schon HAT, lernt aus der Bestätigung
 * „ja, dieser" nichts hinzu.
 */
export function secretBoxKeyId(key: Buffer): string {
  return createHash('sha256').update(KEY_ID_LABEL).update(key).digest('hex').slice(0, KEY_ID_HEX_LENGTH)
}

/**
 * Hex-Env → Schlüsselmaterial. `null` heißt „nicht konfiguriert" und ist ein
 * gültiger Zustand (die Key-Verwaltung schaltet sich dann ab); ein GESETZTER,
 * aber falsch geformter Wert ist dagegen ein Konfigurationsfehler und wirft —
 * sonst verhielte sich ein Tippfehler wie eine bewusste Abschaltung.
 *
 * NIMMT BEWUSST `unknown` (NOTE 10, 2026-08-08): der Wert kommt aus
 * `useRuntimeConfig()`, und Nitro schickt Env-Werte durch `destr` — ein
 * Schlüssel aus lauter Ziffern käme dort als NUMBER an. Vorher fiel genau das
 * still auf „nicht konfiguriert" zurück und die Ablage war ohne Meldung tot.
 */
export function parseSecretBoxKey(hex: unknown, envName = 'NUXT_BILLING_SETTINGS_KEY'): Buffer | null {
  if (hex === undefined || hex === null) return null
  if (typeof hex !== 'string') {
    throw new Error(`${envName} muss ${SECRET_BOX_KEY_HEX_LENGTH} Hex-Zeichen als Zeichenkette sein — angekommen ist ${typeof hex} (Env-Werte laufen durch destr; notfalls in Anführungszeichen setzen).`)
  }
  const trimmed = hex.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length !== SECRET_BOX_KEY_HEX_LENGTH || !/^[0-9a-fA-F]+$/.test(trimmed)) {
    throw new Error(`${envName} muss ${SECRET_BOX_KEY_HEX_LENGTH} Hex-Zeichen haben (openssl rand -hex 32).`)
  }
  return Buffer.from(trimmed, 'hex')
}

/**
 * Klartext → `v1.<kid>.<base64(iv|tag|ciphertext)>`.
 *
 * Der IV ist bei jedem Aufruf neu und steckt IM Umschlag: derselbe Key
 * zweimal gespeichert ergibt zwei verschiedene Zeichenketten. Das ist nicht
 * Kosmetik — ein fester IV macht GCM angreifbar.
 *
 * GESCHRIEBEN WIRD IMMER MIT DER KENNUNG. Gelesen werden auch Umschläge OHNE
 * (Bestand aus der Zeit vor LOW 7) — die Rotation darf keine Zeile entwerten,
 * die schon in der Datenbank liegt.
 */
export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${ENVELOPE_PREFIX}${secretBoxKeyId(key)}.${Buffer.concat([iv, tag, ciphertext]).toString('base64')}`
}

interface ParsedEnvelope {
  /** `null` = Bestands-Umschlag ohne Kennung. */
  keyId: string | null
  iv: Buffer
  tag: Buffer
  ciphertext: Buffer
}

/**
 * Umschlag zerlegen. Der Punkt als Trenner ist eindeutig: base64 kennt ihn
 * nicht (A–Z a–z 0–9 + / =), ein Punkt nach `v1.` kann also nur die Kennung
 * abschließen.
 */
function parseEnvelope(envelope: string): ParsedEnvelope {
  if (!envelope.startsWith(ENVELOPE_PREFIX)) {
    throw new Error('Unbekanntes Umschlag-Format')
  }
  const rest = envelope.slice(ENVELOPE_PREFIX.length)
  const dot = rest.indexOf('.')
  const keyId = dot === -1 ? null : rest.slice(0, dot)
  if (keyId !== null && !new RegExp(`^[0-9a-f]{${KEY_ID_HEX_LENGTH}}$`).test(keyId)) {
    throw new Error('Unbekanntes Umschlag-Format')
  }
  const raw = Buffer.from(dot === -1 ? rest : rest.slice(dot + 1), 'base64')
  if (raw.length <= IV_BYTES + TAG_BYTES) {
    throw new Error('Umschlag zu kurz')
  }
  return {
    keyId,
    iv: raw.subarray(0, IV_BYTES),
    tag: raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES),
    ciphertext: raw.subarray(IV_BYTES + TAG_BYTES),
  }
}

function openWith(parsed: ParsedEnvelope, key: Buffer): string {
  const decipher = createDecipheriv('aes-256-gcm', key, parsed.iv)
  decipher.setAuthTag(parsed.tag)
  return Buffer.concat([decipher.update(parsed.ciphertext), decipher.final()]).toString('utf8')
}

/**
 * Umschlag → Klartext. Wirft bei falschem Schlüssel, fremdem Format oder
 * manipuliertem AuthTag. Der Aufrufer behandelt das wie „kein Wert
 * gespeichert" (fail-soft in Richtung Env-Fallback), protokolliert es aber —
 * ein nicht entschlüsselbarer Key ist ein Betriebsvorfall, kein Leerzustand.
 */
export function decryptSecret(envelope: string, key: Buffer): string {
  const parsed = parseEnvelope(envelope)
  if (parsed.keyId !== null && parsed.keyId !== secretBoxKeyId(key)) {
    // Der AuthTag würde ohnehin scheitern — aber mit „unable to authenticate
    // data" statt mit der Auskunft, die man im Betrieb braucht.
    throw new Error(`Umschlag gehört zu einem anderen Schlüssel (Kennung ${parsed.keyId})`)
  }
  return openWith(parsed, key)
}

/**
 * MEHRERE SCHLÜSSEL BEIM LESEN (LOW 7): der erste ist der SCHREIB-Schlüssel,
 * die weiteren sind Alt-Schlüssel aus einer laufenden Rotation
 * (NUXT_BILLING_SETTINGS_KEY_OLD). Geschrieben wird NIE mit einem Alt-Schlüssel
 * — sonst käme man aus der Rotation nie heraus.
 *
 * Mit Kennung wird GEZIELT gewählt; ohne Kennung (Bestand) der Reihe nach
 * probiert. Das Probieren ist billig und kann nichts Falsches liefern: GCM
 * bestätigt jeden Treffer über den AuthTag.
 */
export function decryptSecretWithKeys(envelope: string, keys: readonly Buffer[]): string {
  if (keys.length === 0) throw new Error('Kein Schlüssel konfiguriert')
  const parsed = parseEnvelope(envelope)

  if (parsed.keyId !== null) {
    const match = keys.find(key => secretBoxKeyId(key) === parsed.keyId)
    if (!match) {
      throw new Error(`Umschlag gehört zu einem anderen Schlüssel (Kennung ${parsed.keyId})`)
    }
    return openWith(parsed, match)
  }

  let lastError: unknown = new Error('Umschlag lässt sich mit keinem konfigurierten Schlüssel öffnen')
  for (const key of keys) {
    try {
      return openWith(parsed, key)
    }
    catch (error) {
      lastError = error
    }
  }
  throw lastError
}

/**
 * Gleicher Schlüssel? Nur für Tests/Diagnose — vergleicht in konstanter Zeit.
 * (Ein Längenunterschied ist ohnehin öffentlich, `timingSafeEqual` wirft
 * darauf, deshalb die Vorprüfung.)
 */
export function sameSecretBoxKey(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b)
}
