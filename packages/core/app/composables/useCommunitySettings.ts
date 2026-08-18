/**
 * Die am Mandanten GESETZTEN Einstellungen DIESER Community — SSR-gespiegelt
 * via tenant-brand-Plugin, reisen im Payload.
 *
 * HIESS BIS 2026-08-17 `useTenantBranding`/`TenantBranding` (Davids
 * Umbenennung). Zwei Gründe, und beide sind inhaltlich:
 *   1. „Tenant" ist die Alt-Vokabel. Seit E8-3 heißt die Sache im ganzen Haus
 *      COMMUNITY (`communityId`, `communities`); nur dieser Typ hielt den
 *      alten Namen fest.
 *   2. „Branding" stimmte nicht mehr, sobald hier etwas steht, das keine Optik
 *      ist. Ein Name, der die Hälfte seines Inhalts verschweigt, lädt genau
 *      dazu ein, den nächsten unpassenden Wert auch noch hineinzulegen.
 *
 * NICHT MITBENANNT und das mit Absicht: die Spiegel-TABELLE heißt weiter
 * `community_branding` (D6). Ein Tabellenname ist Daten, kein Bezeichner —
 * ihn zu ändern hieße migrieren, auf jeder Instanz, für null Gewinn. Dasselbe
 * gilt für die Route `PATCH /api/community/branding` (öffentlicher Vertrag)
 * und die Plugin-Dateinamen.
 *
 * ABGRENZUNG zu `TenantPolicy` daneben: hier stehen WAHLEN der Community, dort
 * REGELN, die der Server durchsetzt (Registrierung offen? Publikum?). Ein
 * Zeitzonen-Wert ist eine Wahl, keine Regel.
 *
 * Drei Zustände, und der dritte ist der wichtige:
 *   { theme: 'crimson', … } = die Community hat gewählt
 *   { theme: '', … }        = Tenant-Host OHNE eigene Wahl — die
 *                             Instanz-Einstellung (app_config.themeSettings)
 *                             gilt
 *   null                    = KEIN Tenant-Host (Silo-App, Kontroll-Host,
 *                             Playground); dort gehört die Optik der Instanz
 *
 * DREI FELDER, JEDES MIT DEMSELBEN LEER-ZUSTAND: `theme`, `variant` und — seit
 * dem 2026-07-29 (Davids Entscheidung, Rest von OPEN-ITEMS B5) — `neutral`, die
 * gedeckte Grau-Tönung (`data-neutral`, control-020). Sie ist eine EIGENE
 * Achse: eine Community kann die Palette wählen, ohne ein Theme zu wählen.
 *
 * Bewusst NICHT der aufgelöste Zustand: was der Besucher gerade SIEHT, sagt
 * useTheme() — hier geht es um das, was die Community EINGESTELLT hat, sonst
 * zeigte das Dashboard dem Owner eine andere Farbe als die eigene Wahl.
 * Seit dem 2026-07-29 (Davids Entscheidung B5) ist dieser State auch die
 * QUELLE der Auflösung: auf einem Mandanten-Host gewinnt die Community, das
 * Theme-Cookie des Besuchers wird dort nicht gelesen (Regel:
 * packages/themes/shared/themeSelection.ts). Vorher gewann immer das Cookie —
 * damit sah jeder Besucher mit eigener Theme-Wahl JEDE Community in seinen
 * Farben.
 *
 * Die AUTORITÄT ist das Control Plane (communities.theme/variant/neutral);
 * geschrieben wird über PATCH /api/community/branding (onboarding-Layer →
 * Control Plane). Nach dem Schreiben ist dieser Wert bis zum Ablauf des
 * Resolver-Caches (≤30 s) veraltet — die Seite übernimmt deshalb den Wert aus
 * der ANTWORT.
 *
 * LIVE SEIT D6 (2026-08-01): dieselbe Route spiegelt den bestätigten Zustand in
 * die read(any)-Tabelle `community_branding` des RUNTIME-Projekts, und
 * `realtime-branding.client.ts` schreibt ein Spiegel-Event direkt in diesen
 * State — offene Fenster (auch die von Gästen) morphen ohne Reload. Wer diesen
 * State liest, muss also damit rechnen, dass er sich zur Laufzeit ändert; wer
 * ihn SETZT, sollte den bestätigten Zustand setzen, nicht den gewünschten.
 */
export interface CommunitySettingsSelection {
  /** Built-in-Theme-Id oder '' = Instanz-Einstellung. */
  theme: string
  /** Tonale Variante oder '' = Basisfarbe. */
  variant: string
  /** Neutral-Palette (NEUTRAL_REGISTRY-Id) oder '' = Instanz-Voreinstellung. */
  neutral: string
}

export function useCommunitySettings() {
  const branding = useState<CommunitySettingsSelection | null>('pukalani-community-settings', () => null)
  /** true = dieser Host gehört einer Community (nur dann ist die Wahl sinnvoll). */
  const isTenantHost = computed(() => branding.value !== null)
  return { branding, isTenantHost }
}
