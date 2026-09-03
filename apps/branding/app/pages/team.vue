<script setup lang="ts">
import { BRAND_ADVISORS } from '../../../../packages/brand/shared/brandAdvisors'

/**
 * DIE TEAM-SEITE — der abgenommene Klickdummy (Runde 163, David) als echte
 * Seite. Sie lag bis 2026-09-01 NUR im Playground; der „About"-Link der
 * BwSiteNav zeigte live ins Leere (404).
 *
 * ── WARUM IN DER APP, NICHT IM LAYER ──────────────────────────────────────
 * Wie die Startseite (s. index.vue-Kopf): der brand-Layer ist host-agnostisch,
 * die Selbstdarstellung gehört der Marke DIESER Domain.
 *
 * ── EIN PROFESSIONELLES TEAM (Davids Entscheidung 2026-09-02) ─────────────
 * Der Dummy der Runde 163 spielte in einer HUNDE-WELT (Rassen, tierische
 * Nachnamen, Wohnort-und-Hobby-Zeilen). Die ist komplett verworfen — siehe
 * DECISION-LOG 2026-09-02. Hier stehen Beraterinnen und Berater: die
 * `personal`-Zeile sagt, WIE jemand arbeitet, nicht wo er wohnt, und die
 * Nachnamen sind gewöhnliche Namen. Wer hier eine verspielte Zeile ergänzt,
 * holt genau das zurück, was David verworfen hat.
 *
 * ── ZWEI TEAM-EBENEN ──────────────────────────────────────────────────────
 * Das PRODUKT-Team (sieben Rollen, je Produkt eine) lebt ganz hier; Georges
 * Steckbrief ist angepasst, weil Naming seit dem Beraterteam (2026-09-01)
 * Otto gehört. Die WIZARD-CREW (Vera, Milo, Nika, Otto) kommt aus
 * `brandAdvisors.ts` — Namen und Rollen IMPORTIERT, damit eine Umbenennung in
 * der Registry hier automatisch ankommt; nur die Schau-Texte (desc/asks und
 * die englische personal-Zeile) leben hier, weil die Registry Prompt-Material
 * trägt, keine Marketing-Copy.
 *
 * ── SPRACHE ───────────────────────────────────────────────────────────────
 * Der Dummy ist bewusst fest deutsch; live ist die Site de+en. Die Inhalte
 * liegen deshalb je Sprache in EINER Konstante (Browser-Auflösung nach dem
 * categoryI18n-Muster), nicht in den i18n-Katalogen — 11 Steckbriefe mit
 * Listen wären dort Pflege-Wildwuchs.
 */

const { locale, t } = useI18n()
const localePath = useLocalePath()

useHead({ title: computed(() => t('team.title')) })

type L = 'de' | 'en'
const lang = computed<L>(() => (locale.value === 'de' ? 'de' : 'en'))

interface Member {
  initials: string
  name: string
  title: Record<L, string>
  desc: Record<L, string>
  will: Record<L, string[]>
  because: Record<L, string[]>
  skills: Record<L, string[]>
  personal: Record<L, string>
  pronoun: Record<L, string>
}

const productTeam: Member[] = [
  {
    initials: 'GW', name: 'George Winter',
    title: { de: 'Markenberater · Brand Wizard', en: 'Brand advisor · Brand Wizard' },
    desc: {
      de: 'Führt euch durch Foundation und Language — den roten Faden gibt er nie aus der Hand. Was Gestaltung ist, gehört Frida; bei Namen übernimmt Otto.',
      en: 'Guides you through Foundation and Language — he never lets go of the thread. Design belongs to Frida; when it comes to names, Otto takes over.',
    },
    will: {
      de: ['die Fragen stellen, die eine gute Agentur stellt', 'jede Empfehlung strategisch begründen', 'Foundation und Language mit euch festhalten'],
      en: ['ask the questions a good agency would ask', 'back every recommendation with strategy', 'pin down Foundation and Language with you'],
    },
    because: {
      de: ['er lieber nachfragt als rät', 'er Entscheidungen erklärt, statt sie zu verkünden'],
      en: ['he would rather ask than guess', 'he explains decisions instead of announcing them'],
    },
    skills: { de: ['Markenstrategie', 'Interview-Führung', 'Purpose & Werte', 'Roter Faden'], en: ['Brand strategy', 'Interviewing', 'Purpose & values', 'The thread'] },
    personal: {
      de: 'Markenberater und Markenstratege — jede Empfehlung mit Begründung, jede Entscheidung festgehalten.',
      en: 'Brand advisor and brand strategist — every recommendation with a reason, every decision written down.',
    },
    pronoun: { de: 'er', en: 'he' },
  },
  {
    initials: 'FM', name: 'Frida Martens',
    title: { de: 'Design Directorin · Brand Design', en: 'Design director · Brand Design' },
    desc: {
      de: 'Macht aus eurer Foundation eine Gestalt. Strategie-Fragen reicht sie an George zurück.',
      en: 'Turns your foundation into form. Strategy questions go straight back to George.',
    },
    will: {
      de: ['eure Foundation in Visual DNA übersetzen', 'drei Moodboard-Richtungen ableiten', 'mit euch verfeinern, bis es sitzt'],
      en: ['translate your foundation into visual DNA', 'derive three moodboard directions', 'refine with you until it fits'],
    },
    because: {
      de: ['sie Strategie in Bilder übersetzen kann', 'sie Geschmack immer mit Begründung liefert'],
      en: ['she can translate strategy into imagery', 'she always ships taste with reasons'],
    },
    skills: { de: ['Visual DNA', 'Moodboards', 'Farbwelten', 'Typografie'], en: ['Visual DNA', 'Moodboards', 'Color worlds', 'Typography'] },
    personal: {
      de: 'Design Directorin — übersetzt Strategie in Gestalt und begründet jede Entscheidung am Fundament.',
      en: 'Design director — turns strategy into form and justifies every decision against the foundation.',
    },
    pronoun: { de: 'sie', en: 'she' },
  },
  {
    initials: 'RW', name: 'Rex Weber',
    title: { de: 'Produktioner · Brand Book & Kit', en: 'Producer · Brand Book & Kit' },
    desc: {
      de: 'Macht das Entschiedene versandfertig — er erfindet nichts Neues.',
      en: 'Gets what you decided ready to ship — he never invents anything new.',
    },
    will: {
      de: ['Book, Tokens, brand.json und Pressekit produzieren', 'das Strategy Playbook versandfertig machen', 'Konsistenz bis ins letzte Kapitel prüfen'],
      en: ['produce book, tokens, brand.json and press kit', 'get the strategy playbook ready to ship', 'check consistency down to the last chapter'],
    },
    because: {
      de: ['ihm kein Detail durchrutscht', 'er Beschlossenes nie eigenmächtig ändert'],
      en: ['no detail slips past him', 'he never changes a decision on his own'],
    },
    skills: { de: ['Brand Books', 'Design-Tokens', 'brand.json', 'Pressekits'], en: ['Brand books', 'Design tokens', 'brand.json', 'Press kits'] },
    personal: {
      de: 'Produktioner — bringt Beschlossenes in Produktion, ohne unterwegs etwas Neues zu erfinden.',
      en: 'Producer — takes decisions into production without inventing anything new along the way.',
    },
    pronoun: { de: 'er', en: 'he' },
  },
  {
    initials: 'KH', name: 'Kira Hoffmann',
    title: { de: 'Content-Strategin · Brand Experience', en: 'Content strategist · Brand Experience' },
    desc: {
      de: 'Bringt die Marke in die Welt — immer entlang des 90-Tage-Plans. Bewertet nicht, was Ada gehört.',
      en: 'Takes the brand out into the world — always along the 90-day plan. Never grades what belongs to Ada.',
    },
    will: {
      de: ['den Content-Kompass in Wochenpläne übersetzen', 'Templates und Quick Wins bereitstellen', 'den Launch begleiten — intern zuerst'],
      en: ['translate the content compass into weekly plans', 'provide templates and quick wins', 'accompany the launch — internal first'],
    },
    because: {
      de: ['sie Pläne liefert statt Ideen zu sammeln', 'sie weiß, was jeder Kanal wirklich braucht'],
      en: ['she delivers plans instead of collecting ideas', 'she knows what each channel really needs'],
    },
    skills: { de: ['Content-Säulen', 'SEO & GEO', 'Launch-Pläne', 'Templates'], en: ['Content pillars', 'SEO & GEO', 'Launch plans', 'Templates'] },
    personal: {
      de: 'Content-Strategin — plant in Wochen statt in Ideen und schreibt für jeden Kanal, was er wirklich braucht.',
      en: 'Content strategist — plans in weeks instead of ideas and writes what each channel actually needs.',
    },
    pronoun: { de: 'sie', en: 'she' },
  },
  {
    initials: 'WN', name: 'Wanda Nowak',
    title: { de: 'Monitoring-Analystin · Brand Monitoring', en: 'Monitoring analyst · Brand Monitoring' },
    desc: {
      de: 'Der Blick von außen, jede Woche. Meldet sich nur, wenn es etwas zu melden gibt.',
      en: 'The outside view, every week. Speaks up only when there is something to report.',
    },
    will: {
      de: ['euer Außenbild wöchentlich prüfen', 'KI-Antworten über eure Marke beobachten', 'Wettbewerber-Bewegungen und Chancen melden'],
      en: ['check your outside image weekly', 'watch what AI answers say about your brand', 'report competitor moves and openings'],
    },
    because: {
      de: ['sie Veränderungen zuerst sieht', 'sie Ruhe von Alarm unterscheiden kann'],
      en: ['she sees change first', 'she can tell calm from alarm'],
    },
    skills: { de: ['Außenbild-Checks', 'KI-Antwort-Radar', 'Alerts', 'Trend-Signale'], en: ['Outside-image checks', 'AI answer radar', 'Alerts', 'Trend signals'] },
    personal: {
      de: 'Monitoring-Analystin — beobachtet das Außenbild wöchentlich und meldet erst, wenn eine Veränderung belegt ist.',
      en: 'Monitoring analyst — watches the outside image weekly and reports only once a change is backed by evidence.',
    },
    pronoun: { de: 'sie', en: 'she' },
  },
  {
    initials: 'AS', name: 'Ada Sander',
    title: { de: 'Score-Prüferin · Brand Score', en: 'Score examiner · Brand Score' },
    desc: {
      de: 'Rechnet den Brand Score — unbestechlich, auch bei unseren eigenen Marken.',
      en: 'Calculates the Brand Score — incorruptible, even for our own brands.',
    },
    will: {
      de: ['die 40 Prüfkriterien reproduzierbar rechnen', 'jede Wertung begründen', 'auch unsere eigenen Marken streng bewerten'],
      en: ['compute the 40 criteria reproducibly', 'justify every score', 'grade our own brands just as hard'],
    },
    because: {
      de: ['sie Zahlen nie fühlt, sondern rechnet', 'sie sich von niemandem beeindrucken lässt'],
      en: ['she never feels numbers, she computes them', 'nobody impresses her'],
    },
    skills: { de: ['Prüfkriterien', 'Reproduzierbarkeit', 'Begründungen', 'Bänder'], en: ['Criteria', 'Reproducibility', 'Justifications', 'Bands'] },
    personal: {
      de: 'Score-Prüferin — rechnet nachvollziehbar und begründet jede Wertung, auch bei unseren eigenen Marken.',
      en: 'Score examiner — computes reproducibly and justifies every score, including for our own brands.',
    },
    pronoun: { de: 'sie', en: 'she' },
  },
  {
    initials: 'SK', name: 'Scout Krüger',
    title: { de: 'Research-Analyst · Brand Benchmark', en: 'Research analyst · Brand Benchmark' },
    desc: {
      de: 'Findet Wettbewerber und Vorbilder — Schlüsse zieht ihr mit George.',
      en: 'Finds competitors and role models — the conclusions you draw with George.',
    },
    will: {
      de: ['Wettbewerber und Vorbilder aufspüren', 'sie ins selbe Raster legen', 'jede Aussage mit Quellen belegen'],
      en: ['track down competitors and role models', 'put them into the same grid', 'back every claim with sources'],
    },
    because: {
      de: ['er keine Spur verliert', 'er sammelt, statt zu urteilen'],
      en: ['he never loses a trail', 'he collects instead of judging'],
    },
    skills: { de: ['Wettbewerbs-Research', 'Benchmarks', 'Quellen-Belege', 'Markt-Raster'], en: ['Competitor research', 'Benchmarks', 'Source receipts', 'Market grids'] },
    personal: {
      de: 'Research-Analyst — belegt jeden Fund mit Quellen und überlässt die Schlüsse dem Gespräch.',
      en: 'Research analyst — backs every finding with sources and leaves the conclusions to the conversation.',
    },
    pronoun: { de: 'er', en: 'he' },
  },
]

/**
 * DIE WIZARD-CREW — Namen/Rollen aus der Registry (Umbenennung dort kommt hier
 * automatisch an), Schau-Texte hier. George führt; diese vier übernehmen je
 * Phase. Die Registry-Felder strengths/technique sind Prompt-Material und
 * BEWUSST nicht die Anzeige.
 */
const crewCopy: Record<string, { desc: Record<L, string>, asks: Record<L, string>, personalEn: string }> = {
  vera: {
    desc: {
      de: 'Die Strategin. Übernimmt bei Purpose, Vision, Mission und Positionierung — und fragt „warum", bis es trägt. Beliebigkeit überlebt sie nicht.',
      en: 'The strategist. Takes over for purpose, vision, mission and positioning — and asks "why" until it holds. Vagueness does not survive her.',
    },
    asks: { de: '„Das könnte jeder sagen. Was könnt nur ihr sagen?"', en: '"Anyone could say that. What can only you say?"' },
    personalEn: 'Strategist — holds every sentence against the competition and lets no interchangeable position stand.',
  },
  milo: {
    desc: {
      de: 'Der Tiefenpsychologe für Werte und Archetyp. Arbeitet mit Momenten statt Adjektiven und destilliert Werte aus euren Geschichten.',
      en: 'The depth psychologist for values and archetype. Works with moments instead of adjectives and distills values from your stories.',
    },
    asks: { de: '„Erzähl mir von einem Tag, an dem ihr stolz wart."', en: '"Tell me about a day you were proud."' },
    personalEn: 'Values advisor — listens longer than is comfortable and derives values from stories, never from lists.',
  },
  nika: {
    desc: {
      de: 'Die Wortmenschin für Manifest und verbale Identität. Testet jeden Satz am Ohr und jagt Floskeln, bevor sie ins Dokument kommen.',
      en: 'The word person for manifesto and verbal identity. Tests every sentence by ear and hunts down filler before it reaches the document.',
    },
    asks: { de: '„Lies das laut. Klingt das nach euch?"', en: '"Read that out loud. Does it sound like you?"' },
    personalEn: 'Language advisor — reads every line out loud before it stays, and cuts whatever sounds like advertising.',
  },
  otto: {
    desc: {
      de: 'Der Nüchterne fürs Naming. Dämpft Verliebtheit in Namen und führt durch die Prüfungen — ein Name muss erst überleben, dann gefallen.',
      en: 'The sober one for naming. Tempers name infatuation and leads you through the checks — a name has to survive first, please second.',
    },
    asks: { de: '„Schöner Name. Gehört er dir auch?"', en: '"Lovely name. Do you actually own it?"' },
    personalEn: 'Naming advisor — checks pronunciation, spelling and availability before a name is allowed to charm.',
  },
}
const crew = BRAND_ADVISORS.filter(a => a.key !== 'george').map(a => ({
  advisor: a,
  copy: crewCopy[a.key] ?? { desc: { de: '', en: '' }, asks: { de: '', en: '' }, personalEn: a.personal },
}))
</script>

<template>
  <div class="bw-root min-h-dvh px-6 pb-10">
    <BwSiteNav />
    <div class="@container mx-auto max-w-7xl">
      <!-- Wer wir sind: der Selbstbeweis (Dummy-Wortlaut, Runde 163) -->
      <div class="mx-auto mt-14 max-w-3xl text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('team.eyebrow') }}</p>
        <h1 class="mt-4 text-balance text-5xl font-extralight leading-tight tracking-tight">{{ t('team.title') }}</h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('team.intro1') }}</p>
        <p class="mx-auto mt-4 max-w-2xl text-lg leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('team.intro2') }}</p>
        <p class="bw-label mx-auto mt-6 max-w-2xl leading-relaxed" style="color: var(--bw-muted)">{{ t('team.fingerprint') }}</p>
      </div>

      <!-- Das Produkt-Team -->
      <div class="mx-auto mt-24 max-w-3xl text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('team.teamEyebrow') }}</p>
        <h2 class="mt-3 text-balance text-3xl font-extralight tracking-tight">{{ t('team.teamTitle') }}</h2>
        <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('team.teamIntro') }}</p>
      </div>

      <div class="mt-10 grid gap-x-6 gap-y-6 @sm:grid-cols-2 @md:grid-cols-3">
        <div v-for="m in productTeam" :key="m.name" class="bw-card flex flex-col p-8">
          <div class="flex items-center gap-4">
            <!-- Alle Karten tragen dasselbe Monogramm: Georges Sonderfall
                 (BwGeorgeAvatar mit Foto) ist mit der Hunde-Welt gefallen
                 (2026-09-02), und ein einzelnes „G" neben lauter „FM"/„RW"
                 wäre nur noch ein Rest. Porträts kämen für ALLE oder gar nicht. -->
            <UAvatar :text="m.initials" size="xl" />
            <div class="min-w-0">
              <h3 class="truncate text-lg font-medium tracking-tight">{{ m.name }}</h3>
              <p class="bw-label mt-0.5" style="color: var(--bw-muted)">{{ m.title[lang] }}</p>
            </div>
          </div>
          <p class="mt-4 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ m.desc[lang] }}</p>
          <p class="bw-label mt-4" style="color: var(--bw-muted)">{{ t('team.willLabel', { pronoun: m.pronoun[lang] }) }}</p>
          <ul class="mt-1.5 space-y-1">
            <li v-for="w in m.will[lang]" :key="w" class="flex gap-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)"><span class="flex-none" style="color: var(--bw-line-strong)">—</span>{{ w }}</li>
          </ul>
          <p class="bw-label mt-3" style="color: var(--bw-muted)">{{ t('team.becauseLabel') }}</p>
          <ul class="mt-1.5 flex-1 space-y-1">
            <li v-for="b in m.because[lang]" :key="b" class="flex gap-2 text-sm leading-relaxed" style="color: var(--bw-ink-soft)"><span class="flex-none" style="color: var(--bw-line-strong)">—</span>{{ b }}</li>
          </ul>
          <div class="mt-4 flex flex-wrap gap-1.5">
            <span v-for="s in m.skills[lang]" :key="s" class="bw-label rounded-full px-2.5 py-1" style="background: var(--bw-surface-hi)">{{ s }}</span>
          </div>
          <p class="bw-label mt-4 leading-relaxed" style="color: var(--bw-muted)">{{ m.personal[lang] }}</p>
        </div>
      </div>

      <!-- Die Wizard-Crew: Georges Phasen-Spezialisten (Beraterteam, 2026-09-01) -->
      <div class="mx-auto mt-24 max-w-3xl text-center">
        <p class="bw-label uppercase tracking-widest" style="color: var(--bw-muted)">{{ t('team.crewEyebrow') }}</p>
        <h2 class="mt-3 text-balance text-3xl font-extralight tracking-tight">{{ t('team.crewTitle') }}</h2>
        <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ t('team.crewIntro') }}</p>
      </div>

      <div class="mt-10 grid gap-x-6 gap-y-6 @sm:grid-cols-2 @lg:grid-cols-4">
        <div v-for="{ advisor, copy } in crew" :key="advisor.key" class="bw-card flex flex-col p-8">
          <div class="flex items-center gap-4">
            <UAvatar :text="advisor.name.slice(0, 1)" size="xl" />
            <div class="min-w-0">
              <h3 class="truncate text-lg font-medium tracking-tight">{{ advisor.fullName }}</h3>
              <p class="bw-label mt-0.5" style="color: var(--bw-muted)">{{ lang === 'de' ? advisor.role.de : advisor.role.en }}</p>
            </div>
          </div>
          <p class="mt-4 flex-1 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">{{ copy.desc[lang] }}</p>
          <p class="bw-label mt-4" style="color: var(--bw-muted)">{{ t('team.crewAsksLabel') }}</p>
          <p class="mt-1.5 text-sm italic leading-relaxed" style="color: var(--bw-ink-soft)">{{ copy.asks[lang] }}</p>
          <p class="bw-label mt-4 leading-relaxed" style="color: var(--bw-muted)">{{ lang === 'de' ? advisor.personal : copy.personalEn }}</p>
        </div>
      </div>

      <div class="bw-card mt-16 flex flex-wrap items-center justify-between gap-4 p-8">
        <p class="text-sm" style="color: var(--bw-ink-soft)">{{ t('team.ctaText') }}</p>
        <UButton :label="t('team.ctaButton')" :to="localePath('/invite')" class="rounded-full" />
      </div>

      <BwSiteFooter />
    </div>
  </div>
</template>
