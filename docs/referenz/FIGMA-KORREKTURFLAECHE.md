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

Drei Sammlungen, 33 Variablen, alle mit `scopes` und WEB-Code-Syntax
(`var(--…)`), damit Dev Mode den Rückweg kennt:

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

Zwei Fallen, die beim Bau zugeschlagen haben:

- `figma.createAutoLayout()` erzeugt Frames mit **weißer Standardfüllung**. Im
  hellen Modus unsichtbar, im dunklen liegt hinter jeder Zeile ein weißer
  Balken. Container ohne eigene Farbe brauchen `fills = []`.
- Der Geist-Stil heißt `SemiBold`, nicht `Semi Bold` (das ist Inters
  Schreibweise). Stilnamen immer über `listAvailableFontsAsync()` prüfen statt
  aus dem Gedächtnis zu schreiben.

Der Zustandsspeicher (IDs aller Sammlungen, Modi, Seiten, Variablen) liegt im
Sitzungs-Scratchpad als `figma-state.json` — bei einer neuen Sitzung wird er
aus der Datei rekonstruiert, nicht geraten.

## Offen

**Das Nuxt-UI-v4-Kit ist in Figma noch nicht als Bibliothek verfügbar** —
`get_libraries` zeigt nur Material 3, Simple Design System und die Apple-Kits.
Das Kit ist eine Community-Datei und muss **von David** dupliziert und als
Team-Bibliothek veröffentlicht werden; über MCP geht das nicht. Bis dahin steht
das Fundament (Variablen, Farbtafel, Seitengerüst), aber die Startseite kann
nicht mit echten Komponenten-Instanzen gespiegelt werden — und ohne die wäre
der Spiegel ein flacher Baum aus Einweg-Frames, der beim Nachziehen des Kits
komplett neu gebaut werden müsste.
