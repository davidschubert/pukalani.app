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
