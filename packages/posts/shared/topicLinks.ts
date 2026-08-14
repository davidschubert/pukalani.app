/**
 * THEMEN-VERLINKUNG (`#<id>-<deko>`) — die PURE Regel. EINE Quelle für vier
 * Leser: die Schreibfläche (Token bilden), den Server (auflösen + Rückverweise
 * schreiben), den Renderer (hervorheben) und die Tests.
 *
 * F57, letzte Mechanik aus dem Discussions-Konzept Teil 4.
 *
 * ── EIN VERWEIS IST GEWÖHNLICHER TEXT ──────────────────────────────────────
 * Gespeichert wird eine Zeichenkette, sonst nichts — kein Knoten, keine neue
 * Markdown-Marke, keine Erweiterung von `core/shared/markdown.ts`. Das ist
 * dieselbe Entscheidung wie bei `@handle` (siehe `core/shared/mentions.ts`)
 * und aus demselben Grund: der Parser kann fett/kursiv/Code/Link/h2+h3/
 * Listen/Zitat/Codeblock — mehr nicht. Alles darüber hinaus stünde als ROHER
 * TEXT im Beitrag. Ein Verweis, der nur Text ist, kostet keine Migration für
 * Bestandsinhalte und bleibt lesbar, wenn jemand den Beitrag ohne unseren
 * Renderer anschaut.
 *
 * ── WARUM DIE ID UND NICHT DER SLUG ────────────────────────────────────────
 * Die naheliegende Form wäre `#mein-thema` gewesen. Sie ist an DREI Stellen
 * unbaubar, und jede einzelne genügt:
 *
 *  1. **Der Slug ist nirgends gespeichert.** `topicSlug()` leitet ihn bei
 *     jedem Aufruf aus Titel und Text ab (`shared/discussionUrl.ts`);
 *     `community_posts` hat keine Slug-Spalte. Eine Auflösung `Slug → Thema`
 *     wäre ein Vollscan über alle Titel der Community — bei JEDEM Aufbau
 *     einer Seite, die einen Verweis enthält.
 *  2. **Der Slug ist nicht eindeutig.** Zwei Themen dürfen denselben Titel
 *     tragen; es gibt bewusst keinen Unique-Index darauf (nur der KATEGORIE-
 *     Slug ist je Community eindeutig). Ein Verweis könnte also nicht sagen,
 *     welches Thema er meint.
 *  3. **Der Slug vergeht.** Wer sein Thema umbenennt, bekommt einen neuen
 *     Slug — der Verweis zeigte ins Leere, obwohl das Thema noch da ist. Das
 *     ist exakt die Eigenschaft, gegen die die URL-Regel gebaut wurde
 *     („Umbenennen ist gratis, jeder alte Link führt für immer ans Ziel").
 *     Ein Verweis, der schlechter altert als ein Link, wäre ein Rückschritt.
 *
 * Deshalb trägt der Token die ROW-ID, und die Deko dahinter ist genau das:
 * Deko. Es ist DIESELBE Arbeitsteilung wie in der URL
 * (`/discussions/<kategorie>/<id>/<slug>`) — die Id ist die Wahrheit, alles
 * andere steht für Menschen da und wird beim Auflösen IGNORIERT. Wer den Text
 * eines Verweises von Hand verändert, ändert nichts am Ziel.
 *
 * ── DIE ERKENNUNGS-REGEL, FAIL-CLOSED ──────────────────────────────────────
 *
 *     #<id>[-<deko>]
 *
 *  - `<id>` ist REIN ALPHANUMERISCH (`[A-Za-z0-9]`) und 16–36 Zeichen lang.
 *  - `<deko>` sind ein oder mehrere `-`-getrennte Gruppen aus `[a-z0-9]`,
 *    also genau das, was `slugify()` erzeugt.
 *  - Links davor darf kein Buchstabe, keine Ziffer, kein `_` und kein `#`
 *    stehen.
 *
 * Was diese Regel bewusst NICHT erkennt, und warum:
 *
 *  - **`#42`, `#2026`, `#1` (Hausnummern, Ticket-Nummern, Jahreszahlen).**
 *    Die Untergrenze von 16 Zeichen schließt jeden Alltagsfall aus. Appwrites
 *    `ID.unique()` liefert 20 Zeichen, es geht also nichts Echtes verloren.
 *  - **`# Überschrift`.** Nach `#` folgt hier unmittelbar ein ID-Zeichen, nie
 *    ein Leerzeichen. Der Heading-Zweig von `parseMarkdown` verlangt
 *    umgekehrt zwingend Whitespace (`/^(#{1,6})\s+/`) — die beiden können
 *    einander nicht in die Quere kommen.
 *  - **`##abc…` und `foo#abc…`.** Die linke Flanke sperrt das mitgeführte `#`
 *    (sonst rutschte eine doppelte Raute durch) und jedes Wortzeichen (sonst
 *    wäre der Anker einer URL — `.../seite#abschnitt` — ein Verweis).
 *  - **IDS MIT TRENNZEICHEN.** Appwrite erlaubt in einer Row-Id auch `-`,
 *    `_` und `.`; wäre eines davon zugelassen, ließe sich `#<id>-<deko>` nicht
 *    mehr eindeutig zerlegen (wo endet die Id, wo beginnt die Deko?). Die
 *    Regel nimmt deshalb nur rein alphanumerische Ids. Praktisch betrifft das
 *    im posts-Layer GENAU EINE selbstvergebene Id: der Willkommens-Beitrag
 *    (`wp-<tenantId>`, `shared/welcomePost.ts`) — und der ist ein
 *    FEED-Beitrag mit `categoryId: ''`, also ohnehin kein Thema und damit
 *    niemals ein Verweisziel. Die Grenze kostet heute nichts; wer künftig
 *    Themen mit selbstvergebener Id anlegt, muss sie kennen.
 *
 * Alles, was durch die Regel fällt, bleibt schlichter Text. Und alles, was
 * durchkommt, muss immer noch aufgelöst werden — ein `#` plus 20 erfundene
 * Zeichen ist ein Kandidat, kein Verweis.
 */

import { parseMarkdown, type BlockNode, type InlineNode } from '../../core/shared/markdown'
import { discussionTopicPath } from './discussionUrl'

/**
 * Obergrenze je Beitrag — dieselbe Überlegung wie `MAX_MENTIONS_PER_CONTENT`
 * (10): mehr als eine Handvoll echter Verweise gibt es nicht, und die Grenze
 * ist die Bremse gegen einen Beitrag, der 200 Rückverweis-Zeilen anlegt und
 * damit 200 fremde Themen zumüllt.
 */
export const MAX_TOPIC_LINKS_PER_CONTENT = 10

/** Kürzeste/längste Row-Id, die als Verweisziel gilt (Begründung im Kopf). */
export const TOPIC_LINK_ID_MIN = 16
export const TOPIC_LINK_ID_MAX = 36

/**
 * Die Erkennungs-Regel. Gruppe 1 ist die Id, Gruppe 2 die (ignorierte) Deko.
 *
 * Die linke Flanke ist der wichtigste Teil — siehe Kopf. Sie ist bewusst
 * enger als bei den Erwähnungen: dort sperrt `(?<![\p{L}\p{N}_@])` nur
 * Wortzeichen und das eigene Zeichen, hier gilt dasselbe für `#`.
 */
const TOPIC_LINK_RE = new RegExp(
  `(?<![\\p{L}\\p{N}_#])#([A-Za-z0-9]{${TOPIC_LINK_ID_MIN},${TOPIC_LINK_ID_MAX}})((?:-[a-z0-9]+)*)`,
  'gu',
)

/**
 * Der Token, den die Schreibfläche einfügt: Id plus lesbare Deko.
 *
 * Die Deko ist optional — ohne Slug entsteht `#<id>`, und das löst genauso
 * auf. Sie steht trotzdem da, weil der Rohtext sonst beim BEARBEITEN eines
 * Beitrags nichts mehr aussagt: `#68a1…` verrät nicht, worauf es zeigt.
 */
export function topicLinkToken(id: string, slug?: string): string {
  const deko = (slug ?? '').trim()
  return deko ? `#${id}-${deko}` : `#${id}`
}

/** Ein Verweis-Kandidat: der Token wie im Text, und die Id, die er meint. */
export interface TopicLinkCandidate {
  /** WÖRTLICH wie im Text — der Renderer sucht später genau diese Zeichenkette. */
  token: string
  /** Die Row-Id des gemeinten Themas. Noch NICHT nachgeschlagen. */
  id: string
}

/** Alle Text-Blätter eines Blocks besuchen — Code wird bewusst übersprungen. */
function forEachTextLeaf(blocks: BlockNode[], visit: (text: string) => void): void {
  const inline = (nodes: InlineNode[]): void => {
    for (const node of nodes) {
      switch (node.type) {
        case 'text': visit(node.text); break
        case 'strong':
        case 'em': inline(node.children); break
        case 'link': inline(node.children); break
        // 'code' fehlt absichtlich: in `` `#68a1…` `` steht ein Verweis, der
        // nicht gemeint ist — dasselbe Argument wie bei den Erwähnungen.
      }
    }
  }

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
      case 'quote': inline(block.children); break
      case 'list': for (const item of block.items) inline(item); break
      // 'codeblock' fehlt absichtlich (siehe oben).
    }
  }
}

/**
 * Alle KANDIDATEN aus einem Markdown-Text — ohne Doppelte, in der Reihenfolge
 * des Auftretens, gedeckelt.
 *
 * „Kandidaten", weil hier niemand nachschlägt: ob es das Thema gibt, ob es
 * veröffentlicht ist und ob es zu DIESER Community gehört, weiß nur die
 * Datenbank. Genau diese Trennung hält die Datei pur.
 *
 * Gearbeitet wird über den AST, nie über den Rohtext — beide Gründe stehen im
 * Kopf von `core/shared/mentions.ts` und gelten hier unverändert (Escapes,
 * Code). Ein zusätzlicher Grund kommt dazu: `[Titel](/pfad#68a1…)` ist ein
 * LINK-Ziel, kein Verweis — im AST steht es als `href` und wird nie besucht.
 *
 * DOPPELTE werden über die ID entfernt, nicht über den Token: `#abc-alt` und
 * `#abc-neu` meinen dasselbe Thema und ergeben EINEN Rückverweis. Für den
 * Renderer bleiben trotzdem beide Schreibweisen erhalten (siehe
 * `topicLinkTokensFor`).
 */
export function extractTopicLinkCandidates(
  markdown: string,
  limit: number = MAX_TOPIC_LINKS_PER_CONTENT,
): TopicLinkCandidate[] {
  if (!markdown.includes('#')) return []

  const found: TopicLinkCandidate[] = []
  const seen = new Set<string>()

  forEachTextLeaf(parseMarkdown(markdown), (text) => {
    if (found.length >= limit || !text.includes('#')) return
    // Eigene Kopie: ein `g`-Regex trägt `lastIndex` mit sich.
    const re = new RegExp(TOPIC_LINK_RE.source, TOPIC_LINK_RE.flags)
    for (const match of text.matchAll(re)) {
      const id = match[1]!
      if (seen.has(id)) continue
      seen.add(id)
      found.push({ token: match[0], id })
      if (found.length >= limit) return
    }
  })

  return found
}

/** Nur die Ids — die Form, die der Server zum Nachschlagen braucht. */
export function extractTopicLinkIds(
  markdown: string,
  limit: number = MAX_TOPIC_LINKS_PER_CONTENT,
): string[] {
  return extractTopicLinkCandidates(markdown, limit).map(candidate => candidate.id)
}

/**
 * ALLE Schreibweisen je Id — was der Renderer braucht.
 *
 * `extractTopicLinkCandidates` entfernt Doppelte, weil ein Thema nur EINEN
 * Rückverweis bekommt. Im Text können aber mehrere Schreibweisen desselben
 * Verweises stehen (`#abc-alter-titel` und `#abc-neuer-titel`, oder schlicht
 * zweimal derselbe Token). Der Renderer sucht WÖRTLICH — er braucht deshalb
 * jede vorkommende Schreibweise, sonst bliebe die zweite als Rohtext stehen.
 */
export function topicLinkTokensFor(markdown: string, limit: number = MAX_TOPIC_LINKS_PER_CONTENT): Map<string, string[]> {
  const byId = new Map<string, string[]>()
  if (!markdown.includes('#')) return byId

  forEachTextLeaf(parseMarkdown(markdown), (text) => {
    if (byId.size >= limit || !text.includes('#')) return
    const re = new RegExp(TOPIC_LINK_RE.source, TOPIC_LINK_RE.flags)
    for (const match of text.matchAll(re)) {
      const id = match[1]!
      const tokens = byId.get(id)
      if (tokens) {
        if (!tokens.includes(match[0])) tokens.push(match[0])
        continue
      }
      if (byId.size >= limit) return
      byId.set(id, [match[0]])
    }
  })

  return byId
}

/** Der Pfad, auf den ein Verweis zeigt — dieselbe Regel wie jeder Themen-Link. */
export function topicLinkHref(categorySlug: string, id: string, slug: string): string {
  return discussionTopicPath(categorySlug, id, slug)
}
