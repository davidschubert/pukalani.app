import { describe, expect, it } from 'vitest'
import { createCommunityProfileSchema } from '../schemas/communityProfile'
import { createOnboardingSiteSchema } from '../schemas/onboarding'
import { SITE_DESCRIPTION_MAX, parseSiteProfile, serializeSiteProfile } from '../shared/onboarding'

const schema = createCommunityProfileSchema()

describe('createCommunityProfileSchema (U5)', () => {
  it('nimmt Name und Beschreibung und trimmt beide', () => {
    const parsed = schema.parse({ name: '  Morgenlicht  ', description: '  Wir treffen uns.  ' })
    expect(parsed.name).toBe('Morgenlicht')
    expect(parsed.description).toBe('Wir treffen uns.')
  })

  it('die Beschreibung ist optional und darf geleert werden', () => {
    expect(schema.parse({ name: 'Morgenlicht' }).description).toBeUndefined()
    expect(schema.parse({ name: 'Morgenlicht', description: '' }).description).toBe('')
  })

  it('der Name ist Pflicht — leer und nur Leerzeichen fallen durch', () => {
    expect(() => schema.parse({ name: '' })).toThrow()
    expect(() => schema.parse({ name: '   ' })).toThrow()
  })

  it('nimmt keine Fremdfelder an (strict) — insbesondere nicht den Host', () => {
    expect(() => schema.parse({ name: 'Morgenlicht', host: 'fremd.pukalani.app' })).toThrow()
    expect(() => schema.parse({ name: 'Morgenlicht', communityId: 'x' })).toThrow()
  })

  it('DIE GRENZEN SIND DIE DES WIZARDS — sonst könnte Umbenennen einen Zustand herstellen, den das Anlegen verweigert', () => {
    const wizard = createOnboardingSiteSchema()
    const wizardName = (value: string) =>
      wizard.safeParse({
        name: value,
        slug: 'morgenlicht',
        purpose: 'new',
        memberRange: 'none',
        category: 'club',
        goal: 'relationships',
        vibe: 'calm',
      }).success

    for (const value of ['a', 'ab', 'x'.repeat(120), 'x'.repeat(121)]) {
      expect(schema.safeParse({ name: value }).success).toBe(wizardName(value))
    }
  })

  it('die Beschreibung teilt die Obergrenze der Wizard-Antwort', () => {
    expect(schema.safeParse({ name: 'Morgenlicht', description: 'x'.repeat(SITE_DESCRIPTION_MAX) }).success).toBe(true)
    expect(schema.safeParse({ name: 'Morgenlicht', description: 'x'.repeat(SITE_DESCRIPTION_MAX + 1) }).success).toBe(false)
  })
})

describe('Umbenennen lässt die übrigen Wizard-Antworten stehen (profile.post.ts)', () => {
  // Die Route schreibt `{ ...parseSiteProfile(row.profile), description }`.
  // Hier wird genau diese Rechnung nachgestellt — sie ist der Grund, warum die
  // Route das Profil LIEST, statt es zu überschreiben.
  const stored = serializeSiteProfile({
    purpose: 'migrate',
    memberRange: 'to500',
    category: 'coaching',
    goal: 'knowledge',
    description: 'alt',
  })

  it('setzt nur die Beschreibung neu', () => {
    const next = parseSiteProfile(serializeSiteProfile({ ...parseSiteProfile(stored), description: 'neu' }))
    expect(next).toEqual({
      purpose: 'migrate',
      memberRange: 'to500',
      category: 'coaching',
      goal: 'knowledge',
      description: 'neu',
    })
  })

  it('eine geleerte Beschreibung verschwindet, die Antworten bleiben', () => {
    const next = parseSiteProfile(serializeSiteProfile({ ...parseSiteProfile(stored), description: '' }))
    expect(next.description).toBeUndefined()
    expect(next.purpose).toBe('migrate')
    expect(next.goal).toBe('knowledge')
  })
})
