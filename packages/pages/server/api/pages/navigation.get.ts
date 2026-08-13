import type { CommunityNavOverride } from '../../../../core/shared/communityNavigation'
import { emptyCommunityNavOverride } from '../../../../core/shared/communityNavigation'

/**
 * Öffentlich: die MENÜ-WAHL dieser Community (U15 Teil 1).
 *
 * Der Konsument ist das blueprint-Layout, das sie beim SSR-Aufbau holt und
 * über `resolveCommunityNav` auf seine registrierten Einträge legt. Die Antwort
 * ist bewusst ROH (die gespeicherte Wahl, nicht das fertige Menü): das Layout
 * ist die einzige Stelle, die weiss, welche Einträge ihre Gates überlebt
 * haben, und die Reihenfolge dieser beiden Schritte ist die Zusage, dass ein
 * Override nichts freischalten kann.
 *
 * OHNE MANDANT: leeres Dokument. Kontroll-Hosts, Silo-Apps und der Playground
 * haben keine Community, deren Menü man wählen könnte — dort gilt der Bauplan,
 * und zwar unverändert.
 *
 * DIE PUBLIKUMS-FRAGE, und warum sie hier so beantwortet ist wie nebenan:
 * `assertCommunityContentReadable` steht auch vor `/api/pages/public`, und
 * beide Antworten fliessen in DENSELBEN Seitenkopf. Ohne diese Zeile sähe ein
 * Gast einer geschlossenen Community ihr eigenes Menü, aber weiterhin keine
 * ihrer Seiten — zwei Regeln für eine Fläche. Die Folge ist gutartig: er
 * bekommt 404, das Layout fängt es ab und zeigt das Menü aus dem Bauplan (der
 * dokumentierte Normalfall „keine eigene Wahl"). Zu SCHÜTZEN hat diese Zeile
 * nichts — die Tabelle ist bewusst `read(any)` (system-033) —, sie hält nur
 * zwei Nachbarn im Gleichschritt.
 */
export default defineEventHandler(async (event): Promise<CommunityNavOverride> => {
  assertCommunityContentReadable(event, 'Navigation not found')

  const communityId = useTenant(event)?.communityId
  if (!communityId) return emptyCommunityNavOverride()

  const override = await readCommunityNavOverride(event, communityId)
  return override ?? emptyCommunityNavOverride()
})
