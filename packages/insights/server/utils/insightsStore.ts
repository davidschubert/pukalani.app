import type { H3Event } from 'h3'
import { AppwriteException } from 'node-appwrite'

/**
 * DER LESE-/SCHREIB-UNTERBAU DES insights-LAYERS (Muster: `marketStore.ts`,
 * `brandStore.ts`).
 *
 * STAND I1: nur die GRUNDZUGRIFFE — der Client, die Database-Id und die
 * Fehler-Frage „gibt es das nicht?". Es gibt noch KEINE Route, die sie ruft;
 * die kommen mit I2 (Redaktion) und I3 (öffentliche Seiten). Das ist Absicht
 * und dieselbe Reihenfolge wie im market-Layer: der Zugriffsweg soll
 * feststehen, BEVOR die erste Route ihn benutzt — sonst schreibt jede Route
 * ihren eigenen.
 *
 * ── KEIN `tenantDb`, UND DAS IST KEINE ABKÜRZUNG ─────────────────────────
 * Dieselbe Lage wie in `brand` und `market`: der Layer läuft ausschliesslich
 * auf der Single-Tenant-Instanz `branding`, seine drei Tabellen tragen kein
 * `communityId`, und der ESLint-Backstop gegen rohes `.tablesDB` gilt den
 * GEPOOLTEN Layern (CLAUDE.md, „Eine Datentür"). Die Begründung steht
 * ausserdem im ESLint-Block dieses Layers, damit die Entscheidung dort
 * nachlesbar ist, wo jemand sie später vermissen würde.
 *
 * ── WO DIE GRENZE STATTDESSEN LIEGT ──────────────────────────────────────
 * Nicht an einer Zeile, sondern am GATE: die Redaktion ist Betreiber-Sache
 * und hängt an `insights.manage` (core/shared/authz.ts, eigener Commit).
 * Alle drei Tabellen sind server-only (`permissions: []`, `rowSecurity:
 * false`) — es gibt keine Session, die dort direkt lesen könnte, und deshalb
 * auch keine Row-Permission, die im Zweifel noch abfinge. Was öffentlich
 * wird, entscheidet die LESEROUTE (I3) über `state` und
 * `translationReviewed`, nicht die Datenbank.
 *
 * ── `Query.limit()` IST IMMER EXPLIZIT ───────────────────────────────────
 * Appwrites Vorgabe ist 25; eine Liste, die still bei 25 endet, sieht aus wie
 * ein leeres Ende. Die Deckel der späteren Abfragen stehen als Konstanten
 * hier, damit sie an einer Stelle stehen und nicht in zehn Routen.
 *
 * ── WAS HIER BEWUSST NICHT STEHT ─────────────────────────────────────────
 * Die ABBILDUNG Zeile ⇄ Vertrag (`toInsightsPost`, `fromInsightsPost`, …).
 * Sie ist pur und liegt deshalb in `shared/insightsRows.ts` — nur dort lässt
 * sie sich in einem Vitest-Lauf ohne Nitro prüfen. Diese Datei reicht die
 * Typen weiter (unten), damit Server-Code EINE Tür hat; die Funktionen holt
 * er sich aus `shared/`.
 */

/**
 * DER NAME DIESES LAYERS in den Registries des Fundaments — heute der
 * GDPR-Contributor (core), morgen alles Weitere. Einmal, weil zwei getippte
 * Zeichenketten in zwei Registries irgendwann auseinanderlaufen und der
 * Unterschied dann nur in einer Log-Zeile sichtbar wäre.
 */
export const INSIGHTS_LAYER_ID = 'insights'

/**
 * Die Tabellennamen — durchgereicht aus `shared/insightsRows.ts`.
 *
 * Die WAHRHEIT steht dort, weil auch die Migrationen sie brauchen und die
 * kein Nitro haben. Hier stehen sie als Re-Export, damit Server-Code nicht
 * zwei Importpfade für dieselbe Sache führen muss.
 */
export {
  INSIGHTS_BRANDS_TABLE,
  INSIGHTS_CORRECTIONS_TABLE,
  INSIGHTS_POSTS_TABLE,
} from '../../shared/insightsRows'
export type {
  InsightsBrandRow,
  InsightsBrandRowData,
  InsightsCorrectionRow,
  InsightsCorrectionRowData,
  InsightsPostRow,
  InsightsPostRowData,
} from '../../shared/insightsRows'

/** Wie viele Beiträge die Redaktionsliste höchstens zeigt (I2). */
export const INSIGHTS_POSTS_LIMIT = 200
/** Wie viele Markenprofile die Redaktionsliste höchstens zeigt (I2). */
export const INSIGHTS_BRANDS_LIMIT = 200
/** Wie viele Korrekturvorschläge die Arbeitsliste höchstens zeigt (I3). */
export const INSIGHTS_CORRECTIONS_LIMIT = 200

/** Der Admin-Client + die Database-Id des Requests — EIN Aufruf statt zwei. */
export function insightsDb(event: H3Event) {
  const databaseId = useRuntimeConfig(event).public.appwriteDatabaseId
  const { tablesDB } = createAdminClient(event)
  return { tablesDB, databaseId }
}

/**
 * „Die Zeile (oder die Tabelle) gibt es nicht."
 *
 * Der brand-Layer hat dieselbe Prüfung als `isAppwriteNotFound`, der
 * market-Layer als `isMarketRowMissing` — sie heisst hier ABSICHTLICH wieder
 * anders. Alle drei `server/utils` werden von Nitro auto-importiert; zwei
 * gleichnamige Exporte wären eine „Duplicated imports"-Meldung und, schlimmer,
 * eine stille Schattierung: ein fremder Layer bekäme unsere Fassung
 * untergeschoben. Ein Name, der nicht kollidieren kann, ist billiger als die
 * Regel, das nicht zu vergessen.
 */
export function isInsightsRowMissing(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 404
}
