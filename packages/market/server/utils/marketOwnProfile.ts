import type { H3Event } from 'h3'
import { confirmedSlotValues, loadStepRows } from '../contracts/brandContract'
import type { MarketFieldId, MarketProfileField } from '../../shared/marketProfile'
import { MARKET_FIELDS } from '../../shared/marketProfile'
import { requireOwnedMarketProfile } from './marketStore'

/**
 * DAS EIGENE MARKTPROFIL AUS DER FOUNDATION (Plan §2.3 Nr. 4, §7.2 Nr. 2).
 *
 * ── EINE FUNKTION FÜR ZWEI FÄLLE ──────────────────────────────────────────
 * Dieselbe Rechnung beantwortet „wie sieht UNSERE Marke im Vergleich aus" und
 * „wie sieht die andere Marke DESSELBEN KONTOS aus" (der Relaunch-Fall:
 * `sourceKind: 'foundation'`, `sourceRef` = ein zweites Branding). Es gibt
 * keinen Unterschied zwischen beiden — ein Branding ist ein Branding —, und
 * zwei Fassungen davon liefen beim ersten neuen Feld auseinander.
 *
 * ── NUR BESTÄTIGTE WERTE, NIE ENTWÜRFE ────────────────────────────────────
 * `confirmedSlotValues` liest ausschliesslich `slots[<id>].confirmed`. Ein
 * `latestDraft` ist ein Vorschlag, über den niemand entschieden hat; er im
 * Vergleich neben den ZITATEN fremder Websites stünde als Aussage der Marke da
 * — und der Kunde bekäme einen Befund zu einem Satz, den er nie beschlossen
 * hat.
 *
 * ── OHNE BELEG, UND ZWAR ABSICHTLICH ──────────────────────────────────────
 * Eine Foundation ist BESCHLOSSEN, nicht zitiert. Ein `evidence` wäre eine
 * Quellenangabe auf sich selbst; das Ablage-Schema lässt für `source:
 * 'foundation'` deshalb ausdrücklich ein Feld ohne Beleg zu. Ebenso fehlt die
 * HÄUFIGKEIT: „auf wie vielen Seiten steht das" hat hier keine Antwort, und
 * eine erfundene `1 von 1` sähe aus wie eine Messung.
 *
 * ── FEHLENDE FELDER BLEIBEN STEHEN, LEER ──────────────────────────────────
 * Alle zehn Felder kommen zurück, auch die unbestätigten. Das ist die Zusage
 * aus §2.4: der Bericht nennt, was bei EUCH noch nicht steht („Tonwörter
 * stehen bei euch noch nicht — der Vergleich dort kommt nach Kapitel D"). Eine
 * gefilterte Liste könnte das nicht mehr sagen; sie sähe aus wie ein
 * vollständiges Profil mit weniger Feldern.
 */

export interface MarketOwnProfile {
  readonly fields: readonly MarketProfileField[]
  /**
   * WELCHER Slot je Marktprofil-Feld gilt — die Rückrichtung der Abbildung.
   *
   * Sie wird gebraucht, weil ein Markt-Befund an ein EIGENES Feld gehängt wird
   * (`brand_findings.slots`), das Modell aber nur die Marktprofil-Id kennt.
   * `categoryLanguage` bildet auf ZWEI Slots ab (`a.category`,
   * `b.positioningCategory`); genommen wird der, aus dem der Wert tatsächlich
   * stammt — ein Chip am anderen führte den Menschen an ein Feld, in dem der
   * beanstandete Satz gar nicht steht.
   */
  readonly slotByField: ReadonlyMap<MarketFieldId, string>
  /** Die Ids der Felder, die bei uns noch nicht bestätigt sind (§2.4). */
  readonly missingFieldIds: readonly MarketFieldId[]
}

export async function loadMarketOwnProfile(
  event: H3Event,
  profileId: string,
): Promise<MarketOwnProfile> {
  const rows = await loadStepRows(event, profileId)
  const values = new Map<string, string>()
  for (const row of rows) {
    for (const entry of confirmedSlotValues(row)) {
      if (!values.has(entry.slotId)) values.set(entry.slotId, entry.value)
    }
  }

  const fields: MarketProfileField[] = []
  const slotByField = new Map<MarketFieldId, string>()
  const missingFieldIds: MarketFieldId[] = []

  for (const definition of MARKET_FIELDS) {
    // Der ERSTE bestätigte Slot in der Reihenfolge der Abbildung gewinnt — sie
    // ist im Produktvertrag festgelegt, und „der spätere überschreibt" wäre
    // eine zweite, ungeschriebene Regel.
    const hit = definition.slotIds
      .map(slotId => ({ slotId, value: (values.get(slotId) ?? '').trim() }))
      .find(entry => entry.value)

    if (!hit) {
      fields.push({ fieldId: definition.id, value: '', source: 'foundation' })
      missingFieldIds.push(definition.id)
      continue
    }

    slotByField.set(definition.id, hit.slotId)
    // Der Rückfall auf den ERSTEN Slot der Abbildung gilt nur für die
    // Befund-Zuordnung leerer Felder — ein Befund an einem leeren Feld ist
    // möglich („hier steht bei euch nichts, im Feld aber überall etwas").
    if (definition.form !== 'list') {
      fields.push({ fieldId: definition.id, value: hit.value.slice(0, 2000), source: 'foundation' })
      continue
    }
    // Listen-Felder liegen im Wizard als EINE Zeile („Handwerk, Nähe, Ruhe")
    // oder als Aufzählung — beides wird hier zu Einträgen.
    const items = hit.value
      .split(/[,\n]/)
      .map(part => part.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, definition.maxItems ?? 5)
    fields.push({
      fieldId: definition.id,
      value: items.join(', '),
      items,
      source: 'foundation',
    })
  }

  return { fields, slotByField, missingFieldIds }
}

/**
 * DAS PROFIL EINES KANDIDATEN MIT `sourceKind: 'foundation'`.
 *
 * ── DIE BESITZ-PRÜFUNG IST NICHT VERHANDELBAR ─────────────────────────────
 * `sourceRef` kommt aus einer Zeile, die der Kunde angelegt hat — und der Lauf
 * liest daraus BESTÄTIGTE Werte eines Brandings. Ohne die Prüfung wäre das ein
 * Leseweg in fremde Foundation-Interna, und zwar der bequemste denkbare: eine
 * Id in einem Formularfeld. `requireOwnedMarketProfile` wirft 404 (nicht 403)
 * — ein 403 bestätigte die Existenz.
 *
 * Die POST-Route prüft dasselbe beim ANLEGEN. Beides ist richtig: dort ist es
 * die schnelle Rückmeldung, hier die Grenze — ein Besitz kann zwischen Anlegen
 * und Lauf wechseln (übertragenes, gelöschtes Branding), und der Lauf ist die
 * Stelle, an der wirklich gelesen wird.
 */
export async function loadMarketFoundationCandidate(
  event: H3Event,
  userId: string,
  sourceRef: string,
  fallbackProfileId: string,
): Promise<MarketOwnProfile> {
  const reference = sourceRef.trim() || fallbackProfileId
  await requireOwnedMarketProfile(event, userId, reference)
  return await loadMarketOwnProfile(event, reference)
}

/**
 * Die Slot-Id für ein Marktprofil-Feld — mit Rückfall auf den ersten Slot der
 * Abbildung. Ein Befund braucht IMMER ein Feld, an dem er hängen kann; ohne
 * Rückfall fielen genau die Befunde weg, die auf ein noch leeres eigenes Feld
 * zeigen, und das sind die interessanten.
 */
export function marketOwnSlotId(own: MarketOwnProfile, fieldId: MarketFieldId): string {
  const confirmed = own.slotByField.get(fieldId)
  if (confirmed) return confirmed
  return MARKET_FIELDS.find(definition => definition.id === fieldId)?.slotIds[0] ?? ''
}
