import { describe, expect, it } from 'vitest'
import {
  MEMBER_INVITES_PER_WEEK_DEFAULT,
  MEMBER_INVITE_WINDOW_MS,
  decideMemberInvite,
  memberInviteLimitFrom,
  memberInviteQuota,
  memberInviteWindowStart,
} from '../shared/communityInviteQuota'

/**
 * F57 Mechanik 2 — Einladungen durch Mitglieder (Davids Zuschnitt 2026-08-14).
 *
 * Die Regeln sind pur, damit Route UND Oberfläche dieselbe Antwort geben. Was
 * hier grün ist, ist damit auch das, was der Knopf zeigt — deshalb prüft der
 * letzte Block ausdrücklich, dass beide Leser übereinstimmen.
 */

const member = {
  managesTeam: false,
  role: 'viewer' as const,
  invitesEnabled: true,
  limit: 5,
  used: 0,
}

describe('decideMemberInvite — das Mitglied', () => {
  it('lässt die Einladung durch, solange das Kontingent reicht', () => {
    for (const used of [0, 1, 4]) {
      expect(decideMemberInvite({ ...member, used }), String(used)).toEqual({ ok: true })
    }
  })

  it('sperrt bei erschöpftem Kontingent — die 6. in derselben Woche', () => {
    expect(decideMemberInvite({ ...member, used: 5 }))
      .toEqual({ ok: false, reason: 'invite_quota_exhausted' })
    // Auch darüber hinaus (eine Zeile könnte vor einer Config-Senkung entstanden sein).
    expect(decideMemberInvite({ ...member, used: 9 }))
      .toEqual({ ok: false, reason: 'invite_quota_exhausted' })
  })

  it('sperrt jede Rolle ausser viewer — auch bei freiem Kontingent', () => {
    for (const role of ['admin', 'moderator', 'editor', 'owner'] as const) {
      expect(decideMemberInvite({ ...member, role }), role)
        .toEqual({ ok: false, reason: 'invite_role_forbidden' })
    }
  })

  it('sperrt, wenn der Owner die Mechanik abgeschaltet hat', () => {
    expect(decideMemberInvite({ ...member, invitesEnabled: false }))
      .toEqual({ ok: false, reason: 'member_invites_disabled' })
  })

  it('sperrt, wenn die Plattform sie abgeschaltet hat (limit 0)', () => {
    expect(decideMemberInvite({ ...member, limit: 0 }))
      .toEqual({ ok: false, reason: 'member_invites_disabled' })
  })

  /**
   * Die REIHENFOLGE ist eine Zusage an den Menschen davor: bei
   * abgeschalteter Mechanik erfährt er „abgeschaltet" und nicht „falsche
   * Rolle". Die erste Antwort ist die wahre; eine falsche erste Antwort
   * schickt ihn in den Support.
   */
  it('nennt bei mehreren Hindernissen zuerst den Schalter', () => {
    expect(decideMemberInvite({ ...member, invitesEnabled: false, role: 'admin', used: 99 }))
      .toEqual({ ok: false, reason: 'member_invites_disabled' })
    expect(decideMemberInvite({ ...member, role: 'admin', used: 99 }))
      .toEqual({ ok: false, reason: 'invite_role_forbidden' })
  })
})

describe('decideMemberInvite — Owner/Admin bleiben unberührt', () => {
  /**
   * Die Bedingung, unter der diese Mechanik gebaut werden durfte: sie fügt
   * ein Recht HINZU und beschneidet keines. Fiele dieser Test, hätte der
   * Owner seiner eigenen Community mit dem Schalter das Einladen genommen.
   */
  it('kein Kontingent, kein Schalter, jede Rolle', () => {
    const owner = { ...member, managesTeam: true }
    expect(decideMemberInvite({ ...owner, used: 999 })).toEqual({ ok: true })
    expect(decideMemberInvite({ ...owner, invitesEnabled: false })).toEqual({ ok: true })
    expect(decideMemberInvite({ ...owner, limit: 0 })).toEqual({ ok: true })
    for (const role of ['admin', 'moderator', 'editor', 'viewer'] as const) {
      expect(decideMemberInvite({ ...owner, role }), role).toEqual({ ok: true })
    }
  })

  /**
   * 'owner' als Wunschrolle fällt NICHT hier durch, sondern in `decideInvite`
   * — für jeden Einladenden gleich. Diese Datei fügt nur hinzu, was für
   * MITGLIEDER zusätzlich gilt; würde sie 'owner' hier abfangen, gäbe es zwei
   * Orte für dieselbe Regel.
   */
  it('lässt owner als Wunschrolle durch — das lehnt decideInvite ab', () => {
    expect(decideMemberInvite({ ...member, managesTeam: true, role: 'owner' })).toEqual({ ok: true })
  })
})

describe('memberInviteQuota — die Anzeige', () => {
  it('rechnet den Rest für ein Mitglied', () => {
    expect(memberInviteQuota({ managesTeam: false, invitesEnabled: true, limit: 5, used: 2 }))
      .toEqual({ enabled: true, unlimited: false, limit: 5, used: 2, remaining: 3 })
  })

  it('fällt nie unter null', () => {
    expect(memberInviteQuota({ managesTeam: false, invitesEnabled: true, limit: 5, used: 8 }).remaining).toBe(0)
  })

  it('meldet Owner/Admin als unbegrenzt', () => {
    const view = memberInviteQuota({ managesTeam: true, invitesEnabled: false, limit: 5, used: 0 })
    expect(view.unlimited).toBe(true)
    expect(view.enabled).toBe(true)
  })

  it('meldet abgeschaltet als nicht erlaubt', () => {
    expect(memberInviteQuota({ managesTeam: false, invitesEnabled: false, limit: 5, used: 0 }).enabled).toBe(false)
    expect(memberInviteQuota({ managesTeam: false, invitesEnabled: true, limit: 0, used: 0 }).enabled).toBe(false)
  })

  /**
   * DER EIGENTLICHE ZWECK DER PURITÄT: die Oberfläche zeigt genau dann einen
   * Knopf, wenn die Route ihn auch bedient. Ein Knopf, der 403 erntet, ist
   * schlimmer als kein Knopf — und ein fehlender Knopf bei erlaubtem Einladen
   * ist ein verschwundenes Produkt.
   */
  it('stimmt in JEDEM Fall mit der durchsetzenden Regel überein', () => {
    for (const managesTeam of [true, false]) {
      for (const invitesEnabled of [true, false]) {
        for (const limit of [0, 1, 5]) {
          for (const used of [0, 1, 5, 9]) {
            const facts = { managesTeam, invitesEnabled, limit, used }
            expect(memberInviteQuota(facts).enabled, JSON.stringify(facts))
              .toBe(decideMemberInvite({ ...facts, role: 'viewer' }).ok)
          }
        }
      }
    }
  })
})

describe('memberInviteLimitFrom — defensiv', () => {
  it('nimmt gültige Zahlen', () => {
    expect(memberInviteLimitFrom(5)).toBe(5)
    expect(memberInviteLimitFrom(0)).toBe(0)
    expect(memberInviteLimitFrom(12.7)).toBe(12)
  })

  /**
   * Eine vertippte Config darf ein Missbrauchs-Limit NICHT aufheben. Deshalb
   * fällt alles Unbrauchbare auf die Vorgabe zurück und nicht auf
   * „unbegrenzt" — abschalten geht ausdrücklich über die 0.
   */
  it('fällt bei Unsinn auf die Vorgabe zurück, nie auf unbegrenzt', () => {
    for (const value of [undefined, null, '5', {}, Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(memberInviteLimitFrom(value), String(value)).toBe(MEMBER_INVITES_PER_WEEK_DEFAULT)
    }
  })
})

describe('memberInviteWindowStart', () => {
  it('liegt genau sieben Tage zurück', () => {
    const now = Date.parse('2026-08-14T12:00:00.000Z')
    expect(memberInviteWindowStart(now)).toBe('2026-08-07T12:00:00.000Z')
    expect(now - Date.parse(memberInviteWindowStart(now))).toBe(MEMBER_INVITE_WINDOW_MS)
  })

  /**
   * ROLLIEREND, nicht kalendarisch (Davids Wort: „5 pro Woche"). Ein
   * Kalenderfenster verschenkte um Mitternacht am Wochenwechsel fünf frische
   * Versuche — genau der Moment, den ein Skript abwartet.
   */
  it('wandert mit der Zeit mit', () => {
    const a = memberInviteWindowStart(Date.parse('2026-08-14T12:00:00.000Z'))
    const b = memberInviteWindowStart(Date.parse('2026-08-14T13:00:00.000Z'))
    expect(b > a).toBe(true)
  })
})
