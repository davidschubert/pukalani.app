import type { BwRailLayer } from '../../../app/components/BwProgressRail.vue'

/** Statische Dummy-Daten (P0b): die fünf Schichten, Baustein C aktiv. */
export const demoRail: BwRailLayer[] = [
  {
    id: 'foundation',
    label: 'Brand Foundation',
    steps: [
      { id: 'context', label: 'Kontext', icon: 'i-ph-globe-simple', state: 'done' },
      { id: 'pvm', label: 'Purpose · Vision · Mission', icon: 'i-ph-target', state: 'done' },
      { id: 'values', label: 'Werte', icon: 'i-ph-scales', state: 'active', slots: '2 von 5 geklärt', minutes: '~8 Min' },
      { id: 'archetype', label: 'Archetyp & Stimme', icon: 'i-ph-mask-happy', state: 'open' },
      { id: 'manifesto', label: 'Manifest', icon: 'i-ph-scroll', state: 'open' },
    ],
  },
  {
    id: 'verbal',
    label: 'Verbale Identität',
    steps: [
      { id: 'messaging', label: 'Tagline & Messaging', icon: 'i-ph-chat-circle-text', state: 'open' },
      { id: 'naming', label: 'Name & Prüfung', icon: 'i-ph-seal-check', state: 'open' },
    ],
  },
  { id: 'design', label: 'Brand Design', locked: true, lockedNote: 'Baut auf deiner Foundation auf' },
  { id: 'book', label: 'Brand Book & Kit', locked: true, lockedNote: 'Entsteht aus Design + Foundation' },
  { id: 'experience', label: 'Brand Experience', locked: true, lockedNote: 'Website, Social & Content' },
]
