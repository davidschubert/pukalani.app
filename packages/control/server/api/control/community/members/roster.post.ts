import { z } from 'zod'
import { communityRosterFrom, type CommunityRosterResponse } from '../../../../../shared/communityTeam'
import { requireCommunityTeamContext } from '../../../../utils/communityTeam'

/**
 * DIE MITGLIEDER-LISTE FÜR JEDES MITGLIED (Mitglieder-Karte, Etappe 2 —
 * 2026-08-23): wer ist hier dabei, mit welcher Rolle, seit wann.
 *
 * ── WARUM EINE EIGENE ROUTE UND KEINE KLEINERE CAPABILITY AN `members/list` ──
 * Die Karte steht ausdrücklich JEDEM Mitglied offen (Gate `members.invite`, die
 * Capability, die seit F57 alle fünf Rollen tragen). `members/list` verlangt
 * `team.manage`, und das ist kein Zufall: seine Antwort trägt die E-MAIL jedes
 * Mitglieds. Die Capability dort zu senken hiesse, jedem `viewer` das
 * Adressbuch seiner Community zu geben — eine Aufweichung, die man ein halbes
 * Jahr später als Befund wiederfindet.
 *
 * Deshalb dasselbe Muster wie bei `community/team.post.ts` (F1 Stufe 3): eine
 * ZWEITE Route, die die verschwiegenen Felder gar nicht erst zusammenbaut. Was
 * sie herausgeben KANN, entscheidet `communityRosterFrom` — pur und getestet,
 * nicht die Sorgfalt der nächsten Änderung an dieser Datei.
 *
 * ── WAS SIE SCHÜTZT ────────────────────────────────────────────────────────
 * Unverändert die volle Kette aus `requireCommunityTeamContext`: Service-Secret
 * (in der Route davor), JWT des Handelnden (vom Control Plane SELBST gegen das
 * Runtime-Projekt geprüft), Site-Rolle MIT `members.invite` auf GENAU dieser
 * Community, und die Bindung Community ⇄ Projekt. Eine mitgeschickte fremde
 * `communityId` endet damit in 403 bzw. 404 — die Pool-Seite nimmt sie ohnehin
 * nicht vom Aufrufer entgegen, sondern aus der Host-Auflösung.
 *
 * KEINE Namen, keine Avatare, kein Standort: die kennt nur die RUNTIME (ihr
 * Appwrite-Projekt hält die Konten). Sie reichert sie gebündelt an — dieselbe
 * Arbeitsteilung wie bei `members/list`.
 */
const bodySchema = z.object({
  jwt: z.string().min(1).max(4096),
  communityId: z.string().min(1).max(36),
}).strict()

export default defineEventHandler(async (event): Promise<CommunityRosterResponse> => {
  await requireOnboardingCaller(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const context = await requireCommunityTeamContext(event, body, 'members.invite')

  return { members: communityRosterFrom(context.members) }
})
