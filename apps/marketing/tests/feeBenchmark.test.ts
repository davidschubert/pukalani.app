/**
 * Der Gebühren-Rechner (U17/E9) rechnet mit ZAHLEN, die aus einem
 * Audit-Dokument stammen — und genau daran kann er still verrotten: eine Zahl
 * lässt sich in `shared/marketing.ts` in fünf Sekunden „korrigieren", ohne dass
 * Typecheck, Lint oder irgendeine Seite widerspricht. Am Ende stünde auf einer
 * Seite, die mit Belegbarkeit wirbt, eine unbelegte Behauptung.
 *
 * Dieser Test nagelt deshalb ZWEI Dinge fest:
 *
 * 1. JEDE ZAHL GEGEN IHREN BELEG. Die Sätze und Grundpreise stehen hier ein
 *    zweites Mal, so wie sie in
 *    `docs/archiv/audits/2026-08-09-wettbewerb-benchmark.md` (Tabelle 2.1 und
 *    die Kurzprofile, Erhebungstag 2026-08-10) erhoben wurden. Eine Änderung
 *    an der Quelle muss hier durch — und wer hier ändert, wird durch den
 *    Kommentar auf das Dokument gestossen.
 *
 * 2. DIE VERGLEICHSSEITEN HABEN IHRE ZEILE. `/vs/skool` mit einem Rechner
 *    ohne Skool-Zeile wäre kein Fehler, den man beim Lesen des Codes sieht —
 *    die Seite rendert, die Tabelle ist nur um den einen Anbieter ärmer, um
 *    den es dort geht.
 */
import { describe, expect, it } from 'vitest'
import {
  FEE_CONTRIBUTION_MAX,
  FEE_CONTRIBUTION_MIN,
  FEE_DEFAULT_CONTRIBUTION,
  FEE_DEFAULT_MEMBERS,
  FEE_MEMBERS_MAX,
  FEE_MEMBERS_MIN,
  FEE_PROVIDERS,
  FEE_PUKALANI_MONTHLY,
  monthlyFee,
  VS_SLUGS,
} from '../shared/marketing'

/** Der Beleg, Anbieter → [Satz, Plan, Grundpreis]. Quelle: siehe Dateikopf. */
const BENCHMARK: Record<string, [number, string, string]> = {
  'circle': [0.02, 'Professional', '89 $'],
  'mighty-networks': [0.02, 'Launch', '95 $'],
  'skool': [0.029, 'Pro', '99 $'],
  'heartbeat': [0.05, 'Build', '49 $'],
  'coapp': [0.15, 'Starter', '19 €'],
}

describe('Gebühren-Benchmark', () => {
  it('trägt genau die belegten Anbieter', () => {
    expect(FEE_PROVIDERS.map(p => p.key).sort()).toEqual(Object.keys(BENCHMARK).sort())
  })

  it('nennt je Anbieter den belegten Satz, Plan und Grundpreis', () => {
    for (const provider of FEE_PROVIDERS) {
      expect([provider.rate, provider.plan, provider.base], provider.key).toEqual(BENCHMARK[provider.key])
    }
  })

  it('belegt jede Zeile mit einer Quell-URL', () => {
    for (const provider of FEE_PROVIDERS) {
      expect(provider.source, provider.key).toMatch(/^https:\/\//)
    }
  })

  // Ohne diesen Test kann eine neue Vergleichsseite entstehen, deren Rechner
  // den besprochenen Anbieter gar nicht kennt.
  it('hat für jede /vs/-Seite eine Zeile', () => {
    const keys = FEE_PROVIDERS.map(p => p.key)
    for (const slug of VS_SLUGS) expect(keys, slug).toContain(slug)
  })

  it('rechnet die Vorbelegung (300 Mitglieder à 20 €) wie von Hand', () => {
    const revenue = FEE_DEFAULT_MEMBERS * FEE_DEFAULT_CONTRIBUTION
    expect(revenue).toBe(6000)
    // 2 % von 6.000 € = 120 € im Monat — die Zahl, die in E9 als Beispiel steht.
    expect(monthlyFee(revenue, 0.02)).toBe(120)
    expect(monthlyFee(revenue, 0.029)).toBeCloseTo(174, 10)
    expect(monthlyFee(revenue, 0.15)).toBe(900)
  })

  // Der Kern der Aussage: unsere Spalte hängt NICHT am Umsatz. Ginge das
  // verloren, wäre der ganze Abschnitt sinnlos.
  it('kennt für Pukalani keinen Satz, nur einen Festpreis', () => {
    expect(FEE_PROVIDERS.some(p => /pukalani/i.test(p.name))).toBe(false)
    expect(FEE_PUKALANI_MONTHLY).toBe(149)
  })

  it('hält die Vorbelegung innerhalb der Regler-Grenzen', () => {
    expect(FEE_DEFAULT_MEMBERS).toBeGreaterThanOrEqual(FEE_MEMBERS_MIN)
    expect(FEE_DEFAULT_MEMBERS).toBeLessThanOrEqual(FEE_MEMBERS_MAX)
    expect(FEE_DEFAULT_CONTRIBUTION).toBeGreaterThanOrEqual(FEE_CONTRIBUTION_MIN)
    expect(FEE_DEFAULT_CONTRIBUTION).toBeLessThanOrEqual(FEE_CONTRIBUTION_MAX)
  })
})
