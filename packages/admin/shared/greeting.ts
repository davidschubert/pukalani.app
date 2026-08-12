/**
 * „WILLKOMMEN ZURÜCK" BEIM ALLERERSTEN BESUCH (Trichter-G2, S4-Nachbarschaft).
 *
 * Die Übersicht begrüßte JEDEN mit `admin.overview.greeting` — „Willkommen
 * zurück, {name}" —, auch den Owner, der seine Community vor 40 Sekunden
 * angelegt hat und sie zum ersten Mal sieht. Der Satz ist dort schlicht falsch,
 * und er ist das Erste, was ein Neukunde von seinem Produkt liest.
 *
 * DIE QUELLE, UND WARUM DIESE: das ALTER DES KONTOS
 * (`user.$createdAt`) — ein Wert, der im SSR-Payload ohnehin steht (der
 * Auth-Store hydriert den ganzen Nutzer), also null zusätzliche Abfragen,
 * keine neue Spalte, keine neue Tabelle.
 *
 * Geprüft und verworfen:
 *  - **Ein „zuletzt gesehen"-Merker** (prefs oder Tabelle): das wäre die
 *    exakte Antwort, kostet aber einen SCHREIBVORGANG bei jedem Aufruf der
 *    meistbesuchten Dashboard-Seite — für einen Begrüßungssatz.
 *  - **Alter der MITGLIEDSCHAFT**: genauer für Beigetretene, liegt aber im
 *    Control Plane (`community_members`) und wäre ein Ruf über die
 *    Service-Naht, den diese Seite sonst nicht braucht.
 *  - **Alter der COMMUNITY** aus `trialEndsAt` minus Testphasen-Länge:
 *    rückgerechnet und damit falsch, sobald der Betreiber eine Testphase
 *    verlängert (F49-Ausweg) — die Begrüßung fiele grundlos zurück.
 *
 * WAS DIE HEURISTIK BEWUSST NICHT KANN: wer sein Konto vor Monaten angelegt
 * hat und heute seine ZWEITE Community gründet, bekommt „Willkommen zurück".
 * Das ist für diese Person wahr — sie kennt Pukalani. Der Fall, den G2
 * anprangert (Registrierung → Wizard → Dashboard in wenigen Minuten), liegt
 * immer innerhalb des Fensters.
 */

/** Wie lange ein Konto als „gerade erst dazugekommen" gilt. */
export const ARRIVAL_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * Erstbesuch-Begrüßung statt „willkommen zurück"?
 *
 * Unbekanntes oder unlesbares Datum ⇒ `false`: „Willkommen zurück" ist der
 * Bestandsfall und für die überwiegende Mehrheit richtig — geraten wird nicht.
 * Ein Datum in der Zukunft (Uhr-Versatz) zählt als eben angelegt.
 */
export function isArrivalGreeting(accountCreatedAt: string | undefined | null, now: number, windowMs = ARRIVAL_WINDOW_MS): boolean {
  if (!accountCreatedAt) return false
  const created = Date.parse(accountCreatedAt)
  if (Number.isNaN(created)) return false
  return now - created < windowMs
}
