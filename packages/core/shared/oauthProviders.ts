/**
 * „ANMELDEN MIT GOOGLE" — die puren Regeln (U14, Davids Entscheidung
 * 2026-08-10: NUR Google, kein Apple).
 *
 * Was hier steht, rechnet und entscheidet, ohne irgendetwas zu tun: kein
 * Appwrite, kein Nitro, kein Vue. Genau deshalb steht es hier — dieselbe
 * Rechnung wird an DREI Stellen gebraucht, und drei Kopien wären drei
 * Gelegenheiten, sich zu unterscheiden:
 *
 *   1. der Knopf (LoginForm/RegisterForm über `useOauthProviders()`),
 *   2. die Start-Route (`GET /api/auth/oauth`) — sie ist die AUTORITÄT,
 *   3. die Callback-Route (`GET /api/auth/oauth/callback`) fürs Ziel.
 *
 * ── ZWEI BEDINGUNGEN, NICHT EINE ──────────────────────────────────────────
 *
 * Ein Provider erscheint nur, wenn BEIDES gilt:
 *
 *   (a) die APP bietet ihn an      — `pukalani.auth.providers` (app.config),
 *   (b) die INSTANZ kann ihn       — `NUXT_PUBLIC_AUTH_OAUTH_PROVIDERS` (env).
 *
 * Warum nicht der eine Schalter, den es schon gab: die Client-Id und das
 * Geheimnis von Google liegen NICHT bei uns, sondern in der Appwrite-Console
 * (Auth → Settings → Google). Eine `app.config` ist aber Quelltext und gilt
 * für JEDE Instanz, die den Layer erbt — Dev, CI, Playground, Prod. Stünde
 * dort allein `['google']`, hätte jede dieser Instanzen einen Knopf, der ins
 * Leere führt, sobald ihr Appwrite-Projekt den Provider nicht kennt: der
 * Nutzer klickt, landet bei einem Fehler und probiert es wieder. Ein Knopf,
 * den die Instanz nicht einlösen kann, ist eine Lüge — dieselbe Regel, die
 * `instanceAuthFeatureGap` (F37) für den Code-Login gezogen hat, nur eine
 * Stufe früher: dort wird der Fehlschlag ERKLÄRT, hier gar nicht erst
 * angeboten.
 *
 * Die Env ist die zweite Hälfte, weil sie pro DEPLOYMENT gesetzt wird — genau
 * die Ebene, auf der auch das Appwrite-Projekt entschieden wird. David trägt
 * sie ein, NACHDEM er den Provider in der Console belegt hat; vorher ist sie
 * leer und es gibt keinen Knopf. Das ist die ganze Absicherung dagegen, dass
 * dieser Bau ohne Credentials gefahrlos live gehen kann.
 *
 * ── WAS HIER BEWUSST NICHT STEHT: EINE HOST-GRENZE ────────────────────────
 *
 * Die naheliegende Sorge (Circle dokumentiert sie als Einschränkung): auf der
 * EIGENEN Domain eines Kunden falle Social-Login dauerhaft aus, weil man dort
 * keinen Google-Client registrieren könne. Bei uns trifft das NICHT zu, und
 * der Grund ist die SSR-Architektur:
 *
 *   Google sieht IMMER NUR die Weiterleitungs-Adresse von APPWRITE
 *   (`<endpoint>/v1/account/sessions/oauth2/callback/google/<projekt>`),
 *   niemals einen Kunden-Host.
 *
 * Es gibt also GENAU EINEN Google-Client für die ganze Plattform, und er wird
 * einmal registriert. Was pro Host gebraucht wird, ist etwas anderes: eine
 * Appwrite-WEB-PLATFORM (Appwrite prüft `success`/`failure` gegen sie). Die
 * ist für Mandanten-Hosts vom Wildcard `*.pukalani.app` gedeckt und wird für
 * eigene Kunden-Domains bereits AUTOMATISCH angelegt — es gibt dafür sogar
 * eine eigene Statusstufe (`pending_platform`, s.
 * `packages/control/shared/customDomain.ts` + `core/server/utils/
 * appwritePlatform.ts`), eingeführt für Realtime (F45). Social-Login erbt das
 * geschenkt.
 *
 * Deshalb hat dieser Bau KEINE Host-Sonderregel: der Knopf startet dort, wo er
 * steht, und die Session landet als Cookie auf genau diesem Host. Kein Umweg
 * über einen Kontroll-Host, kein zweiter Handoff-Pfad (der bestehende
 * `sealCommunityHandoff` könnte einen NEUEN Google-Nutzer ohnehin nicht
 * tragen — er holt den Ziel-Host aus der MITGLIEDSCHAFTSLISTE, und die ist
 * beim Erstkontakt leer).
 *
 * BLEIBT ALS RISIKO nur der Übergang: steht eine eigene Domain noch in
 * `pending_platform`, weist Appwrite die `success`-URL ab. Das ist kein 500 —
 * die Start-Route fängt es ab und schickt auf die Anmeldeseite mit Grund
 * zurück (`oauth_unavailable`).
 */

/**
 * Die Provider, die der Code überhaupt kennt. `google` ist der einzige, der
 * ANGEBOTEN wird (Davids Entscheidung); `github` stand schon im Skeleton von
 * Phase 4 und bleibt, weil er nichts kostet, solange ihn niemand konfiguriert
 * — beide Bedingungen oben müssen ohnehin erfüllt sein.
 *
 * Apple fehlt BEWUSST: es verlangt ein kostenpflichtiges Developer-Programm
 * und erzwingt zusätzlich „Sign in with Apple" überall dort, wo ein anderer
 * Social-Login steht — das ist eine Produktentscheidung, keine Zeile Code.
 */
export const KNOWN_OAUTH_PROVIDERS = ['google', 'github'] as const
export type OauthProviderId = (typeof KNOWN_OAUTH_PROVIDERS)[number]

/** Der Grund, der als `reason` im Fehler-Envelope bzw. als `?error=` reist. */
export const OAUTH_UNAVAILABLE_CODE = 'oauth_unavailable'

/**
 * Das kurzlebige Cookie, in dem das Ziel nach der Anmeldung (`?redirect=`) den
 * Ausflug zum Provider überlebt. Die Rückkehr kommt von APPWRITE und trägt nur
 * `userId`+`secret` — der ursprüngliche Query-Teil ist dann längst weg.
 *
 * Cookie statt Query-Anhang an die `success`-URL: das hängt nicht davon ab, wie
 * Appwrite fremde Query-Teile anfügt, und das Ziel steht nicht in der
 * Browser-Historie. Es MUSS `sameSite: 'lax'` sein (die Rückkehr ist eine
 * seitenfremde Top-Level-Navigation, bei der `strict` nicht mitkäme) und
 * enthält bewusst nichts Geheimes — nur einen bereits mit
 * `safeRedirectTarget` geprüften Pfad auf diesem Host.
 */
export const OAUTH_REDIRECT_COOKIE = 'pukalani_oauth_to'

/** PURE: kennt der Code diesen Provider? (Tippfehler ⇒ false, nie ein Wurf) */
export function isKnownOauthProvider(value: unknown): value is OauthProviderId {
  return typeof value === 'string' && (KNOWN_OAUTH_PROVIDERS as readonly string[]).includes(value)
}

/**
 * PURE: die kommagetrennte Env-Liste lesen.
 *
 * Großschreibung und Leerzeichen verzeiht sie (`" Google , github "`), alles
 * Unbekannte fällt still weg — eine Env-Variable wird von Hand getippt, und
 * ein Tippfehler soll einen Server nicht am Start hindern, sondern nur den
 * einen Knopf nicht zeigen.
 */
export function parseOauthProviderList(raw: unknown): OauthProviderId[] {
  if (typeof raw !== 'string') return []
  const seen = new Set<OauthProviderId>()
  for (const part of raw.split(',')) {
    const id = part.trim().toLowerCase()
    if (isKnownOauthProvider(id)) seen.add(id)
  }
  return [...seen]
}

/**
 * PURE: welche Provider erscheinen wirklich? = Schnittmenge aus (a) und (b).
 *
 * Die REIHENFOLGE kommt aus der App-Config, nicht aus der Env: die Config ist
 * die gestaltete Seite (dort entscheidet jemand, was zuerst steht), die Env
 * ist Betrieb.
 */
export function resolveOauthProviders(
  configured: readonly string[] | null | undefined,
  envRaw: unknown,
): OauthProviderId[] {
  const enabled = new Set(parseOauthProviderList(envRaw))
  const result: OauthProviderId[] = []
  for (const raw of configured ?? []) {
    const id = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
    if (isKnownOauthProvider(id) && enabled.has(id) && !result.includes(id)) result.push(id)
  }
  return result
}

/**
 * PURE: darf DIESER Provider gerade starten? Die Frage der Start-Route.
 *
 * Bewusst dieselbe Rechnung wie für den Knopf — die Route glaubt dem Klick
 * nichts. Wer `/api/auth/oauth?provider=github` von Hand aufruft, obwohl nur
 * `google` angeboten ist, bekommt dasselbe „gibt es hier nicht" wie ein
 * unbekannter Pfad.
 */
export function oauthProviderAllowed(
  provider: unknown,
  configured: readonly string[] | null | undefined,
  envRaw: unknown,
): provider is OauthProviderId {
  return isKnownOauthProvider(provider) && resolveOauthProviders(configured, envRaw).includes(provider)
}

/**
 * PURE: der Locale-Prefix für eine Adresse, die der SERVER baut.
 *
 * Server-seitig gibt es kein `localePath()`, der externe Provider-Callback
 * würde einen DE-Nutzer sonst immer auf die EN-Wurzel werfen. Strategie
 * `prefix_except_default`: `en` ist der Default und hat keinen Prefix.
 *
 * Die Locale kommt aus dem `i18n_redirected`-Cookie und ist damit EINGABE —
 * deshalb wird sie hier gegen ein Format geprüft und nicht bloß eingesetzt.
 * Ohne diese Prüfung stünde ein fremder Cookie-Wert in einer `Location`-
 * Kopfzeile; `encodeURIComponent` allein deckt zwar Steuerzeichen ab, ließe
 * aber weiterhin sinnlose Umleitungen zu.
 */
export function oauthLocalePrefix(locale: unknown): string {
  if (typeof locale !== 'string') return ''
  const value = locale.trim()
  if (!value || value === 'en') return ''
  if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(value)) return ''
  return `/${value}`
}

/**
 * PURE: wohin nach einem Fehlschlag? Immer die Anmeldeseite DIESER Sprache,
 * mit einem Grund, den die Seite anzeigen kann.
 *
 * Ein Grund und kein roher Fehlertext: was Appwrite meldet („provider
 * disabled", „invalid success url"), geht den Betreiber etwas an und steht im
 * Server-Log — dem Gast sagt es nichts und verrät nur Innenleben.
 */
export function oauthFailureTarget(locale: unknown): string {
  return `${oauthLocalePrefix(locale)}/login?error=${OAUTH_UNAVAILABLE_CODE}`
}
