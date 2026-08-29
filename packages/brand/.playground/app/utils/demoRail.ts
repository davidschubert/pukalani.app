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
    steps: [
      {
        id: 'design-color',
        label: 'Farbwelt',
        icon: '',
        state: 'open',
        info: {
          description: 'Eure Farben kommen nicht aus dem Katalog: George leitet eine Basisfarbe aus Archetyp und Werten her und baut daraus eine geprüfte Hell- und Dunkel-Rampe mit barrierefreien Kontrast-Paaren.',
          minutes: '~10 Min',
          bausteine: [
            { label: 'Basisfarbe', note: 'Hergeleitet aus Archetyp + Werten — mit Begründung.' },
            { label: 'Hell-/Dunkel-Rampe', note: 'Automatisch erzeugt, Kontrast-geprüft — ihr bestätigt.' },
            { label: 'Akzentfarbe', note: 'Der eine Pop — sparsam eingesetzt.' },
            { label: 'Einsatzregeln', note: 'Was wofür: Flächen, Text, Signale.' },
          ],
        },
      },
      {
        id: 'design-type',
        label: 'Typografie',
        icon: '',
        state: 'open',
        info: {
          description: 'Schrift ist Stimme in Form: Aus eurer Tonalität schlägt George Schriftrollen vor — Text, Überschrift, Mono — und legt Grade und Hierarchie fest.',
          minutes: '~6 Min',
          bausteine: [
            { label: 'Textschrift', note: 'Die Arbeitsschrift — lesbar, passend zur Stimme.' },
            { label: 'Überschrift-Schrift', note: 'Der Charakterkopf — darf mehr wagen.' },
            { label: 'Hierarchie & Grade', note: 'Größen und Gewichte als System.' },
          ],
        },
      },
      {
        id: 'design-logo',
        label: 'Logo & Zeichen',
        icon: '',
        state: 'open',
        info: {
          description: 'Die Richtung eures Zeichens — Wortmarke, Bildmarke oder beides — samt Varianten für App-Icon und Avatar, Schutzraum und Minimalgrößen.',
          minutes: '~8 Min',
          bausteine: [
            { label: 'Richtung', note: 'Wortmarke, Bildmarke oder Kombination — begründet aus der Foundation.' },
            { label: 'Varianten', note: 'App-Icon, Avatar, Favicon.' },
            { label: 'Schutzraum & Minimalgrößen', note: 'Damit das Zeichen überall sauber steht.' },
            { label: 'Datei-Set', note: 'Exporte für Web, Print und Social.' },
          ],
        },
      },
      {
        id: 'design-imagery',
        label: 'Bildsprache & Ikonografie',
        icon: '',
        state: 'open',
        info: {
          description: 'Wie eure Marke aussieht, wenn sie nicht spricht: Fotografie-Stil, Illustrations- und Icon-Stil — mit Do-&-Don’t-Beispielen zum Fühlen.',
          minutes: '~6 Min',
          bausteine: [
            { label: 'Fotografie-Stil', note: 'Licht, Ausschnitt, Menschen — was zu euch passt.' },
            { label: 'Illustrations-Stil', note: 'Ob und wie ihr zeichnet.' },
            { label: 'Icon-Stil', note: 'Linie oder Fläche, rund oder kantig.' },
          ],
        },
      },
      {
        id: 'design-motion',
        label: 'Motion',
        icon: '',
        state: 'open',
        info: {
          description: 'Bewegung mit Charakter: Tempo und Übergänge (150–250 ms), ob euer Logo sich bewegt — und was bei reduzierter Bewegung passiert.',
          minutes: '~5 Min',
          bausteine: [
            { label: 'Tempo-Charakter', note: 'Ruhig oder lebendig — aus dem Archetyp.' },
            { label: 'Logo-Animation', note: 'Kinetisches Logo ja/nein, reduced-motion-fest.' },
          ],
        },
      },
      { id: 'design-result', kind: 'result', label: 'Ergebnis', icon: '', state: 'open', to: '/brand/demo/ergebnis' },
    ],
    label: 'Brand Design',
    locked: true,
    lockedNote: 'Baut auf deiner Foundation auf',
    info: {
      description: 'Die visuelle Identität eurer Marke — hergeleitet aus Foundation und Brand Language, nicht aus dem Katalog. Farben und Schrift entstehen aus Archetyp, Werten und Stimme; jede Entscheidung trägt eine Begründung.',
      minutes: '~35 Min',
      bausteine: [
        { label: 'Farbwelt', note: 'Basisfarbe aus Archetyp + Werten, Hell-/Dunkel-Rampe mit geprüften Kontrast-Paaren, Akzent, Einsatzregeln.' },
        { label: 'Typografie', note: 'Schriftrollen (Text, Überschrift, Mono), Grade und Hierarchie — vorgeschlagen aus Stimme und Archetyp.' },
        { label: 'Logo & Zeichen', note: 'Wort-/Bildmarke, Varianten (App-Icon, Avatar), Schutzraum und Minimalgrößen.' },
        { label: 'Bildsprache & Ikonografie', note: 'Fotografie-Stil, Illustrations- und Icon-Stil — mit Do-&-Don’t-Beispielen zum Fühlen.' },
        { label: 'Motion', note: 'Tempo-Charakter, kinetisches Logo, reduced-motion-Verhalten.' },
      ],
    },
  },
  {
    id: 'book',
    steps: [
      {
        id: 'book-book',
        label: 'Brand Book',
        icon: '',
        state: 'open',
        info: {
          description: 'Euer Regelwerk entsteht automatisch aus den fertigen Schichten — ihr kuratiert Kapitel, bestätigt Do-&-Don’t-Beispiele und legt fest, was KI im Namen eurer Marke darf.',
          minutes: '~6 Min',
          bausteine: [
            { label: 'Kapitel', note: 'Zusammengestellt aus Foundation, Language und Design.' },
            { label: 'Do & Don’t', note: 'Beispiele bestätigen oder tauschen.' },
            { label: 'AI-Guidelines', note: 'Was KI in eurer Stimme erzeugen darf — und was nie.' },
          ],
        },
      },
      {
        id: 'book-kit',
        label: 'Kit & Design Tokens',
        icon: '',
        state: 'open',
        info: {
          description: 'Das Kit arbeitet: Design Tokens für hell und dunkel, Exporte für CSS, Tailwind und Figma — und das maschinenlesbare brand.json für KI-Werkzeuge.',
          minutes: '~5 Min',
          bausteine: [
            { label: 'Token-Set', note: 'Hell/dunkel mit geprüften Kontrasten — bestätigen.' },
            { label: 'Exporte', note: 'CSS, Tailwind, Figma.' },
            { label: 'brand.json', note: 'Stimme, Vokabular und Tabus — maschinenlesbar.' },
          ],
        },
      },
      {
        id: 'book-templates',
        label: 'Templates',
        icon: '',
        state: 'open',
        info: {
          description: 'Vorlagen mit festen Wiedererkennungs-Ankern — für Social, Dokumente und Präsentationen.',
          minutes: '~4 Min',
          bausteine: [
            { label: 'Social-Set', note: 'Formate je Plattform mit euren Ankern.' },
            { label: 'Dokumente & Präsentationen', note: 'Basis-Vorlagen in eurem Design.' },
          ],
        },
      },
      { id: 'book-result', kind: 'result', label: 'Ergebnis', icon: '', state: 'open', to: '/brand/demo/ergebnis' },
    ],
    label: 'Brand Book & Kit',
    locked: true,
    lockedNote: 'Entsteht aus Design + Foundation',
    info: {
      description: 'Regelwerk und Werkzeuge: Das Book erklärt, das Kit arbeitet. Das meiste entsteht hier automatisch aus euren fertigen Schichten — ihr kuratiert und bestätigt, statt neu zu entscheiden.',
      minutes: '~15 Min',
      bausteine: [
        { label: 'Brand Book', note: 'Kapitel aus euren Schichten, Do-&-Don’t-Beispiele, AI-Guidelines (was KI im Namen der Marke darf).' },
        { label: 'Kit & Design Tokens', note: 'Token-Set hell/dunkel, Exporte (CSS, Tailwind, Figma), maschinenlesbares brand.json.' },
        { label: 'Templates', note: 'Social-Set mit festen Wiedererkennungs-Ankern, Basis-Vorlagen für Dokumente und Präsentationen.' },
      ],
    },
  },
  {
    id: 'experience',
    steps: [
      {
        id: 'exp-website',
        label: 'Website',
        icon: '',
        state: 'open',
        info: {
          description: 'Eure Marke als Website: Seitentypen aus euren Zielen, das Theme aus eurem Design — und ein Startseiten-Hero, der die Tagline trägt.',
          minutes: '~5 Min',
          bausteine: [
            { label: 'Seitentypen', note: 'Was eure Site braucht — aus Zielen und Zielgruppe.' },
            { label: 'Theme-Anwendung', note: 'Farben und Schrift werden zur laufenden Site.' },
            { label: 'Startseiten-Hero', note: 'Der erste Eindruck, aus Tagline + Bildsprache.' },
          ],
        },
      },
      {
        id: 'exp-social',
        label: 'Social',
        icon: '',
        state: 'open',
        info: {
          description: 'Profile je Plattform, ein Content-Kompass mit 3–5 Säulen und Taktung — und die Interaktions-Stimme: wie ihr antwortet, nicht nur wie ihr postet.',
          minutes: '~6 Min',
          bausteine: [
            { label: 'Profile', note: 'Bio, Avatar, Banner — je Plattform konsistent.' },
            { label: 'Content-Kompass', note: '3–5 Säulen mit Format und Taktung.' },
            { label: 'Interaktions-Stimme', note: 'Kommentare, DMs, Support — in eurem Ton.' },
          ],
        },
      },
      {
        id: 'exp-seo',
        label: 'SEO & GEO',
        icon: '',
        state: 'open',
        info: {
          description: 'Gefunden werden — von Google und von KI-Assistenten: Keywords aus eurer Positionierung, konsistente Entitätsdaten und zitierfähige Markenfakten samt llms.txt.',
          minutes: '~6 Min',
          bausteine: [
            { label: 'Keyword-Set', note: 'Abgeleitet aus Positionierung + Vokabular.' },
            { label: 'Entitäten-Konsistenz', note: 'Name, Ort, Angebot — überall gleich.' },
            { label: 'Markenfakten & llms.txt', note: 'Zitierfähig für ChatGPT, Perplexity & Co.' },
          ],
        },
      },
      {
        id: 'exp-mail',
        label: 'Newsletter & E-Mail',
        icon: '',
        state: 'open',
        info: {
          description: 'Eure Stimme im Postfach: Absender-Auftritt und ein Template in eurem Design.',
          minutes: '~3 Min',
          bausteine: [
            { label: 'Absender-Stimme', note: 'Von wem kommt die Mail — und wie klingt sie.' },
            { label: 'Template', note: 'Kopf, Fuß, Typografie — einmal sauber.' },
          ],
        },
      },
      {
        id: 'exp-content',
        label: 'Content-Vorlagen',
        icon: '',
        state: 'open',
        info: {
          description: 'Post-Formate, die eure Werte und Beweise wiederverwenden — Inhalte entstehen aus der Foundation, nicht aus dem Bauch.',
          minutes: '~4 Min',
          bausteine: [
            { label: 'Formate', note: 'Je Säule ein wiederholbares Format.' },
            { label: 'Anker', note: 'Feste Wiedererkennungs-Elemente je Format.' },
          ],
        },
      },
      {
        id: 'exp-stationery',
        label: 'Geschäftsausstattung',
        icon: '',
        state: 'open',
        info: {
          description: 'Braucht jede Marke — auch rein digitale: Visitenkarte, Briefbogen und Rechnungsvorlage, E-Mail-Signatur.',
          minutes: '~4 Min',
          bausteine: [
            { label: 'Drucksachen-Set', note: 'Visitenkarte, Briefbogen, Rechnung.' },
            { label: 'E-Mail-Signatur', note: 'Konsistent für alle im Team.' },
          ],
        },
      },
      {
        id: 'exp-local',
        label: 'Vor Ort',
        icon: '',
        state: 'open',
        info: {
          description: 'Nur bei physischem Ort (per Weiche): euer Auftritt dort, wo Kunden euch wirklich begegnen — inklusive Google Maps.',
          minutes: '~4 Min',
          bausteine: [
            { label: 'Google Business', note: 'Profil, Fotos, Kategorien — konsistent zur Marke.' },
            { label: 'Bewertungs-Stimme', note: 'Antworten auf Bewertungen in eurem Ton.' },
            { label: 'Print-Basics', note: 'Schild, Karte, Verpackung.' },
          ],
        },
      },
      { id: 'exp-result', kind: 'result', label: 'Ergebnis', icon: '', state: 'open', to: '/brand/demo/ergebnis' },
    ],
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
