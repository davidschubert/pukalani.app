/**
 * DAS ÖFFENTLICHE MENÜ EINER COMMUNITY (U15 Teil 1, Davids Zuschnitt vom
 * 2026-08-13) — der Vertrag und die EINE Auflösungsregel.
 *
 * Bis hierher war die Haupt-Navigation eine reine Folge des Bauplans: welcher
 * Layer extended ist, steht im Menü (`pukalani.chrome.nav`, Objekt-Map —
 * shared/types/chrome.ts), in der Reihenfolge, die der Layer sich selbst gibt
 * (`order`), mit dem Text, den er mitbringt (`labelKey`). Für den Betreiber
 * einer Instanz ist das richtig. Für den OWNER einer Community war es eine
 * Wand: er konnte weder etwas weglassen, was er nicht anbietet, noch etwas
 * anders nennen, als der Layer es nennt (Dashboard-Audit 2026-08-09 § 5;
 * docs/plans/DASHBOARD-IA.md führt „Navigation" als „existiert nirgends").
 *
 * Davids Zuschnitt, und nur der: **ausblenden · umordnen · umbenennen**, dazu
 * **eigene Links** (auf CMS-Seiten dieser Community und auf externe
 * https-Adressen). Bewusst NICHT: Untermenüs, Icons, je Sprache eigene Texte.
 *
 * ── EIGENE LABELS GELTEN FÜR BEIDE SPRACHEN (bewusster Verzicht) ───────────
 * Ein `labelKey` löst je Sprache auf; ein eigener Text tut das nicht. Der
 * Owner schreibt EINEN Text, und der steht in de wie in en. Das ist keine
 * Lücke, die noch zu schließen wäre, sondern die Entscheidung: ein
 * Übersetzungs-Formular mit zwei Feldern je Eintrag verdoppelt die Fläche für
 * einen Fall, den fast niemand hat (die meisten Communities sind einsprachig)
 * — und ein LEERES Feld fällt hier zurück auf die mitgelieferte Übersetzung,
 * die Zweisprachigkeit ist also nur einen Klick entfernt, nicht verbaut.
 *
 * ── WARUM DIE REGEL HIER IN core LIEGT ────────────────────────────────────
 * Sie rechnet über `pukalani.chrome.nav`, und dieser Vertrag gehört core
 * (shared/types/chrome.ts) — dieselbe Begründung, aus der er dort liegt: alle
 * Layer dürfen ihn nutzen, ohne sich gegenseitig zu importieren (A14). Der
 * ANWENDER ist das blueprint-Layout (es rendert das Menü), der SCHREIBER die
 * Owner-Route im pages-Layer (dem die „Website"-Gruppe gehört); beide dürfen
 * nach core greifen, keiner muss den anderen kennen.
 *
 * Vorbild der Form: `themes/shared/themeSelection.ts` — eine pure Funktion mit
 * durchgezählten Fällen, um die herum die Komposition nur noch Cookies, Fetches
 * und Fehlerbehandlung legt.
 */
import type { PukalaniChromeNavEntry } from './types/chrome'

/** Table `community_navigation` (Migration system-033). */
export const COMMUNITY_NAVIGATION_TABLE = 'community_navigation'

/**
 * Präfix der Ids EIGENER Links (`link-1`, `link-2`, …).
 *
 * ES IST EIN NAMENSRAUM, KEINE ZIERDE: die Ids der Produkt-Einträge kommen aus
 * der Registry und sind frei gewählte Wörter (`feed`, `discussions`, `events`).
 * Ohne ein reserviertes Präfix könnte ein eigener Link `events` heißen und
 * damit den Eintrag eines Produkts VERDECKEN — und beim nächsten Deploy, wenn
 * es das Produkt wirklich gibt, unbemerkt die Bedeutung tauschen. Die
 * Auflösungsregel unten entscheidet ausschliesslich an diesem Präfix, ob ein
 * Override-Eintrag ein Produkt MEINT oder selbst einer IST.
 */
export const CUSTOM_NAV_LINK_PREFIX = 'link-'

/** Obergrenzen — sie stehen hier, damit Schema (schreiben) und Regel (lesen)
 *  dieselbe Zahl lesen; die Spaltengrösse rechnet die Migration daraus. */
export const MAX_NAV_ENTRIES = 40
export const MAX_NAV_LABEL = 64
export const MAX_NAV_TARGET = 512

/**
 * DIE SPALTE IST DIE GRENZE, ALSO STEHT SIE IM SCHEMA (`config`, varchar 8192).
 *
 * NACHGERECHNET, nicht geraten. Ein Menü ist klein — die Anzeige bricht ab 5
 * Einträgen ohnehin in ein „Mehr"-Dropdown um —, aber die EINZELgrenzen oben
 * multiplizieren sich: 40 Einträge × (64 Label + 512 Ziel + ~60 JSON-Gerüst)
 * wären rund 26.000 Zeichen und passten in KEINE varchar-Spalte (MariaDB/
 * utf8mb4 endet bei 16.381). Zwei Wege standen zur Wahl:
 *
 *  - MEDIUMTEXT (off-row, wie `pages.body` seit pages-002) — kein Zeilenbudget,
 *    dafür eine Spalte ausserhalb der Zeile für ein Dokument von typisch 2 KB;
 *  - varchar 8192 MIT einer Grenze auf das SERIALISIERTE Dokument.
 *
 * Gewählt ist das zweite. 8192 Zeichen sind bei utf8mb4 32.768 Bytes in der
 * Zeile — die Hälfte des ~65-KB-Budgets, und `config` ist die EINZIGE Spalte
 * dieser Tabelle, es gibt also nichts, womit sie sich das Budget teilt. Ein
 * realistisches Menü (15 Einträge, zwei externe Links) liegt bei ~1,5 KB.
 *
 * Der Preis dieser Wahl ist eine Absage, die es sonst nicht gäbe: wer 40
 * Einträge mit maximal langen Adressen anlegt, bekommt ein sauberes 400 mit
 * Begründung statt eines 500 aus Appwrite. Genau deshalb steht die Grenze im
 * Zod-Schema und nicht nur im Kommentar — eine Spaltengrösse, die niemand
 * prüft, ist ein Fehler, der erst beim Kunden auftritt.
 */
export const MAX_NAV_CONFIG_CHARS = 8192

/** Passt dieses Dokument in die Spalte? Der EINE Test für Schema und Route. */
export function communityNavConfigFits(override: CommunityNavOverride): boolean {
  return JSON.stringify(override).length <= MAX_NAV_CONFIG_CHARS
}

/**
 * EIN Eintrag der gespeicherten Owner-Wahl.
 *
 * NUR ADDITIV ERWEITERBAR (dieselbe Regel wie das `config`-JSON der Custom
 * Themes, und aus demselben Grund: es gibt kein `version`-Feld und es soll
 * keines geben). Ein neues Feld muss optional sein und einen Default haben,
 * der das Verhalten von vorher beschreibt.
 */
export interface CommunityNavOverrideEntry {
  /** Registry-Id eines Produkt-Eintrags, `page-<slug>` einer CMS-Seite,
   *  oder `link-<n>` für einen eigenen Link. */
  id: string
  /** Aus dem Menü nehmen (der Eintrag bleibt gespeichert und ist wieder
   *  einschaltbar — Verstecken ist kein Löschen). */
  hidden?: boolean
  /** Eigener Text. Leer/fehlend = die mitgelieferte Übersetzung. */
  label?: string
  /** NUR für eigene Links: das Ziel. */
  to?: string
  /** NUR für eigene Links: externes Ziel (neuer Tab, rel="noopener"). */
  external?: boolean
}

/** Die gespeicherte Wahl. Reihenfolge = Array-Reihenfolge. */
export interface CommunityNavOverride {
  entries: CommunityNavOverrideEntry[]
}

/** Der leere Zustand — „keine eigene Wahl", identisch zu „keine Row". */
export function emptyCommunityNavOverride(): CommunityNavOverride {
  return { entries: [] }
}

/**
 * Ein Eintrag, wie ihn das Layout ANBIETET — also NACH allen seinen Gates
 * (Produkt-Schalter, Anmeldung, Tarif) und mit bereits übersetztem Text und
 * fertigem Pfad.
 */
export interface CommunityNavCandidate {
  id: string
  label: string
  to: string
  icon?: string
  planProduct?: string
  order: number
}

/** Ein Eintrag, wie ihn das Layout RENDERT. */
export interface CommunityNavItem {
  id: string
  label: string
  to: string
  icon?: string
  planProduct?: string
  /** Externes Ziel — der Renderer setzt target="_blank" + rel="noopener". */
  external: boolean
}

/** Ist das die Id eines EIGENEN Links (und nicht die eines Produkts)? */
export function isCustomNavLinkId(id: string): boolean {
  return id.startsWith(CUSTOM_NAV_LINK_PREFIX) && id.length > CUSTOM_NAV_LINK_PREFIX.length
}

/**
 * Ein INTERNER Pfad dieser Community — und zwar wirklich ein Pfad.
 *
 * Fail-closed über eine ERLAUBNISLISTE von Zeichen statt einer Sperrliste von
 * Angriffen: `javascript:`, `data:`, `vbscript:` und jedes künftige Schema
 * scheitern hier nicht daran, dass sie namentlich verboten wären, sondern
 * daran, dass ein Doppelpunkt gar nicht erst vorkommen darf. `//host` fällt
 * heraus, weil es der Browser als protokollrelative ABSOLUTE Adresse liest —
 * es sieht aus wie ein Pfad und ist ein fremder Server.
 */
export function isSafeInternalNavTarget(to: string): boolean {
  if (typeof to !== 'string') return false
  if (to.length === 0 || to.length > MAX_NAV_TARGET) return false
  if (!to.startsWith('/') || to.startsWith('//')) return false
  if (to.includes('..')) return false
  return /^\/[A-Za-z0-9\-._~/]*$/.test(to)
}

/**
 * Ein EXTERNES Ziel — https, sonst nichts.
 *
 * Kein http: eine Community, die mit ihrem Menü auf eine ungesicherte Seite
 * zeigt, schickt ihre Leser dorthin, und der Browser meldet es ihnen als
 * Warnung im Namen DIESER Community. `URL` parst statt einer Regex, weil eine
 * Regex über Adressen erfahrungsgemäss die Fälle nicht kennt, die zählen.
 */
export function isSafeExternalNavTarget(to: string): boolean {
  if (typeof to !== 'string') return false
  if (to.length === 0 || to.length > MAX_NAV_TARGET) return false
  let url: URL
  try {
    url = new URL(to)
  }
  catch {
    return false
  }
  return url.protocol === 'https:' && url.hostname.length > 0
}

/** Eigener Text, sonst der mitgelieferte. Leer heisst „zurück zur Übersetzung". */
function labelFor(fallback: string, custom: string | undefined): string {
  if (typeof custom !== 'string') return fallback
  const trimmed = custom.trim()
  if (!trimmed) return fallback
  return trimmed.slice(0, MAX_NAV_LABEL)
}

function toItem(candidate: CommunityNavCandidate, label?: string): CommunityNavItem {
  return {
    id: candidate.id,
    label: label ?? candidate.label,
    to: candidate.to,
    ...(candidate.icon ? { icon: candidate.icon } : {}),
    ...(candidate.planProduct ? { planProduct: candidate.planProduct } : {}),
    external: false,
  }
}

/**
 * Aus einem Override-Eintrag einen EIGENEN Link machen — oder nichts.
 *
 * DEFENSIV BEIM LESEN, obwohl beim Schreiben schon geprüft wurde. Das ist
 * keine Gürtel-und-Hosenträger-Geste: die Zeile ist JSON in einer Spalte, sie
 * überlebt jede Schema-Änderung, und sie wurde womöglich von einer älteren
 * Fassung dieses Codes geschrieben. Ein Menü ist die Fläche, auf der jeder
 * Besucher klickt — was hier durchkommt, klickt er.
 */
function customLinkItem(entry: CommunityNavOverrideEntry): CommunityNavItem | null {
  if (!isCustomNavLinkId(entry.id)) return null
  if (entry.hidden === true) return null
  const label = typeof entry.label === 'string' ? entry.label.trim() : ''
  if (!label) return null
  const to = typeof entry.to === 'string' ? entry.to.trim() : ''
  const external = entry.external === true
  if (external ? !isSafeExternalNavTarget(to) : !isSafeInternalNavTarget(to)) return null
  return { id: entry.id, label: label.slice(0, MAX_NAV_LABEL), to, external }
}

/**
 * DIE REGEL: angebotene Einträge + gespeicherte Wahl ⇒ das fertige Menü.
 *
 * ── VIER ZUSAGEN, DIE MAN NICHT „VEREINFACHEN" DARF ───────────────────────
 *
 * (1) **`candidates` IST AUTORITATIV.** Was das Layout nicht anbietet, kann
 *     kein Override herbeirufen. Der Tarif-Filter (C2, `planAllows`) und die
 *     Produkt-Schalter laufen VORHER; ein gesperrtes Produkt ist hier gar
 *     nicht erst in der Liste und fällt deshalb unten in den Zweig
 *     „unbekannte Id ⇒ ignorieren". Ein Owner kann sich also durch Umbenennen
 *     oder Umsortieren NICHTS freischalten — die Gegenprobe dazu steht im
 *     Test und im Beweis-Skript. (Die Autorität ist ohnehin die Route hinter
 *     dem Produkt; hier geht es darum, dass das MENÜ nicht lügt.)
 *
 * (2) **UNBEKANNTE IDS WERDEN STILL IGNORIERT.** Ein abgeschaltetes,
 *     entferntes oder umbenanntes Produkt darf das Menü nicht zerreissen. Die
 *     gespeicherte Zeile bleibt dabei unangetastet: kommt das Produkt zurück,
 *     steht es wieder an seinem Platz. Deshalb wird hier NICHT aufgeräumt.
 *
 * (3) **NICHT ERWÄHNTE EINTRÄGE HÄNGEN HINTEN AN, statt zu verschwinden.**
 *     Der Owner hat sein Menü gespeichert, als es das neue Produkt noch nicht
 *     gab — würden unerwähnte Einträge wegfallen, wäre jede künftige
 *     Erweiterung für jede Bestands-Community unsichtbar, und niemand hätte je
 *     eine Entscheidung dagegen getroffen. Sichtbar am Ende ist die
 *     ehrlichere Vorgabe als unsichtbar.
 *
 * (4) **OHNE WAHL ÄNDERT SICH NICHTS.** Leeres/fehlendes Override ⇒ exakt die
 *     heutige Sortierung nach `order`. Fail-soft ist hier kein Zusatz,
 *     sondern der Normalfall: die allermeisten Communities haben keine Row.
 */
export function resolveCommunityNav(
  candidates: readonly CommunityNavCandidate[],
  override: CommunityNavOverride | null | undefined,
): CommunityNavItem[] {
  const byOrder = [...candidates].sort((a, b) => a.order - b.order)
  const entries = override?.entries
  if (!Array.isArray(entries) || entries.length === 0) return byOrder.map(c => toItem(c))

  const byId = new Map(byOrder.map(candidate => [candidate.id, candidate]))
  const seen = new Set<string>()
  const items: CommunityNavItem[] = []

  for (const entry of entries.slice(0, MAX_NAV_ENTRIES)) {
    if (!entry || typeof entry.id !== 'string' || !entry.id) continue
    // Eine doppelt genannte Id ist ein defektes Dokument, kein zweiter
    // Eintrag — das erste Vorkommen gewinnt, der Rest fällt weg.
    if (seen.has(entry.id)) continue
    seen.add(entry.id)

    const candidate = byId.get(entry.id)
    if (candidate) {
      if (entry.hidden === true) continue
      items.push(toItem(candidate, labelFor(candidate.label, entry.label)))
      continue
    }
    const custom = customLinkItem(entry)
    if (custom) items.push(custom)
    // sonst: Zusage (2) — unbekannte Id, still ignoriert.
  }

  // Zusage (3): alles, worüber die gespeicherte Wahl nichts sagt.
  for (const candidate of byOrder) {
    if (!seen.has(candidate.id)) items.push(toItem(candidate))
  }
  return items
}

/**
 * Die Registry-Einträge, die NACH den Gates des Layouts übrig bleiben — die
 * Vorstufe der `candidates`, noch mit `labelKey` statt Text.
 *
 * STEHT HIER UND NICHT IM LAYOUT, obwohl das Layout der einzige Renderer ist:
 * der EDITOR muss dieselbe Liste zeigen, sonst bietet er dem Owner Einträge
 * an, die auf seiner Seite nie erscheinen (oder verschweigt welche, die es
 * tun). Zwei Stellen, die dieselbe Frage beantworten, laufen auseinander —
 * und zwar erfahrungsgemäss genau dann, wenn ein Gate dazukommt.
 */
export function filterChromeNavEntries(
  nav: Record<string, PukalaniChromeNavEntry | false> | undefined,
  gates: {
    isLoggedIn: boolean
    /** Laufzeit-Produkt-Schalter (F2) — bekommt den womöglich fehlenden Key. */
    productOn: (productKey: string | undefined) => boolean
    /** Tarif-Gate im Pool (C2) — nur bei gesetztem `planProduct` gefragt. */
    planAllows: (planProduct: string) => boolean
  },
): Array<PukalaniChromeNavEntry & { id: string }> {
  return Object.entries(nav ?? {})
    .filter((pair): pair is [string, PukalaniChromeNavEntry] => pair[1] !== false && !!pair[1])
    .filter(([, entry]) => gates.productOn(entry.productKey))
    .filter(([, entry]) => !entry.requiresAuth || gates.isLoggedIn)
    .filter(([, entry]) => !entry.planProduct || gates.planAllows(entry.planProduct))
    .map(([id, entry]) => ({ ...entry, id }))
}

/**
 * Die nächste freie `link-<n>`-Id für eine bestehende Wahl.
 *
 * Zählt über das MAXIMUM, nicht über die Anzahl: wer einen Link entfernt und
 * einen neuen anlegt, bekommt sonst die Id des entfernten — und damit dessen
 * Platz in einem Menü, das jemand anderes gerade offen hat.
 */
export function nextCustomNavLinkId(entries: readonly CommunityNavOverrideEntry[]): string {
  let max = 0
  for (const entry of entries) {
    if (!isCustomNavLinkId(entry.id)) continue
    const n = Number.parseInt(entry.id.slice(CUSTOM_NAV_LINK_PREFIX.length), 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${CUSTOM_NAV_LINK_PREFIX}${max + 1}`
}

/**
 * Was aus der Spalte kommt, in die Form bringen — oder `null`.
 *
 * Der EINE Leser des gespeicherten JSON (Route wie SSR-Leser). Er wirft nie:
 * ein kaputtes Dokument heisst „keine eigene Wahl", und das Menü sieht aus wie
 * vor U15. Ein Fehler an dieser Stelle nähme einer Community ihre Startseite.
 */
export function parseCommunityNavOverride(raw: string | null | undefined): CommunityNavOverride | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const entries = (parsed as { entries?: unknown }).entries
    if (!Array.isArray(entries)) return null
    const clean: CommunityNavOverrideEntry[] = []
    for (const raw of entries.slice(0, MAX_NAV_ENTRIES)) {
      if (!raw || typeof raw !== 'object') continue
      const entry = raw as Record<string, unknown>
      if (typeof entry.id !== 'string' || !entry.id) continue
      clean.push({
        id: entry.id,
        ...(entry.hidden === true ? { hidden: true } : {}),
        ...(typeof entry.label === 'string' ? { label: entry.label } : {}),
        ...(typeof entry.to === 'string' ? { to: entry.to } : {}),
        ...(entry.external === true ? { external: true } : {}),
      })
    }
    return { entries: clean }
  }
  catch {
    return null
  }
}
