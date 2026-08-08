import type { Localized, LocalizedFaq } from './localized'

/**
 * Inhalte der Leistungsseite „UX-Audit" (/ux-audit · /de/ux-audit).
 *
 * Die deutsche Fassung ist 1:1 aus dem alten Portfolio-Repo übernommen; die
 * englische ist eine gleichwertige Übersetzung — die Seite verkauft dasselbe
 * Angebot an denselben DACH-Markt, nur in der anderen Sprache.
 */

export interface AuditArea {
  title: Localized
  description: Localized
}

export interface AuditTier {
  name: Localized
  /** Für wen das Paket gedacht ist (Unterzeile). */
  audience: Localized
  price: Localized
  duration: Localized
  featured: boolean
  includes: Localized<string[]>
  schemaDescription: Localized
  /** Zahlwert für das Offer im JSON-LD (Währung immer EUR). */
  priceValue: number
}

export interface AuditStep {
  title: Localized
  description: Localized
}

export const UX_AUDIT_HERO = {
  breadcrumb: { de: 'UX-Audit', en: 'UX audit' } satisfies Localized,
  title: {
    de: 'UX-Audit zum Festpreis: ab €2.500, Ergebnisse in 1–2 Wochen',
    en: 'UX audit at a fixed price: from €2,500, results in 1–2 weeks',
  } satisfies Localized,
  intro: {
    de: 'Ein UX-Audit ist eine strukturierte Analyse Ihrer Website oder Web-App durch einen erfahrenen UX-Experten. Bei Pukalani Studio kostet ein UX-Audit €2.500 bis €5.000 als Festpreis, dauert ein bis zwei Wochen und liefert eine priorisierte Maßnahmenliste – von Quick Wins bis zur Conversion-Roadmap. Durchgeführt von David Schubert, Senior UI/UX Designer und Creative Technologist mit über 25 Jahren Erfahrung.',
    en: 'A UX audit is a structured analysis of your website or web app by an experienced UX practitioner. At Pukalani Studio a UX audit costs €2,500 to €5,000 at a fixed price, takes one to two weeks and delivers a prioritised action list — from quick wins to a conversion roadmap. Carried out by David Schubert, senior UI/UX designer and creative technologist with more than 25 years of experience.',
  } satisfies Localized,
  ctaPrimary: { de: 'Audit-Erstgespräch buchen', en: 'Book an audit intro call' } satisfies Localized,
  ctaSecondary: { de: 'Pakete & Preise ansehen', en: 'See packages & prices' } satisfies Localized,
  note: {
    de: 'UX-Audits laufend verfügbar, Start meist innerhalb einer Woche',
    en: 'UX audits are available on a rolling basis, usually starting within a week',
  } satisfies Localized,
}

export const AUDIT_AREAS_HEADING = {
  title: { de: 'Was wird im UX-Audit geprüft?', en: 'What does the UX audit examine?' } satisfies Localized,
  lead: {
    de: 'Das Audit kombiniert vier Prüfebenen zu einem Gesamtbild: Nutzerführung, Conversion, Performance und Barrierefreiheit. Jede Ebene liefert konkrete, belegte Befunde – keine Bauchgefühl-Meinungen.',
    en: 'The audit combines four layers into one picture: user guidance, conversion, performance and accessibility. Each layer produces concrete, evidenced findings — not gut-feeling opinions.',
  } satisfies Localized,
}

export const AUDIT_AREAS: AuditArea[] = [
  {
    title: { de: 'Usability & Nutzerführung', en: 'Usability & user guidance' },
    description: {
      de: 'Heuristische Evaluation der wichtigsten Seiten und Flows: Navigation, Informationsarchitektur, Formulare, Fehlertoleranz und mentale Modelle Ihrer Nutzer.',
      en: 'Heuristic evaluation of the most important pages and flows: navigation, information architecture, forms, error tolerance and your users’ mental models.',
    },
  },
  {
    title: { de: 'Conversion & Funnel', en: 'Conversion & funnel' },
    description: {
      de: 'Analyse der Conversion-Pfade vom Einstieg bis zum Abschluss: Call-to-Actions, Vertrauens-Elemente, Reibungspunkte im Checkout oder Anfrage-Prozess.',
      en: 'Analysis of the conversion paths from entry to completion: calls to action, trust elements, friction points in the checkout or inquiry process.',
    },
  },
  {
    title: { de: 'Performance (Core Web Vitals)', en: 'Performance (Core Web Vitals)' },
    description: {
      de: 'Messung von LCP, INP und CLS mit Lab- und Felddaten. Langsame Seiten kosten nachweislich Conversions – hier stecken oft die schnellsten Gewinne.',
      en: 'Measuring LCP, INP and CLS with lab and field data. Slow pages demonstrably cost conversions — this is often where the fastest wins are.',
    },
  },
  {
    title: { de: 'Barrierefreiheit (WCAG 2.1 AA)', en: 'Accessibility (WCAG 2.1 AA)' },
    description: {
      de: 'Quick-Audit gegen die WCAG-2.1-AA-Kriterien: Kontraste, Tastaturbedienung, Screenreader-Tauglichkeit, Formular-Labels. Seit Juni 2025 gilt in Deutschland das Barrierefreiheitsstärkungsgesetz (BFSG) für viele digitale Angebote.',
      en: 'A quick audit against the WCAG 2.1 AA criteria: contrast, keyboard operation, screen-reader support, form labels. Since June 2025 the German Accessibility Strengthening Act (BFSG) applies to many digital offerings.',
    },
  },
]

export const AUDIT_METHOD_NOTE = {
  lead: {
    de: 'Methodische Grundlage sind etablierte Usability-Heuristiken, wie sie u. a. die Nielsen Norman Group beschreibt, ergänzt um Core Web Vitals und die WCAG 2.1.',
    en: 'The methodological basis are established usability heuristics as described by the Nielsen Norman Group among others, complemented by Core Web Vitals and WCAG 2.1.',
  } satisfies Localized,
  links: [
    { label: 'Nielsen Norman Group', href: 'https://www.nngroup.com/articles/ten-usability-heuristics/' },
    { label: 'Core Web Vitals', href: 'https://web.dev/articles/vitals' },
    { label: 'WCAG 2.1', href: 'https://www.w3.org/TR/WCAG21/' },
  ],
}

export const AUDIT_TIERS_HEADING = {
  title: { de: 'UX-Audit-Pakete & Preise', en: 'UX audit packages & prices' } satisfies Localized,
  lead: {
    de: 'Drei Festpreis-Pakete, netto, ohne versteckte Kosten. Welches Paket passt, klären wir im kostenlosen Erstgespräch – danach erhalten Sie das Angebot innerhalb von 48 Stunden.',
    en: 'Three fixed-price packages, net, with no hidden costs. Which one fits is settled in the free intro call — after that you get the quote within 48 hours.',
  } satisfies Localized,
  note: {
    de: 'Alle Pakete beinhalten: schriftlicher Audit-Report, priorisierte Maßnahmenliste und Ergebnis-Call. Die Audit-Kosten werden bei einem Folgeprojekt (z. B. Redesign oder Landingpage) zu 50 % angerechnet.',
    en: 'Every package includes a written audit report, a prioritised action list and a results call. 50% of the audit fee is credited against a follow-up project (for example a redesign or landing page).',
  } satisfies Localized,
  featuredLabel: { de: 'Meistgewählt', en: 'Most popular' } satisfies Localized,
  priceNote: { de: 'Festpreis netto', en: 'Fixed price, net' } satisfies Localized,
}

export const AUDIT_TIERS: AuditTier[] = [
  {
    name: { de: 'Kompakt', en: 'Compact' },
    audience: { de: 'Landingpages & kleine Websites', en: 'Landing pages & small websites' },
    price: { de: '€2.500', en: '€2,500' },
    duration: { de: '1 Woche', en: '1 week' },
    featured: false,
    includes: {
      de: [
        'Heuristische Analyse von bis zu 5 Kern-Seiten oder Screens',
        'Core-Web-Vitals-Check (Lab- & Felddaten)',
        'Top-10-Maßnahmenliste, nach Aufwand & Wirkung priorisiert',
        '60-minütiger Ergebnis-Call mit Q&A',
      ],
      en: [
        'Heuristic analysis of up to 5 core pages or screens',
        'Core Web Vitals check (lab & field data)',
        'Top 10 action list, prioritised by effort & impact',
        '60-minute results call with Q&A',
      ],
    },
    schemaDescription: {
      de: 'Kompaktes UX-Audit für Landingpages und kleine Websites: heuristische Analyse von bis zu 5 Kern-Seiten, Core-Web-Vitals-Check und priorisierte Top-10-Maßnahmenliste.',
      en: 'Compact UX audit for landing pages and small websites: heuristic analysis of up to 5 core pages, Core Web Vitals check and a prioritised top 10 action list.',
    },
    priceValue: 2500,
  },
  {
    name: { de: 'Standard', en: 'Standard' },
    audience: { de: 'Corporate Websites & Shops', en: 'Corporate websites & shops' },
    price: { de: '€3.900', en: '€3,900' },
    duration: { de: '2 Wochen', en: '2 weeks' },
    featured: true,
    includes: {
      de: [
        'Alles aus Kompakt',
        'Analyse des kompletten Conversion-Funnels',
        'WCAG-2.1-AA-Quick-Audit (BFSG-Relevanz)',
        'Benchmark gegen 3 Wettbewerber',
        'Priorisierte Conversion-Roadmap + Video-Walkthrough',
      ],
      en: [
        'Everything in Compact',
        'Analysis of the complete conversion funnel',
        'WCAG 2.1 AA quick audit (BFSG relevance)',
        'Benchmark against 3 competitors',
        'Prioritised conversion roadmap + video walkthrough',
      ],
    },
    schemaDescription: {
      de: 'UX-Audit für Corporate Websites und Shops: kompletter Conversion-Funnel, WCAG-2.1-AA-Quick-Audit, Wettbewerbs-Benchmark und priorisierte Roadmap.',
      en: 'UX audit for corporate websites and shops: complete conversion funnel, WCAG 2.1 AA quick audit, competitive benchmark and prioritised roadmap.',
    },
    priceValue: 3900,
  },
  {
    name: { de: 'Plus', en: 'Plus' },
    audience: { de: 'SaaS-Produkte & Web-Apps', en: 'SaaS products & web apps' },
    price: { de: '€5.000', en: '€5,000' },
    duration: { de: '2 Wochen + Workshop', en: '2 weeks + workshop' },
    featured: false,
    includes: {
      de: [
        'Alles aus Standard',
        'Halbtägiger Remote-Workshop mit Ihrem Team',
        'Klickbarer Vorher/Nachher-Prototyp für einen Kern-Flow',
        '30 Tage E-Mail-Support für Rückfragen bei der Umsetzung',
      ],
      en: [
        'Everything in Standard',
        'Half-day remote workshop with your team',
        'Clickable before/after prototype for one core flow',
        '30 days of email support for implementation questions',
      ],
    },
    schemaDescription: {
      de: 'UX-Audit für SaaS-Produkte und Web-Apps inklusive Remote-Workshop, klickbarem Vorher/Nachher-Prototyp und 30 Tagen Umsetzungs-Support.',
      en: 'UX audit for SaaS products and web apps including a remote workshop, a clickable before/after prototype and 30 days of implementation support.',
    },
    priceValue: 5000,
  },
]

export const AUDIT_PROCESS_HEADING = {
  title: { de: 'So läuft das UX-Audit ab', en: 'How the UX audit runs' } satisfies Localized,
  lead: {
    de: 'Vom Erstgespräch bis zum Ergebnis-Call vergehen ein bis zwei Wochen. Sie brauchen dafür kaum eigene Zeit – nur Zugang und ein einziges Briefing-Gespräch.',
    en: 'One to two weeks pass between the intro call and the results call. It barely costs you any time — only access and a single briefing call.',
  } satisfies Localized,
}

export const AUDIT_STEPS: AuditStep[] = [
  {
    title: { de: 'Kostenloses Erstgespräch (30 Min)', en: 'Free intro call (30 min)' },
    description: {
      de: 'Wir klären Ziele, Zielgruppen und den Umfang. Sie erhalten innerhalb von 48 Stunden ein Festpreis-Angebot mit klarem Leistungsumfang.',
      en: 'We clarify goals, audiences and scope. You receive a fixed-price quote with a clearly defined scope within 48 hours.',
    },
  },
  {
    title: { de: 'Briefing & Zugänge', en: 'Briefing & access' },
    description: {
      de: 'Ein Briefing-Call (60 Min) plus Zugang zu Analytics und ggf. Testumgebung. Mehr brauche ich von Ihnen nicht – Ihr Team bleibt entlastet.',
      en: 'One briefing call (60 min) plus access to analytics and, if available, a staging environment. That is all I need from you — your team stays free.',
    },
  },
  {
    title: { de: 'Analyse', en: 'Analysis' },
    description: {
      de: 'Heuristische Evaluation, Funnel-Analyse, Performance-Messung und WCAG-Prüfung. Alle Befunde werden mit Screenshots und Daten belegt.',
      en: 'Heuristic evaluation, funnel analysis, performance measurement and WCAG review. Every finding is evidenced with screenshots and data.',
    },
  },
  {
    title: { de: 'Report & Ergebnis-Call', en: 'Report & results call' },
    description: {
      de: 'Sie erhalten den schriftlichen Report mit priorisierter Maßnahmenliste (Quick Wins zuerst) und wir gehen ihn gemeinsam im Call durch.',
      en: 'You receive the written report with a prioritised action list (quick wins first) and we walk through it together on the call.',
    },
  },
]

export const AUDIT_QUOTE: Localized = {
  de: 'Das UX-Audit ist der schnellste und günstigste Einstieg in eine Zusammenarbeit: Sie sehen nach zwei Wochen schwarz auf weiß, wo Ihre Website Umsatz liegen lässt – und was zuerst zu tun ist.',
  en: 'The UX audit is the fastest and cheapest way into a collaboration: after two weeks you see in black and white where your website is leaving revenue on the table — and what to do first.',
}

export const AUDIT_QUOTE_SOURCE: Localized = {
  de: 'David Schubert, Senior UI/UX Designer & Web Developer',
  en: 'David Schubert, senior UI/UX designer & web developer',
}

export const AUDIT_FAQ_HEADING: Localized = {
  de: 'Häufige Fragen zum UX-Audit',
  en: 'Frequently asked questions about the UX audit',
}

export const AUDIT_FAQS: LocalizedFaq[] = [
  {
    question: { de: 'Was kostet ein UX-Audit?', en: 'What does a UX audit cost?' },
    answer: {
      de: 'Ein UX-Audit kostet bei Pukalani Studio zwischen €2.500 und €5.000 netto als Festpreis – abhängig vom Umfang: Kompakt (€2.500) für Landingpages, Standard (€3.900) für Corporate Websites und Shops, Plus (€5.000) für SaaS-Produkte inklusive Workshop und Prototyp. Bei einem Folgeprojekt werden 50 % der Audit-Kosten angerechnet.',
      en: 'At Pukalani Studio a UX audit costs between €2,500 and €5,000 net as a fixed price, depending on scope: Compact (€2,500) for landing pages, Standard (€3,900) for corporate websites and shops, Plus (€5,000) for SaaS products including workshop and prototype. 50% of the audit fee is credited against a follow-up project.',
    },
  },
  {
    question: { de: 'Wie lange dauert ein UX-Audit?', en: 'How long does a UX audit take?' },
    answer: {
      de: 'Ein bis zwei Wochen ab Briefing: Das Kompakt-Paket liefert Ergebnisse nach einer Woche, Standard und Plus nach zwei Wochen. Der Start ist meist innerhalb einer Woche nach Beauftragung möglich, da UX-Audits laufend eingeplant werden.',
      en: 'One to two weeks from the briefing: the Compact package delivers results after one week, Standard and Plus after two. Work usually starts within a week of the order, because audit slots are planned on a rolling basis.',
    },
  },
  {
    question: { de: 'Was bekomme ich am Ende konkret?', en: 'What exactly do I get in the end?' },
    answer: {
      de: 'Einen schriftlichen Audit-Report mit allen Befunden (belegt mit Screenshots und Messdaten), eine nach Aufwand und Wirkung priorisierte Maßnahmenliste sowie einen Ergebnis-Call. Je nach Paket zusätzlich: Conversion-Roadmap, Wettbewerbs-Benchmark, Video-Walkthrough, Workshop und klickbarer Prototyp.',
      en: 'A written audit report with all findings (evidenced with screenshots and measurements), an action list prioritised by effort and impact, and a results call. Depending on the package, also: conversion roadmap, competitive benchmark, video walkthrough, workshop and a clickable prototype.',
    },
  },
  {
    question: { de: 'Was brauchen Sie von mir?', en: 'What do you need from me?' },
    answer: {
      de: 'Wenig: ein Briefing-Gespräch (60 Minuten), Zugang zu Ihren Analytics-Daten (z. B. GA4, Plausible oder Matomo) und – falls vorhanden – eine Testumgebung. Alles Weitere übernehme ich.',
      en: 'Very little: a briefing call (60 minutes), access to your analytics data (GA4, Plausible or Matomo for example) and — if you have one — a staging environment. I take care of the rest.',
    },
  },
  {
    question: { de: 'Für wen lohnt sich ein UX-Audit?', en: 'Who is a UX audit worth it for?' },
    answer: {
      de: 'Für alle, die Traffic haben, aber zu wenig Anfragen oder Käufe: Corporate Websites mit schwacher Lead-Generierung, Shops mit hoher Abbruchrate, SaaS-Produkte mit geringer Feature-Adoption oder hoher Support-Last. Wer noch keine Website hat, braucht kein Audit, sondern ein Konzept.',
      en: 'For anyone who has traffic but too few inquiries or purchases: corporate websites with weak lead generation, shops with high abandonment, SaaS products with low feature adoption or a heavy support load. If you do not have a website yet, you do not need an audit — you need a concept.',
    },
  },
  {
    question: { de: 'Setzen Sie die Maßnahmen auch um?', en: 'Do you implement the recommendations too?' },
    answer: {
      de: 'Ja, auf Wunsch. Als Designer und Nuxt-Entwickler kann ich die Empfehlungen direkt umsetzen – vom Quick Win bis zum Redesign. 50 % der Audit-Kosten werden dabei angerechnet. Alternativ arbeitet Ihr Team mit dem Report; er ist bewusst so geschrieben, dass Entwickler damit arbeiten können.',
      en: 'Yes, on request. As a designer and Nuxt developer I can implement the recommendations directly — from quick win to redesign, with 50% of the audit fee credited. Alternatively your team works from the report; it is deliberately written so that developers can act on it.',
    },
  },
]

export const AUDIT_CROSS_LINK = {
  lead: { de: 'Mehr zu Preisen und Stundensätzen:', en: 'More on prices and hourly rates:' } satisfies Localized,
  label: {
    de: 'Was kostet UX/UI Design? Preise & Stundensätze 2026',
    en: 'What does UX/UI design cost? Prices & rates 2026',
  } satisfies Localized,
  to: '/wissen/was-kostet-ux-design',
}

export const AUDIT_CTA = {
  title: { de: 'UX-Audit anfragen', en: 'Request a UX audit' } satisfies Localized,
  text: {
    de: 'Buchen Sie ein kostenloses Erstgespräch – wir klären in 30 Minuten, welches Audit-Paket zu Ihrer Website passt. Start meist innerhalb einer Woche.',
    en: 'Book a free intro call — in 30 minutes we settle which audit package fits your website. Work usually starts within a week.',
  } satisfies Localized,
}

export const AUDIT_META = {
  title: {
    de: 'UX-Audit ab €2.500 – Festpreis-Pakete | David Schubert',
    en: 'UX audit from €2,500 — fixed-price packages | David Schubert',
  } satisfies Localized,
  description: {
    de: 'UX-Audit zum Festpreis: €2.500–5.000, Ergebnisse in 1–2 Wochen. Usability, Conversion, Core Web Vitals & WCAG 2.1 AA – mit priorisierter Maßnahmenliste. Von Senior UX Designer David Schubert.',
    en: 'UX audit at a fixed price: €2,500–5,000, results in 1–2 weeks. Usability, conversion, Core Web Vitals & WCAG 2.1 AA — with a prioritised action list. By senior UX designer David Schubert.',
  } satisfies Localized,
  serviceName: { de: 'UX-Audit', en: 'UX audit' } satisfies Localized,
  serviceType: {
    de: 'UX-Audit & Conversion-Analyse',
    en: 'UX audit & conversion analysis',
  } satisfies Localized,
  serviceDescription: {
    de: 'Strukturierte UX-Analyse von Websites und Web-Apps: Usability, Conversion-Funnel, Core Web Vitals und WCAG 2.1 AA – mit priorisierter Maßnahmenliste zum Festpreis.',
    en: 'Structured UX analysis of websites and web apps: usability, conversion funnel, Core Web Vitals and WCAG 2.1 AA — with a prioritised action list at a fixed price.',
  } satisfies Localized,
  catalogName: { de: 'UX-Audit-Pakete', en: 'UX audit packages' } satisfies Localized,
}
