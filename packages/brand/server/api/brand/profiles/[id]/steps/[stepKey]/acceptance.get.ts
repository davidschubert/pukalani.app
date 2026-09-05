import { sessionsAffectedBy } from '../../../../../../../shared/brandSessions'
import { exampleKeyFor, questionKeyFor, slotsForStep } from '../../../../../../../shared/slotRegistry'
import type {
  BrandAcceptanceSessionView,
  BrandStepAcceptanceResponse,
} from '../../../../../../../shared/types/brand'
import { loadBrandAcceptanceContext } from '../../../../../../utils/brandAcceptance'
import { brandSlotRecordConfirmed } from '../../../../../../utils/brandStore'

/**
 * DIE FINALE ABNAHME EINES KAPITELS (Plan §5a) — was die Seite zeigt, in
 * EINEM Abruf.
 *
 * ── DREI DINGE JE BLOCK, EIN ZÄHLER DARÜBER ──────────────────────────────
 * §5a Schritt 1: Bereich (Feldname + „fliesst später in …"), Beispiel (aus der
 * Session-Config, FREMDE Branche, je Pfad) und die eigene Eingabe — der
 * bestätigte Wert, VOLLSTÄNDIG und nicht gekürzt. Schritt 2: der Zähler
 * „7 von 10 abgenommen". Schritt 3: `acceptance.ready` sagt, ob die Frage
 * „Passt dieses Kapitel?" überhaupt erscheinen darf.
 *
 * ── WARUM DIE FRAGE ERST BEI `ready` KOMMT ───────────────────────────────
 * Dieselbe Regel wie bei `brandStepCompletion`: eine Weiche, die vor ihrer
 * Bedingung erscheint, verspricht einen Abschluss, den die Route danach
 * abweist — Davids Live-Fund im Baustein `pvm`. Neu sind nur die drei Glieder
 * (abgenommen · nicht veraltet · kein offener Konflikt), und sie stehen in
 * DERSELBEN Rechnung, die `complete` durchsetzt (`brandStepAcceptance`).
 *
 * ── SCHLÜSSEL STATT TEXT ─────────────────────────────────────────────────
 * Der Server schickt i18n-SCHLÜSSEL (`labelKey`, `questionKey`, `exampleKey`),
 * nie übersetzte Zeichenketten: WIE etwas heisst, entscheiden die
 * Locale-Dateien. Die BEISPIELE sind die Ausnahme und keine — sie sind
 * INHALT aus der Registry (Davids Inhalts-Gate, `sessionContent.ts`) und
 * stehen dort in beiden Sprachen; welche gilt, weiss der Browser besser.
 *
 * ── KEIN GEORGE UND KEIN MODELL ──────────────────────────────────────────
 * Diese Route ruft nichts an — auch seit Paket 4 nicht. Der Kapitel-Modus des
 * Schliess-Aufrufs (§7, „der Spezialist liest das Kapitel mit") ist eine
 * EIGENE Route (`POST …/review`), die der Client beim Öffnen der Seite
 * daneben ruft: ein Modell-Aufruf in einem GET wäre eine Leseroute, die Geld
 * kostet und die ein Reload beliebig oft auslöst.
 *
 * ── DIE BEFUNDE STEHEN JETZT DABEI (Paket 4, §8) ─────────────────────────
 * Je Block die OFFENEN Befunde, an denen dieses Feld beteiligt ist — die
 * Daten für die Chips aus Paket 5. Die SPERRE daraus rechnet nicht diese
 * Route, sondern `brandStepAcceptance` über `openConflicts` aus dem
 * gemeinsamen Kontext: ein Feld mit offenem `conflict` steht als Blocker in
 * `acceptance.blockers`, und die Frage „Passt dieses Kapitel?" bleibt weg.
 */
export default defineEventHandler(async (event): Promise<BrandStepAcceptanceResponse> => {
  const { userId } = await requireBrandAccess(event)
  const { profile, stepKey, stepRow, records, sessionStates, acceptance, journey, findings }
    = await loadBrandAcceptanceContext(event, userId)

  const pathKind = profile.pathKind === 'relaunch' ? 'relaunch' : 'new'
  const team = profile.team === 'team' ? 'team' : 'solo'

  const sessions: BrandAcceptanceSessionView[] = slotsForStep(stepKey).map((session) => {
    const record = records[session.id]
    const affected = sessionsAffectedBy(session.id)
    return {
      slotId: session.id,
      kind: session.kind,
      required: session.required,
      state: sessionStates[session.id] ?? 'locked',
      confirmed: brandSlotRecordConfirmed(record),
      accepted: record?.accepted === true,
      deferred: record?.deferred === true,
      allowDefer: session.answers.allowDefer,
      // Der BESTÄTIGTE Wert, nicht der Entwurf: die Abnahme-Seite zeigt das
      // Dokument, nicht die Werkstatt. Eine optionale Session ohne Wert steht
      // grau mit ihrem Beispiel da (§5a Schritt 1).
      value: record?.confirmed ?? '',
      // Die Notiz des Schliess-Aufrufs (§4) — seit Paket 4 gefüllt; hier steht
      // auch der Grund einer abgelehnten Befund-Meldung (§8).
      notes: record?.notes ?? '',
      // Die OFFENEN Befunde, an denen GENAU DIESES Feld beteiligt ist. Ein
      // Konflikt hat zwei Felder und erscheint deshalb an beiden Blöcken —
      // gewollt: er verbindet sie, und wer ihn an einer Stelle entscheidet,
      // entscheidet ihn für beide.
      findings: findings.filter(view => view.slots.includes(session.id)),
      labelKey: `brand.labels.${session.id}`,
      questionKey: questionKeyFor(session, pathKind, team),
      // Nur Menschenfragen haben eine Beispiel-ANTWORT im Katalog; Auswahlen
      // haben Chips statt Freitext (s. `exampleKeyFor`).
      exampleKey: session.type === 'question' ? exampleKeyFor(session, pathKind) : null,
      example: {
        de: [...session.examples[pathKind].de],
        en: [...session.examples[pathKind].en],
      },
      affects: {
        count: affected.transitive.length,
        // Die Kapitel in Registry-Reihenfolge — `byStep` ist ein Objekt, seine
        // Schlüssel-Reihenfolge ist keine Zusage.
        steps: journey
          .map(entry => entry.stepKey)
          .filter(candidate => affected.byStep[candidate]?.length),
      },
    }
  })

  return {
    stepKey,
    storedState: stepRow.state,
    revision: stepRow.revision ?? 0,
    confidence: stepRow.confidence ?? null,
    restartedAt: stepRow.restartedAt ?? null,
    sessions,
    acceptance,
  }
})
