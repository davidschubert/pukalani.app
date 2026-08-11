/**
 * ABGESCHALTETE KONTROLL-HOSTS — die 301 auf den heutigen Namen (AH-1,
 * Davids Entscheidung 2026-08-11).
 *
 * Der Kundenbereich hieß bis zum Cutover `my.pukalani.app`, der Kurz-Link in
 * den Wizard `start.pukalani.app`; beides ist jetzt `account.pukalani.app`.
 * Ohne diese Regel wären die zwei Namen genau das, was jeder andere unbekannte
 * Host ist: 404 (`00.tenant.ts`). Das wäre für einen Tippfehler richtig und
 * für einen VERSCHICKTEN Link falsch — eine Einladungs-Mail trägt ihren
 * `?code=` sieben Tage lang, und in Bios, Chats und Lesezeichen steht der alte
 * Name unbefristet.
 *
 * DESHALB PFAD UND QUERY UNVERÄNDERT: die Weiterleitung ist eine
 * Adressänderung, keine Umleitung auf eine Startseite. Wer `?code=…` anklickt,
 * muss drüben im Wizard landen und nicht in einer leeren Übersicht.
 *
 * DAS ZIEL KOMMT AUS DER CONFIG, NIE VOM REQUEST (`controlHosts[0]`) — sonst
 * schriebe ein präparierter Header das Ziel der Weiterleitung.
 *
 * SCHLEIFEN-SPERRE: steht der Ziel-Host selbst in der Alt-Liste (Tippfehler in
 * einer Env), gibt es KEINE Weiterleitung. Ein 404 ist unangenehm, eine
 * Endlosschleife auf dem Kundenbereich ist ein Ausfall.
 */
import { communityOrigin } from './notificationLinks'

/** Host-Header → vergleichbarer Hostname (ohne Port, klein, getrimmt). */
function normalizeHost(raw: string | undefined | null): string {
  return (raw || '').trim().toLowerCase().split(':')[0] ?? ''
}

/**
 * Die absolute Ziel-URL, oder `null` (dann passiert nichts und der Request
 * läuft weiter wie bisher).
 *
 * `pathWithQuery` ist `event.path` — bei h3 ist das Pfad UND Query, also genau
 * das, was unverändert mitreisen soll.
 */
export function legacyControlRedirect(
  host: string | undefined | null,
  pathWithQuery: string,
  legacyHosts: readonly string[],
  targetHost: string,
): string | null {
  const target = normalizeHost(targetHost)
  if (!target) return null

  const legacy = legacyHosts.map(entry => normalizeHost(entry)).filter(Boolean)
  if (legacy.includes(target)) return null

  const from = normalizeHost(host)
  if (!from || !legacy.includes(from)) return null

  const origin = communityOrigin(target)
  if (!origin) return null

  // Ein Pfad ohne führenden Schrägstrich käme aus keiner echten Anfrage, würde
  // aber `https://account.pukalani.applogin` ergeben — lieber eine Zeile mehr.
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`
  return `${origin}${path}`
}
