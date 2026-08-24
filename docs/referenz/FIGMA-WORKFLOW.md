# Figma-Workflow — Designs korrigieren, Code nachziehen

> Stand: 2026-08-24 · Status: **Fundament gelegt, Screens ausstehend** ·
> Datei: [Pukalani](https://www.figma.com/design/0aeddd526iyQH2OQuLNfsZ)
> (Team Hawaii Studio) · Kit: „⛰️ Nuxt UI v4 (Community)",
> `fileKey DX9liaYBYkcVmxXjacZPsG`.

David korrigiert Gestaltung dort, wo Gestaltung hingehört — in Figma. Claude
liest die Änderungen über den Figma-MCP, gleicht sie mit dem Code ab und setzt
sie um. Figma ist die KORREKTUR-Oberfläche, nicht die Wahrheit.

## Die zwei Grenzen, die den Workflow definieren

1. **Kein Auto-Sync.** Figma→Code ist immer ein Lese-/Abgleich-/Umsetzungs-
   schritt durch Claude. Dafür ist er präzise, weil die Frames auf
   Nuxt-UI-Kit-Instanzen stehen, die 1:1 auf unsere Komponenten zeigen.
2. **Der Code führt bei den Tokens.** Farben, Radien und Schriften entstehen in
   `packages/themes/theme.catalog.ts` → `public/themes/*.css` bzw. in
   `packages/core/app/assets/css/main.css`. Eine Farbkorrektur in Figma ist ein
   ANTRAG; umgesetzt wird sie über den Generator, nie als Hand-CSS.

## Die Token-Brücke steht ohne Umrechnung

Das Kit benennt seine Variablen wie unsere CSS-Variablen: Collection
`3 - Tokens` führt `--ui-bg`, `--ui-text`, `--ui-info` …, Collection
`0 - Nuxt UI Colors` die Ramps (`UIColors/Red/50` …). Das ist der Glücksfall
dieses Aufbaus — ein Figma-Wert lässt sich ohne Übersetzungstabelle einer
CSS-Variablen zuordnen.

Quellwerte für die Foundations-Seite:

| Was | Quelle | Wert |
|---|---|---|
| Marke „puka" (Marketing) | `packages/marketing/app/assets/css/puka-theme.css` | 50 `#fefbed` · 500 `#fbb337` („puka-sun") · 600 `#e96c0c` („puka-sun-deep") · 950 `#461705` |
| Default-Theme „Aloha" | `packages/core/app/assets/css/main.css` | Primary `black`/`white` (hell/dunkel), Neutral-Ramp `mist` (OKLCH), `--ui-radius: 0.5rem`, `--ui-container: 90rem` |
| Schrift | `--font-sans` in core | **Geist** — NICHT der Inter-Default |

Im Dark Mode verschiebt Marketing `--ui-color-primary-600/700` bewusst auf die
HELLEREN Stufen 400/300. Wer die Ramp in Figma spiegelt, muss diesen Sprung
mitnehmen, sonst stimmt der dunkle Modus nicht.

Bewusst NICHT gespiegelt: der 26×11-Katalog aus `theme.catalog.ts`. Der ist
Code-Sache; Figma trägt nur das Default-Theme und die Marke.

## Was das Kit abdeckt — und was nicht

Die Kit-Datei hat 29 Seiten, eine je Komponentenfamilie. Gemessen an unserer
tatsächlichen Nutzung:

- **Marketing: sehr gut.** `PageHero`, `PageSection`, `PageGrid`, `PageCard`,
  `PageFeature`, `Header`, `Footer`, `Accordion`, `Tabs`, `Badge` — fast genau
  das, was `apps/marketing` verwendet. Es fehlen `PageCTA`, `Alert`,
  `PricingPlan`.
- **Dashboard: nur die Bausteine.** Vorhanden sind `Button`, `Input`,
  `FormField`, `Table`, `DropdownMenu`, `Select`, `Pagination`, `Badge`,
  `Icon`. **Nicht** im Kit: die `UDashboard*`-Familie (Panel, Navbar, Sidebar)
  sowie `Card`, `Modal`, `Switch`, `Alert` — und die dominieren unser Dashboard
  (UDashboardPanel 40×, UCard 28×).

Folge: Die Dashboard-HÜLLE bauen wir als eigene Figma-Komponenten. Das ist kein
Mangel des Kits — die Hülle ist `packages/admin/app/layouts/dashboard.vue`,
also unser Code, nicht Nuxt-UI-Standard.

## Konventionen

- **Frame-Name = Route.** `marketing /`, `marketing /produkte/[slug]`,
  `dashboard /posts`. Damit ist die Zuordnung Design→Code eindeutig.
- **Sektionen tragen den Namen der Code-Komponente** (`HeroSection`,
  `PricingSection` …, siehe `apps/marketing/app/components/*Section.vue`).
- **Eine Datei, mehrere Pages** (`Foundations`, `Marketing`, `Dashboard`, später
  `Demo`, `Portfolio`, `Freelancer`) — Library-Anbindung und Variablen bleiben
  an einem Ort.

## Eine Korrektur-Runde

1. David ändert oder kommentiert in Figma.
2. Claude liest den Frame (`get_design_context`, `get_screenshot`).
3. Abgleich gegen den Code UND gegen einen Live-Screenshot des Dev-Servers.
4. Umsetzung: App-CSS, Komponenten-Props, `app.config`-UI-Overrides — Farben
   über den Theme-Generator.
5. Beweis-Screenshot zurück.

## Fallen, die schon zugeschnappt sind

- **`use_figma` ist die einzige Schreib-Naht** (Variablen, Frames, Komponenten).
  Steht sie nicht zur Verfügung, geht in Figma NICHTS — Lese-Tools und selbst
  `create_new_file` laufen davon unabhängig weiter und täuschen Fortschritt vor.
- **Berechtigungen: der MCP-Servername wechselt.** Nach einem Reconnect heißt
  der Figma-Server mal `mcp__Figma`, mal `mcp__<uuid>`. `.claude/settings.json`
  führt beide Formen. Die Datei wird nur BEIM SITZUNGSSTART gelesen — eine
  Ergänzung mitten in der Sitzung wirkt nicht mehr.
- **Der Komponenten-Suchindex ist unbrauchbar.** `search_design_system` liefert
  für „Button", „Card" und „Nuxt UI" dasselbe eine Fremdergebnis, obwohl
  Material 3 und Simple Design System der Datei zugeordnet sind. Komponenten-
  Keys holt man deshalb über Weg 2a-i des Skills: `use_figma` gegen die
  KIT-Datei, `node.parent.type === 'COMPONENT_SET' ? parent.key : node.key`.
  VARIABLEN findet die Suche dagegen zuverlässig.
- **Eine Community-URL ist kein `fileKey`.** `figma.com/community/file/<id>`
  taugt für `use_figma`/`get_metadata` nicht; es braucht die
  `/design/<fileKey>/…`-Form einer Datei IM Account. Und `figma.com`,
  `ui.nuxt.com`, `go.nuxt.com` sind hinter dem Egress-Proxy nicht erreichbar —
  den Link muss ein Mensch liefern.
- **Schrift explizit prüfen.** Ein Skript lädt klaglos Inter, wenn man es nicht
  hindert. Nach jedem Screen gegen `Geist` gegenprüfen.
