/**
 * Die Schrittfolge des Setup-Flows und die Frage, wann „Weiter" erlaubt ist.
 *
 * PURE und ohne Nuxt: das ist die Regel, die entscheidet, ob jemand
 * weiterkommt — sie gehört getestet, nicht in ein Template. Die Seite
 * (pages/start/community.vue) liest sie, hält sie aber nicht.
 */

/**
 * DREI FRAGEN, DANN DER ABSCHLUSS (U12, Davids Entscheidung 2026-08-10).
 *
 * Vorher waren es sieben Schritte, von denen vier nur uns dienten: Größe,
 * Zweck und Ziel wurden erhoben und danach von KEINEM Codepfad je gelesen,
 * die Beschreibung war die einzige mit Gegenwert (sie füllte die Startseite).
 * Geblieben ist, was den ERSTEN ZUSTAND der Community formt: Name/Adresse
 * (der Host), Kategorie (die Zeile im ersten Beitrag) und Vibe (die Farbwelt).
 *
 * Die Beschreibung schreibt der Owner jetzt unter /dashboard/community, und
 * die Startseite steht bis dahin mit ihrem Rückfalltext da — beides ist ein
 * Punkt der Willkommens-Checkliste (shared/gettingStarted.ts).
 */
export const WIZARD_STEPS = ['basics', 'category', 'vibe', 'summary'] as const
export type WizardStep = (typeof WIZARD_STEPS)[number]

/** Unbekannte/fehlende Werte → erster Schritt (eine manipulierte URL darf den
 *  Flow nicht in einen Zustand ohne Antworten schieben). */
export function normalizeStep(value: unknown): WizardStep {
  return typeof value === 'string' && (WIZARD_STEPS as readonly string[]).includes(value)
    ? value as WizardStep
    : WIZARD_STEPS[0]
}

export function stepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step)
}

export function nextStep(step: WizardStep): WizardStep | null {
  return WIZARD_STEPS[stepIndex(step) + 1] ?? null
}

export function previousStep(step: WizardStep): WizardStep | null {
  return WIZARD_STEPS[stepIndex(step) - 1] ?? null
}

/** Zustand der Adress-Prüfung — 'error' heißt „konnte nicht geprüft werden". */
export type SlugCheck = 'idle' | 'checking' | 'free' | 'taken' | 'error'

export interface WizardAnswers {
  name?: string
  slug?: string
  category?: string
  vibe?: string
}

/**
 * Darf dieser Schritt verlassen werden?
 *
 * Eine bewusste Entscheidung, die bleibt: ein Adress-Prüffehler ('error')
 * blockiert NICHT — wenn unsere Prüfung ausfällt, darf das nicht wie ein
 * besetzter Name aussehen. Belegt ('taken') und „läuft noch" ('checking')
 * blockieren dagegen.
 */
export function isStepComplete(step: WizardStep, answers: WizardAnswers, slug: SlugCheck = 'idle'): boolean {
  switch (step) {
    case 'basics':
      return (answers.name ?? '').trim().length >= 2
        && (answers.slug ?? '').length >= 3
        && slug !== 'taken'
        && slug !== 'checking'
    case 'category': return Boolean(answers.category)
    case 'vibe': return Boolean(answers.vibe)
    case 'summary': return true
    // Ein künftiger Schritt ohne eigene Bedingung ist „noch nicht fertig“.
    default: return false
  }
}
