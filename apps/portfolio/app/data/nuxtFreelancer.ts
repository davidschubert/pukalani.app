import type { Localized, LocalizedFaq } from './localized'

/**
 * Inhalte der Seite „Nuxt Entwickler Freelancer"
 * (/nuxt-entwickler-freelancer · /de/nuxt-entwickler-freelancer).
 *
 * Der PFAD bleibt in beiden Sprachen deutsch: es ist eine veröffentlichte,
 * verlinkte und indexierte Adresse aus dem alten Repo — ein übersetzter Slug
 * hätte einen zweiten Redirect-Fall erzeugt, ohne dass jemand danach sucht
 * („Nuxt Entwickler Freelancer" IST das gesuchte Keyword).
 */

export interface NuxtBenefit {
  title: Localized
  description: Localized
}

export interface NuxtService {
  title: Localized
  price: Localized
  description: Localized
  tags: string[]
}

export interface StackDetail {
  label: Localized
  value: Localized
}

export const NUXT_HERO = {
  breadcrumb: {
    de: 'Nuxt Entwickler Freelancer',
    en: 'Freelance Nuxt developer',
  } satisfies Localized,
  title: {
    de: 'Nuxt Entwickler Freelancer: Nuxt 4, Vue 3 & TypeScript',
    en: 'Freelance Nuxt developer: Nuxt 4, Vue 3 & TypeScript',
  } satisfies Localized,
  intro: {
    de: 'David Schubert ist Freelance Nuxt-Entwickler und Senior UI/UX Designer mit über 25 Jahren Web-Erfahrung. Er entwickelt SaaS-Frontends, Corporate Websites und Landingpages mit Nuxt 4, Vue 3, TypeScript und Tailwind CSS 4 – remote für Teams in Deutschland, Österreich und der Schweiz, zu festen Projektpreisen. Die Besonderheit: Design und Entwicklung kommen aus einer Hand.',
    en: 'David Schubert is a freelance Nuxt developer and senior UI/UX designer with more than 25 years of web experience. He builds SaaS frontends, corporate websites and landing pages with Nuxt 4, Vue 3, TypeScript and Tailwind CSS 4 — remote for teams in Germany, Austria and Switzerland, at fixed project prices. What makes it different: design and development come from the same pair of hands.',
  } satisfies Localized,
  ctaPrimary: {
    de: 'Kostenloses Erstgespräch (30 Min)',
    en: 'Book a free 30-minute intro call',
  } satisfies Localized,
  ctaSecondary: { de: 'Leistungen ansehen', en: 'See services' } satisfies Localized,
  note: {
    de: 'Diese Website ist selbst mit Nuxt 4 gebaut – Server-Side-Rendering, PageSpeed-optimiert.',
    en: 'This website is itself built with Nuxt 4 — server-side rendering, optimised for PageSpeed.',
  } satisfies Localized,
  audienceNote: {
    de: 'Diese Seite richtet sich an Digitalagenturen und Entwicklungsteams. Sie suchen Design, Konzept oder einen kompletten Webauftritt in verständlicher Sprache?',
    en: 'This page is aimed at digital agencies and development teams. Looking for design, concept or a complete web presence, explained without the jargon?',
  } satisfies Localized,
  audienceNoteLink: {
    de: 'Hier geht es zum Design-Portfolio',
    en: 'Head over to the design portfolio',
  } satisfies Localized,
}

export const NUXT_HERO_STACK = [
  'Nuxt 4',
  'Vue 3 (Composition API)',
  'TypeScript',
  'Tailwind CSS 4',
  'Nuxt UI',
  'Pinia',
  'Appwrite',
  'GSAP & Lenis',
]

export const NUXT_WHY_HEADING = {
  title: { de: 'Warum Nuxt für Ihr Projekt?', en: 'Why Nuxt for your project?' } satisfies Localized,
  lead: {
    de: 'Nuxt ist das führende Full-Stack-Framework für Vue: Server-Side-Rendering für SEO und schnelle Ladezeiten, automatisches Code-Splitting, eine ausgereifte Modul-Landschaft und TypeScript-Support ab Werk. Für Marketing-Websites bedeutet das bessere Rankings, für Web-Apps kürzere Entwicklungszeit.',
    en: 'Nuxt is the leading full-stack framework for Vue: server-side rendering for SEO and fast load times, automatic code splitting, a mature module ecosystem and TypeScript support out of the box. For marketing websites, that means better rankings; for web apps, shorter development time.',
  } satisfies Localized,
}

export const NUXT_BENEFITS: NuxtBenefit[] = [
  {
    title: { de: 'SEO & Performance', en: 'SEO & performance' },
    description: {
      de: 'Server-Side-Rendering und Prerendering liefern Suchmaschinen und KI-Crawlern vollständiges HTML – plus schnelle Ladezeiten (Core Web Vitals) für Nutzer und Rankings.',
      en: 'Server-side rendering and prerendering give search engines and AI crawlers complete HTML — plus fast load times (Core Web Vitals) for users and rankings.',
    },
  },
  {
    title: { de: 'Ein Framework für alles', en: 'One framework for everything' },
    description: {
      de: 'Marketing-Site, Web-App und API-Routen in einem Projekt: Nitro-Server, File-based Routing und automatisches Code-Splitting reduzieren Komplexität und Kosten.',
      en: 'Marketing site, web app and API routes in one project: the Nitro server, file-based routing and automatic code splitting reduce complexity and cost.',
    },
  },
  {
    title: { de: 'Zukunftssicher & wartbar', en: 'Future-proof & maintainable' },
    description: {
      de: 'TypeScript, klare Projektstruktur und das große Nuxt-Modul-Ökosystem (Image, i18n, Sitemap, Content) halten die Codebasis wartbar – auch für Ihr Team nach der Übergabe.',
      en: 'TypeScript, a clear project structure and the large Nuxt module ecosystem (Image, i18n, Sitemap, Content) keep the codebase maintainable — including for your team after handover.',
    },
  },
]

export const NUXT_SERVICES_HEADING = {
  title: { de: 'Nuxt-Entwicklung: Leistungen', en: 'Nuxt development: services' } satisfies Localized,
  lead: {
    de: 'Von der Landingpage bis zur Web-App mit Backend: Ich klassifiziere jedes Projekt als Erlebnis-Website, App oder Hybrid – daraus ergibt sich der passende technische Zuschnitt.',
    en: 'From the landing page to a web app with a backend: I classify every project as an experience website, an app or a hybrid — and that determines the right technical setup.',
  } satisfies Localized,
}

export const NUXT_SERVICES: NuxtService[] = [
  {
    title: {
      de: 'Marketing-Websites & Landingpages (Erlebnis)',
      en: 'Marketing websites & landing pages (experience)',
    },
    price: { de: 'ab €5.000', en: 'from €5,000' },
    description: {
      de: 'Conversion-starke Websites mit hochwertigen Scroll-Animationen (GSAP, Lenis), SSR/Prerendering für SEO, Core Web Vitals im grünen Bereich und CMS-Anbindung nach Bedarf.',
      en: 'High-converting websites with polished scroll animations (GSAP, Lenis), SSR/prerendering for SEO, Core Web Vitals passing across the board and a CMS integration where needed.',
    },
    tags: ['Nuxt 4', 'GSAP + Lenis', 'SEO/SSR', 'Tailwind CSS 4'],
  },
  {
    title: {
      de: 'SaaS-Frontends & Web-Apps (App)',
      en: 'SaaS frontends & web apps (app)',
    },
    price: { de: 'ab €25.000', en: 'from €25,000' },
    description: {
      de: 'Dashboards und Anwendungen mit Nuxt UI, Pinia und Appwrite als Backend (Auth, Datenbank, Storage, Realtime). Typsicher mit TypeScript und Zod-Validierung.',
      en: 'Dashboards and applications with Nuxt UI, Pinia and Appwrite as the backend (auth, database, storage, realtime). Type-safe with TypeScript and Zod validation.',
    },
    tags: ['Nuxt UI', 'Pinia', 'Appwrite', 'TypeScript', 'Zod'],
  },
  {
    title: {
      de: 'Hybrid-Projekte & Design Systems',
      en: 'Hybrid projects & design systems',
    },
    price: { de: 'Festpreis nach Umfang', en: 'Fixed price based on scope' },
    description: {
      de: 'Marketing-Site plus App-Bereich in einer Codebasis, gemeinsame Component Library mit Design Tokens – als Nuxt Layer wiederverwendbar über mehrere Projekte.',
      en: 'A marketing site plus an app section in one codebase, with a shared component library and design tokens — reusable across projects as a Nuxt layer.',
    },
    tags: ['Nuxt Layers', 'Design Tokens', 'Monorepo (pnpm)', 'i18n'],
  },
  {
    title: {
      de: 'Audits, Rescues & Migrationen',
      en: 'Audits, rescues & migrations',
    },
    price: { de: 'ab €2.500', en: 'from €2,500' },
    description: {
      de: 'Performance-Audits bestehender Nuxt/Vue-Projekte, Übernahme festgefahrener Projekte oder Migration auf Nuxt 4 – inklusive Composition-API- und TypeScript-Umstellung.',
      en: 'Performance audits of existing Nuxt/Vue projects, taking over stalled projects or migrating to Nuxt 4 — including the move to the Composition API and TypeScript.',
    },
    tags: ['Nuxt 2/3 → 4', 'Performance', 'Refactoring'],
  },
]

export const NUXT_STACK_HEADING = {
  title: { de: 'Mein Nuxt-Stack im Detail', en: 'My Nuxt stack in detail' } satisfies Localized,
  lead: {
    de: 'Ein bewusst schlanker, moderner Stack – konsequent TypeScript, Composition API und CSS-first. Keine Legacy-Patterns, keine Options API.',
    en: 'A deliberately lean, modern stack — TypeScript throughout, Composition API and CSS-first. No legacy patterns, no Options API.',
  } satisfies Localized,
  note: {
    de: 'Als Senior UI/UX Designer entwerfe ich die Interfaces, die ich entwickle – Sie brauchen keine Übergabe zwischen Designer und Entwickler. Das spart Abstimmung, Zeit und Budget.',
    en: 'As a senior UI/UX designer I design the interfaces I build — there is no design handoff between designer and developer. That cuts coordination overhead and saves time and budget.',
  } satisfies Localized,
  noteLabel: { de: 'Design + Code:', en: 'Design + code:' } satisfies Localized,
}

export const NUXT_STACK_DETAIL: StackDetail[] = [
  {
    label: { de: 'Framework', en: 'Framework' },
    value: {
      de: 'Nuxt 4 mit Vue 3, ausschließlich Composition API (script setup mit TypeScript) – keine Options API, kein Legacy-Code.',
      en: 'Nuxt 4 with Vue 3, Composition API only (script setup with TypeScript) — no Options API, no legacy code.',
    },
  },
  {
    label: { de: 'UI & Styling', en: 'UI & styling' },
    value: {
      de: 'Nuxt UI und Tailwind CSS 4 (CSS-first mit @theme-Tokens) – konsistente Design Systems, Dark Mode inklusive.',
      en: 'Nuxt UI and Tailwind CSS 4 (CSS-first with @theme tokens) — consistent design systems, dark mode included.',
    },
  },
  {
    label: { de: 'State & Daten', en: 'State & data' },
    value: {
      de: 'Pinia für State-Management, Pinia Colada für die Daten-Schicht, Zod/Valibot für Validierung an jeder Systemgrenze.',
      en: 'Pinia for state management, Pinia Colada for the data layer, Zod/Valibot for validation at every system boundary.',
    },
  },
  {
    label: { de: 'Backend', en: 'Backend' },
    value: {
      de: 'Appwrite (Auth, Datenbank, Storage, Realtime, Functions) als Backend-as-a-Service – oder Anbindung an Ihre bestehende API.',
      en: 'Appwrite (auth, database, storage, realtime, functions) as the backend-as-a-service layer — or integration with your existing API.',
    },
  },
  {
    label: { de: 'Animation', en: 'Animation' },
    value: {
      de: 'GSAP (ScrollTrigger, SplitText, Flip) und Lenis Smooth Scroll für hochwertige, performante Erlebnis-Websites.',
      en: 'GSAP (ScrollTrigger, SplitText, Flip) and Lenis smooth scroll for polished, performant experience websites.',
    },
  },
  {
    label: { de: 'Qualität & Deployment', en: 'Quality & deployment' },
    value: {
      de: 'TypeScript strict (kein any), WCAG 2.1 AA, Core Web Vitals als Abnahmekriterium. Deployment auf Hetzner (PM2, Nginx) oder Ihrer Infrastruktur.',
      en: 'TypeScript strict (no any), WCAG 2.1 AA, Core Web Vitals as an acceptance criterion. Deployment on Hetzner (PM2, Nginx) or your own infrastructure.',
    },
  },
]

export const NUXT_FAQ_HEADING: Localized = {
  de: 'Häufige Fragen zur Nuxt-Entwicklung',
  en: 'Frequently asked questions about Nuxt development',
}

export const NUXT_FAQS: LocalizedFaq[] = [
  {
    question: {
      de: 'Was kostet ein Nuxt-Entwickler als Freelancer?',
      en: 'What does a freelance Nuxt developer cost?',
    },
    answer: {
      de: 'Ich arbeite mit festen Projektpreisen statt Stundensätzen: Landingpages ab €5.000, Corporate Websites €15.000–35.000, SaaS-Frontends ab €25.000, Audits und Migrationen ab €2.500. Sie erhalten nach dem kostenlosen Erstgespräch innerhalb von 48 Stunden ein Festpreis-Angebot mit definiertem Umfang.',
      en: 'I work with fixed project prices instead of hourly rates: landing pages from €5,000, corporate websites €15,000–35,000, SaaS frontends from €25,000, audits and migrations from €2,500. After the free intro call you get a fixed-price quote with a defined scope within 48 hours.',
    },
  },
  {
    question: {
      de: 'Nuxt oder Next.js – was ist besser?',
      en: 'Nuxt or Next.js — which is better?',
    },
    answer: {
      de: 'Beide sind ausgereifte Full-Stack-Frameworks. Nuxt (Vue) punktet mit einfacherer Lernkurve, sehr guter Developer Experience und schlankem Code; Next.js (React) mit dem größeren Ökosystem. Wenn Ihr Team bereits Vue kennt oder das Projekt neu startet, ist Nuxt meist die effizientere Wahl. Entscheidend ist saubere Umsetzung – nicht das Framework-Logo.',
      en: 'Both are mature full-stack frameworks. Nuxt (Vue) wins on a gentler learning curve, very good developer experience and lean code; Next.js (React) on the larger ecosystem. If your team already knows Vue or the project is starting fresh, Nuxt is usually the more efficient choice. What matters is clean execution — not the logo on the framework.',
    },
  },
  {
    question: {
      de: 'Übernehmen Sie bestehende Nuxt- oder Vue-Projekte?',
      en: 'Do you take over existing Nuxt or Vue projects?',
    },
    answer: {
      de: 'Ja. Ich übernehme bestehende Codebasen, führe zunächst ein technisches Audit durch (Struktur, Performance, Abhängigkeiten) und mache dann ein Festpreis-Angebot für Weiterentwicklung, Refactoring oder Migration auf Nuxt 4.',
      en: 'Yes. I take over existing codebases, start with a technical audit (structure, performance, dependencies) and then quote a fixed price for further development, refactoring or migration to Nuxt 4.',
    },
  },
  {
    question: { de: 'Machen Sie auch das Design?', en: 'Do you do the design as well?' },
    answer: {
      de: 'Ja – das ist mein Alleinstellungsmerkmal: Als Senior UI/UX Designer und Entwickler liefere ich Design und Umsetzung aus einer Hand. Kein Reibungsverlust zwischen Figma und Code, keine doppelten Abstimmungsschleifen. Auf Wunsch arbeite ich auch mit Ihrem bestehenden Design-Team und setze deren Figma-Designs um.',
      en: 'Yes — that is what sets me apart: as a senior UI/UX designer and developer I deliver design and implementation from the same pair of hands. No friction between Figma and code, no duplicated review loops. On request I also work with your existing design team and implement their Figma designs.',
    },
  },
  {
    question: {
      de: 'Arbeiten Sie auch im Team mit unseren Entwicklern?',
      en: 'Do you also work inside our development team?',
    },
    answer: {
      de: 'Ja. Ich integriere mich in bestehende Teams (Git-Workflow, Code-Reviews, Slack/Linear) oder arbeite eigenständig mit regelmäßigen Reviews. Die Zusammenarbeit läuft remote und asynchron dokumentiert – Video-Calls lege ich auf den DACH-Abend.',
      en: 'Yes. I integrate into existing teams (Git workflow, code reviews, Slack/Linear) or work independently with regular reviews. Collaboration is remote and documented asynchronously — I schedule video calls for the CET evening.',
    },
  },
  {
    question: {
      de: 'Migrieren Sie Nuxt-2- oder Nuxt-3-Projekte auf Nuxt 4?',
      en: 'Do you migrate Nuxt 2 or Nuxt 3 projects to Nuxt 4?',
    },
    answer: {
      de: 'Ja. Der Ablauf: technisches Audit der bestehenden App, Migrationsplan mit Aufwandsschätzung, dann schrittweise Migration (Composition API, TypeScript, neue Verzeichnisstruktur) mit laufenden Tests. Festpreis nach Audit – ab €2.500 für kleinere Apps.',
      en: 'Yes. The process: a technical audit of the existing app, a migration plan with an effort estimate, then a step-by-step migration (Composition API, TypeScript, new directory structure) with tests along the way. Fixed price after the audit — from €2,500 for smaller apps.',
    },
  },
]

export const NUXT_CTA = {
  title: { de: 'Nuxt-Projekt besprechen', en: 'Discuss your Nuxt project' } satisfies Localized,
  text: {
    de: 'Ob neue Website, SaaS-Frontend oder Migration auf Nuxt 4: Buchen Sie ein kostenloses Erstgespräch – Sie erhalten innerhalb von 48 Stunden ein Festpreis-Angebot.',
    en: 'Whether it is a new website, a SaaS frontend or a migration to Nuxt 4: book a free intro call — you get a fixed-price quote within 48 hours.',
  } satisfies Localized,
}

export const NUXT_META = {
  title: {
    de: 'Nuxt Entwickler Freelancer – Nuxt 4, Vue 3, TypeScript | David Schubert',
    en: 'Freelance Nuxt developer — Nuxt 4, Vue 3, TypeScript | David Schubert',
  } satisfies Localized,
  description: {
    de: 'Freelance Nuxt-Entwickler für DACH: SaaS-Frontends, Corporate Websites & Landingpages mit Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4 und Appwrite. Design + Code aus einer Hand, Festpreise.',
    en: 'Freelance Nuxt developer for the DACH region: SaaS frontends, corporate websites & landing pages with Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4 and Appwrite. Design + code from the same pair of hands, fixed prices.',
  } satisfies Localized,
  serviceName: {
    de: 'Nuxt-Entwicklung (Freelance)',
    en: 'Nuxt development (freelance)',
  } satisfies Localized,
  serviceType: {
    de: 'Webentwicklung mit Nuxt und Vue',
    en: 'Web development with Nuxt and Vue',
  } satisfies Localized,
  serviceDescription: {
    de: 'Entwicklung von Marketing-Websites, SaaS-Frontends und Web-Apps mit Nuxt 4, Vue 3, TypeScript und Appwrite – remote für die DACH-Region, zu Festpreisen.',
    en: 'Development of marketing websites, SaaS frontends and web apps with Nuxt 4, Vue 3, TypeScript and Appwrite — remote for the DACH region, at fixed prices.',
  } satisfies Localized,
}
