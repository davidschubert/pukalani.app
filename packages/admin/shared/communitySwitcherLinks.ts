import { communityOrigin } from '../../core/shared/notificationLinks'

/**
 * DIE ZWEI AUSGÄNGE DES COMMUNITY-SWITCHERS (F50, 2026-08-07) — als pure Regel.
 *
 * Unter der Community-Liste stehen zwei Einträge, die BEIDE den Host verlassen:
 * „Community anlegen" führt in den Wizard, „Communities verwalten" in den
 * Kundenbereich. Sie können keine `localePath()`-Pfade sein — das Dashboard
 * läuft auf `kunde-a.pukalani.app`, dort gibt es weder `/start` noch
 * `/communities` (beides Kontroll-Host-Seiten, auf Mandanten-Hosts bewusst 404).
 *
 * DIE HOSTS KOMMEN AUS DER CONFIG, nicht aus dem Code. Der ERSTE Eintrag einer
 * Liste ist der kanonische — seit AH-1 steht dort `account.pukalani.app`.
 * WELCHE Liste der Anlege-Ausgang bekommt, entscheidet der Aufrufer über
 * `resolveWizardHosts()` (core/shared/controlCenter.ts) und nicht diese Datei:
 * sie baut nur eine URL aus einer Liste und einem Pfad.
 *
 * LEER = KEIN EINTRAG. Eine App ohne konfigurierte Kontroll-Hosts (Silo,
 * Playground) bekommt keinen Menüpunkt statt eines Links auf `https:///start`.
 * Der Schalter `pukalani.chrome.communitySwitcher` schließt diesen Fall zwar
 * schon aus, aber ein Link-Bauer, der bei fehlender Eingabe Unsinn liefert,
 * ist eine Falle für den nächsten Aufrufer.
 *
 * DAS SCHEMA entscheidet `communityOrigin()` aus core (https, lokal http) —
 * bewusst dieselbe Funktion wie bei den Mail-Links (D5) und nicht eine zweite
 * Kopie derselben drei Zeilen.
 */
export function switcherExternalLink(
  hosts: readonly string[] | undefined,
  path: string,
): string {
  const host = (hosts ?? []).map(entry => entry.trim()).find(entry => entry !== '')
  if (!host) return ''
  const origin = communityOrigin(host)
  if (!origin) return ''
  return `${origin}${path}`
}
