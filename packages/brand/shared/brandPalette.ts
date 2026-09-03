/**
 * DIE FARBWELT EINER BRAND-KACHEL — kuratiert statt errechnet.
 *
 * Jede Brand bekommt auf der Übersicht einen eigenen Farb-Dreiklang
 * (hell → mittel → tief, derselbe Farbton), deterministisch aus ihrer
 * Profil-Id gewählt. Bis zum Umbau trugen alle Kacheln das graue
 * Kachel-Default von `BwBrandCard` (Live-Audit-Notiz 2026-09-03, Davids
 * Auftrag danach).
 *
 * ── WARUM EINE TABELLE, KEIN LAUFZEIT-FARBRAUM ────────────────────────────
 * Ein Hash→OKLCH-Generator liefert unendlich viele Töne — und regelmäßig
 * hässliche (ausgewaschene Gelbgrüne, grelle Magentas). Die Vorlage sind die
 * DREI im Klickdummy ABGENOMMENEN Dreiklänge (Brot & Zeit, Kailua,
 * Hafenkontor): gedämpft, elegant, ähnliche Helligkeitsbänder (~L90 Tint,
 * ~L60 Mittelton, ~L27 Tiefe). Diese Tabelle führt sie fort — zwölf
 * handgestimmte Welten in genau diesem Geist. Zwölf reichen: Kollisionen
 * zwischen Brands EINES Kontos sind bei zwölf Welten selten und harmlos
 * (die Kachel trägt ohnehin die Wortmarke).
 *
 * ── STABILITÄT ────────────────────────────────────────────────────────────
 * Gehasht wird die PROFIL-ID, nicht der Titel: eine umbenannte Brand behält
 * ihre Farbwelt. Neue Welten IMMER HINTEN ANFÜGEN — jede Umsortierung
 * würfelt die Farben aller Bestands-Brands neu. Später kann eine echte
 * Farb-Phase des Wizards diese Zuweisung je Brand überschreiben; die
 * Funktion bleibt dann der Rückfall für Brands ohne eigene Wahl.
 */

export type BrandGradient = [light: string, mid: string, deep: string]

export const BRAND_GRADIENTS: readonly BrandGradient[] = [
  ['#e8d3b8', '#b98a5e', '#4a3123'], // warmes Brot-Braun (Dummy: Brot & Zeit)
  ['#e2e4ea', '#8a93ad', '#2b3148'], // Blaugrau (Dummy: Kailua Coffee Co.)
  ['#dfe8e4', '#6f9184', '#22392f'], // Tannengrün (Dummy: Hafenkontor)
  ['#eed9cf', '#c68a6f', '#552e1e'], // Terrakotta
  ['#e7e6d2', '#9d9c66', '#3c3b1f'], // Oliv
  ['#d8e6e7', '#5e9299', '#1d3a3e'], // Petrol
  ['#e8dde8', '#9a7fa0', '#3d2a42'], // Pflaume
  ['#eddbdc', '#bb7f85', '#4e2a2e'], // Rosenholz
  ['#e3e4e6', '#82878f', '#2a2d33'], // Schiefer
  ['#ece2cb', '#b3a06b', '#4a3d1f'], // Messing
  ['#dce3ee', '#7189b0', '#253552'], // Taubenblau
  ['#e2e8d8', '#8ba06e', '#313f22'], // Moos
]

/**
 * FNV-1a (32 Bit) — bewusst dieser und kein „einfacherer" Hash: eine
 * Zeichensummen-Rechnung landet für Appwrite-Row-Ids (gleiches Alphabet,
 * gleiche Länge) gehäuft in denselben Resten und färbt halbe Konten gleich.
 */
function fnv1a(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Die Farbwelt zu einer Profil-Id — deterministisch, für immer stabil. */
export function brandGradientFor(seed: string): BrandGradient {
  const entry = BRAND_GRADIENTS[fnv1a(seed) % BRAND_GRADIENTS.length]!
  return [...entry]
}
