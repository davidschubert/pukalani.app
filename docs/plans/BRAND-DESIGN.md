# Brand Design (Produkt 02) — Strategie

Phase 1 des Workflows (docs/referenz/WORKFLOW.md), Stand 2026-09-07. Noch
kein Konzept, kein Code. Endet mit den Fragen, die die Konzeption braucht.

---

## 0. Was das hier ist

Der Strang „Brand System" (OPEN-ITEMS, Davids Entscheidung 2026-09-05) läuft
BF1 Foundation-Leseansicht → **Produkt 02 Brand Design** → Produkt 03 Book &
Kit. BF1 ist seit 2026-09-07 abgenommen; Brand Design ist der nächste
Schritt. Dieses Dokument ist die Bestandsaufnahme: wo kommen wir her, wo
stehen wir, wo wollen wir hin — mit Konkurrenz, technischer Ausgangslage,
Hypothesen und offenen Entscheidungen. Die Konzeption (Verträge, Datenmodell,
Oberfläche, Pakete) folgt als §2 in dieser Datei, sobald David die Fragen in
§1.10 beantwortet hat.

---

## 1. Strategie

### 1.1 Wo kommen wir her

Was das Projekt zu Brand Design schon FESTGELEGT hat (nichts davon ist neu zu
entscheiden):

- **Die Produktentscheidung (2026-08-27):** das Fundament ist frei, die
  Ableitung bezahlt. Brand Design ist die erste bezahlte Ableitung.
- **Die Suite (Phase-1-Plan §5b, 2026-08-30):** Produkt 02 macht „aus der
  Foundation DREI Moodboards; iterative Verfeinerung nach Agentur-Art: Haken
  an Gefallendes, Kommentar/Edit an den Rest, MIX & MATCH über Boards —
  ‚Farbwelt aus 1, Typografie aus 3'; Grundlage ist die Visual DNA."
- **Die Design-Schicht im Dummy (Phase-1-Plan §5b „Schritt-Schnitt"):** ~15
  Entscheidungen, ~35 Minuten, fünf Schritte — Farbwelt (Basisfarbe aus
  Archetyp + Werten, Hell-/Dunkel-Rampe mit Kontrast-Paaren, „die
  Themes-Engine nativ") · Typografie (Rollen, Grade, Hierarchie) · Logo &
  Zeichen (Wort-/Bildmarke, Varianten, Schutzraum) · Bildsprache &
  Ikonografie · Motion (Tempo, kinetisches Logo, reduced-motion). Im Rail der
  Werkstatt steht die Schicht seit dem Klickdummy als gesperrte Gruppe mit
  genau diesen Erklär-Texten (`demoRail.ts`).
- **Zwei Taxonomien (Davids Notizen 2026-08-30):** die Sechs-Achsen-Taxonomie
  (Archetyp ≠ visueller Stil — Kernregel: Achsen nie vermischen) und die
  **Visual Brand DNA** mit ~10 orthogonalen Dimensionen (Visual Style,
  Aesthetic Era, Form Language, Typography, Color Character, Imagery,
  Composition, Materiality, Motion Character, Overall Mood). Ein Moodboard ist
  eine KOMBINATION dieser Eigenschaften, keine Kategorie. Die Pipeline ist der
  Wert: **Brand Psychology → Visual DNA → Design Direction → Design System.**
  Vorgemerkt: eigener Schritt „Moodboard" am Anfang von Brand Design.
- **Was schon steht, weil BF1 es vorgezogen hat (G4, 2026-09-07):** der
  kuratierte **Richtungen-Katalog** (`shared/brandDirections.ts`, sechs
  Richtungen, drei je Archetyp-Paar, Farbwelt aus zwölf Dreiklängen,
  Schriftpaar-Namen), die Wahl als Session `result.direction`, Kapitel 10 der
  Foundation zeigt sie, der Snapshot trägt `presetId/presetVersion`. Davids
  Entscheidung dazu: der Katalog ist ein INTERIM, „später durch Themes-Engine-
  Presets ersetzbar" — genau diese Ablösung ist Brand Design.
- **Das Beispiel (Kailua Coffee Co., Dummy `beispiel.vue`):** Farbwelt
  Roast/Crema/Milk/Palm/Paper mit Rollen, Typografie „warme Serif +
  humanistische Grotesk + Mono für Herkunft und Preise", Wortmarke mit
  Wellenpunkt, Fotografie „Tageslicht, Hände, Herkunft — nie Stock-Lächeln",
  Motion ruhig (200 ms, Logo bewegt sich nicht), dazu eine Visual-DNA-Zeile.
  Das ist die abgenommene FORM des Ergebnisses.
- **Der Brand-Check** bewertet „Visuelle Identität" mit Gewicht 15 von 100 und
  kann für eine Foundation ohne Website nur „nicht bewertbar" sagen — Brand
  Design ist das, was diese Kategorie füllt.
- **Die Startseite** verspricht Design-Tokens „hell/dunkel, Kontrast-geprüft —
  CSS, Tailwind, Figma" (als Artefakt von Produkt 03) und nennt Brand Design
  im Prozess-Theater. Das Team kennt eine Design-Beraterin (Frida Martens).

### 1.2 Wo stehen wir

- Zwischen der fertigen Foundation und dem versprochenen Book & Kit steht
  heute NICHTS Visuelles außer der Richtung aus G4: drei Swatches und zwei
  Schriftnamen, die nicht einmal geladen werden (bewusst — „eine Richtung,
  kein Rendering-Beweis").
- Die **Themes-Engine** (Layer `themes`, docs/referenz/THEMES-CONCEPT-V2.md)
  kann genau das, was Farbwelt und Typografie brauchen: Ramp aus EINER
  Basisfarbe (OKLCH, `generateRamp`, auf Tailwind v4 kalibriert, 30+ Tests),
  getönte **Neutral-Ramp** (`generateNeutralRamp`), **Kontrast-Gate**
  (`contrastRatio`, `wcagLevel`), Hell/Dunkel als Varianten, kuratierte
  **Schriftpaare** (Inter, Humanist, Editorial, Geometrisch, Klassisch — self-
  hosted über `@nuxt/fonts`, Regel „maximal drei Schriften"), sogar
  **Font-Upload** (Bucket `fonts`, WOFF2, `custom_fonts`). Aber: sie arbeitet
  für COMMUNITIES und INSTANZEN (`custom_themes`, `data-theme` am `<html>`),
  nicht für ein Brand-Profil. Der Phase-1-Plan hat diese Grenze schon
  benannt: „Themes wirken global auf `:root`, drei parallele Richtungen
  brauchen je ein lokales Preview-`iframe`" (Technik-Vertrag Audit 3), und
  der explizite Themes-Vertrag (A14) „liefert NUR validierte Presets; die
  Engine bleibt unverändert."
- **Zeichen:** `themes/shared/brandMark.ts`/`brandIcon.ts` erzeugen heute
  Initial-Marken für Communities (Kreis + Initial in der Primärfarbe, als
  Favicon/App-Icon), `brandCard.ts` rastert eine Wortmarke ins og-Bild mit
  einem gebackenen Font-Atlas. Ein Logo-Werkzeug ist das nicht — aber es
  zeigt: Monogramm und Wortmarke aus Farbe + Schrift sind im Haus.
- **Bildsprache und Motion:** nichts, außer dem Beispiel-Text und den
  Rail-Erklärungen.
- **Extraktion für Bestandsmarken:** die URL-Analyse (brand-010) und der
  Brand-Check lesen Text, Meta und Struktur — Farben und Schriften einer
  bestehenden Website werden heute NICHT ausgelesen. Davids Strategie-Text
  (2026-09-05) will genau das als Relaunch-Einstieg („Website → verstehen →
  extrahieren → bewerten → verbessern").
- **Bezahlung:** branding.supply läuft im Beta-Modus per Einladung, ohne
  Stripe. Die Platform hat Stripe (Community-Abos, Checkout, Webhook); der
  brand-Layer hat keinen Geldpfad.

### 1.3 Wo wollen wir hin — das Zielbild in einem Satz

**Brand Design macht aus der Foundation eine visuelle Identität als
DESIGN-SYSTEM, nicht als Bildergalerie:** Farbwelt (Basisfarbe + hell/dunkel
Ramp, Kontrast-geprüft), Typografie (Paar + Hierarchie), Zeichen (Richtung
für Wort-/Bildmarke plus Regeln), Bildsprache und Motion als Regeln mit Do &
Don't — je Schritt ein Vorschlag aus der Visual DNA mit Begründung, Auswahl
aus drei, Mix & Match über Boards; das Ergebnis füllt Kapitel 10 der
Foundation, wird zum Preset im Snapshot und ist der Input von Produkt 03.

Der Unterschied zu allem, was der Markt verkauft (§1.7): die Optik wird aus
der Strategie HERGELEITET und begründet („für euren Archetyp untypisch,
DESHALB eigenständig"), nicht aus Name + Branche gewürfelt. Design =
Entscheidungen, nicht Generator (Startseiten-Satz „Marken sind keine
Vorlagen").

### 1.4 Was das Produkt BEWUSST NICHT behauptet

- **Kein fertiges Logo per KI-Bild.** Bildlogos aus Diffusionsmodellen sind
  markenrechtlich riskant (Ähnlichkeit, Schutzfähigkeit), qualitativ
  unberechenbar und genau das, was Looka/LogoAI/Brandmark millionenfach
  verkaufen. Brand Design liefert die RICHTUNG des Zeichens (Wortmarke,
  Monogramm oder Bildmarke; Charakter; Schutzraum; Varianten) und setzt
  Wortmarke/Monogramm aus dem Schriftpaar — die Ausarbeitung eines Bildlogos
  bleibt Designer-Arbeit (Studio, Erstgespräch). Ob die Setzung schon in
  Phase 1 gehört, ist Frage §1.10 b.
- **Keine generierten Fotos.** Bildsprache sind Prinzipien und Do/Don't
  (plus Prompt-Vorlagen für Produkt 03/04), keine Stock- oder KI-Bilder.
- **Kein DAM, keine Vorlagen, keine Website** — Produkt 03/04.
- **Keine Ersetzung der Themes-Engine** — sie wird Konsument-seitig
  angesprochen (Presets), nicht umgebaut (A14).

### 1.5 Zielgruppe und Nutzen

| Wer | Nutzen von Brand Design | Woran wir es messen |
| --- | --- | --- |
| Gründerin ohne Designer (Weiche „Neue Marke") | Am Ende STEHT etwas Anwendbares: Farben mit Codes, Schriftpaar, Wortmarke gesetzt, Regeln — morgen in Website und Social benutzbar | Anteil der Foundations, die Brand Design starten und abschließen; Export/Tokens-Nutzung (Produkt 03) |
| Unternehmen im Relaunch (Weiche „Marken-Relaunch") | Der Ist-Zustand wird gelesen (Farben/Schriften der Website), Brand Design sagt, was bleibt und was sich ändert („Evolution statt Revolution", Serifen-Artikel) | Relaunch-Starts nach Brand-Check; Delta „Visuelle Identität" im Score vorher/nachher |
| Studio-Kunde (Enterprise = Studio) | Vorarbeit, die der Designer nicht mehr erfragen muss: DNA, Richtung, Farbwelt, Typo-Rollen — das Briefing ist das Ergebnis | Erstgespräche aus Kapitel 10; Zeit bis zum ersten Design-Entwurf |

### 1.6 Technische Ausgangslage — was wir NICHT neu bauen

| Baustein | Existiert | Was Brand Design daraus macht |
| --- | --- | --- |
| Ramp + Kontrast + Neutral | `themes/shared/ramp.ts`, `oklch.ts` (pur, getestet) | Farbwelt-Schritt rechnet je Vorschlag Ramp hell/dunkel und prüft Kontrast-Paare — ohne Engine-Umbau, über den Preset-Vertrag |
| Schriftpaare + Self-Hosting | `FONT_FAMILY_REGISTRY`, `fonts.css`, `@nuxt/fonts`; Font-Upload WOFF2 | Typografie-Schritt wählt aus kuratierten Paaren (Regel „max. drei"), Vorschau lädt ECHTE Schriften — anders als G4 |
| Wortmarke/Monogramm | `brandMark.ts`, `brandIcon.ts`, `brandCard.ts` (Atlas-Raster) | Zeichen-Schritt setzt Wortmarke + Monogramm aus Schriftpaar und Farbwelt als SVG (Varianten, Schutzraum-Regel) |
| Richtungen-Katalog (G4) | `brandDirections.ts`, `result.direction`, Kapitel 10, Snapshot-Preset | Wird zum Moodboard-Einstieg: die gewählte Richtung ist die Vorbelegung der DNA; der Katalog wächst zu Presets |
| Visual-DNA-Notiz | Phase-1-Plan §5b | Wird Datenmodell: ~10 Dimensionen mit kontrollierten Vokabularen, KI-Vorschlag mit Begründung, je Dimension bestätigbar |
| Werkstatt-Mechanik | Sessions, Zustandsmaschine, Abnahme, Korrektur-Regel, Berater (BW2) | Brand Design = neue Kapitel derselben Werkstatt (Schicht 2), Beraterin Frida, KEINE zweite Werkstatt |
| Foundation-Renderer | `buildBrandFoundation`, Kapitel 10, `swatches`/`direction`-Blöcke | Kapitel 10 wird VOLL: Farbwelt, Typo, Zeichen, Bild, Motion als Blöcke — die Schranke fällt |
| Beweis-Werkzeuge | verify-Skripte, Playwright, Testmarke | Wie BF1 |

### 1.7 Konkurrenz und Referenzen (Recherche 2026-09-07, Quellen in Anhang A)

Drei Sorten — und keine leitet Design aus einer Strategie her:

1. **Logo-Generatoren mit „Brand Kit"** — Looka, Brandmark, LogoAI, Tailor
   Brands. Eingabe: Name + Branche + Stilpräferenz, Ausgabe in Sekunden:
   Logo-Varianten, Palette, Schriften, Social-Vorlagen, ein „Brand Guide".
   Geschäftsmodell einmalig (Brandmark, Looka-Logo-Paket) oder Abo (Looka
   Brand Kit; Tailor Brands 0 / 199 / 249 $ pro Jahr als „Business-in-a-box"
   mit Domain und Website). Millionen Nutzer, Zielgruppe „I'm not a
   designer". Qualität: austauschbar, ohne Begründung, ohne Strategie.
2. **Werkzeuge für Designer** — Huemint (ML-Paletten mit Kontrast-Matrix und
   Lock, trainiert auf 1,2 Mio. Designs, frei), Fontjoy (Deep-Learning-
   Schriftpaare, frei), Realtime Colors (Palette + Schriften auf einem ECHTEN
   Layout hell/dunkel, Export CSS/Tailwind/Figma, frei, 300 k Nutzer),
   Lovable Brand Kit Extractor (URL → Farben/Schriften/Tokens/`design.md`).
   Alles Commodity: Palette und Paarung kosten nichts mehr — der Wert liegt in
   Herleitung, Begründung und System.
3. **Container** — Canva Brand Kit (Farben, Schriften, Logos, Vorlagen im
   Pro-Plan), Frontify/Corebook° (Guidelines-Verwaltung, s. BF1-Konzept
   §1.5). Sie verwalten, was andere entschieden haben.

**Was wir daraus machen:**

| Marktbefund | Folge für Brand Design |
| --- | --- |
| Vorschau auf ECHTEM Layout schlägt Farbfelder (Realtime Colors; Phase-1-Plan §3d Nr. 7 sagt dasselbe: „Website-Hero, Überschrift+Fließtext, Button, Zitat, Farbrampe") | Jede Richtung/Farbwelt wird als Anwendungs-Szene gezeigt, hell UND dunkel — mit den ECHTEN Schriften |
| Kontrast als Erstklasse-Eigenschaft (Huemint-Matrix, Realtime Colors AA/AAA) | Kontrast-Paare sind Teil des Vorschlags, nicht ein Prüfschritt danach — die Engine kann es |
| Lock + Regenerate als Bedienmuster (Huemint, Fontjoy) | „Haken an Gefallendes, Rest neu" = Davids Mix & Match; je Dimension festhalten, Rest neu vorschlagen |
| Logo-Erwartung ist massiv (jeder Wettbewerber startet beim Logo) | Ohne ein sichtbares ZEICHEN wirkt Brand Design unvollständig — deshalb mindestens Wortmarke/Monogramm-Setzung (Frage b) |
| Export ist Standard (Tailwind/CSS/Figma bei den Freien) | Tokens gehören zu Produkt 03; Brand Design muss sie aber ERZEUGEN (dieselben Werte), sonst ist 03 leer |
| Alle starten bei Name + Branche | Wir starten bei Archetyp, Werten, Stimme, Positionierung — die Begründung ist das Produkt |

### 1.8 Geschäftsmodell-Einordnung

Brand Design ist die erste BEZAHLTE Stufe. Zwei Wege sind denkbar, und die
Wahl prägt das Konzept (Frage §1.10 d):

- **Studio-begleitet zuerst:** Brand Design läuft in der Werkstatt, wird
  aber pro Marke vom Studio freigeschaltet (nach Erstgespräch), Ergebnis geht
  in Designer-Arbeit über. Kein Stripe im brand-Layer, kein Preis auf der
  Seite (passt zur G4-Entscheidung „kein Preis, Studio-Angebot"), Beta-Logik
  wie heute. Lernt am Kunden, bevor Selbstbedienung skaliert.
- **Selbstbedienung mit Kauf:** Freischaltung per Checkout (Stripe existiert
  in der Platform, müsste in den brand-Layer/branding), Preis auf Kapitel 10
  und Startseite. Skaliert, verlangt aber Rechtstexte, Rückerstattung,
  Support — und eine Qualität, die ohne Designer trägt.

### 1.9 Risiken und Hypothesen (was die Konzeption/Beta klären muss)

- **H1 Sehen schlägt Wählen:** Nutzer entscheiden erst, wenn sie ihre Marke in
  einer Szene sehen (Hero, Karte, Knopf, Zitat) — nicht an Swatches. Folge:
  Szenen-Vorschau ist Pflicht, iframes oder lokale CSS-Variablen (G4 hat
  lokale Variablen bewiesen; drei parallele Szenen brauchen keinen `:root`).
- **H2 Logo-Loch:** ohne gesetztes Zeichen fühlt sich das Ergebnis leer an;
  mit KI-Bildlogos verkaufen wir Risiko. Wortmarke/Monogramm aus dem eigenen
  Schriftpaar ist der ehrliche Mittelweg — zu prüfen an fünf Testmarken.
- **H3 Schriften:** Self-Hosting per Build erlaubt nur kuratierte Familien;
  ~6 Paare reichen für die Beta, Font-Upload ist der Ausweg für Marken mit
  eigener Schrift.
- **H4 KI-Herleitung:** die DNA-Vorschläge müssen an der Foundation hängen
  (Archetyp, Werte, Ton-Wörter, Positionierung) und begründet sein — sonst
  sind wir Brandmark. Messbar wie beim Wizard: `generation.*`-Ereignisse,
  Korrekturrate je Dimension.
- **H5 Zeit:** ~35 Minuten für fünf Schritte sind viel nach 45 Minuten
  Foundation — Moodboard zuerst (eine Wahl, die die anderen vorbelegt) muss
  die Schritte auf Bestätigungen verkürzen.
- **H6 Relaunch braucht den Ist-Zustand:** Bestandsmarken erwarten, dass wir
  ihre Farben/Schriften KENNEN — die Extraktion (Farben aus CSS, Schriften aus
  `font-family`, Logo-Datei) fehlt und ist ein eigener Baustein.
- **H7 Zwei Welten:** die Themes-Engine denkt in Community/Instanz; ein
  Brand-Preset darf sie nicht anfassen — sonst kollidieren Layer-Grenzen und
  Mandanten-Regeln. Der Preset-Vertrag muss VOR dem Bau stehen.

### 1.10 Fragen an David (die Konzeption braucht sie)

| # | Frage | Empfehlung | Alternative |
| --- | --- | --- | --- |
| a | Umfang der ersten Fassung | **Moodboard + Farbwelt + Typografie + Zeichen-Richtung** (vier Schritte; Bildsprache und Motion als Regeln mit Do/Don't im selben Lauf, aber ohne eigene Vorschau) | alle fünf Schritte gleich tief; oder nur Farbwelt + Typografie |
| b | Das Zeichen | **Wortmarke + Monogramm aus dem Schriftpaar setzen** (SVG, Varianten, Schutzraum-Regel), Bildmarke nur als Richtung + Briefing | nur Richtung/Briefing ohne Setzung; oder KI-Bildlogos (abgeraten, §1.4) |
| c | Vorschau | **Anwendungs-Szenen mit lokalen CSS-Variablen und echten Schriften**, hell und dunkel, drei nebeneinander | Themes-Engine-Preview-iframes (echter, größer) |
| d | Geschäftsmodell der ersten Fassung | **Studio-begleitet, Freischaltung je Marke, kein Preis** (wie G4) | Selbstbedienung mit Stripe-Checkout und Preis |
| e | Wo lebt es | **Schicht 2 derselben Werkstatt** (Kapitel nach der Foundation, Beraterin Frida, gleiche Zustandsmaschine) | eigener Layer `design` (Silo-Regel: neues Produkt ⇒ eigener Layer — zu prüfen gegen „eine Werkstatt") |

### 1.11 Entscheidungen (David, 2026-09-07, Fragenrunde) — die Strategie ist damit FREIGEGEBEN

| # | Frage | Entscheidung | Einordnung |
| --- | --- | --- | --- |
| a | Umfang | **Alle fünf Schritte gleich tief** — Moodboard/DNA, Farbwelt, Typografie, Zeichen, Bildsprache UND Motion je mit eigener Vorschau | GEGEN die Empfehlung (vier Schritte). Folge für die Konzeption: Bild-Prinzipien brauchen Beispiel-Darstellung (keine generierten Fotos, §1.4 bleibt), Motion braucht eine Demo (Tempo, Übergänge, reduced-motion) — beides mit Vorschau-Szene. Zeitbudget ~35 Min hält nur, wenn das Moodboard die Schritte auf Bestätigungen verkürzt (H5). |
| b | Zeichen | **Drei Stufen in dieser Reihenfolge:** (1) Richtung + Briefing (Wort-/Bild-/Kombinationsmarke, Charakter, Schutzraum-Regel), (2) darauf aufbauend BEISPIELE für Wortmarken + Monogramme gesetzt (aus Schriftpaar + Farbwelt, SVG, Varianten), (3) dazu ein BEREICH, in dem KI-Bildlogos auf den zuvor erstellten Inhalten erzeugt werden | Stufe 3 GEGEN die Empfehlung (§1.4). Davids Entscheidung — mit diesen Leitplanken, die die Konzeption einlösen muss: KI-Bildlogos sind als ENTWURF gekennzeichnet („Ideen für den Designer", nicht „euer Logo"), tragen Herkunft (Modell, Datum), reisen NICHT in Foundation-Snapshot/Share, bis ein Mensch eines übernimmt; Bildmodelle laufen über denselben Transport wie die Text-KI (`aiComplete`-Familie, NUXT_AI_KEY, ZDR-Routing wie beim Wizard) und mit Drosseln; Markenrecht ist Hinweis im UI, keine Prüfung. |
| c | Vorschau | Anwendungs-Szenen mit lokalen CSS-Variablen und ECHTEN Schriften, hell und dunkel, drei nebeneinander | Annahme, nicht widersprochen. |
| d | Geschäftsmodell | **Studio-begleitet, ohne Preis** — Freischaltung je Marke durch das Studio nach dem Erstgespräch, kein Stripe im brand-Layer | nach Empfehlung; passt zu G4 („kein Preis, Studio-Angebot"). |
| e | Ort | **Schicht 2 derselben Werkstatt** — neue Kapitel nach der Foundation im brand-Layer, Beraterin Frida, dieselbe Zustandsmaschine/Abnahme/Korrektur-Regel | nach Empfehlung; die Silo-Regel „neues Produkt ⇒ eigener Layer" wird bewusst NICHT angewandt, weil Brand Design dieselbe Werkstatt und dasselbe Dokument fortsetzt (Begründung ins DECISION-LOG). |

Nächste Phase: **Konzeption** (§2 in dieser Datei) — Verträge für DNA-
Datenmodell, Preset-Vertrag zur Themes-Engine, Kapitel/Sessions der
Schicht 2, Zeichen-Stufen inkl. KI-Bildlogo-Bereich mit Leitplanken,
Vorschau-Szenen, Freischaltung, Messung, Pakete.

---

## Anhang A — Recherche-Quellen (2026-09-07)

| Quelle | Sorte | Kernaussage |
| --- | --- | --- |
| brandmark.io | Logo-Generator | Logos + Visitenkarten + Social + Brand-Guide aus Name/Branche; handgemachte Schrift-Templates + generative Icons; einmalige Zahlung; „I'm not a designer" |
| tailorbrands.com/pricing | Business-in-a-box | 8 freie Logos, Pläne 0 / 199 / 249 $ pro Jahr mit Domain, Website, Print, Social; KI-Plan nach Geschäftszielen |
| logoai.com | Logo-Generator | „Type your name … logo, colors, type, and a brand kit"; mehrere KI-Modelle, Mockups, animierte Intros; „9 Mio. businesses" |
| huemint.com/about | Paletten-Werkzeug | ML-Paletten nach Kontext (Hintergrund/Vordergrund/Akzent), Kontrast-Matrix, Lock, Creativity-Regler, 1,2 Mio. Trainingsbilder; frei, API nicht-kommerziell |
| fontjoy.com | Schriftpaar-Werkzeug | Deep-Learning-Paare, Lock, Kontrast-Vergleich; frei |
| realtimecolors.com | Vorschau-Werkzeug | Palette + Schriften auf echtem Layout, hell/dunkel, 5-Farben-System mit AA/AAA, Export CSS/Tailwind/SCSS/Figma; frei, 300 k Nutzer |
| lovable.dev Brand Kit Extractor (BF1 Anhang A) | Extraktor | URL → Farben (WCAG), Schriften, Voice, Tokens, Tailwind, `design.md` |
| looka.com (Pricing, Brand Kit) | Logo + Brand-Kit-Abo | **nicht abrufbar (403)** — nach Kenntnisstand: Logo-Pakete einmalig, Brand Kit als Jahres-Abo mit Vorlagen und Guidelines; vor Verwendung prüfen |
| canva.com Brand Kit | Container | **nicht abrufbar (403)** — nach Kenntnisstand: Farben/Schriften/Logos/Vorlagen im Pro-/Teams-Plan; vor Verwendung prüfen |
| Frontify, Corebook°, standards.site, Brandkit | Container | s. docs/archiv/BRAND-FOUNDATION-LESEANSICHT.md §1.5 / Anhang A |
