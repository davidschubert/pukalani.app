# Brand Design (Produkt 02) — Strategie und Konzept

Phase 1 des Workflows (docs/referenz/WORKFLOW.md), Stand 2026-09-07 —
FREIGEGEBEN mit Davids Entscheidungen in §1.11. Phase 2 (Konzeption, §2) ist
seit 2026-09-07 FREIGEGEBEN (§2.19 nach Empfehlung); Phase 3 (Prototyp im
Playground) läuft.

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

- **Kein fertiges Logo per KI-Bild als „euer Logo".** Bildlogos aus
  Diffusionsmodellen sind markenrechtlich riskant (Ähnlichkeit,
  Schutzfähigkeit) und qualitativ unberechenbar — die Empfehlung war, sie
  wegzulassen. **David hat anders entschieden (§1.11 b, Stufe 3):** es gibt
  einen Bereich für KI-Bildlogos auf Basis von Richtung und Briefing — als
  gekennzeichnete ENTWÜRFE für die Designer-Arbeit, mit Herkunft, außerhalb
  von Snapshot und Share, mit Markenrechts-Hinweis. Was das Produkt weiterhin
  nicht behauptet: dass ein solcher Entwurf ein schutzfähiges, fertiges Logo
  ist. Die Ausarbeitung bleibt Designer-Arbeit (Studio, Erstgespräch).
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

## 2. Konzeption (Phase 2, 2026-09-07 — zur Freigabe)

Alles hier folgt den Entscheidungen in §1.11. Offene Punkte stehen als
Fragen in §2.19, nicht als Vorbehalt im Text.

### 2.1 Produktform: Schicht 2 derselben Werkstatt

- **Sechs neue Kapitel** hinter der Foundation, additiv in `BRAND_STEP_KEYS`
  (Registry-Ids ändern sich nie; die Fassung bleibt 1, weil Hash-Inputs nur
  Werte lesen): `dna` (Moodboard), `color` (Farbwelt), `type` (Typografie),
  `mark` (Zeichen), `imagery` (Bildsprache & Ikonografie), `motion`. Je
  Kapitel eine `brand_steps`-Zeile wie heute (`uq_profile_step` trägt das
  schon), Sessions nach dem BW2-Vertrag (`defineSession`, Ziel, Leiter,
  Form, Invarianten, `audience`, `sensitivity`), Abnahme je Kapitel,
  Prüfblick, Korrektur-Regel — NICHTS Neues an der Zustandsmaschine.
- **Beraterin Frida Martens** (`brandAdvisors.ts`, `steps: [dna, color,
  type, mark, imagery, motion]`), Tonalität wie die Crew, eine Stimme (George
  bleibt Gastgeber). Ihre Leitern und Zielsätze sind Davids Inhalts-Gate wie
  in BW2 Paket 2.
- **Gating:** Schicht 2 öffnet, wenn (a) die Foundation ihr Ergebnis-Kapitel
  abgeschlossen hat (`result` done, inkl. `result.direction`) UND (b) die
  Marke **freigeschaltet** ist (§2.10). Vorher bleibt der Rail-Layer „Brand
  Design" gesperrt mit dem heutigen Erklär-Text.
- **Ort in der Oberfläche:** dieselbe Werkstatt-Route `/brand/:id/<stepKey>`,
  derselbe Rail (Layer „Brand Design" wird zum echten Layer mit sechs
  Einträgen), dasselbe Dokument („Euer Branding" bekommt die sechs Kapitel),
  dieselbe Foundation-Leseansicht (Kapitel 10 wird VOLL, §2.8).

### 2.2 Kapitel `dna` — Moodboard aus der Visual DNA

- **Vokabulare** als pure Datei `shared/brandVisualDna.ts`: die zehn
  Dimensionen aus Davids Notiz (Visual Style, Aesthetic Era, Form Language,
  Typography, Color Character, Imagery, Composition, Materiality, Motion
  Character, Overall Mood), je 4–7 KONTROLLIERTE Werte mit Ids (i18n-Labels),
  keine Freitexte. Ein Moodboard = eine Belegung aller zehn.
- Sessions: `g.dna` (derivation, KI: Vorschlag je Dimension MIT Begründung
  aus Archetyp, Werten, Ton-Wörtern, Positionierung; die G4-Richtung ist die
  Vorbelegung — Katalog-Id ⇒ DNA-Preset, pure Tabelle) · `g.boards`
  (derivation, PURE Regel: drei Moodboards als Varianten der DNA — „so wie
  vorgeschlagen", „eine Stufe ruhiger", „eine Stufe mutiger", je mit
  Farbwelt-Skizze, Schriftpaar, Formsprache; kein KI-Aufruf) · `g.board`
  (choice: eines der drei) · `g.mix` (stage-edit: Mix & Match — je
  Dimension festhalten oder aus einem anderen Board nehmen; Regenerate nur
  für nicht festgehaltene Dimensionen — das Lock-Muster von Huemint/Fontjoy).
- Ergebnis: die bestätigte DNA, maschinenlesbar, wandert später in
  `brand.json` (Produkt 03) und ist die Vorbelegung ALLER folgenden Kapitel.

### 2.3 Kapitel `color` — Farbwelt mit Ramp und Kontrast

- Sessions: `h.base` (derivation: drei Basisfarben-Kandidaten aus DNA
  „Color Character" + Archetyp, mit Begründung; der Mensch wählt oder gibt
  einen Hex) · `h.ramp` (derivation, PUR: hell/dunkel-Ramp 50–950 über die
  Themes-Mathematik) · `h.neutral` (choice: getönte Neutral-Ramp aus der
  Basisfarbe oder kühl/warm) · `h.accent` (choice: ein Akzent aus drei
  harmonischen Kandidaten) · `h.roles` (stage-edit: Rollen Grund & Text,
  Flächen, Akzent, Signal — die Rollen-Sprache aus dem Beispiel) ·
  `h.contrast` (derivation, PUR: Kontrast-Paare Text/Grund hell und dunkel
  mit AA/AAA-Urteil; ein Vorschlag, der AA reißt, wird nicht angeboten).
- **Preset-Vertrag zur Themes-Engine (A14, explizit):** der brand-Layer
  importiert `packages/themes/shared/ramp.ts` und `oklch.ts` als PURE
  Bibliothek (kein `app/`, kein Server, kein Zustand) — der einzige erlaubte
  Cross-Layer-Import, per ESLint-Ausnahme mit Begründung eingetragen. Die
  Engine bleibt unverändert; Brand Design erzeugt nur Werte in ihrer Form
  (`ThemeConfig`-kompatibel), damit Produkt 03 daraus Tokens und die
  Platform daraus ein Community-Theme machen KÖNNEN.

### 2.4 Kapitel `type` — Typografie

- Sessions: `i.pair` (choice: kuratierte Paare — die sechs aus dem
  Themes-Konzept §3.5 plus die G4-Namen, EIN Katalog `shared/brandFontPairs.ts`
  mit Familie, Stack, Rollen; Vorschau mit ECHTEN Schriften) · `i.scale`
  (derivation, PUR: Größen-/Gewichts-Hierarchie aus DNA „Typography" und
  „Composition" — ruhig/dicht/luftig) · `i.rules` (stage-edit:
  Überschriften-Gewicht, Laufweite, Versalien, Mono-Rolle).
- **Schriften laden:** `@nuxt/fonts` self-hostet nur, was der Build im CSS
  sieht — `apps/branding` deklariert die kuratierten Familien einmal in einer
  CSS-Datei (wie `fonts.css` der themes), nichts wird zur Laufzeit von einem
  CDN geholt. Font-Upload bleibt Phase 2 (der Bucket existiert).

### 2.5 Kapitel `mark` — das Zeichen in drei Stufen (§1.11 b)

1. **Richtung + Briefing:** `j.kind` (choice: Wortmarke · Bildmarke ·
   Kombination · Monogramm, mit Begründung aus DNA „Form Language" und
   Name) · `j.brief` (stage-edit, KI-Entwurf: Charakter, Formsprache,
   Schutzraum-Regel, Varianten-Bedarf, No-Gos, Einsatzorte — das Briefing,
   das ein Designer bekommt).
2. **Gesetzte Beispiele:** `j.examples` (derivation, PUR: Wortmarke und
   Monogramm als SVG aus Schriftpaar + Farbwelt — Generator
   `shared/brandMarkSvg.ts` nach dem Muster von `themes/shared/brandMark.ts`
   und `brandCard.ts`; Varianten: primär, invertiert, einfarbig, Icon-
   Fläche; Schutzraum als gezeichneter Rahmen; KEIN KI-Aufruf) · `j.pick`
   (choice: eine Setzung als Vorzugs-Beispiel).
3. **KI-Bildlogo-Bereich:** `j.drafts` (special, Editor `drafts`): auf
   Knopfdruck erzeugt ein Bildmodell 4 Entwürfe aus Briefing + DNA +
   Farbwelt; jeder Entwurf trägt Modell, Datum, Prompt-Hash und den
   Vermerk „Entwurf — Idee für die Designer-Arbeit, kein geprüftes Logo";
   Markenrechts-Hinweis im UI. Der Mensch kann Entwürfe BEHALTEN (kept)
   oder verwerfen; behaltene stehen im Kapitel und im Briefing, reisen aber
   NICHT in Foundation-Snapshot oder Share (§1.11 b). Leitplanken: Drossel
   3 Läufe je Marke und Tag + Instanz-Deckel, Kosten als
   `generation.*`-Ereignisse, ZDR-Routing wie beim Text (§2.12).

### 2.6 Kapitel `imagery` — Bildsprache & Ikonografie (eigene Vorschau, §1.11 a)

- Sessions: `k.photo` (derivation + choice: drei Bild-Prinzipien aus DNA
  „Imagery"/„Materiality"/„Mood" — Licht, Ausschnitt, Menschen, Farbigkeit,
  mit Begründung) · `k.illustration` (choice: keine · Linie · Fläche ·
  organisch, mit Regeln) · `k.icons` (choice: Linie/Fläche, rund/kantig,
  Strichstärke — Vorschau mit einem echten Icon-Set (Phosphor-Varianten))
  · `k.dodont` (stage-edit: Do & Don't der Bildsprache in der Foundation-Form).
- **Vorschau ohne Fotos:** Stil-Karten, die die Prinzipien DARSTELLEN
  (Kontrast, Wärme, Ausschnitt als abstrahierte Kompositionen aus Farbwelt
  und Form) plus — weil David KI-Bilder zulässt — optional zwei KI-
  Beispielbilder je Prinzip aus demselben Bild-Transport, gekennzeichnet
  wie die Logo-Entwürfe und mit derselben Drossel. Keine Stock-Fotos.

### 2.7 Kapitel `motion` — Bewegung mit Charakter (eigene Vorschau)

- Sessions: `l.tempo` (choice: ruhig · lebendig · knapp, aus DNA „Motion
  Character") · `l.transitions` (derivation, PUR: Dauern 150–250 ms, Easing,
  Versatz — als Token-Satz) · `l.logo` (choice: kinetisches Zeichen ja/nein,
  mit Regel für `prefers-reduced-motion`) · `l.rules` (stage-edit: wo
  Bewegung erlaubt ist und wo nie).
- **Vorschau:** die Szene (§2.9) spielt die Übergänge live — Knopf-Hover,
  Karten-Einblendung, Seitenwechsel — mit den gewählten Tokens und
  respektiert `prefers-reduced-motion` (dann stehen die Werte als Text).

### 2.8 Das Ergebnis: Preset, Kapitel 10, Snapshot

- **`BrandDesignPreset`** (Typ in `shared/types/brand.ts`, gebaut von der
  puren Regel `buildBrandDesign(values)` aus den bestätigten Slot-Werten —
  dieselbe Wahrheit wie bei G4, kein Spiegel): `{ version, dna, color: {
  base, rampLight, rampDark, neutral, accent, roles, contrastPairs }, type: {
  pair, scale, rules }, mark: { kind, brief, examples: svg[], keptDrafts:
  refs[] }, imagery: { principles, illustration, icons, dodont }, motion: {
  tempo, transitions, logo, rules } }`.
- **Kapitel 10 der Foundation** rendert das Preset VOLL: Farbwelt als Ramp-
  Streifen hell/dunkel + Rollen, Typografie als Specimen mit echten
  Schriften, Zeichen als SVG-Setzung (behaltene KI-Entwürfe NUR privat, als
  „Entwürfe"), Bild-Prinzipien mit Do/Don't, Motion-Regeln — die Schranke
  fällt, die Kapitel-Überschrift wird „Visuelle Identität". Ohne Brand Design
  bleibt G4 (Richtung + Schranke), unverändert.
- **Snapshot** steigt auf `schemaVersion: 2`: `presetId = 'design:<profileId>'`,
  `presetVersion = <Preset-Fassung>`, dazu das Preset EINGEFROREN (ohne
  KI-Entwürfe). Der Renderer liest v1 UND v2 (§2.7 des BF1-Konzepts).
- **Produkt 03** liest dasselbe Preset für Tokens — Brand Design erzeugt die
  Werte, exportiert sie aber nicht (Nicht-Ziel).

### 2.9 Vorschau-Szenen (§1.11 c)

Komponente `BwDesignScene` (brand-Layer): Hero mit Wortmarke, Überschrift +
Fließtext, Knopf, Zitat, Karte, Ramp-Streifen; Props = Preset-Ausschnitt;
alles über LOKALE CSS-Variablen im Scope der Szene (kein `:root`, keine
iframes — G4 hat das Muster bewiesen), echte Schriften per `font-family` aus
dem Katalog; hell/dunkel-Umschalter je Szene; drei Szenen nebeneinander für
Vergleiche (Moodboards, Basisfarben, Paare). Dieselbe Szene ist die Vorschau
in JEDEM Kapitel — eine Komponente, sechs Zustände.

### 2.10 Freischaltung je Marke (§1.11 d)

- `brand_profiles.designUnlockedAt` (Migration brand-020, additiv, null =
  gesperrt) + `designUnlockedBy` (Betreiber-Id). Setzt der Betreiber im
  Betreiber-Dashboard der branding-App (Liste „Brandings" existiert seit
  BW2/G-Paketen — neue Spalte/Knopf „Brand Design freischalten", Capability
  `brand.manage`); Ereignis `design.unlocked`.
- Kapitel 10 der Foundation: vor der Freischaltung der heutige CTA
  (Erstgespräch + Richtung), danach „Brand Design starten" → `/brand/:id/dna`.
- KEIN Stripe, kein Preis, keine Selbstbedienung in dieser Fassung.

### 2.11 Datenmodell und Migrationen (additiv)

- brand-020: `brand_profiles.designUnlockedAt/designUnlockedBy`.
- brand-021: Tabelle `brand_mark_drafts` (profileId, stepKey, kind
  'logo'|'image', model, promptHash, fileId, kept, createdAt; permissions [],
  server-only) + Bucket `brand-drafts` (permissions [], Auslieferung NUR über
  eine Route mit `requireBrandAccess` + Besitzprüfung, `Cache-Control:
  private`).
- Registry: sechs Steps, ~24 Sessions (Typ/Kind/audience/sensitivity), Frida.
  `audience`: alle Festlegungen `foundation`, Entwürfe (`j.drafts`,
  `k.photo`-KI-Bilder) `internal`.
- Journey: `includeStep` kennt die Freischaltung (Schicht 2 ohne
  `designUnlockedAt` ⇒ nicht auf dem Weg, NICHT „gesperrt" — sonst zählten
  die Kapitel im Fortschritt mit).

### 2.12 KI, Kosten, Drosseln

- Text (DNA, Briefing, Bild-Prinzipien): derselbe Transport
  (`advisorGenerator`, ZDR-Routing, Eimer wie der Wizard).
- **Bilder — NEU im Core:** `aiImage(event, prompt, options)` in
  `core/server/utils/aiComplete.ts`-Familie (eigener Commit): OpenAI-
  kompatibler `images/generations`-Weg über denselben Schlüssel, Modell aus
  `pukalani.ai.imageModel` (Core-Default aus), `providerRouting` mit
  denselben Datenschutz-Bedingungen wie der Text (§2.19 Frage 1: welcher
  Anbieter erfüllt ZDR für Bilder), Antwort = Bytes, die der brand-Layer in
  den Bucket legt. Drossel `imageDay`: 3 Läufe je Marke und Tag, 4 Bilder je
  Lauf, Instanz-Deckel 40 Läufe/Tag; jeder Lauf ein `generation.*`-Ereignis
  mit Modell, Dauer, Bildzahl — nie Prompt, nie Bild.

### 2.13 Sicherheit

- Entwürfe liegen server-only; die Ausliefer-Route prüft Besitz und setzt
  `private, no-store`; kein Bild reist in Snapshot, Share oder Beispiel.
- Prompts an das Bildmodell enthalten Foundation-Werte (wie der Text-Weg),
  nie Rohantworten mit `sensitivity: internal`.
- SVG-Setzungen werden aus Katalogwerten gebaut (kein Nutzer-SVG, kein
  Upload) — Sanitizer wie beim Markdown bleibt für Texte.
- Freischaltung ist eine Betreiber-Handlung mit Ereignis, nicht vom Client
  setzbar.

### 2.14 Messung

`design.unlocked`, `design.step.completed` (stepKey, Sekunden),
`design.image.generated` (kind, count, model, ms), Korrekturrate je
DNA-Dimension (wie oft „festhalten" vs. neu), Anteil behaltener Entwürfe,
Zeit von Freischaltung bis Kapitel 10 voll. Alles im Funnel (`brand_events`).

### 2.15 Prototyp (Phase 3, nach Freigabe) — ein Screen je Interaktionstyp

Im Playground mit Kailua: (1) drei Moodboards nebeneinander + Mix & Match;
(2) Farbwelt: Basisfarbe wählen, Ramp hell/dunkel in der Szene,
Kontrast-Matrix; (3) Typografie: Paar-Karten mit echten Schriften +
Specimen; (4) Zeichen: Richtung → Briefing → SVG-Setzungen → KI-Entwürfe mit
Kennzeichnung; (5) Bildsprache: Stil-Karten + Do/Don't; (6) Motion: Szene mit
Live-Übergängen + reduced-motion-Zustand; (7) Kapitel 10 voll; (8) Rail mit
gesperrter/offener Schicht 2 und Betreiber-Freischaltung.

### 2.16 Nicht-Ziele (diese Fassung)

Tokens-Export, brand.json, Figma (Produkt 03) · DAM, Vorlagen, Website
(03/04) · Umbau der Themes-Engine · Font-Upload · Rechtsprüfung von Zeichen
· Stripe/Preis · Extraktion des Ist-Zustands bestehender Websites (H6 — eigener
Baustein, Relaunch-Einstieg, nach dieser Fassung).

### 2.17 Abhängigkeiten und Fallen

- **Schriften nur per Build:** neue Familien müssen im CSS der App stehen,
  sonst fällt die Vorschau auf den Stack zurück (G4-Muster); der Katalog
  nennt deshalb nur, was deklariert ist — Test, der beide abgleicht.
- **A14-Import** aus `themes/shared` braucht die ESLint-Ausnahme MIT
  Begründung; alles andere aus themes bleibt tabu.
- **Bild-Transport ist Core** (eigener Commit, Core-Default aus, Config-
  Gate) — ohne Anbieter mit ZDR bleibt Stufe 3 abgeschaltet, das Kapitel
  funktioniert trotzdem (Stufe 1+2 sind pur).
- **Migrationen vor Deploy** (brand-020/021), Bucket-Anlage im Migrations-
  Skript; Schema-Parität eintragen.
- **Zeit (H5):** das Moodboard belegt alle Kapitel vor — jede Session muss
  als BESTÄTIGUNG durchlaufbar sein; die Beta misst die Dauer je Kapitel.

### 2.18 Pakete (Skizze — verbindlich nach Prototyp-Freigabe)

| # | Paket | Inhalt | Gate |
| --- | --- | --- | --- |
| D0 | Verträge | Registry-Steps + Sessions (Struktur), Vokabulare, Font-Paar-Katalog, `BrandDesignPreset`, `buildBrandDesign`, Ramp-Import als Vertrag, Journey mit Freischaltung | — |
| D1 | Freischaltung + Rail + Frida | brand-020, Betreiber-Knopf, Ereignis, Layer im Rail, Beraterin mit Leitern | **David:** Inhalte (Leitern, Zielsätze) |
| D2 | DNA + Moodboards | `g.*`, Szene `BwDesignScene`, Mix & Match | Davids Blick |
| D3 | Farbwelt | `h.*`, Ramp/Kontrast über den Vertrag | — |
| D4 | Typografie | `i.*`, Schriften im App-CSS, Specimen | — |
| D5 | Zeichen | D5a Richtung+Briefing, D5b SVG-Setzungen, D5c **Core** `aiImage` + Bucket/Tabelle (brand-021) + Entwürfe-Bereich | **David:** Bild-Anbieter/ZDR, Kosten |
| D6 | Bildsprache | `k.*`, Stil-Karten, optional KI-Beispiele | — |
| D7 | Motion | `l.*`, Live-Übergänge, reduced-motion | — |
| D8 | Kapitel 10 voll + Snapshot v2 + Beispiel Kailua mit Design | Renderer, Share, `/beispiel` | Davids Blick |
| D9 | Beweis-Skript | verify-brand-design: Freischaltung → sechs Kapitel → Preset → Kapitel 10 → Snapshot v2 → kein Entwurf im Share (Gegenprobe) | — |

### 2.19 Offene Entscheidungen für die Freigabe

| # | Frage | Empfehlung |
| --- | --- | --- |
| 1 | Bild-Anbieter für Stufe 3 und Bildsprache-Beispiele: welcher Anbieter über OpenRouter erfüllt die ZDR-Bedingung des Wizards für BILDER? | Vor D5c prüfen; bis dahin Stufe 3 hinter dem Config-Gate aus — das Kapitel funktioniert ohne sie |
| 2 | Freischaltung: Betreiber-Dashboard (Knopf je Branding) oder auch per Skript (`brand:unlock-design`)? | beides — Skript für den Anfang wie `brand:invite`, Knopf im Dashboard mit D1 |
| 3 | Kapitel-Namen (de): Moodboard · Farbwelt · Typografie · Zeichen · Bildsprache · Bewegung? | so, „Bewegung" statt „Motion" im UI, `motion` bleibt Id |

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
