import type { BwRailLayer } from '../../../app/components/BwProgressRail.vue'

/** Statische Dummy-Daten (P0b): die fünf Schichten, Baustein C aktiv. */
export const demoRail: BwRailLayer[] = [
  {
    id: 'foundation',
    label: 'Brand Foundation',
    steps: [
      { id: 'context', label: 'Kontext', icon: 'i-ph-globe-simple', state: 'done' },
      { id: 'pvm', label: 'Purpose · Vision · Mission', icon: 'i-ph-target', state: 'done' },
      {
        id: 'values',
        label: 'Werte',
        icon: 'i-ph-scales',
        state: 'active',
        slots: '2 von 5 Bausteinen',
        minutes: '~8 Min',
        info: {
          description: 'Werte sind die Verhaltensregeln eurer Marke: Sie sagen, wie ihr entscheidet, wenn es unbequem wird. In der Brand Foundation sind sie das Scharnier zwischen Purpose (warum es euch gibt) und Archetyp & Stimme (wie ihr klingt) — jede spätere Design- und Textentscheidung wird an ihnen gemessen.',
          minutes: '~8 Min',
          bausteine: [
            { label: 'Wertekandidaten', note: 'Wörter, die aus deinen Antworten kommen — die Rohliste.', done: true },
            { label: 'Kernwerte (3–5)', note: 'Die Auswahl, die ihr wirklich verteidigt — auch wenn es Geld kostet.', done: true },
            { label: 'Verhaltensregeln', note: 'Je Wert ein Satz: Woran erkennt man ihn im Alltag?' },
            { label: 'Anti-Werte', note: 'Was ihr nie sein wollt — die Grenze nach außen.' },
            { label: 'Beweise', note: 'Echte Beispiele, die jeden Wert belegen — Futter für Website und Pitch.' },
          ],
        },
      },
      { id: 'archetype', label: 'Archetyp & Stimme', icon: 'i-ph-mask-happy', state: 'open' },
      { id: 'manifesto', label: 'Manifest', icon: 'i-ph-scroll', state: 'open' },
    ],
  },
  {
    id: 'verbal',
    label: 'Markensprache',
    steps: [
      { id: 'messaging', label: 'Tagline & Messaging', icon: 'i-ph-chat-circle-text', state: 'open' },
      { id: 'naming', label: 'Name & Prüfung', icon: 'i-ph-seal-check', state: 'open' },
    ],
  },
  { id: 'design', label: 'Brand Design', locked: true, lockedNote: 'Baut auf deiner Foundation auf' },
  { id: 'book', label: 'Brand Book & Kit', locked: true, lockedNote: 'Entsteht aus Design + Foundation' },
  { id: 'experience', label: 'Brand Experience', locked: true, lockedNote: 'Website, Social & Content' },
]
