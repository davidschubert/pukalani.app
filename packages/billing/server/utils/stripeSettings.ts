import type { H3Event } from 'h3'
import type { Models } from 'node-appwrite'
import type { StripeSecretSource } from '../../shared/stripeKeys'
import { decryptSecret, encryptSecret, parseSecretBoxKey } from './secretBox'

/**
 * WO KOMMEN DIE STRIPE-GEHEIMNISSE HER? (F55, Davids Entscheidung 2026-08-08)
 *
 * Zwei Quellen, feste Rangfolge: **DB schlägt Env**. Die DB-Zeile trägt der
 * Betreiber über /dashboard/stripe ein, die Env bleibt der Weg für alles, was
 * ohne Oberfläche auskommen muss (CI, lokale Entwicklung, Notfall-Rückfall
 * nach einem Fehleintrag).
 *
 * DIE RANGFOLGE IST HERUM, WEIL SIE SONST NICHTS BEWIRKTE: stünde die Env
 * vorn, hätte ein Eintrag über die Seite auf `control` (wo `NUXT_STRIPE_*`
 * gesetzt IST) keine Wirkung — der Betreiber klickt, die Karte meldet Erfolg,
 * und der Checkout benutzt weiter den alten Key. Genau die Sorte stiller
 * Wirkungslosigkeit, die F44 zum Wächter gemacht hat.
 *
 * VERHALTEN OHNE DB-WERT IST EXAKT WIE VORHER. Keine Zeile, keine Tabelle,
 * kein Verschlüsselungs-Schlüssel — jedes Mal fällt die Auflösung auf die Env
 * zurück, und wenn auch die leer ist, auf 'none'. Der Webhook antwortet dann
 * weiter 404, `useStripe` weiter 500. Das ist wichtig für den Silo
 * (`apps/comments`): dort läuft der billing-Layer mit, aber niemand wird je
 * eine `stripe_settings`-Zeile anlegen.
 *
 * FAIL-SOFT BEIM LESEN: eine fehlende Tabelle (Migration billing-002 noch
 * nicht gelaufen) oder ein Appwrite-Aussetzer darf den Geldweg nicht kappen,
 * solange die Env trägt. Ein NICHT ENTSCHLÜSSELBARER Wert ist dagegen ein
 * Vorfall und wird laut protokolliert — er sieht sonst aus wie „nichts
 * gespeichert" und niemand fragt nach.
 */

export const STRIPE_SETTINGS_TABLE = 'stripe_settings'

/**
 * EINE Zeile, feste Id. Es gibt genau eine Stripe-Konfiguration je Instanz —
 * eine `ID.unique()`-Zeile bräuchte eine Abfrage, einen Index und die Frage
 * „welche gilt, wenn zwei da sind". Die feste Id beantwortet sie nicht,
 * sondern lässt sie gar nicht erst entstehen.
 */
export const STRIPE_SETTINGS_ROW_ID = 'stripe'

export interface StripeSettingsRow extends Models.Row {
  stripeSecretKeyEncrypted: string
  stripeWebhookSecretEncrypted: string
  updatedAt: string
  updatedBy: string
}

/** Ergebnis einer Auflösung: der Wert und — für die Statuskarte — seine Herkunft. */
export interface ResolvedStripeSecret {
  value: string
  source: StripeSecretSource
}

/** Verschlüsselungs-Schlüssel dieser Instanz (server-only Env). */
export function stripeSettingsKey(event?: H3Event): Buffer | null {
  const raw = useRuntimeConfig(event).billingSettingsKey
  return parseSecretBoxKey(typeof raw === 'string' ? raw : '')
}

/**
 * Kann diese Instanz überhaupt Geheimnisse ablegen? Wenn nicht, zeigt die
 * Oberfläche den Env-Namen statt der Eingabefelder — statt ein Formular
 * anzubieten, dessen Absenden nur scheitern kann.
 */
export function stripeSettingsStorageAvailable(event?: H3Event): boolean {
  try {
    return stripeSettingsKey(event) !== null
  }
  catch {
    // Gesetzt, aber falsch geformt: für die Oberfläche dasselbe wie „fehlt",
    // die genaue Ursache steht im Fehler der Speichern-Route.
    return false
  }
}

/** 30 s Gedächtnis: der Geldweg fragt sonst je Checkout eine Zeile nach. */
const CACHE_TTL_MS = 30_000
let cache: { at: number, row: StripeSettingsRow | null } | null = null

/** Nach jedem Schreiben: der nächste Leser holt frisch (sonst 30 s Blindflug). */
export function invalidateStripeSettingsCache(): void {
  cache = null
}

/** Nur für Tests. */
export function __resetStripeSettingsCache(): void {
  cache = null
}

async function loadStripeSettings(event: H3Event): Promise<StripeSettingsRow | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.row

  const config = useRuntimeConfig(event)
  const databaseId = config.public.appwriteDatabaseId
  if (!databaseId) {
    cache = { at: Date.now(), row: null }
    return null
  }

  const row = await createAdminClient(event).tablesDB.getRow<StripeSettingsRow>({
    databaseId,
    tableId: STRIPE_SETTINGS_TABLE,
    rowId: STRIPE_SETTINGS_ROW_ID,
  }).catch((error: unknown) => {
    // 404 = Zeile (oder Tabelle) gibt es nicht — der Normalzustand jeder
    // Instanz, die ihre Keys über die Env fährt. Alles andere ist ein
    // Aussetzer; auch dann tragen wir die Env weiter, melden es aber einmal.
    if (!hasAppwriteCode(error, 404)) {
      warnMisconfiguredOnce('stripeSettingsRead', `[billing] ${STRIPE_SETTINGS_TABLE} nicht lesbar — Stripe-Geheimnisse kommen bis auf Weiteres aus der Env.`)
    }
    return null
  })

  cache = { at: Date.now(), row }
  return row
}

function hasAppwriteCode(error: unknown, code: number): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === code
}

/**
 * Einen verschlüsselten Wert öffnen. Leerer Umschlag = „nichts gespeichert".
 * Ein Fehler beim Öffnen wird laut protokolliert und wie „nichts gespeichert"
 * behandelt — der Env-Rückfall greift dann.
 */
function openEnvelope(envelope: string, key: Buffer | null, label: string): string {
  if (!envelope) return ''
  if (!key) {
    warnMisconfiguredOnce(`stripeSettingsNoKey:${label}`, `[billing] ${label} liegt verschlüsselt in der DB, aber NUXT_BILLING_SETTINGS_KEY fehlt — der Wert ist unbenutzbar.`)
    return ''
  }
  try {
    return decryptSecret(envelope, key)
  }
  catch {
    warnMisconfiguredOnce(`stripeSettingsBroken:${label}`, `[billing] ${label} in ${STRIPE_SETTINGS_TABLE} lässt sich nicht entschlüsseln (falscher NUXT_BILLING_SETTINGS_KEY oder veränderte Zeile).`)
    return ''
  }
}

/**
 * Schlüssel holen, ohne bei einem Tippfehler in der Env den Geldweg zu
 * kappen: eine falsch geformte Variable macht die ABLAGE unbenutzbar
 * (`saveStripeSettings` wirft dort weiter), nicht das LESEN — die Env-Werte
 * tragen dann wie eh und je.
 */
function settingsKeyOrNull(event: H3Event): Buffer | null {
  try {
    return stripeSettingsKey(event)
  }
  catch {
    return null
  }
}

/** Secret-Key zur Laufzeit: DB (entschlüsselt) vor Env. */
export async function resolveStripeSecretKey(event: H3Event): Promise<ResolvedStripeSecret> {
  const key = settingsKeyOrNull(event)
  const row = await loadStripeSettings(event)
  const fromDb = openEnvelope(row?.stripeSecretKeyEncrypted ?? '', key, 'Stripe-Secret-Key')
  if (fromDb) return { value: fromDb, source: 'db' }

  const fromEnv = useRuntimeConfig(event).stripeSecretKey
  if (fromEnv) return { value: fromEnv, source: 'env' }
  return { value: '', source: 'none' }
}

/** Webhook-Signatur-Secret zur Laufzeit: DB (entschlüsselt) vor Env. */
export async function resolveStripeWebhookSecret(event: H3Event): Promise<ResolvedStripeSecret> {
  const key = settingsKeyOrNull(event)
  const row = await loadStripeSettings(event)
  const fromDb = openEnvelope(row?.stripeWebhookSecretEncrypted ?? '', key, 'Stripe-Webhook-Secret')
  if (fromDb) return { value: fromDb, source: 'db' }

  const fromEnv = useRuntimeConfig(event).stripeWebhookSecret
  if (fromEnv) return { value: fromEnv, source: 'env' }
  return { value: '', source: 'none' }
}

/**
 * Geheimnisse ablegen. Nur die ÜBERGEBENEN Felder werden angefasst — ein
 * fehlendes Feld heißt „nicht angefasst", nie „leeren". (Dieselbe Regel wie
 * beim `neutral`-Feld des Branding-PATCH, B5: ein Pflichtfeld hier hieße,
 * dass das Speichern eines neuen Secret-Keys das Webhook-Secret mitlöscht.)
 *
 * Die Zeile trägt KEINE Row-Permissions: sie ist damit ausschließlich über
 * den Admin-Client erreichbar. Kein Session-Client, keine Rolle, kein Label
 * kommt an sie heran — auch nicht der Betreiber selbst über eine generische
 * Row-Route. Der einzige Weg zurück ist die Entschlüsselung im Server.
 */
export async function saveStripeSettings(
  event: H3Event,
  patch: { secretKey?: string, webhookSecret?: string },
  updatedBy: string,
): Promise<void> {
  const key = stripeSettingsKey(event)
  if (!key) {
    throw createError({
      status: 503,
      statusText: 'Secret storage not configured',
      data: { code: 'encryption_unconfigured' },
    })
  }

  const config = useRuntimeConfig(event)
  const databaseId = config.public.appwriteDatabaseId
  const admin = createAdminClient(event)

  const data: Record<string, string> = { updatedAt: new Date().toISOString(), updatedBy }
  if (patch.secretKey !== undefined) data.stripeSecretKeyEncrypted = encryptSecret(patch.secretKey, key)
  if (patch.webhookSecret !== undefined) data.stripeWebhookSecretEncrypted = encryptSecret(patch.webhookSecret, key)

  try {
    await admin.tablesDB.updateRow({
      databaseId,
      tableId: STRIPE_SETTINGS_TABLE,
      rowId: STRIPE_SETTINGS_ROW_ID,
      data,
    })
  }
  catch (error) {
    if (!hasAppwriteCode(error, 404)) throw error
    // Erste Ablage: die Zeile entsteht hier, nicht in der Migration — eine
    // leere Zeile mit Pflichtfeldern wäre nur ein Platzhalter, den man beim
    // Aufräumen für Müll hält.
    await admin.tablesDB.createRow({
      databaseId,
      tableId: STRIPE_SETTINGS_TABLE,
      rowId: STRIPE_SETTINGS_ROW_ID,
      data: {
        stripeSecretKeyEncrypted: '',
        stripeWebhookSecretEncrypted: '',
        ...data,
      },
      permissions: [],
    })
  }

  invalidateStripeSettingsCache()
}
