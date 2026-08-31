import type { H3Event } from 'h3'
import { type BrandOwnerType, decideBrandOwnerAccess } from '../../shared/brandOwnership'

/**
 * DIE ZWEITE HÄLFTE DER BRAND-AUTORISIERUNG. `requireBrandAccess` fragt „darf
 * dieses Konto überhaupt in den Wizard?", DIESE Funktion fragt „gehört ihm
 * DIESES Profil?". Beide sind nötig: die Beta-Zulassung sagt nichts über
 * fremde Profile, und ein Eigentümer ohne Zulassung bleibt draussen.
 *
 * Sie ist die EINZIGE Grenze zwischen zwei Konten, denn alle `brand_*`-Tabellen
 * sind server-only (Permissions `[]`) — es gibt keine Row-Permission, die im
 * Zweifel noch abfinge (Plan §6 „Zugriffsgrenze", Audit 5). Jede Route, die ein
 * Profil oder eines seiner Kinder (steps/messages/shares/events) anfasst, ruft
 * sie NACH dem Laden der Zeile und VOR jeder Wirkung.
 *
 * 404 statt 403 — dieselbe Begründung wie beim Zugangs-Gate: ein 403 auf eine
 * fremde Profil-Id bestätigte deren Existenz.
 */

/** Die Besitz-Felder einer `brand_profiles`-Zeile. Mehr braucht die Prüfung nicht. */
export interface BrandOwnedRow {
  ownerType: string
  ownerId: string
}

export function assertBrandOwnerAccess(event: H3Event, profile: BrandOwnedRow, userId: string): void {
  const allowed = decideBrandOwnerAccess({
    ownerType: profile.ownerType as BrandOwnerType,
    ownerId: profile.ownerId,
    userId,
    /**
     * PHASE 1: der community-Zweig ist TOT GESCHALTET. `null` heisst hier
     * ausdrücklich „nicht aufgelöst", nicht „keine Mitgliedschaft" — solange
     * kein Profil einer Community gehören KANN (die UI zur Übertragung kommt
     * erst später), gibt es nichts aufzulösen, und eine erfundene Rolle wäre
     * die gefährlichere Antwort. Sobald es sie gibt, wird hier die echte Rolle
     * eingesetzt; die Regel selbst steht schon und ist getestet.
     *
     * `event` bleibt in der Signatur, weil genau diese Auflösung ihn braucht —
     * die Aufrufstellen sollen dafür nicht ein zweites Mal angefasst werden.
     */
    communityRole: null,
  })
  if (!allowed) throw createError({ status: 404, statusText: 'Not Found' })
}
