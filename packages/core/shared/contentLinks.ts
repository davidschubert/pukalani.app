/**
 * Link-POLICY des Markdown-Sinks (MarkdownContent) — bewusst getrennt von
 * shared/markdown.ts: dort steckt das PARSEN (und mit isSafeHref die
 * Sicherheits-Schranke), hier die Frage „wie wird ein bereits als sicher
 * eingestufter Href gerendert?".
 *
 * Warum überhaupt: interne Links in Inhalten (CMS-Seiten, Posts, Kommentare)
 * wurden wie fremde Links behandelt — `rel="noopener noreferrer nofollow"`
 * plus voller Seiten-Reload, und auf `/de/*` führte `[Feed](/feed)` zurück in
 * die EN-Route (Sprachwechsel beim Klick). Audit-Befund S3, live auf
 * demo.pukalani.app/de belegt.
 *
 * Diese Klassifizierung ist ABSICHTLICH eine pure Funktion ohne Router/i18n:
 * die eigentliche Lokalisierung macht `localePath()` im Renderer (nur die
 * kennt die i18n-Strategie), testbar bleibt die Entscheidung darüber.
 */

export type ContentLinkKind
  /** Fremdes Ziel (http/https oder alles Unerwartete) — nofollow/noreferrer/_blank. */
  = | 'external'
    /** Eigener Pfad OHNE Locale-Prefix — muss lokalisiert werden. */
    | 'internal'
    /** Eigener Pfad, der schon einen Locale-Prefix trägt — unangetastet lassen. */
    | 'internal-localized'

/**
 * Klassifiziert ein Link-Ziel aus Inhalten.
 *
 * @param href Ziel aus dem Markdown-AST (bereits durch isSafeHref gefiltert:
 *   nur `https?://…` oder `/pfad`). Alles andere wird defensiv als extern
 *   behandelt — nie als eigener Pfad.
 * @param localeCodes Konfigurierte i18n-Codes (z. B. ['de', 'en']).
 */
export function classifyContentLink(href: string, localeCodes: readonly string[]): ContentLinkKind {
  // Protokoll-relativ (`//evil.com`) beginnt mit '/', ist aber FREMD.
  if (!href.startsWith('/') || href.startsWith('//')) return 'external'

  const firstSegment = href.slice(1).split(/[/?#]/)[0]!.toLowerCase()
  return localeCodes.some(code => code.toLowerCase() === firstSegment)
    ? 'internal-localized'
    : 'internal'
}

/**
 * ── VERWEISE IM FLIESSTEXT (F57, Themen-Verlinkung) ────────────────────────
 *
 * Zweite Frage in derselben Datei, weil es dieselbe Zuständigkeit ist: wie
 * wird aus Inhalt ein Link? Oben geht es um ein Ziel, das der AUTOR als Link
 * geschrieben hat; hier um eines, das als gewöhnlicher TEXT dasteht und erst
 * vom Server aufgelöst wurde.
 *
 * ── WAS DIESE STELLE ABSICHTLICH NICHT WEISS ───────────────────────────────
 * Sie kennt keine Themen, keine Diskussionen und kein `#`. Sie bekommt eine
 * LISTE fertiger Verweise (`token`, `href`, `label`) und ersetzt genau diese
 * Zeichenketten. Mehr nicht.
 *
 * Das ist kein Purismus, sondern die Layer-Grenze (A14): `MarkdownContent.vue`
 * lebt im CORE, und ein Fundament-Layer hängt NIE von einem Produkt ab. Die
 * Erkennungs-Regel für `#<id>` gehört deshalb in den posts-Layer
 * (`packages/posts/shared/topicLinks.ts`) — hier landet nur ihr ERGEBNIS. Ein
 * zweites Produkt mit eigener Verweis-Syntax (Kurse, Termine) kann denselben
 * Vertrag bedienen, ohne dass core davon erfährt.
 *
 * ── EXAKTE ZEICHENKETTEN, KEINE ZWEITE REGEX ───────────────────────────────
 * Gesucht wird der Token WÖRTLICH, so wie er im Text steht. Der Server hat ihn
 * genau dort ausgelesen, bevor er ihn aufgelöst hat — Text und Liste können
 * also nicht auseinanderlaufen. Eine zweite Regex an dieser Stelle wäre eine
 * zweite Wahrheit: sie könnte etwas finden, das der Server nie aufgelöst hat
 * (ein Link ohne Ziel), oder etwas übersehen, das er auflöste.
 *
 * ── FAIL-CLOSED IST HIER KEINE HALTUNG, SONDERN DIE BAUART ─────────────────
 * Ohne Liste passiert nichts. Ein Verweis auf ein gelöschtes, verborgenes oder
 * fremdes Thema steht gar nicht erst in der Liste und bleibt damit gewöhnlicher
 * Text — dieselbe Eigenschaft, die `splitMentions` über sein `known`-Set hat.
 * Es gibt keinen Weg, hier versehentlich etwas zu verlinken.
 */

/** Ein aufgelöster Verweis: so steht er im Text, dorthin führt er, so heißt er. */
export interface ContentLink {
  /** Der Token, WÖRTLICH wie im Beitragstext (z. B. `#68a1…-mein-thema`). */
  token: string
  /** Ziel-Pfad OHNE Locale-Prefix — den setzt der Renderer über localePath(). */
  href: string
  /** Was der Leser sieht. Der HEUTIGE Titel des Ziels, nicht der Token. */
  label: string
}

export type ContentLinkSegment
  = { type: 'text', text: string }
    | { type: 'link', text: string, href: string, label: string }

/**
 * Ein Text-Blatt in Text- und Verweis-Stücke zerlegen.
 *
 * `links` ist die Menge der Verweise, die der Server für DIESEN Beitrag
 * aufgelöst hat. Fehlt sie oder ist sie leer, kommt der Text unverändert
 * zurück — bestehende Aufrufer von `MarkdownContent` merken davon nichts.
 *
 * LÄNGSTE ZUERST: zwei Tokens können einander präfixieren (`#abc123…` und
 * `#abc123…-mein-thema`). Wer den kurzen zuerst ersetzt, lässt `-mein-thema`
 * als Textrest stehen. Das ist die einzige Stelle, an der die Reihenfolge der
 * Liste zählt — die des TEXTES bestimmt danach die Reihenfolge der Stücke.
 */
export function splitContentLinks(
  text: string,
  links?: readonly ContentLink[],
): ContentLinkSegment[] {
  if (!links || links.length === 0) return [{ type: 'text', text }]

  // Eigene Kopie — die Liste des Aufrufers wird nie umsortiert, sie kann aus
  // einem reaktiven Payload stammen.
  const ordered = [...links]
    .filter(link => link.token.length > 0)
    .sort((a, b) => b.token.length - a.token.length)

  if (ordered.length === 0) return [{ type: 'text', text }]

  const segments: ContentLinkSegment[] = []
  let rest = text

  // Immer der FRÜHESTE Treffer im Resttext; bei Gleichstand gewinnt der
  // längste, weil die Liste danach sortiert ist.
  while (rest.length > 0) {
    let bestAt = -1
    let best: ContentLink | undefined

    for (const link of ordered) {
      const at = rest.indexOf(link.token)
      if (at === -1) continue
      if (bestAt === -1 || at < bestAt) {
        bestAt = at
        best = link
      }
    }

    if (!best || bestAt === -1) break

    if (bestAt > 0) segments.push({ type: 'text', text: rest.slice(0, bestAt) })
    segments.push({ type: 'link', text: best.token, href: best.href, label: best.label })
    rest = rest.slice(bestAt + best.token.length)
  }

  if (segments.length === 0) return [{ type: 'text', text }]
  if (rest.length > 0) segments.push({ type: 'text', text: rest })
  return segments
}
