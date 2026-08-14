/**
 * EMOJI-REAKTIONEN — der kuratierte Satz und die Zaehlweise (F57 Mechanik 1,
 * Davids Entscheidung 2026-08-10 „Reaktionen zuerst").
 *
 * PURE und unit-getestet. Diese Datei laeuft im Browser UND auf dem Server: der
 * Chip-Streifen rendert daraus, die Route validiert dagegen. Genau EINE Liste,
 * sonst driften Anzeige und Erlaubnis auseinander.
 *
 * ── WAS EINE REAKTION IST — UND WAS SIE AUSDRUECKLICH NICHT IST ─────────────
 * Sie ist reiner AUSDRUCK neben den Stimmen. Konzept Teil 4 Punkt 3 haelt die
 * bindende Folgeregel fest: **Abzeichen zaehlen weiterhin AUSSCHLIESSLICH
 * Upvotes**, Reaktionen sind badge-neutral — sonst haette „Like" zwei Quellen
 * und Davids Entscheidung 4 („Like = Upvote") waere still aufgehoben.
 * Die EINZIGE Ausnahme, die das Konzept selbst nennt, ist das Abzeichen
 * `first-reaction`, und es haengt an der ersten ABGEGEBENEN Reaktion, nie an
 * einer erhaltenen. Deshalb gibt es hier auch keinen Empfangs-Zaehler.
 *
 * ── WARUM WEDER 👍 NOCH ❤️ IM SATZ STEHEN (die eine Auswahl mit Begruendung) ─
 * Beide waeren die naheliegende Wahl und beide sind hier die falsche: der
 * Daumen ist die Geste, die neben einem Aufstimm-Pfeil unweigerlich als
 * ZWEITE Aufstimme gelesen wird, und das Herz IST in der Vorlage (Discourse)
 * das Like, das Entscheidung 4 auf den Upvote abgebildet hat. Ein Satz, der
 * beide enthaelt, macht die Badge-Neutralitaet zu einer Behauptung, die die
 * Oberflaeche im selben Atemzug widerlegt — der Nutzer sieht zwei Knoepfe fuer
 * dieselbe Zustimmung und einen davon zaehlt. Der Satz unten drueckt deshalb
 * lauter Dinge aus, die eine Aufstimme NICHT sagen kann: erheitert, feiert,
 * zweifelt, schaut zu, ist betroffen, ist beeindruckt, bedankt sich, hat etwas
 * gelernt.
 *
 * ── GESPEICHERT WIRD EIN SCHLUESSEL, NICHT DAS ZEICHEN ─────────────────────
 * Die Spalte traegt `tada`, nicht `🎉`. Drei Gruende, alle praktisch:
 *  - Ein Emoji ist keine stabile Zeichenkette. `❤️` ist Herz PLUS
 *    Variantenselektor, `👍` kennt fuenf Hauttoene — zwei Clients schicken
 *    dasselbe Gefuehl als verschiedene Bytes, und der Unique-Index sieht zwei
 *    verschiedene Reaktionen. Ein ASCII-Schluessel hat dieses Problem nie.
 *  - Das ZEICHEN darf sich aendern (ein besser passendes Emoji, eine
 *    Darstellungs-Korrektur), ohne dass Bestandszeilen verwaisen.
 *  - Der Index laeuft auf ASCII statt auf utf8mb4-Sortierregeln.
 * Der Preis ist die eine Nachschlagetabelle unten, und die ist der Ort, an dem
 * ohnehin steht, was der Satz bedeutet.
 */

/**
 * DIE ERLAUBNISLISTE — Reihenfolge = Anzeige-Reihenfolge im „+"-Menue.
 *
 * FAIL-CLOSED: die Route prueft gegen genau diese Liste, ein unbekannter
 * Schluessel wird abgewiesen (400). Ein freier Picker ist im MVP bewusst NICHT
 * gebaut — jedes zulaessige Zeichen waere eine neue Moderationsflaeche
 * (Beleidigung per Emoji ist eine Meldung ohne Meldeweg).
 */
export const REACTION_KEYS = [
  'laugh',
  'tada',
  'thinking',
  'eyes',
  'sad',
  'fire',
  'thanks',
  'idea',
] as const

export type ReactionKey = (typeof REACTION_KEYS)[number]

/** Schluessel → angezeigtes Zeichen. Der Schluessel ist die Wahrheit. */
export const REACTION_EMOJI: Record<ReactionKey, string> = {
  laugh: '😂',
  tada: '🎉',
  thinking: '🤔',
  eyes: '👀',
  sad: '😢',
  fire: '🔥',
  thanks: '🙏',
  idea: '💡',
}

/**
 * WORAN man reagieren kann — heute genau EINE Art.
 *
 * ── WARUM DIE ANTWORT-EBENE (NOCH) FEHLT, obwohl sie naeher laege ──────────
 * In den Diskussionen ist das THEMA eine `community_posts`-Zeile (posts), die
 * ANTWORTEN darunter sind `comments`-Zeilen (comments-Layer, targetType
 * 'post'). Zwei Tabellen in ZWEI Layern. Eine Reaktionsleiste unter einer
 * Antwort hiesse deshalb eines von beidem:
 *  - `CommentItem.vue` rendert eine posts-Komponente — der comments-Layer
 *    haengt danach an posts, also genau die Abhaengigkeits-Umkehr, die A14
 *    verbietet (comments steht in jedem `extends` VOR posts). Ein Slot, an dem
 *    man sie von aussen einhaengen koennte, hat die Komponente heute nicht.
 *  - oder der comments-Layer bekommt seine EIGENE Reaktions-Tabelle und -Route
 *    — das ist die bestehende Bauart der Stimmen (`post_votes` gegen die
 *    Kommentar-Stimmen, `PostVoteButtons` gegen `VoteButtons`), also erlaubt,
 *    aber sie verdoppelt Datenmodell, Route und Oberflaeche.
 * Beides ist eine Produkt- und Architektur-Entscheidung, keine Fleissarbeit,
 * und sie gehoert David — deshalb traegt die Tabelle die Spalte `targetType`
 * VON ANFANG AN: die Antwort-Ebene ist danach ein additiver Schritt ohne
 * Migration und ohne Datenwanderung.
 */
export const REACTION_TARGET_TYPES = ['post'] as const
export type ReactionTargetType = (typeof REACTION_TARGET_TYPES)[number]

/** PURE: Ist das ein Schluessel aus dem kuratierten Satz? */
export function isReactionKey(value: unknown): value is ReactionKey {
  return typeof value === 'string' && (REACTION_KEYS as readonly string[]).includes(value)
}

/**
 * PURE: Den erlaubten Satz auf die Konfiguration einschraenken.
 *
 * Die App darf den Satz KUERZEN (`pukalani.discussions.reactions`), nie
 * erweitern: ein Zeichen, das die Registry nicht kennt, koennte sonst per
 * Config in die Datenbank wandern und waere danach nicht mehr darstellbar.
 * Leere oder unbrauchbare Konfiguration ⇒ der volle Satz (ein Produkt ohne
 * jede Reaktion schaltet man ueber das Produkt-Gate ab, nicht ueber eine leere
 * Liste).
 */
export function allowedReactions(configured?: readonly string[] | null): ReactionKey[] {
  if (!Array.isArray(configured)) return [...REACTION_KEYS]
  const picked = REACTION_KEYS.filter(key => configured.includes(key))
  return picked.length > 0 ? picked : [...REACTION_KEYS]
}

/** Die Zeilen-Form, die das Zaehlen braucht — mehr liest die Aggregation nie. */
export interface ReactionInput {
  targetId: string
  userId: string
  reaction: string
}

/** EIN Chip: Zeichen, Anzahl, und ob ich selbst dabei bin. */
export interface ReactionCount {
  reaction: ReactionKey
  count: number
  /** Habe ICH diese Reaktion abgegeben? (steuert die Hervorhebung + den Toggle) */
  mine: boolean
}

/** Ziel-Id → Chips. Genau die Form, die eine Themenseite in EINEM Rutsch braucht. */
export type ReactionSummary = Record<string, ReactionCount[]>

/**
 * PURE: Zeilen zu Chips verdichten.
 *
 * EINE Abfrage, EIN Durchlauf — die Themenseite holt die Reaktionen ALLER
 * sichtbaren Ziele gebuendelt und verteilt sie hier. Der naheliegende Weg (je
 * Beitrag eine Abfrage) waere bei 25 Beitraegen 25 Abfragen und genau die
 * N+1-Falle, die dieser Layer an anderer Stelle schon einmal bezahlt hat.
 *
 * Unbekannte Schluessel werden STILL VERWORFEN, nicht als leerer Chip
 * gerendert: sie entstehen, wenn der Satz spaeter gekuerzt wird, und ein
 * Bestandszeile-Chip ohne Zeichen waere ein Loch in der Leiste. Die Zeile
 * bleibt in der Datenbank — Kuerzen ist eine Anzeige-Entscheidung, keine
 * Loeschung.
 *
 * Die Reihenfolge der Chips folgt IMMER `REACTION_KEYS`, nie der Haeufigkeit:
 * eine Leiste, die bei jeder Reaktion die Plaetze tauscht, laesst den Nutzer
 * auf den falschen Chip klicken.
 */
export function aggregateReactions(
  rows: readonly ReactionInput[],
  viewerId: string | null,
  allowed: readonly ReactionKey[] = REACTION_KEYS,
): ReactionSummary {
  const permitted = new Set<string>(allowed)
  const counts = new Map<string, Map<ReactionKey, { count: number, mine: boolean }>>()

  for (const row of rows) {
    if (!row?.targetId || !isReactionKey(row.reaction) || !permitted.has(row.reaction)) continue

    let perTarget = counts.get(row.targetId)
    if (!perTarget) {
      perTarget = new Map()
      counts.set(row.targetId, perTarget)
    }

    const entry = perTarget.get(row.reaction) ?? { count: 0, mine: false }
    entry.count += 1
    if (viewerId && row.userId === viewerId) entry.mine = true
    perTarget.set(row.reaction, entry)
  }

  const summary: ReactionSummary = {}
  for (const [targetId, perTarget] of counts) {
    const chips = allowed
      .filter(key => perTarget.has(key))
      .map(key => ({ reaction: key, count: perTarget.get(key)!.count, mine: perTarget.get(key)!.mine }))
    if (chips.length > 0) summary[targetId] = chips
  }
  return summary
}

/**
 * PURE: Der Stand EINES Ziels nach einem Umschalten — fuer die optimistische
 * Anzeige, damit der Chip nicht erst nach der Antwort des Servers reagiert.
 *
 * Dieselbe Regel wie auf dem Server (an/aus je Schluessel), damit die Vorschau
 * nicht luegen kann: hinzugefuegt wird an der Katalog-Position, ein Chip auf 0
 * verschwindet.
 */
export function toggledChips(
  chips: readonly ReactionCount[],
  reaction: ReactionKey,
  allowed: readonly ReactionKey[] = REACTION_KEYS,
): ReactionCount[] {
  const existing = chips.find(chip => chip.reaction === reaction)
  const next = new Map(chips.map(chip => [chip.reaction, { ...chip }]))

  if (existing?.mine) {
    const updated = next.get(reaction)!
    updated.count -= 1
    updated.mine = false
    if (updated.count <= 0) next.delete(reaction)
  }
  else {
    const updated = next.get(reaction) ?? { reaction, count: 0, mine: false }
    updated.count += 1
    updated.mine = true
    next.set(reaction, updated)
  }

  return allowed.filter(key => next.has(key)).map(key => next.get(key)!)
}
