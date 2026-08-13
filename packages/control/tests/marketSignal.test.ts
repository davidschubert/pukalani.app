import { describe, expect, it } from 'vitest'
import { tallyMarketSignal } from '../shared/marketSignal'
import { SITE_GOAL_IDS, SITE_MEMBER_RANGES, SITE_PURPOSES, type SiteProfile } from '../shared/onboarding'

function distribution(report: ReturnType<typeof tallyMarketSignal>, question: 'purpose' | 'memberRange' | 'goal') {
  const found = report.distributions.find(entry => entry.question === question)
  if (!found) throw new Error(`Verteilung fehlt: ${question}`)
  return found
}

describe('tallyMarketSignal', () => {
  it('zählt nichts, wenn es nichts gibt', () => {
    const report = tallyMarketSignal([])
    expect(report.communities).toBe(0)
    expect(report.answeredAny).toBe(0)
    expect(report.distributions).toHaveLength(3)
    for (const entry of report.distributions) {
      expect(entry.answered).toBe(0)
      expect(entry.unanswered).toBe(0)
      expect(entry.options.every(option => option.count === 0 && option.share === 0)).toBe(true)
    }
  })

  it('führt ALLE Katalog-Optionen auf, auch die von niemandem gewählten', () => {
    const report = tallyMarketSignal([{ purpose: 'new' }])
    expect(distribution(report, 'purpose').options.map(o => o.id)).toEqual([...SITE_PURPOSES])
    expect(distribution(report, 'memberRange').options.map(o => o.id)).toEqual([...SITE_MEMBER_RANGES])
    expect(distribution(report, 'goal').options.map(o => o.id)).toEqual([...SITE_GOAL_IDS])
  })

  it('behält die Katalog-Reihenfolge, nicht die Häufigkeit', () => {
    const profiles: SiteProfile[] = [
      { purpose: 'looking' }, { purpose: 'looking' }, { purpose: 'looking' }, { purpose: 'new' },
    ]
    expect(distribution(tallyMarketSignal(profiles), 'purpose').options.map(o => o.id)).toEqual([...SITE_PURPOSES])
  })

  it('rechnet den Anteil auf die BEANTWORTETEN, nicht auf alle Communities', () => {
    // 4 Communities, aber nur 2 haben den Zweck beantwortet.
    const profiles: SiteProfile[] = [{ purpose: 'new' }, { purpose: 'migrate' }, {}, { goal: 'reach' }]
    const purpose = distribution(tallyMarketSignal(profiles), 'purpose')
    expect(purpose.answered).toBe(2)
    expect(purpose.unanswered).toBe(2)
    expect(purpose.options.find(o => o.id === 'new')?.share).toBe(0.5)
    expect(purpose.options.find(o => o.id === 'migrate')?.share).toBe(0.5)
    expect(purpose.options.find(o => o.id === 'looking')?.share).toBe(0)
  })

  it('zählt jede Frage für sich — Teilantworten gehen nicht verloren', () => {
    const profiles: SiteProfile[] = [
      { purpose: 'new' },
      { memberRange: 'to100' },
      { goal: 'discussion' },
    ]
    const report = tallyMarketSignal(profiles)
    expect(report.communities).toBe(3)
    expect(report.answeredAny).toBe(3)
    expect(distribution(report, 'purpose').answered).toBe(1)
    expect(distribution(report, 'memberRange').answered).toBe(1)
    expect(distribution(report, 'goal').answered).toBe(1)
  })

  it('answeredAny zählt Communities, nicht Antworten', () => {
    const profiles: SiteProfile[] = [
      { purpose: 'new', memberRange: 'to100', goal: 'reach' },
      {},
    ]
    const report = tallyMarketSignal(profiles)
    expect(report.answeredAny).toBe(1)
    expect(report.communities).toBe(2)
  })

  it('ignoriert die Beschreibung und die Kategorie — das ist kein Markt-Signal', () => {
    const report = tallyMarketSignal([{ description: 'Hallo', category: 'coaching' }])
    expect(report.answeredAny).toBe(0)
  })

  it('ein Wert ausserhalb des Katalogs sprengt nichts', () => {
    // Kann über parseSiteProfile nicht ankommen; die Gegenprobe belegt, dass
    // ein Ausreisser als „beantwortet" zählt, aber in keinem Eimer landet.
    const report = tallyMarketSignal([{ purpose: 'erfunden' } as unknown as SiteProfile])
    const purpose = distribution(report, 'purpose')
    expect(purpose.answered).toBe(1)
    expect(purpose.options.reduce((sum, o) => sum + o.count, 0)).toBe(0)
  })
})
