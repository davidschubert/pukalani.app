/**
 * Hinweis-Registry über dem Register-Formular (`pukalani.auth.notices`, U2).
 *
 * Dieselbe Bauart wie `pukalani.admin.notices` — und aus demselben Grund: der
 * erste Fall ist der ehrliche Satz „Mitmachen kann jeder, für eine EIGENE
 * Community brauchst du derzeit eine Einladung" (DECISION-LOG 2026-07-27
 * Punkt 4). Der gehört dem onboarding-Layer: dort liegt die Service-Naht, die
 * den Tor-Zustand kennt, und dort liegt die Seite, auf die der Satz verlinkt.
 * Die Register-Seite gehört dem CORE und wird von JEDER App geerbt — ein
 * `<OnboardingFoundingNotice />` in ihrem Markup wäre in apps/comments ein
 * Komponentenname, den nichts auflöst (A14).
 *
 * KEINE Capability wie bei den Admin-Hinweisen: diese Seite sieht man
 * ausgeloggt, es gibt dort niemanden zu prüfen. Ob ein Hinweis TATSÄCHLICH
 * etwas rendert (Tor offen? Mandanten-Host?), entscheidet die Komponente
 * selbst — hier steht nur, dass sie überhaupt gefragt wird.
 */

export interface PukalaniAuthNotice {
  /**
   * Komponenten-Name. Die Komponente MUSS global registriert sein
   * (Datei-Suffix `.global.vue` im besitzenden Layer), sonst kann
   * `<component :is>` den String zur Laufzeit nicht auflösen.
   */
  component: string
  /** Sortierung (aufsteigend, Default 50) */
  order?: number
}

/** `false` = Eintrag von einer App/einem späteren Layer bewusst abgeschaltet. */
export type PukalaniAuthNoticeConfig = Record<string, PukalaniAuthNotice | false>

/** Auflösung der Map → gerenderte Reihenfolge (pure, unit-getestet). */
export function resolveAuthNotices(
  notices: PukalaniAuthNoticeConfig | undefined,
): { id: string, component: string }[] {
  return Object.entries(notices ?? {})
    .flatMap(([id, notice]) => (notice ? [{ id, ...notice }] : []))
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
    .map(({ id, component }) => ({ id, component }))
}
