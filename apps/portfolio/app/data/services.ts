import type { Localized } from './localized'

/**
 * Die KERNDATEN der sechs Leistungen: Anker-Id, Titel, optionale Detailseite.
 * Mehr nicht — und genau das ist der Zweck dieser Datei.
 *
 * WARUM EIGENES MODUL (Bundle-Befund 2026-08-09): die Fußzeile hängt im
 * `site`-Layout und braucht von jeder Leistung nur Titel und Ziel. Solange sie
 * `SERVICES` aus `home.ts` zog, lud JEDE Seite der Site die kompletten
 * Startseiten-Inhalte mit (alle FAQ-Antworten, Case Studies, Timeline,
 * zweisprachig — 45 KiB roh / 15 KiB gzip) für sechs Wörter. Der Schnitt läuft
 * deshalb dort, wo die Nutzung sich teilt: was mehr als eine Stelle braucht,
 * steht hier; was nur die Startseite braucht, bleibt in `home.ts`.
 *
 * DIE QUELLE BLEIBT EINE. `home.ts` importiert diese Liste und reichert sie zu
 * `SERVICES` an — Titel und Anker existieren also weiterhin GENAU EINMAL. Sie
 * hier NICHT zurück-exportieren (`export * from './services'` in `home.ts`
 * wäre bequem und macht den ganzen Schnitt wirkungslos: die Fußzeile zöge
 * `home.ts` wieder mit) und in der Fußzeile NICHT als i18n-Schlüssel
 * nachbilden — genau das war der Zustand, in dem der Fuß englisch „Design
 * concept & brand design" sagte und die Seite „… & digital brand design".
 */

/**
 * Anker-Id einer Leistung. Als Union statt `string`, damit `home.ts` seine
 * Ergänzungen VOLLSTÄNDIG liefern MUSS: eine neue Leistung ohne Beschreibung,
 * Preis und Schema-Text ist dann ein Typfehler und keine leere Karte.
 */
export type ServiceId =
  | 'brand-design'
  | 'ux-audit'
  | 'landingpage-cro'
  | 'corporate-website'
  | 'saas-design'
  | 'content-produktion'

export interface ServiceCore {
  /** Anker-Id — wird in Fußzeile und JSON-LD verlinkt, nie umbenennen. */
  id: ServiceId
  title: Localized
  /** Eigene Detailseite statt Sprung zum Kontaktformular. */
  link?: string
}

/** Reihenfolge = Reihenfolge der Karten auf der Startseite und im Fuß. */
export const SERVICE_CORES: ServiceCore[] = [
  {
    id: 'brand-design',
    title: {
      de: 'Designkonzept & Digital Brand Design',
      en: 'Design concept & digital brand design',
    },
  },
  {
    id: 'ux-audit',
    title: {
      de: 'UX-Audit & Conversion-Analyse',
      en: 'UX audit & conversion analysis',
    },
    link: '/ux-audit',
  },
  {
    id: 'landingpage-cro',
    title: {
      de: 'Landingpage & CRO',
      en: 'Landing page & CRO',
    },
  },
  {
    id: 'corporate-website',
    title: {
      de: 'Website-Design & technische Umsetzung',
      en: 'Website design & technical implementation',
    },
  },
  {
    id: 'saas-design',
    title: {
      de: 'Produkt- & App-Design (Software, Dashboards)',
      en: 'Product & app design (software, dashboards)',
    },
  },
  {
    id: 'content-produktion',
    title: {
      de: 'Content-Produktion: Foto, Video & Werbemittel',
      en: 'Content production: photo, video & ad assets',
    },
  },
]
