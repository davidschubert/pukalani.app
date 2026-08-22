import { describe, expect, it } from 'vitest'
import * as contact from '../app/data/contact'
import * as erstgespraech from '../app/data/erstgespraech'
import * as home from '../app/data/home'
import * as localized from '../app/data/localized'
import * as nuxtFreelancer from '../app/data/nuxtFreelancer'
import * as services from '../app/data/services'
import * as uxAudit from '../app/data/uxAudit'
import * as wissenFreelancerAgentur from '../app/data/wissenFreelancerAgentur'
import * as wissenKosten from '../app/data/wissenKosten'

/**
 * WÄCHTER GEGEN HALB ÜBERSETZTE SEKTIONEN.
 *
 * Die zweisprachigen Inhalte dieser Site sind typisierte Daten im App-Code
 * (`app/data/*.ts`, Begründung im Kopf von `localized.ts`) — und `Localized<T>`
 * verlangt zwar BEIDE Sprachen, sagt aber nichts über den Inhalt: `{ de: '…',
 * en: '' }` ist typkorrekt. Genau das ist der Fehler, der hier passiert: eine
 * Sektion wird auf Deutsch geschrieben, die englische Fassung bleibt als leerer
 * Platzhalter stehen, und auf `/ux-audit` steht dann eine Überschrift ohne Text.
 * Weder Typecheck noch Lint sehen das, und die E2E-Tests prüfen ANKER, nicht
 * Fließtext — es fiele erst einem englischsprachigen Besucher auf.
 *
 * Deshalb läuft dieser Test REKURSIV über alle Exporte der Datenmodule und
 * prüft jedes Objekt, das nach `Localized` aussieht (es trägt `de` ODER `en`):
 *
 *  1. Es trägt BEIDE Schlüssel — ein einsprachiges `{ de: '…' }` fällt auf.
 *  2. Beide Seiten sind gleichartig (String↔String, Array↔Array).
 *  3. Strings sind nicht leer, Arrays sind gleich lang und ohne leere Einträge
 *     (`Localized<string[]>`: Trust-Badges, `knowsAbout` — eine kürzere Liste
 *     ist dieselbe Lücke, nur unauffälliger).
 *
 * Der Test kennt die Datenmodule NICHT im Detail: er läuft über `import *`, ein
 * neuer Export ist damit automatisch abgedeckt. Neue Datei ⇒ hier importieren.
 */

/** Die geprüften Module — Schlüssel nur für die Fehlermeldung. */
const MODULES: Record<string, Record<string, unknown>> = {
  'localized.ts': localized,
  'contact.ts': contact,
  'services.ts': services,
  'home.ts': home,
  'erstgespraech.ts': erstgespraech,
  'uxAudit.ts': uxAudit,
  'nuxtFreelancer.ts': nuxtFreelancer,
  'wissenKosten.ts': wissenKosten,
  'wissenFreelancerAgentur.ts': wissenFreelancerAgentur,
}

/** Ein Befund: Pfad zum Wert plus Klartext, was fehlt. */
interface Finding {
  path: string
  problem: string
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Trägt `de` ODER `en` — ab hier gelten die Paritätsregeln. */
function looksLocalized(value: Record<string, unknown>): boolean {
  return 'de' in value || 'en' in value
}

/**
 * Prüft eine Sprachseite. Rückgabe: Klartext-Problem oder `null`.
 * Getrennt von `checkLocalized`, damit `de` und `en` WÖRTLICH dieselbe Regel
 * bekommen — eine kopierte Bedingung wäre genau die Stelle, an der eine der
 * beiden Sprachen später stillschweigend nachlässiger geprüft wird.
 */
function describeSide(side: unknown): string | null {
  if (typeof side === 'string') return side.trim() === '' ? 'leerer String' : null
  if (Array.isArray(side)) {
    if (side.length === 0) return 'leeres Array'
    const empty = side.findIndex(entry => typeof entry !== 'string' || entry.trim() === '')
    return empty === -1 ? null : `Eintrag [${empty}] ist leer oder kein String`
  }
  return `unerwarteter Typ ${typeof side}`
}

function checkLocalized(value: Record<string, unknown>, path: string, findings: Finding[]): void {
  const de = value.de
  const en = value.en

  if (de === undefined) {
    findings.push({ path, problem: 'de fehlt' })
    return
  }
  if (en === undefined) {
    findings.push({ path, problem: 'en fehlt' })
    return
  }

  const deIsArray = Array.isArray(de)
  const enIsArray = Array.isArray(en)
  if (deIsArray !== enIsArray) {
    findings.push({ path, problem: `de ist ${deIsArray ? 'Array' : typeof de}, en ist ${enIsArray ? 'Array' : typeof en}` })
    return
  }

  const deProblem = describeSide(de)
  if (deProblem) findings.push({ path: `${path}.de`, problem: deProblem })
  const enProblem = describeSide(en)
  if (enProblem) findings.push({ path: `${path}.en`, problem: enProblem })

  if (deIsArray && enIsArray && (de as unknown[]).length !== (en as unknown[]).length) {
    findings.push({
      path,
      problem: `Array-Längen laufen auseinander (de ${(de as unknown[]).length}, en ${(en as unknown[]).length})`,
    })
  }
}

function walk(value: unknown, path: string, findings: Finding[]): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, `${path}[${index}]`, findings))
    return
  }
  if (!isPlainObject(value)) return

  if (looksLocalized(value)) {
    checkLocalized(value, path, findings)
    return
  }
  for (const [key, entry] of Object.entries(value)) walk(entry, `${path}.${key}`, findings)
}

describe('Zweisprachige Datenmodule', () => {
  for (const [moduleName, moduleExports] of Object.entries(MODULES)) {
    it(`${moduleName}: jede Localized-Struktur trägt de UND en, beide gefüllt`, () => {
      const findings: Finding[] = []
      for (const [exportName, value] of Object.entries(moduleExports)) {
        // Funktionen (z. B. `findCase`) und Typen tragen keine Inhalte.
        if (typeof value === 'function') continue
        walk(value, `${moduleName} → ${exportName}`, findings)
      }
      // Alle Befunde auf einmal (nicht der erste): wer eine Sektion nachträgt,
      // will die vollständige Liste sehen, nicht sieben Läufe hintereinander.
      const report = findings.map(f => `${f.path}: ${f.problem}`)
      expect(report, `Lücken in der Übersetzung:\n${report.join('\n')}`).toEqual([])
    })
  }
})

/**
 * Die FAQ-Arrays speisen sichtbaren Inhalt UND das FAQPage-JSON-LD (siehe
 * `localized.ts`). Eine leere Liste erzeugt deshalb nicht nur eine leere
 * Sektion, sondern ein FAQPage ohne `mainEntity` — das ist gegenüber Google
 * eine falsche Behauptung, keine fehlende Angabe. Die Paritätsprüfung oben
 * deckt das NICHT ab: ein leeres Array hat keine Einträge, in die sie laufen
 * könnte.
 */
const FAQ_LISTS: Record<string, unknown[]> = {
  'home.FAQS': home.FAQS,
  'uxAudit.AUDIT_FAQS': uxAudit.AUDIT_FAQS,
  'nuxtFreelancer.NUXT_FAQS': nuxtFreelancer.NUXT_FAQS,
  'wissenKosten.KOSTEN_FAQS': wissenKosten.KOSTEN_FAQS,
  'wissenFreelancerAgentur.AGENTUR_FAQS': wissenFreelancerAgentur.AGENTUR_FAQS,
}

describe('FAQ-Listen', () => {
  for (const [name, list] of Object.entries(FAQ_LISTS)) {
    it(`${name} hat Einträge mit Frage und Antwort in beiden Sprachen`, () => {
      expect(list.length).toBeGreaterThan(0)
      for (const [index, entry] of list.entries()) {
        const faq = entry as { question?: Record<string, unknown>, answer?: Record<string, unknown> }
        for (const field of ['question', 'answer'] as const) {
          const side = faq[field]
          expect(isPlainObject(side), `${name}[${index}].${field} fehlt`).toBe(true)
          for (const lang of ['de', 'en'] as const) {
            const text = (side as Record<string, unknown>)[lang]
            expect(typeof text, `${name}[${index}].${field}.${lang} ist kein String`).toBe('string')
            expect((text as string).trim().length, `${name}[${index}].${field}.${lang} ist leer`).toBeGreaterThan(0)
          }
        }
      }
    })
  }
})
