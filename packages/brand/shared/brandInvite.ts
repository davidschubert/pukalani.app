import { type BrandAdmissionMode, admissionAllowsRedeem } from './brandAccess'

/**
 * TAUGT DIESER EINLADUNGS-CODE JETZT NOCH? — die PURE Regel (Schema-Anhang §5).
 *
 * Sie steht neben `decideBrandAccess`, nicht darin: das GATE fragt „darf dieses
 * Konto arbeiten?", diese Regel fragt „darf dieser Code jetzt Zugang schaffen?".
 * Beide Fragen haben verschiedene Eingaben und verschiedene Antworten; eine
 * gemeinsame Funktion müsste eine davon verfälschen.
 *
 * ── NACH AUSSEN GIBT ES NUR JA ODER NEIN ──────────────────────────────────
 * `reason` bleibt im Server (Log, Test, Skript). Falsch, abgelaufen, widerrufen,
 * verbraucht, fremde Adresse, falscher Aufnahme-Modus — der Aufrufer bekommt in
 * JEDEM Fall dieselbe Ablehnung. Sonst ist die geschlossene Beta ein Orakel:
 * „abgelaufen" verriete, dass es diesen Code gab, und „fremde Adresse", dass
 * jemand anderes eingeladen wurde.
 *
 * ── DER MODUS STEHT VORNE ─────────────────────────────────────────────────
 * `admissionAllowsRedeem` sagt Nein bei `closed` (ein liegengebliebener Code
 * darf einen Betreiber-Stopp nicht unterlaufen) und bei `open` (dort braucht
 * niemand einzulösen — eine zusätzliche `brand_access`-Zeile wäre Rauschen mit
 * einem `revokedAt`-Feld, das später niemand erwartet).
 *
 * ── DIE E-MAIL-BINDUNG IST TEIL DER REGEL, NICHT DER ROUTE ────────────────
 * Ein Code ist an GENAU EINE Adresse gebunden. Läge diese Prüfung in der Route,
 * gäbe es sie zweimal (Prüfen und Einlösen) und irgendwann nur noch einmal.
 * `emailLower` wird hier NICHT normalisiert — beide Seiten kommen bereits
 * kleingeschrieben herein, und eine zweite Normalisierung an dieser Stelle
 * würde nur verdecken, wenn eine Aufrufstelle sie vergisst.
 */

export type BrandInviteDenialReason =
  | 'mode_forbids'
  | 'unknown'
  | 'revoked'
  | 'redeemed'
  | 'expired'
  | 'email_mismatch'

/** Die Felder einer `brand_invites`-Zeile, die für die Entscheidung zählen. */
export interface BrandInviteFacts {
  emailLower: string
  expiresAt: string
  revokedAt?: string | null
  redeemedAt?: string | null
}

export interface BrandInviteDecisionInput {
  mode: BrandAdmissionMode
  /** `null` = kein Treffer für den Hash. */
  invite: BrandInviteFacts | null
  /** ISO-Zeitpunkt der Prüfung (Test-fähig statt `Date.now()` im Rumpf). */
  now: string
  /**
   * Die Adresse, gegen die gebunden wird — kleingeschrieben. `null` bedeutet
   * „noch unbekannt" (die Vorab-Prüfung vor dem Login kennt sie nicht) und
   * ÜBERSPRINGT die Bindung bewusst: dort wird nur gefragt, ob der Code als
   * solcher taugt, eingelöst wird er nie ohne Adresse.
   */
  emailLower: string | null
}

export interface BrandInviteDecision {
  valid: boolean
  reason: BrandInviteDenialReason | null
}

export function decideBrandInvite(input: BrandInviteDecisionInput): BrandInviteDecision {
  if (!admissionAllowsRedeem(input.mode)) return { valid: false, reason: 'mode_forbids' }
  if (!input.invite) return { valid: false, reason: 'unknown' }
  if (input.invite.revokedAt) return { valid: false, reason: 'revoked' }
  if (input.invite.redeemedAt) return { valid: false, reason: 'redeemed' }
  // Fehlendes/kaputtes Ablaufdatum gilt als abgelaufen (fail-closed): eine
  // Einladung ohne Frist wäre ein dauerhafter Generalschlüssel.
  const expires = Date.parse(input.invite.expiresAt ?? '')
  if (!Number.isFinite(expires) || expires <= Date.parse(input.now)) {
    return { valid: false, reason: 'expired' }
  }
  if (input.emailLower !== null && input.invite.emailLower !== input.emailLower) {
    return { valid: false, reason: 'email_mismatch' }
  }
  return { valid: true, reason: null }
}
