import { Query } from 'node-appwrite'
import { COMMUNITIES_TABLE, type TenantRow } from '../../../shared/types/tenantRecord'
import { parseSiteProfile, type SiteProfile } from '../../../shared/onboarding'
import { tallyMarketSignal, type MarketSignalReport } from '../../../shared/marketSignal'

/**
 * BETREIBER: DAS MARKT-SIGNAL AUSWERTEN (U19).
 *
 * Der LESER der Karte „Hilf uns, Pukalani zu schärfen" — Davids Entscheidung
 * vom 2026-08-12 hat ihn zur Bedingung des Baus gemacht, damit sich der
 * Wizard-Fehler („erhoben, nie gelesen") nicht wiederholt.
 *
 * KEINE eigene Tabelle, kein Aggregat-Cache: die Antworten stehen in
 * `communities.profile`, und die Zeilen sind zu zählen, nicht zu rechnen. Bei
 * ein paar hundert Communities ist das eine Abfrage und eine Schleife; ein
 * vorberechneter Zähler wäre ein zweiter Ort für dieselbe Wahrheit, der
 * irgendwann danebenliegt.
 *
 * ── WER ZÄHLT MIT ───────────────────────────────────────────────────────────
 * Alle Communities AUSSER den stillgelegten (`status: 'disabled'`, C16). Eine
 * stillgelegte Community kann nicht mehr antworten; sie im Nenner zu führen
 * liesse die Beteiligung dauerhaft sinken, ohne dass sich etwas geändert hätte.
 * Silo-Communities zählen mit: die Karte erreicht sie zwar nicht (sie ist
 * Pool-only), aber ihre Antworten aus der Zeit des alten Wizards sind echtes
 * Signal — sie stehen als „beantwortet" in derselben Spalte.
 *
 * ── LIEBER LANGSAM ALS FALSCH ───────────────────────────────────────────────
 * Die Nachbar-Route `tenants/index.get.ts` kappt bei 100 Zeilen und schreibt
 * eine Warnung ins Log. Für eine LISTE ist das vertretbar (man sieht, dass
 * etwas fehlt); für eine AUSWERTUNG wäre es ein stiller Zählfehler — die Seite
 * zeigte eine Verteilung, die eine andere ist als die Wirklichkeit. Deshalb
 * wird geblättert. Die Obergrenze ist trotzdem hart: `truncated` sagt der
 * Seite ehrlich, dass sie einen Ausschnitt zeigt, statt so zu tun als nicht.
 */
const PAGE_SIZE = 100
const MAX_PAGES = 20

export default defineEventHandler(async (event): Promise<MarketSignalReport & { truncated: boolean }> => {
  requirePermission(event, 'sites.manage')
  const config = useRuntimeConfig(event)
  const admin = createAdminClient(event)

  const profiles: SiteProfile[] = []
  let page = 0

  while (page < MAX_PAGES) {
    const { rows } = await admin.tablesDB.listRows<TenantRow>({
      databaseId: config.public.appwriteDatabaseId,
      tableId: COMMUNITIES_TABLE,
      // Stabile Sortierung: ohne sie kann dieselbe Zeile über zwei Seiten
      // hinweg zweimal oder gar nicht auftauchen.
      queries: [Query.orderAsc('$id'), Query.limit(PAGE_SIZE), Query.offset(page * PAGE_SIZE)],
    }).catch((error) => { throw toH3Error(error, 'Could not read market signal') })

    for (const row of rows) {
      if (row.status === 'disabled') continue
      profiles.push(parseSiteProfile(row.profile))
    }

    page += 1
    if (rows.length < PAGE_SIZE) {
      return { ...tallyMarketSignal(profiles), truncated: false }
    }
  }

  console.warn(`[control] Markt-Signal gekappt bei ${MAX_PAGES * PAGE_SIZE} Communities — Auswertung blättern`)
  return { ...tallyMarketSignal(profiles), truncated: true }
})
