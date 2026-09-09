import { describe, expect, it } from 'vitest'
import {
  INSIGHTS_CORRECTION_PII_RETENTION_DAYS,
  insightsCorrectionRetentionAt,
  insightsCorrectionSchema,
  insightsCorrectionSweepDue,
} from '../shared/insightsCorrection'

/**
 * DER KORREKTURWEG (Plan §9.3) — die Regeln, an denen später eine
 * Auskunftspflicht und eine Aufbewahrungsfrist hängen.
 *
 * JEDE REGEL HAT HIER EINE GEGENPROBE. Eine Prüfung, die nur den guten Fall
 * kennt, ist bei einer Frist wertlos: sie bliebe grün, wenn der Sweep gar
 * nichts täte.
 */

/** Die kleinste gültige Zeile — jeder Test ändert genau ein Feld daran. */
function baseCorrection(): Record<string, unknown> {
  return {
    targetKind: 'brand',
    targetId: 'brand-1',
    kind: 'correction',
    field: 'industry',
    proposed: 'gastronomy',
    reason: 'Die Marke ist ein Röster, kein Händler.',
  }
}

describe('insightsCorrectionSchema', () => {
  it('nimmt einen vollständigen Korrekturvorschlag an', () => {
    const parsed = insightsCorrectionSchema.parse(baseCorrection())
    expect(parsed.status).toBe('open')
    expect(parsed.contactEmail).toBe('')
    expect(parsed.decisionNote).toBe('')
  })

  it('schreibt die Kontakt-Adresse KLEIN — sie ist der GDPR-Lesepfad', () => {
    const parsed = insightsCorrectionSchema.parse({
      ...baseCorrection(),
      contactEmail: '  Max.Muster@Example.COM ',
    })
    expect(parsed.contactEmail).toBe('max.muster@example.com')
  })

  it('lässt eine LEERE Adresse zu — der Weg ist freiwillig', () => {
    expect(insightsCorrectionSchema.parse({ ...baseCorrection(), contactEmail: '' }).contactEmail).toBe('')
  })

  it('GEGENPROBE: eine angegebene Adresse muss eine sein', () => {
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), contactEmail: 'kein-at-zeichen' }).success).toBe(false)
  })

  it('GEGENPROBE: ein zu langes Zitat im Vorschlag fällt (300 Zeichen)', () => {
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), proposed: 'x'.repeat(301) }).success).toBe(false)
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), proposed: 'x'.repeat(300) }).success).toBe(true)
  })

  it('GEGENPROBE: ein zu langer Feldname fällt (32 Zeichen)', () => {
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), field: 'x'.repeat(33) }).success).toBe(false)
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), field: 'x'.repeat(32) }).success).toBe(true)
  })

  it('GEGENPROBE: ein zu langer Grund fällt (300 Zeichen)', () => {
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), reason: 'x'.repeat(301) }).success).toBe(false)
  })

  it('ein Entfernungs-Wunsch OHNE Begründung fällt', () => {
    const removal = { ...baseCorrection(), kind: 'removal', proposed: '', reason: '' }
    expect(insightsCorrectionSchema.safeParse(removal).success).toBe(false)
    expect(insightsCorrectionSchema.safeParse({ ...removal, reason: 'Wir wollen nicht genannt werden.' }).success).toBe(true)
  })

  it('eine Ablehnung OHNE Notiz fällt, eine Annahme ohne Notiz nicht', () => {
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), status: 'declined' }).success).toBe(false)
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), status: 'accepted' }).success).toBe(true)
  })

  it('GEGENPROBE: unbekannte Zielart und unbekannter Status fallen', () => {
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), targetKind: 'comment' }).success).toBe(false)
    expect(insightsCorrectionSchema.safeParse({ ...baseCorrection(), status: 'pending' }).success).toBe(false)
  })
})

describe('insightsCorrectionRetentionAt', () => {
  it('legt die Frist 365 Tage nach die Anlage', () => {
    const created = new Date('2026-01-01T00:00:00.000Z')
    expect(insightsCorrectionRetentionAt(created).toISOString()).toBe('2027-01-01T00:00:00.000Z')
    expect(INSIGHTS_CORRECTION_PII_RETENTION_DAYS).toBe(365)
  })
})

describe('insightsCorrectionSweepDue', () => {
  const now = new Date('2027-01-01T00:00:00.000Z')

  it('eine überfällige Zeile mit Adresse ist fällig', () => {
    expect(insightsCorrectionSweepDue({ retentionAt: '2026-12-31T00:00:00.000Z', contactEmail: 'a@b.de' }, now)).toBe(true)
  })

  it('EXAKT auf dem Stichtag ist fällig — die Sekunde gehört der Löschung', () => {
    expect(insightsCorrectionSweepDue({ retentionAt: now.toISOString(), contactEmail: 'a@b.de' }, now)).toBe(true)
  })

  it('GEGENPROBE: eine Sekunde zu früh ist NICHT fällig', () => {
    expect(insightsCorrectionSweepDue({ retentionAt: '2027-01-01T00:00:01.000Z', contactEmail: 'a@b.de' }, now)).toBe(false)
  })

  it('GEGENPROBE: ohne lesbares Datum wird NICHT geleert — die Zeile ist ein Nachweis', () => {
    expect(insightsCorrectionSweepDue({ contactEmail: 'a@b.de' }, now)).toBe(false)
    expect(insightsCorrectionSweepDue({ retentionAt: 'irgendwann', contactEmail: 'a@b.de' }, now)).toBe(false)
  })

  it('GEGENPROBE: eine schon geleerte Zeile bekommt keinen zweiten Schreibvorgang', () => {
    expect(insightsCorrectionSweepDue({ retentionAt: '2020-01-01T00:00:00.000Z', contactEmail: '', ipHash: '' }, now)).toBe(false)
    // Der `ipHash` allein reicht: er ist derselbe Personenbezug, nur schwächer.
    expect(insightsCorrectionSweepDue({ retentionAt: '2020-01-01T00:00:00.000Z', contactEmail: '', ipHash: 'abc' }, now)).toBe(true)
  })
})
