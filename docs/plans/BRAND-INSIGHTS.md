# Brand Insights — Redaktionskonzept (BI1)

Status: **Redaktionskonzept ENTSCHIEDEN 2026-09-07** (Davids zwölf Antworten,
§1); die Strategie-/Konzept-Runde nach [referenz/WORKFLOW.md](../referenz/WORKFLOW.md)
folgt **nach DB1** („Discover Brands"). Dieses Dokument hält fest, WAS entschieden
ist und welche Leitplanken daran hängen — es ist keine Arbeitsliste. Was von BI1
offen ist, steht ausschliesslich in [OPEN-ITEMS.md](../OPEN-ITEMS.md) (Zeile `BI1`).

## 0. Was das hier ist

„Brand Insights" ist der redaktionelle Bereich von branding.supply. Vorgemerkt
ist er seit dem 2026-08-29 im Phase-1-Plan, Abschnitt „Journal &
Content-Intelligence" ([BRAND-WIZARD-PHASE-1.md](BRAND-WIZARD-PHASE-1.md)); dort
stehen auch die Nav-Benennung vom 2026-08-30 (**„Brand Insights"** statt
„Journal", die Galerie daneben heisst **„Discover Brands"**), YouTube als
Research-Signal, der Content Opportunity Score, die Pipeline
Discover → Analyze → Research → Brief → Draft → Review → Publish → Update, die
Informationsarchitektur `/brands/<name>` · `/rankings/` · `/topics/` · `/journal/`
und der Positionierungs-Split (branding.supply = Datenautorität, Davids eigene
Site = Experte). Der [DECISION-LOG-Eintrag vom 2026-09-07](../DECISION-LOG.md)
hat DB1 und BI1 als eigene Vorhaben notiert und BI1 an ein Redaktionskonzept
gebunden — das ist dieses Dokument.

Der Klickdummy liegt im brand-Playground und ist die Vorlage für alles, was §2
beschreibt: `packages/brand/.playground/app/pages/brand/demo/{journal,artikel,
profil,duell,anatomie,discover}.vue`.

Die drei Bausteine, auf denen BI1 aufsetzt, EXISTIEREN bereits:

| Baustein | Was er liefert | Wo |
| --- | --- | --- |
| **Brand-Check** | Brand Score 0–100 mit Band, 8 Kategorien, 3 Befunde mit Beleg; Ranking nur mit `rankingOptIn`; Branche per KI + Korrekturvorschlag-Workflow | [archiv/BRAND-CHECK.md](../archiv/BRAND-CHECK.md) · [archiv/BRAND-CHECK-SEITE.md](../archiv/BRAND-CHECK-SEITE.md) |
| **Marktvergleich** | handgeprüfte Bibliothek echter Marken, Abruf mit robots/TDM, Zitatschranke ≤ 200 Zeichen, Bot-Seite, Rechts-Check mit sechs Anwaltsfragen (Anhang G) | [archiv/BRAND-MARKTVERGLEICH.md](../archiv/BRAND-MARKTVERGLEICH.md) |
| **Discover Brands (DB1)** | die öffentlichen Profil-Seiten EIGENER Kunden-Brands — Voraussetzung, s. §6 | [OPEN-ITEMS.md](../OPEN-ITEMS.md) Zeile 10 |

---

## 1. Das Redaktionskonzept — Davids zwölf Entscheidungen (2026-09-07)

Fragenrunde vom 2026-09-07. Die Spalte „Empfehlung war" ist bewusst mitgeführt:
wo David ANDERS entschieden hat, steht der Grund für die Leitplanke daneben.
**Fünf der zwölf Antworten weichen von der Empfehlung ab** (1, 3, 4, 6, 9) — vier
davon tragen ausdrückliche Leitplanken, die Sprach-Entscheidung (3) braucht keine.

| # | Frage | Entscheidung | Empfehlung war | Leitplanke |
| --- | --- | --- | --- | --- |
| 1 | Welche Formate zum Start? | **Alle vier**: Markenprofile (Entity-Seiten), Brand-Duelle, Artikel, Rankings | **abweichend** — Profile + Duelle zuerst, Artikel/Rankings nachziehen | Das Launch-Paket (#5) ist die Mengen-Bremse: vier Formate, aber gezählte Stücke. Kein Format geht live, bevor es EINEN vollständigen, redigierten Beispiel-Beitrag hat |
| 2 | Wer produziert? | **KI entwirft, David redigiert und veröffentlicht** — nichts geht ohne sein Zeichen live | nach Empfehlung (wie die Marktvergleichs-Bibliothek) | Freigabe ist ein ZUSTAND, kein Vorsatz (§3): der Entwurf ist ohne Davids Zeichen nicht veröffentlichbar |
| 3 | Sprache | **Grundfassung je Beitrag frei wählbar (Deutsch ODER Englisch)**, am Ende ein Knopf zur Übersetzung in die jeweils andere Sprache | **abweichend** — fest Deutsch als Grundfassung | Die Grundsprache wird je Beitrag GESPEICHERT (anders als beim UGC-Muster, wo es keine gespeicherte Ausgangssprache gibt) — sonst weiss niemand, welche Fassung die redigierte ist |
| 4 | Autor | **Wir-Stimme ohne Namen** | **abweichend** — David namentlich (Positionierungs-Split, E-E-A-T) | Keine erfundenen Autoren, nie. Das Beraterteam des Wizards (George, Vera, …) ist NIE Autor. Die Autorenprofil-Verknüpfung zu Davids Site aus dem Phase-1-Plan ENTFÄLLT; verantwortlich zeichnet ein Redaktions-Impressum (§4, Anwaltsfrage 4) |
| 5 | Rhythmus | **Launch-Paket ≈ 10 Profile · 3 Duelle · 5 Artikel · 1 Ranking**, danach **zwei Stücke je Woche** | nach Empfehlung | Der Wochentakt ist eine Zusage an die Redaktion, kein Automatismus: ohne Davids Zeichen erscheint auch in einer Woche nichts |
| 6 | Quellen | Eigene Websites der Marken · eigene Daten (Brand-Check, Bibliothek, Marktvergleich) · **YouTube-Data-API als Themenradar VON ANFANG AN** · Presse (z. B. bei Rebranding) · Wikipedia | **abweichend** — YouTube erst später, keine Presse, keine Wikipedia | Vier Leitplanken, ausformuliert in §4: (a) Fremdquellen mit Quelle + Datum und als „Fremdquelle" gekennzeichnet — nie als Eigenaussage der Marke; (b) Zitatschranke ≤ 200 Zeichen mit Belegpflicht (§ 51 UrhG); (c) Wikipedia nur mit CC-BY-SA-Namensnennung, keine Volltextübernahme; (d) YouTube nur Metadaten/Kommentare über die offizielle Data API, kein Transkript-Scraping, Quellvideo eingebettet — als Teilprojekt „Themenradar" mit eigenem Gate |
| 7 | Bewertung fremder Marken | **NUR der bestehende Brand-Check-Score**, Methodik offengelegt; der Text ist Einordnung im Kritik-/Meinungs-Stil | nach Empfehlung (deckungsgleich mit Marktvergleich §7.3) | Keine zweite Skala, kein „Insights-Score". Eine Zahl je Marke, dieselbe wie im Produkt, mit Link auf die Methodik-Seite |
| 8 | Technik | **Eigene Tabellen im brand-Layer, Redaktion im Dashboard** — `UEditor`, Sprachfassungen je Beitrag, Übersetzung per Knopf nach dem UGC-Muster, Freigabe als Zustand | nach Empfehlung | Der Werkzeug-Vorrat des `UEditor` ist an `core/shared/markdown.ts` gekoppelt (CLAUDE.md) — was der Parser nicht kann, steht als roher Text im Beitrag |
| 9 | Ziel und Messung | **Alle drei gleich gewichtet**: Umwandlung (Wizard/Brand-Check), Reichweite/Suchmaschinen, Newsletter | **abweichend** — Umwandlung zuerst, Reichweite als Folge, Newsletter später | Je Format trotzdem **EIN** klarer Einstieg: Profil → Brand-Check · Duell → Vergleich · Artikel → Wizard. Der Newsletter braucht Versand, Double-Opt-in und Rechtstexte und ist ein **eigenes Teilpaket, nicht im Launch** |
| 10 | Bilder | **Nur eigene Grafiken und Farbwelt-Kacheln** | nach Empfehlung | Keine fremden Logos, keine Screenshots fremder Websites — auch nicht als Favicon oder Thumbnail (dieselbe Erlaubnisliste wie im market-Layer, Anhang G (a)) |
| 11 | Reaktionen der Marken | **Korrekturweg wie im Brand-Check** (Vorschlag → Betreiber prüft → annehmen/ablehnen mit Begründung; Profil beanspruchen und mit bestätigten Feldern ergänzen) **plus öffentliche Methodik-Seite** | nach Empfehlung | „Entfernen auf Wunsch" ist der Notausgang und wird ohne Diskussion gewährt — dokumentiert mit Datum und Grund |
| 12 | Reihenfolge | **Erst Discover Brands (DB1), dann Insights (BI1)** | nach Empfehlung | DB1 liefert die Profil-Seiten, auf denen BI1 aufsetzt (§6) |

---

## 2. Die vier Formate

Jedes Format hat EINEN Zweck, EINEN Einstieg (Entscheidung 9) und einen Aufbau,
der schon im Klickdummy steht. Die Themen-Achse ist über alle Formate dieselbe
(Entscheidung 7: eine Zahl, eine Methodik).

**Themencluster** (aus dem Dummy `journal.vue`): Rebranding · Brand Psychology ·
Brand Analysis · Brand Strategy · Brand Language · SEO & GEO · Brand Experience
(die Filterzeile führt zusätzlich Visual Identity). Sie sind zugleich die
`/topics/`-Ebene der Informationsarchitektur.

### 2.1 Markenprofil (Entity-Seite einer externen Marke)

- **Zweck:** die Datenautorität — zu einer bekannten Marke steht hier mehr
  Struktur als irgendwo sonst: Score, Zeichen, Historie, Beziehungen.
- **Aufbau (Dummy `profil.vue`, Beispiel Nike):** Hero mit Farbwelt-Kachel,
  Score-Ring + Band, Steckbrief-Zeile (Branche · Land · seit · Archetyp) ·
  **Score v2 komplett** (die acht Dimensionen Eigenständigkeit, Visuelle
  Identität, Konsistenz, Markenerlebnis, Positionierung & Klarheit, Emotionale
  Wirkung, Anpassungsfähigkeit, Handwerk) · **eigenständige Markenzeichen**
  (Symbol, Claim, Typografie, Farbe — je ein Satz mit Beleg) · **Historie**
  (Jahr + ein Satz) · **Beziehungen** (Wettbewerber mit Score) · verknüpfte
  Artikel · Einstieg in den Vergleich.
- **Datenquelle:** Brand-Check-Score der öffentlichen Website (Entscheidung 7) ·
  handgeprüfte Bibliotheks-Einträge des Marktvergleichs (Zitat + Quelle +
  Prüfdatum) · Presse/Wikipedia für Historie und Fakten, gekennzeichnet (§4).
- **Einstieg:** „Wie schlägt sich deine Marke?" → **Brand-Check**.
- **Beispiele aus dem Dummy:** Nike, IKEA, Rolex, Adidas, On, Puma.

### 2.2 Brand-Duell

- **Zweck:** der Vergleich als Statistik-Tafel — zwei Marken, Dimension für
  Dimension, mit klarem Sieger je Zeile.
- **Aufbau (Dummy `duell.vue`, Nike vs. Adidas):** Aufstellung mit zwei
  Score-Ringen und „VS", Zwischenstand („5 Dimensionen an X · 3 an Y") ·
  **acht Dimensionen als gespiegelte Balken**, Sieger je Zeile im Akzent ·
  **Zahlen & Fakten** (Gegründet · Claim · Zeichen · Agentur-Beziehung ·
  Archetyp) · redaktionelle Einordnung im Meinungs-Stil · CTA.
- **Datenquelle:** zwei Markenprofile (2.1). Die Faktenzeile ist **redaktionell
  gepflegt**, nicht abgeleitet — „Agentur-Beziehung" steht auf keiner Website
  (offene Frage §8).
- **Einstieg:** „Wie schlägt sich deine Marke im Duell?" → **Vergleich**
  (Quartett/Marktvergleich).
- **Später:** eigene Brand gegen Referenz-Brand („Vergleiche deine Brand mit
  Nike") — nicht im Launch.

### 2.3 Artikel

- **Zweck:** die Suchmaschinen- und Verständnis-Ebene: eine Frage, die
  nachweislich gestellt wird, vollständig beantwortet.
- **Aufbau (Dummy `artikel.vue`, „Warum Luxusmarken ihre Serifen aufgeben"):**
  zentrierter Kopf (Datum · Topic · Lesezeit) mit zwei CTAs · Teilen-Zeile ·
  **sticky Inhaltsverzeichnis mit Scrollspy** · Fliesstext mit Zwischen-Kapiteln
  · **ein breites Chart** aus eigenen, redaktionell erhobenen Zahlen ·
  Abschnitt „Insight aus der Knowledge Base" · Abschnitt „Erwähnte Brands"
  (Profil-Verknüpfung mit Score) · **„Quellvideo" / Further watching** (§4 d) ·
  CTA-Banner · „Mehr lesen".
- **Datenquelle:** eigene Daten zuerst (Brand-Check-Auswertungen, Bibliothek,
  Marktvergleich), Fremdquellen als Beleg mit Datum.
- **Einstieg:** „Starte dein Branding" → **Wizard**.
- **Beispiel-Themen aus dem Dummy:** „Was kostet ein Rebranding wirklich?" ·
  „Warum Banken blau sind — und wann du es nicht sein solltest" · „IKEA: Wie ein
  Möbelhaus zur Weltmarke wurde" · „Der Content-Kompass: 3–5 Säulen statt
  Posting-Panik" · „Tagline vs. Slogan" · „llms.txt: Wie KI-Assistenten deine
  Marke zitieren" · „Unboxing als Markenmoment" · „Warum gute Namen unbequem sind".

### 2.4 Ranking

- **Zweck:** die kuratierte Liste nach Branding-Qualität — der Einstiegspunkt,
  der sich am besten teilen und verlinken lässt.
- **Aufbau:** Liste der Profile mit Score-Ring, Band und einem Satz Begründung;
  Filter nach Topic/Branche, Sortierung wie im Dummy (`journal.vue`:
  Neueste · Meistgelesen · Kürzeste Lesezeit; `discover.vue`: Brand Score · Am
  besten bewertet · Trending · Neueste); Grid/Liste über `?display=` (teilbare
  Ansicht); über der Liste die **Methodik-Zeile** mit Link (Entscheidung 7/11).
- **Datenquelle:** ausschliesslich Brand-Check-Scores der aufgeführten Profile.
- **Einstieg:** „Deine Marke in dieser Liste?" → **Brand-Check**.
- **Abgrenzung:** das Kunden-Ranking des Brand-Checks (mit `rankingOptIn`) und
  das redaktionelle Ranking sind ZWEI Listen — Kundendaten wandern nie ohne
  Opt-in in eine redaktionelle Liste.

---

## 3. Der Redaktionsprozess

### 3.1 Pipeline und Rollen

Die acht Stufen aus dem Phase-1-Plan, mit der Rollenaufteilung aus
Entscheidung 2 (**KI entwirft, David redigiert und veröffentlicht**):

| Stufe | Wer | Was dabei entsteht |
| --- | --- | --- |
| **Discover** | Themenradar (§3.3) + Redaktion | Kandidaten-Themen mit Content Opportunity Score |
| **Analyze** | KI | Was gibt es dazu schon, wo ist die Lücke, welches Format passt |
| **Research** | KI + Redaktion | Quellenliste mit Datum, Zitate ≤ 200 Zeichen, eigene Daten |
| **Brief** | Redaktion | Kernaussage, Gliederung, Einstieg/CTA — Davids Zeichen ist hier optional, aber üblich |
| **Draft** | KI | Entwurf in der gewählten Grundsprache (Entscheidung 3) |
| **Review** | **David** | redigiert im Dashboard, prüft jeden Beleg — das ist das Zeichen |
| **Publish** | **David** | Zustand `freigegeben`; erst danach ist der Beitrag öffentlich |
| **Update** | Redaktion | Score neu ermittelt, Fakten geändert, Korrekturvorschlag angenommen ⇒ Zustand `aktualisieren` |

### 3.2 Freigabe-Zustände

`entwurf` → `redaktion` → `freigegeben` → `übersetzt` → (`aktualisieren` →
`redaktion` → …). **Der Zustand ist die Sicherung, nicht die Disziplin**: die
öffentliche Route liest ausschliesslich `freigegeben`/`übersetzt` (dieselbe
Lehre wie das `status: 'verified'`-Tor der Marktvergleichs-Bibliothek, Anhang G).
`übersetzt` heisst: die zweite Sprachfassung liegt vor und ist redigiert — eine
maschinell erzeugte, unredigierte Fassung ist NIE öffentlich.

### 3.3 Launch-Paket und Wochentakt

**Launch-Paket (Entscheidung 5):** ≈ 10 Markenprofile · 3 Duelle · 5 Artikel ·
1 Ranking. Danach **zwei Stücke je Woche** in freier Mischung der vier Formate.
Vor dem Launch steht je Format EIN vollständig redigierter Beispiel-Beitrag
(Leitplanke zu Entscheidung 1) — die Formate gehen erst danach in Serie.

### 3.4 Teilprojekt „Themenradar" (eigenes Gate)

YouTube ist **Research-Signal, nie Quelle zum Umformulieren** (Phase-1-Plan).
Der Radar liest über die offizielle **YouTube Data API** Metadaten und
Kommentare, rechnet einen normalisierten Popularity-Score (Views relativ zur
Kanalgrösse) und daraus den **Content Opportunity Score** (0–100 aus
Performance, Alter, Suchnachfrage, Konkurrenz, Relevanz) — Ergebnis ist eine
priorisierte Themenliste für die Stufe *Discover*.

Es ist ein **eigenes Teilpaket mit eigenem Gate**: es geht erst scharf, wenn
API-Schlüssel und Kontingent stehen (§6) und die Datenschutz-Leitplanke aus
§4 (d) umgesetzt ist. BI1 ist ohne Radar lieferbar — die Themen kommen dann von
Hand.

---

## 4. Quellen- und Rechtsrahmen

Der Rahmen des Marktvergleichs gilt weiter und wird hier nur ERWEITERT, nicht
gelockert. Grundlage: [archiv/BRAND-MARKTVERGLEICH.md](../archiv/BRAND-MARKTVERGLEICH.md)
§1.7 (Produktregeln) und **Anhang G** (Rechts-Check der Namensnennung mit sechs
Anwaltsfragen — **zum Stand dieser Zeile unbeantwortet**).

### 4.1 Die vier Quellen-Leitplanken (zu Entscheidung 6)

1. **Herkunft ist immer sichtbar.** Jede Fremdquelle trägt Quelle + Datum und
   ist als **„Fremdquelle"** gekennzeichnet — nie als Eigenaussage der Marke.
   Die Bibliotheksregel „nur die eigene Website" gilt unverändert für
   Marktprofil und Bibliothek; **Insights darf darüber hinaus zitieren**, und
   genau deshalb muss die Kennzeichnung tragen.
2. **Zitatschranke wie im Marktvergleich:** ≤ 200 Zeichen je Zitat, Belegpflicht,
   Zitatzweck nach § 51 UrhG (Beleg/Auseinandersetzung, nie Schmuck), Link auf
   die Originalseite.
3. **Wikipedia** nur unter **CC BY-SA mit Namensnennung** (Artikel + Lizenzlink),
   **keine Volltextübernahme** — Fakten und Daten, keine übernommenen Absätze.
4. **YouTube** nur **Metadaten und Kommentare über die offizielle Data API** als
   Signal; **kein Transkript-Scraping**. Das Quellvideo wird eingebettet
   („Further watching") — Traffic für den Creator statt Content-Klau.
   Kommentare sind **personenbezogene Daten**: sie werden nur **aggregiert**
   ausgewertet und **nie mit Nutzernamen gespeichert**. API-Quoten und
   Datenschutz sind Teil des Gates (§3.4).

### 4.2 Bewertung, Bilder, Reaktionen

- **Score (7):** ausschliesslich der bestehende Brand-Check-Score, mit
  offengelegter Methodik; der Text ist Einordnung im Kritik-/Meinungs-Stil,
  nominative Markennennung, keine Herabsetzung (UWG-Massstab wie M3).
- **Bilder (10):** nur eigene Grafiken und Farbwelt-Kacheln. Keine fremden
  Logos, Bildmarken, Favicons oder Screenshots — als **Erlaubnisliste** der
  erlaubten Felder gesichert, nicht als Sperrliste (Lehre aus M6b).
- **Reaktionen (11):** Korrekturvorschlag wie im Brand-Check (Vorschlag →
  Betreiber prüft → annehmen/ablehnen mit Begründung) · „Profil beanspruchen"
  mit bestätigten Feldern · **Entfernen auf Wunsch als Notausgang**, mit Datum
  und Grund dokumentiert.
- **Methodik-Seite:** öffentlich, verlinkt von jedem Score und jedem Ranking —
  sie erklärt die 40 Kriterien in 8 Kategorien, das Band, „nicht von aussen
  prüfbar" und den Korrekturweg. Sie ist zugleich die Antwort auf die Frage
  „warum dürft ihr das".

### 4.3 Neue Fragen an den Anwalt (zusätzlich zu Anhang G (a)–(f))

Die sechs Fragen aus Anhang G bleiben offen und gelten hier unverändert
(fremde Markennamen im bezahlten Produkt und im Marketing · Zitate ≤ 200 Zeichen ·
TDM-Vorbehalt § 44b UrhG · § 6 UWG · DSGVO/PII · Datenbank-Herstellerrecht
§ 87b UrhG). **Vier kommen durch BI1 hinzu:**

1. **Presse- und Wikipedia-Zitate.** Trägt der Zitatzweck (§ 51 UrhG) auch in
   einem redaktionellen Beitrag eines GEWERBLICHEN Anbieters, der am Ende auf
   das eigene kostenpflichtige Produkt führt? Und bei Wikipedia: genügen
   Namensnennung + Lizenzlink, oder färbt **CC BY-SA (Share-alike)** auf unseren
   Beitrag ab, sobald wir mehr als Fakten übernehmen?
2. **YouTube-Kommentare.** Ist die aggregierte Auswertung von Kommentaren über
   die Data API als Marktforschung zulässig (Art. 6 Abs. 1 lit. f DSGVO), wenn
   Nutzernamen nie gespeichert werden — und was verlangen die
   **YouTube-API-Nutzungsbedingungen** dazu (Speicherfristen, Verbot abgeleiteter
   Datensätze)? Zusatz: reicht die reguläre Einbettung des Quellvideos, oder
   braucht es eine Zwei-Klick-Lösung?
3. **Kritik/Meinung bei einem Score fremder Marken.** Darf ein Score 0–100 einer
   fremden Marke, erhoben und veröffentlicht OHNE deren Zustimmung, in einem
   gewerblichen Angebot stehen — Meinungsfreiheit (Art. 5 GG) gegen
   Unternehmenspersönlichkeitsrecht und § 824 BGB? Genügt die offengelegte
   Methodik plus Korrekturweg, oder braucht es eine Anhörung vor der
   Veröffentlichung?
4. **Wir-Stimme ohne verantwortlichen Autor.** Ein journalistisch-redaktionelles
   Angebot braucht nach § 18 Abs. 2 MStV einen Verantwortlichen mit Namen und
   Anschrift. Genügt ein **Redaktions-Impressum** („Verantwortlich i. S. d. § 18
   Abs. 2 MStV: …"), wenn unter den Beiträgen selbst nur die namenlose
   Wir-Stimme steht (Entscheidung 4)?

---

## 5. Datenmodell und Technik (Skizze — keine Migration)

Entscheidung 8: **eigene Tabellen im brand-Layer, Redaktion im Dashboard.** Das
Folgende ist eine SKIZZE für die Konzeptrunde, keine Schema-Zusage; ob BI1 im
brand-Layer oder in einem eigenen Layer wohnt, ist offen (§8).

### 5.1 `insights_posts` — der Beitrag

Server-only, Permissions `[]` wie alle brand-Tabellen. Ein Beitrag JEDES Formats
ist EINE Zeile — vier Formate mit einem Zustandsmodell statt vier Tabellen.

| Feld | Zweck |
| --- | --- |
| `format` | `profile` · `duel` · `article` · `ranking` |
| `slug`, `topics` | Adresse und Themencluster (`/topics/`) |
| `baseLocale` | **`de` oder `en`** — die redigierte Grundfassung (Entscheidung 3) |
| `titleDe/En`, `dekDe/En`, `bodyDe/En` | Sprachfassungen; Body als **MEDIUMTEXT** (`createMediumtextColumn` — das MariaDB-Zeilenbudget trägt keinen langen Artikel) |
| `state` | `entwurf` · `redaktion` · `freigegeben` · `übersetzt` · `aktualisieren` (§3.2) |
| `sources` | Quellenliste als JSON: `{url, publisher, date, kind: 'brand-site'\|'press'\|'wikipedia'\|'youtube'\|'own-data', quote ≤ 200}` |
| `brandRefs` | Marken-Bezug als JSON: Bibliotheks-Schlüssel und/oder `brand_checks.$id` je genannter Marke |
| `publishedAt`, `updatedAt`, `reviewedBy` | wer wann freigegeben hat |

**`insights_sources` als eigene Tabelle?** In Phase 1 **nein**: solange keine
Quelle über Beiträge hinweg gesucht oder gezählt wird, ist die JSON-Spalte die
billigere Wahrheit (kein Index, keine zweite Migration). Sie wird nötig, sobald
eine Quelle EIGENE Fristen bekommt (Auffrischung wie die 90-Tage-Regel der
Bibliothek) — das ist die Kippfrage, nicht der Geschmack.

### 5.2 Verknüpfungen

- **`brand_checks`** liefert Score, Band und die acht Kategoriewerte je genannter
  Marke (Entscheidung 7). Offen: wer den Check einer fremden Marke ANSTÖSST und
  auf wessen Deckel (§8).
- **Marktvergleichs-Bibliothek** (`packages/market/shared/library/index.ts`,
  Einträge mit `status: 'verified'`, Prüfdatum, Beleg) ist die Faktenquelle für
  Markenprofile — handgeprüft, nicht neu erhoben.
- **Discover-Profile (DB1)** für eigene Kunden-Brands: verlinkt, nie kopiert;
  ein Kunden-Profil erscheint in Insights nur mit demselben Opt-in wie im
  Ranking.

### 5.3 Redaktion im Dashboard

`UEditor` mit den Regeln aus CLAUDE.md (Werkzeug-Vorrat an
`core/shared/markdown.ts` gekoppelt, `gfm: false` beim Lesen, `bodyToSave`) ·
zwei Sprach-Reiter · Zustands-Umschalter mit Begründungsfeld · **Übersetzen-Knopf**
nach dem UGC-Muster (Cache-Treffer VOR jeder Drossel; Ergebnis landet als
Entwurf der zweiten Fassung, nie direkt öffentlich) · Vorschau-Link auf die
öffentliche Seite im Zustand `redaktion`.

### 5.4 Messung

Server-Ereignisse im bestehenden `brand_events`-Muster (`insights.view`,
`insights.cta_click` mit Format, `insights.share`, `insights.correction_submitted`),
dazu **Plausible-Ziele je Format** entlang der drei gleichgewichteten Ziele
(Entscheidung 9): Profil → Brand-Check gestartet · Duell → Vergleich geöffnet ·
Artikel → Wizard gestartet · alle → Newsletter-Eintrag (sobald das Teilpaket
steht).

---

## 6. Abhängigkeiten und Reihenfolge

1. **DB1 „Discover Brands" zuerst** (Entscheidung 12) — DB1 baut die
   öffentlichen Profil-Seiten und den Rechtsrahmen für öffentliche Marken-Daten;
   BI1 setzt beides fort.
2. **Anwalt** — die sechs Fragen aus Anhang G plus die vier neuen aus §4.3.
   Ohne Antwort auf Frage 3 (Score fremder Marken) und 4 (Verantwortlicher)
   geht kein Markenprofil live.
3. **YouTube-API-Zugang** — Projekt, Schlüssel, Kontingent. Gate des Teilprojekts
   „Themenradar" (§3.4); BI1 ist ohne den Radar lieferbar.
4. **Newsletter-Teilpaket** — Versand, Double-Opt-in, Rechtstexte. Eigenes Paket,
   **nicht im Launch** (Leitplanke zu Entscheidung 9); das Muster liegt in der
   Warteliste von branding.supply (brand-012/brand-015).
5. **Rechtstexte branding.supply** — Impressum/Datenschutz stehen dort noch aus
   (OPEN-ITEMS-Strang A1). Ein Redaktions-Impressum (§4.3 Frage 4) hängt daran.
6. **Bau-Gates wie bei jedem neuen Vorhaben:** `check:bilanz`, Schema-Parität,
   Manifest-Check, GDPR-Contributor bei neuen Tabellen; Prod-Migrationen nur mit
   Davids ausdrücklichem Ja.

---

## 7. Nicht-Ziele

Kein zweiter Score neben dem Brand-Check · keine automatische Veröffentlichung
ohne Davids Zeichen · kein Transkript-Scraping und keine Volltext-Übernahme aus
Presse oder Wikipedia · keine fremden Logos, Bildmarken, Favicons oder
Screenshots · keine erfundenen Autoren und kein Beraterteam als Autor · keine
Gastautoren · **kein Newsletter im Launch** · keine Kommentare oder
Community-Funktionen unter den Beiträgen · keine Leser-Auto-Übersetzung (Knopf
statt Automatik, wie beim UGC-Muster) · keine Bewertungsplattform- oder
Social-Quellen (Plattform-AGB, PII — wie im Marktvergleich) · kein CMS-Produkt
für Kunden (die Redaktion ist unsere, nicht ihre).

---

## 8. Offene Fragen für die Konzeptrunde

Die Runde findet nach DB1 statt (Entscheidung 12); dies sind die Fragen, die
sie beantworten muss:

1. **Wo wohnt BI1?** Eigener Layer `insights` (Silo-Regel „neues Produkt ⇒
   eigener Layer") oder Tabellen im brand-Layer wie in Entscheidung 8 skizziert
   — Brand Design hat 2026-09-07 den Gegen-Präzedenzfall gesetzt (Schicht 2
   derselben Werkstatt statt eigener Layer).
2. **Adressen.** Die Informationsarchitektur nennt `/brands/<name>` ·
   `/rankings/` · `/topics/` · `/journal/`, die Navigation heisst „Brand
   Insights" — welche URL-Basis gilt, und wie trägt sie das i18n-Präfix
   (Muster: Slug oder Id)?
3. **Profil (BI1) und Anatomie (DB1)** sind im Dummy zwei Seitenarten für
   dieselbe Frage („wie ist diese Marke gebaut?") — zwei Vorlagen oder eine mit
   zwei Datenquellen?
4. **Wer stösst den Brand-Check einer fremden Marke an**, auf wessen Deckel
   (Kosten, 7-Tage-Cache, Konto-Deckel 10/Tag) — und ist dieser Score öffentlich,
   obwohl `rankingOptIn` für Kundenschecks gilt?
5. **Duell-Fakten** („Agentur-Beziehung", „Zeichen seit …") sind nicht aus einer
   Website ableitbar: von Hand gepflegt mit Belegpflicht, oder Format ohne diese
   Zeile?
6. **Ranking-Regeln:** wie viele Marken je Liste, welcher Auffrischungs-Rhythmus,
   und was passiert mit einer veröffentlichten Liste, wenn sich ein Score ändert?
7. **Farbwelt-Kacheln:** aus der Brand-Check-Extraktion gerechnet oder von Hand
   gesetzt (Entscheidung 10 erlaubt beides)?
8. **Übersetzen-Knopf:** eigener Redaktions-Endpunkt oder der bestehende
   UGC-Übersetzungs-Weg — und welche Drossel gilt für einen Betreiber?
9. **Notausgang „Entfernen":** gilt er auch für ein Ranking, in dem die Marke
   steht — Platz löschen, Liste neu rechnen, oder Liste einfrieren?
10. **Newsletter:** Anbieter, wo die Adressen liegen (Warteliste weiternutzen?),
    und ob der Eintrag je Format oder nur zentral angeboten wird.
