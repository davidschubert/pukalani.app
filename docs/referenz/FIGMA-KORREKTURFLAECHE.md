# Figma als Korrekturfläche (Pilot: marketing)

**Was das ist:** eine Figma-Datei, in die der aktuelle Code-Stand einer Seite
gespiegelt wird, damit David dort gestalterisch korrigieren kann — und Claude
die Korrekturen zurückliest und in Code übersetzt.

**Was das NICHT ist:** kein Entwurfsort. Die Datei ist **nie** die Wahrheit,
der Code ist es. Bei Widerspruch gewinnt das Repo, und vor jeder neuen
Korrekturrunde wird die Seite frisch aus dem Code gespiegelt. Ohne diese Regel
veraltet die Datei binnen Wochen — auf `main` laufen mehrere Sitzungen parallel.

Datei: <https://www.figma.com/design/9EfQtkeprx6O9dkGnmg1Eg>
(Team „Hawaii Studio"; Pro-Tarif nötig, weil Hell/Dunkel als Variablen-Modi laufen.)

## Warum marketing der Pilot ist, nicht portfolio

Gemessen am 2026-08-24:

| App | .vue-Dateien | Nuxt-UI-Tags | eigenes CSS |
|---|---|---|---|
| `apps/portfolio` | 14 | **1** (`<UApp>`) | 426 Zeilen `portfolio.css` |
| `apps/marketing` | 31 | **89**, 19 Sorten | im Layer, `ui:`-Verträge |
| `packages/admin` | 27 | 276, 37 Sorten | — |

portfolio ist ein vollständig eigenes Design-System (Syne, dunkel,
Glibbergreen) — das offizielle Nuxt-UI-Figma-Kit trägt dort **nichts** bei.
marketing ist der Gegenfall: die 19 verwendeten Komponenten sind genau die
Page-Templates des Kits (`UPageHero`, `UPageCard`, `UPageGrid`, `UPageCTA`,
`UPageFeature`), und das Aussehen steckt in ~600 Zeilen `ui:`-Overrides in
`apps/marketing/app/app.config.ts`. Dort ist jede gestalterische Korrektur
wörtlich eine `ui:`-Änderung — die sauberste Übersetzung Figma→Code im Repo.

## Der Zyklus

1. Claude spiegelt den Code-Stand in die Figma-Seite „Startseite".
2. David korrigiert dort.
3. Claude liest zurück (`get_metadata`, `get_variable_defs`, `get_screenshot`)
   und ordnet **jede** Abweichung einer von vier Klassen zu:

   | Klasse | Landet in |
   |---|---|
   | (a) Token | `packages/marketing/app/assets/css/puka-theme.css` |
   | (b) Prop / Variante | `ui:`-Vertrag in `apps/marketing/app/app.config.ts` |
   | (c) Layout / Komposition | Klassen in der Sektions-Komponente |
   | (d) geht nur mit neuem Custom-Code | **Rückfrage an David**, keine stille Umsetzung |

Klasse (d) ist die wichtige: eine Figma-Korrektur, die sich nicht im
Design-System ausdrücken lässt, ist keine Seitenkorrektur mehr, sondern eine
Design-System-Entscheidung. Setzt man sie still um, erodiert das System über
zwanzig kleine Ausnahmen — und genau das soll dieser Workflow verhindern, nicht
beschleunigen.

## Die Token-Brücke

Der Glücksfall dieses Projekts: unsere Theme-Dateien benutzen dieselbe
Namensordnung wie das Nuxt-UI-Kit (`--ui-color-primary-*`, `--ui-primary`,
`--ui-radius`, Tailwind-v4-Architektur). Ein Pukalani-Theme ist in Figma damit
kein Nachbau, sondern ein Variablen-Modus.

Drei Sammlungen, 41 Variablen, 7 Textstile — jede Variable mit gesetzten
`scopes` und WEB-Code-Syntax (`var(--…)`), damit Dev Mode den Rückweg kennt.
Nachgezählt, nicht geschätzt: keine Variable steht auf `ALL_SCOPES`, keine
ohne Syntax.

| Sammlung | Modi | Inhalt | Quelle |
|---|---|---|---|
| `Primitiv` | Wert | `puka/50…950` | `puka-theme.css` (Hex steht dort als Kommentar) |
| `Farbe` | Hell · Dunkel | `marke/*`, `grund/*`, `flaeche/*`, `schrift/*`, `cta/label` | `puka-theme.css` + `marketing.css` |
| `Mass` | Desktop | `raster/*`, `abstand/*`, `schrift/*` | `puka-theme.css` + `core/main.css` |

Die `marke/*`-Tokens sind **Aliase** auf die Ramp und tragen die
Modus-Verschiebung aus `puka-theme.css` mit: was die Seite `text-primary-600`
nennt, ist hell `puka-800` (WCAG AA) und dunkel `puka-400`.

## Grenzen, die man kennen muss

- **`clamp()` gibt es in Figma nicht.** Alle Abstände und Schriftgrade in
  `Mass` zeigen ihr **Desktop-Maximum**. Die mobile Untergrenze steht nur im
  Code und darf bei einer Korrektur nicht verloren gehen — sie steht deshalb in
  der Beschreibung jeder betroffenen Variablen.
- **Ein Aussehen, nicht 26×11.** Die Datei zeigt die marketing-Welt. Die
  Theme-Matrix des `themes`-Layers bleibt Sache des Generators.
- **Das Dashboard ist der schlechteste Kandidat** für Pixel-Korrekturen: dicht,
  zustandsbehaftet, und sein Aussehen soll laut CLAUDE.md bewusst aus den
  Nuxt-UI-Defaults kommen. Dort lohnt Figma für *Struktur* (Reihenfolge,
  Informationsdichte), nicht für Pixel.
- **demo / freelancer.supply sind Produktdesign, nicht Seitendesign.** Was dort
  geändert wird, trifft jede Kunden-Community.

## Betrieb

Die Figma-MCP-Skills sind **Pflicht** und werden über die MCP-Ressource geladen
(`skill://figma/…`), nicht als lokale Skills:

- `figma-use` — vor **jedem** `use_figma`-Aufruf
- `figma-create-new-file` — vor jedem `create_new_file`
- `figma-generate-design` — beim Spiegeln einer Seite

Elf Fallen, die beim Bau zugeschlagen haben — alle live erwischt:

- **Deckkraft hält nur, wenn sie in einem SPÄTEREN `use_figma`-Aufruf gesetzt
  wird als dem, der den Knoten erzeugt hat.** Zwei Schritte im selben Skript
  reichen NICHT — `node.fills = [paint]` gefolgt von
  `node.fills = node.fills.map(f => ({...f, opacity}))` landet trotzdem als
  `opacity: 1`, obwohl die Variablen-Bindung sitzt. Eine Korrektur an der
  HAUPTKOMPONENTE zieht bei bestehenden **Instanzen** ebenfalls nicht nach.
  Das war mit Abstand der teuerste Fehler dieses Baus: **62 Abweichungen über
  die ganze Seite** — jede Karte, jeder Hinweis, die Umschalter, die
  Preis-Karten, die Vergleichstabelle, das Produkt-Mock. Auf hellem Grund fiel
  es nicht auf (Papier bei 100 % statt 65 % ist nur etwas weißer), auf den
  akzentfarbenen Hinweiskästen dagegen sofort — die standen als massive dunkle
  Blöcke da. **Konsequenz: nach jedem Bau eine eigene Deckkraft-Runde fahren
  und gegen eine Soll-Tabelle nachmessen, nicht ansehen.**
- **Figma bricht innerhalb eines Skripts nicht neu um.** Wer eine Größe ändert
  und im selben Aufruf misst, liest den alten Stand — beim Ausmessen der
  natürlichen Kartenhöhen meldeten alle vier Karten denselben Wert. Messen
  gehört in einen eigenen Aufruf nach dem, der die Größe geändert hat.
- **Verlaufs-Stopps lassen sich an Variablen binden** (`boundVariables.color`
  je Stop) — nachgeprüft, nicht angenommen. Nur deshalb dreht die
  Licht-Dramaturgie im Dunkelmodus mit, statt hell einzufrieren.
- `figma.createAutoLayout()` erzeugt Frames mit **weißer Standardfüllung**. Im
  hellen Modus unsichtbar, im dunklen liegt hinter jeder Zeile ein weißer
  Balken. Container ohne eigene Farbe brauchen `fills = []`.
- **`swapComponent` vererbt die Überschreibungen der ALTEN Instanz.** Beim
  Tausch der Icon-Platzhalter gegen die echten Vektoren blieb die getönte
  Kreisfläche des Platzhalters als Instanz-Override hängen — aus jedem Icon
  wurde ein farbiges Quadrat. Nach einem Swap gehören geerbte `fills` auf der
  Instanz und ihren Wrapper-Frames geleert; Farbe trägt nur der `VECTOR`.
- **`createNodeFromSvg` liefert Rahmen mit `constraints: MIN/MIN`.** Verkleinert
  man die Instanz auf 17 px, bleibt der Inhalt bei 24 px stehen und läuft über.
  Der innere Rahmen jeder Icon-Komponente braucht
  `constraints = { horizontal: "SCALE", vertical: "SCALE" }` — dann zieht der
  Vektor beim Skalieren mit. In Instanzen lässt sich `constraints` **nicht**
  überschreiben (`This property cannot be overridden in an instance`), die
  Bedingung gehört also an die Komponente; bestehende Instanzen rechnen danach
  von selbst neu. Von Hand geht es auch über das Skalier-Werkzeug (`K`) statt
  des Auswahl-Werkzeugs — das skaliert den Inhalt unabhängig von den Bedingungen.
- Im `use_figma`-Kontext gibt es **kein `fetch`** — externe Daten (hier die
  SVG-Pfade) müssen im Skript mitgereicht werden.
- **Gleiche Kartenhöhe ist eine Falle mit doppeltem Boden.**
  `counterAxisAlignItems` kennt kein `STRETCH` (nur `MIN`/`MAX`/`CENTER`/
  `BASELINE`) — gleiche Höhe kommt über `layoutSizingVertical = "FILL"` an den
  KINDERN. Stehen dann aber ALLE Kinder auf `FILL`, hat der Container nichts
  mehr, woran er sich messen kann, und wird zu klein: Inhalt läuft unter die
  Polsterung. Verlässlich ist nur, das Defizit auszurechnen
  (`letztesKind.y + height` gegen `container.height − paddingBottom`) und die
  Reihe genau darum zu erhöhen.
- **`layoutGrow` auf einem TEXT schiebt nicht, es quetscht.** Der Versuch, den
  CTA einer Karte damit nach unten zu drücken, zwang den Beschreibungstext in
  die Resthöhe — er überlappte die Zeile darüber. Richtig ist ein leerer
  Abstandshalter-Frame mit `layoutGrow = 1` vor dem Knopf. In einer INSTANZ
  lässt sich kein Kind einfügen; der Abstandshalter gehört dann in die
  Hauptkomponente.
- Das `textCase`-Enum heißt `ORIGINAL`, nicht `NONE`.
- Der Geist-Stil heißt `SemiBold`, nicht `Semi Bold` (das ist Inters
  Schreibweise). Stilnamen immer über `listAvailableFontsAsync()` prüfen statt
  aus dem Gedächtnis zu schreiben. Text in Chips und Pillen braucht
  `textAutoResize = "WIDTH_AND_HEIGHT"`, sonst bricht es um.

Der Zustandsspeicher (IDs aller Sammlungen, Modi, Seiten, Variablen) liegt im
Sitzungs-Scratchpad als `figma-state.json` — bei einer neuen Sitzung wird er
aus der Datei rekonstruiert, nicht geraten.

## Stand

Die **Startseite ist vollständig gespiegelt**: 1440 × 11244 px, Kopfzeile, alle
14 Sektionen in der Reihenfolge des Codes, Fußzeile. Echte Texte aus den
i18n-Dateien, echte Maße aus dem `ui:`-Vertrag, die Licht-Dramaturgie
(`tone-cloud → mist → sky → dawn → noon → ink`) als variablengebundene Flächen
und Verläufe. Hell und Dunkel sind echte Variablen-Modi und beide am Rahmen
„Startseite — 1440" nachgeprüft — der Akzent springt dabei wie im CSS von
`puka-800` auf `puka-400`.

Neun Bausteine auf der Seite „Bausteine" (`UButton`, `UBadge`, `UPageCard`,
`UPageFeature`, `UAlert`, `UAccordionItem`, `UTabs`, `UPricingPlan`,
`USeparator`) — bewusst genau nach den Nuxt-UI-Komponenten benannt, damit sie
sich später per `swapComponent` gegen die echten tauschen lassen.

**Die Icons sind echt.** 25 Icon-Komponenten mit den Original-Vektoren, geholt
über die Iconify-API (`api.iconify.design/ph.json?icons=…` bzw. `lucide.json`)
— also derselbe Satz, den der Code über `@iconify` auflöst. Farbe an
`marke/akzent-schrift` gebunden, mit den Ausnahmen aus dem Markup
(`cloud-fog` + `arrow-down` gedämpft, `sun` auf `marke/primary`, Chevrons
gedämpft). Der Weg über die API ist reproduzierbar und braucht kein Plugin;
für neue Icons von Hand tut es das Iconify-Plugin in Figma.

Zwei Grenzen stehen auch auf dem Deckblatt der Datei:

1. **`clamp()` gibt es in Figma nicht** — alle Werte zeigen ihr Desktop-Maximum.
2. **Geist hat keinen Italic-Schnitt** — die zwei Refrain-Zeilen stehen
   aufrecht, im Browser sind sie kursiv.

## Offen

**Das Nuxt-UI-v4-Kit ist in Figma noch nicht als Bibliothek verfügbar** —
`get_libraries` zeigt nur Material 3, Simple Design System und die Apple-Kits.
Das Kit ist eine Community-Datei und muss **von David** in ein Team dupliziert
und als Bibliothek veröffentlicht werden; über MCP geht das nicht. Der Spiegel
ist dadurch nicht blockiert (die Bausteine sind lokal gebaut), aber mit dem Kit
kämen die echten Lucide-Icons und die Möglichkeit, Code Connect zwischen einer
Figma-Komponente und unserer `.vue`-Datei zu setzen.
