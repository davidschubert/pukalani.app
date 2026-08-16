import type { MemberInviteQuotaView } from '../../control/shared/communityInviteQuota'

/**
 * Was `POST /api/community/members` dem BROWSER antwortet.
 *
 * Zwei Dinge, die diesen Typ zu mehr als einer Formalie machen (AU1,
 * 2026-08-15):
 *
 *  1. **`delivered` steht hier NICHT.** Das Control Plane meldet mit diesem
 *     Feld, ob wirklich etwas verschickt wurde — für den stillen Fall, in dem
 *     die eingeladene Adresse längst Mitglied ist und ein Nicht-Team-Mitglied
 *     das nicht erfahren soll (`decideInviteDelivery`). Die Naht liest es und
 *     schneidet es ab; stünde es hier, wäre das Mitgliedschafts-Orakel nur
 *     eine Ebene höher gewandert. Der Typ ist damit der Wächter: wer das Feld
 *     durchreichen will, muss ihn zuerst ändern.
 *  2. **`quota` ist die VOLLE Anzeige** (`MemberInviteQuotaView`), nicht mehr
 *     ein Vier-Felder-Auszug. Die Oberfläche schreibt die Antwort direkt in
 *     ihren Kontingent-Zustand fort; mit dem Auszug fehlten dort danach
 *     `enabled`/`reason`, und der Einladen-Knopf verschwand bis zum nächsten
 *     Seitenaufbau.
 */
export interface CommunityInviteResponse {
  ok: boolean
  inviteId: string
  email: string
  role: string
  expiresAt: string
  quota: MemberInviteQuotaView
  /**
   * Hat die eingeladene Adresse schon ein Pukalani-Konto?
   *
   * Reiner Komfort-Text („… bekommt zusätzlich eine Benachrichtigung"), und
   * ausdrücklich KEIN Mitgliedschafts-Signal: ein Konto hat auch, wer in einer
   * ganz anderen Community ist. Der Wert wird in der Runtime bestimmt (nur sie
   * kennt die Nutzer ihres Appwrite-Projekts) und ist für beide Wege — echte
   * Einladung wie stille — auf dieselbe Weise berechnet.
   */
  existingAccount: boolean
}
