/**
 * Migration system-033: Table `community_navigation` — das öffentliche MENÜ
 * einer Community, so wie ihr Owner es zusammengestellt hat (U15 Teil 1).
 *
 * EINE Row pro Community, rowId = `communities.$id` (= `useSiteId()`), Inhalt =
 * EIN JSON-Dokument in `config`. Geschrieben ausschliesslich server-seitig
 * (packages/pages/server/utils/communityNavigationStore.ts) hinter
 * `requireCommunityPermission(event, 'branding.manage')`; gelesen SSR-seitig
 * beim Seitenaufbau (30 s Microcache). Vertrag, Auflösungsregel und die
 * Begründung der Feld-Form: packages/core/shared/communityNavigation.ts.
 *
 * FORM ÜBERNOMMEN VON `community_branding` (system-028): dieselbe Gestalt —
 * eine Infrastruktur-Zeile ÜBER eine Community, deren rowId die Community IST.
 * Damit gilt hier auch dieselbe Begründung dafür, dass sie NICHT durch die
 * Datentür geschrieben wird (`tenantDb` würde eine `communityId` stempeln, die
 * schon die rowId ist, Row-Permissions auf eine bewusst table-weit gelesene
 * Tabelle legen und über die Türklinke 'member' einen A5-Beitritt auslösen).
 * Nachzulesen im Kopf des Stores.
 *
 * PERMISSIONS: `read(any)`, kein write — wie `app_config` (system-005),
 * `custom_themes` (system-013) und `community_branding` (system-028).
 * `rowSecurity: false`, weil das Lese-Recht an der Tabelle hängt.
 *
 * WARUM ÖFFENTLICH LESBAR, obwohl heute nur der SERVER liest: das Menü IST der
 * öffentlichste Teil einer Website — jeder Besucher sieht es im Kopf jeder
 * Seite. Ein Lese-Recht, das etwas verbirgt, was daneben im HTML steht, wäre
 * eine Zeremonie. Und es hält den Weg für die Live-Propagation offen, die
 * `community_branding` schon geht (Browser abonniert genau seine Row) — ohne
 * eine zweite Migration, die die Rechte einer bestehenden Tabelle ändert.
 *
 * DAS HEISST AUFZÄHLBAR, und das ist hier eine Abwägung mit einer schärferen
 * Kante als bei system-028: dort liegen Farb-Tokens, hier liegen vom Owner
 * GESCHRIEBENE Texte und Adressen. Tragbar, weil (a) genau diese Texte auf
 * jeder Seite der Community öffentlich stehen, (b) die Zeile ausser einer
 * undurchsichtigen Row-Id nichts trägt, was sie einer Community, einem Host
 * oder einer Person ZUORDNET, und (c) ein Menü ohne diese Zuordnung als
 * Beute wertlos ist. DIESELBE REGEL WIE DORT: NIE eine Spalte mit Name, Host
 * oder sonst etwas Identifizierendem dazunehmen — wer das täte, machte aus
 * einer belanglosen Liste ein Verzeichnis aller Kunden.
 *
 * KEINE INDIZES, und das ist kein Vergessen (wie system-028): die Tabelle wird
 * ausschliesslich über die rowId angesprochen. Es gibt keine Abfrage, die einen
 * Index bräuchte — damit entfällt hier auch der `indexStep`-Retry, der Pflicht
 * wäre, sobald ein Index dazukommt.
 *
 * SPALTENGRÖSSE 8192: nachgerechnet in `MAX_NAV_CONFIG_CHARS`
 * (core/shared/communityNavigation.ts) — dort steht auch, warum die Grenze
 * zusätzlich im Zod-Schema steht und nicht nur hier.
 *
 * Der `system`-Layer läuft auf JEDER Instanz — diese Migration gehört überall
 * gefahren, danach `pnpm ops:schema-parity`.
 *
 * Idempotent (409 → skip).
 *
 *   pnpm migrate --app <app> --layer system
 */
import { Client, Permission, Role, TablesDB } from 'node-appwrite'

const endpoint = process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID
const databaseId = process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID

const apiKey = process.env.NUXT_APPWRITE_MIGRATIONS_KEY ?? process.env.NUXT_APPWRITE_KEY
if (!process.env.NUXT_APPWRITE_MIGRATIONS_KEY) {
  console.warn('⚠️  NUXT_APPWRITE_MIGRATIONS_KEY nicht gesetzt — Fallback auf NUXT_APPWRITE_KEY.')
}
if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error('Fehlende Env-Vars — über den Runner aufrufen: pnpm migrate --app <app>')
  process.exit(1)
}

const db = databaseId
const tablesDB = new TablesDB(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey))

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

async function waitForColumns(tableId: string) {
  for (let i = 0; i < 60; i++) {
    const { columns } = await tablesDB.listColumns({ databaseId: db, tableId })
    if (columns.length > 0 && columns.every(column => column.status === 'available')) return
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  throw new Error(`Columns von "${tableId}" wurden nicht verfügbar`)
}

console.log(`Migration system-033 gegen ${endpoint} / Projekt ${projectId} / DB ${databaseId}`)

await step('Table community_navigation', () => tablesDB.createTable({
  databaseId: db,
  tableId: 'community_navigation',
  name: 'Community Navigation (Menü)',
  // read: any → dieselbe Begründung wie community_branding (s. Kopf).
  // Kein write: geschrieben wird nur mit dem Server-Key.
  permissions: [Permission.read(Role.any())],
  rowSecurity: false,
}))

// `config` = das serialisierte Override-Dokument ({ entries: [...] }).
// '' ist ein gültiger Wert und heisst „keine eigene Wahl" — deshalb nicht
// required. Der Leser (parseCommunityNavOverride) macht daraus `null` und das
// Menü sieht aus wie vor U15.
await step('Column community_navigation.config', () => tablesDB.createVarcharColumn({
  databaseId: db, tableId: 'community_navigation', key: 'config', size: 8192, required: false, xdefault: '',
}))

await waitForColumns('community_navigation')

console.log('✔ Migration system-033 fertig')
