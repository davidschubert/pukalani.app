import { ugcTranslationErrorKey, ugcTranslationFor, type UgcTranslationEntry } from '../../shared/ugcTranslations'

/**
 * DER KNOPF „ÜBERSETZEN" AN EINEM INHALT (Paket 3 zu Davids Entscheidungen
 * vom 2026-08-17: ein Knopf je Inhalt, keine Automatik, nur Eingeloggte).
 *
 * ── WARUM IN CORE ─────────────────────────────────────────────────────────
 * Zwei Konsumenten in zwei Produkt-Layern (`posts` und `comments`), und
 * `comments` steht in jedem `extends` VOR `posts` und darf von dort nichts
 * holen (A14). Dieselbe Aufteilung wie bei der Auflösung selbst
 * (`core/shared/ugcTranslations.ts`): die REGEL liegt hier, das DATENMODELL bei
 * jedem Produkt.
 *
 * ── DIE ROUTE RUFT DER AUFRUFER, NICHT DIESE DATEI ────────────────────────
 * `translate()` kommt als Funktion herein, statt dass hier eine URL
 * zusammengesetzt würde. Zwei Gründe, und beide sind mehr als Geschmack:
 *  - Die Antworten sind VERSCHIEDEN (`PostTranslateResponse` trägt einen Titel,
 *    `CommentTranslateResponse` nicht) und leben in den `shared/types/` ihrer
 *    Layer — core kennt sie nicht und soll sie nicht kennen.
 *  - Seit dem 2026-08-14 nennt JEDER gebundene `$fetch` seinen Antworttyp
 *    (ESLint erzwingt es in `app/**`). Ein `$fetch` an DIESER Stelle müsste
 *    einen Typ erfinden, der für beide Produkte gleichzeitig stimmt — die
 *    Aufrufstellen tun es typisiert und ohne Erfindung.
 *
 * ── ALLES REAKTIV AUS DER ZEILE, NICHTS ABGESCHRIEBEN ─────────────────────
 * `translations` kommt als GETTER herein, nicht als Wert. Der Grund ist ein
 * konkreter Zustand, in dem die Oberfläche sonst lügt: eine Bearbeitung des
 * Originals LEERT die Spalte (`[id].patch.ts`), und über Realtime steht die neue
 * Zeile Sekunden später in der Liste. Wer die Spalte einmal abgeschrieben hat,
 * zeigt weiter die Übersetzung eines Textes, den es nicht mehr gibt. Mit dem
 * Getter fällt die Anzeige in genau diesem Moment auf die Grundfassung zurück
 * (`watch` auf `entry` unten) — sichtbar, aber ehrlich.
 *
 * ── ZWEI QUELLEN, WEIL DIE ZEILE HINTERHERHINKT ───────────────────────────
 * Nach einem Klick liegt die frische Fassung in der ANTWORT der Route; die
 * Zeile im Browser trägt sie erst, wenn sie neu gelesen wird (Realtime,
 * Seitenwechsel). Deshalb gibt es `fetched` neben der Spalte — die Spalte
 * gewinnt, sobald sie etwas sagt, und jede Änderung an ihr wirft den eigenen
 * Merker weg (sie ist die Wahrheit, er war nur die Überbrückung).
 *
 * ── WARUM ES KEIN „IST KI VERFÜGBAR?"-FLAG GIBT ───────────────────────────
 * Gesucht, nicht gefunden: `isAiAvailable()` ist eine SERVER-Auskunft aus Env
 * (`NUXT_AI_KEY`) und Build-Config, kein Feld der `app_config`-Zeile — die
 * einzigen Träger, die sie heute an einen Client geben, sind
 * `posts/moderation.get` (`aiAssist`) und `posts/categories/manage.get`
 * (`aiTranslate`), zwei Verwaltungs-Routen, die ein Feed nie lädt. Sie in
 * `PublicAppConfig` zu heben verbietet der Typ dort ausdrücklich („neue Felder
 * sind erst mal server-only"), und eine eigene Route nur für diese Frage wäre
 * ein Abruf auf jeder Seite für einen Knopf, den fast überall jemand nie
 * drückt. Also: der Knopf steht da, und die 503 der Route wird zu einem
 * Hinweis — genau der Fall, den die Routen im Kopf „das Netz" nennen.
 */

export interface UgcTranslationSource {
  /** Die `translations`-Spalte der Zeile — als GETTER (siehe Kopf). */
  translations: () => string | null | undefined
  /** Der Grundtext. Leer ⇒ es gibt nichts zu übersetzen, also keinen Knopf. */
  body: () => string
  /** Ruft die Übersetzungs-Route DES PRODUKTS, typisiert dort. */
  translate: (locale: string) => Promise<UgcTranslationEntry>
}

export function useUgcTranslation(source: UgcTranslationSource) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const { isLoggedIn } = useCurrentUser()

  const busy = ref(false)
  const showing = ref(false)
  /** Was die Route zuletzt geliefert hat, samt Sprache — die Überbrückung,
   *  bis die Zeile selbst sie trägt. */
  const fetched = ref<{ locale: string, entry: UgcTranslationEntry } | null>(null)

  const column = computed(() => source.translations() ?? '')
  const entry = computed<UgcTranslationEntry | null>(() => {
    const fromColumn = ugcTranslationFor(column.value, locale.value)
    if (fromColumn) return fromColumn
    const own = fetched.value
    return own && own.locale === locale.value ? own.entry : null
  })

  // Die Zeile hat sich bewegt ⇒ sie ist die Wahrheit, der eigene Merker geht.
  watch(column, () => { fetched.value = null })
  /**
   * Nichts (mehr) da ⇒ zurück auf die Grundfassung. Das deckt BEIDE Wege in
   * denselben Zustand ab: die Bearbeitung, die die Spalte leert, und den
   * Sprachwechsel, nach dem für die neue Sprache noch nichts übersetzt ist.
   */
  watch(entry, (value) => { if (!value) showing.value = false })

  /**
   * Nur Eingeloggte (die Route antwortet Gästen 401) und nur, wo Text steht.
   * Im Embed sind Gäste nie eingeloggt — dort verschwindet der Knopf damit von
   * selbst, ohne dass dieser Layer das Embed kennen müsste.
   */
  const canTranslate = computed(() => isLoggedIn.value && source.body().trim().length > 0)

  async function show() {
    if (busy.value) return
    // Schon da (aus der Spalte oder vom letzten Klick): sofort tauschen, kein
    // Abruf. Genau dafür reist die Spalte in den Listen-Antworten mit.
    if (entry.value) {
      showing.value = true
      return
    }
    // Die Sprache FESTHALTEN: wer während des Wartens umschaltet, soll nicht
    // die Fassung der alten Sprache untergeschoben bekommen.
    const target = locale.value
    busy.value = true
    try {
      const result = await source.translate(target)
      fetched.value = { locale: target, entry: result }
      if (locale.value === target) showing.value = true
    }
    catch (error) {
      const status = (error as { status?: number, statusCode?: number } | null)?.status
        ?? (error as { statusCode?: number } | null)?.statusCode
      /**
       * Der GRUND, nicht nur der Status: zwei 429 sagen Verschiedenes — die
       * Burst-Drossel ist in Minuten vorbei, der Tages-Deckel erst morgen.
       * `data.reason` ist das Feld, in das der zentrale Handler den `code` der
       * Route hebt (core/server/error.ts); fehlt es, bleibt es beim bisherigen
       * Text (die pure Abbildung behandelt `undefined` ausdrücklich).
       */
      const reason = (error as { data?: { reason?: string } } | null)?.data?.reason
      const key = ugcTranslationErrorKey(status, reason)
      toast.add({ title: t(key), description: t(`${key}Hint`), color: 'error' })
    }
    finally {
      busy.value = false
    }
  }

  function showOriginal() {
    showing.value = false
  }

  return {
    /** Zeigt die Oberfläche den Knopf überhaupt? */
    canTranslate,
    /** Steht gerade die Übersetzung da? */
    showing,
    busy,
    /** Die anzuzeigende Fassung — `null` heißt „es gibt keine". */
    entry,
    show,
    showOriginal,
  }
}
