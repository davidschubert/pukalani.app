import { describe, expect, it } from 'vitest'
import { COMMUNITY_MEMBER_STATUSES } from '../shared/types/communityMember'
import {
  countActiveOwners,
  decideCommunityDeletion,
  hasCommunityAccess,
  decideInvite,
  decideInviteDelivery,
  decideJoin,
  decideMembershipErasure,
  decideRemoval,
  decideRoleChange,
  decideTransfer,
  inviteReferenceErasure,
  type CommunityTeamMemberFacts,
} from '../shared/communityTeam'
import { memberInviteQuota } from '../shared/communityInviteQuota'

/**
 * Die Schutzregeln der Mitglieder-Verwaltung (control-019).
 *
 * Sie sind PURE, damit genau das hier möglich ist: die zwei Regeln, die eine
 * Community unbrauchbar machen könnten — „letzter Owner" und
 * „Selbst-Degradierung" — ohne Appwrite, Netz oder Session prüfen.
 */

const owner: CommunityTeamMemberFacts = { id: 'm1', runtimeUserId: 'u-owner', role: 'owner', status: 'active' }
const admin: CommunityTeamMemberFacts = { id: 'm2', runtimeUserId: 'u-admin', role: 'admin', status: 'active' }
const viewer: CommunityTeamMemberFacts = { id: 'm3', runtimeUserId: 'u-viewer', role: 'viewer', status: 'active' }
const secondOwner: CommunityTeamMemberFacts = { id: 'm4', runtimeUserId: 'u-owner2', role: 'owner', status: 'active' }
const removed: CommunityTeamMemberFacts = { id: 'm5', runtimeUserId: 'u-gone', role: 'editor', status: 'removed' }

const team = [owner, admin, viewer, removed]

describe('hasCommunityAccess', () => {
  it('gilt für GENAU einen Status: active', () => {
    // Festgenagelt, weil zwei Routen diesen Wert als LITERAL in ihre Appwrite-
    // Abfrage schreiben (`community/mine.post.ts`, `community/suspension.post.ts`):
    // `Query.equal('status', 'active')`. Bekäme ein weiterer Status Zugang und
    // niemand zöge die Abfragen nach, verschwänden die zugehörigen Communities
    // still aus „Deine Communities" — kein Fehler, nur eine leere Liste.
    // Dieser Test ist die Erinnerung an die zweite Baustelle.
    expect(COMMUNITY_MEMBER_STATUSES.filter(hasCommunityAccess)).toEqual(['active'])
  })
})

describe('countActiveOwners', () => {
  it('zählt nur aktive Owner', () => {
    expect(countActiveOwners(team)).toBe(1)
    expect(countActiveOwners([...team, secondOwner])).toBe(2)
    expect(countActiveOwners([{ ...owner, status: 'removed' }])).toBe(0)
  })
})

describe('decideRoleChange', () => {
  it('erlaubt die gewöhnliche Änderung (Owner stuft Viewer zum Editor)', () => {
    expect(decideRoleChange({
      actorUserId: owner.runtimeUserId, actorRole: 'owner', target: viewer, nextRole: 'editor', members: team,
    })).toEqual({ ok: true })
  })

  it('verweigert SELBST-Degradierung — auch dem Owner', () => {
    expect(decideRoleChange({
      actorUserId: owner.runtimeUserId, actorRole: 'owner', target: owner, nextRole: 'admin', members: [...team, secondOwner],
    })).toEqual({ ok: false, reason: 'self_demote' })
    expect(decideRoleChange({
      actorUserId: admin.runtimeUserId, actorRole: 'admin', target: admin, nextRole: 'viewer', members: team,
    })).toEqual({ ok: false, reason: 'self_demote' })
  })

  it('schützt den LETZTEN Owner (nur ein Owner ⇒ nicht degradierbar)', () => {
    // Zweiter Owner degradiert den ersten: erlaubt, es bleibt einer.
    expect(decideRoleChange({
      actorUserId: secondOwner.runtimeUserId, actorRole: 'owner', target: owner, nextRole: 'admin',
      members: [...team, secondOwner],
    })).toEqual({ ok: true })
    // Gäbe es nur diesen einen Owner, ginge es nicht — hier über einen
    // Fremd-Owner geprüft, damit nicht die Selbst-Regel zuerst greift.
    expect(decideRoleChange({
      actorUserId: 'u-ghost', actorRole: 'owner', target: owner, nextRole: 'admin', members: team,
    })).toEqual({ ok: false, reason: 'last_owner' })
  })

  it('macht niemanden zum Owner (Besitz nur per Übergabe)', () => {
    expect(decideRoleChange({
      actorUserId: owner.runtimeUserId, actorRole: 'owner', target: admin, nextRole: 'owner', members: team,
    })).toEqual({ ok: false, reason: 'owner_protected' })
    // Auch ein Admin kann sich nicht selbst befördern.
    expect(decideRoleChange({
      actorUserId: admin.runtimeUserId, actorRole: 'admin', target: admin, nextRole: 'owner', members: team,
    })).toEqual({ ok: false, reason: 'owner_protected' })
  })

  it('lässt einen Admin den Owner nicht antasten', () => {
    expect(decideRoleChange({
      actorUserId: admin.runtimeUserId, actorRole: 'admin', target: owner, nextRole: 'viewer',
      members: [...team, secondOwner],
    })).toEqual({ ok: false, reason: 'owner_protected' })
  })

  it('weist Entfernte, unbekannte Rollen und Nicht-Änderungen ab', () => {
    expect(decideRoleChange({
      actorUserId: owner.runtimeUserId, actorRole: 'owner', target: removed, nextRole: 'viewer', members: team,
    })).toEqual({ ok: false, reason: 'not_a_member' })
    expect(decideRoleChange({
      actorUserId: owner.runtimeUserId, actorRole: 'owner', target: viewer, nextRole: 'superuser', members: team,
    })).toEqual({ ok: false, reason: 'invalid_role' })
    expect(decideRoleChange({
      actorUserId: owner.runtimeUserId, actorRole: 'owner', target: viewer, nextRole: 'viewer', members: team,
    })).toEqual({ ok: false, reason: 'unchanged' })
  })
})

describe('decideRemoval', () => {
  it('erlaubt das Entfernen eines gewöhnlichen Mitglieds', () => {
    expect(decideRemoval({
      actorUserId: admin.runtimeUserId, actorRole: 'admin', target: viewer, members: team,
    })).toEqual({ ok: true })
  })

  it('verweigert das Entfernen von SICH SELBST', () => {
    expect(decideRemoval({
      actorUserId: admin.runtimeUserId, actorRole: 'admin', target: admin, members: team,
    })).toEqual({ ok: false, reason: 'self_remove' })
  })

  it('schützt den letzten Owner — und Owner überhaupt vor Admins', () => {
    expect(decideRemoval({
      actorUserId: admin.runtimeUserId, actorRole: 'admin', target: owner, members: [...team, secondOwner],
    })).toEqual({ ok: false, reason: 'owner_protected' })
    expect(decideRemoval({
      actorUserId: 'u-ghost', actorRole: 'owner', target: owner, members: team,
    })).toEqual({ ok: false, reason: 'last_owner' })
    expect(decideRemoval({
      actorUserId: secondOwner.runtimeUserId, actorRole: 'owner', target: owner, members: [...team, secondOwner],
    })).toEqual({ ok: true })
  })

  it('entfernt niemanden zweimal', () => {
    expect(decideRemoval({
      actorUserId: owner.runtimeUserId, actorRole: 'owner', target: removed, members: team,
    })).toEqual({ ok: false, reason: 'not_a_member' })
  })
})

describe('decideTransfer', () => {
  it('nur ein Owner überträgt', () => {
    expect(decideTransfer({ actorUserId: owner.runtimeUserId, actorRole: 'owner', target: admin })).toEqual({ ok: true })
    expect(decideTransfer({ actorUserId: admin.runtimeUserId, actorRole: 'admin', target: viewer }))
      .toEqual({ ok: false, reason: 'owner_protected' })
  })

  it('nicht an sich selbst und nicht an Entfernte', () => {
    expect(decideTransfer({ actorUserId: owner.runtimeUserId, actorRole: 'owner', target: owner }))
      .toEqual({ ok: false, reason: 'unchanged' })
    expect(decideTransfer({ actorUserId: owner.runtimeUserId, actorRole: 'owner', target: removed }))
      .toEqual({ ok: false, reason: 'not_a_member' })
  })
})

describe('decideInvite', () => {
  const activeEmails = ['ada@example.test', 'Bob@Example.test']

  it('erlaubt eine neue Adresse', () => {
    expect(decideInvite({ email: 'neu@example.test', role: 'viewer', members: team, activeEmails }))
      .toEqual({ ok: true })
  })

  it('lehnt Doppel-Einladungen ab — Groß-/Kleinschreibung egal', () => {
    expect(decideInvite({ email: 'ADA@example.test', role: 'editor', members: team, activeEmails }))
      .toEqual({ ok: false, reason: 'already_member' })
    expect(decideInvite({ email: ' bob@example.test ', role: 'editor', members: team, activeEmails }))
      .toEqual({ ok: false, reason: 'already_member' })
  })

  it('lädt niemals als Owner ein', () => {
    expect(decideInvite({ email: 'neu@example.test', role: 'owner', members: team, activeEmails }))
      .toEqual({ ok: false, reason: 'owner_protected' })
  })

  it('weist unbekannte Rollen ab', () => {
    expect(decideInvite({ email: 'neu@example.test', role: 'superuser', members: team, activeEmails }))
      .toEqual({ ok: false, reason: 'invalid_role' })
  })
})

/**
 * AU1 — DAS MITGLIEDSCHAFTS-ORAKEL (Audit + Davids Entscheidung 2026-08-15).
 *
 * Seit F57 darf jedes Mitglied einladen. `already_member` war damit ein
 * kostenloser Test „gehört diese Adresse hierher?" — für Adressen, deren
 * Mitgliederliste der Fragende nicht lesen darf.
 *
 * Die Regel hier ist die einzige Stelle, an der „so tun als ob" steht. Sie ist
 * pur, damit ihr Wegfall ROT wird: läge sie in der Route, antwortete die
 * einfach wieder ehrlich, und kein Test würde davon etwas merken.
 */
describe('decideInviteDelivery', () => {
  const ok = { ok: true } as const
  const alreadyMember = { ok: false, reason: 'already_member' } as const

  it('der gewöhnliche Weg: senden', () => {
    for (const managesTeam of [true, false]) {
      expect(decideInviteDelivery(ok, managesTeam), String(managesTeam))
        .toEqual({ outcome: 'send' })
    }
  })

  /**
   * DIE ENTSCHEIDUNG: wer die Mitgliederliste nicht lesen darf, erfährt nichts.
   * Nicht „später", nicht „unscharf" — gar nichts.
   */
  it('Mitglied + already_member ⇒ still, nicht abgelehnt', () => {
    expect(decideInviteDelivery(alreadyMember, false))
      .toEqual({ outcome: 'suppress', reason: 'already_member' })
  })

  /**
   * DIE GEGENPROBE ZUR ENTSCHEIDUNG: Owner/Admin bekommen die Wahrheit. Sie
   * sehen dieselbe Person zwei Zeilen weiter in ihrer eigenen Liste — ihnen
   * etwas vorzumachen schützte niemanden und nähme ihnen den Hinweis, den sie
   * brauchen („die Rolle änderst du direkt in der Liste").
   */
  it('Team + already_member ⇒ ehrliches 409', () => {
    expect(decideInviteDelivery(alreadyMember, true))
      .toEqual({ outcome: 'reject', reason: 'already_member' })
  })

  /**
   * NUR `already_member` wird verschwiegen. Die anderen Ablehnungen sagen über
   * eine fremde Adresse nichts aus — sie still zu machen, verwandelte einen
   * Tippfehler in einen unsichtbaren Fehlschlag.
   */
  it('verschweigt sonst nichts', () => {
    for (const reason of ['invalid_role', 'owner_protected', 'not_a_member', 'last_owner'] as const) {
      for (const managesTeam of [true, false]) {
        expect(decideInviteDelivery({ ok: false, reason }, managesTeam), `${reason}/${managesTeam}`)
          .toEqual({ outcome: 'reject', reason })
      }
    }
  })
})

/**
 * AU1 — UNUNTERSCHEIDBAR, FELD FÜR FELD.
 *
 * Der stille Weg nützt nichts, wenn die Antwort ihn verrät. Die Route baut
 * deshalb für BEIDE Wege dieselbe Antwort; hier wird nachgeprüft, dass sich
 * das an den Zutaten auch durchhält — dieselben Schlüssel, dieselben Typen,
 * und das Kontingent um EINS weiter (der Preis, der das Orakel schliesst).
 *
 * Die Zutaten sind absichtlich nachgebaut statt die Route zu importieren: sie
 * ist ein Nitro-Handler mit Appwrite-Client. Was hier hängt, ist die FORM der
 * Antwort — und genau die ist der Kanal.
 */
describe('AU1 — die Antwort verrät den stillen Weg nicht', () => {
  /** Wörtlich die Felder, die invite.post.ts zurückgibt. */
  function inviteResponse(suppressed: boolean, used: number) {
    return {
      ok: true,
      delivered: !suppressed,
      inviteId: 'row-1',
      email: 'ada@example.test',
      role: 'viewer',
      expiresAt: '2026-08-22T12:00:00.000Z',
      quota: memberInviteQuota({
        managesTeam: false,
        invitesEnabled: true,
        emailVerified: true,
        limit: 5,
        used: used + 1,
      }),
    }
  }

  it('gleiche Schlüssel, gleiche Typen — bis auf `delivered`', () => {
    const sent = inviteResponse(false, 1)
    const silent = inviteResponse(true, 1)

    expect(Object.keys(silent).sort()).toEqual(Object.keys(sent).sort())
    expect(Object.keys(silent.quota).sort()).toEqual(Object.keys(sent.quota).sort())
    // Alles ausser `delivered` ist WERTgleich — die Zahlen eingeschlossen.
    const { delivered: _sentFlag, ...sentRest } = sent
    const { delivered: _silentFlag, ...silentRest } = silent
    expect(silentRest).toEqual(sentRest)
  })

  /**
   * DER PREIS. Eine bloss gleich AUSSEHENDE Antwort liesse sich beliebig oft
   * wiederholen — das Orakel wäre langsamer, nicht zu. Verbraucht wird deshalb
   * auf BEIDEN Wegen, und das Kontingent, das zurückkommt, sagt es auch.
   */
  it('das Kontingent zählt auf beiden Wegen weiter', () => {
    expect(inviteResponse(true, 1).quota.used).toBe(2)
    expect(inviteResponse(true, 1).quota.remaining).toBe(3)
    expect(inviteResponse(true, 4).quota).toEqual(inviteResponse(false, 4).quota)
    // Die fünfte schliesst den Vorrat — auch wenn sie still war.
    expect(inviteResponse(true, 4).quota.enabled).toBe(false)
  })

  /**
   * GEGENPROBE: würde die Route den stillen Weg irgendwo durchscheinen lassen
   * — ein leeres `inviteId`, ein anderes `expiresAt`, ein nicht gezähltes
   * Kontingent —, fiele genau dieser Vergleich. Er ist hier ausgeschrieben,
   * damit man sieht, was der Test oben ausschliesst.
   */
  it('ein durchscheinender Unterschied fiele auf', () => {
    const sent = inviteResponse(false, 1)
    const leaky = { ...inviteResponse(true, 1), inviteId: '' }
    expect(leaky).not.toEqual(sent)

    const notCharged = { ...inviteResponse(true, 1), quota: inviteResponse(false, 0).quota }
    expect(notCharged.quota).not.toEqual(sent.quota)
  })
})

/**
 * A5 — „Beitritt" als Regel (Davids Entscheidung 1 vom 2026-07-29).
 *
 * Die drei Aussagen, an denen alles hängt und die man nicht per Hand nachprüfen
 * will: entzogener Zugang schlägt jeden Auslöser, geschlossene Community lässt
 * niemanden herein, und der Bestand kommt trotzdem durch.
 */
describe('decideJoin', () => {
  it('offene Community: der Auslöser macht Mitglied — mit der Rolle viewer', () => {
    for (const trigger of ['registration', 'contribution'] as const) {
      expect(decideJoin({ trigger, openRegistration: true, existing: null }))
        .toEqual({ outcome: 'joined', role: 'viewer' })
    }
  })

  it('geschlossene Community: KEIN Auto-Beitritt (nur Einladung)', () => {
    for (const trigger of ['registration', 'contribution'] as const) {
      expect(decideJoin({ trigger, openRegistration: false, existing: null }))
        .toEqual({ outcome: 'closed', role: null })
    }
  })

  it('entzogener Zugang schlägt JEDEN Auslöser — auch die Bestands-Übernahme', () => {
    for (const trigger of ['registration', 'contribution', 'legacy'] as const) {
      for (const openRegistration of [true, false]) {
        expect(decideJoin({ trigger, openRegistration, existing: removed }))
          .toEqual({ outcome: 'removed', role: null })
      }
    }
  })

  it('bestehendes Mitglied bleibt, was es ist (idempotent, Rolle unberührt)', () => {
    expect(decideJoin({ trigger: 'contribution', openRegistration: true, existing: admin }))
      .toEqual({ outcome: 'member', role: 'admin' })
    expect(decideJoin({ trigger: 'legacy', openRegistration: false, existing: owner }))
      .toEqual({ outcome: 'member', role: 'owner' })
  })

  it('Bestand („legacy") umgeht den Registrierungs-Schalter — und nur er', () => {
    expect(decideJoin({ trigger: 'legacy', openRegistration: false, existing: null }))
      .toEqual({ outcome: 'joined', role: 'viewer' })
  })

  it('ein suspendierter Zugang ist auch kein Zugang', () => {
    expect(decideJoin({
      trigger: 'contribution',
      openRegistration: true,
      existing: { ...viewer, status: 'suspended' },
    })).toEqual({ outcome: 'removed', role: null })
  })
})

/**
 * C16 — Community löschen. Die Regel ist der einzige Ort, an dem der bewusste
 * Schnitt („Deaktivieren + Zugänge entziehen, Daten bleiben") und seine zwei
 * Sperren zusammen nachlesbar sind; hier wird er festgenagelt.
 */
describe('decideCommunityDeletion (C16)', () => {
  const base = { communityStatus: 'active', liveSubscription: false }

  it('nur der Owner — Admin und alle darunter prallen ab', () => {
    expect(decideCommunityDeletion({ ...base, actorRole: 'owner' })).toEqual({ ok: true })
    for (const role of ['admin', 'moderator', 'editor', 'viewer'] as const) {
      expect(decideCommunityDeletion({ ...base, actorRole: role }))
        .toEqual({ ok: false, reason: 'owner_protected' })
    }
  })

  it('laufendes Abo sperrt — erst kündigen (Stilllegen kündigt bei Stripe nichts)', () => {
    expect(decideCommunityDeletion({ ...base, actorRole: 'owner', liveSubscription: true }))
      .toEqual({ ok: false, reason: 'subscription_active' })
  })

  it('schon stillgelegt ist eine ABLEHNUNG, kein stiller Erfolg', () => {
    expect(decideCommunityDeletion({ ...base, actorRole: 'owner', communityStatus: 'disabled' }))
      .toEqual({ ok: false, reason: 'already_disabled' })
  })

  it('die Rolle wird VOR dem Zustand geprüft — ein Nicht-Owner erfährt nichts über das Abo', () => {
    expect(decideCommunityDeletion({ actorRole: 'admin', communityStatus: 'disabled', liveSubscription: true }))
      .toEqual({ ok: false, reason: 'owner_protected' })
  })
})

/**
 * F3 — die DSGVO-Löschung eines Runtime-Kontos räumt seine Mitgliedschaften im
 * Control Plane ab. Die Regel ist die Naht zwischen zwei Rechten, die sich
 * widersprechen können: „gelöscht werden" und „eine Community darf nicht ohne
 * Owner dastehen". Genau dieser eine Fall wird hier festgenagelt — er ist der
 * einzige, in dem eine Zeile stehen bleibt.
 */
describe('decideMembershipErasure (F3)', () => {
  const active = 'active'

  it('der Regelfall ist LÖSCHEN — an einer Mitgliedschaft hängt kein fremder Kontext', () => {
    expect(decideMembershipErasure({ target: viewer, members: team, communityStatus: active }))
      .toEqual({ action: 'delete', reason: null })
    expect(decideMembershipErasure({ target: admin, members: team, communityStatus: active }))
      .toEqual({ action: 'delete', reason: null })
  })

  it('der LETZTE Owner einer aktiven Community bleibt — anonymisiert, mit Klartext-Grund', () => {
    expect(decideMembershipErasure({ target: owner, members: team, communityStatus: active }))
      .toEqual({ action: 'anonymize', reason: 'last_owner' })
  })

  it('ein Owner NEBEN einem zweiten Owner geht mit', () => {
    expect(decideMembershipErasure({
      target: owner,
      members: [...team, secondOwner],
      communityStatus: active,
    })).toEqual({ action: 'delete', reason: null })
  })

  it('ein Owner OHNE Zugang zählt nicht als zweiter — er wäre kein Ersatz', () => {
    expect(decideMembershipErasure({
      target: owner,
      members: [...team, { ...secondOwner, status: 'removed' as const }],
      communityStatus: active,
    })).toEqual({ action: 'anonymize', reason: 'last_owner' })
  })

  it('eine stillgelegte Community braucht keinen Owner mehr', () => {
    expect(decideMembershipErasure({ target: owner, members: team, communityStatus: 'disabled' }))
      .toEqual({ action: 'delete', reason: null })
  })

  it('ein bereits entzogener Zugang wird immer gelöscht — auch als Owner-Zeile', () => {
    const goneOwner = { ...owner, status: 'removed' as const }
    expect(decideMembershipErasure({
      target: goneOwner,
      members: [goneOwner, admin],
      communityStatus: active,
    })).toEqual({ action: 'delete', reason: null })
  })

  it('dieselbe Owner-Zählung wie die Verwaltung: was decideRemoval sperrt, bleibt auch hier stehen', () => {
    // Zwei Wege, EIN Schutz — sonst käme man über die Kontolöschung an eine
    // Community ohne Owner, die „Zugang entziehen" gerade verhindert hat.
    expect(decideRemoval({ actorUserId: 'u-other', actorRole: 'owner', target: owner, members: team }))
      .toEqual({ ok: false, reason: 'last_owner' })
    expect(decideMembershipErasure({ target: owner, members: team, communityStatus: active }).action)
      .toBe('anonymize')
  })
})

/**
 * F3-Nachtrag — die Spuren, die ein Konto in FREMDEN Einladungen hinterlässt.
 * Die Zeile gehört jemand anderem und bleibt; nur der Verweis fällt weg. Die
 * Regel muss deshalb genau sagen, WELCHE Felder ein Update anfasst — ein
 * pauschales Leeren beider Spalten löschte die Spur eines Unbeteiligten mit.
 */
describe('inviteReferenceErasure (F3-Nachtrag)', () => {
  it('kappt beide Felder in EINEM Update, wenn beide auf das Konto zeigen', () => {
    expect(inviteReferenceErasure({ invitedBy: 'u-gone', acceptedBy: 'u-gone' }, 'u-gone'))
      .toEqual({ invitedBy: '', acceptedBy: '' })
  })

  it('kappt nur das Feld, das wirklich auf das Konto zeigt', () => {
    expect(inviteReferenceErasure({ invitedBy: 'u-gone', acceptedBy: 'u-other' }, 'u-gone'))
      .toEqual({ invitedBy: '' })
    expect(inviteReferenceErasure({ invitedBy: 'u-other', acceptedBy: 'u-gone' }, 'u-gone'))
      .toEqual({ acceptedBy: '' })
  })

  it('lässt eine Zeile ohne Bezug in Ruhe — kein leeres Update', () => {
    expect(inviteReferenceErasure({ invitedBy: 'u-other', acceptedBy: '' }, 'u-gone')).toBeNull()
  })

  it('ist idempotent: eine schon gekappte Zeile ergibt nichts mehr', () => {
    expect(inviteReferenceErasure({ invitedBy: '', acceptedBy: '' }, 'u-gone')).toBeNull()
  })

  it('ohne Identität passiert NICHTS — sonst träfe `\'\'` jede gekappte Zeile', () => {
    expect(inviteReferenceErasure({ invitedBy: '', acceptedBy: '' }, '')).toBeNull()
  })
})
