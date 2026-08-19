import type { ProductManifest } from '../core/shared/types/manifest'

export default {
  key: 'events',
  tier: 'optional',
  hasMigrations: true,
  apiPrefixes: ['/api/events'],
  title: { en: 'Events', de: 'Events' },
  description: {
    en: 'Events with series, RSVPs, tickets and AI translation — including an embeddable event view.',
    de: 'Events mit Serien, Zusagen, Tickets und KI-Übersetzung — inklusive einbettbarer Event-Ansicht.',
  },
  icon: 'i-ph-calendar',
} satisfies ProductManifest
