/**
 * Migration system-032: Storage-Buckets `avatars` + `gdpr-exports`.
 *
 * AH-1-Krümel (2026-08-12): beim account-Cutover zeigte sich, dass beide
 * Buckets im Pool nur VON HAND existierten — kein Migrations-Script legte sie
 * an (fonts/media/event-covers/ticket-files schon). Eine frische Instanz hätte
 * damit weder Profilbilder noch GDPR-Snapshots speichern können, und beides
 * sind CORE-Fähigkeiten (profile.put.ts bzw. userDataOrchestration.ts), die
 * auf jeder Instanz laufen — deshalb liegt die Migration im system-Layer.
 *
 * Die Einstellungen sind am 2026-08-12 aus der Prod-Instanz `account`
 * ABGELESEN — mit EINEM Fehler, der dabei mitkopiert wurde: `avatars` stand
 * dort ohne `create("users")`, womit jeder Profilbild-Upload scheiterte
 * (2026-08-17 live erwischt, Details am avatars-Schritt unten). Der Rest
 * stimmt: beide fileSecurity (Row-Permissions je Datei — ein GDPR-Snapshot
 * gehört genau einem Konto, ein Avatar seinem Besitzer), 30 MB, keine
 * Extension-Liste (Magic-Bytes prüft die Route), Encryption+Antivirus an.
 * `gdpr-exports` bleibt ohne Bucket-Permissions (schreibt nur der Server).
 *
 *   node --experimental-strip-types --env-file=apps/<app>/.env \
 *     packages/system/scripts/migrations/032-core-buckets.ts
 *
 * Benötigte Key-Scopes: buckets.* (Migrations-Key). Idempotent (409 → skip).
 */
import { Client, Storage } from 'node-appwrite'

const endpoint = process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID

const apiKey = process.env.NUXT_APPWRITE_MIGRATIONS_KEY ?? process.env.NUXT_APPWRITE_KEY
if (!process.env.NUXT_APPWRITE_MIGRATIONS_KEY) {
  console.warn('⚠️  NUXT_APPWRITE_MIGRATIONS_KEY nicht gesetzt — Fallback auf NUXT_APPWRITE_KEY.')
}
if (!endpoint || !projectId || !apiKey) {
  console.error('Fehlende Env-Vars — Script mit --env-file=apps/<app>/.env aufrufen.')
  process.exit(1)
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
const storage = new Storage(client)

function hasCode(error: unknown, code: number): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}

async function step(label: string, run: () => Promise<unknown>) {
  try {
    await run()
    console.log(`✔ ${label}`)
  }
  catch (error) {
    if (hasCode(error, 409)) {
      console.log(`↷ ${label} (existiert bereits)`)
      return
    }
    throw error
  }
}

console.log(`Migration system-032 gegen ${endpoint} / Projekt ${projectId}`)

/**
 * `create("users")` ist PFLICHT: die Upload-Route (core/server/api/storage/
 * [bucket]/index.post.ts) läuft mit dem SESSION-Client — ohne Bucket-Create-
 * Recht scheitert JEDER Profilbild-Upload (Appwrite-401 → generisches 500 an
 * der Route, 2026-08-17 auf allen drei Prod-Instanzen live erwischt). Die
 * ursprüngliche Fassung hatte `permissions: []` von der Prod-Instanz
 * ABGELESEN — und damit deren Fehlstand kopiert. Datei-Rechte bleiben pro
 * Datei beim Besitzer (fileSecurity, die Route setzt read(any) +
 * update/delete(user)). Der 409-Zweig zieht BESTEHENDE Buckets nach, sonst
 * bliebe jede schon migrierte Instanz kaputt.
 */
const avatarsSettings = {
  name: 'avatars',
  permissions: ['create("users")'],
  fileSecurity: true,
  maximumFileSize: 30_000_000,
  encryption: true,
  antivirus: true,
}
try {
  await storage.createBucket({ bucketId: 'avatars', ...avatarsSettings })
  console.log(`✔ Bucket 'avatars'`)
}
catch (error) {
  if (!hasCode(error, 409)) throw error
  await storage.updateBucket({ bucketId: 'avatars', enabled: true, ...avatarsSettings })
  console.log(`↷ Bucket 'avatars' (existierte — Permissions nachgezogen)`)
}

await step(`Bucket 'gdpr-exports'`, () => storage.createBucket({
  bucketId: 'gdpr-exports',
  name: 'gdpr-exports',
  permissions: [],
  fileSecurity: true,
  maximumFileSize: 30_000_000,
  encryption: true,
  antivirus: true,
}))

console.log('Migration system-032 abgeschlossen.')
