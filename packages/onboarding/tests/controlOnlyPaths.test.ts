import { describe, expect, it } from 'vitest'
import { CONTROL_ONLY_PATHS, isControlOnlyPath } from '../shared/controlOnlyPaths'

/**
 * Die Sperre für Mandanten-Hosts. Jeder Fall hier ist eine Seite, die auf
 * `kunde.pukalani.app` NICHT existieren darf — und jede Gegenprobe eine, die
 * dort weiterhin ganz normal antworten muss.
 */
describe('Kundenbereichs-Pfade auf Mandanten-Hosts', () => {
  it('sperrt die vier Flächen des Kundenbereichs', () => {
    for (const path of ['/start', '/communities', '/profile', '/settings']) {
      expect(isControlOnlyPath(path), path).toBe(true)
    }
  })

  it('sperrt auch ihre Unterseiten', () => {
    for (const path of ['/start/community', '/start/done', '/settings/security', '/settings/data']) {
      expect(isControlOnlyPath(path), path).toBe(true)
    }
  })

  it('lässt die Community-Seiten in Ruhe', () => {
    // Alles, was einer Community gehört, muss auf ihrem Host antworten — allen
    // voran das Dashboard, in dem dieselben Konto-Reiter als Teil der
    // Community-Hülle stehen.
    for (const path of ['/', '/dashboard', '/dashboard/settings', '/dashboard/settings/data', '/login', '/join']) {
      expect(isControlOnlyPath(path), path).toBe(false)
    }
  })

  it('vergleicht an der SEGMENTGRENZE, nicht per Präfix', () => {
    // Ein fremder Pfad, der zufällig so anfängt, gehört nicht uns — und darf
    // deshalb auch nicht von uns 404 gemacht werden.
    for (const path of ['/startseite', '/settings-der-community', '/profileviewer', '/communities-faq']) {
      expect(isControlOnlyPath(path), path).toBe(false)
    }
  })

  it('hält die Liste und die Regel beieinander', () => {
    // Wer einen Pfad in die Konstante legt, bekommt ihn gesperrt — ohne dass
    // er die Funktion anfassen muss. Das ist der ganze Zweck der Trennung.
    for (const base of CONTROL_ONLY_PATHS) {
      expect(isControlOnlyPath(base), base).toBe(true)
    }
  })
})
