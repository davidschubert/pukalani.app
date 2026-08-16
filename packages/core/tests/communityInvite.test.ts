import { afterEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import {
  inviteOpensRegistrationFor,
  registerCommunityInviteResolver,
  resetCommunityInviteResolver,
} from '../server/utils/communityInvite'

/**
 * DIE ADRESSBINDUNG IST DIE GANZE SICHERUNG.
 *
 * Ein Einladungs-Token öffnet die Registrierung auf einer Community mit
 * geschlossener Anmeldung (Davids Entscheidung 2026-08-15). Ohne die Bindung an
 * die EINGELADENE Adresse wäre ein weitergeleiteter Link ein Generalschlüssel:
 * wer ihn hat, legte dort ein Konto auf eine beliebige Adresse an.
 *
 * Deshalb steht hier für jede Kante ein Fall — und jeder von ihnen wird ROT,
 * wenn man die entsprechende Zeile entfernt.
 */
const event = {} as H3Event

afterEach(() => {
  resetCommunityInviteResolver()
  vi.restoreAllMocks()
})

describe('inviteOpensRegistrationFor', () => {
  it('öffnet für die eingeladene Adresse', async () => {
    registerCommunityInviteResolver(() => ({ email: 'gast@example.test', role: 'editor' }))
    expect(await inviteOpensRegistrationFor(event, 'a'.repeat(64), 'gast@example.test')).toBe(true)
  })

  it('öffnet NICHT für eine andere Adresse', async () => {
    // Der Kern der Sache: ein weitergeleiteter Link darf kein fremdes Konto anlegen.
    registerCommunityInviteResolver(() => ({ email: 'gast@example.test', role: 'editor' }))
    expect(await inviteOpensRegistrationFor(event, 'a'.repeat(64), 'jemand.anderes@example.test')).toBe(false)
  })

  it('vergleicht unabhängig von Groß-/Kleinschreibung und Leerzeichen', async () => {
    // Appwrite speichert Konto-Mails klein; ein Formular liefert, was getippt wurde.
    registerCommunityInviteResolver(() => ({ email: 'gast@example.test', role: 'viewer' }))
    expect(await inviteOpensRegistrationFor(event, 'a'.repeat(64), '  GAST@Example.Test ')).toBe(true)
  })

  it('öffnet nicht ohne Token', async () => {
    registerCommunityInviteResolver(() => ({ email: 'gast@example.test', role: 'viewer' }))
    expect(await inviteOpensRegistrationFor(event, undefined, 'gast@example.test')).toBe(false)
    expect(await inviteOpensRegistrationFor(event, '', 'gast@example.test')).toBe(false)
    expect(await inviteOpensRegistrationFor(event, null, 'gast@example.test')).toBe(false)
  })

  it('öffnet nicht, wenn der Resolver die Einladung ablehnt', async () => {
    // Abgelaufen, widerrufen, schon angenommen, fremde Community — alles `null`.
    registerCommunityInviteResolver(() => null)
    expect(await inviteOpensRegistrationFor(event, 'a'.repeat(64), 'gast@example.test')).toBe(false)
  })

  it('öffnet nicht, wenn gar kein Resolver registriert ist', async () => {
    // Silo-Apps, Playground, CI: dort gibt es keine community_invites. Die
    // Sperre muss dann gelten, nicht wegfallen.
    expect(await inviteOpensRegistrationFor(event, 'a'.repeat(64), 'gast@example.test')).toBe(false)
  })

  it('öffnet nicht, wenn die Naht zum Control Plane wirft', async () => {
    // FAIL-CLOSED: eine tote Naht darf die Tür nicht aufschieben — und die
    // Registrierung auch nicht mit einem 500 beantworten.
    registerCommunityInviteResolver(() => { throw new Error('control plane down') })
    expect(await inviteOpensRegistrationFor(event, 'a'.repeat(64), 'gast@example.test')).toBe(false)
  })

  it('lässt sich nur EINMAL registrieren', async () => {
    // Zwei Autoritäten wären zwei Wahrheiten; dasselbe Muster wie beim
    // Join-Handler.
    registerCommunityInviteResolver(() => null)
    expect(() => registerCommunityInviteResolver(() => null)).toThrow(/already registered/i)
  })
})
