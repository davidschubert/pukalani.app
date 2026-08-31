/**
 * WEM GEHÖRT EIN BRAND-PROFIL? — die PURE Eigentümer-Entscheidung (Plan §6
 * „Datenmodell"). Besitz steht von Tag eins als `ownerType + ownerId` in
 * `brand_profiles`; die Berechtigung wird ZENTRAL daraus abgeleitet, nie je
 * Route neu erfunden.
 *
 * PHASE 1 AKTIVIERT NUR DEN `user`-ZWEIG. Der `community`-Zweig ist hier
 * VOLLSTÄNDIG implementiert und getestet, aber im Betrieb tot geschaltet: der
 * Aufrufer (`server/utils/brandOwnership.ts`) übergibt `communityRole: null`,
 * solange es keine Eigentums-Übertragung an eine Community gibt. Gebaut wird
 * er trotzdem jetzt, weil die Alternative — später eine zweite Regel neben
 * einer bestehenden — genau die Doppelung ist, an der Autorisierung
 * auseinanderläuft.
 *
 * ROLLEN-WERTE STATT IMPORT: `owner`/`admin` sind hier als Zeichenketten
 * notiert, NICHT aus `packages/control/shared/communityTeam.ts` importiert.
 * `brand` ist ein Silo-Layer auf `branding` — er kennt das Control Plane
 * nicht und soll keine Abhängigkeit dorthin aufbauen (A14). Die Werte selbst
 * stehen seit E8-4 in Zeilen und ändern sich nicht; die Liste dort bleibt die
 * Referenz.
 *
 * WARUM NUR owner/admin: `moderator` und `editor` arbeiten an INHALTEN einer
 * Community, ein Brand-Profil ist aber ihr Fundament — wer es ändert, ändert
 * die Marke. Und `viewer` liest ohnehin nur. Ein Profil hat zudem KEINE
 * Row-Permissions (alle `brand_*`-Tabellen sind server-only), diese Funktion
 * ist also die einzige Grenze.
 */

export const BRAND_OWNER_TYPES = ['user', 'community'] as const
export type BrandOwnerType = (typeof BRAND_OWNER_TYPES)[number]

/** Community-Rollen, die ein Community-Profil bearbeiten dürfen (Phase 2). */
const COMMUNITY_ROLES_WITH_BRAND_ACCESS = ['owner', 'admin'] as const

export interface BrandOwnerAccessInput {
  ownerType: BrandOwnerType
  ownerId: string
  /** Konto, das gerade handelt (aus `requireBrandAccess`). */
  userId: string
  /**
   * Rolle dieses Kontos in der besitzenden Community. `null`/`undefined` =
   * keine Mitgliedschaft ODER (Phase 1) bewusst nicht aufgelöst.
   */
  communityRole?: string | null
}

export function decideBrandOwnerAccess(input: BrandOwnerAccessInput): boolean {
  // Ein leeres Konto darf nie zutreffen — sonst öffnete ein leeres `ownerId`
  // (unvollständige Zeile) jedes Profil.
  if (!input.userId) return false

  if (input.ownerType === 'user') return input.ownerId === input.userId

  if (input.ownerType === 'community') {
    if (!input.ownerId) return false
    const role = input.communityRole
    return !!role && (COMMUNITY_ROLES_WITH_BRAND_ACCESS as readonly string[]).includes(role)
  }

  // Unbekannter ownerType (Alt-/Schrottzeile) ⇒ niemand. Fail-closed.
  return false
}
