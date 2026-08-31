import { createBrandInviteCodeSchema } from '../../../../schemas/brandAccess'
import type { BrandInviteCheckResponse } from '../../../../shared/types/brand'
import { evaluateBrandInvite } from '../../../utils/brandInvites'

/**
 * TAUGT DIESER CODE? — eine der ZWEI öffentlichen Ausnahmen vom Zugangs-Gate
 * (die andere ist der token-geschützte Share-GET). Sie muss öffentlich sein:
 * sie beantwortet die Frage VOR dem Login, damit der Einladungs-Link nicht
 * erst nach einer Kontoanlage sagt, dass er nichts wert war.
 *
 * ── DIE ANTWORT IST IMMER DIESELBE FORM ───────────────────────────────────
 * `{ valid: boolean }` — kein Grund, kein Statuscode-Unterschied, keine
 * unterschiedliche Laufzeit-Erzählung. Falsch, abgelaufen, widerrufen, schon
 * verbraucht, an eine andere Adresse gebunden, Modus `closed` oder `open`: der
 * Aufrufer sieht `false`. Alles andere machte die geschlossene Beta
 * enumerierbar (Schema-Anhang §5).
 *
 * ── SIE PRÜFT NICHT DIE ADRESSE ───────────────────────────────────────────
 * Vor dem Login gibt es keine geprüfte Adresse; eine aus dem Rumpf wäre
 * behauptet, nicht bewiesen. Die Bindung an `emailLower` fällt deshalb in die
 * EINLÖSUNG (`redeem.post.ts`), wo eine Session dahintersteht. Diese Route sagt
 * nur: „ein Code dieser Art wäre gerade gültig."
 *
 * ── EIN FEHLER IST EIN `false` ────────────────────────────────────────────
 * Kein 500 nach draussen: ein Aufrufer, der einen Ausfall provozieren kann,
 * bekäme sonst ein zweites Signal neben der Antwort. Gedrosselt wird sie in
 * `05.rate-limit.ts` (Bucket `brand:invite`), damit Raten teuer bleibt.
 */
export default defineEventHandler(async (event): Promise<BrandInviteCheckResponse> => {
  const body = await readValidatedBody(event, createBrandInviteCodeSchema().parse)

  try {
    const { valid } = await evaluateBrandInvite(event, body.code, null)
    return { valid }
  }
  catch (error) {
    // Der Code steht bewusst NICHT im Log — sonst läge er im Klartext dort,
    // wo er als Hash gespeichert wurde.
    logEvent('warn', 'brand.invite_check_failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return { valid: false }
  }
})
