/**
 * DIE ERSTE KATEGORIE EINER NEUEN COMMUNITY (2026-08-16).
 *
 * ── WAS VORHER FEHLTE ──────────────────────────────────────────────────────
 * Der Wizard sät eine Startseite, Rechtstexte, Regeln und einen Beispiel-
 * Beitrag — aber keine Kategorie. `seedWelcomePost` schrieb deshalb
 * `categoryId: ''` mit dem Kommentar „eine frische Community hat noch keine",
 * und genau das war das Problem: OHNE aktive Kategorie blenden sich BEIDE
 * Einstiege zum Eröffnen eines Themas aus (DiscussionNewTopic in der
 * Kopfzeile, die Aktion im Leerzustand von DiscussionTopics) — richtig, weil
 * `resolveCategoryId` sonst 422 wirft. Ergebnis: eine Community, in der
 * Discussions sichtbar ist, aber niemand ein Thema eröffnen kann, ohne vorher
 * im Dashboard eine Kategorie anzulegen. An einer echten Community
 * aufgeschlagen — der Owner suchte den Knopf, den es nie gab.
 *
 * Die Saat schließt das an der Wurzel: eine frische Community hat ab Minute
 * eins genau eine Kategorie, und der Beispiel-Beitrag liegt darin. Der
 * Leerzustand (siehe DiscussionTopics) bleibt trotzdem — er trägt den BESTAND,
 * der vor dieser Saat entstanden ist, und den Fall, dass jemand seine einzige
 * Kategorie stilllegt.
 *
 * ── WARUM DIE NAMEN HIER STEHEN UND NICHT IN DEN LOCALE-DATEIEN ────────────
 * `buildWelcomePostText` schlägt seine Sätze bewusst im Wörterbuch dieses
 * Layers nach — dort ist das richtig, denn der Text wird gebaut und verworfen.
 * Ein Kategorie-NAME ist etwas anderes: er wird EINMAL in eine Zeile
 * geschrieben und gehört danach der Community. Würde er aus der Locale-Datei
 * kommen, sähe es aus, als folge er der Sprache des Betrachters — er tut es
 * nicht und darf es nicht: ein späteres Umbenennen des Schlüssels dürfte
 * bestehende Zeilen nie anfassen. Konstanten sagen genau das aus.
 *
 * Der Owner kann Name, Beschreibung und Reihenfolge sofort unter
 * /dashboard/categories ändern — der SLUG bleibt fest (er ist die URL,
 * shared/types/post.ts).
 */

/** Präfix der gesäten Kategorie-Zeile — bewusst lesbar, damit sie in der Konsole auffällt. */
export const DEFAULT_CATEGORY_ROW_ID_PREFIX = 'dc-'

/**
 * Zeilen-Id der ersten Kategorie aus dem Zeilen-Scope der Community
 * (`communities.tenantId`, Form `t-<20 Zeichen>`).
 *
 * ABLEITBAR wie `welcomePostRowId` und aus demselben Grund: sie IST die
 * Idempotenz. Ein Doppelklick auf „Community anlegen" läuft in einen 409
 * statt in eine zweite Kategorie, und der Unique-Index (communityId, slug)
 * bräche sonst mit einem nackten Fehler mitten in der Anlage. Der `slice`
 * hält das 36-Zeichen-Limit einer Appwrite-Zeilen-Id ein: `dc-` + `t-` +
 * 20 Zeichen sind 25, aber ein Verstoß quittiert Appwrite mit einem
 * generischen 400, dessen Text die Ursache nicht verrät.
 */
export function defaultCategoryRowId(tenantId: string): string {
  return `${DEFAULT_CATEGORY_ROW_ID_PREFIX}${tenantId}`.slice(0, 36)
}

export interface DefaultCategorySeed {
  name: string
  /** URL-Segment — nach der Anlage FEST. */
  slug: string
  description: string
}

/**
 * Name, Slug und Beschreibung in der Sprache des Wizards. Alles Unbekannte
 * fällt auf Englisch zurück, wie überall sonst in diesem Layer.
 *
 * EINE Kategorie, nicht fünf: ein Kategorien-Baum, den niemand bestellt hat,
 * ist Aufräumarbeit für den Owner. Gebraucht wird genau so viel Struktur, dass
 * der erste Knopf erscheint — den Rest baut, wer seine Community kennt.
 */
export function defaultCategoryFor(locale: string): DefaultCategorySeed {
  if (locale === 'de') {
    return {
      name: 'Allgemein',
      slug: 'allgemein',
      description: 'Alles, was noch keine eigene Kategorie hat.',
    }
  }
  return {
    name: 'General',
    slug: 'general',
    description: 'Everything that does not have its own category yet.',
  }
}
