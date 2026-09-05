import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEMO_CLAIMS, DEMO_PROFILES, demoHref } from '../.playground/app/utils/demoMarket'
import type { MarketEvidence } from '../shared/marketProfile'

/**
 * DER HALLUZINATIONS-RIEGEL IM KLEINEN (Plan §2.2: `evidence ⊂ rawText`).
 *
 * Im Produkt prüft der Server deterministisch, dass jedes Zitat WÖRTLICH im
 * abgerufenen Text vorkommt — sonst wird das Feld verworfen. Der Prototyp hat
 * keinen Server, aber dieselbe Pflicht: seine Belege zeigen auf die drei
 * erfundenen Demo-Websites, und wer dort einen Satz ändert, ohne die
 * Demo-Daten mitzuziehen, baut genau die Lüge ein, die das Produkt nie
 * erzählen darf.
 *
 * DIE GEGENPROBE steht im Test selbst: ein erfundenes Zitat muss durchfallen.
 * Ohne sie wäre nicht zu unterscheiden, ob die Prüfung greift oder ob sie nur
 * nichts findet.
 */
const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '../.playground/public')

/** Das rohe HTML der Seite, auf die ein Beleg zeigt. */
function pageText(sourceUrl: string): string {
  return readFileSync(join(PUBLIC_DIR, demoHref(sourceUrl)), 'utf8')
}

const allEvidence: MarketEvidence[] = [
  ...DEMO_PROFILES.flatMap(profile => profile.fields.flatMap(field => (field.evidence ? [field.evidence] : []))),
  ...DEMO_CLAIMS.flatMap(list => list.entries.flatMap(entry => (entry.citations ?? []).map(c => c.evidence))),
]

describe('Belege der Demo-Daten', () => {
  it('hat überhaupt Belege zu prüfen', () => {
    expect(allEvidence.length).toBeGreaterThan(15)
  })

  it('jedes Zitat steht wörtlich auf der Seite, auf die es zeigt', () => {
    for (const evidence of allEvidence) {
      expect(pageText(evidence.sourceUrl), `${evidence.sourceUrl}: ${evidence.quote}`)
        .toContain(evidence.quote)
    }
  })

  it('Gegenprobe: ein erfundenes Zitat fällt durch', () => {
    expect(pageText('https://upcountry-roast.example')).not.toContain('We roast exclusively at night.')
  })

  it('hält die Zitatschranke ein (≤ 200 Zeichen)', () => {
    for (const evidence of allEvidence) expect(evidence.quote.length).toBeLessThanOrEqual(200)
  })

  it('nennt nur erfundene .example-Adressen', () => {
    for (const evidence of allEvidence) expect(evidence.sourceUrl).toMatch(/^https:\/\/[a-z-]+\.example(\/[a-z]+)?$/)
  })
})
