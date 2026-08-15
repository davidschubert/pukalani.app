/**
 * WORAUF in DIESEM Produkt reagiert werden darf (F57 Mechanik 1).
 *
 * ── DER REST DIESER DATEI IST AM 2026-08-14 NACH CORE GEZOGEN ──────────────
 * Der kuratierte 8er-Satz, die Erlaubnis-Regel und die pure Zaehl-/Umschalt-
 * Rechnung leben jetzt in `core/shared/reactions.ts`. Grund ist Davids
 * Entscheidung vom 2026-08-13, Reaktionen auch auf ANTWORTEN zuzulassen: die
 * Antworten sind `comments`-Zeilen, und `comments` steht in jedem `extends` VOR
 * `posts` — ein Import von hier waere die A14-Umkehr. Die vollstaendige
 * Begruendung (inklusive der verworfenen zweiten Liste) steht im Kopf der
 * Core-Datei. HIER importieren: `../../core/shared/reactions`.
 *
 * ── WAS GEBLIEBEN IST, UND WARUM AUSGERECHNET DAS ──────────────────────────
 * Der Ziel-Katalog beschreibt, WORAUF dieses Produkt Reaktionen zulaesst, und
 * das weiss nur das Produkt. Core kennt den SATZ, nicht die Ziele; `comments`
 * braucht gar keinen (dort steht die Ziel-Id im Pfad, es gibt nur Kommentare).
 * Ein gemeinsamer Katalog waere eine Liste, in der jeder Layer die Eintraege
 * der anderen mitschleppt.
 *
 * ── WARUM DIE ANTWORT-EBENE HIER TROTZDEM NICHT AUFTAUCHT ──────────────────
 * Sie ist gebaut, aber im comments-Layer und mit EIGENER Tabelle
 * (`comment_reactions`, comments-019) — der zweite der beiden Wege, die das
 * Konzept gegeneinander gestellt hat, und der einzige ohne A14-Bruch. Die
 * Spalte `targetType` in `discussion_reactions` bleibt deshalb auf 'post'
 * stehen: sie war als Platzhalter fuer eine gemeinsame Tabelle gedacht, und
 * diese Tabelle gibt es bewusst nicht. Sie zu entfernen waere eine
 * Datenwanderung ohne Gewinn.
 */
export const REACTION_TARGET_TYPES = ['post'] as const
export type ReactionTargetType = (typeof REACTION_TARGET_TYPES)[number]
