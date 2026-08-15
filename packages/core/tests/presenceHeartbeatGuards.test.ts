import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Der Anwesenheits-Heartbeat läuft nur dort, wo es einen Mandanten GIBT.
 *
 * `usePresenceState()` schickt alle 20 Sekunden ein `POST
 * /api/presence/heartbeat`. Auf einem KONTROLL-Host (Kundenbereich) lässt
 * `01.control-center.ts` nur freigegebene Präfixe durch — dieser Pfad gehört
 * nicht dazu und antwortet 404. Ohne die Wache feuerte deshalb jeder
 * eingeloggte Besucher von account.pukalani.app im 20-Sekunden-Takt einen
 * garantiert erfolglosen Request, pro offenem Tab, für die ganze Sitzung
 * (2026-08-15 beim Durchspielen der eingeloggten Kundenreise gemessen).
 *
 * Sichtbar war davon NICHTS: `.catch(() => {})` verschluckt den Fehler, die
 * Seite funktioniert. Genau deshalb steht hier ein Test — ein Fehler, den
 * niemand bemerkt, wird auch von niemandem verhindert.
 *
 * DIESELBE BEGRÜNDUNG GALT SCHON FÜR DIE FEHLERSEITE und stand als Absatz im
 * Plugin, bevor es die zweite Wache gab: „Anwesenheit auf einer Seite, die es
 * nicht gibt, ist auch fachlich nichts." Beide Wachen gehören zusammen, also
 * prüft der Test beide.
 *
 * Die Frage ist bewusst „Kontroll-Host?" und nicht „Mandanten-Host?": eine
 * Silo-App hat gar keine Kontroll-Hosts, dort muss die Anwesenheit
 * weiterlaufen.
 */
const datei = readFileSync(
  new URL('../app/plugins/presence-heartbeat.client.ts', import.meta.url),
  'utf8',
)

/**
 * NUR DER CODE-RUMPF, nicht der Kopf-Kommentar. Der erklärt beide Wachen und
 * nennt dabei `usePresenceState()` und `useIsControlCenter()` — eine Prüfung
 * über die ganze Datei misst also die Erklärung mit und behauptet eine
 * Reihenfolge, die es im Code gar nicht gibt (beim Schreiben dieses Tests
 * prompt passiert).
 */
const quelle = datei.slice(datei.indexOf('export default defineNuxtPlugin'))

describe('presence-heartbeat-Plugin', () => {
  it('startet nicht auf einem Kontroll-Host', () => {
    const ausstieg = quelle.indexOf('useIsControlCenter()')
    const start = quelle.indexOf('usePresenceState()')
    expect(ausstieg, 'keine Kontroll-Host-Prüfung im Rumpf').toBeGreaterThan(-1)
    expect(start, 'kein Start im Rumpf').toBeGreaterThan(-1)
    // Der frühe Ausstieg muss VOR dem Start stehen, sonst läuft der Heartbeat
    // trotzdem einmal an.
    expect(ausstieg, 'Kontroll-Host-Prüfung steht nach dem Start').toBeLessThan(start)
  })

  it('startet nicht auf einer Fehlerseite, holt es aber nach', () => {
    expect(quelle).toContain('useError()')
    // `watch` statt eines blossen `return`: ein Tab, der EINMAL auf einer 404
    // gelandet ist, darf nicht für den Rest der Sitzung unsichtbar bleiben.
    expect(quelle).toMatch(/watch\(\s*error/)
  })
})
