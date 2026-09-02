import { dependencyClosure, slotById } from './slotRegistry'
import type { BrandStartCard } from './types/brand'

/**
 * DAS BEREITSCHAFTS-GATE — „zu wenig ist zu wenig" (Davids Entscheidung,
 * 2026-09-01), deterministisch und kostenlos.
 *
 * ── WOZU, WENN GEORGE DOCH NACHFRAGEN KANN ────────────────────────────────
 * Seit `george-a-4` kann das Modell statt eines Entwurfs eine Rückfrage stellen
 * (`outcome: 'question'`). Das kostet aber einen echten Anbieter-Lauf, um zu
 * einer Auskunft zu kommen, die schon VOR dem Klick feststand: wer keine
 * Website eingelesen hat, hat keine vorhandenen Texte, und daran ändert kein
 * Sprachmodell etwas. Was man rechnen kann, fragt man nicht — das Gate spart
 * das Geld, die Wartezeit und den enttäuschten Klick.
 *
 * Die Rückfrage bleibt trotzdem nötig: sie fängt das ab, was man NICHT rechnen
 * kann („die Startkarte ist da, aber sie trägt nichts für dieses Feld").
 *
 * ── DIE QUELLEN SIND DECKUNGSGLEICH MIT DEM GENERATOR ─────────────────────
 * George sieht genau drei Dinge (`BrandGeneratorContext`): die STARTKARTE des
 * Profils, den WEBSITE-TEXT und die Werte der QUELL-SLOTS aus
 * `dependencyClosure()`. Mehr prüft dieses Gate deshalb auch nicht — ein Gate,
 * das andere Quellen zählt als der Prompt, widerspricht George irgendwann
 * öffentlich („George braucht erst X" während George fröhlich entwirft).
 *
 * Die Slot-Werte kommen aus DERSELBEN Aufnahme wie im Prompt: der Zeile des
 * AKTUELLEN Bausteins. Ein Quell-Slot aus einem anderen Baustein steht dort
 * heute leer — im Gate wie im Prompt. Das ist eine bekannte Grenze des
 * Generator-Kontexts (nicht dieses Gates), und sie wird hier ehrlich
 * abgebildet statt heimlich ausgeglichen.
 *
 * ── ANTWORTFORM ───────────────────────────────────────────────────────────
 * `{ ready: true }` oder `{ ready: false, missing: [...] }` mit SPRECHENDEN
 * Bedarfs-Schlüsseln. Die Oberfläche macht daraus einen ruhigen Satz
 * (`brand.workspace.ready.need.*`), die Route ein 409 mit `not_ready`. Ein
 * blosses `false` liesse beiden nur „geht nicht" übrig — und das ist genau die
 * Auskunft, die Davids Leitsatz verbietet.
 */

/** Was fehlt. Ein Schlüssel je Satz in der Oberfläche. */
export type BrandReadinessNeed =
  | 'startcard.about'
  | 'startcard.audience'
  | 'startcard.industry'
  | 'competitor_names'
  | 'source_texts'
  | 'source_slots'

export interface BrandReadinessInput {
  startCard: BrandStartCard
  /** Wurde die Website je eingelesen (`brand_profiles.siteAnalysis` nicht leer)? */
  hasSiteAnalysis: boolean
  /** Slot-Id → gespeicherter Wert, aus der Zeile DIESES Bausteins (s. Kopf). */
  records: Readonly<Record<string, string>>
}

export type BrandSlotReadiness =
  | { ready: true }
  | { ready: false, missing: BrandReadinessNeed[] }

function filled(value: string | undefined): boolean {
  return (value ?? '').trim().length > 0
}

/**
 * Die SLOT-EIGENEN Regeln (Content-Spec §4). Alles, was hier nicht steht, wird
 * allein von der Registry-Regel unten beurteilt.
 *
 * `a.competitors` und `a.toneAnalysis` hängen beide an derselben Tatsache — es
 * gibt Material ausserhalb der vier kurzen Startkarten-Antworten —, benennen
 * sie aber VERSCHIEDEN: dem einen fehlen NAMEN, dem anderen TEXTE. Zwei
 * Schlüssel, weil zwei verschiedene Sätze herauskommen müssen; „lest eure
 * Website ein" hilft beim Ton, beim Wettbewerb kann man die Namen auch selbst
 * eintragen.
 */
const SLOT_RULES: Record<string, (input: BrandReadinessInput) => BrandReadinessNeed[]> = {
  'a.pitch': (input) => {
    const missing: BrandReadinessNeed[] = []
    if (!filled(input.startCard.about)) missing.push('startcard.about')
    if (!filled(input.startCard.audience)) missing.push('startcard.audience')
    return missing
  },
  'a.category': input => (filled(input.startCard.industry) ? [] : ['startcard.industry']),
  'a.audienceSketch': input => (filled(input.startCard.audience) ? [] : ['startcard.audience']),
  // NAMEN kann nur nennen, wer sie irgendwo hingeschrieben hat — heute ist das
  // ausschliesslich die eigene Website. Ohne sie bleibt der Weg über die Hand
  // offen (das Feld ist editierbar), nur eben nicht über George.
  'a.competitors': input => (input.hasSiteAnalysis ? [] : ['competitor_names']),
  // Eine Ton-ANALYSE ohne Texte wäre eine Ton-Erfindung (Instruktion §4 sagt
  // dasselbe; hier kostet die Einsicht nichts).
  'a.toneAnalysis': input => (input.hasSiteAnalysis ? [] : ['source_texts']),
}

/**
 * Ist für diesen Slot genug da, dass ein Entwurf ehrlich sein KANN?
 *
 * Zwei Regeln, in dieser Reihenfolge:
 *  1. die Slot-eigene aus der Tabelle oben,
 *  2. die aus der REGISTRY abgeleitete: hat der Slot Quell-Slots und ist
 *     JEDER davon leer, gibt es nichts abzuleiten. „Alle leer" und nicht
 *     „einer leer", weil ein teilweise gefüllter Stand genau der Fall ist, für
 *     den es Georges Rückfrage gibt.
 *
 * Ein unbekannter Slot gilt als bereit: dieses Gate ist eine Sicherung, kein
 * zweiter Katalog — welche Slots es gibt, sagt die Registry.
 */
export function slotReadiness(slotId: string, input: BrandReadinessInput): BrandSlotReadiness {
  const missing = new Set<BrandReadinessNeed>(SLOT_RULES[slotId]?.(input) ?? [])

  if (slotById(slotId)) {
    const sources = dependencyClosure(slotId)
    if (sources.length > 0 && !sources.some(id => filled(input.records[id]))) {
      missing.add('source_slots')
    }
  }

  return missing.size === 0 ? { ready: true } : { ready: false, missing: [...missing] }
}
