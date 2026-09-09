/**
 * Chrome-Registry (Header/Footer der öffentlichen Community-Seiten):
 * Produkt-Layer registrieren ihre Nav-Einträge und Header-Utilities in
 * app.config (`pukalani.chrome.nav` / `pukalani.chrome.utilities`), das
 * blueprint-default-Layout rendert daraus — genau wie die Dashboard-Nav
 * über `pukalani.admin.modules` (A14: expliziter Vertrag statt Hardcode).
 *
 * Form: OBJEKT-MAP statt Array (bewusst, Audit S9). Beides merged defu
 * additiv über Layer, aber nur die Map erlaubt zusätzlich, dass eine App
 * einen einzelnen Eintrag ÜBERSCHREIBT oder mit `false` ABSCHALTET
 * (z. B. platform: `whatsNew: false`) — ein Array ließe sich nur noch
 * verlängern. Der Key ist die stabile ID (Dedup inklusive).
 *
 * Liegt in core (Fundament), damit alle Layer den Vertrag nutzen können,
 * ohne sich gegenseitig zu importieren.
 */

/** Eintrag der Haupt-Navigation (Inline-Reihe mit Überlauf-Dropdown). */
export interface PukalaniChromeNavEntry {
  /** i18n-Key des Labels (der Text gehört dem registrierenden Layer) */
  labelKey: string
  /** Ziel-Pfad OHNE Locale-Prefix — das Layout wendet localePath() an */
  to: string
  /** Icon (i-ph-…) — nur im Überlauf-Dropdown sichtbar */
  icon?: string
  /** Sortierung (aufsteigend, Default 50) */
  order?: number
  /** Laufzeit-Produkt-Gate (F2): Eintrag verschwindet, wenn das Produkt aus ist */
  productKey?: string
  /**
   * Produkt-Gate im Pool (P4): sichtbar nur, wenn der Tenant-Plan das
   * Produkt enthält (useTenantPlan().planAllows); auf Demo-Hosts hängt
   * das Layout zusätzlich das Plan-Badge („Ab Personal") an.
   */
  planProduct?: string
  /** Nur für eingeloggte Besucher sichtbar */
  requiresAuth?: boolean
  /**
   * STANDARD-HAUPTPUNKT DIESES EINTRAGS (U15 Teil 3 Nachtrag, 2026-09-08) — die
   * Id eines ANDEREN Eintrags DERSELBEN Map, unter dem dieser als Unterpunkt
   * erscheint. Fehlend = ein gewöhnlicher Hauptpunkt, also exakt das Verhalten
   * von vor diesem Tag (additiv).
   *
   * ── WARUM DER BAUPLAN GRUPPEN VORGEBEN DARF ─────────────────────────────
   * Davids Korrektur am Prototyp vom 2026-09-08: das STANDARD-Menü von
   * branding.supply lautet „Products ▾ (Brand Score) · Discover Brands · About
   * · Team". Bis dahin entstanden Unterpunkte AUSSCHLIESSLICH über die
   * gespeicherte Owner-Wahl (`CommunityNavOverrideEntry.parent`) — die Registry
   * konnte nur eine flache Reihe beschreiben. Eine Site hätte ihr eigenes
   * Standard-Menü also erst per Klick im Editor herstellen können, und eine
   * frische Instanz derselben Software hätte anders ausgesehen als die
   * beworbene. Der BAUPLAN gehört dem Layer, deshalb steht die Vorgabe hier.
   *
   * `to: ''` ist ausdrücklich ERLAUBT und heisst „Aufklapper ohne eigene Seite"
   * — dieselbe Bedeutung wie `to === ''` bei `CommunityNavItem` (dort geprüft
   * über `navItemHasTarget()`). Ein Aufklapper braucht so keine Seite, die es
   * nicht gibt.
   *
   * GENAU EINE EBENE, und die Gates gelten für den Gruppen-Eintrag SELBST:
   * fällt die Gruppe per `productKey`/`requiresAuth`/`planProduct` weg, rücken
   * ihre Kinder nach Zusage 6 auf die oberste Ebene — nichts verschwindet.
   */
  parent?: string
}

/** Header-Utility rechts (Buttons/Menüs — DisplaySettingsMenu, Bell, …). */
export interface PukalaniChromeUtility {
  /**
   * Komponenten-Name. Die Komponente MUSS global registriert sein
   * (Datei-Suffix `.global.vue` im besitzenden Layer), sonst kann
   * `<component :is>` den String zur Laufzeit nicht auflösen.
   */
  component: string
  /** Sortierung (aufsteigend, Default 50) */
  order?: number
  /** Laufzeit-Produkt-Gate (F2) */
  productKey?: string
  /** Nur für eingeloggte Besucher rendern */
  requiresAuth?: boolean
  /**
   * Platzierung: 'menu' (Default) = Utility-Reihe rechts im Header;
   * 'overlay' = außerhalb des Headers (schwebende Widgets wie der
   * FeedbackButton — fixed-positioniert, gehört semantisch nicht in die Nav).
   */
  zone?: 'menu' | 'overlay'
}

/**
 * AKTION NEBEN EINEM AUTORENNAMEN (F56, 2026-08-11).
 *
 * Dieselbe Registry-Idee wie `utilities`, aber eine Etage tiefer: nicht im
 * Kopf der Seite, sondern dort, wo ein MENSCH steht — an der Kopfzeile eines
 * Beitrags und eines Kommentars. Erster (und bisher einziger) Eintrag ist
 * „Nachricht schreiben" aus dem messages-Layer.
 *
 * ── WARUM EINE REGISTRY UND KEINE DIREKTE VERDRAHTUNG ────────────────────
 * Der Knopf gehört `messages`, die Kopfzeilen gehören `posts` und `comments`.
 * Kein Produkt-Layer darf einen anderen kennen (A14), und `blueprint` — der
 * EINZIGE Layer, der das dürfte — kommt hier nicht heran: er komponiert
 * SEITEN, die Autorenzeile liegt im Inneren von `PostCard`/`CommentItem`.
 * Also derselbe Ausweg wie bei der Glocke: core besitzt den VERTRAG, das
 * anzeigende Produkt rendert ihn, das besitzende Produkt trägt sich ein.
 * Niemand importiert jemanden.
 *
 * ── UNTERSCHIED ZU `utilities`: HIER FLIESSEN PROPS ──────────────────────
 * Eine Utility ist ein Knopf ohne Gegenstand. Eine Autoren-Aktion hat einen:
 * `CoreAuthorActions` reicht `userId` und `handle` an jede eingetragene
 * Komponente durch. Eine Komponente, die damit nichts anfangen kann, muss
 * sich SELBST ausblenden — genau das tut `MessageWriteButton` (kein Handle,
 * eigenes Profil, nicht angemeldet ⇒ kein Knopf).
 */
export interface PukalaniChromeAuthorAction {
  /**
   * Komponenten-Name. MUSS global registriert sein (Datei-Suffix
   * `.global.vue` im besitzenden Layer), sonst kann `<component :is>` den
   * String zur Laufzeit nicht auflösen — dieselbe Bedingung wie bei den
   * Utilities.
   */
  component: string
  /** Sortierung (aufsteigend, Default 50) */
  order?: number
  /** Laufzeit-Produkt-Gate (F2) */
  productKey?: string
  /** Plan-Gate im Pool (P4) — useTenantPlan().planAllows */
  planProduct?: string
}

/** `false` = Eintrag von einer App/einem späteren Layer bewusst abgeschaltet. */
export type PukalaniChromeNavConfig = Record<string, PukalaniChromeNavEntry | false>
export type PukalaniChromeUtilityConfig = Record<string, PukalaniChromeUtility | false>
export type PukalaniChromeAuthorActionConfig = Record<string, PukalaniChromeAuthorAction | false>
