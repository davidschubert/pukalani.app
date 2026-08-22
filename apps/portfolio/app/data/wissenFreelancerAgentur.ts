import type { Localized, LocalizedFaq } from './localized'
import type { TocItem } from './wissenKosten'

/**
 * Inhalte des Guides „Freelancer oder Agentur?"
 * (/wissen/freelancer-oder-agentur · /de/wissen/freelancer-oder-agentur).
 *
 * Der Transparenz-Hinweis bleibt in beiden Sprachen stehen: der Absender ist
 * selbst Anbieter in diesem Markt, und ein Vergleich, der das verschweigt, ist
 * Werbung mit Tabellen-Optik.
 *
 * DER ARTIKEL BLEIBT RATGEBER, nicht Verkaufstext: die Tabelle vergleicht
 * weiterhin „Senior-Freelancer" und „Agentur" als MODELLE. Pukalani Studio
 * steht dazwischen und sagt das genau einmal — im Abschnitt „Wann Agentur?"
 * als Mittelweg (Senior-Verantwortung und direkter Draht wie beim Freelancer,
 * Verlässlichkeit und Bandbreite über ein Partnernetz, ohne Agentur-Overhead).
 */

export interface ComparisonRow {
  criterion: Localized
  freelancer: Localized
  agency: Localized
}

export const AGENTUR_HERO = {
  breadcrumb: { de: 'Freelancer oder Agentur', en: 'Freelancer or agency' } satisfies Localized,
  title: {
    de: 'UX/Webdesign: Freelancer oder Agentur? Der ehrliche Vergleich 2026',
    en: 'UX & web design: freelancer or agency? The honest comparison for 2026',
  } satisfies Localized,
  intro: {
    de: 'Kurzantwort: Ein Senior-Freelancer ist die bessere Wahl für klar umrissene Design- und Web-Projekte bis etwa €75.000 – direkter Kontakt, 30–50 % niedrigere Kosten, schnellere Entscheidungen. Eine Agentur lohnt sich, wenn Sie viele Disziplinen gleichzeitig, sehr große Kapazität oder langfristige Betreuung mit Vertretungsgarantie brauchen.',
    en: 'Short answer: a senior freelancer is the better choice for clearly defined design and web projects up to roughly €75,000 — direct contact, 30–50% lower cost, faster decisions. An agency pays off when you need many disciplines at once, very large capacity or long-term support with guaranteed cover.',
  } satisfies Localized,
  bylineRole: {
    de: '– Pukalani Studio · Senior UI/UX Designer & Creative Technologist, 25+ Jahre Erfahrung (Agentur- und Freelancer-Seite)',
    en: '— Pukalani Studio · senior UI/UX designer & creative technologist, 25+ years of experience (on both the agency and the freelance side)',
  } satisfies Localized,
  disclosureLabel: { de: 'Transparenz:', en: 'Disclosure:' } satisfies Localized,
  disclosure: {
    de: 'Wir sind selbst Anbieter in diesem Markt: Pukalani Studio arbeitet als kleines Senior-Studio und damit näher am Freelancer-Modell als an der Agentur. Dieser Vergleich nennt deshalb bewusst auch die Fälle, in denen eine Agentur die bessere Wahl ist.',
    en: 'We are a provider in this market ourselves: Pukalani Studio works as a small senior studio, and that puts us closer to the freelance model than to the agency one. Which is why this comparison deliberately names the cases where an agency is the better choice.',
  } satisfies Localized,
}

export const AGENTUR_TOC: TocItem[] = [
  {
    label: { de: 'Der direkte Vergleich (Tabelle)', en: 'The direct comparison (table)' },
    href: '#vergleich',
  },
  { label: { de: 'Kostenvergleich', en: 'Cost comparison' }, href: '#kosten' },
  { label: { de: 'Wann Freelancer?', en: 'When a freelancer?' }, href: '#wann-freelancer' },
  { label: { de: 'Wann Agentur?', en: 'When an agency?' }, href: '#wann-agentur' },
  { label: { de: 'Risiken & Absicherung', en: 'Risks & safeguards' }, href: '#risiken' },
  { label: { de: 'FAQ & Fazit', en: 'FAQ & conclusion' }, href: '#faq' },
]

export const AGENTUR_COMPARISON = {
  title: {
    de: 'Freelancer vs. Agentur: der direkte Vergleich',
    en: 'Freelancer vs. agency: the direct comparison',
  } satisfies Localized,
  lead: {
    de: 'Die Tabelle fasst die wichtigsten Unterschiede zusammen – darunter folgt die Einordnung im Detail.',
    en: 'The table summarises the key differences — the detailed assessment follows below.',
  } satisfies Localized,
  caption: {
    de: 'Vergleich zwischen Freelancer und Agentur für UX- und Webdesign-Projekte',
    en: 'Comparison of freelancer and agency for UX and web design projects',
  } satisfies Localized,
  columns: {
    criterion: { de: 'Kriterium', en: 'Criterion' } satisfies Localized,
    freelancer: { de: 'Senior-Freelancer', en: 'Senior freelancer' } satisfies Localized,
    agency: { de: 'Agentur', en: 'Agency' } satisfies Localized,
  },
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    criterion: { de: 'Stundensatz (Markt DE)', en: 'Hourly rate (German market)' },
    freelancer: {
      de: 'ca. 60–120 € (Senior UX/Webdesign)',
      en: 'approx. €60–120 (senior UX/web design)',
    },
    agency: { de: 'ca. 100–200 € (inkl. Overhead)', en: 'approx. €100–200 (incl. overhead)' },
  },
  {
    criterion: { de: 'Wer macht die Arbeit?', en: 'Who does the work?' },
    freelancer: {
      de: 'Die Person, mit der Sie sprechen – 100 % Senior-Zeit',
      en: 'The person you are talking to — 100% senior time',
    },
    agency: {
      de: 'Häufig Junior/Mid-Level nach Senior-Pitch',
      en: 'Often junior/mid-level after a senior pitch',
    },
  },
  {
    criterion: { de: 'Kommunikation', en: 'Communication' },
    freelancer: { de: 'Direkt, ohne Zwischenebene', en: 'Direct, with no layer in between' },
    agency: {
      de: 'Über Projektleitung / Account Management',
      en: 'Via project lead / account management',
    },
  },
  {
    criterion: { de: 'Geschwindigkeit', en: 'Speed' },
    freelancer: {
      de: 'Entscheidungen in Stunden bis Tagen',
      en: 'Decisions in hours to days',
    },
    agency: {
      de: 'Abstimmungsschleifen über mehrere Rollen',
      en: 'Review loops across several roles',
    },
  },
  {
    criterion: { de: 'Kapazität', en: 'Capacity' },
    freelancer: { de: 'Begrenzt – 1–2 Projekte parallel', en: 'Limited — 1–2 projects in parallel' },
    agency: { de: 'Skalierbar, mehrere Teams', en: 'Scalable, several teams' },
  },
  {
    criterion: { de: 'Disziplin-Breite', en: 'Breadth of disciplines' },
    freelancer: {
      de: 'Spezialisiert (+ Partnernetzwerk)',
      en: 'Specialised (+ partner network)',
    },
    agency: { de: 'Viele Disziplinen im Haus', en: 'Many disciplines in house' },
  },
  {
    criterion: { de: 'Ausfallrisiko', en: 'Risk of unavailability' },
    freelancer: {
      de: 'Eine Person (vertraglich absichern)',
      en: 'One person (cover it contractually)',
    },
    agency: { de: 'Vertretung im Team möglich', en: 'Cover within the team is possible' },
  },
  {
    criterion: { de: 'Flexibilität & Vertrag', en: 'Flexibility & contract' },
    freelancer: {
      de: 'Schlanke Verträge, phasenweise buchbar',
      en: 'Lean contracts, bookable phase by phase',
    },
    agency: { de: 'Rahmenverträge, längere Bindung', en: 'Framework contracts, longer commitment' },
  },
]

export const AGENTUR_COSTS = {
  title: {
    de: 'Was kostet ein Freelancer, was eine Agentur?',
    en: 'What does a freelancer cost, and what does an agency cost?',
  } satisfies Localized,
  paragraph1: {
    de: 'Freelance-Webdesigner und UX-Designer in Deutschland berechnen üblicherweise 60–120 € pro Stunde, Agenturen wegen Overhead (Projektleitung, Büro, Vertrieb) meist 100–200 € pro Stunde. Auf Projektebene bedeutet das: Ein Projekt, das beim Freelancer €15.000 kostet, liegt bei einer Agentur häufig bei €25.000–35.000 – bei vergleichbarem Ergebnis, wenn der Freelancer Senior-Niveau hat.',
    en: 'Freelance web and UX designers in Germany usually charge €60–120 per hour; agencies, because of overhead (project management, offices, sales), usually charge €100–200 per hour. At project level that means: a project costing €15,000 with a freelancer often lands at €25,000–35,000 with an agency — for a comparable result, provided the freelancer works at senior level.',
  } satisfies Localized,
  paragraph2Lead: {
    de: 'Wichtig ist der Blick auf die',
    en: 'What matters is a look at the',
  } satisfies Localized,
  paragraph2Emphasis: { de: 'wirksame', en: 'effective' } satisfies Localized,
  paragraph2Middle: {
    de: 'Senior-Zeit: In Agenturen arbeiten nach dem Verkaufsgespräch oft Junior- und Mid-Level-Designer am Projekt, während der Senior-Anteil in Reviews steckt. Beim Freelancer ist jede bezahlte Stunde Senior-Zeit. Wir arbeiten deshalb mit',
    en: 'senior time: in agencies, junior and mid-level designers often work on the project after the sales meeting, while the senior share sits in reviews. With a freelancer every paid hour is senior time. That is why we work with',
  } satisfies Localized,
  paragraph2LinkLabel: {
    de: 'festen Projektpreisen statt Stundensätzen',
    en: 'fixed project prices instead of hourly rates',
  } satisfies Localized,
  paragraph2End: {
    de: '– das macht den Vergleich für Sie noch einfacher.',
    en: '— which makes the comparison even easier for you.',
  } satisfies Localized,
}

export const AGENTUR_FREELANCER_FIT = {
  title: {
    de: 'Wann ist ein Freelancer die richtige Wahl?',
    en: 'When is a freelancer the right choice?',
  } satisfies Localized,
  lead: {
    de: 'Ein erfahrener Freelancer passt, wenn das Projekt klar umrissen ist und Qualität pro Euro zählt:',
    en: 'An experienced freelancer fits when the project is clearly defined and quality per euro is what counts:',
  } satisfies Localized,
  items: {
    de: [
      'Klar umrissene Projekte: Website-Relaunch, Landingpage, UX-Audit, Dashboard-Redesign, Design System',
      'Budget bis ca. €75.000, bei dem jeder Euro in Umsetzung statt Overhead fließen soll',
      'Sie wollen direkten Zugriff auf die ausführende Person – kurze Wege, schnelle Iterationen',
      'Inhouse-Team vorhanden, das punktuell Senior-Verstärkung braucht (Design oder Entwicklung)',
      'Design UND Entwicklung aus einer Hand gewünscht – ohne Übergabeverluste',
    ],
    en: [
      'Clearly defined projects: website relaunch, landing page, UX audit, dashboard redesign, design system',
      'Budgets up to about €75,000 where every euro should go into execution rather than overhead',
      'You want direct access to the person doing the work — short lines of communication, fast iterations',
      'An in-house team that needs senior reinforcement for a specific job (design or development)',
      'Design AND development from a single provider — nothing lost at handover',
    ],
  } satisfies Localized<string[]>,
}

export const AGENTUR_AGENCY_FIT = {
  title: {
    de: 'Wann ist die Agentur die bessere Wahl?',
    en: 'When is the agency the better choice?',
  } satisfies Localized,
  lead: {
    de: 'Ehrlich gesagt: Es gibt Projekte, für die Sie keine Einzelperson beauftragen sollten.',
    en: 'Honestly: there are projects for which you should not hire an individual.',
  } satisfies Localized,
  items: {
    de: [
      'Große Multi-Kanal-Vorhaben: Marke + Kampagne + Website + Content + Media gleichzeitig',
      'Sehr enge Deadlines, die nur mit mehreren parallelen Teams zu halten sind',
      'Konzern-Anforderungen: Rahmenverträge, SLAs, Vertretungsgarantien, Compliance-Prozesse',
      'Langfristige Betreuung mit garantierter Erreichbarkeit über Urlaubs- und Krankheitszeiten hinweg',
    ],
    en: [
      'Large multi-channel undertakings: brand + campaign + website + content + media all at once',
      'Very tight deadlines that can only be met with several teams working in parallel',
      'Enterprise requirements: framework contracts, SLAs, guaranteed cover, compliance processes',
      'Long-term support with guaranteed availability across holidays and sick leave',
    ],
  } satisfies Localized<string[]>,
  note: {
    de: 'Es gibt einen Mittelweg – und dort arbeiten wir: Ein kleines Senior-Studio wie Pukalani Studio gibt Ihnen die Senior-Verantwortung und den direkten Draht des Freelancers, holt für Spezialdisziplinen (Entwicklung, Content, Fotografie) aber feste Partner dazu. Sie bekommen Verlässlichkeit und Bandbreite in Richtung Agentur, ohne deren Wasserkopf zu bezahlen – und behalten einen einzigen Ansprechpartner.',
    en: 'There is a middle path — and that is where we work: a small senior studio like Pukalani Studio gives you the senior accountability and the direct line of a freelancer, but brings in established partners for specialist disciplines (development, content, photography). You get reliability and breadth closer to an agency without paying for its overhead — and you keep a single point of contact.',
  } satisfies Localized,
}

export const AGENTUR_RISKS = {
  title: {
    de: 'Die Risiken beider Modelle – und wie Sie sie absichern',
    en: 'The risks of both models — and how to cover them',
  } satisfies Localized,
  freelancerTitle: { de: 'Risiko Freelancer', en: 'Freelancer risk' } satisfies Localized,
  freelancerText: {
    de: 'Ausfall durch Krankheit, begrenzte Kapazität, Qualität hängt an einer Person. Absicherung: Referenzen und Arbeitsproben prüfen, Festpreis mit definierten Meilensteinen vereinbaren, Quellcode- und Datei-Übergabe vertraglich festhalten.',
    en: 'Absence through illness, limited capacity, quality depending on one person. Safeguards: check references and work samples, agree a fixed price with defined milestones, and put the handover of source code and files in the contract.',
  } satisfies Localized,
  agencyTitle: { de: 'Risiko Agentur', en: 'Agency risk' } satisfies Localized,
  agencyText: {
    de: 'Junior-Staffing nach Senior-Pitch, träge Abstimmungswege, Budget-Verbrauch durch Projektmanagement. Absicherung: Namentlich festgelegtes Team im Vertrag, direkte Kommunikationswege und transparente Stundenaufstellung verlangen.',
    en: 'Junior staffing after a senior pitch, slow approval chains, budget consumed by project management. Safeguards: insist on a named team in the contract, direct communication channels and a transparent breakdown of hours.',
  } satisfies Localized,
}

export const AGENTUR_FAQ_TITLE: Localized = { de: 'Häufige Fragen', en: 'Frequently asked questions' }

export const AGENTUR_FAQS: LocalizedFaq[] = [
  {
    question: {
      de: 'Ist ein Freelancer wirklich 30–50 % günstiger als eine Agentur?',
      en: 'Is a freelancer really 30–50% cheaper than an agency?',
    },
    answer: {
      de: 'Bei vergleichbarer Seniorität in der Regel ja. Der Unterschied entsteht durch den Agentur-Overhead (Projektleitung, Vertrieb, Büro) und dadurch, dass beim Freelancer jede Stunde Senior-Zeit ist. Marktüblich sind in Deutschland 60–120 € pro Stunde für Senior-Freelancer im UX-/Webdesign gegenüber 100–200 € bei Agenturen. Entscheidend ist der Projektpreis fürs gleiche Ergebnis – vergleichen Sie Angebote immer auf Basis definierter Leistungen.',
      en: 'At comparable seniority, usually yes. The difference comes from agency overhead (project management, sales, offices) and from the fact that with a freelancer every hour is senior time. The German market norm is €60–120 per hour for senior freelancers in UX and web design versus €100–200 at agencies. What matters is the project price for the same result — always compare quotes on the basis of defined deliverables.',
    },
  },
  {
    question: {
      de: 'Was passiert, wenn der Freelancer krank wird oder ausfällt?',
      en: 'What happens if the freelancer falls ill or drops out?',
    },
    answer: {
      de: 'Seriöse Freelancer sichern das ab: dokumentierte Arbeitsstände in gemeinsamen Tools (Figma, Git, Notion), Meilenstein-Abnahmen mit Teillieferungen und vertraglich geregelte Datei-Übergabe. So bleibt Ihr Projekt auch im Ausfallszenario fortführbar. Fragen Sie im Erstgespräch konkret danach – die Antwort zeigt die Professionalität.',
      en: 'Serious freelancers cover this: documented work in shared tools (Figma, Git, Notion), milestone sign-offs with partial deliveries and a contractually agreed handover of files. That keeps your project going even if the freelancer drops out. Ask about it explicitly in the intro call — the answer tells you how professional the setup is.',
    },
  },
  {
    question: {
      de: 'Kann ein Freelancer auch große Projekte stemmen?',
      en: 'Can a freelancer handle large projects too?',
    },
    answer: {
      de: 'Projekte bis etwa €75.000 sind für erfahrene Solo-Freelancer gut machbar, wenn der Umfang klar geschnitten ist. Darüber hinaus arbeiten viele Freelancer mit Partnernetzwerken – Sie behalten einen Ansprechpartner, bekommen aber zusätzliche Kapazität. Für echte Multi-Team-Vorhaben ist die Agentur die richtige Wahl.',
      en: 'Projects up to roughly €75,000 are well within reach for experienced solo freelancers, provided the scope is clearly defined. Beyond that, many freelancers work with partner networks — you keep a single point of contact but gain extra capacity. For genuine multi-team undertakings, the agency is the right choice.',
    },
  },
  {
    question: {
      de: 'Woran erkenne ich einen guten UX-/Webdesign-Freelancer?',
      en: 'How do I recognise a good UX or web design freelancer?',
    },
    answer: {
      de: 'An vier Dingen: 1. Nachweisbare Ergebnisse mit Zahlen (Conversion, Traffic, Nutzerzufriedenheit) statt nur schöner Bilder. 2. Ein klarer, dokumentierter Prozess von Discovery bis Launch. 3. Transparente Preise oder nachvollziehbare Festpreis-Angebote. 4. Ehrlichkeit über Grenzen – wer jedes Projekt annimmt, ist ein Warnsignal.',
      en: 'By four things: 1. Demonstrable results with numbers (conversion, traffic, user satisfaction) rather than pretty pictures alone. 2. A clear, documented process from discovery to launch. 3. Transparent prices or fixed-price quotes you can follow. 4. Honesty about limits — anyone who takes on every project is a warning sign.',
    },
  },
  {
    question: {
      de: 'Freelancer gefunden – wie starte ich risikoarm?',
      en: 'Found a freelancer — how do I start with low risk?',
    },
    answer: {
      de: 'Mit einem kleinen, klar definierten Einstiegsprojekt: Ein UX-Audit (bei uns €2.500–5.000, ein bis zwei Wochen) zeigt Arbeitsweise, Kommunikationsstil und Qualität, bevor Sie ein großes Redesign beauftragen. Gute Anbieter rechnen die Audit-Kosten bei Folgeprojekten teilweise an.',
      en: 'With a small, clearly defined entry project: a UX audit (€2,500–5,000 with us, one to two weeks) shows how a provider works, communicates and delivers before you commission a large redesign. Good providers credit part of the audit fee against follow-up projects.',
    },
  },
]

export const AGENTUR_CONCLUSION = {
  title: { de: 'Fazit', en: 'Conclusion' } satisfies Localized,
  text: {
    de: 'Für die meisten Design- und Web-Projekte im Mittelstand und bei SaaS-Unternehmen liefert ein Senior-Freelancer – oder ein kleines Senior-Studio – das bessere Preis-Leistungs-Verhältnis: Sie zahlen ausschließlich für Senior-Arbeit, entscheiden schneller und bleiben flexibler. Eine Agentur ist die richtige Wahl bei sehr großen, multidisziplinären Vorhaben mit hohem Kapazitätsbedarf. Prüfen Sie in beiden Fällen dasselbe: nachweisbare Ergebnisse, klare Prozesse und wer konkret an Ihrem Projekt arbeitet.',
    en: 'For most design and web projects in the German Mittelstand and at SaaS businesses, a senior freelancer — or a small senior studio — delivers the better value: you pay exclusively for senior work, decide faster and stay more flexible. An agency is the right choice for very large, multidisciplinary undertakings with high capacity requirements. In both cases check the same things: demonstrable results, clear processes and who exactly will work on your project.',
  } satisfies Localized,
}

export const AGENTUR_CTA = {
  title: {
    de: 'Direkt mit einem Senior sprechen',
    en: 'Talk to a senior directly',
  } satisfies Localized,
  text: {
    de: 'Sie möchten wissen, welches Modell zu Ihrem Projekt passt? Buchen Sie ein kostenloses Erstgespräch – wir sagen Ihnen auch ehrlich, wenn eine Agentur die bessere Wahl ist.',
    en: 'Want to know which model suits your project? Book a free intro call — we will also tell you honestly when an agency is the better choice.',
  } satisfies Localized,
}

export const AGENTUR_META = {
  /**
   * DAS DATUM DIESES ARTIKELS (Befund B7).
   *
   * Vorher stempelten Startseite und beide Guides alle drei
   * `CONTACT.lastUpdated` — EIN Datum für drei Dokumente, das mit jeder Pflege
   * irgendeiner Ecke der Site weiterrückte. `datePublished`/`dateModified`
   * sind aber Aussagen über den INHALT dieses Artikels; ein gemeinsames Datum
   * meldet Suchmaschinen (und Lesern) eine Überarbeitung, die es nicht gab —
   * und macht ein echtes Update ununterscheidbar.
   *
   * `published` ist der Stand der Übernahme aus dem alten Portfolio-Repo
   * (14. Juli 2026). `updated` und `updatedHuman` gehören zusammen — wer eines
   * ändert, ändert beide; die sichtbare Zeile im Kopf des Artikels und das
   * JSON-LD lesen dieselben Felder. Der SITE-Stand in der Fußzeile bleibt
   * `CONTACT.lastUpdatedHuman`.
   */
  published: '2026-07-14',
  updated: '2026-08-08',
  updatedHuman: { de: '8. August 2026', en: '8 August 2026' } satisfies Localized,
  title: {
    de: 'Freelancer oder Agentur für UX & Webdesign? Ehrlicher Vergleich 2026',
    en: 'Freelancer or agency for UX & web design? An honest comparison for 2026',
  } satisfies Localized,
  description: {
    de: 'Freelancer oder Agentur? Der ehrliche Vergleich für UX- und Webdesign-Projekte 2026: Kosten (60–120 € vs. 100–200 €/h), Geschwindigkeit, Risiken – und wann welche Wahl die richtige ist.',
    en: 'Freelancer or agency? The honest comparison for UX and web design projects in 2026: cost (€60–120 vs. €100–200 per hour), speed, risks — and when each choice is the right one.',
  } satisfies Localized,
  headline: {
    de: 'UX/Webdesign: Freelancer oder Agentur? Der ehrliche Vergleich 2026',
    en: 'UX & web design: freelancer or agency? The honest comparison for 2026',
  } satisfies Localized,
}
