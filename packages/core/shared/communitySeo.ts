/**
 * WIE EINE COMMUNITY IN DER SUCHE ERSCHEINT (U15 Teil 2, Davids Zuschnitt vom
 * 2026-08-13) — der Vertrag und die EINE Auflösungsregel.
 *
 * Bis hierher konnte der Owner an seinem Auftritt in der Suche nichts drehen.
 * Die Beschreibung, die Google unter dem Titel zeigt, entstand ausschliesslich
 * aus dem ERSTEN ABSATZ seiner Startseite (`pageExcerpt`, Audit-Befund S5) —
 * ein Text, der zum LESEN geschrieben ist und nur zufällig auch als Anriss
 * taugt. Und wer seine Community aus der Suche heraushalten wollte, hatte
 * genau eine Möglichkeit: sie ganz auf „nur für Mitglieder" stellen (C18) und
 * damit auch jeden Gast aussperren. Zwei sehr verschiedene Wünsche, ein
 * Schalter.
 *
 * Davids Zuschnitt, und nur der: **eigene Beschreibung der Startseite** ·
 * **noindex-Schalter** · **Vorschau**. Bewusst NICHT: eigener Titel, eigenes
 * Vorschaubild (die generierte Karte bleibt), hreflang/canonical von Hand,
 * Beschreibungen je Unterseite, je Sprache eigene Texte.
 *
 * ── DIE BESCHREIBUNG GILT FÜR BEIDE SPRACHEN (bewusster Verzicht) ─────────
 * Wortgleich der Verzicht aus Teil 1 (eigene Menü-Texte): der Owner schreibt
 * EINEN Text, und der steht in de wie in en. Ein leeres Feld fällt auf den
 * Anriss der Startseite zurück, und DER ist wieder je Sprache verschieden —
 * die Zweisprachigkeit ist also nicht verbaut, sie kostet nur den eigenen
 * Text. Ein Formular mit zwei Feldern für einen Fall, den fast keine Community
 * hat, wäre der schlechtere Tausch.
 *
 * ── ZWEI FRAGEN, EINE FUNKTION ───────────────────────────────────────────
 * `resolveCommunitySeo` beantwortet beide Signale auf einmal, weil beide aus
 * DERSELBEN Zeile kommen und beide denselben Härtungsbedarf haben. Die zwei
 * ANTWORTEN wandern danach getrennt weiter: die Beschreibung nur in den Kopf
 * der STARTSEITE (dort steht heute der Anriss), das robots-Signal in
 * `useLocaleSeoHead()` und damit auf JEDE Seite der Community.
 *
 * ── WARUM DIE REGEL HIER IN core LIEGT ───────────────────────────────────
 * Weil `useLocaleSeoHead()` hier liegt, und das ist der EINE Kopf-Aufruf jeder
 * App (CLAUDE.md). Das robots-Signal gehört genau dorthin, neben das
 * C18-`noindex` — eine zweite Stelle, die auch robots schreibt, wäre der
 * Anfang vom Ende dieser Zusage. Der SCHREIBER lebt im pages-Layer (dem die
 * „Website"-Gruppe gehört), der Anwender im Kern; beide dürfen nach core
 * greifen, keiner muss den anderen kennen (A14). Dieselbe Aufteilung wie bei
 * `communityNavigation.ts` in Teil 1.
 */

/** Appwrite-Table (system-034) — EINE Row je Community, rowId = communities.$id. */
export const COMMUNITY_SEO_TABLE = 'community_seo'

/**
 * Harte Grenze der Beschreibung — Spaltengrösse UND Zod-Maximum.
 *
 * Google schneidet die Beschreibung bei ungefähr 160 Zeichen ab; das DOPPELTE
 * als Grenze zu nehmen ist Absicht und keine Beliebigkeit. Erstens ist „~160"
 * kein Vertrag, sondern eine Beobachtung — die Suchmaschinen haben diese Marke
 * schon mehrfach verschoben, und eine Grenze, die genau darauf sitzt, macht
 * jede Verschiebung zu einem Datenverlust. Zweitens ist die Länge, die ANGEZEIGT
 * wird, nicht die Länge, die man SCHREIBEN können muss: wer zwei Sätze
 * formuliert und den zweiten nur als Reserve mitschickt, tut nichts Falsches.
 * Die Empfehlung steht deshalb im Editor als Zähler (RECOMMENDED_…), nicht als
 * Verbot.
 *
 * Die Zahl steht an ZWEI Stellen (Spalte in system-034, Zod im pages-Layer) und
 * kommt an beiden aus DIESER Konstante. Ohne das Zod-Maximum liefe ein zu
 * langer Text in ein 500 aus Appwrite statt in ein 400 mit Begründung.
 */
export const MAX_SEO_DESCRIPTION = 320

/** Ab hier schneidet Google ab — die Marke, die der Zähler im Editor zeigt. */
export const RECOMMENDED_SEO_DESCRIPTION = 160

/** Die gespeicherte Wahl des Owners. */
export interface CommunitySeoSettings {
  /** '' = keine eigene Beschreibung (dann gilt der Anriss der Startseite). */
  metaDescription: string
  /** true = „diese Community aus Suchmaschinen raushalten". */
  noindex: boolean
}

/** Was der Kopf daraus macht. */
export interface CommunitySeoHead {
  /** '' = KEIN description-Tag (ein leeres ist schlechter als keines, S5). */
  description: string
  noindex: boolean
}

export function emptyCommunitySeoSettings(): CommunitySeoSettings {
  return { metaDescription: '', noindex: false }
}

/**
 * Einen Beschreibungs-Text auf die Form bringen, die in ein meta-Attribut darf.
 *
 * ZEILENUMBRÜCHE ZU LEERZEICHEN, und das ist der eigentliche Zweck: das Feld im
 * Editor ist eine Textfläche, und Menschen schreiben darin Absätze. In einem
 * `content`-Attribut ist ein Zeilenumbruch bestenfalls wirkungslos und
 * schlimmstenfalls ein Whitespace-Salat in der Suchergebnis-Zeile. Derselbe
 * Schritt macht Tabulatoren und doppelte Leerzeichen mit.
 *
 * GEKAPPT wird defensiv (Lesepfad), nicht als Ersatz für die Prüfung beim
 * Schreiben: das Zod-Schema lehnt zu lange Texte mit 400 ab, aber eine Zeile
 * kann auch aus der Konsole, aus einem Nachrüst-Skript oder aus einer früheren
 * Schema-Fassung stammen. Wer nur beim Schreiben prüft, verlässt sich darauf,
 * dass es nie einen anderen Schreiber gab.
 */
export function normalizeSeoDescription(raw: unknown, maxLength: number = MAX_SEO_DESCRIPTION): string {
  if (typeof raw !== 'string') return ''
  // \s deckt \n, \r, \t und die Unicode-Leerzeichen mit ab.
  const flat = raw.replace(/\s+/g, ' ').trim()
  if (flat.length <= maxLength) return flat
  return flat.slice(0, maxLength).trim()
}

/**
 * DIE REGEL: gespeicherte Zeile + heutiger Rückfall ⇒ die zwei Signale.
 *
 * Vier Zusagen, und jede hat einen Gegenspieler, den sie verhindert:
 *
 * (1) KEINE ZEILE HEISST HEUTIGES VERHALTEN. Die allermeisten Communities
 *     haben keine — und für sie muss der Kopf Zeichen für Zeichen so
 *     aussehen wie vor U15: der Anriss der Startseite als Beschreibung,
 *     kein robots-Tag. Ein Ausbau, der beim Nichtstun etwas ändert, ist
 *     keiner.
 *
 * (2) EINE EIGENE BESCHREIBUNG SCHLÄGT DEN ANRISS, ein LEERES Feld nicht.
 *     '' ist kein „ich will keine Beschreibung", sondern „ich habe keine
 *     geschrieben" — der Unterschied entscheidet, ob ein Owner, der sein
 *     Feld wieder leert, ohne Beschreibung dasteht oder wieder beim
 *     Anriss landet. Er landet beim Anriss.
 *
 * (3) OHNE BEIDES BLEIBT DER KOPF LEER. `description: ''` heisst „kein Tag" —
 *     `useBrandTitle` lässt es dann weg (S5: ein leeres description-Meta ist
 *     schlechter als keines). Das ist der Zustand einer Community ohne
 *     Startseite und ohne eigenen Text.
 *
 * (4) EINE KAPUTTE ZEILE IST INDEXIERBAR. `noindex` gilt nur bei einem echten
 *     `true`; alles andere — fehlend, `null`, `'true'` als Zeichenkette aus
 *     einer verunglückten Migration — heisst „nein".
 *
 * ── ZU (4): DAS IST FAIL-OPEN, UND ZWAR BEWUSST ──────────────────────────
 * Anderswo im Haus wird bei Unklarheit ZUGEMACHT (`resolveTenantAudience`
 * fail-closed, `rowBelongsToTenant` fail-closed). Hier nicht, und der
 * Unterschied ist die Sorte Zusage: das C18-`noindex` schützt Inhalte, die
 * nicht öffentlich sein sollen — dort wäre ein Lesefehler ein Datenleck. Der
 * Schalter hier ändert an der Sichtbarkeit der Community NICHTS: ihre Seiten
 * bleiben für jeden Gast lesbar, es geht allein darum, ob eine Suchmaschine
 * sie aufnimmt. Fail-closed hiesse: ein Wackler beim Lesen der Zeile nimmt
 * eine Community aus dem Index, und zurück kommt sie erst nach dem nächsten
 * Crawl — Wochen später. Der teurere Fehler steht hier auf der anderen Seite.
 *
 * `row` ist bewusst `unknown`-freundlich getippt: der Aufrufer reicht eine
 * Appwrite-Zeile durch, deren Spalten eine Schema-Änderung überleben müssen.
 */
export function resolveCommunitySeo(
  row: { metaDescription?: unknown, noindex?: unknown } | null | undefined,
  fallbackDescription?: string | null,
): CommunitySeoHead {
  const own = normalizeSeoDescription(row?.metaDescription)
  return {
    description: own || normalizeSeoDescription(fallbackDescription),
    noindex: row?.noindex === true,
  }
}

/**
 * Die gespeicherte Wahl aus einer Appwrite-Zeile — für den Editor, der den
 * gesetzten Zustand ZEIGEN muss und nicht den aufgelösten.
 *
 * `null` heisst „keine Zeile" und ist im Editor ein anderer Zustand als eine
 * Zeile mit leerem Feld: beide sehen gleich aus, aber nur der zweite ist eine
 * Entscheidung. Für die Anzeige macht das keinen Unterschied, für das
 * Verständnis der Ablage schon — deshalb bleibt die Unterscheidung im Typ.
 */
export function parseCommunitySeoRow(
  row: { metaDescription?: unknown, noindex?: unknown } | null | undefined,
): CommunitySeoSettings | null {
  if (!row || typeof row !== 'object') return null
  return {
    metaDescription: normalizeSeoDescription(row.metaDescription),
    noindex: row.noindex === true,
  }
}
