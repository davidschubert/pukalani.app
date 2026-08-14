import { Query } from 'node-appwrite'
import { z } from 'zod'
import { COMMUNITY_ROLES } from '../../../../../core/shared/communityAuthz'
import { callControlPlane } from '../../../utils/controlPlane'
import { requireCommunityTeamGate } from '../../../utils/communityTeamGate'

/**
 * Jemanden einladen — EIN Feld, eine Rollenwahl (Davids Entscheidung 2).
 *
 * Der Betreiber macht immer denselben Handgriff; ob die Person Pukalani schon
 * kennt, merkt sie selbst:
 *  - **Konto existiert** (z. B. aus einer anderen Community): sie bekommt die Mail
 *    UND eine In-App-Benachrichtigung. Nach dem Anmelden ist es EIN Klick.
 *  - **Kein Konto**: nur die Mail; der Link führt über Registrierung → Annahme.
 *
 * Die Konto-Prüfung kann NUR hier passieren — das Control Plane hat keinen
 * Zugriff auf die Nutzer des Pool-Projekts. Sie ist bewusst nur Komfort: die
 * Antwort verrät dem Betreiber, was passiert ist, nicht mehr (kein Konto-Orakel
 * über fremde Adressen — er lädt ja selbst gerade jemanden ein).
 *
 * 'owner' lehnt das Control Plane ab (decideInvite) — Besitz entsteht durch
 * Gründung oder Übergabe.
 *
 * ── SEIT F57 IST DAS NICHT MEHR NUR DER BETREIBER ──────────────────────────
 * Die Capability heißt `members.invite` (beim VIEWER, also jedem Mitglied mit
 * Zugang) statt `team.manage`. Was für ein Mitglied ZUSÄTZLICH gilt —
 * Owner-Schalter, Rolle immer `viewer`, 5 je rollierender Woche — entscheidet
 * das CONTROL PLANE, weil dort die Zeilen liegen, an denen gezählt wird.
 *
 * Diese Route prüft die Zusatzregeln BEWUSST NICHT selbst: sie könnte den
 * Verbrauch gar nicht sehen (`community_invites` gehört dem Control Plane),
 * und eine halbe Kopie der Regel wäre schlimmer als keine — sie wäre die,
 * der man glaubt. Hier steht nur die schnelle Rechte-Prüfung, die schon 403
 * gibt, bevor ein JWT geprägt wird.
 */
const bodySchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(COMMUNITY_ROLES),
}).strict()

/** Das Kontingent NACH dieser Einladung — die Oberfläche schreibt es fort. */
interface InviteQuota {
  unlimited: boolean
  limit: number
  used: number
  remaining: number
}

interface InviteResult {
  ok: boolean
  inviteId: string
  email: string
  role: string
  expiresAt: string
  quota: InviteQuota
}

export default defineEventHandler(async (event) => {
  const { communityId, jwt } = await requireCommunityTeamGate(event, 'members.invite')
  const body = await readValidatedBody(event, bodySchema.parse)
  const email = body.email.trim().toLowerCase()

  // Mail-Sprache = Sprache des einladenden Dashboards (die der Eingeladenen
  // kennt niemand). Cookie statt Header: er trägt die bewusste Wahl.
  const locale = getCookie(event, 'i18n_redirected') === 'en' ? 'en' : 'de'

  const result = await callControlPlane<InviteResult>(
    event,
    '/api/control/community/members/invite',
    { jwt, communityId, email, role: body.role, locale },
  )

  // Existiert ein Konto? Dann zusätzlich in-app benachrichtigen — best-effort,
  // notify() wirft nie.
  let existingAccount = false
  try {
    const admin = createAdminClient(event)
    const found = await admin.users.list({ queries: [Query.equal('email', email), Query.limit(1)] })
    const invitee = found.users[0]
    if (invitee) {
      existingAccount = true
      const tenant = useTenant(event)
      // `title` ist der {name}-Platzhalter der Glocken-Meldung („Einladung zu
      // {name}") — deshalb steht dort der Community-Name, nicht ein Satz. Der
      // Link führt auf /join OHNE Token: die Seite findet die offene Einladung
      // über die eigene, geprüfte Adresse. Das ist der „eine Klick".
      const siteName = (tenant?.name ?? '').trim()
      if (siteName) {
        await notify(event, {
          // Einladung in EINE Community → scope 'tenant' (Pflichtfeld seit
          // C15). Ohne den Stempel läge die Meldung im mandantenlosen
          // Kontobereich, wo sie nichts zu suchen hat: eine Einladung gehört
          // zu der Community, die einlädt.
          scope: 'tenant',
          recipientId: invitee.$id,
          type: 'siteInvite',
          title: siteName,
          body: '',
          link: '/join',
          senderId: event.context.user?.$id,
        })
      }
    }
  }
  catch {
    // Die Einladung steht und die Mail ist raus — ein fehlender Hinweis im
    // Glockensymbol darf daran nichts ändern.
  }

  return { ...result, existingAccount }
})
