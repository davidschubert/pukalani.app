import { describe, expect, it } from 'vitest'
import {
  communityPostponedProfileSignal,
  profileSignalAnswered,
  resolveProfileSignalVisibility,
  withCommunityPostponed,
  PROFILE_SIGNAL_SNOOZE_DAYS,
} from '../shared/profileSignal'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-08-12T10:00:00.000Z')

describe('profileSignalAnswered', () => {
  it('ist falsch ohne Signal und mit leerem Signal', () => {
    expect(profileSignalAnswered(undefined)).toBe(false)
    expect(profileSignalAnswered({})).toBe(false)
  })

  it('EINE Antwort genügt — Teilantworten gelten als beantwortet', () => {
    expect(profileSignalAnswered({ purpose: 'new' })).toBe(true)
    expect(profileSignalAnswered({ memberRange: 'to100' })).toBe(true)
    expect(profileSignalAnswered({ goal: 'discussion' })).toBe(true)
  })

  it('Bestand aus der Zeit vor U12 gilt als beantwortet und wird nie gefragt', () => {
    expect(profileSignalAnswered({ purpose: 'migrate', memberRange: 'to500', goal: 'reach' })).toBe(true)
  })
})

describe('communityPostponedProfileSignal / withCommunityPostponed', () => {
  it('ohne Merker ist nichts verschoben', () => {
    expect(communityPostponedProfileSignal('', 'c1', NOW)).toBe(false)
    expect(communityPostponedProfileSignal(undefined, 'c1', NOW)).toBe(false)
  })

  it('„Später" hält 30 Tage und läuft danach ab', () => {
    const pref = withCommunityPostponed('', 'c1', 'later', NOW)
    expect(communityPostponedProfileSignal(pref, 'c1', NOW)).toBe(true)
    expect(communityPostponedProfileSignal(pref, 'c1', NOW + (PROFILE_SIGNAL_SNOOZE_DAYS - 1) * DAY)).toBe(true)
    expect(communityPostponedProfileSignal(pref, 'c1', NOW + (PROFILE_SIGNAL_SNOOZE_DAYS + 1) * DAY)).toBe(false)
  })

  it('„Nicht mehr fragen" hält für immer', () => {
    const pref = withCommunityPostponed('', 'c1', 'never', NOW)
    expect(communityPostponedProfileSignal(pref, 'c1', NOW + 4000 * DAY)).toBe(true)
  })

  it('der Merker gilt je Community, nicht je Konto', () => {
    const pref = withCommunityPostponed('', 'c1', 'never', NOW)
    expect(communityPostponedProfileSignal(pref, 'c2', NOW)).toBe(false)
  })

  it('mehrere Communities stehen nebeneinander', () => {
    let pref = withCommunityPostponed('', 'c1', 'never', NOW)
    pref = withCommunityPostponed(pref, 'c2', 'later', NOW)
    expect(communityPostponedProfileSignal(pref, 'c1', NOW)).toBe(true)
    expect(communityPostponedProfileSignal(pref, 'c2', NOW)).toBe(true)
  })

  it('ist idempotent — zweimal klicken ändert nur die Frist', () => {
    const once = withCommunityPostponed('', 'c1', 'never', NOW)
    const twice = withCommunityPostponed(once, 'c1', 'never', NOW)
    expect(twice).toBe(once)
    expect(twice.split(',').filter(e => e.startsWith('c1:'))).toHaveLength(1)
  })

  it('„Später" kann auf „nie" hochgestuft werden', () => {
    const later = withCommunityPostponed('', 'c1', 'later', NOW)
    const never = withCommunityPostponed(later, 'c1', 'never', NOW)
    expect(communityPostponedProfileSignal(never, 'c1', NOW + 4000 * DAY)).toBe(true)
  })

  it('deckelt bei 50 Communities', () => {
    let pref = ''
    for (let i = 0; i < 60; i += 1) pref = withCommunityPostponed(pref, `c${i}`, 'never', NOW)
    expect(pref.split(',')).toHaveLength(50)
    // Der ÄLTESTE fällt raus, der jüngste bleibt.
    expect(communityPostponedProfileSignal(pref, 'c0', NOW)).toBe(false)
    expect(communityPostponedProfileSignal(pref, 'c59', NOW)).toBe(true)
  })

  it('ein kaputter Merker heisst „nicht verschoben" — die Karte kommt wieder', () => {
    expect(communityPostponedProfileSignal('kaputt', 'c1', NOW)).toBe(false)
    expect(communityPostponedProfileSignal('c1:', 'c1', NOW)).toBe(false)
    expect(communityPostponedProfileSignal(':1234', 'c1', NOW)).toBe(false)
    expect(communityPostponedProfileSignal('c1:vielleicht', 'c1', NOW)).toBe(false)
    expect(communityPostponedProfileSignal(42, 'c1', NOW)).toBe(false)
  })

  it('ohne communityId wird nie etwas verschoben', () => {
    const pref = withCommunityPostponed('', 'c1', 'never', NOW)
    expect(communityPostponedProfileSignal(pref, '', NOW)).toBe(false)
  })
})

describe('resolveProfileSignalVisibility', () => {
  it('zeigt die Karte nur mit eigenem Inhalt', () => {
    expect(resolveProfileSignalVisibility({ answered: false, postponed: false, hasOwnContent: true }).visible).toBe(true)
    expect(resolveProfileSignalVisibility({ answered: false, postponed: false, hasOwnContent: false }).visible).toBe(false)
  })

  it('beantwortet oder verschoben schlägt den eigenen Inhalt', () => {
    expect(resolveProfileSignalVisibility({ answered: true, postponed: false, hasOwnContent: true }).visible).toBe(false)
    expect(resolveProfileSignalVisibility({ answered: false, postponed: true, hasOwnContent: true }).visible).toBe(false)
  })
})
