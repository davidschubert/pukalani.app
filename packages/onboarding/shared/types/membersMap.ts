import type { CommunityRole } from '../../../core/shared/communityAuthz'
import type { ProfileLocation } from '../../../core/shared/types/geo'

/**
 * ── DIE MITGLIEDER-KARTE: WAS ÜBER DIE LEITUNG GEHT (Etappe 2, 2026-08-23) ──
 *
 * Zwei Antworten, zwei Formen. Sie stehen hier und nicht in den Routen, weil
 * Nitros Routen-Typisierung AUS ist (packages/core/nuxt.config.ts,
 * `types:extend`): `$fetch` leitet seinen Antworttyp nicht mehr aus dem Handler
 * ab, die Form wird an BEIDEN Enden verlangt.
 *
 * ── WAS EIN MITGLIED HIER ÜBER ANDERE ERFÄHRT ──────────────────────────────
 * Genau zwei Sorten Angaben, und die Trennung ist die eigentliche Zusage:
 *  1. Was der Mensch SELBST veröffentlicht hat (Name, Avatar, Handle,
 *     Standort, Bio) — alles aus seinem Konto, alles freiwillig.
 *  2. COMMUNITY-FAKTEN (Rolle, dabei seit) — sie beschreiben die Beziehung zu
 *     dieser Community, nicht die Person.
 *
 * NICHT DABEI, und zwar hart (die Felder existieren nicht): E-Mail, Telefon,
 * Sitzungen, IP-Adressen, Zeitzone. Ein öffentliches Profil gibt es bewusst
 * nicht — beide Routen verlangen Anmeldung UND Mitgliedschaft in DERSELBEN
 * Community.
 */

/** Ein Mitglied MIT Standort, wie die Karte es zeigt. */
export interface CommunityMapMember {
  /** Appwrite-User im Runtime-Projekt — der Schlüssel der Detailseite. */
  userId: string
  /** Anzeigename; '' wenn keiner hinterlegt ist (die UI fällt auf den Handle). */
  name: string
  /** Konto-weiter Name OHNE führendes Zeichen (AH-7); '' wenn keiner da ist. */
  handle: string
  /** prefs.avatarUrl; '' = keiner hinterlegt (die UI zeigt Initialen). */
  avatarUrl: string
  /**
   * IMMER gesetzt: wer keinen Standort angegeben hat, steht gar nicht erst in
   * dieser Liste. Ein nullbares Feld hier hiesse, dass die Karte Punkte ohne
   * Koordinaten zeichnen müsste.
   */
  location: ProfileLocation
  role: CommunityRole
  joinedAt: string
}

export interface CommunityMembersMapResponse {
  members: CommunityMapMember[]
  /**
   * WAHR, wenn die Community mehr Mitglieder hat, als der Lauf angesehen hat
   * (`MAP_ROSTER_SCAN_LIMIT`). Die Antwort ist dann UNVOLLSTÄNDIG, und sie sagt
   * es — ein stilles Abschneiden sähe aus wie „sonst hat niemand einen Ort
   * angegeben" und wäre damit eine Lüge über die eigene Community.
   */
  truncated: boolean
}

/**
 * Ein Mitglied auf seiner Detailseite. Dieselben Felder wie auf der Karte, plus
 * `bio` — und `location` ist hier NULLBAR, weil die Seite auch für jemanden
 * ohne Standort erreichbar ist (aus der Mitgliederliste heraus).
 */
export interface CommunityMemberProfileResponse {
  userId: string
  name: string
  handle: string
  avatarUrl: string
  location: ProfileLocation | null
  role: CommunityRole
  joinedAt: string
  /** prefs.bio; '' = nichts geschrieben. */
  bio: string
}
