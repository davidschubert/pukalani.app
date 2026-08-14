/**
 * WEITERLEITUNGEN EINER COMMUNITY (U15 Teil 3, Davids Entscheidung vom
 * 2026-08-13) — der Vertrag und die EINE Auflösungsregel.
 *
 * Bis hierher endete jede umbenannte Seite in einer 404. Der Owner konnte seine
 * CMS-Seite `/ueber-uns` nach `/team` verschieben — und jeder Link, den jemand
 * gesetzt, gespeichert oder gedruckt hatte, war danach tot. Das trifft genau
 * die Communities, die schon etwas aufgebaut haben: wer nie umbenennt, hat auch
 * keine alten Adressen.
 *
 * Davids Zuschnitt, und nur der: **alte Adresse ⇒ neue Adresse**, exakt, Ziel
 * intern (ein Pfad auf demselben Host) oder extern (https). Bewusst NICHT:
 * Platzhalter/Wildcards, reguläre Ausdrücke, Ketten-Auflösung, Statistik über
 * Treffer, je Sprache eigene Regeln.
 *
 * ── EXAKT, UND ZWAR ABSICHTLICH ───────────────────────────────────────────
 * Eine Regel trifft GENAU einen Pfad. Kein `/blog/*`, kein `(.*)`, keine
 * Gruppen-Ersetzung. Der Grund ist nicht Bequemlichkeit, sondern die Stelle, an
 * der das hier läuft: die Regel wird bei JEDEM Seitenaufruf jeder Community
 * gegen den Pfad gehalten. Ein Muster-Vergleich wäre damit ein vom Kunden
 * geschriebener Ausdruck im heißesten Pfad des Servers — und reguläre Ausdrücke
 * aus Kundenhand sind der klassische Weg, einen Prozess mit einer einzigen
 * Anfrage lahmzulegen. Ein `Map.get()` kann das nicht. Wer 200 Seiten umzieht,
 * braucht 200 Zeilen; das ist der Preis, und er ist bezahlbar.
 *
 * ── EINE REGEL GILT FÜR BEIDE SPRACHEN ────────────────────────────────────
 * Gespeichert wird der Pfad OHNE Sprach-Präfix (`/ueber-uns`), und er fängt
 * `/ueber-uns` wie `/de/ueber-uns`. Bei einem INTERNEN Ziel wandert das Präfix
 * mit (`/de/ueber-uns` ⇒ `/de/team`) — sonst würfe die Weiterleitung den Leser
 * beim Klick in die andere Sprache, genau der Fehler, den `classifyContentLink`
 * für Inhalts-Links behoben hat (Audit-Befund S3). Bei einem EXTERNEN Ziel gibt
 * es nichts mitzunehmen: die fremde Seite kennt unsere Sprach-Präfixe nicht.
 *
 * Eine Regel, die selbst ein Präfix trägt (`/de/alt`), bleibt trotzdem möglich
 * und gewinnt — der exakte Treffer wird ZUERST gesucht. Das ist der Ausweg für
 * den Fall, dass nur die deutsche Adresse umgezogen ist.
 *
 * ── WARUM DIE REGEL HIER IN core LIEGT ────────────────────────────────────
 * Weil ihr ANWENDER hier liegt: die Server-Middleware, die den Pfad umlenkt,
 * bevor irgendetwas gerendert wird (`core/server/middleware/
 * 01.community-redirect.ts`). Der SCHREIBER lebt im pages-Layer, dem die
 * „Website"-Gruppe gehört; beide dürfen nach core greifen, keiner muss den
 * anderen kennen (A14) — dieselbe Aufteilung wie bei `communityNavigation.ts`
 * (Teil 1) und `communitySeo.ts` (Teil 2).
 */

/** Appwrite-Table (system-035) — EINE Row je Community, rowId = communities.$id. */
export const COMMUNITY_REDIRECTS_TABLE = 'community_redirects'

/**
 * Obergrenzen — sie stehen hier, damit Schema (schreiben) und Regel (lesen)
 * dieselben Zahlen lesen.
 *
 * ── DAS ZEILENBUDGET, NACHGERECHNET STATT GERATEN ─────────────────────────
 * 100 Regeln × (256 Quelle + 512 Ziel + ~40 Zeichen JSON-Gerüst) sind rund
 * **81.000 Zeichen**. Eine varchar-Spalte endet bei MariaDB/utf8mb4 bei 16.381
 * Zeichen, das serialisierte Dokument passt also um den Faktor fünf NICHT
 * hinein — anders als beim Menü (Teil 1), wo 8192 Zeichen mit einer Grenze auf
 * das serialisierte Dokument gereicht haben. Und die Grenze zu senken, bis es
 * passt, hieße: rund 20 Regeln. Das ist genau die Community nicht, für die
 * dieses Werkzeug gebaut ist.
 *
 * Deshalb **MEDIUMTEXT** (`createMediumtextColumn`, dasselbe Muster wie
 * `pages.body` seit pages-002): off-row gespeichert, kein Zeilenbudget. Der
 * Preis ist eine Spalte außerhalb der Zeile für ein Dokument von typisch
 * wenigen Kilobyte — bezahlbar, weil sie GENAU EINMAL je Community existiert
 * und je Seitenaufbau höchstens einmal in 30 Sekunden gelesen wird.
 *
 * MEDIUMTEXT trägt 16 MB. `MAX_REDIRECT_CONFIG_CHARS` ist trotzdem gesetzt und
 * liegt bewusst KNAPP über dem, was 100 Regeln maximal brauchen: eine Spalte
 * ohne Grenze ist eine Einladung, sie als Ablage zu benutzen, und ein Dokument,
 * das der Server bei jedem Aufbau parst, gehört gedeckelt. Geprüft wird die
 * Zahl im Zod-Schema — eine Grenze, die niemand prüft, ist ein Fehler, der erst
 * beim Kunden auftritt.
 */
export const MAX_REDIRECT_RULES = 100
export const MAX_REDIRECT_FROM = 256
export const MAX_REDIRECT_TO = 512
export const MAX_REDIRECT_CONFIG_CHARS = 100_000

/**
 * INTERN 301, EXTERN 302 — und das ist eine Entscheidung, keine Konvention.
 *
 * `301 Moved Permanently` sagt der Suchmaschine: übertrage alles, was du über
 * die alte Adresse weißt, auf die neue. Genau das will ein interner Umzug —
 * die Seite ist dieselbe, sie steht nur woanders, und der Ruf, den sie sich
 * erarbeitet hat, soll mitkommen. Browser und Zwischenspeicher dürfen ein 301
 * dauerhaft merken; das ist hier erwünscht und macht die Weiterleitung billig.
 *
 * `302 Found` bei einem externen Ziel, aus zwei Gründen. Erstens ist ein
 * fremdes Ziel nichts, was diese Community dauerhaft zusagen kann: der Owner
 * verlinkt heute auf einen Anbieter und morgen auf einen anderen, und ein
 * gemerktes 301 überlebt jede Korrektur — in Browsern, die es sich gemerkt
 * haben, ist die alte Weiterleitung dann NICHT mehr abstellbar. Zweitens soll
 * kein fremder Server das Such-Ansehen einer Adresse erben, die dieser
 * Community gehört; ein 301 auf `example.com` verschenkt genau das.
 */
export const INTERNAL_REDIRECT_STATUS = 301
export const EXTERNAL_REDIRECT_STATUS = 302

/**
 * Pfade, die das SYSTEM besitzt — als Quelle einer Weiterleitung gesperrt.
 *
 * ── WARUM EINE SPERRLISTE UND KEINE ERLAUBNISLISTE ────────────────────────
 * Eine Erlaubnisliste ist hier nicht bloß unbequem, sie ist unmöglich: die
 * Quelle einer Weiterleitung ist per Definition eine Adresse, die es NICHT
 * mehr gibt. Es gibt also nichts, wogegen man sie halten könnte — jede
 * Erlaubnisliste müsste die Menge aller je vergebenen Adressen sein.
 * Fail-closed ist die Prüfung trotzdem, nur eine Ebene tiefer: die FORM des
 * Pfads geht über eine Zeichen-Erlaubnisliste (`isSafeRedirectSource` unten),
 * und erst darauf legt sich diese Sperrliste.
 *
 * ── WAS DRIN STEHT, UND WAS BEWUSST NICHT ─────────────────────────────────
 * DRIN: was den Betrieb bricht oder einen Vertrauensbruch ermöglicht.
 *  - `/api`, `/_` — Server-Routen und Nuxt-Interna. Die Middleware fasst sie
 *    ohnehin nicht an; die Zeile hier verhindert, dass jemand es versucht.
 *  - `/dashboard`, `/settings`, `/account` — die Verwaltung. Eine
 *    Weiterleitung von dort sperrt den Owner aus seiner eigenen Community aus,
 *    und zwar über genau die Fläche, auf der er sie zurücknehmen müsste.
 *  - `/login`, `/register`, `/join`, `/verify`, `/forgot-password`,
 *    `/reset-password`, `/start` — die Anmeldung. Das ist der ernsteste
 *    Punkt: eine Weiterleitung von `/login` auf eine fremde https-Adresse ist
 *    ein Anmeldeformular, das der Besucher unter dem Namen DIESER Community
 *    aufruft. Es gibt keinen gutartigen Fall dafür.
 *  - `/embed` — die Einbettung auf fremden Seiten (E0/E4).
 *  - `/og`, `/robots.txt`, `/sitemap.xml`, `/favicon.ico` — was Maschinen
 *    lesen. Eine Weiterleitung hier nimmt der Community ihr Vorschaubild oder
 *    ihre Auffindbarkeit, ohne dass ein Mensch es je sähe.
 *
 * NICHT DRIN: die Pfade der PRODUKTE (`/feed`, `/discussions`, `/events`,
 * `/courses`, `/pages`, `/profile`, `/activity`). Sie sind die Fläche der
 * Community selbst, und sie zu sperren nähme diesem Werkzeug die eine Aufgabe,
 * für die es existiert — ein Owner, der von einem Produkt auf ein anderes
 * umzieht, tut nichts Verbotenes. Wer ein Produkt nur aus dem MENÜ nehmen
 * will, tut das in Teil 1; das bricht keine Adresse.
 *
 * Verglichen wird gegen den Pfad OHNE Sprach-Präfix — sonst wäre `/de/login`
 * die offene Tür neben der geschlossenen.
 */
export const RESERVED_REDIRECT_PREFIXES: readonly string[] = [
  '/api',
  '/_',
  '/dashboard',
  '/settings',
  '/account',
  '/login',
  '/logout',
  '/register',
  '/join',
  '/start',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/embed',
  '/og',
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
]

/**
 * EINE Weiterleitung.
 *
 * NUR ADDITIV ERWEITERBAR (dieselbe Regel wie das `config`-JSON des Menüs und
 * der Custom Themes, und aus demselben Grund: es gibt kein `version`-Feld und
 * es soll keines geben). Ein neues Feld muss optional sein und einen Default
 * haben, der das Verhalten von vorher beschreibt.
 */
export interface CommunityRedirectRule {
  /** Die alte Adresse — ein Pfad, ohne Sprach-Präfix gespeichert. */
  from: string
  /** Die neue Adresse — ein Pfad ODER eine https-URL (dann `external`). */
  to: string
  /** Ziel liegt auf einem fremden Server (302 statt 301). */
  external?: boolean
}

/** Die gespeicherte Wahl. */
export interface CommunityRedirectConfig {
  rules: CommunityRedirectRule[]
}

/** Was die Middleware daraus macht. */
export interface CommunityRedirectHit {
  /** Fertiges Ziel — bei einem internen mit wieder angehängtem Sprach-Präfix. */
  to: string
  status: typeof INTERNAL_REDIRECT_STATUS | typeof EXTERNAL_REDIRECT_STATUS
  external: boolean
}

/** Der leere Zustand — „keine Weiterleitungen", identisch zu „keine Row". */
export function emptyCommunityRedirectConfig(): CommunityRedirectConfig {
  return { rules: [] }
}

/** Passt dieses Dokument in die Spalte? Der EINE Test für Schema und Route. */
export function communityRedirectConfigFits(config: CommunityRedirectConfig): boolean {
  return JSON.stringify(config).length <= MAX_REDIRECT_CONFIG_CHARS
}

/**
 * Einen Pfad auf die Form bringen, in der verglichen wird.
 *
 * ZWEI DINGE, und beide haben einen Grund:
 *
 * (1) DER SCHRÄGSTRICH AM ENDE FÄLLT WEG. `/alt` und `/alt/` sind für den
 *     Owner dieselbe Seite, und die Middleware läuft VOR
 *     `08.trailing-slash.ts` (Begründung dort: sie soll laufen, bevor
 *     Anmeldung, Rollen und Sucheintrag aufgelöst werden). Ohne diese Zeile
 *     ginge `/alt/` an der Regel vorbei — oder es kostete zwei
 *     Weiterleitungen hintereinander, wo eine reicht.
 *
 * (2) GROSS-/KLEINSCHREIBUNG BLEIBT. Ein Pfad ist zeichengenau; `/Team` und
 *     `/team` sind zwei Adressen, und welche davon einmal vergeben war, weiß
 *     nur der Owner. Ein stilles Kleinschreiben würde eine Regel auf eine
 *     Adresse anwenden, die er nie gemeint hat.
 */
export function normalizeRedirectPath(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/')) return ''
  if (trimmed === '/') return '/'
  return trimmed.replace(/\/+$/, '')
}

/**
 * Liegt dieser Pfad in einem Bereich, den das System besitzt?
 *
 * VERGLICHEN WIRD SEGMENTWEISE, nicht als Namensanfang: `/login` sperrt
 * `/login` und `/login/oauth`, aber NICHT `/logindaten` — das ist eine
 * gewöhnliche Seite und darf umziehen. Ein reiner `startsWith` hätte sie
 * mitgenommen, und der Owner hätte nie erfahren, warum.
 *
 * `/_` IST DIE AUSNAHME, UND ZWAR EINE ECHTE: Nuxts interne Pfade sind kein
 * Segment, sondern ein NAMENSRAUM am ersten Zeichen — `/_nuxt/entry.js`,
 * `/_ipx/…`, `/_i18n/…`. Segmentweise verglichen fiele keiner davon in die
 * Sperre (beim Bau am Test aufgefallen, nicht beim Nachdenken).
 */
export function isReservedRedirectPath(path: string): boolean {
  if (path.startsWith('/_')) return true
  return RESERVED_REDIRECT_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/**
 * Taugt dieser Pfad als QUELLE einer Weiterleitung?
 *
 * Fail-closed über eine ERLAUBNISLISTE von Zeichen statt einer Sperrliste von
 * Angriffen — wortgleich die Begründung aus `isSafeInternalNavTarget` (Teil 1):
 * `javascript:`, `data:` und jedes künftige Schema scheitern nicht daran, dass
 * sie namentlich verboten wären, sondern daran, dass ein Doppelpunkt gar nicht
 * erst vorkommen darf. `//host` fällt heraus, weil der Browser es als
 * protokollrelative ABSOLUTE Adresse liest.
 *
 * DIE STARTSEITE IST KEINE QUELLE. `/` weiterzuleiten hieße, die Community an
 * ihrer eigenen Vordertür wegzuschicken — mit einem externen Ziel wäre es die
 * Übernahme des Hosts, mit einem internen der sichere Weg, sich selbst
 * auszusperren (die Startseite ist der Einstieg, von dem aus man das
 * zurücknimmt). Wer eine andere Startseite will, setzt sie im CMS.
 */
export function isSafeRedirectSource(from: string): boolean {
  if (typeof from !== 'string') return false
  const path = normalizeRedirectPath(from)
  if (!path || path === '/') return false
  if (path.length > MAX_REDIRECT_FROM) return false
  if (path.startsWith('//') || path.includes('..')) return false
  if (!/^\/[A-Za-z0-9\-._~/]*$/.test(path)) return false
  return !isReservedRedirectPath(path)
}

/**
 * Ein INTERNES Ziel — ein Pfad auf demselben Host.
 *
 * Dieselbe Zeichen-Erlaubnisliste wie die Quelle, aber OHNE die Sperrliste:
 * eine Weiterleitung NACH `/login` oder `/dashboard` ist harmlos (dorthin
 * kommt man ohnehin) und mitunter genau das Richtige — eine alte
 * `/anmelden`-Adresse gehört auf `/login`. Verboten ist nur, von dort
 * WEGzuleiten.
 */
export function isSafeInternalRedirectTarget(to: string): boolean {
  if (typeof to !== 'string') return false
  const path = normalizeRedirectPath(to)
  if (!path) return false
  if (path.length > MAX_REDIRECT_TO) return false
  if (path.startsWith('//') || path.includes('..')) return false
  return /^\/[A-Za-z0-9\-._~/]*$/.test(path)
}

/**
 * Ein EXTERNES Ziel — https, sonst nichts.
 *
 * Kein http: eine Community, die ihre Besucher auf eine ungesicherte Seite
 * schickt, tut das unter IHREM Namen, und der Browser meldet die Warnung in
 * ihrem Namen. `URL` parst statt einer Regex, weil eine Regex über Adressen
 * erfahrungsgemäß die Fälle nicht kennt, die zählen (wortgleich Teil 1).
 */
export function isSafeExternalRedirectTarget(to: string): boolean {
  if (typeof to !== 'string') return false
  const trimmed = to.trim()
  if (!trimmed || trimmed.length > MAX_REDIRECT_TO) return false
  let url: URL
  try {
    url = new URL(trimmed)
  }
  catch {
    return false
  }
  return url.protocol === 'https:' && url.hostname.length > 0
}

/** Eine Regel in die Form bringen, in der sie geprüft und verglichen wird. */
export function normalizeRedirectRule(rule: CommunityRedirectRule): CommunityRedirectRule {
  const external = rule.external === true
  return {
    from: normalizeRedirectPath(rule.from),
    to: external ? rule.to.trim() : normalizeRedirectPath(rule.to),
    ...(external ? { external: true } : {}),
  }
}

/**
 * EIN ZIEL DARF NICHT SELBST QUELLE SEIN — der Schleifenschutz, und er greift
 * beim SCHREIBEN.
 *
 * ── WARUM BEIM SCHREIBEN UND NICHT BEIM LESEN ─────────────────────────────
 * Beim Lesen wird GENAU EINMAL umgeleitet: ein Treffer liefert sein Ziel, und
 * damit ist die Middleware fertig. Löste sie Ketten auf, müsste sie in einer
 * Schleife suchen — im heißesten Pfad des Servers, über ein Dokument, das der
 * Kunde schreibt. Das ist dieselbe Absage wie die an Wildcards, und sie hat
 * dieselbe Begründung.
 *
 * Die Folge ist aber, dass eine gespeicherte Kette (A⇒B, B⇒C) den Besucher
 * ZWEIMAL umleitet — der Browser holt `/A`, bekommt `/B`, holt `/B`, bekommt
 * `/C`. Das funktioniert, sieht aber wie ein Fehler aus, und aus A⇒B, B⇒A wird
 * eine ENDLOSSCHLEIFE, die der Browser nach ein paar Runden mit einer
 * Fehlerseite abbricht.
 *
 * ── DER CHECK IST DESHALB ABSICHTLICH GRÖBER ALS DAS PROBLEM ──────────────
 * Abgelehnt wird jedes Ziel, das irgendwo in derselben Liste als Quelle steht
 * — nicht nur der Ringschluss. Das verbietet auch die harmlose Kette, und
 * genau das ist gewollt: Ketten sind bei EINEM Schritt Auflösung immer eine
 * Verschlechterung (zwei Umleitungen statt einer), und die Regel „ein Ziel ist
 * nie eine Quelle" kann ein Mensch in einem Satz nachvollziehen. „Der
 * Ringschluss ist verboten, die Kette erlaubt, aber nur bis Länge zwei" kann
 * das nicht. Der Owner schreibt stattdessen A⇒C und B⇒C, und das ist auch die
 * schnellere Weiterleitung.
 *
 * Externe Ziele sind nie Quellen (eine Quelle ist immer ein Pfad) und fallen
 * deshalb heraus. Gibt es keinen Verstoß, ist die Antwort `null`.
 */
export function findRedirectChain(
  rules: readonly CommunityRedirectRule[],
): CommunityRedirectRule | null {
  const sources = new Set<string>()
  for (const rule of rules) sources.add(normalizeRedirectPath(rule.from))
  for (const rule of rules) {
    if (rule.external === true) continue
    if (sources.has(normalizeRedirectPath(rule.to))) return rule
  }
  return null
}

/**
 * Sprach-Präfix abtrennen: `/de/alt` ⇒ `['/de', '/alt']`, `/alt` ⇒ `['', '/alt']`.
 *
 * Geprüft wird gegen die KONFIGURIERTEN Sprachen und nicht gegen ein Muster
 * „zwei Kleinbuchstaben": eine Community mit einer Seite `/it/handbuch`
 * verlöre sonst still ihr erstes Segment, und die Regel dafür träfe nie.
 */
function splitLocalePrefix(path: string, localeCodes: readonly string[]): [string, string] {
  const firstSlash = path.indexOf('/', 1)
  if (firstSlash < 0) return ['', path]
  const head = path.slice(1, firstSlash)
  if (!localeCodes.some(code => code === head)) return ['', path]
  return [`/${head}`, path.slice(firstSlash)]
}

/**
 * Was aus der Spalte kommt, in die Form bringen — oder `null`.
 *
 * Der EINE Leser des gespeicherten JSON. Er wirft nie: ein kaputtes Dokument
 * heißt „keine Weiterleitungen", und die Community verhält sich wie vor U15.
 * Ein Fehler an dieser Stelle nähme ihr JEDEN Seitenaufruf — die Middleware
 * läuft vor allem anderen.
 *
 * DEFENSIV BIS ZUR EINZELNEN REGEL, obwohl beim Schreiben schon geprüft wurde:
 * das Dokument ist JSON in einer Spalte, es überlebt jede Schema-Änderung, und
 * es wurde womöglich von einer älteren Fassung dieses Codes geschrieben. Was
 * hier durchkommt, leitet einen Besucher weiter — die teuerste Sorte
 * Durchlässigkeit, die diese Fläche hat.
 */
export function parseCommunityRedirectConfig(
  raw: string | null | undefined,
): CommunityRedirectConfig | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const rules = (parsed as { rules?: unknown }).rules
    if (!Array.isArray(rules)) return null
    const clean: CommunityRedirectRule[] = []
    for (const entry of rules.slice(0, MAX_REDIRECT_RULES)) {
      if (!entry || typeof entry !== 'object') continue
      const raw = entry as Record<string, unknown>
      if (typeof raw.from !== 'string' || typeof raw.to !== 'string') continue
      const external = raw.external === true
      const rule: CommunityRedirectRule = {
        from: normalizeRedirectPath(raw.from),
        to: external ? raw.to.trim() : normalizeRedirectPath(raw.to),
        ...(external ? { external: true } : {}),
      }
      if (!isSafeRedirectSource(rule.from)) continue
      if (external ? !isSafeExternalRedirectTarget(rule.to) : !isSafeInternalRedirectTarget(rule.to)) continue
      clean.push(rule)
    }
    return { rules: clean }
  }
  catch {
    return null
  }
}

/**
 * DIE REGEL: gespeicherte Weiterleitungen + angefragter Pfad ⇒ das Ziel, oder
 * nichts.
 *
 * ── FÜNF ZUSAGEN, DIE MAN NICHT „VEREINFACHEN" DARF ───────────────────────
 *
 * (1) **KEIN TREFFER HEISST NICHTS.** `null` — und der Aufrufer macht weiter
 *     wie bisher. Das ist der Normalfall für praktisch jeden Seitenaufruf
 *     jeder Community, und er darf deshalb NICHTS kosten außer diesem einen
 *     Nachschlagen. Ein Ausbau, der beim Nichtstun etwas ändert, ist keiner.
 *
 * (2) **DER EXAKTE TREFFER GEWINNT VOR DEM SPRACH-TREFFER.** Erst wird der
 *     Pfad genommen, wie er kam (`/de/alt`), dann der ohne Präfix (`/alt`).
 *     Nur so bleibt „nur die deutsche Adresse ist umgezogen" ausdrückbar.
 *
 * (3) **DAS SPRACH-PRÄFIX WANDERT MIT — ABER NUR NACH INNEN.** Ein interner
 *     Treffer über den präfixlosen Pfad bekommt das Präfix wieder
 *     vorangestellt. Ein externes Ziel bekommt es nie: die fremde Seite kennt
 *     unsere Sprach-Präfixe nicht, und `https://example.com` mit `/de` davor
 *     wäre gar keine Adresse mehr.
 *
 * (4) **SYSTEM-PFADE WERDEN NIE UMGELEITET.** Die Sperrliste steht schon im
 *     Schema, aber sie steht AUCH hier — fail-closed, und zwar gegen die
 *     eigene Vergangenheit: eine Zeile kann aus der Konsole, aus einem
 *     Nachrüst-Skript oder aus einer Fassung dieses Codes stammen, die die
 *     Liste noch nicht kannte. Wer nur beim Schreiben prüft, verlässt sich
 *     darauf, dass es nie einen anderen Schreiber gab.
 *
 * (5) **NIEMALS AUF SICH SELBST.** Ergibt sich als Ziel exakt der Pfad, der
 *     gerade angefragt wurde, wird NICHT umgeleitet. Das ist der letzte
 *     Riegel gegen die Endlosschleife im Browser, unabhängig davon, was beim
 *     Schreiben durchgerutscht ist.
 *
 * Der QUERY-STRING gehört bewusst NICHT hierher: die Regel entscheidet über
 * den Pfad, das Anhängen der Parameter ist Sache des Aufrufers (Middleware).
 * Eine pure Funktion, die URLs zusammensetzt, wäre schwerer zu testen und
 * hätte zwei Aufgaben.
 */
export function resolveCommunityRedirect(
  config: CommunityRedirectConfig | null | undefined,
  path: string,
  localeCodes: readonly string[] = [],
): CommunityRedirectHit | null {
  const rules = config?.rules
  if (!Array.isArray(rules) || rules.length === 0) return null

  const requested = normalizeRedirectPath(path)
  if (!requested || requested === '/') return null

  const [prefix, bare] = splitLocalePrefix(requested, localeCodes)
  // Zusage (4): gegen den PRÄFIXLOSEN Pfad geprüft — sonst wäre `/de/login`
  // die offene Tür neben der geschlossenen `/login`.
  if (isReservedRedirectPath(bare)) return null

  const byFrom = new Map<string, CommunityRedirectRule>()
  for (const rule of rules.slice(0, MAX_REDIRECT_RULES)) {
    if (!rule || typeof rule.from !== 'string' || typeof rule.to !== 'string') continue
    const from = normalizeRedirectPath(rule.from)
    // Eine doppelt genannte Quelle ist ein defektes Dokument, keine zweite
    // Regel — das erste Vorkommen gewinnt (Muster `resolveCommunityNav`).
    if (!from || byFrom.has(from)) continue
    byFrom.set(from, rule)
  }

  // Zusage (2): exakter Treffer zuerst, dann der präfixlose.
  const exact = byFrom.get(requested)
  const bareHit = prefix ? byFrom.get(bare) : undefined
  const rule = exact ?? bareHit
  if (!rule) return null

  const external = rule.external === true
  if (external) {
    const to = rule.to.trim()
    if (!isSafeExternalRedirectTarget(to)) return null
    return { to, status: EXTERNAL_REDIRECT_STATUS, external: true }
  }

  const target = normalizeRedirectPath(rule.to)
  if (!isSafeInternalRedirectTarget(target)) return null
  // Zusage (3): nur der Treffer ÜBER den präfixlosen Pfad bekommt das Präfix
  // zurück — ein exakt gespeichertes `/de/alt ⇒ /de/neu` trägt es schon.
  const to = exact ? target : `${prefix}${target}`
  // Zusage (5).
  if (normalizeRedirectPath(to) === requested) return null
  return { to, status: INTERNAL_REDIRECT_STATUS, external: false }
}
