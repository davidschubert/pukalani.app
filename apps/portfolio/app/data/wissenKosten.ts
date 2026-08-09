import type { Localized, LocalizedFaq } from './localized'

/**
 * Inhalte des Guides „Was kostet UX/UI Design?"
 * (/wissen/was-kostet-ux-design · /de/wissen/was-kostet-ux-design).
 *
 * Alle Zahlen sind BELEGT und tragen ihre Quelle mit — das ist der Kern dieses
 * Guides und der Grund, warum die Marktdaten als Tabellen-Zeilen und nicht als
 * Fließtext liegen: eine Zahl ohne Quelle darf hier gar nicht erst entstehen.
 * Die Quellen-Bezeichner (Studien-Namen, URLs) bleiben in BEIDEN Sprachen
 * gleich — ein übersetzter Studientitel wäre nicht mehr auffindbar.
 */

export interface RateRow {
  metric: Localized
  value: Localized
  source: string
  sourceUrl: string
}

export interface ProjectRow {
  project: Localized
  market: Localized
  mine: Localized
  duration: Localized
}

export interface CostFactor {
  title: Localized
  description: Localized
}

export interface RoiStat {
  claim: Localized
  source: string
  sourceUrl: string
}

export interface TocItem {
  label: Localized
  href: string
}

export const KOSTEN_HERO = {
  breadcrumb: {
    de: 'Was kostet UX/UI Design?',
    en: 'What does UX/UI design cost?',
  } satisfies Localized,
  title: {
    de: 'Was kostet UX/UI Design? Preise, Stundensätze & Beispiele 2026',
    en: 'What does UX/UI design cost? Prices, rates & examples for 2026',
  } satisfies Localized,
  intro: {
    de: 'Kurzantwort: Freelance-UX/UI-Designer in Deutschland kosten 2026 typischerweise 60–120 € pro Stunde bzw. 578–735 € pro Tag. Auf Projektebene: UX-Audits ab ca. €2.500, Landingpages €5.000–12.000, Corporate Websites €15.000–35.000 und SaaS-Produkt-Design €25.000–75.000+. Dieser Guide belegt alle Zahlen mit Quellen.',
    en: 'Short answer: freelance UX/UI designers in Germany typically cost €60–120 per hour or €578–735 per day in 2026. At project level: UX audits from around €2,500, landing pages €5,000–12,000, corporate websites €15,000–35,000 and SaaS product design €25,000–75,000+. This guide backs every number with a source.',
  } satisfies Localized,
  bylineLead: { de: 'Von', en: 'By' } satisfies Localized,
  bylineRole: {
    de: '– Senior UI/UX Designer & Creative Technologist, 25+ Jahre Erfahrung',
    en: '— senior UI/UX designer & creative technologist, 25+ years of experience',
  } satisfies Localized,
  updatedNote: {
    de: '· wird quartalsweise aktualisiert',
    en: '· updated quarterly',
  } satisfies Localized,
}

export const KOSTEN_TOC: TocItem[] = [
  {
    label: { de: 'Stundensätze & Tagessätze (Daten)', en: 'Hourly & day rates (data)' },
    href: '#stundensaetze',
  },
  {
    label: { de: 'Preisbeispiele nach Projekttyp', en: 'Price examples by project type' },
    href: '#projektpreise',
  },
  {
    label: { de: 'Die 5 Kostenfaktoren', en: 'The five cost factors' },
    href: '#faktoren',
  },
  {
    label: { de: 'Was gutes UX nachweislich bringt', en: 'What good UX demonstrably delivers' },
    href: '#roi',
  },
  {
    label: { de: 'Stundensatz vs. Festpreis', en: 'Hourly rate vs. fixed price' },
    href: '#modelle',
  },
  {
    label: { de: 'BFSG: Barrierefreiheit als Pflicht', en: 'BFSG: accessibility is mandatory' },
    href: '#bfsg',
  },
  { label: { de: 'FAQ', en: 'FAQ' }, href: '#faq' },
  { label: { de: 'Quellen', en: 'Sources' }, href: '#quellen' },
]

export const KOSTEN_RATES = {
  title: {
    de: 'Stundensätze & Tagessätze in Deutschland (Daten 2025/2026)',
    en: 'Hourly and day rates in Germany (2025/2026 data)',
  } satisfies Localized,
  lead: {
    de: 'Der durchschnittliche Freelancer-Stundensatz in der DACH-Region liegt laut Freelancer-Kompass 2026 (freelancermap, 5.400+ Befragte) bei 103 € – der erste Rückgang in der Geschichte der Studie, nach 104 € im Jahr 2025. Im Feld „Grafik, Content, Medien" lag der Schnitt 2025 bei 82 € pro Stunde. Der Branchenreport der German UPA (Berufsverband der UX-Professionals) nennt für selbstständige UX-Professionals einen Median-Stundensatz von 92 € (2023) und einen Median-Tagessatz von 735 €.',
    en: 'According to the Freelancer-Kompass 2026 (freelancermap, 5,400+ respondents) the average freelance hourly rate in the DACH region is €103 — the first decline in the study’s history, after €104 in 2025. In the “graphics, content, media” field the 2025 average was €82 per hour. The industry report by German UPA (the professional association of UX practitioners) states a median hourly rate of €92 (2023) and a median day rate of €735 for self-employed UX professionals.',
  } satisfies Localized,
  note: {
    de: 'Plattform-Indizes (Malt, freelancermap) sind Live-Werte, abgerufen im Juli 2026. Studienwerte beziehen sich auf das jeweils genannte Erhebungsjahr.',
    en: 'Platform indices (Malt, freelancermap) are live values, retrieved in July 2026. Study figures refer to the survey year named in each case.',
  } satisfies Localized,
  columns: {
    metric: { de: 'Kennzahl', en: 'Metric' } satisfies Localized,
    value: { de: 'Wert', en: 'Value' } satisfies Localized,
    source: { de: 'Quelle (Jahr)', en: 'Source (year)' } satisfies Localized,
  },
  caption: {
    de: 'Stundensätze und Tagessätze für UX/UI-Design in Deutschland mit Quellenangabe',
    en: 'Hourly and day rates for UX/UI design in Germany, with sources',
  } satisfies Localized,
}

export const RATE_ROWS: RateRow[] = [
  {
    metric: {
      de: 'Ø Stundensatz Freelancer DACH (alle Felder)',
      en: 'Average freelance hourly rate, DACH (all fields)',
    },
    value: { de: '103 € (2026), 104 € (2025)', en: '€103 (2026), €104 (2025)' },
    source: 'Freelancer-Kompass 2026, freelancermap',
    sourceUrl: 'https://www.freelancermap.de/freelancer-kompass',
  },
  {
    metric: {
      de: 'Ø Stundensatz „Grafik, Content, Medien"',
      en: 'Average hourly rate, “graphics, content, media”',
    },
    value: { de: '82 € (2025)', en: '€82 (2025)' },
    source: 'Freelancer-Kompass 2025, freelancermap',
    sourceUrl: 'https://www.freelancermap.de/blog/stundensatz-grafiker-freelancer/',
  },
  {
    metric: {
      de: 'Median-Stundensatz selbstständige UX-Professionals',
      en: 'Median hourly rate, self-employed UX professionals',
    },
    value: { de: '92 € (2023)', en: '€92 (2023)' },
    source: 'German UPA Branchenreport',
    sourceUrl: 'https://germanupa.de/wissen/branchenreport',
  },
  {
    metric: {
      de: 'Median-Tagessatz selbstständige UX-Professionals',
      en: 'Median day rate, self-employed UX professionals',
    },
    value: { de: '735 € (2023)', en: '€735 (2023)' },
    source: 'German UPA Branchenreport',
    sourceUrl: 'https://germanupa.de/wissen/branchenreport',
  },
  {
    metric: {
      de: 'Ø Tagessatz UX-Designer nach Stadt',
      en: 'Average UX designer day rate by city',
    },
    value: {
      de: 'Berlin 578 € · München 658 € · Hamburg 657 €',
      en: 'Berlin €578 · Munich €658 · Hamburg €657',
    },
    source: 'Malt Tarifbarometer (Juli 2026)',
    sourceUrl: 'https://www.malt.de/t/tarifbarometer/web-grafikdesign/ux-designer',
  },
  {
    metric: {
      de: 'Ø Jahresumsatz selbstständige UX-Professionals',
      en: 'Average annual revenue, self-employed UX professionals',
    },
    value: {
      de: '114.042 € bei Ø 124 fakturierten Tagen (2025)',
      en: '€114,042 across an average of 124 billed days (2025)',
    },
    source: 'German UPA Branchenreport 2025',
    sourceUrl: 'https://germanupa.de/blog/ux-usability-branchenreport-2025-zwischen-begeisterung-realitaet-und-professionalisierung',
  },
]

export const KOSTEN_PROJECTS = {
  title: {
    de: 'Was kostet welches Projekt? Preisbeispiele 2026',
    en: 'What does which project cost? Price examples for 2026',
  } satisfies Localized,
  lead: {
    de: 'Stundensätze sagen wenig über Ihr Budget – Projektpreise schon. Die folgende Tabelle zeigt marktübliche Spannen für Freelancer und kleine Agenturen in Deutschland sowie meine eigenen Festpreise zum Vergleich (transparent, netto):',
    en: 'Hourly rates say little about your budget — project prices do. The table below shows the ranges common in Germany for freelancers and small agencies, alongside my own fixed prices for comparison (transparent, net):',
  } satisfies Localized,
  note: {
    de: 'Zur Einordnung der Marktspannen: Deutsche Preis-Ratgeber nennen für konversion-optimierte Landingpages 5.000–12.000 €, für KMU-Websites mit Individual-Design 5.000–12.000 € (bei größeren Agenturen 20.000–40.000 €) und für App-Design je nach Anspruch 3.000–50.000 €. Publizierte Festpreis-Beispiele für UX-Tests und Audits liegen zwischen 2.000 und 10.000 € – etwa der Basis-UX-Test ab 5.890 € bei eparo (Hamburg) oder der Festpreis-UX-Audit von inovex.',
    en: 'To put the market ranges in context: German pricing guides quote €5,000–12,000 for conversion-optimised landing pages, €5,000–12,000 for SME websites with a bespoke design (€20,000–40,000 at larger agencies) and €3,000–50,000 for app design depending on ambition. Published fixed-price examples for UX tests and audits sit between €2,000 and €10,000 — for instance the basic UX test from €5,890 at eparo (Hamburg) or the fixed-price UX audit from inovex.',
  } satisfies Localized,
  noteLinks: [
    { label: 'eparo (Hamburg)', href: 'https://eparo.de/preise' },
    { label: 'inovex', href: 'https://www.inovex.de/de/leistungen/ui-ux/ui-ux-audit/' },
  ],
  columns: {
    project: { de: 'Projekt', en: 'Project' } satisfies Localized,
    market: { de: 'Marktübliche Spanne', en: 'Typical market range' } satisfies Localized,
    mine: { de: 'Mein Festpreis', en: 'My fixed price' } satisfies Localized,
    duration: { de: 'Dauer', en: 'Duration' } satisfies Localized,
  },
  caption: {
    de: 'Projektpreise für UX/UI-Design-Leistungen',
    en: 'Project prices for UX/UI design services',
  } satisfies Localized,
}

export const PROJECT_ROWS: ProjectRow[] = [
  {
    project: { de: 'UX-Audit / Usability-Analyse', en: 'UX audit / usability analysis' },
    market: { de: '2.000 – 10.000 €', en: '€2,000 – 10,000' },
    mine: { de: '2.500 – 5.000 €', en: '€2,500 – 5,000' },
    duration: { de: '1–2 Wochen', en: '1–2 weeks' },
  },
  {
    project: {
      de: 'Landingpage inkl. Conversion-Optimierung',
      en: 'Landing page including conversion optimisation',
    },
    market: { de: '1.500 – 12.000 €', en: '€1,500 – 12,000' },
    mine: { de: '5.000 – 12.000 €', en: '€5,000 – 12,000' },
    duration: { de: '2–3 Wochen', en: '2–3 weeks' },
  },
  {
    project: {
      de: 'Corporate Website (Design + Umsetzung)',
      en: 'Corporate website (design + build)',
    },
    market: { de: '5.000 – 40.000 €', en: '€5,000 – 40,000' },
    mine: { de: '15.000 – 35.000 €', en: '€15,000 – 35,000' },
    duration: { de: '6–12 Wochen', en: '6–12 weeks' },
  },
  {
    project: {
      de: 'SaaS-Produkt / App-Design (inkl. Design System)',
      en: 'SaaS product / app design (incl. design system)',
    },
    market: { de: '8.000 – 50.000 €+', en: '€8,000 – 50,000+' },
    mine: { de: '25.000 – 75.000 €+', en: '€25,000 – 75,000+' },
    duration: { de: 'ab 8 Wochen', en: 'from 8 weeks' },
  },
]

export const KOSTEN_FACTORS_TITLE: Localized = {
  de: 'Die 5 Faktoren, die den Preis wirklich bestimmen',
  en: 'The five factors that really determine the price',
}

export const COST_FACTORS: CostFactor[] = [
  {
    title: { de: 'Umfang & Komplexität', en: 'Scope & complexity' },
    description: {
      de: 'Fünf Screens oder fünfzig? Ein Conversion-Funnel oder ein komplettes SaaS-Produkt mit Rollen und Datenvisualisierung? Der Umfang ist der größte Preistreiber – definieren Sie ihn vor der Angebotsphase so konkret wie möglich.',
      en: 'Five screens or fifty? One conversion funnel or a complete SaaS product with roles and data visualisation? Scope is the biggest price driver — define it as concretely as possible before the quoting stage.',
    },
  },
  {
    title: { de: 'Research-Tiefe', en: 'Depth of research' },
    description: {
      de: 'Heuristik-basiertes Design ist günstiger als echtes User Research (Interviews, Tests). Für risikoreiche Produkte lohnt Research fast immer – für eine einfache Landingpage reicht oft die Auswertung vorhandener Daten.',
      en: 'Heuristics-based design is cheaper than real user research (interviews, tests). For high-risk products research almost always pays off — for a simple landing page, evaluating existing data is often enough.',
    },
  },
  {
    title: { de: 'Seniorität & Spezialisierung', en: 'Seniority & specialisation' },
    description: {
      de: 'Ein Senior mit SaaS- oder E-Commerce-Spezialisierung kostet pro Stunde mehr, braucht aber deutlich weniger Stunden und vermeidet teure Irrwege. Entscheidend ist der Projektpreis pro Ergebnis, nicht der Stundensatz.',
      en: 'A senior specialising in SaaS or e-commerce costs more per hour but needs far fewer hours and avoids expensive detours. What matters is the project price per result, not the hourly rate.',
    },
  },
  {
    title: { de: 'Design System & Dokumentation', en: 'Design system & documentation' },
    description: {
      de: 'Einmalige Screens sind billiger als ein skalierbares Design System mit Tokens, Component Library und Dokumentation. Letzteres zahlt sich ab dem zweiten Feature-Release aus.',
      en: 'One-off screens are cheaper than a scalable design system with tokens, a component library and documentation. The latter pays for itself from the second feature release onwards.',
    },
  },
  {
    title: {
      de: 'Umsetzung: Design-only oder Design + Code',
      en: 'Delivery: design only or design + code',
    },
    description: {
      de: 'Endet das Projekt mit Figma-Files oder mit einer live geschalteten Website? Design und Entwicklung aus einer Hand spart Übergabe- und Abstimmungskosten – ein Grund, warum ich beides anbiete.',
      en: 'Does the project end with Figma files or with a live website? Design and development from one source saves handover and coordination costs — one reason I offer both.',
    },
  },
]

export const KOSTEN_ROI = {
  title: {
    de: 'Lohnt sich das? Was gutes UX-Design nachweislich bringt',
    en: 'Is it worth it? What good UX design demonstrably delivers',
  } satisfies Localized,
  lead: {
    de: 'Vorab eine ehrliche Einordnung: Die oft zitierte Faustformel „1 Dollar in UX bringt 100 Dollar zurück" lässt sich nicht seriös belegen – sie kursiert seit Jahren ohne nachvollziehbare Primärquelle. Wer sie Ihnen als Fakt verkauft, hat nicht recherchiert. Es gibt aber belastbare Daten, die den Business Case für gutes UX-Design klar stützen:',
    en: 'An honest note up front: the frequently quoted rule of thumb that “one dollar in UX returns one hundred” cannot be substantiated — it has been circulating for years without a traceable primary source. Anyone selling it to you as a fact has not done the research. There are, however, solid figures that clearly support the business case for good UX design:',
  } satisfies Localized,
  sourceLabel: { de: 'Quelle:', en: 'Source:' } satisfies Localized,
}

export const ROI_STATS: RoiStat[] = [
  {
    claim: {
      de: 'Design-orientierte Unternehmen erzielten über 5 Jahre 32 Prozentpunkte mehr Umsatzwachstum und 56 Prozentpunkte mehr Total-Shareholder-Return-Wachstum als der Branchendurchschnitt (300 börsennotierte Unternehmen).',
      en: 'Over five years, design-led companies achieved 32 percentage points more revenue growth and 56 percentage points more total-shareholder-return growth than their industry average (300 listed companies).',
    },
    source: 'McKinsey – The Business Value of Design (2018)',
    sourceUrl: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-business-value-of-design',
  },
  {
    claim: {
      de: 'Rund 70 % aller Online-Warenkörbe werden abgebrochen (Meta-Auswertung von ~50 Studien). Besseres Checkout-Design allein kann die Conversion großer Shops um durchschnittlich 35 % steigern.',
      en: 'Around 70% of all online shopping carts are abandoned (meta-analysis of about 50 studies). Better checkout design alone can raise the conversion of large shops by an average of 35%.',
    },
    source: 'Baymard Institute – Cart Abandonment Research (laufend aktualisiert)',
    sourceUrl: 'https://baymard.com/lists/cart-abandonment-rate',
  },
  {
    claim: {
      de: '0,1 Sekunden schnellere mobile Ladezeit steigerte im Retail die Conversions um 8,4 % und den durchschnittlichen Bestellwert um 9,2 % (37 Marken-Websites, 30+ Mio. Sessions).',
      en: 'A 0.1-second faster mobile load time increased retail conversions by 8.4% and average order value by 9.2% (37 brand websites, 30+ million sessions).',
    },
    source: 'Deloitte & Google – Milliseconds Make Millions (2020)',
    sourceUrl: 'https://www.deloitte.com/ie/en/services/consulting/research/milliseconds-make-millions.html',
  },
  {
    claim: {
      de: '53 % der mobilen Website-Besuche werden abgebrochen, wenn die Seite länger als 3 Sekunden lädt (Analyse von über 10.000 mobilen Domains, 2016).',
      en: '53% of mobile site visits are abandoned if the page takes longer than three seconds to load (analysis of more than 10,000 mobile domains, 2016).',
    },
    source: 'Google/SOASTA – The Need for Mobile Speed (2016)',
    sourceUrl: 'https://www.thinkwithgoogle.com/consumer-insights/consumer-trends/mobile-site-load-time-statistics/',
  },
]

export const KOSTEN_MODELS = {
  title: {
    de: 'Stundensatz, Tagessatz oder Festpreis?',
    en: 'Hourly rate, day rate or fixed price?',
  } satisfies Localized,
  paragraph1: {
    de: 'Drei Abrechnungsmodelle sind üblich – und sie setzen unterschiedliche Anreize. Nach Stunden bezahlt zu werden belohnt langsames Arbeiten; ein Festpreis belohnt Effizienz und zwingt beide Seiten, den Umfang vorher sauber zu definieren. Ich arbeite deshalb ausschließlich mit Festpreisen (Value-Based Pricing): Sie kennen Ihr Budget vor Projektstart, und Umfang, Ergebnisse und Preis stehen schriftlich fest. Für offene, langfristige Zusammenarbeit (z. B. Design-Sparring) sind Tagessätze dagegen völlig legitim.',
    en: 'Three billing models are common — and they set different incentives. Being paid by the hour rewards working slowly; a fixed price rewards efficiency and forces both sides to define the scope properly beforehand. That is why I work exclusively with fixed prices (value-based pricing): you know your budget before the project starts, and scope, deliverables and price are set out in writing. For open-ended, long-term collaboration (design sparring, for example) day rates are perfectly legitimate.',
  } satisfies Localized,
  paragraph2Lead: {
    de: 'Achten Sie beim Vergleich von Angeboten weniger auf den Stundensatz als auf drei Fragen: Was genau ist enthalten? Wer macht die Arbeit (Senior oder Junior)? Und was passiert bei Mehraufwand? Mehr dazu im Vergleich',
    en: 'When comparing quotes, pay less attention to the hourly rate and more to three questions: what exactly is included? Who does the work (senior or junior)? And what happens if it takes longer? More on that in the comparison',
  } satisfies Localized,
  paragraph2Link: {
    de: 'Freelancer oder Agentur',
    en: 'freelancer or agency',
  } satisfies Localized,
}

export const KOSTEN_BFSG = {
  title: {
    de: 'Nicht vergessen: Barrierefreiheit ist seit 2025 Pflicht (BFSG)',
    en: 'Do not forget: accessibility has been mandatory since 2025 (BFSG)',
  } satisfies Localized,
  paragraphLead: {
    de: 'Seit dem 28. Juni 2025 gilt in Deutschland das',
    en: 'Since 28 June 2025, Germany has been subject to the',
  } satisfies Localized,
  linkLabel: {
    de: 'Barrierefreiheitsstärkungsgesetz (BFSG)',
    en: 'Accessibility Strengthening Act (BFSG)',
  } satisfies Localized,
  linkUrl: 'https://www.bundesfachstelle-barrierefreiheit.de/DE/Fachwissen/Produkte-und-Dienstleistungen/Barrierefreiheitsstaerkungsgesetz/barrierefreiheitsstaerkungsgesetz_node.html',
  paragraphRest: {
    de: '– die deutsche Umsetzung des European Accessibility Act. Es verpflichtet viele B2C-Websites, Shops und Apps zur Barrierefreiheit; bei Verstößen drohen Bußgelder bis 100.000 €. Für Ihre Budget-Planung heißt das: Barrierefreiheit (WCAG 2.1 AA) gehört von Anfang an ins Projekt – eine Nachrüstung ist fast immer teurer als der Einbau beim Design. In meinen Projekten und',
    en: '— the German implementation of the European Accessibility Act. It obliges many B2C websites, shops and apps to be accessible; breaches can attract fines of up to €100,000. For your budget planning that means accessibility (WCAG 2.1 AA) belongs in the project from the start — retrofitting is almost always more expensive than building it in during design. In my projects and',
  } satisfies Localized,
  auditLinkLabel: { de: 'UX-Audits', en: 'UX audits' } satisfies Localized,
  paragraphEnd: {
    de: 'ist die WCAG-Prüfung deshalb Standard.',
    en: 'a WCAG review is therefore standard.',
  } satisfies Localized,
}

export const KOSTEN_FAQ_TITLE: Localized = {
  de: 'Häufige Fragen zu UX/UI-Design-Kosten',
  en: 'Frequently asked questions about UX/UI design costs',
}

export const KOSTEN_FAQS: LocalizedFaq[] = [
  {
    question: {
      de: 'Was kostet ein UX-Designer pro Stunde in Deutschland?',
      en: 'What does a UX designer cost per hour in Germany?',
    },
    answer: {
      de: 'Marktdaten 2025/2026: Der Freelancer-Kompass von freelancermap nennt 103 € Durchschnitts-Stundensatz über alle Felder (Grafik/Content/Medien: 82 €), der German-UPA-Branchenreport 92 € Median für selbstständige UX-Professionals. Senior-UX-Designer mit Spezialisierung liegen typischerweise bei 90–120 € pro Stunde, Einsteiger bei 50–70 €.',
      en: 'Market data for 2025/2026: freelancermap’s Freelancer-Kompass reports an average hourly rate of €103 across all fields (graphics/content/media: €82); the German UPA industry report gives a median of €92 for self-employed UX professionals. Senior UX designers with a specialisation typically sit at €90–120 per hour, entrants at €50–70.',
    },
  },
  {
    question: {
      de: 'Was kostet ein UX-Designer pro Tag?',
      en: 'What does a UX designer cost per day?',
    },
    answer: {
      de: 'Der Median-Tagessatz selbstständiger UX-Professionals lag laut German UPA bei 735 € (2023). Das Malt-Tarifbarometer zeigt für UX-Designer durchschnittliche Tagessätze von 578 € (Berlin) bis 658 € (München) – Plattform-Durchschnitte inklusive Junior-Profilen. Für Senior-Niveau sind 800–1.000 € pro Tag marktüblich.',
      en: 'According to German UPA the median day rate for self-employed UX professionals was €735 (2023). Malt’s rate barometer shows average day rates for UX designers from €578 (Berlin) to €658 (Munich) — platform averages that include junior profiles. At senior level, €800–1,000 per day is the market norm.',
    },
  },
  {
    question: {
      de: 'Was kostet eine professionelle Website vom Freelancer?',
      en: 'What does a professional website from a freelancer cost?',
    },
    answer: {
      de: 'Je nach Umfang: Eine konversion-optimierte Landingpage kostet marktüblich 5.000–12.000 €, eine Corporate Website mit Individual-Design, WCAG-Konformität und Umsetzung 15.000–35.000 €. Einfache Template-Websites gibt es ab wenigen Tausend Euro – sie erreichen aber selten die Performance- und Conversion-Ziele, für die sich professionelles UX-Design lohnt.',
      en: 'It depends on scope: a conversion-optimised landing page typically costs €5,000–12,000, a corporate website with a bespoke design, WCAG conformance and implementation €15,000–35,000. Simple template websites start at a few thousand euros — but they rarely reach the performance and conversion goals that make professional UX design worthwhile.',
    },
  },
  {
    question: {
      de: 'Warum sind die Preisspannen so groß?',
      en: 'Why are the price ranges so wide?',
    },
    answer: {
      de: 'Weil „Website" oder „App-Design" keine definierten Produkte sind: Umfang, Research-Tiefe, Design-System-Bedarf, Seniorität und die Frage Design-only vs. Design + Entwicklung können den Preis um den Faktor 5–10 verändern. Seriöse Anbieter machen deshalb erst ein Erstgespräch und dann ein Angebot mit definiertem Umfang – Misstrauen ist angebracht, wenn jemand ohne Briefing einen Preis nennt.',
      en: 'Because “website” or “app design” are not defined products: scope, depth of research, the need for a design system, seniority and the question of design-only versus design plus development can move the price by a factor of five to ten. Serious providers therefore run an intro call first and then quote against a defined scope — be suspicious of anyone who names a price without a briefing.',
    },
  },
  {
    question: {
      de: 'Festpreis oder Stundensatz – was ist besser für Auftraggeber?',
      en: 'Fixed price or hourly rate — which is better for clients?',
    },
    answer: {
      de: 'Für klar definierte Projekte: Festpreis. Sie kennen Ihr Budget vorher, das Effizienz-Risiko liegt beim Dienstleister, und der Umfang muss sauber definiert werden – was die Projektqualität erhöht. Stunden- oder Tagessätze passen für offene, fortlaufende Zusammenarbeit. Vorsicht bei Stundensatz-Angeboten ohne Aufwandsschätzung: Das unternehmerische Risiko liegt dann komplett bei Ihnen.',
      en: 'For clearly defined projects: a fixed price. You know your budget in advance, the efficiency risk sits with the provider, and the scope has to be properly defined — which raises project quality. Hourly or day rates suit open-ended, ongoing collaboration. Be careful with hourly quotes that come without an effort estimate: the entire commercial risk then sits with you.',
    },
  },
  {
    question: {
      de: 'Stimmt es, dass 1 € in UX 100 € Return bringt?',
      en: 'Is it true that €1 in UX returns €100?',
    },
    answer: {
      de: 'Diese populäre Zahl lässt sich nicht seriös belegen – es gibt keine auffindbare Primärstudie dafür; sie wird seit Jahren von Blog zu Blog weitergereicht. Belastbar sind stattdessen: McKinseys Business Value of Design (32 Prozentpunkte mehr Umsatzwachstum bei designstarken Unternehmen), Baymards Checkout-Forschung (+35 % Conversion-Potenzial) und die Deloitte/Google-Studie zu Ladezeiten (+8,4 % Conversions pro 0,1 s).',
      en: 'This popular figure cannot be substantiated — there is no findable primary study behind it; it has been passed from blog to blog for years. What is solid instead: McKinsey’s Business Value of Design (32 percentage points more revenue growth at design-led companies), Baymard’s checkout research (+35% conversion potential) and the Deloitte/Google study on load times (+8.4% conversions per 0.1 s).',
    },
  },
]

export const KOSTEN_SOURCES_TITLE: Localized = { de: 'Quellen', en: 'Sources' }

export const KOSTEN_SOURCES = [
  {
    label: 'freelancermap – Freelancer-Kompass 2026 (5.400+ Befragte, DACH)',
    url: 'https://www.freelancermap.de/freelancer-kompass',
  },
  {
    label: 'German UPA – Branchenreport UX/Usability 2025 & 2023',
    url: 'https://germanupa.de/wissen/branchenreport',
  },
  {
    label: 'Malt – Tarifbarometer UX-Designer (abgerufen Juli 2026)',
    url: 'https://www.malt.de/t/tarifbarometer/web-grafikdesign/ux-designer',
  },
  {
    label: 'McKinsey – The Business Value of Design (2018)',
    url: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-business-value-of-design',
  },
  {
    label: 'Baymard Institute – Cart Abandonment Rate Statistics',
    url: 'https://baymard.com/lists/cart-abandonment-rate',
  },
  {
    label: 'Deloitte & Google – Milliseconds Make Millions (2020)',
    url: 'https://www.deloitte.com/ie/en/services/consulting/research/milliseconds-make-millions.html',
  },
  {
    label: 'Google/SOASTA – Mobile Page Speed Study (2016)',
    url: 'https://www.thinkwithgoogle.com/consumer-insights/consumer-trends/mobile-site-load-time-statistics/',
  },
  {
    label: 'Bundesfachstelle Barrierefreiheit – Barrierefreiheitsstärkungsgesetz (BFSG)',
    url: 'https://www.bundesfachstelle-barrierefreiheit.de/DE/Fachwissen/Produkte-und-Dienstleistungen/Barrierefreiheitsstaerkungsgesetz/barrierefreiheitsstaerkungsgesetz_node.html',
  },
  {
    label: 'eparo – öffentliche Preisliste UX-Tests (Hamburg)',
    url: 'https://eparo.de/preise',
  },
]

export const KOSTEN_CTA = {
  title: {
    de: 'Was kostet Ihr Projekt konkret?',
    en: 'What will your project actually cost?',
  } satisfies Localized,
  text: {
    de: 'Buchen Sie ein kostenloses 30-Minuten-Erstgespräch: Sie schildern Ihr Vorhaben, ich nenne Ihnen eine ehrliche Einschätzung – und innerhalb von 48 Stunden einen Festpreis.',
    en: 'Book a free 30-minute intro call: you describe what you have in mind, I give you an honest assessment — and a fixed price within 48 hours.',
  } satisfies Localized,
}

export const KOSTEN_META = {
  title: {
    de: 'Was kostet UX/UI Design? Preise & Stundensätze 2026 (mit Quellen)',
    en: 'What does UX/UI design cost? Prices & rates 2026 (with sources)',
  } satisfies Localized,
  description: {
    de: 'UX/UI-Design-Kosten 2026 mit belegten Daten: Stundensätze (82–103 €), Tagessätze (578–735 €), Projektpreise vom UX-Audit (ab €2.500) bis zum SaaS-Design (€25.000+). Alle Zahlen mit Quellen.',
    en: 'UX/UI design costs in 2026, backed by data: hourly rates (€82–103), day rates (€578–735), project prices from a UX audit (from €2,500) to SaaS design (€25,000+). Every figure with its source.',
  } satisfies Localized,
  headline: {
    de: 'Was kostet UX/UI Design? Preise, Stundensätze & Beispiele 2026',
    en: 'What does UX/UI design cost? Prices, rates & examples for 2026',
  } satisfies Localized,
}
