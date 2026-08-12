/**
 * DIE WACHE VOR ALLEN ANDEREN: ein fehlgeformter Host-Header endet hier.
 *
 * WARUM ES SIE GIBT (gemessen 2026-08-09 an einem PROD-BUILD der
 * portfolio-App): `Host: evil.tld"><x>` ließ `getRequestURL()` mit
 * `TypeError: Invalid URL` werfen — der Stacktrace zeigte auf
 * `05.rate-limit.ts`, die die URL als erste und ungeschützt liest. Damit
 * antwortete JEDE Route JEDER App mit 500. Die Regel selbst ist pure und
 * steht mit ihrer Begründung in `shared/requestHost.ts`; hier kommt nur das
 * Auslesen des Headers dazu.
 *
 * ── WARUM SO FRÜH ──────────────────────────────────────────────────────────
 * Der Host wird an vielen Stellen gelesen — `05.rate-limit.ts`,
 * `03.csrf-origin.ts`, `08.trailing-slash.ts`, der Plugin-Hook
 * `render:response` (frame-ancestors), dazu Routen wie
 * `/api/auth/oauth`. Fünf try/catch wären fünf Orte, an denen die nächste
 * neue Zeile es wieder vergisst; die sechste Stelle schreibt jemand nächsten
 * Monat. EINE Wache am Eingang macht die Annahme „ab hier ist der Host
 * URL-tauglich" für alles dahinter wahr — Middleware, Routen, Plugins und
 * jeden Layer, der auf core aufsetzt.
 *
 * ── WARUM 400 UND NICHT 404 ────────────────────────────────────────────────
 * 404 ist die Antwort auf einen wohlgeformten, aber UNBEKANNTEN Host
 * (`00.tenant.ts`, `UNKNOWN_HOST_STATUS_TEXT`) — sie verrät bewusst nicht, ob
 * es die Adresse gibt. Hier ist die Lage eine andere: der Request ist
 * syntaktisch kaputt, noch bevor irgendeine Zugehörigkeit geprüft werden
 * könnte. Das ist ein Client-Fehler, und 400 sagt genau das — ohne etwas über
 * die Installation preiszugeben. Ein 404 wäre hier zusätzlich irreführend,
 * weil er suggeriert, ein anderer Host WÄRE gefunden worden.
 *
 * ── ZWEI DINGE, DIE MAN NICHT „VEREINFACHEN" DARF ──────────────────────────
 *
 * (1) **Ein FEHLENDER Header ist kein fehlgeformter.** h3 fällt ohne
 *     `host` auf `localhost` zurück, und genau davon lebt der INTERNE
 *     self-fetch von nuxt-i18n im Prod-Build (`/_i18n/…`, ohne Host-Header —
 *     Prod-Befund 2026-07-23, s. `00.tenant.ts`). Würde die Wache das
 *     abweisen, renderte jede Seite mit rohen i18n-Schlüsseln. Deshalb: leer
 *     oder nicht gesetzt ⇒ durchlassen. Die pure Funktion bleibt trotzdem
 *     streng (`'' ⇒ false`) — die Unterscheidung gehört zum Request, nicht
 *     zur Rechnung.
 *
 * (2) **Sie prüft die FORM, nicht die ZUGEHÖRIGKEIT.** `pukalani.studio` auf
 *     einem portfolio-Server kommt hier durch und wird erst weiter hinten
 *     beurteilt (Mandanten-Resolver, nginx). Eine Wache, die hier schon
 *     „gehört nicht hierher" sagt, wäre eine zweite, blindere Kopie der
 *     Host-Autorisierung — mit dem falschen Statuscode aus der falschen
 *     Schicht.
 *
 * DER DATEINAME TRÄGT DIE REIHENFOLGE: Nitro sortiert die Middleware eines
 * Layers alphabetisch nach Dateinamen. `00.host-header.ts` steht damit vor
 * `00.tenant.ts` — und muss dort bleiben. Genagelt in
 * `tests/requestHost.test.ts` („läuft als erste Middleware").
 */
// shared/*.ts wird im server-Verzeichnis NICHT auto-importiert (nur
// shared/utils + shared/types) — deshalb explizit.
import { isValidForwardedHostHeader, isValidHostHeader } from '../../shared/requestHost'

export default defineEventHandler((event) => {
  const host = getHeader(event, 'host')
  const forwardedHost = getHeader(event, 'x-forwarded-host')

  /**
   * ZWEI HEADER, EINE FRAGE — nachgemessen am Prod-Build (2026-08-10).
   *
   * `X-Forwarded-Host` ist hier kein Nachtrag aus Gründlichkeit, sondern der
   * zweite Weg zu genau demselben 500er: `getRequestURL(event,
   * { xForwardedHost: true })` nimmt DIESEN Header zuerst, und zwei Stellen
   * tun das — @nuxtjs/i18n beim Aufbau seines Server-Kontexts (im
   * Nitro-`request`-Hook, dessen Fehler still verschluckt werden) und Nitros
   * eigener Fehler-Handler. Gemessen mit gültigem `Host:` und
   * `X-Forwarded-Host: evil.tld"><x>`: **500 auf `/`, auf `/gibtsnicht` und
   * auf jeder API-Route**, dazu ein Stacktrace je Request im Log. Eine Wache,
   * die nur `host` prüft, lässt also genau den Befund offen, den sie
   * schließen soll.
   */
  const hostMalformed = host ? !isValidHostHeader(host) : false
  const forwardedMalformed = forwardedHost ? !isValidForwardedHostHeader(forwardedHost) : false
  if (!hostMalformed && !forwardedMalformed) return

  /**
   * DER KAPUTTE HEADER FLIEGT RAUS, BEVOR GEWORFEN WIRD — und das ist keine
   * Kosmetik.
   *
   * Nitros eigener Fehler-Handler baut die Request-URL noch einmal
   * (`defaultHandler` ⇒ `getRequestURL(event, { xForwardedHost: true })`), um
   * sie in Log-Zeile und Antwortkörper zu schreiben. Mit dem kaputten Wert
   * wirft genau das ein zweites Mal; Nitro fängt es zwar ab (die Antwort
   * bleibt 400), schreibt aber pro Request einen vollen Stacktrace ins Log.
   * Ein Fremder hätte damit weiterhin einen Einzeiler, um die Logs zu
   * fluten — dieselbe Sorte Ärger wie der 500er, nur eine Etage tiefer.
   *
   * Entfernt wird NUR, was durchgefallen ist: bleibt ein gültiger `Host:`
   * stehen, steht in der Log-Zeile weiter die echte Adresse statt eines
   * nichtssagenden `localhost`. Ohne beide fällt h3 auf `localhost` zurück
   * (derselbe dokumentierte Rückfall, von dem der interne i18n-self-fetch
   * lebt) — der Fehlerpfad rechnet also sauber zu Ende. Verloren geht nichts:
   * der Wert ist bereits als unbrauchbar beurteilt, und der Request endet
   * hier.
   */
  if (hostMalformed) delete event.node.req.headers.host
  if (forwardedMalformed) delete event.node.req.headers['x-forwarded-host']

  throw createError({ status: 400, statusText: 'Invalid host header' })
})
