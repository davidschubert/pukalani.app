import type { Capability } from './authz'
import type { DashboardPlace, DashboardScope } from '../dashboardNav'
import { isDashboardScope, moduleAllowedFor, scopeVisibleAt } from '../dashboardNav'

/**
 * KENNZAHLEN-REGISTRY der Dashboard-Übersicht (`pukalani.admin.stats`, U9/K2,
 * 2026-08-11).
 *
 * WARUM ES SIE GIBT: die Kachel-Reihe der Übersicht kannte drei fest verdrahtete
 * Zahlen — `usersTotal`, `commentsTotal`, `commentsReported`. Alle drei stammen
 * aus der Zeit, als es nur `apps/comments` gab. Im Pool ist `usersTotal`
 * bewusst `null` (Befund B2: Projekt-Nutzer ≠ Mitglieder DIESER Community), und
 * `commentsReported` erscheint nur mit `comments.moderate`. Dem Owner einer
 * Community, deren Produkt Beiträge, Termine oder Kurse sind, blieb damit auf
 * seiner Landeseite GENAU EINE Zahl, und die zählte Kommentare — ein Produkt,
 * das er womöglich gar nicht gebucht hat.
 *
 * Der admin-Layer darf die Frage auch gar nicht selbst beantworten: „wie viele
 * Beiträge hat dieser Mandant?" kann nur beantworten, wer die TABELLE kennt,
 * und die kennt jeder Produkt-Layer nur für sich (A14 — admin dürfte
 * `POSTS_TABLE` nicht importieren). Deshalb dasselbe Muster wie bei
 * `pukalani.admin.notices`: der Layer, dem die Zahl gehört, meldet die KACHEL
 * an; die Übersicht rendert die gefilterte Menge.
 *
 * ZWEI HÄLFTEN, ZWEI ORTE — und das ist Absicht:
 *
 *  - **Die Kachel** (dieser Vertrag) steht in `app.config` und beantwortet
 *    „WO, für WEN und mit welchem WORT". Sie wird gemergt, ist ohne Request
 *    bekannt und trägt keine Daten.
 *  - **Die Zahl** (`core/server/utils/dashboardStatValues.ts`) kommt aus EINER
 *    gebündelten Route. Die Übersicht ist die meistbesuchte Dashboard-Seite;
 *    eine Kachel, die sich ihre Zahl selbst holt, wäre ein Fetch pro Kachel.
 *
 * Form wie bei `notices` (OBJEKT-MAP, Key = stabile Id) und NICHT wie bei den
 * Reitern (Array): defu merged die Map additiv über die Layer, und eine App
 * kann einen einzelnen Eintrag mit `false` abschalten. Ein Array ließe sich nur
 * verlängern — und eine Kachel, die eine App NICHT will, wäre nicht abzuwählen.
 *
 * Gefiltert wird mit derselben Trias wie die `communityTabs`
 * (Ort × Capability × Produkt-Gates, `resolveSettingsTabs`) — dieselbe Frage,
 * dieselbe Regel. NUR UX: die Autorität bleibt der Gate der Route, und die
 * Zahl selbst liefert nur, wer sie liefern darf (der Werte-Vertrag gated
 * zusätzlich, s. dort).
 */
export interface PukalaniDashboardStat {
  /**
   * EBENE der Kachel — dieselbe Bedeutung und dieselbe pure Regel wie bei
   * `PukalaniAdminModule.scope` und `PukalaniSettingsTab.scope`. PFLICHT, damit
   * kein geratener Default eine Kachel an den falschen Ort legt: genau daran
   * hing `usersTotal`. Die Nutzerzahl ist eine BETREIBER-Zahl (`operator`) —
   * im Silo ist das Projekt die Site und die Zahl stimmt, auf einem
   * Mandanten-Host gibt es sie nicht.
   */
  scope: DashboardScope
  /** i18n-Key der Beschriftung unter der Zahl. */
  labelKey: string
  /** Icon (i-ph-…) */
  icon: string
  /**
   * Ziel-Pfad OHNE Locale-Prefix — die Seite wendet `localePath()` an. Eine
   * Kachel ohne `to` ist reine Anzeige (kein Link ins Nichts).
   */
  to?: string
  /** Query-Teil des Ziels (z. B. `{ status: 'reported' }`). */
  query?: Record<string, string>
  /**
   * Wer die Zahl überhaupt zu sehen bekommt. Geprüft wird gegen dieselben zwei
   * Quellen wie die Nav (Operator-Label ODER Rolle in dieser Community, N1).
   *
   * SIE IST ZUGLEICH DAS NETZ UNTER DEM LINK (Befund S5): eine Kachel führt in
   * eine Seite, und eine Kachel, die in ein 403 führt, lügt. Deshalb trägt sie
   * die Capability IHRER ZIELSEITE, nicht das schwächere `dashboard.access`.
   */
  requiredCapability: Capability
  /** Sortierung (aufsteigend, Default 50). */
  order?: number
  /**
   * DIE DREI PRODUKT-GATES — wortgleich mit `PukalaniAdminModule` und
   * `PukalaniSettingsTab`, weil sie dieselbe Frage beantworten und von
   * derselben puren Regel gelesen werden.
   *
   * `productKey` = Betreiber-Schalter zur Laufzeit (app_config) ·
   * `planProduct` = Tarif dieser Community · `configFlag` = Bau-Schalter der
   * App. Ohne sie zeigte die Übersicht eine Beitrags-Kachel in einer Community,
   * deren Tarif Beiträge nicht enthält — dieselbe Lüge wie ein Menüpunkt, der
   * in eine Wand führt (C2).
   */
  productKey?: string
  planProduct?: string
  configFlag?: string
  /**
   * i18n-Key einer Zusatzzeile für den LEERZUSTAND.
   *
   * Eine Kachel mit 0 zeigt 0 — das ist die ehrliche Zahl und wird nicht
   * versteckt. Sie darf aber sagen, was als Nächstes zu tun wäre („Einladen").
   * BEWUSST kein zweiter Knopf: das Ziel ist dasselbe `to`, das die Kachel
   * ohnehin hat. Die Führung durch die ersten Schritte bleibt die
   * Willkommens-Checkliste (AP2) — zwei Aufforderungen für dieselbe Sache
   * wären eine zu viel.
   */
  emptyHintKey?: string
  /**
   * Ab WELCHER Zahl der Leerzustand vorbei ist (Default 1, also „leer" = 0).
   *
   * Es gibt Kacheln, deren Leerzustand nicht bei null liegt: die Mitgliederzahl
   * enthält den Owner und ist deshalb NIE 0 — allein ist er trotzdem, und genau
   * dann ist „Einladen" der nützliche Satz. Ohne diesen Schwellwert wäre der
   * Hinweis dort toter Code (`emptyBelow: 2`).
   */
  emptyBelow?: number
}

/** `false` = Kachel von einer App/einem späteren Layer bewusst abgeschaltet. */
export type PukalaniDashboardStatConfig = Record<string, PukalaniDashboardStat | false>

/** Eine aufgelöste Kachel — die Registry-Id wandert als `id` mit. */
export type ResolvedDashboardStat = PukalaniDashboardStat & { id: string }

/**
 * DIE ZAHL zu einer Kachel — was die gebündelte Route je Id liefert.
 *
 * WER NICHTS LIEFERT, HAT KEINE KACHEL: fehlt eine Id in der Antwort, entfällt
 * sie. Das ersetzt das frühere `null`-Feld (`usersTotal: null`) und sagt
 * dasselbe deutlicher — „diese Zahl wird für diesen Aufrufer bewusst nicht
 * ausgewiesen", statt eine fremde oder eine erfundene 0 zu zeigen.
 */
export interface DashboardStatValue {
  /**
   * Die Zahl. `null` heißt: diese Kachel lebt von `textKey` (Zustands-Kachel
   * wie der Plan — „Pro" ist keine Zahl, aber es ist die Antwort).
   */
  value: number | null
  /**
   * Kontingent für „x von y". Nur gesetzt, wo es wirklich eine Grenze gibt —
   * die Grenze ist eine Tarif-Frage und wird an EINER Stelle aufgelöst
   * (`tenantLimitsFor`, tenantQuota.ts). Ohne Quota steht dort nichts, und die
   * Kachel zeigt schlicht die Zahl.
   */
  limit?: number
  /**
   * i18n-Key als PRIMÄRTEXT statt einer Zahl (Zustands-Kacheln).
   *
   * Der Schlüssel kommt vom LIEFERNDEN Layer, genau wie `labelKey` von der
   * deklarierenden Seite — die Übersicht rendert ihn, ohne den Layer zu kennen
   * (A14). Ein fest verdrahtetes `t('onboarding.subscription…')` im
   * admin-Markup wäre exakt das String-Coupling, das dieser Vertrag vermeidet.
   */
  textKey?: string
  /** i18n-Key einer Zusatzzeile (z. B. „Noch 12 Tage Testphase"). */
  hintKey?: string
  /** Zähler für die Pluralisierung von `hintKey`. */
  hintCount?: number
}

/**
 * Die sichtbaren Kacheln, sortiert. PURE (unit-getestet), damit Seite, Route
 * und Test dieselbe Wahrheit lesen.
 *
 * Es ist BEWUSST dieselbe Regel wie bei Reitern und Menüpunkten
 * (`resolveSettingsTabs`, `filterDashboardModules`): eine Kachel, ein Reiter
 * und ein Menüpunkt beantworten dieselbe Frage — „darf das hier stehen?" —,
 * und drei Regelwerke für eine Frage laufen auseinander.
 *
 * DIE ROUTE FILTERT MIT DERSELBEN FUNKTION, und das ist der Punkt: sie sammelt
 * nur Zahlen ein, die dieser Betrachter an diesem Ort auch sehen dürfte. Ohne
 * das wäre die gebündelte Route eine Abkürzung um die Capability herum.
 *
 * Ein unbekanntes `scope` fällt heraus (fail-closed) — wie überall.
 */
export function resolveDashboardStats(
  stats: PukalaniDashboardStatConfig | undefined,
  filter: {
    place: DashboardPlace
    canAsOperator: (capability: Capability) => boolean
    canAsMember: (capability: Capability) => boolean
    /** Laufzeit-Produkt-Gate (F2) — ohne Angabe zählt jedes Produkt als an. */
    productOn?: (productKey: string | undefined) => boolean
    /** Tarif-Produkt-Gate im Pool (C2) — nur bei gesetztem `planProduct`. */
    planOn?: (planProduct: string) => boolean
    /** Bau-Schalter der App (F37) — nur bei gesetztem `configFlag`. */
    configOn?: (configFlag: string) => boolean
  },
): ResolvedDashboardStat[] {
  const productOn = filter.productOn ?? (() => true)
  const planOn = filter.planOn ?? (() => true)
  const configOn = filter.configOn ?? (() => true)
  return Object.entries(stats ?? {})
    .flatMap(([id, stat]) => (stat ? [{ id, ...stat }] : []))
    .filter(stat =>
      isDashboardScope(stat.scope)
      && scopeVisibleAt(stat.scope, filter.place)
      && moduleAllowedFor(stat, filter)
      && productOn(stat.productKey)
      && (stat.planProduct === undefined || planOn(stat.planProduct))
      && (stat.configFlag === undefined || configOn(stat.configFlag)))
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
}
