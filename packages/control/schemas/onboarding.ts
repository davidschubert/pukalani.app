import { z } from 'zod'
import {
  SITE_CATEGORIES,
  SITE_DESCRIPTION_MAX,
  SITE_GOAL_IDS,
  SITE_MEMBER_RANGES,
  SITE_PURPOSES,
  SITE_VIBES,
  type SiteGoal,
  type SiteVibeId,
} from '../shared/onboarding'
import { createSlugSchema } from './tenant'

type TranslateFn = (key: string) => string
const identity: TranslateFn = key => key

// z.enum verlangt ein Tupel; die Katalog-Listen sind Arrays. Die Casts halten
// die LITERAL-Typen (nicht `string`), damit der geparste Body direkt in
// SiteProfile passt — sonst schlägt der Compiler erst an der Schreibstelle zu.
const VIBE_IDS = SITE_VIBES.map(vibe => vibe.id) as unknown as [SiteVibeId, ...SiteVibeId[]]
const GOAL_IDS = SITE_GOAL_IDS as unknown as [SiteGoal, ...SiteGoal[]]

/** Code-Format: der Betreiber stellt sie aus, der Kunde tippt sie ab —
 *  deshalb großzügig (Bindestriche erlaubt), aber längenbegrenzt. */
const inviteCodeRe = /^[A-Za-z0-9-]{6,64}$/

export const inviteCodeSchema = z.string().trim().regex(inviteCodeRe)

/** Nicht-verbrauchende Vorprüfung beim Betreten des Wizards. */
export const inviteCheckSchema = z.object({ code: inviteCodeSchema }).strict()

/**
 * Der Wizard-Abschluss (letzter Schritt → „Community erstellen").
 *
 * Bewusst EIN Aufruf mit allen Antworten statt mehrerer Teil-Schreibvorgänge:
 * so entsteht die Community entweder ganz oder gar nicht — kein halb
 * angelegter Mandant, wenn der Browser mitten im Flow zugeht
 * (DoD der Roadmap: „keine verwaiste Community-Row bei Abbruch").
 *
 * `slug` statt `host`: der Server baut den Hostnamen (s. createSlugSchema).
 * Es gibt bewusst KEINEN `plan`/`projectId`/`mode`-Parameter — Selbst-
 * bedienung landet immer im Pool mit der Testphase; alles andere bleibt
 * Betreiber-Weg.
 *
 * PFLICHT SIND DREI ANTWORTEN (U12, Davids Entscheidung 2026-08-10):
 * **Name/Adresse · Kategorie · Vibe** — die drei, die den ERSTEN ZUSTAND der
 * Community formen (Host + Willkommens-Beitrag + Farbwelt). `purpose`,
 * `memberRange`, `goal` und `description` fragt der Wizard nicht mehr.
 *
 * SIE BLEIBEN TROTZDEM IM SCHEMA, und zwar OPTIONAL statt gestrichen: das
 * Schema ist die Naht zwischen ZWEI Deployments (platform ruft, control
 * empfängt — dieselbe Lage wie bei `neutral` im Branding-PATCH). `.strict()`
 * heißt, dass ein unbekanntes Feld 400 wirft; ein GESTRICHENES Feld hätte
 * also jede Anlage aus einer noch nicht ausgetauschten platform abgewiesen.
 * deploy.yml fährt `control` VOR `platform`, das ist genau diese Richtung.
 *
 * BEWUSST OHNE `.default()`: ein Default schriebe eine Antwort in
 * `communities.profile`, die niemand gegeben hat — und da diese drei Felder
 * reine Marktforschung sind (kein Codepfad LIEST sie, s. `parseSiteProfile`),
 * wäre sie von einer echten Antwort später nicht mehr zu unterscheiden.
 * Fehlt das Feld, fehlt es auch im Profil (site.post.ts). Bestehende Zeilen
 * behalten ihre Antworten unverändert.
 */
export function createOnboardingSiteSchema(t: TranslateFn = identity) {
  return z.object({
    name: z.string().trim().min(2, t('onboarding.validation.nameRequired')).max(120),
    slug: createSlugSchema(t),
    /** Nicht mehr gefragt (U12) — angenommen, solange eine ältere platform sendet. */
    purpose: z.enum(SITE_PURPOSES).optional(),
    /** Nicht mehr gefragt (U12) — s. o. */
    memberRange: z.enum(SITE_MEMBER_RANGES).optional(),
    category: z.enum(SITE_CATEGORIES),
    /** Nicht mehr gefragt (U12) — s. o. */
    goal: z.enum(GOAL_IDS).optional(),
    /**
     * Nicht mehr gefragt (U12). War schon vorher optional und ist das EINZIGE
     * der vier Felder mit einem echten Leser: es füllte die Startseite. Der
     * Owner schreibt den Text jetzt unter /dashboard/community („Name und
     * Beschreibung"), die Saat nimmt bis dahin ihren Rückfalltext.
     */
    description: z.string().trim().max(SITE_DESCRIPTION_MAX).optional(),
    vibe: z.enum(VIBE_IDS),
    /**
     * OPTIONAL seit U2 (2026-08-10): das Tor lässt sich im Betreiber-Dashboard
     * abschalten, und dann gibt es keinen Code, den der Wizard mitschicken
     * könnte. Ein Pflichtfeld hier hieße 400 statt einer Entscheidung — und
     * ausgerechnet die Entscheidung gehört an EINE Stelle
     * (control/server/api/control/onboarding/site.post.ts), nicht in ein
     * Schema, das den Zustand des Schalters gar nicht kennt.
     */
    inviteCode: inviteCodeSchema.optional(),
    /** Sprache des Erstellers — bestimmt die Locale der erzeugten Startseite. */
    locale: z.enum(['de', 'en']).optional(),
  }).strict()
}

export const onboardingSiteSchema = createOnboardingSiteSchema()

export type OnboardingSiteInput = z.infer<typeof onboardingSiteSchema>

/** Betreiber stellt einen Code aus (Studio, sites.manage). Der Klartext wird
 *  im Response EINMAL geliefert und nie gespeichert. */
export const inviteCodeCreateSchema = z.object({
  label: z.string().trim().max(120).optional(),
  maxUses: z.number().int().min(0).max(100_000).optional(),
  /** Tage bis zum Ablauf; fehlt = ohne Ablauf. */
  expiresInDays: z.number().int().min(1).max(365).optional(),
}).strict()

export const inviteCodePatchSchema = z.object({
  status: z.enum(['active', 'revoked']),
}).strict()
