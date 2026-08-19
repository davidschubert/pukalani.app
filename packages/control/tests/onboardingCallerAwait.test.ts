import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * JEDE AUFRUFSTELLE DES NAHT-GATES WARTET AUF IHRE ANTWORT (A0, 2026-08-18).
 *
 * `requireOnboardingCaller` ist seit dem Umzug der Naht-Geheimnisse in die
 * Betreiber-Konsole ASYNC — es liest die Ablage-Zeile, und das ist ein
 * Appwrite-Ruf. Ohne `await` wäre das Gate FAIL-OPEN und nicht etwa kaputt:
 * ein Promise ist truthy, `throw` geschieht erst später und landet in einer
 * unbehandelten Ablehnung, während der Handler längst weitergelaufen ist.
 * Genau davor warnt CLAUDE.md bei `requireCommunityPermission` („die ist
 * synchron und wird ohne await gerufen") — nur ist es hier umgekehrt: die
 * Funktion ist jetzt asynchron, und die 49 Aufrufstellen müssen es wissen.
 *
 * Die Prüfung ist STRUKTURELL, weil der Fehler strukturell wäre: kein Typ und
 * kein Test einer einzelnen Route fällt darüber (der Aufruf ist syntaktisch
 * gültig, der Test einer Route mit gültigem Secret bleibt grün). Eine NEUE
 * Service-Route ohne `await` bricht dagegen genau hier.
 */

const apiDir = fileURLToPath(new URL('../server/api/control', import.meta.url))

function routeFiles(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return routeFiles(`${dir}/${entry.name}`, `${prefix}${entry.name}/`)
    return entry.name.endsWith('.ts') ? [`${prefix}${entry.name}`] : []
  })
}

const callers = routeFiles(apiDir)
  .map(file => ({ file, source: readFileSync(`${apiDir}/${file}`, 'utf8') }))
  .filter(({ source }) => source.includes('requireOnboardingCaller('))

describe('Service-Naht: das Gate wird immer abgewartet', () => {
  it('findet die Service-Routen überhaupt', () => {
    // Ein Wächter, der nichts findet, ist grün und wertlos — z. B. nach einer
    // Umbenennung des Ordners.
    expect(callers.length).toBeGreaterThan(40)
  })

  it.each(callers.map(c => c.file))('%s ruft `await requireOnboardingCaller`', (file) => {
    const source = callers.find(c => c.file === file)!.source
    const calls = source.match(/requireOnboardingCaller\(/g)?.length ?? 0
    const awaited = source.match(/await requireOnboardingCaller\(/g)?.length ?? 0
    expect(awaited).toBe(calls)
  })
})

describe('Der Empfänger prüft gegen die MENGE, nicht gegen einen Wert', () => {
  const gate = readFileSync(fileURLToPath(new URL('../server/utils/onboardingService.ts', import.meta.url)), 'utf8')

  it('benutzt den geteilten Helfer statt einer eigenen Kopie', () => {
    // Vor A0 stand hier eine eigene `secretsMatch`-Kopie — dieselbe wie im
    // domains-Layer. Zwei Kopien einer Vertrauensnaht sind genau die Sorte
    // Doppelpflege, bei der eines Tages nur eine beide Werte annimmt.
    expect(gate).toContain('seamSecretsFor')
    expect(gate).toContain('seamSecretMatches')
    expect(gate).not.toContain('timingSafeEqual')
  })

  it('bleibt bei 404 ohne jede Konfiguration und 401 bei falschem Wert', () => {
    // Die zwei Antworten sind eine Aussage: „gibt es hier nicht" gegen „du
    // bist es nicht". Wer sie zusammenlegt, macht die Route zum Orakel.
    expect(gate).toContain('status: 404')
    expect(gate).toContain('status: 401')
  })
})
