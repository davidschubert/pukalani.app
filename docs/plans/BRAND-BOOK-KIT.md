# Brand Book & Kit (Produkt 03) — Strategie

Status: **Phase 1 (Strategie) FREIGEGEBEN 2026-09-09** — geschrieben
2026-09-08, Davids acht Entscheidungen in **§1.11** (sieben nach Empfehlung,
der Betrag ist gesetzt: 149 € netto je Branding). Phase 2 (Konzeption, §2)
ist der nächste Schritt und beginnt erst auf Davids Startwort; kein Code
vorher. Kürzel in OPEN-ITEMS: **BK1**.

Arbeitsablauf: docs/referenz/WORKFLOW.md (Strategie ist Phase 1). Vorlage für
Aufbau und Tiefe: docs/archiv/BRAND-DESIGN.md §1 (Produkt 02).

---

## 0. Was das hier ist

Der Strang „Brand System" (Davids Entscheidung 2026-09-05, DECISION-LOG) läuft
BF1 Foundation-Leseansicht (✅ 2026-09-07) → Produkt 02 Brand Design
(✅ 2026-09-09) → **Produkt 03 Book & Kit**. Die beiden Vorgänger haben
ENTSCHIEDEN (Foundation) und GESTALTET (Design); Produkt 03 entscheidet
nichts Neues mehr, sondern **liefert aus**: das Brand Book als vollständiges
Handbuch, das Kit als maschinenlesbare Ausgaben (Design-Tokens, `brand.json`,
`brand.md` = „Brand Context") und die Assets (Zeichen, Pressekit). Der
Phase-1-Plan hat den Charakter der drei Schichten so festgeschrieben:
**Design = entscheiden · Book & Kit = kuratieren/exportieren · Experience =
anwenden.**

Dieses Dokument ist die Bestandsaufnahme: wo kommen wir her, wo stehen wir,
wo wollen wir hin — mit Konkurrenz, technischer Ausgangslage, Hypothesen und
den Entscheidungsfragen an David (§1.10). Die Antworten kommen nach §1.11;
die Konzeption folgt als §2 in dieser Datei.

---

## 1. Strategie

### 1.1 Wo kommen wir her

Was das Projekt zu Book & Kit schon FESTGELEGT hat (nichts davon ist neu zu
entscheiden):

- **Die Produktentscheidung (2026-08-27):** das Fundament ist frei, die
  Ableitung bezahlt. Book & Kit ist die Ableitung, die auf der Startseite als
  Erstes versprochen wird.
- **Der Schritt-Schnitt der Suite (Phase-1-Plan §5b, 2026-08-29, am Dummy
  entschieden):** „Brand Book & Kit (~8 Entscheidungen, meist Bestätigungen,
  ~15 Min): Brand Book (Kapitel aus den Schichten, Do/Don't, AI-Guidelines) ·
  Kit & Design Tokens (light/dark, Exporte CSS/Tailwind/Figma,
  maschinenlesbares brand.json) · Templates (Social-Set mit
  Wiedererkennungs-Ankern)." Dazu aus dem Marketing-Audit: **Pressekit** im
  Templates-Schritt (Logos, Boilerplate drei Längen, Fakten — „fast gratis
  aus Book + Kit").
- **Die vorgemerkte Scope-Liste (Phase-1-Plan §5b „In Phase 2 aufgenommen"):**
  Brand Kit als Design Tokens (light/dark, geprüfte Kontrast-Paare, gleiche
  Token-Namen in beiden Modi — „der größte Wettbewerbsvorsprung des ganzen
  Vorhabens"), Motion-Richtlinien, Bildsprache-System, Social-Template-Set +
  Content-Kompass, AI-Guidelines im Brand Book, maschinenlesbares
  Brand-Book-Modul (System-Prompt / brand.json), Nomenklatur-Regelwerk.
  **Vier davon sind seit Produkt 02 GEBAUT** (Motion, Bildsprache, Farbwelt/
  Ramp, Typografie, Zeichen) — Produkt 03 baut sie nicht noch einmal, es
  liefert sie aus.
- **„Brand Context" als benannter Export (DECISION-LOG 2026-09-05):** Produkt 03
  bekommt `brand.md` neben `brand.json` und den Design-Tokens. „Connect"
  (MCP/API) bleibt Phase 3+. Die Karte darüber: Discover → Audit → Compare →
  Build → **Supply**. Deckungsgleich, keine Entscheidung nötig: **kein DAM,
  kein Template-Editor.**
- **Der Name (DECISION-LOG 2026-09-05, BF1):** das freie Dokument heißt „Brand
  Foundation"; „Brand Book (24 Kapitel)" ist Produkt 03 und bezahlt. Kapitel 11
  der Foundation („Regeln für KI-Texte") ist ausdrücklich der **Teaser** auf
  das maschinenlesbare Modul aus Produkt 03; Export der Foundation ist
  Browser-Druck mit Print-CSS, kein Server-PDF.
- **Was die Startseite verspricht** (apps/branding, „Was am Ende auf dem
  Tisch liegt"): sechs Artefakte — **Brand Book** („24 Kapitel mit Do & Don't
  — inklusive AI-Guidelines"), **brand.json** („Stimme, Vokabular, Tabus —
  maschinenlesbar für jede KI"), **Design-Tokens** („Farbwelt hell/dunkel,
  Kontrast-geprüft — CSS, Tailwind, Figma", Beweis `--color-roast · #4a3123 ·
  AA geprüft`), **Pressekit** („Logos, Boilerplate in drei Längen"),
  **Content-Kompass** („3–5 Säulen mit Taktung") und **90-Tage-Plan** („Woche
  1–2 Launch-Story · 3–6 Content-Rhythmus · 7–12 Sichtbarkeit & GEO"). Die
  Team-Seite ordnet Stufe 3 „Produktion" so ein: „macht das Entschiedene
  versandfertig: Brand Book, Tokens, brand.json, Pressekit — nichts Neues,
  alles benutzbar." Die FAQ sagt: „bezahlt wird erst die Ableitung: Design,
  Brand Book, Kit."
- **Bezahlweg (BS1, Davids Entscheidungen 2026-09-07/08):** Einmalpreis je
  Branding über Stripe Checkout (Paket Z1, wartet auf A2 + R3), eigener
  Preis-Katalog für branding.supply, **B2B netto zzgl. USt**, Beta-Konten
  dauerhaft frei, Freischaltung als Feld an `brand_profiles` (Webhook +
  Betreiber-Schalter). **Offen in BS1 §9.2:** Name des Kaufgegenstands und
  Betrag — Vorschlag dort: „EIN Preis je Branding für ‚die Ableitung' =
  Marktvergleich + später Book & Kit". Für Brand Design gilt G4 unverändert:
  Studio-begleitet, kein Preis an der Schranke.
- **Extraktion des Ist-Zustands** (Farben/Schriften/Logo einer bestehenden
  Website als Relaunch-Einstieg, Hypothese H6 aus Produkt 02) ist laut
  OPEN-ITEMS „Produkt 03 vorbehalten" — sie steht damit auf dem Tisch dieser
  Strategie (Frage §1.10 g).

### 1.2 Wo stehen wir

Die sechs versprochenen Artefakte, am Code erhoben (2026-09-08):

| Versprochen | Was heute steht | Was fehlt |
| --- | --- | --- |
| **Brand Book, „24 Kapitel", Do & Don't, AI-Guidelines** | Foundation-Leseansicht `/brand/:id/foundation` mit **12 Kapiteln (0–11)**, gerendert vom puren `buildBrandFoundation` aus bestätigten Werten; Kapitel 10 „Visuelle Identität" ist seit Produkt 02 VOLL (Farbwelt, Typo-Specimen, Zeichen-SVG, Bild-Prinzipien, Motion) und hat das druckbare Ergebnis-Board `/brand/:id/design`; Do & Don't in Kapitel 5 (Werte), 6 (Stimme), 10 (Bildsprache `k.dodont`); Kapitel 11 „Regeln für KI-Texte" als fester i18n-Rahmen; Print-CSS; Share-Seite mit Snapshot v2 | Es gibt keine Zählung, die 24 ergibt. Es fehlen die REGEL-Kapitel, die ein Handbuch von einer Leseansicht unterscheiden: Zeichen-Anwendung (Schutzraum, Mindestgröße, Don'ts — Material liegt in `j.brief`), Farb-Anwendung (Rollen-Tabelle, Kontrast-Paare hell/dunkel — liegt im Preset), Nomenklatur (neu), AI-Guidelines als GUIDELINES statt Drei-Zeilen-Rahmen (Freigabe, Tabus, Prompt-Vorlagen), Anwendungsbeispiele |
| **brand.json** | nichts — in der Export-Karte der Leseansicht steht der Eintrag „brand.md · brand.json — Brand Context für KI-Agenten" seit BF1 **gesperrt mit Etikett „Brand Book & Kit"** | Schema, Route, Download; die Reise-Regel (`sessionTravels`) muss darin gelten |
| **brand.md** (Brand Context) | nichts (dieselbe gesperrte Karte) | Aufbau, Route, Download |
| **Design-Tokens CSS/Tailwind/Figma** | Das `BrandDesignPreset` trägt ALLE Werte: Basisfarbe, `rampLight`/`rampDark` (elf Stufen), Neutral-Ramp, Akzent, Rollen, **`contrastPairs`** (Urteil je Paar), Schriftpaar-Id + Skala + Regeln, Motion-`transitions` in ms mit Easing. Gerechnet, nie gespeichert (`loadBrandDesignPreset`, `null` bis alle sechs Kapitel abgenommen). Die Export-Karte zeigt „Design-Tokens — CSS, Tailwind, JSON" gesperrt | Token-Format(e), Namensschema, Route, Download, der Figma-Weg |
| **Pressekit** | Boilerplates in drei Längen (`ep.boilerplates`), Tagline, Zeichen als SVG (`j.examples`, `j.pick`), Fakten (`a.facts` — aber `sensitivity: internal`, reist NICHT) | das Bündel (Zip), eine bewusste Freigabe der Fakten, Bildregeln für Presse |
| **Content-Kompass** | nichts. Der Phase-1-Plan §5b ordnet ihn **Brand Experience** (Social) zu, die Startseite listet ihn unter den Artefakten | Zuordnung entscheiden (Frage e) |
| **90-Tage-Plan** | nichts. Der Rail-Text von Produkt 04 sagt „Assets und Pläne entlang des 90-Tage-Plans"; die Startseite listet ihn unter den Artefakten; der Rail-Text von Produkt 03 sagt „Book, Tokens, brand.json + Strategy Playbook" | Zuordnung entscheiden (Frage e) |

Dazu:

- **Die Schranke steht schon.** Die Export-Karte der Leseansicht hat vier
  Einträge: Drucken/PDF (frei, funktioniert) und drei gesperrte — Brand
  Context, Design-Tokens, Assets.zip („Logos, Vorlagen, Pressekit") — alle
  mit dem Etikett „Brand Book & Kit". Produkt 03 ist der Moment, in dem
  diese drei Knöpfe etwas tun.
- **Kapitel-Zählung:** die Startseite sagt 24, die Foundation hat 12, Produkt 02
  hat davon EINES gefüllt (Kapitel 10 als Sammelkapitel für fünf Dinge). Die
  Zahl ist ein Marketing-Versprechen aus der Dummy-Zeit ohne Deckung im
  Konzept — sie muss entweder durch eine Gliederung eingelöst oder auf die
  echte Zahl gebracht werden (Hypothese H1, Frage e).
- **Bezahlung:** kein Stripe im brand-Layer; Beta per Einladung. Z1 (Stripe
  Checkout je Branding) wartet auf A2 (Stripe echtes Geld) und R3 (Anwalt).
  Book & Kit wäre nach BS1 das ERSTE Selbstbedienungs-Produkt hinter einem
  Preis — Brand Design bleibt Studio-begleitet.
- **Berater:** `brandAdvisors.ts` kennt George, Vera, Milo, Nika, Otto
  (Foundation) und Frida (Design). Für „Produktion" gibt es keinen Berater;
  der Team-Text der Startseite nennt dort „Rex" — ein Rest der verworfenen
  Hunde-Welt (DECISION-LOG 2026-09-02), kein Steckbrief, kein Code (Frage f).
- **Themes-Engine als Token-Quelle:** `generateRamp`/`contrastRatio`/
  `wcagLevel` sind die Rechenregeln, die Produkt 02 schon über den
  A14-Vertrag nutzt; `customThemeCss` schreibt heute CSS-Variablen im
  Nuxt-UI-Namensschema (`--ui-color-primary-<stufe>`, `--ui-primary`,
  `--ui-radius`), und docs/referenz/FIGMA-KORREKTURFLAECHE.md hat die
  **Token-Brücke** nach Figma bereits beschrieben (drei Sammlungen, 41
  Variablen, Hell/Dunkel als Variablen-Modi).

### 1.3 Wo wollen wir hin — das Zielbild in einem Satz

**Book & Kit macht aus Foundation + Design ein LIEFERPAKET, das morgen in
Website, Redaktion, Designer-Briefing und KI-Werkzeugen arbeitet:** das Brand
Book als vollständiges, druckbares und teilbares Handbuch mit Regel-Kapiteln
und Do & Don't; das Kit als maschinenlesbare Ausgaben — Design-Tokens hell/
dunkel mit geprüften Kontrast-Paaren, `brand.json` und `brand.md` als Brand
Context für jede KI; die Assets als Bündel (Zeichen-SVGs, Pressekit). Alles
wird aus denselben bestätigten Werten GERECHNET, nichts gespeichert, nichts
ein zweites Mal entschieden; die wenigen Kapitel, die neu entstehen (AI-
Guidelines, Nomenklatur), sind kurze Bestätigungen in derselben Werkstatt.

Der Unterschied zu allem, was der Markt verkauft (§1.7): die Container
(Frontify, Corebook°, standards.site, Bynder) verwalten und machen KI-lesbar,
was jemand anderes entschieden hat; die Generatoren (Looka, Canva Brand Kit)
liefern Vorlagen ohne Herleitung. Wir liefern das Handbuch UND die Maschinen-
Form als ABLEITUNG einer Strategie, die im selben Werkzeug entstanden ist —
mit Begründung in jedem Kapitel und mit der Reise-Regel, die entscheidet, was
das Konto verlassen darf.

### 1.4 Was das Produkt BEWUSST NICHT behauptet

- **Kein DAM, kein Template-Editor** (DECISION-LOG 2026-09-05). Assets sind ein
  Bündel zum Herunterladen, kein verwalteter Bestand; Vorlagen werden nicht
  im Browser bearbeitet.
- **Kein „Connect".** MCP-Server, API-Zugriff und Live-Sync in fremde
  Werkzeuge bleiben Phase 3+. Brand Context ist eine DATEI, die der Kunde in
  ChatGPT, Claude, Cursor oder sein Redaktionssystem legt — das ist heute
  die tragfähigste Form (§1.7: `llms.txt`, Lovables `design.md`).
- **Kein Server-PDF, keine Figma-Datei.** Druck bleibt Browser-Druck mit
  Print-CSS (BF1-Entscheidung); Figma bekommt die Tokens als DTCG-JSON zum
  Import, nicht ein Plugin und nicht eine erzeugte Datei.
- **Keine Schriftdateien im Kit** (Hypothese H8): das Kit nennt Familien,
  Gewichte und Lizenz mit Quelle; die Dateien holt der Kunde bei der Quelle.
- **Keine neue Entscheidung über Farbe, Schrift, Zeichen, Bild, Motion.** Wer
  im Kit etwas ändern will, geht ins Design-Kapitel („Korrigieren" ist der
  einzige Rückweg — dieselbe Regel wie in der Foundation).
- **Keine Rechtsprüfung** von Zeichen oder Namen; keine Markenanmeldung.

### 1.5 Zielgruppe und Nutzen

| Wer | Nutzen von Book & Kit | Woran wir es messen |
| --- | --- | --- |
| Gründerin ohne Designer (Weiche „Neue Marke") | Farben, Schrift, Zeichen und Stimme liegen als DATEIEN vor, die Website-Baukasten, Canva, Tailwind und ChatGPT verstehen — die Marke ist am nächsten Tag benutzbar, nicht nur beschrieben | Downloads je Artefakt; Anteil der Design-fertigen Marken, die das Kit ziehen |
| Unternehmen im Relaunch (Weiche „Marken-Relaunch") | Ein Handbuch, das Agentur, Freelancer und Team auf denselben Stand bringt; Tokens, die die Entwicklerin direkt einbaut; `brand.md`, damit interne KI-Texte im Ton bleiben | Share-Aufrufe des Books durch Dritte; wiederholte Downloads nach Korrekturen |
| Studio-Kunde (Enterprise = Studio) | Das Briefing ist das Kit: Designer und Entwickler bekommen Tokens, SVGs und Regeln statt Folien — die Übergabe an Pukalani Studio wird billiger | Zeit bis zum ersten Design-Entwurf; Erstgespräche mit Kit im Anhang |
| Die Plattform selbst | `brand.json`/`brand.md` sind der Andockpunkt für spätere KI-Produkte (Community-KI in Markenstimme, SEO & GEO in Produkt 04, Monitoring) | interne Wiederverwendung des Schemas |

### 1.6 Technische Ausgangslage — was wir NICHT neu bauen

| Baustein | Existiert | Was Book & Kit daraus macht |
| --- | --- | --- |
| Foundation-Renderer | `shared/brandFoundation.ts` (`buildBrandFoundation`, pur, 12 Kapitel, Blöcke inkl. `aiRules`, `dodont`, `swatches`), Print-CSS, Inhaltsverzeichnis, Share-Seite | Das Book ist DIESELBE Leseansicht mit mehr Kapiteln und Regel-Blöcken — kein zweiter Renderer, keine zweite Seite |
| Reise-Regel | `sessionTravels` (audience + sensitivity), `brandShareableSlotValues`, fail-closed | Gilt WÖRTLICH für `brand.md`/`brand.json`/Pressekit: was nicht in den Share-Snapshot darf, darf nicht in einen Export. Fakten (`a.facts`, internal) brauchen für das Pressekit eine ausdrückliche Freigabe je Marke |
| Design-Preset | `BrandDesignPreset` v1 (`brandDesignValues.ts`, `loadBrandDesignPreset`), Snapshot v2 mit eingefrorenem Preset, `brandContrast`/`wcagLevel`, Ramps hell/dunkel | Die EINE Quelle der Tokens. Tokens werden bei jedem Abruf aus dem Preset gerechnet; Stand = `brandDesignStand` |
| Themes-Namensschema + Figma-Brücke | `customThemeCss` (`--ui-color-primary-*`), FIGMA-KORREKTURFLAECHE.md (Variablen-Modi Hell/Dunkel) | Namensschema der CSS-Ausgabe; der Figma-Weg ist DTCG-JSON-Import (Figma nativ seit Schema 2025) statt Plugin |
| Zeichen | `j.examples` (SVG-Quelltext), `j.pick`, Wortmarke/Monogramm aus Schriftpaar + Farbwelt (Produkt 02 D5b) | Assets-Bündel: SVG-Varianten (hell/dunkel, mono), plus PNG-Raster über den vorhandenen Weg? — Konzeptfrage; SVG ist gesetzt |
| Schriftpaare | `BRAND_FONT_PAIRS`, self-hosted über `@nuxt/fonts` | Kit nennt Familie/Gewichte/Quelle/Lizenz; keine Dateien (H8) |
| Werkstatt-Mechanik | Sessions, Zustandsmaschine, Abnahme, Korrektur-Regel, Berater, Bereitschafts-Gate, Eimer/Drosseln, ZDR-Routing | Schicht 3 = wenige Kapitel mit Bestätigungen (~8, ~15 Min), KI nur dort, wo etwas Neues entsteht (Frage f) |
| Export-Karte | `foundation.vue` `exportItems`: Drucken (frei) + drei gesperrte Einträge mit Etikett „Brand Book & Kit" | Die gesperrten Einträge werden Downloads; die Schranke bleibt für nicht freigeschaltete Marken |
| Freischaltung | `designUnlockedAt` + Ereignis (Produkt 02 D1, Betreiber-Schalter); BS1 Z1 plant ein Webhook-Feld an `brand_profiles` | Book & Kit hängt an dem BS1-Feld (Kauf) ODER an einem eigenen — Frage d |
| Beispielmarke | Kailua Coffee Co. (Discover, Anatomie-Seite, Design komplett) | Das öffentliche Beispiel-Kit: Book, Tokens, `brand.md` von Kailua als sichtbarer Beweis auf der Produktseite |
| Beweis-Werkzeuge | verify-Skripte, Playwright, Unit auf pure Regeln | Wie BF1/BD1; zusätzlich: Token-Datei gegen DTCG-Schema validieren, `brand.md` gegen die Reise-Regel prüfen |

### 1.7 Konkurrenz und Referenzen (Recherche 2026-09-08, Quellen in Anhang A)

Vier Sorten — und keine liefert Handbuch UND Maschinen-Form als Ableitung
einer Strategie:

1. **Guidelines-Container** — Frontify („brand intelligence… structured for
   humans and readable by AI", MCP-Server in Beta, Brand Assistant, Preis nur
   per Demo), Corebook° (KI erzeugt Guideline-Module, Figma-Sync, MCP für
   Agenten, ab 99 $/Monat für Brand Owner), standards.site (SVG-Logo hochladen
   → Farbvarianten automatisch, Pentagram/Gretel als Referenzen), Bynder (AI
   Control Center mit „Global AI Instructions", AI-Compliance-Agent). Sie
   hosten, was fertig ist; das KI-Lesbare ist ihr 2026-Verkaufsargument.
2. **Brand-Kit-Generatoren** — Looka Brand Kit (96 $/Jahr: Premium-Logodateien,
   300+ Vorlagen, Guidelines-Dokument; mit Website 129 $/Jahr), Canva Brand Kit
   (Farben/Schriften/Logos, „Brand Voice" mit 500 Zeichen + 3–5 Textproben,
   seit Februar 2026 in ChatGPT und seit Mai 2026 in Gemini eingehängt, Brand
   Kit Builder aus Website/PDF), Tailor Brands (199/249 $ pro Jahr). Vorlagen
   ohne Herleitung; die Stimme ist ein Textfeld.
3. **Token-Standards und -Werkzeuge** — das **W3C-DTCG-Format 2025.10** ist
   seit 28. Oktober 2025 die erste stabile Fassung (40+ Organisationen, u. a.
   Adobe, Figma, Google, Microsoft, Shopify); **Style Dictionary v5** liest es
   als Default (5.4.0 mit den 2025.10-Dimensionsobjekten und Hex-Fallback für
   Farbobjekte); **Figma** exportiert/importiert Variablen nativ als
   DTCG-JSON (Schema 2025), zusammengesetzte Tokens wie Typografie noch nicht;
   **Tailwind v4** definiert Tokens CSS-first im `@theme`-Block
   (`--color-*`, `--font-*`) und stellt sie zur Laufzeit als Variablen bereit.
   Alles Commodity — der Wert liegt darin, dass die Werte STIMMEN
   (hergeleitet, kontrastgeprüft, hell UND dunkel) und in einem Format
   kommen, das jedes dieser Werkzeuge liest.
4. **Kontext-Dateien für KI** — `llms.txt` (Markdown im Site-Root, Kernstück ist
   die Kurzbeschreibung im Blockquote, „Modelle zitieren sie direkt"),
   Lovables `design.md` („für KI-Agenten"), die Praxis „brand guidelines your
   agents can read" (Markdown + Tokens + Beispiele in einem Ordner). Keine
   Norm, aber eine klare Konvention: **Markdown für die Stimme, JSON für die
   Werte.**

**Was wir daraus machen:**

| Marktbefund | Folge für Book & Kit |
| --- | --- |
| Das KI-Lesbare ist 2026 das Verkaufsargument der Container (Frontify MCP, Corebook° MCP, Bynder AI Instructions, Canva in ChatGPT/Gemini) | `brand.md` + `brand.json` sind KEIN Nebenprodukt, sondern der Kern des Kits — die Markt-Lücke ist „KI-lesbar OHNE Plattform-Abo": eine Datei, die überall funktioniert. Connect (MCP) kommt später auf dieselben Daten |
| DTCG 2025.10 ist stabil und wird von Figma, Style Dictionary, Tokens Studio gelesen | EIN kanonisches `tokens.json` im DTCG-Format; CSS/Tailwind werden daraus ABGELEITET (nicht drei Wahrheiten). Figma = DTCG-Import, kein Plugin |
| Figma kann zusammengesetzte Tokens (Typografie) noch nicht nativ | Typografie-Tokens als Einzelwerte (family/weight/size) UND als Composite — der Import verliert dann nur die Bündelung, nicht die Werte |
| Tailwind v4 will `@theme` mit `--color-*`/`--font-*` | `tokens.css` trägt beide Blöcke: `:root`/`.dark`-Variablen im Themes-Namensschema UND einen `@theme`-Block — der Kunde kopiert den, der zu seinem Stack passt |
| Canva „Brand Voice" = 500 Zeichen; Frontify Brand Assistant beantwortet Fragen aus den Guidelines | Unser `brand.md` ist LÄNGER und STRUKTURIERT (Positionierung, Werte mit gelebten Beispielen, Ton-Wörter mit Stimmproben, Vokabular Benutzen/Meiden, Tabus, Boilerplates, Nomenklatur) — zum Einfügen als System-Prompt |
| Looka verkauft das Kit als Jahres-Abo, Corebook°/Frontify das Hosting als Abo; Brandmark einmalig | Wir: Einmalpreis je Branding (BS1) — das Kit gehört dem Kunden als Dateien, kein Hosting-Zwang. Der Preis muss „Dateien für immer" spiegeln, nicht „Zugang pro Jahr" (Frage d) |
| standards.site: Logo hochladen → Varianten automatisch | Unsere Zeichen entstehen als SVG aus Schriftpaar + Farbwelt — Varianten (hell/dunkel/mono) sind reine Ableitung |
| AI-Guidelines im Handbuch sind Kernbestandteil (Bynder: Guardrails, Freigabe-Workflow, Tabus, No-go-Zonen, Mensch entscheidet zuletzt) | Kapitel „AI-Guidelines" wächst über den Drei-Zeilen-Rahmen von Kapitel 11 hinaus: Was darf KI im Namen der Marke, Ton-Parameter, Tabus, Freigabe-Regel, Prompt-Vorlagen — mit einer kurzen KI-Session, weil das nicht rein ableitbar ist (Frage f) |

### 1.8 Geschäftsmodell-Einordnung

Book & Kit ist nach BS1 (Entscheidung 4, Einmalpreis je Branding) das erste
Produkt, das per **Selbstbedienung hinter einem Stripe-Checkout** steht —
Brand Design bleibt Studio-begleitet (G4). Drei Dinge folgen:

- **Der Kaufgegenstand (BS1 §9.2, offen):** BS1 schlägt EINEN Preis je
  Branding für „die Ableitung" = Marktvergleich + Book & Kit vor. Dagegen
  spräche nur, dass der Marktvergleich Analyse ist (Compare) und Book & Kit
  Lieferung (Supply). Dafür spricht: EIN Preis, EINE Schranke, EIN
  Webhook-Feld — und Kunden verstehen „die Ableitung" leichter als zwei
  Preise (Frage d).
- **Was ohne Brand Design im Kit steht:** Book & Kit kann auf der Foundation
  ALLEIN schon liefern (`brand.md`, `brand.json`, Pressekit-Texte, die
  verbalen Kapitel des Books); Design-Tokens und Zeichen-Assets brauchen das
  Preset, also alle sechs Design-Kapitel abgenommen. Verkauft man Book & Kit
  an eine Marke ohne Design, ist das Kit halb leer — das muss auf der
  Schranke ehrlich stehen („Tokens und Zeichen kommen mit Brand Design")
  oder das Produkt setzt Design voraus (Hypothese H6, Frage d).
- **Beta-Konten sind dauerhaft frei** (BS1 Entscheidung 6) — die Beta ist
  der Test, ob das Kit gezogen und benutzt wird, bevor der Preis steht.
- **Preisanker aus dem Markt** (Anhang A): Looka Brand Kit 96 $/Jahr, Web
  129 $/Jahr; Corebook° ab 99 $/Monat; Tailor Brands 199/249 $/Jahr; Brandmark
  einmalig. Unser Modell ist keines davon: einmal zahlen, Dateien behalten,
  Handbuch online teilbar solange die Marke im Konto liegt. Den BETRAG nennt
  David (BS1 §9.2 Nr. 2); die Strategie hält nur fest, dass ein Einmalpreis
  im niedrigen dreistelligen Netto-Bereich zum Markt passt und „Dateien für
  immer" gegen die Abos erklärt.

### 1.9 Risiken und Hypothesen (was die Konzeption/Beta klären muss)

- **H1 „24 Kapitel" ist ein Versprechen ohne Zählung.** Ein Handbuch auf 24
  Kapitel aufzublähen macht es schlechter (brandingstyleguides.com: 20–39
  SEITEN sind die Norm, nicht Kapitel). Die Zahl folgt der Gliederung, die
  Startseiten-Copy folgt der Zahl — nicht umgekehrt (Frage e).
- **H2 Drei Token-Wahrheiten.** CSS, Tailwind und Figma aus drei Generatoren
  laufen auseinander. EIN kanonisches DTCG-`tokens.json`, alles andere
  daraus abgeleitet und per Test deckungsgleich.
- **H3 Exporte veralten.** Ein heruntergeladenes Kit ist ein Stand. Jede Datei
  trägt Marke, Stand (Datum) und Fassung; Downloads werden als Ereignis
  gezählt; das Book online ist immer aktuell (gerechnet, nie gespeichert).
- **H4 Die Reise-Regel wird zum Leck.** `brand.md`/`brand.json` sind
  Exporte, die das Konto verlassen — sie MÜSSEN `sessionTravels` gehorchen
  (Wettbewerber-Namen, Beschwerden, Fakten reisen nicht). Pressekit-Fakten
  brauchen eine ausdrückliche Freigabe (Opt-in je Marke). Gegenprobe im Test
  wie bei G1.
- **H5 `brand.md` ist ein Prompt — seine Qualität ist messbar.** Beweis: ein
  Text, den ein Modell NUR mit `brand.md` schreibt, muss vom Brand-Check-
  Judge (Dokument-Check) als „im Ton" erkannt werden — dieselbe Maschine,
  keine neue.
- **H6 Kit ohne Design ist eine halbe Lieferung.** Ehrliche Schranke oder
  Voraussetzung — Frage d.
- **H7 KI-Kapitel kosten Eimer.** Jedes KI-Kapitel braucht Drossel, Eimer,
  Formvertrag, Live-Persona-Audit. Deshalb so wenige wie möglich (zwei),
  alles andere pure Ableitung (Frage f).
- **H8 Schriften-Lizenzen.** Self-hosted Familien (OFL/Google) dürfen wir
  ausliefern, aber die Lizenzpflichten reisen mit. Sicherer Weg: Familie,
  Gewichte, Quelle, Lizenz nennen, keine Dateien bündeln. Kunden-Schriften
  (Font-Upload, Themes) sind ohnehin nicht im Preset.
- **H9 Die Startseite verspricht Produkt-04-Dinge unter „am Ende auf dem
  Tisch".** Content-Kompass und 90-Tage-Plan sind laut Suite-Schnitt
  Experience — entweder ziehen sie als „Strategy Playbook" (Rail-Text von
  Produkt 03!) in Book & Kit, oder die Copy bekommt Produkt-Etiketten
  (Frage e).
- **H10 Extraktion (Relaunch-Einstieg) ist Build/Audit, nicht Supply.** Sie
  in Produkt 03 zu packen vermischt „liefern" mit „lesen"; als eigener
  Baustein davor oder danach bleibt Book & Kit klein (Frage g).

### 1.10 Fragen an David (die Konzeption braucht sie)

| # | Frage | Empfehlung | Alternative |
| --- | --- | --- | --- |
| a | Schnitt | **EIN Produkt „Book & Kit"** — Book ohne Kit ist eine schönere Leseansicht (die es frei schon gibt), Kit ohne Book sind Dateien ohne Regeln; EINE Schranke, EIN Kauf, EIN Rail-Layer | zwei Produkte (Book = Leseansicht/PDF-Ausbau, Kit = Tokens/Context/Assets) — zwei Preise, zwei Schranken, zwei Marketing-Texte |
| b | Ort | **Dritte Schicht derselben Werkstatt in `packages/brand`** — dieselbe Begründung wie bei Produkt 02 (DECISION-LOG 2026-09-07): Book & Kit setzt dasselbe Dokument, dieselbe Zustandsmaschine und dieselbe Reise-Regel fort; ein eigener Layer bräuchte einen expliziten Vertrag auf Preset, Renderer und `sessionTravels` — drei Verträge für null neue Datenhoheit | eigener Layer `kit` (Silo-Regel wörtlich: neues Produkt ⇒ eigener Layer) — sinnvoll erst, wenn Connect (MCP/API) als eigene Datenwelt kommt |
| c | Brand Context: Dateien und Token-Format | **Sechs Dateien, ein Bündel:** `brand.md` (Stimme, Werte, Positionierung, Vokabular, Tabus, Boilerplates, AI-Guidelines — als System-Prompt einsetzbar) · `brand.json` (dieselben Werte strukturiert + Design-Zusammenfassung) · `tokens.json` (**W3C DTCG 2025.10**, kanonisch: Farben hell/dunkel mit Kontrast-Paaren als Extension, Typo, Radius, Motion) · `tokens.css` (ABGELEITET: `:root`/`.dark`-Variablen im Themes-Namensschema + Tailwind-v4-`@theme`-Block) · Zeichen-SVGs (Wortmarke/Monogramm, hell/dunkel/mono) · `LICENSES.md` (Schriften: Familie, Gewichte, Quelle, Lizenz — keine Dateien). Figma = DTCG-Import | nur CSS-Variablen der Themes-Engine (schnell, aber Figma/Style-Dictionary außen vor) · Tailwind-Theme allein · Schriftdateien mitbündeln (Lizenzpflichten reisen mit, H8) |
| d | Bezahlt/frei | **Book & Kit = der BS1-Einmalpreis „Ableitung"** (ein Kauf je Branding, Beta-Konten frei), Freischaltung über das Z1-Webhook-Feld + Betreiber-Schalter. Frei bleibt die Foundation-Leseansicht inkl. Kapitel 11 (Teaser). **Kit-Teile, die Design brauchen (Tokens, Zeichen), zeigen ohne Preset ehrlich „kommt mit Brand Design"** — das Produkt setzt Design NICHT voraus, damit die verbale Hälfte (`brand.md`, Pressekit-Texte) auch Foundation-only-Marken erreicht. Den BETRAG nennt David (BS1 §9.2) | eigener Preis für Produkt 03 neben dem Marktvergleich · Book & Kit setzt abgenommenes Brand Design voraus (Kit immer voll, aber nur Studio-Kunden erreichen es) · Book frei, nur Kit bezahlt |
| e | Umfang der Kapitel | **Gliederung statt Zahl:** die 12 Kapitel der Foundation bleiben; neu als Regel-Kapitel: **Zeichen-Anwendung** (Schutzraum, Mindestgröße, Varianten, Don'ts — aus `j.brief`/`j.examples`, Ableitung), **Farb-Anwendung** (Rollen-Tabelle, Kontrast-Paare hell/dunkel — aus dem Preset, Ableitung), **Typografie-Anwendung** (Skala, Regeln — Ableitung), **Nomenklatur** (Namensmuster je Produkttyp — KI, Ausbau von B2), **AI-Guidelines** (Ausbau von Kapitel 11 — KI-Session), **Pressekit** (Boilerplates, Fakten mit Freigabe, Zeichen — Ableitung). Bildsprache und Motion bleiben in Kapitel 10 (schon voll). **Content-Kompass und 90-Tage-Plan gehen nach Produkt 04** (Suite-Schnitt), die Startseiten-Copy bekommt Produkt-Etiketten und die echte Kapitelzahl | „24 Kapitel" einlösen (Kapitel 10 in fünf Einzelkapitel teilen, Anwendungen aufsplitten — dann zählt es) · Content-Kompass + 90-Tage-Plan als „Strategy Playbook" in Produkt 03 (Rail-Text sagt das heute) · Nomenklatur streichen |
| f | KI-Anteil und Stimme | **Zwei KI-Kapitel, keine neue Stimme:** Nomenklatur entwirft **Otto** (Naming, existiert), AI-Guidelines entwirft **Nika** (Sprache, existiert); alles andere ist pure Ableitung ohne Frage. **George** übergibt und schließt (Gastgeber). „Rex" aus dem Team-Text verschwindet (Rest der Hunde-Welt); die Copy nennt die Rolle „Produktion" ohne neuen Namen | neue Stimme „Produktion" mit Steckbrief (Kosten: Persona-Audit, Team-Seite, i18n) · alle sechs Regel-Kapitel mit KI-Entwurf (mehr Eimer, mehr Audit, H7) · null KI (Nomenklatur und AI-Guidelines nur als Rahmen) |
| g | Extraktion des Ist-Zustands (Relaunch-Einstieg, H6 aus Produkt 02) | **Eigener Baustein NACH Book & Kit** („Brand Extract": URL → Farben/Schriften/Logo als Vorbelegung der Design-Kapitel), nicht Teil von 03 — Supply liefert, Extraktion liest | in Produkt 03 mitbauen (größer, andere Werkstatt-Stelle) · vor Book & Kit einschieben |

### 1.11 Entscheidungen (David, 2026-09-09, Fragenrunde) — die Strategie ist damit FREIGEGEBEN

§1.10 bleibt unverändert stehen: ohne die Empfehlungen wäre nicht mehr
nachvollziehbar, wovon abgewichen wurde.

| # | Frage | Entscheidung | Einordnung |
| --- | --- | --- | --- |
| a | Schnitt | **EIN Produkt „Book & Kit"** — eine Schranke, ein Kauf, ein Rail-Layer | nach Empfehlung |
| b | Ort | **Dritte Schicht derselben Werkstatt in `packages/brand`** — dasselbe Dokument, dieselbe Zustandsmaschine, dieselbe Reise-Regel; die Silo-Regel „neues Produkt ⇒ eigener Layer" wird wie bei Produkt 02 bewusst nicht angewandt (Begründung im DECISION-LOG) | nach Empfehlung |
| c | Brand Context | **Sechs Dateien, ein Bündel:** `brand.md` · `brand.json` · `tokens.json` (W3C DTCG 2025.10, KANONISCH) · `tokens.css` (abgeleitet: Themes-Variablen + Tailwind-v4-`@theme`) · Zeichen-SVGs (hell/dunkel/mono) · `LICENSES.md` (Schriften benannt, keine Dateien). Figma über DTCG-Import, kein Plugin | nach Empfehlung. Folge für die Konzeption: EIN Token-Modell, aus dem CSS/Tailwind gerechnet werden, mit Test auf Deckungsgleichheit (H2) |
| d | Bezahlt/frei | **Book & Kit = der BS1-Einmalpreis „Ableitung"** (ein Kauf je Branding, Marktvergleich im selben Preis, Beta-Konten frei), Freischaltung über das Z1-Webhook-Feld + Betreiber-Schalter. Frei bleibt die Foundation-Leseansicht inkl. Kapitel 11. Ohne abgenommenes Brand Design zeigen Tokens und Zeichen ehrlich „kommt mit Brand Design" — Design ist keine Voraussetzung | nach Empfehlung. Folge: BS1 §9.2 Nr. 1 (Name des Kaufgegenstands) ist damit inhaltlich beantwortet — „die Ableitung" = Marktvergleich + Book & Kit; der Wortlaut auf Seite/Rechnung bleibt eine Z1-Eingabe |
| e | Kapitel-Umfang | **Gliederung statt Zahl:** die 12 Foundation-Kapitel bleiben; neu als Regel-Kapitel Zeichen-Anwendung, Farb-Anwendung, Typografie-Anwendung, Pressekit (reine Ableitung) sowie Nomenklatur und AI-Guidelines (KI). **Content-Kompass und 90-Tage-Plan gehen nach Produkt 04** (Brand Experience); die Startseiten-Copy bekommt Produkt-Etiketten und die echte Kapitelzahl, der Rail-Text von Produkt 03 verliert „Strategy Playbook" | nach Empfehlung. Folge: die „24 Kapitel" der Startseite werden in der Konzeption durch die gezählte Gliederung ersetzt (Copy-Änderung, kein Buch-Aufblähen, H1) |
| f | KI-Anteil und Stimme | **Zwei KI-Kapitel, keine neue Stimme:** Nomenklatur entwirft Otto, AI-Guidelines entwirft Nika; alles andere pure Ableitung ohne Frage; George übergibt und schließt. „Rex" verschwindet aus dem Team-Text, die Rolle heißt „Produktion" | nach Empfehlung. Folge: zwei Eimer, zwei Formverträge, zwei Persona-Audits (H7) |
| g | Extraktion des Ist-Zustands | **Eigener Baustein NACH Book & Kit** („Brand Extract": URL → Farben/Schriften/Logo als Vorbelegung der Design-Kapitel) — nicht Teil von 03 | nach Empfehlung. Folge: eigene Zeile in OPEN-ITEMS erst, wenn BK1 gebaut ist; bis dahin Vermerk in der BK1-Zeile |
| — | Betrag | **149 € netto je Branding** (B2B, einmalig) für „die Ableitung" | GEGEN die Empfehlung „offen lassen bis Z1". Leitplanke: der Betrag ist die Eingabe für den Preis-Katalog in BS1 Z1 (`tax_behavior: 'exclusive'`), erscheint aber vor Z1 NIRGENDS im Produkt — an der Schranke steht bis dahin weiter kein Preis (G4-Logik), und die Beta bleibt frei. Markt-Einordnung: unter Looka Brand Kit + Website (129 $/Jahr) auf zwei Jahre, über Looka Kit (96 $/Jahr) im ersten Jahr |

Nächste Phase: **Konzeption** (§2 in dieser Datei) — Verträge für das
Token-Modell (DTCG-Schema, Ableitung CSS/Tailwind, Kontrast-Paare als
Extension), `brand.md`/`brand.json`-Aufbau mit Reise-Regel, die neuen
Regel-Kapitel als Sessions der Schicht 3 (Otto/Nika-Leitern als Davids
Inhalts-Gate), Assets-Bündel, Freischaltung über das Z1-Feld, Messung
(Downloads als Ereignisse, H5-Beweis über den Dokument-Check), Pakete.

---

## Anhang A — Recherche-Quellen (2026-09-08)

| Quelle | Sorte | Kernaussage für uns |
| --- | --- | --- |
| [w3.org/community/design-tokens — „first stable version" (2025-10-28)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) · [designtokens.org/tr/drafts/format](https://www.designtokens.org/tr/drafts/format/) | Token-Standard | DTCG Format 2025.10 ist die erste stabile Fassung; 40+ Organisationen (Adobe, Figma, Google, Microsoft, Shopify, Salesforce); Theming, moderne Farbräume, Cross-Tool |
| [styledictionary.com/info/dtcg](https://styledictionary.com/info/dtcg/) · [style-dictionary Issue #1590](https://github.com/style-dictionary/style-dictionary/issues/1590) · [Releases](https://github.com/style-dictionary/style-dictionary/releases) | Token-Werkzeug | v5 liest DTCG als Default; 5.4.0 unterstützt 2025.10-Dimensionsobjekte und Hex-Fallback für Farbobjekte |
| [misha.wtf — DTCG Design Tokens in Figma](https://www.misha.wtf/blog/figma-dtcg-design-tokens) · [forum.figma.com — DTCG composite export](https://forum.figma.com/suggest-a-feature-11/dtcg-composite-token-export-support-51314) | Figma | Nativer Variablen-Export/-Import als DTCG-JSON (Schema 2025); zusammengesetzte Tokens (Typografie, Schatten) noch nicht; `description` fehlt im Export |
| [tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4) | CSS-Framework | Tokens CSS-first im `@theme`-Block (`--color-*`, `--font-*`), zur Laufzeit als CSS-Variablen verfügbar |
| [frontify.com/en/blog/frontify-mcp](https://www.frontify.com/en/blog/frontify-mcp) · [frontify.com/en/ai](https://www.frontify.com/en/ai) · [getmasset.com — Frontify MCP (Beta)](https://www.getmasset.com/resources/blog/frontify-mcp-server) | Container (Enterprise) | „Brand intelligence… readable by AI"; MCP-Server verbindet Claude/ChatGPT mit Live-Guidelines; Brand Assistant beantwortet Fragen aus den Guidelines; Preis per Demo |
| [corebook.io](https://www.corebook.io/) · [corebook.io/price/brand-owners](https://www.corebook.io/price/brand-owners) · [matchstic — AI-Ready Brand Guidelines Software 2026](https://learn.matchstic.com/ai-ready-brand-guidelines-software-the-2026-rankings) | Container (KMU/Agentur) | Corebook° AI erzeugt Guideline-Module, Figma-Sync, MCP für Agenten; ab 99 $/Monat (Brand Owners); Ranking: „keine maschinenlesbare Auslieferung außerhalb der Plattform" |
| [standards.site/for-agencies](https://standards.site/for-agencies/) · [overmatter.design — 10 Plattformen](https://www.overmatter.design/blog/best-brand-guidelines-software-compare-10-platforms-for-designers-agencies) | Container (Agentur) | SVG-Logo hochladen → Farbvarianten automatisch; Custom Domain; Pentagram/Gretel; Pro/Enterprise, oberes Mittelfeld |
| [bynder.com — AI Control Center](https://support.bynder.com/hc/en-us/articles/36132580207506-AI-Control-Center-Setting-up-Global-AI-Instructions-and-more) · [bynder.com — AI compliance agent](https://www.bynder.com/en/press-media/bynder-expands-ai-agent-capabilities/) · [cloudcampaign.com — AI Brand Guidelines 2026](https://www.cloudcampaign.com/blog/ai-brand-guidelines) · [monigle.com — guidelines into AI-ready systems](https://www.monigle.com/blog/converting-brand-guidelines-into-ai-ready-systems/) | DAM + Ratgeber | AI-Guidelines als Kernbestandteil: Guardrails, Freigabe-Workflow, Tabus/No-go-Zonen, Markenzeichen-Schreibweisen, Mensch entscheidet zuletzt; „Global AI Instructions" als Produktfeature |
| [businesswire — Canva in AI-Assistenten (2026-02-05)](https://www.businesswire.com/news/home/20260205384226/en/Canva-Brings-On-Brand-Designs-Directly-into-AI-Assistants) · [canva.com/help/brand-voice](https://www.canva.com/help/brand-voice/) · [canva.com/help/brand-kit-builder](https://www.canva.com/help/brand-kit-builder/) | Generator/Container | Brand Kit in ChatGPT (Feb 2026) und Gemini (Mai 2026); „Brand Voice" = 500 Zeichen + 3–5 Textproben, nur Pro/Teams; Brand Kit Builder aus Website/PDF |
| [costbench.com — Looka Pricing 2026](https://costbench.com/software/ai-design-tools/looka/) · [checkthat.ai — Looka](https://checkthat.ai/brands/looka/pricing) | Generator (Abo) | Brand Kit 96 $/Jahr: Premium-Logodateien + 300+ Vorlagen + Guidelines-Dokument; mit Website 129 $/Jahr; Auto-Verlängerung |
| [llmstxt.org-Praxis: bluehost.com — What is llms.txt (2026)](https://www.bluehost.com/blog/what-is-llms-txt/) · [everything-pr.com — llms.txt and the Brand AI Crawl Layer](https://everything-pr.com/llms-txt-and-the-brand-ai-crawl-layer) · [bodkin.studio — Brand guidelines your agents can read](https://www.bodkin.studio/blog/brand-guidelines-your-agents-can-read) | Kontext-Dateien für KI | Markdown im Site-Root; Kurzbeschreibung im Blockquote als „System-Prompt"; Marken veröffentlichen ein kleines Kit für Maschinen; Guidelines als Markdown + Tokens für Agenten |
| lovable.dev Brand Kit Extractor (BF1 Anhang A) | Extraktor | URL → Farben (WCAG), Schriften, Voice, Tokens (JSON/CSS/Tailwind), PDF, `design.md` für KI-Agenten |
| Frontify-Guide, Corebook°, standards.site, Brandkit, brandingstyleguides.com, boston.gov, HubSpot (BF1 Anhang A) | Container/Galerien/Ratgeber | Kapitelmuster und Umfangs-Norm (20–39 Seiten) — s. docs/archiv/BRAND-FOUNDATION-LESEANSICHT.md Anhang A |
| Looka/Tailor Brands/Brandmark-Preise (BS1 Anhang) | Preisformen | Einmalig je Marke ist etabliert (Looka-Logo, Brandmark); das PFLEGEN wird als Abo verkauft (Looka Brand Kit, Frontify) — s. docs/plans/BRANDING-SUPPLY-RECHT-UND-BEZAHLUNG.md §3.3 |
