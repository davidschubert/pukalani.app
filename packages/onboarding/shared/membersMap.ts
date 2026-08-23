import type { CommunityMapMember } from './types/membersMap'

/**
 * ── MEHRERE MENSCHEN AN EINEM ORT (Mitglieder-Karte, Etappe 2 — 2026-08-23) ──
 *
 * Die Standorte kommen aus einem VERZEICHNIS (GeoNames), nicht aus einem GPS:
 * wer „Hamburg" wählt, bekommt exakt dieselben Koordinaten wie jeder andere,
 * der „Hamburg" gewählt hat. Auf der Karte lägen deren Punkte damit
 * PIXELGENAU übereinander — sichtbar wäre nur der zuletzt gezeichnete, und die
 * Karte behauptete, in Hamburg wohne genau ein Mitglied.
 *
 * Deshalb ein Marker JE ORT mit einem Zähler, und deshalb steht die Regel hier
 * als PURE Funktion und nicht in der Vue-Datei: sie ist die einzige Stelle, an
 * der aus N Mitgliedern M Punkte werden, und ein Fehler darin (ein Ort zu viel,
 * ein Mensch zu wenig) ist auf einer Karte praktisch unsichtbar. Als Funktion
 * ist sie prüfbar, ohne dass jemand einen Browser startet.
 *
 * ── DREI ENTSCHEIDUNGEN, JEDE MIT GRUND ────────────────────────────────────
 *
 * 1. **Zusammengefasst wird über das exakte Zahlenpaar**, nicht über das Label.
 *    Zwei Verzeichnis-Einträge dürfen denselben Namen tragen („Springfield") und
 *    meinen dann verschiedene Orte — die Karte zeichnet Punkte, also entscheidet
 *    der Punkt. Umgekehrt gilt das genauso: identische Koordinaten SIND
 *    derselbe Ort, auch wenn zwei Konten ein unterschiedlich geschriebenes
 *    Label gespeichert haben (Verzeichnis-Bestand aus verschiedenen Zeiten).
 *    Angezeigt wird dann das Label des ERSTEN Mitglieds der Gruppe — irgendeine
 *    Wahl muss getroffen werden, und die erste ist die einzige, die nicht von
 *    der Sortierung abhängt.
 *
 * 2. **Der Schlüssel entsteht aus den Zahlen, nicht aus gerundeten Zahlen.**
 *    Ein Rundungs-Raster („alles im selben Zehntelgrad ist ein Ort") würde
 *    Nachbarstädte verschmelzen und wäre eine Karte, die etwas behauptet, was
 *    niemand eingegeben hat. Wer wirklich dicht beieinander wohnt, bekommt
 *    zwei Punkte — das ist die Wahrheit, und beim Hineinzoomen trennen sie sich.
 *
 * 3. **Die Reihenfolge ist stabil und kommt aus der Eingabe**: Gruppen in der
 *    Reihenfolge ihres ersten Mitglieds, Mitglieder in Eingabe-Reihenfolge
 *    (die Route liefert sie nach Beitritt sortiert). Eine Map bewahrt die
 *    Einfüge-Reihenfolge — es braucht also kein Sortieren, nur den Verzicht
 *    darauf, die Reihenfolge irgendwo zu verlieren. Ohne diese Zusage wechselte
 *    bei jedem Neuladen die Zeichenreihenfolge und damit, welcher Marker oben
 *    liegt.
 */

/** Ein Punkt auf der Karte: ein Ort und alle, die dort stehen. */
export interface MemberLocationGroup {
  /** Stabiler Schlüssel für `v-for` und für die Auswahl (`lat,lon`). */
  key: string
  lat: number
  lon: number
  /** Ortsname des ersten Mitglieds dieser Gruppe. */
  label: string
  /** Mindestens eines — eine leere Gruppe entsteht hier nie. */
  members: CommunityMapMember[]
}

/** Der Schlüssel EINES Ortes. Eine Stelle, damit Gruppierung und Auswahl nie auseinanderlaufen. */
export function locationKey(lat: number, lon: number): string {
  return `${lat},${lon}`
}

export function groupMembersByLocation(members: readonly CommunityMapMember[]): MemberLocationGroup[] {
  const groups = new Map<string, MemberLocationGroup>()

  for (const member of members) {
    const { lat, lon, label } = member.location
    const key = locationKey(lat, lon)
    const existing = groups.get(key)
    if (existing) {
      existing.members.push(member)
      continue
    }
    groups.set(key, { key, lat, lon, label, members: [member] })
  }

  return [...groups.values()]
}
