import type { BwRailLayer } from '../../../app/components/BwProgressRail.vue'

/** Statische Dummy-Daten (P0b): die fünf Schichten, Baustein C aktiv. */
export const demoRail: BwRailLayer[] = [
  {
    id: 'foundation',
    label: 'Brand Foundation',
    steps: [
      { id: 'context', label: 'Kontext', state: 'done' },
      { id: 'pvm', label: 'Purpose · Vision · Mission', state: 'done' },
      { id: 'values', label: 'Werte', state: 'active', slots: '2 von 5 geklärt', minutes: '~8 Min' },
      { id: 'archetype', label: 'Archetyp & Stimme', state: 'open' },
      { id: 'manifesto', label: 'Manifest', state: 'open' },
    ],
  },
  {
    id: 'verbal',
    label: 'Verbale Identität',
    steps: [
      { id: 'messaging', label: 'Tagline & Messaging', state: 'open' },
      { id: 'naming', label: 'Name & Prüfung', state: 'open' },
    ],
  },
  { id: 'design', label: 'Brand Design', locked: true, lockedNote: 'Baut auf deiner Foundation auf' },
  { id: 'book', label: 'Brand Book & Kit', locked: true, lockedNote: 'Entsteht aus Design + Foundation' },
  { id: 'experience', label: 'Brand Experience', locked: true, lockedNote: 'Website, Social & Content' },
]
