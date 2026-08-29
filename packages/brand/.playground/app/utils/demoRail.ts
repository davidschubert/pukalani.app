import type { BwRailLayer } from '../../../app/components/BwProgressRail.vue'

/** Statische Dummy-Daten (P0b): die fünf Schichten, Baustein C aktiv.
 *  Runde 45 (David): JEDER Schritt trägt sein Info-Paket für den
 *  Erklär-Layer — Bedeutung im Markenkosmos + Entscheidungen mit Erklärung. */
export const demoRail: BwRailLayer[] = [
  {
    id: 'foundation',
    label: 'Brand Foundation',
    steps: [
      {
        id: 'context',
        label: 'Kontext',
        icon: 'i-ph-globe-simple',
        state: 'done',
        info: {
          description: 'Der Kontext ist der Boden, auf dem alles steht: Wer ihr seid, was ihr anbietet, für wen — und in welchem Markt ihr euch bewegt. Jede spätere Empfehlung von George stützt sich auf diese Fakten; ohne sauberen Kontext wären Werte, Archetyp und Tagline geraten statt hergeleitet.',
          minutes: '~6 Min',
          bausteine: [
            { label: 'Steckbrief', note: 'Wer ihr seid, seit wann, in welcher Form — die nackten Fakten.', done: true },
            { label: 'Angebot', note: 'Was ihr verkauft und was es besonders macht.', done: true },
            { label: 'Zielgruppe', note: 'Für wen ihr da seid — und für wen bewusst nicht.', done: true },
            { label: 'Marktumfeld', note: 'Wettbewerber und wie sie auftreten — die Lücke, in die ihr stoßt.', done: true },
          ],
        },
      },
      {
        id: 'pvm',
        label: 'Purpose · Vision · Mission',
        icon: 'i-ph-target',
        state: 'done',
        info: {
          description: 'Der Kompass der Marke: Der Purpose sagt, warum es euch gibt. Die Vision, wohin ihr wollt. Die Mission, wie ihr dorthin kommt. Zusammen sind sie die Messlatte für jede Entscheidung — von der Preisliste bis zum Instagram-Post.',
          minutes: '~10 Min',
          bausteine: [
            { label: 'Purpose-Satz', note: 'Ein Satz, warum es euch gibt — ohne Produkt, ohne Floskel.', done: true },
            { label: 'Warum es euch gibt', note: 'Die Geschichte hinter dem Satz, in euren Worten.', done: true },
            { label: 'Vision', note: 'Das Zielbild in 5–10 Jahren — wie sieht die Welt aus, wenn es klappt?', done: true },
            { label: 'Mission', note: 'Was ihr konkret tut, um dorthin zu kommen.', done: true },
          ],
        },
      },
      {
        id: 'values',
        label: 'Werte',
        icon: 'i-ph-scales',
        state: 'active',
        slots: '2 von 5 Entscheidungen',
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
      {
        id: 'archetype',
        label: 'Archetyp & Stimme',
        icon: 'i-ph-mask-happy',
        state: 'open',
        info: {
          description: 'Der Archetyp gibt eurer Marke einen wiedererkennbaren Charakter — ein Muster, das Menschen intuitiv verstehen (der Weise, der Entdecker, der Fürsorgliche …). Daraus leitet sich die Stimme ab: wie ihr klingt, worüber ihr sprecht und worüber nie. So schreibt jeder im Team, als schriebe dieselbe Person.',
          minutes: '~6 Min',
          bausteine: [
            { label: 'Archetyp-Profil', note: 'Euer Hauptmuster mit Anteilen — hergeleitet aus Kontext und Werten.' },
            { label: 'Tonalität', note: 'Drei Adjektive und ihre Grenzen: warm, aber nie anbiedernd.' },
            { label: 'Stimm-Beispiele', note: 'Derselbe Satz in eurer Stimme und in der falschen — zum Fühlen.' },
            { label: 'Do & Don’t der Sprache', note: 'Wörter, die ihr benutzt — und die, die euch fremd sind.' },
          ],
        },
      },
      {
        id: 'manifesto',
        label: 'Manifest',
        icon: 'i-ph-scroll',
        state: 'open',
        info: {
          description: 'Das Manifest verdichtet die ganze Foundation in einen Text mit Haltung — das Stück, das man laut vorlesen kann: auf der Website, im Pitch, beim Onboarding neuer Leute. Es entsteht aus Purpose, Werten und Stimme, nicht umgekehrt.',
          minutes: '~4 Min',
          bausteine: [
            { label: 'Manifest-Text', note: 'Georges Entwurf aus allem, was ihr geklärt habt — von euch geschärft.' },
            { label: 'Kernsätze', note: 'Zwei, drei Zeilen daraus, die allein stehen können — zitierfähig.' },
          ],
        },
      },
      { id: 'foundation-result', kind: 'result', label: 'Ergebnis', icon: '', state: 'open', to: '/brand/demo/ergebnis' },
    ],
  },
  {
    id: 'verbal',
    label: 'Brand Language',
    steps: [
      {
        id: 'messaging',
        label: 'Tagline & Messaging',
        icon: 'i-ph-chat-circle-text',
        state: 'open',
        info: {
          description: 'Die Tagline ist der eine Satz neben eurem Namen; das Messaging sind die Kernbotschaften dahinter — was ihr wem sagt, damit es hängen bleibt. Beides baut auf der Foundation auf: Ohne geklärte Werte klingt jede Tagline beliebig.',
          minutes: '~7 Min',
          bausteine: [
            { label: 'Tagline-Kandidaten', note: 'Mehrere Richtungen aus eurer Stimme — mit Herleitung, nicht aus dem Hut.' },
            { label: 'Kernbotschaften', note: 'Je Zielgruppe die eine Sache, die ankommen muss.' },
            { label: 'Elevator Pitch', note: 'Euer Angebot in 30 Sekunden — für Menschen, nicht für Prospekte.' },
          ],
        },
      },
      {
        id: 'naming',
        label: 'Name & Prüfung',
        icon: 'i-ph-seal-check',
        state: 'open',
        info: {
          description: 'Ob Neugründung oder Prüfstand für den Bestandsnamen: Hier wird der Name an der Foundation gemessen — passt er zu Purpose, Werten und Archetyp? Dazu die nüchterne Prüfung: Ist er frei, ist er aussprechbar, funktioniert er auch auf Englisch?',
          minutes: '~6 Min',
          bausteine: [
            { label: 'Namens-Kandidaten', note: 'Vorschläge mit Begründung aus eurer Markenwelt.' },
            { label: 'Verfügbarkeits-Check', note: 'Domain, Social Handles, erste Marken-Recherche — Hinweise, keine Rechtsberatung.' },
            { label: 'Sprach-Check', note: 'Aussprache, Schreibweise, ungewollte Bedeutungen in anderen Sprachen.' },
          ],
        },
      },
      { id: 'verbal-result', kind: 'result', label: 'Ergebnis', icon: '', state: 'open', to: '/brand/demo/ergebnis' },
    ],
  },
  {
    id: 'design',
    label: 'Brand Design',
    locked: true,
    lockedNote: 'Baut auf deiner Foundation auf',
    info: {
      description: 'Die visuelle Identität eurer Marke — hergeleitet aus Foundation und Brand Language, nicht aus dem Katalog. Farben und Schrift entstehen aus Archetyp, Werten und Stimme; jede Entscheidung trägt eine Begründung.',
      minutes: '~35 Min',
      bausteine: [
        { label: 'Farbwelt', note: 'Basisfarbe aus Archetyp + Werten, Hell-/Dunkel-Rampe mit geprüften Kontrast-Paaren, Akzent, Einsatzregeln.' },
        { label: 'Typografie', note: 'Schriftrollen (Text, Überschrift, Mono), Grade und Hierarchie.' },
        { label: 'Logo & Zeichen', note: 'Wort-/Bildmarke, Varianten (App-Icon, Avatar), Schutzraum und Minimalgrößen.' },
        { label: 'Bildsprache & Ikonografie', note: 'Fotografie-Stil, Illustrations- und Icon-Stil.' },
        { label: 'Motion', note: 'Tempo-Charakter, kinetisches Logo, reduced-motion-Verhalten.' },
      ],
    },
  },
  {
    id: 'book',
    label: 'Brand Book & Kit',
    locked: true,
    lockedNote: 'Entsteht aus Design + Foundation',
    info: {
      description: 'Regelwerk und Werkzeuge: Das Book erklärt, das Kit arbeitet. Das meiste entsteht hier automatisch aus euren fertigen Schichten — ihr kuratiert und bestätigt, statt neu zu entscheiden.',
      minutes: '~15 Min',
      bausteine: [
        { label: 'Brand Book', note: 'Kapitel aus euren Schichten, Do-&-Don’t-Beispiele, AI-Guidelines (was KI im Namen der Marke darf).' },
        { label: 'Kit & Design Tokens', note: 'Token-Set hell/dunkel, Exporte (CSS, Tailwind, Figma), maschinenlesbares brand.json.' },
        { label: 'Templates', note: 'Social-Set mit festen Wiedererkennungs-Ankern, Basis-Vorlagen.' },
      ],
    },
  },
  {
    id: 'experience',
    label: 'Brand Experience',
    locked: true,
    lockedNote: 'Website, Social & Content',
    info: {
      description: 'Die Ableitungen: eure Marke im Einsatz. Website, Social, Suche und Newsletter entstehen aus Foundation + Design — welche Inhalte zu euch passen, wissen wir aus Archetyp und Zielgruppe längst.',
      minutes: '~32 Min',
      bausteine: [
        { label: 'Website', note: 'Seitentypen, Theme-Anwendung, Startseiten-Hero.' },
        { label: 'Social', note: 'Profile je Plattform, Content-Kompass (3–5 Säulen mit Taktung) und Interaktions-Stimme — wie ihr antwortet.' },
        { label: 'SEO & GEO', note: 'Keyword-Set aus eurer Positionierung, zitierfähige Markenfakten + llms.txt — gefunden von Google UND von KI-Assistenten.' },
        { label: 'Newsletter & E-Mail', note: 'Absender-Stimme und Template.' },
        { label: 'Content-Vorlagen', note: 'Post-Formate, die Werte und Beweise wiederverwenden.' },
        { label: 'Geschäftsausstattung', note: 'Visitenkarte, Briefbogen und Rechnung, E-Mail-Signatur — braucht jede Marke.' },
        { label: 'Vor Ort', note: 'Nur bei physischem Ort: Google Business, Bewertungs-Antworten in eurer Stimme, Print-Basics.' },
      ],
    },
  },
]
