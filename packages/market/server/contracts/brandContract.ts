/**
 * DER VERTRAG ZUM brand-LAYER — die EINZIGE Stelle im market-Layer, die über
 * die Paketgrenze greift (CONCEPT A14, Plan §2.1 + Davids Entscheidung 1 und 7
 * in §6: „eigener Layer mit explizitem Vertrag", „der Abruf-Vertrag bleibt in
 * brand, wird explizit exportiert, market importiert").
 *
 * ── WARUM SIE IN `server/contracts/` LIEGT UND NICHT IN `server/utils/` ───
 * Nitro AUTO-IMPORTIERT `server/utils` — jeder Name daraus steht in jeder
 * Server-Datei der App zur Verfügung. Läge diese Datei dort, wären ihre
 * Re-Exporte (`loadOwnedProfile`, `fetchBrandSite`, …) plötzlich ZWEIMAL im
 * Auto-Import: einmal aus `packages/brand/server/utils`, einmal von hier.
 * Nitro meldet das („Duplicated imports") und entscheidet zugunsten des
 * SPÄTEREN Layers — der brand-Layer riefe seine eigenen Funktionen dann über
 * den Umweg dieses Vertrags auf. Heute zeigen beide Namen auf dasselbe, aber
 * eine Schattierung, die niemand beabsichtigt hat, ist genau die Sorte
 * Kopplung, die dieser Vertrag verhindern soll. `server/contracts` wird nicht
 * gescannt: wer hier etwas will, importiert es ausdrücklich.
 *
 * ── WARUM EINE DATEI UND NICHT ZWANZIG IMPORTE ────────────────────────────
 * Nitros Auto-Import endet an der Layer-Grenze: `fetchBrandSite` ist in
 * market-Code NICHT einfach da. Der technisch mögliche Weg wäre, überall dort
 * relativ zu springen, wo man etwas braucht — und dann ist die Kopplung
 * WIEDER implizit, nur eben verteilt auf zwanzig Dateien, und niemand kann
 * mehr in einem Blick sagen, was market von brand erwartet. Diese Datei IST
 * die Antwort auf diese Frage: was hier nicht steht, benutzt market nicht.
 * Jeder spätere market-Server-Code importiert AUSSCHLIESSLICH von hier.
 *
 * ── RELATIVE PFADE ÜBER DIE PAKETGRENZE FUNKTIONIEREN ─────────────────────
 * Nachgeprüft und im Repo längst üblich: `packages/admin/server/utils/
 * userStatsCache.ts` zieht `createMicrocache` per `../../../core/server/utils/
 * microcache` — Nitro bündelt die Datei mit, weil sie über den Dateipfad
 * aufgelöst wird und nicht über die `node_modules`-Auflösung des Pakets. Die
 * ESLint-Sperre gegen Cross-Layer-Importe (`pukalani/no-cross-layer-relative`)
 * kennt dafür einen benannten Block für `packages/market/**` — eine
 * AUSNAHME MIT NAMEN statt einer stillen Lücke, wie feedback ↔ control.
 *
 * ── WAS HIER BEWUSST NICHT STEHT ──────────────────────────────────────────
 * Der Befund-SCHREIBER (`writeBrandFindings`) und die Extraktions-Naht kommen
 * mit M3, wenn es Befunde zu schreiben gibt; ein Re-Export, hinter dem noch
 * kein Aufrufer steht, wäre eine Abhängigkeit ohne Gegenleistung. Ebenso
 * fehlt jeder Zugriff auf `brand_steps`/`brand_messages`: market liest die
 * eigene Foundation über die BESTÄTIGTEN Werte des Profils, nicht über die
 * Gesprächsverläufe — die gehen es nichts an.
 */

// ── Der SSRF-feste Abruf (§2.7, Davids Entscheidung 7) ──────────────────────
// EINE Wahrheit über „welche Adresse darf der Server überhaupt holen".
// Ein zweiter SSRF-Schutz im market-Layer wäre der Fehler, gegen den §4 warnt
// („sonst gibt es zwei SSRF-Schutze, die auseinanderlaufen"). Die
// Mehrseiten-/Sitemap-/llms.txt-Erweiterung aus §7.4 wird deshalb in M2 HIER
// gebaut — im brand-Layer, abgestimmt mit der Brand-Check-Sitzung — und nicht
// daneben.
export { BrandSiteFetchError, fetchBrandSite } from '../../../brand/server/utils/brandSiteFetch'
export type { BrandSiteFetchResult } from '../../../brand/server/utils/brandSiteFetch'

// ── Besitz: „gehört dieses Branding dem Aufrufer?" ─────────────────────────
// `market` hat KEINE eigene Autorisierung und soll auch keine bekommen: alle
// market_*-Tabellen sind server-only (Permissions `[]`), die einzige Grenze
// zwischen zwei Konten ist dieselbe wie im brand-Layer. `loadOwnedProfile`
// wirft 404 (nicht 403) auf ein fremdes Profil — ein 403 bestätigte dessen
// Existenz. Jede spätere market-Route ruft es, BEVOR sie irgendetwas tut.
// `listOwnedBrandProfileIds` ist die zweite Hälfte davon und für den
// GDPR-Contributor gebaut: keine market_*-Zeile trägt eine `userId`, die Frage
// „was gehört diesem Konto?" läuft deshalb über die Brandings (Begründung in
// `marketUserData.ts`). Sie ist die EINZIGE Ergänzung, die M1 im brand-Layer
// gebraucht hat.
export { listOwnedBrandProfileIds, loadOwnedProfile, requireProfileIdParam } from '../../../brand/server/utils/brandStore'
export type { BrandProfileRow } from '../../../brand/server/utils/brandStore'

// ── Die Kaskade: market hängt sich an das Löschen eines Brandings ──────────
export { registerBrandProfileCascade } from '../../../brand/server/utils/brandProfileCascade'
export type { BrandProfileCascade } from '../../../brand/server/utils/brandProfileCascade'

// ── Die Slot-Registry: die Adressen der EIGENEN Felder ─────────────────────
// PURE Funktionen und Typen, kein Datenzugriff. `slotById` beantwortet die
// eine Frage, die `MARKET_FIELDS` stellt: „gibt es dieses eigene Feld
// überhaupt, und ist es noch aktiv?" (§2.2, geprüft im Test). `BRAND_SLOTS`
// ist der Katalog dahinter — er wird für die Beschriftung und für die
// Gegenprobe im Test gebraucht.
export { BRAND_SLOTS, slotById } from '../../../brand/shared/slotRegistry'
export type { BrandSlot } from '../../../brand/shared/slotRegistry'
