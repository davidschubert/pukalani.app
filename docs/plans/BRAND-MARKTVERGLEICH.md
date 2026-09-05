# Marktvergleich — Strategie und Konzept

Stand 2026-09-05 (abends) · Status: **Strategie + Konzept FREIGEGEBEN (2026-09-05, §6);
Prototyp M0 gebaut (Commit 81552629, Playground Port 3012); Prototyp-Runde 1 mit David hat
das Konzept ERWEITERT (§7: ein Motor, drei Ansichten; vier Quellen; Brand-Score; erweiterter
Abruf; KI-Suche) — Prototyp M0b setzt die Erweiterung um, danach Davids Prototyp-Abnahme.**
Nichts hiervon ist im Produkt gebaut.

## 0. Was das hier ist

Davids Produktgedanke vom 2026-09-04, gestellt am Ende des Gesprächs über die
Branding-Atome:

> „Wir könnten später mit Konkurrenzanalysen möglichst genau herausfinden, wo sich unsere
> Marke am Markt am besten positionieren sollte. Und dementsprechend in der Datenanalyse
> und im Markenvergleich zwischen meiner erstellten Marke und der am Markt am besten
> platzierten Marke sagen, was wir verändern, verbessern oder überdenken sollten. Das ist
> ein Produkt, mit dem man richtig Geld verdienen kann."

Und Davids Startwort vom 2026-09-05: „Marktvergleich planen — Strategie und Konzept
starten." Dieses Dokument ist die Strategie (Analyse, Zielbild, Grenzen) und das Konzept
(Produktform, Verträge, Ablauf, Datenmodell, Kosten, Recht), mit den offenen
Entscheidungen als Fragen mit Optionen und Empfehlung (§6). Es ist bewusst EIN Dokument,
wie der Workflow es verlangt; der Prototyp kommt erst nach der Freigabe.

---

## 1. Strategie

### 1.1 Wo kommen wir her

Der Brand-Wizard liefert seit BW2 (docs/archiv/BRAND-WIZARD-SESSIONS.md) eine Foundation
als **strukturierte Daten**: 68 Felder mit stabiler Id, Schema, Herkunft (Quellen-Slots),
Bestätigungs- und Abnahme-Zustand, Notizen und Befunden — kein PDF. Genau das macht einen
Vergleich überhaupt möglich: eine fremde Marke kann in DIESELBE Struktur übersetzt und
Feld für Feld nebeneinandergelegt werden.

Was der Wizard heute über den Markt weiss, stammt ausschliesslich vom Kunden:

- `a.competitors` — drei bis fünf Wettbewerber, je ein Satz Stärke/Schwäche, **nur aus
  den Eingaben** („every name appears literally in the inputs"), vertraulich (`internal`).
- `a.category` / `b.positioningCategory` — die Kategorie, in der die Marke spielt, als
  offener Kurztext.
- `b.positioningFirstChoice` — „Warum sollte ein Kunde euch zuerst wählen?" — die eigene
  Behauptung.
- `d.gapReveal` — „Selbstbild gegen Aussenbild": heute OHNE externe Daten, also aus dem
  Selbstbild abgeleitet.
- Die **URL-Analyse der eigenen Website** (brand-010, `brandSiteAnalysis.ts`,
  `brandSiteFetch.ts`): ein SSRF-fester Abruf EINER Seite, 2 MB / 20 000 Zeichen,
  Text bleibt am Server, Naht für bis zu fünf Same-Origin-Seiten vorbereitet, nicht gebaut.

### 1.2 Wo stehen wir

George hört nur die Gründerin oder den Gründer. Die **Aussensicht** — Kundeninterviews,
Marktforschung, der Blick von aussen — ist das, was Agenturen mitbringen und wir nicht
(Einschätzung vom 2026-09-04: „Agenturen bringen die Aussensicht mit. Wir hören heute nur
die Gründerin oder den Gründer.").

Gleichzeitig haben wir einen Vorteil, den Agenturen nicht haben: **Jede Aussage der
eigenen Marke hat eine Adresse** (Slot-Id), eine Herkunft und einen Zustand. Eine
Wettbewerber-Aussage, die in dieselbe Adresse übersetzt wird, ist damit VERGLEICHBAR — nicht
als Gefühl („die wirken moderner"), sondern als Gegenüberstellung derselben Frage:
„Welches Versprechen macht ihr / machen sie in der Kategorie X?"

### 1.3 Wo wollen wir hin — das Zielbild in einem Satz

> **„Wo steht meine Marke im Feld ihrer Wettbewerber — welche Versprechen sind besetzt,
> welche frei, wo klingen wir gleich — und was sollten wir deshalb ändern, schärfen oder
> überdenken?"**

Das Produkt beantwortet diese Frage aus **öffentlich gesagten Dingen** (Websites der
Wettbewerber), übersetzt in die Feldstruktur der Foundation, und liefert das Ergebnis als
(1) eine Gegenüberstellung je Dimension, (2) drei Listen — **Konventionen** (was alle
sagen, also Eintrittskarte, kein Unterscheidungsmerkmal), **Überschneidungen** (was wir
sagen und mindestens ein Wettbewerber auch) und **freie Stellen** (was niemand im Feld
besetzt) — und (3) **Befunde am eigenen Feld** („eure Positionierungs-Behauptung sagt
wörtlich, was zwei Wettbewerber auch sagen — hier ist der Satz, hier die Quelle"), als
Chips derselben Art wie die Konflikt-Befunde aus BW2, beratend, mit Annehmen/Ablehnen.

### 1.4 Was das Produkt BEWUSST NICHT behauptet

Das ist die wichtigste Strategie-Entscheidung, weil sie das Versprechen ehrlich hält
(Einschätzung 2026-09-04: „‚die am besten platzierte Marke' braucht ein Mass, und
Positionierung ist relativ"):

- **Kein Ranking „beste Marke".** Wir sehen, was Marken SAGEN, nicht, wie gut sie damit
  ankommen. Marktanteil, Bekanntheit, Werbedruck, Kundenzufriedenheit sind ohne teure
  Datenquellen nicht ehrlich messbar (§1.6). Das Produkt zeigt den **Behauptungs-Raum**
  (claim space) der Kategorie — nicht den Markterfolg.
- **Keine Aussage über Dritte als Urteil.** Jede Wettbewerber-Aussage erscheint als
  ZITAT mit Quelle („laut ihrer Startseite: …"), nie als unsere Bewertung („Wettbewerber
  X ist unklar"). Das ist rechtlich geboten (§1.7) und produktlich richtig: der Kunde
  urteilt, wir zeigen.
- **Keine automatische Suche nach Wettbewerbern.** Die Namen kommen aus `a.competitors`,
  die ADRESSEN gibt der Kunde. Eine geratene Adresse ist die erste Halluzination des
  Produkts; sie darf gar nicht entstehen (§6, Frage 4).
- **Kein Ersatz für Kundeninterviews.** Das Aussenbild aus Websites ist das Aussenbild,
  das die Wettbewerber ZEIGEN wollen — nicht das, was Kunden erleben. Das steht als
  Hinweis im Produkt, nicht im Kleingedruckten.

### 1.5 Zielgruppe und Nutzen

Die Beispielwelt der Session-Inhalte (Davids Entscheidung 2026-09-04) ist die Zielgruppe:
Software/SaaS, Agenturen, Kreativ-Studios, Gastronomie, Yoga-Studios, Interior Design,
Coaches, Freelancer und Personal Brands. Gemeinsam ist ihnen:

- Sie **kennen ihre drei bis fünf Wettbewerber** namentlich und haben deren Websites
  gesehen — aber nie systematisch nebeneinandergelegt.
- Sie formulieren ihre Positionierung **aus dem Bauch** und merken nicht, dass die halbe
  Kategorie denselben Satz sagt („individuell, persönlich, mit Leidenschaft").
- Eine Agentur-Wettbewerbsanalyse ist für sie unerschwinglich; die Frage „klingen wir wie
  alle?" ist trotzdem ihre dringendste.

Der Nutzen ist deshalb nicht „Marktforschung", sondern ein **Spiegel mit Beleg**: die
eigene Behauptung neben denen der Nachbarn, Satz für Satz, mit der Einladung, das eigene
Feld zu schärfen — genau dort, wo George im Gespräch nachfragt.

### 1.6 Datenquellen — was realistisch geht

| Quelle | Phase | Ehrlich lieferbar | Grenze |
| --- | --- | --- | --- |
| Website des Wettbewerbers (Start + bis 5 Same-Origin-Seiten: über uns, Leistungen, Preise) | **1** | Positionierung, Kategorie-Sprache, Versprechen, Tonalität, Tagline, Kernbotschaften, Zielgruppen-Ansprache | JS-gerenderte Seiten (SPA) liefern wenig Text; dünne Seiten liefern dünne Profile — dann steht das Feld LEER, nie erfunden |
| Meta-Tags, JSON-LD (Organization, description) | 1 | Selbstbeschreibung in einem Satz | oft leer oder generisch |
| Bewertungs-Snippets (Google, Trustpilot) | 2, nach Rechtsprüfung | Kunden-Wahrnehmung (das echte Aussenbild) | Nutzungsbedingungen der Plattformen, personenbezogene Daten |
| LinkedIn-/Social-Beschreibungen | 2, nach Rechtsprüfung | Tonalität, Selbstbild | Zugriffsschranken, AGB |
| Marktanteil, Bekanntheit, Werbedruck, Traffic | **nie in Phase 1** | — | nur über bezahlte APIs (Similarweb, Semrush, Brandwatch) mit Budget, das ein Freelancer nicht trägt; Recherche §1.8 |

Phase 1 = **nur die Website**, weil das der Ort ist, an dem eine Marke ihre Positionierung
öffentlich behauptet — und das ist genau die Ebene, auf der die Foundation formuliert ist.

### 1.7 Rechtlicher und ethischer Rahmen (Phase 1)

Grundsätze, die ins Konzept als Verträge einfliessen (§2.9) — die Rechtsrecherche mit
Quellen ergänzt §1.8; die Sätze hier sind die Produktregeln, unabhängig davon, was im
Detail noch zu klären ist:

1. **Nur öffentlich zugängliche Marketing-Texte** von Unternehmens-Websites; keine
   Login-Bereiche, keine Formulare, keine Downloads.
2. **robots.txt und maschinenlesbare Nutzungsvorbehalte werden RESPEKTIERT** (Text- und
   Data-Mining-Opt-out nach § 44b UrhG / DSM-Richtlinie Art. 4 — die Recherche klärt die
   heute übliche Form des Vorbehalts). Ein Vorbehalt heisst: dieser Wettbewerber wird
   nicht ausgewertet, mit ehrlicher Meldung an den Kunden.
3. **Keine personenbezogenen Daten.** Team-, Impressum- und Kontaktseiten werden gar nicht
   abgerufen (Pfad-Heuristik), und der extrahierte Text wird auf Namen/E-Mail/Telefon
   gefiltert, bevor er ein Modell sieht.
4. **Rohtext ist Zwischenprodukt**, kein Bestand: gespeichert höchstens 24 Stunden, danach
   bleibt nur das strukturierte Marktprofil mit KURZEN Belegzitaten (≤ 200 Zeichen je
   Feld, Zitatschranke) und der Quell-URL.
5. **Vergleichende Darstellung ohne Herabsetzung** (UWG-Massstab): wir zeigen, was eine
   Website sagt, und was unsere Marke sagt — nie „X ist schlechter". Formulierungen des
   Modells werden darauf geprüft (Prompt-Regel + Stichwort-Filter), Befunde richten sich
   IMMER an das eigene Feld („euer Satz klingt wie …"), nie an den Dritten.
6. **Vertraulich wie `a.competitors`**: Marktprofile und Berichte reisen nicht per
   Share-Link und nicht ins Dokument-Export (Sensitivity `internal`).
7. **Prompt-Injection-Grenze** (bestehende Regel des Wizards): fremder Website-Text ist
   DATEN, nie Anweisung — der Extraktions-Prompt sagt das ausdrücklich, und die Ausgabe ist
   Zod-geprüft, Felder ohne Beleg werden verworfen.

### 1.8 Konkurrenz-Werkzeuge und Praxis (Recherche 2026-09-05, Volltext mit Quellen: Anhang A)

**Werkzeuge im Feld** (Auszug; Preise laut Quellen, teils unsicher):

| Werkzeug | Vergleicht | Ausgabe | Preis | Für wen | Schwäche für unseren Fall |
| --- | --- | --- | --- | --- | --- |
| Crayon / Klue | Websites, Preisseiten, Stellen, Social (Competitive Intelligence) | Battlecards, Alerts | 16–40 k$/Jahr | B2B-SaaS-Vertrieb | Signalflut, kein Markenmodell, unbezahlbar für Kleinmarken |
| Kompyte | automatisiertes Tracking | Reports | ab ~300 $/Jahr | Mid-Market | flach |
| Semrush AI Visibility / Ahrefs Brand Radar | Nennung/Sentiment in KI-Antworten | Prompt-Tracking, Indizes | 99–699 $/Monat | SEO | misst Sichtbarkeit, nicht Positionierung |
| Similarweb | Traffic, Kanäle | Dashboards | ab 125 $/Monat, API Enterprise | Growth | keine Markeninhalte |
| Tracksuit / Latana | echte Wahrnehmung (Panel) | Awareness-Dashboards | ~20–50 k$/Jahr | Wachstumsmarken | Sample zu klein für Nischen |
| IdeaProof | Website → Strategie; Wettbewerb als Zusatzmodul | Archetyp, Mission, UVP, Voice-Achsen, Map | Credits (Strategie 50, Competitor 70) | Gründer | Tiefe unklar, keine Belegpflicht |
| ChatGPT direkt | alles und nichts | Prosa | ~20 $/Monat | jeder | halluziniert Preise, Logos, Fakten |

**Fünf Erkenntnisse, die die Strategie tragen:**

1. **Die Lücke ist echt.** CI-Tools vergleichen Features, AI-Visibility-Tools Nennungen,
   Panel-Tracker Wahrnehmung, Generatoren erzeugen Felder ohne Aussenblick — **niemand
   übersetzt Wettbewerber-Websites in dieselbe Feldstruktur einer Brand Foundation.**
2. **Der Zuschnitt „Foundation inklusive, Vergleich zusätzlich" existiert nebenan**
   (IdeaProof: 50 vs. 70 Credits) — als flacher Zusatz ohne Beleg. Das bestätigt §1.9 und
   zeigt, womit wir uns unterscheiden müssen: Tiefe und Beleg.
3. **Aus Website-Text entsteht eine Positioning Map, nie eine Perceptual Map.** Die
   Agentur-Praxis trennt das streng; Karten ohne Kundendaten gelten als Dekoration. Das
   ist der Grund für §1.4 und §6 Frage 5 (keine Achsen-Karte in Phase 1).
4. **Belegpflicht ist das Produkt.** Zitat + URL + Abrufdatum je Aussage schliesst
   Halluzinationen aus, erfüllt die Nachprüfbarkeit nach UWG und unterscheidet uns von
   „ChatGPT kann das auch". Genau das ist der Riegel aus §2.2.
5. **„Category Conventions" ist der bessere Rahmen** als eine Achsengrafik: überfüllte
   Claims, ungeschützte Stärken, für Regeln gehaltene Muster — das leistet der
   Feld-für-Feld-Vergleich aus §2.3 direkt.

**Drei Risiken, die in die Verträge eingeflossen sind (§1.7/§2.9):**

1. **§ 6 UWG — vergleichende Werbung.** Sobald das Produkt Formulierungen ZUM
   VERÖFFENTLICHEN vorschlägt („anders als X …"), führt es den Kunden ins Haftungsrisiko;
   ein Mitbewerber ist auch ohne Namen „erkennbar". Folge: **interne Analyse ja, fertige
   Vergleichs-Claims und Scores je Wettbewerber nein** — George entwirft aus einem
   Markt-Befund NIE einen Satz, der einen Dritten nennt oder erkennbar macht (neue
   Prompt-Regel + Filter, §2.9 Nr. 5 verschärft).
2. **TDM-Vorbehalte.** § 44b UrhG trägt nur, solange robots.txt und erkennbare Vorbehalte
   respektiert werden; ob ein Vorbehalt in natürlicher Sprache (AGB) „maschinenlesbar" ist,
   liegt beim BGH (I ZR 281/25, Verhandlung 2026-09-03, Ausgang offen). Bis zur Klärung:
   robots.txt UND gängige TDM-Signale (`TDM-Reservation`-Header, `tdmrep.json`,
   `noai`/`noimageai`-Meta) respektieren, und bei Zweifel ausschliessen (fail-closed).
   Personennamen von Team-/Impressumsseiten gehören gar nicht in die Pipeline (§1.7 Nr. 3).
3. **Halluzination frisst das Vertrauen.** Erfundene Preisstufen und falsch zugeordnete USPs
   sind der dokumentierte Standardfehler; bei einem Beratungsprodukt, das der Kunde einem
   NAMENTLICH genannten Nachbarn zuschreibt, ist ein einziger Fehler teurer als das Modul.
   Deshalb `evidence ⊂ rawText` deterministisch (§2.2), nicht als Prompt-Wunsch.

Einschränkung der Recherche: Praktikerstimmen stammen aus Anbieter- und Agenturblogs
(Bias), Reddit/HN liessen sich nicht belegen; Tracksuit-Preise widersprechen sich zwischen
Quellen.

### 1.9 Geschäftsmodell-Einordnung

„Frei bauen, bezahlt anwenden" (Davids Entscheidung 2026-08-27): Die Foundation ist frei
und Trichter, bezahlt wird die ANWENDUNG. Der Marktvergleich ist Anwendung — er nimmt die
fertige Foundation und hält sie gegen die Welt. Er ist deshalb **bezahlt**, und die
Schranke ist von Tag eins sichtbar (die Seite „Markt" existiert, zeigt was sie tut, und
nennt den Preis-Anker — heute „im Erstgespräch", mit branding.supply ein Preis). Kosten je
Lauf stehen in §2.8; sie sind klein genug für eine Flatrate im Pro-Tier und gross genug,
dass ein freier Lauf je Tag nicht sinnvoll ist (§6, Frage 3).

### 1.10 Risiken und Hypothesen (was die Beta klären muss)

| Risiko | Warum es real ist | Gegenmittel im Konzept |
| --- | --- | --- |
| **Dünne Profile** — Websites sagen wenig oder alles gleich | Ein Handwerker-Auftritt hat keinen Purpose-Satz | Leere Felder bleiben leer und werden als „nicht öffentlich formuliert" gezeigt — das IST eine Aussage über die Kategorie |
| **Halluzination** — das Modell erfindet ein Versprechen | Sprachmodelle vervollständigen | Beleg-Pflicht je Feld (Zitat + URL), Zitat muss WÖRTLICH im Rohtext vorkommen (deterministische Prüfung), sonst Feld verworfen |
| **Scheinpräzision** — „Whitespace" wird als Marktlücke gelesen | Ein freier Claim kann frei sein, weil ihn niemand glaubt | Sprache im Produkt: „niemand im Feld SAGT das", nie „hier ist eine Lücke"; George rahmt es als Frage |
| **Rechtliche Angriffsfläche** | Zitate aus Wettbewerber-Websites, TDM-Opt-out | §1.7 als Verträge, Rohtext-Retention 24 h, Vorbehalt respektieren, Zitatschranke |
| **Kosten** | N Abrufe + N Extraktionen + 1 Vergleich je Lauf | Eimer je Brand, Instanz-Deckel, Ergebnis-Cache je URL-Stand (§2.8) |
| **SPA-Websites** | Text erst nach JS | Phase 1 liest nur SSR-HTML + Meta/JSON-LD; ehrliche Meldung „diese Seite gibt ohne Browser nichts preis"; Headless-Browser ist Phase 2 |

**Hypothese H1 (Beta):** ≥ 60 % der Läufe erzeugen mindestens einen Befund, den der
Kunde ANNIMMT. **H2:** die Frage „hat euch das etwas gezeigt, das ihr nicht wusstet?"
(eine freiwillige Frage wie `result.rating`) ≥ 4/5.

---

## 2. Konzept

### 2.1 Produktform

Ein **eigener Produkt-Layer `market`** (`packages/market`, Tables `market_*`, productKey
`market`), nach der Silo-Regel (neues Produkt ⇒ eigener Layer, KEIN eigenes Deployment).
Er hängt am brand-Layer über EINEN expliziten Vertrag: er importiert die Slot-Registry und
den Befund-Vertrag aus `packages/brand/shared` (nur `import type` + die puren
Registry-Funktionen) und schreibt Befunde über den bestehenden Befund-Speicher des
brand-Layers (Art `market`, neu). Kein impliziter Auto-Import, keine gemeinsamen Tabellen
(CONCEPT A14: Cross-Layer-Abhängigkeiten als explizite Verträge). Alternative und
Begründung: §6, Frage 1.

Produkt-Manifest: `tier` = bezahlt, `requires: ['brand']`. Site-Manifest branding: `market`
ergänzen. Gate `pukalani.market.enabled` (Build) + `app_config.products.market.enabled`
(Runtime-Kill), wie beim brand-Layer.

### 2.2 Der Vergleichs-Vertrag: das Marktprofil

Ein **Marktprofil** ist die Untermenge der Foundation-Felder, die man von AUSSEN über eine
Marke sagen kann — jedes mit Beleg. Die Ids sind die Slot-Ids der Registry, damit der
Vergleich Feld gegen Feld läuft:

| Marktprofil-Feld | Eigenes Feld (Registry) | Woraus extrahiert | Form |
| --- | --- | --- | --- |
| Kategorie-Sprache | `a.category`, `b.positioningCategory` | Startseite, Meta-description, JSON-LD | Kurztext ≤ 5 Wörter |
| Was sie versprechen (Pitch) | `a.pitch` | Hero/Startseite | 1–2 Sätze |
| Für wen | `a.audienceSketch` | Startseite, Leistungen | Kurztext |
| Warum zuerst wählen (Behauptung) | `b.positioningFirstChoice` | Startseite, Über uns | 1 Satz |
| Purpose-Satz (falls formuliert) | `b.purpose` | Über uns | 1 Satz oder LEER |
| Behauptete Werte (Wörter) | `c.final` | Über uns, Leistungen | Liste ≤ 5 Wörter |
| Tonwörter | `d.toneWords` | Gesamttext (Stilanalyse) | Liste ≤ 5 |
| Tagline | `ep.taglines` | Hero, `<title>`, Meta | 1 Zeile oder LEER |
| Kernbotschaften | `ep.keyMessages` | Startseite (H1–H3) | Liste ≤ 3 |
| Markenzeichen (verbal) | `ep.distinctiveAsset` | wiederkehrende Formel/Slogan | 1 Zeile oder LEER |

Nicht im Marktprofil (weil von aussen nicht ehrlich ableitbar): Gründungsimpuls,
Beschwerden, Konfliktregel, Vision-Zehnjahres-Bild, Manifest.

Jedes Feld trägt: `value`, `evidence` (wörtliches Zitat ≤ 200 Zeichen), `sourceUrl`,
`confidence` (`stated` = wörtlich gesagt · `implied` = aus mehreren Stellen abgeleitet),
und die deterministische Prüfung `evidence ⊂ rawText` — ohne Treffer wird das Feld
VERWORFEN (das ist der Halluzinations-Riegel, kein Prompt-Wunsch).

Der Vertrag lebt pur in `packages/market/shared/marketProfile.ts` (Typen, `MARKET_FIELDS`
mit der Abbildung auf Slot-Ids, Zod-Schema) und wird gegen die brand-Registry getestet
(jede Abbildung zeigt auf einen existierenden, nicht deaktivierten Slot).

### 2.3 Der Ablauf eines Vergleichs

1. **Kandidaten.** Die Seite „Markt" zeigt die Namen aus `a.competitors` (falls bestätigt)
   als Vorschlag; der Kunde trägt je Name die **Adresse** ein (Pflicht, nie geraten),
   maximal fünf. Weitere Namen dürfen ergänzt werden.
2. **Abruf.** Je Wettbewerber: `robots.txt` + TDM-Vorbehalt prüfen ⇒ ggf. „ausgeschlossen,
   weil die Website die Auswertung untersagt". Sonst Startseite über den SSRF-festen
   Abruf des brand-Layers (Vertrag wiederverwenden, nicht kopieren: `brandSiteFetch` wird
   zu einer geteilten Funktion in `packages/brand/server/utils` mit explizitem Export —
   oder zieht als `core`-Baustein um, §6 Frage 1 entscheidet), dann bis zu vier
   Same-Origin-Unterseiten nach Pfad-Heuristik (`/about`, `/ueber-uns`, `/leistungen`,
   `/services`, `/angebot`, `/preise`, `/pricing`; NIE `/team`, `/impressum`, `/kontakt`,
   `/datenschutz`). PII-Filter über den Text. Rohtext mit `expiresAt` = jetzt + 24 h.
3. **Extraktion.** Je Wettbewerber EIN Modell-Aufruf (günstiges ZDR-Modell, JSON,
   `aiCompleteJson`) ⇒ Marktprofil nach §2.2, Beleg-Prüfung, Speicherung.
4. **Vergleich.** EIN Aufruf (George-Modell) über: eigenes Foundation-Profil (dieselben
   Felder, aus den BESTÄTIGTEN Werten) + N Marktprofile ⇒ **Bericht** mit vier Teilen:
   - **Gegenüberstellung** je Feld (Tabelle Wir × W1..W5, mit Zitaten),
   - **Konventionen** (Aussagen, die ≥ 60 % des Feldes machen — „Eintrittskarte"),
   - **Überschneidungen** (unsere Aussagen, die ≥ 1 Wettbewerber ebenso macht — mit
     Ähnlichkeitsgrad),
   - **Freie Stellen** (Aussagen, die im Feld niemand macht — als Frage formuliert).
   Dazu **Befunde** (`kind: 'market'`, ein eigenes Feld + Quelle) mit `why` und
   `suggestion`, über den Befund-Speicher des brand-Layers — sie erscheinen als Chips an
   den eigenen Feldern (Abnahme, Log, Session) wie Konflikte, sperren aber NICHTS.
5. **Idempotenz.** Bericht-Schlüssel = Hash über (Foundation-Revisionen der beteiligten
   Felder, URL-Liste, Abrufstände). Gleicher Stand ⇒ gespeicherter Bericht, kein Aufruf.

### 2.4 Wann im Weg

Freischaltung, wenn Kapitel **B (Purpose, Vision & Mission inkl. Positionierung)
abgenommen** ist — vorher gibt es keine eigene Behauptung, die man vergleichen könnte.
Voller Wert nach abgenommener Foundation (Werte, Tonwörter, Tagline). Der Bericht nennt,
welche Felder noch fehlen („Tonwörter stehen bei euch noch nicht — der Vergleich dort
kommt nach Kapitel D"). Eine Korrektur eines eigenen Feldes macht den Bericht mechanisch
`stale` (Schlüssel bewegt), wie in BW2. Alternative: §6, Frage 2.

### 2.5 Oberfläche

- **Leiste:** Eintrag „Markt" auf Ebene 1 unter „Euer Branding" (Buch-Glyphe für das
  Dokument, Kompass-Glyphe für den Markt), gesperrt bis §2.4, mit Zähler „N Befunde".
- **Seite „Markt"** im Werkstatt-Layout (kein George, kein Prompt, rechte Spalte = Stand):
  (1) Kopf mit Erklärsatz und der EHRLICHEN Grenze („Wir zeigen, was Marken sagen — nicht,
  wie erfolgreich sie damit sind"); (2) Wettbewerber-Liste: Name, Adresse, Status
  (ausstehend / gelesen N Seiten / ausgeschlossen mit Grund), zuletzt gelesen; (3) Knopf
  **„Markt vergleichen"** (Preis-Anker/Schranke davor, §1.9); (4) Ergebnis: die vier Teile
  aus §2.3 als Abschnitte — die Gegenüberstellung als UTable (Datenliste — Davids
  UTable-Regel), Konventionen/Überschneidungen/freie Stellen als Listen mit Zitat +
  Quell-Link, Befunde als Chips; (5) je Wettbewerber eine aufklappbare Profil-Karte
  (alle Felder mit Zitat und Link).
- **George** bekommt den Bericht als Block („Der Markt sagt …") in der nächsten Session
  der betroffenen Felder — einmal, wie bei Konflikten.
- Keine Zwei-Achsen-Karte in Phase 1 (die Achsen wählt sonst ein Modell — das ist
  Scheinpräzision, §6 Frage 5).

### 2.6 Datenmodell (server-only, Permissions `[]`, wie alle brand-Tabellen)

| Tabelle | Zweck | Spalten (Kern) |
| --- | --- | --- |
| `market_competitors` | die Kandidaten je Branding | profileId, name, url (normalisiert), status (pending/fetched/excluded/failed), excludedReason, pagesFetched (JSON URL-Liste), fetchedAt, rawText (MEDIUMTEXT, off-row), rawExpiresAt |
| `market_profiles` | das Marktprofil je Wettbewerber | competitorId, profileId, fields (JSON nach §2.2), extractedAt, model, promptVersion, inputHash (Rohtext-Stand) |
| `market_reports` | der Vergleich je Stand | profileId, revisionKey, ownProfile (JSON), matrix (JSON), conventions/overlaps/whitespace (JSON), findingIds (JSON), createdAt, model, promptVersion |

Indizes: `(profileId)`, `(profileId, status)`, `(profileId, revisionKey)`. Retention:
`rawText` wird per Sweep (Intervall-Plugin, wie Digest) nach `rawExpiresAt` geleert;
Profile und Berichte leben mit dem Branding und fallen mit ihm (Profil-Kaskade +
GDPR-Contributor des market-Layers). Schema-Parität: Soll-Block `market` mit drei Tabellen.

### 2.7 Verträge, die aus BW2 wiederverwendet werden (nichts zweimal bauen)

- SSRF-Vertrag + Abruf (`brandSiteAnalysis.ts`, `brandSiteFetch.ts`) — geteilt, nicht
  kopiert.
- Befund-Speicher + Chips (`brand_findings`, `BwFindingChip`) — neue Art `market`,
  ein Slot, `suggestion` Pflicht; sperrt die Abnahme NICHT (nur `conflict` tut das).
- Prüf-Aufruf-Muster (`aiCompleteJson`, ZDR-Routing, Zod, fail-soft, Stub im Dev per
  `MARKET_DEV_STUB=1`).
- Eimer-Vertrag (`brandAiLimits`-Muster) — neuer Eimer `market` (§2.8).
- Registry-Funktionen (`slotById`, Labels) für die Anzeige der eigenen Felder.

### 2.8 KI, Kosten, Drosseln

Je Lauf mit fünf Wettbewerbern: bis 25 Abrufe (kein Modell), 5 Extraktionen (günstiges
ZDR-Modell, je ≈ 6–8k Eingabe-Token), 1 Vergleich (George-Modell, ≈ 10–15k Eingabe-Token).
Grob 0,10–0,30 € je Lauf zu heutigen Preisen — die genaue Zahl liefert der Prototyp-Lauf.

Eimer `market`: **3 Läufe je Branding und Tag**, Instanz-Deckel zählt mit; ein erneuter
Lauf bei unverändertem Stand kostet nichts (Idempotenz §2.3). Abrufe: höchstens 5 Seiten
je Wettbewerber, 2 MB je Seite, 20 000 Zeichen Text je Seite, Gesamt-Deckel je Lauf
60 000 Zeichen an die Modelle. Ohne KI-Schlüssel oder mit `brandAiEnabled=false`: die Seite
zeigt Kandidaten und Abrufstand, der Vergleich meldet „KI ist aus" (Kill-Switch-Regel).

### 2.9 Sicherheits- und Rechts-Verträge (aus §1.7, prüfbar)

1. `robots.txt` wird geholt und respektiert (User-Agent `PukalaniMarketBot/1.0 (+URL zur
   Erklärseite)`); TDM-Vorbehalte in JEDER gängigen maschinenlesbaren Form
   (`TDM-Reservation: 1`-Header, `/.well-known/tdmrep.json`, `<meta name="robots"
   content="noai">`/`noimageai`) ⇒ `excluded`; bis zur BGH-Klärung (I ZR 281/25) gilt bei
   Zweifel fail-closed.
2. Pfad-Sperrliste (team, impressum, kontakt, datenschutz, agb, login, account, cart) —
   pur getestet.
3. PII-Filter vor dem Modell (E-Mail, Telefon, Namensmuster nahe „Geschäftsführer/CEO/
   Gründer") — pur getestet, mit Gegenprobe.
4. Beleg-Pflicht + Zitatschranke ≤ 200 Zeichen + `evidence ⊂ rawText` (deterministisch).
5. Herabsetzungs-Filter auf Bericht und Befunden (Wortliste + Prompt-Regel „describe, never
   judge the third party"); Befunde adressieren immer ein eigenes Feld. **Kein
   veröffentlichungsfähiger Vergleichs-Claim** (§ 6 UWG, Recherche §1.8): weder der Bericht
   noch George entwerfen einen Satz, der einen Wettbewerber nennt oder erkennbar macht —
   ein Markt-Befund sagt „euer Satz klingt wie zwei andere im Feld", nie „sagt: anders als
   X". Prompt-Regel + Namens-/Domain-Filter über jeden Vorschlag, mit Gegenprobe im Test.
6. Rohtext-Retention 24 h (Sweep), Logs ohne Inhalt (bestehende Log-Regel).
7. Sensitivity `internal`: nicht im Share-Snapshot, nicht im Export, nicht im Dokument.
8. Rate-Limit je IP auf den Abruf-Endpunkt; ein Branding kann höchstens 5 Wettbewerber
   führen; URL-Änderung setzt Status auf `pending`.

### 2.10 Messung

Server-Ereignisse (bestehendes `brand_events`-Muster oder eigenes `market_events`):
`market.run`, `market.competitor_excluded` (Grund), `market.finding_accepted/dismissed`,
`market.rating` (eine freiwillige Frage nach dem ersten Bericht). Plausible nur für den
Klick auf die Schranke. Beta-Kriterien §1.10.

### 2.11 Prototyp (Phase 3, nach Freigabe) — ein Screen je Interaktionstyp

In `packages/market/.playground`, echte Nuxt-UI-Komponenten, echter Inhalt (die
Kaffeerösterei aus dem Test-Branding gegen drei erfundene Wettbewerber-Websites, die im
Playground als statische Seiten liegen — so ist der Prototyp ohne Netz vorführbar):

1. Seite „Markt" mit Kandidaten-Liste, Adress-Eingabe und Schranke.
2. Lauf-Fortschritt (Abruf je Wettbewerber, ausgeschlossen mit Grund).
3. Ergebnis: Gegenüberstellung (UTable), die drei Listen, Profil-Karte aufgeklappt.
4. Ein Markt-Befund als Chip in der Werkstatt an `b.positioningFirstChoice`.

Davids Korrekturrunden am lebenden Prototyp, dann Freigabe, dann Pakete (§5).

---

## 3. Nicht-Ziele (Phase 1)

Ranking oder Score von Marken · Marktanteil/Bekanntheit/Traffic · automatische
Wettbewerber-Suche · Headless-Browser für SPAs · Bewertungsplattformen und Social ·
Zwei-Achsen-Positionierungskarte · Export/Teilen des Berichts · Beobachtung über die Zeit
(„Monitoring") · andere Sprachen als de/en beim Extrahieren (der Rohtext darf jede Sprache
haben, das Marktprofil steht in der Inhaltssprache der Marke).

## 4. Abhängigkeiten und Fallen

- **A1-AVV / ZDR:** fremde Website-Texte gehen an den Modell-Anbieter — dieselbe
  Datenschutz-Kette wie beim Wizard (OpenRouter, ZDR, data_collection deny).
- **Der Abruf-Vertrag gehört geteilt**, sonst gibt es zwei SSRF-Schutze, die
  auseinanderlaufen (§6, Frage 1 entscheidet, wo er wohnt).
- **Bilanz-Gate**: neue Routen/Tabellen ⇒ `check:bilanz`, Schema-Parität, GDPR-Contributor,
  Manifest-Check (`check:manifests`) — in JEDEN Paket-Auftrag.
- **Beispiel-Websites im Playground** müssen erfunden sein (keine realen Marken), wie die
  Session-Beispiele.

## 5. Pakete (Skizze — verbindlich erst nach Prototyp-Freigabe)

| # | Paket | Inhalt | Gate |
| --- | --- | --- | --- |
| M0 | Prototyp | §2.11 im Playground | **David** (Design + Bedienung) |
| M1 | Layer + Vertrag | packages/market, Manifeste, `marketProfile.ts`, Schema-Anhang (3 Tabellen), Abruf-Vertrag geteilt | Schema-Anhang zur Durchsicht |
| M2 | Abruf + Extraktion | robots/TDM, Pfad-Sperrliste, PII-Filter, Rohtext-Retention, Extraktions-Prompt `market-x-1`, Beleg-Riegel, Stub | Beweis-Skript mit erfundenen Seiten |
| M3 | Vergleich + Befunde | Bericht-Prompt, Idempotenz, Befund-Art `market`, George-Block | Beweis + Gegenproben (Herabsetzungs-Filter) |
| M4 | Oberfläche | Seite „Markt", Leiste, Schranke, Chips | Klick-Beweis |
| M5 | Betrieb | Eimer, Sweep, Wächter (Parität, Bilanz), Messung, Doku/Changelog | Live-Build |

## 6. Entscheidungen (David, 2026-09-05 — alle nach Empfehlung)

0. **Strategie-Kern freigegeben:** Behauptungs-Raum der Kategorie mit Zitat und Quelle;
   KEIN Ranking, kein Score je Wettbewerber, keine Aussage über Markterfolg (§1.4).
1. **Ort:** eigener Layer `market` mit explizitem Vertrag zu `brand` (§2.1).
2. **Freischaltung:** nach abgenommenem Kapitel B (§2.4).
3. **Schranke:** bezahlt ab Tag eins, Beta-Konten frei geschaltet (§1.9).
4. **Adressen:** der Kunde trägt sie ein; Namen aus `a.competitors` nur als Vorschlag (§2.3).
5. **Ausgabe Phase 1:** Gegenüberstellung als Tabelle + drei Listen + Befunde; keine
   Achsen-Karte (§2.5).
6. **Datenquellen Phase 1:** nur Websites (§1.6).
7. **Abruf-Vertrag:** bleibt in `brand`, wird explizit exportiert, `market` importiert (§2.7).

Verworfen und warum: Score je Wettbewerber (misst nichts Belegbares, UWG-Grauzone) ·
Websuche nach Adressen (Kosten + Halluzinationsquelle) · Zwei-Achsen-Karte (Achsen vom
Modell = Scheinpräzision) · Bewertungs-/Social-Quellen (Plattform-AGB, PII) · Umzug des
Abrufs nach core (sauberer, aber ein Schritt mehr als nötig — bleibt Option).

## 7. Erweiterung aus der Prototyp-Runde 1 (David, 2026-09-05 abends)

Davids Fragen am Prototyp: „nicht nur die Website — auch ein fertiger Brand-Score oder eine
im Wizard entstandene Marke sollen Kandidat sein können"; „lesen wir auch SEO-/GEO-relevante
Dokumente, decken wir moderne KI-Suche ab, Startseite oder alle Seiten, wie wird der
Brand-Score über individuelle Websites vergleichbar"; „adidas vs. nike, anthropic vs. openai,
meta vs. apple als Beispiele auf der Startseite"; „sind Brand-Check, Brand-Score und
Marktvergleich verschiedene Produkte?"

### 7.1 Ein Motor, drei Ansichten (Entscheidung David, nach Empfehlung)

Die gemeinsame Währung ist das **Marktprofil** (§2.2): zehn Felder, je mit Beleg, Herkunft
und Häufigkeit. Es entsteht aus JEDER Quelle in derselben Form. Darauf drei Ansichten mit
gleichem Input und verschiedenem Output — KEINE drei Produkte:

| Ansicht | Input | Output |
| --- | --- | --- |
| **Brand-Check** | EIN Marktprofil (Website, eigene Marke oder Bibliothek) | Profil mit Belegen + **Brand-Score** + „was fehlt öffentlich" |
| **Brand-Score** | ein Marktprofil | eine Zahl 0–100 (§7.3) mit ihren Bausteinen |
| **Marktvergleich** | N Marktprofile | Gegenüberstellung, Konventionen, Überschneidungen, freie Stellen, Befunde (§2.3) |

Der Marktvergleich bleibt die erste Umsetzung; Check und Score sind Ansichten desselben
Motors und kommen in denselben Paketen mit (§5 nachgezogen).

### 7.2 Vier Quellen für Kandidaten (Entscheidung David)

1. **Website-Adresse** — wie §2.3, Abruf erweitert (§7.4).
2. **Eigene Marke aus dem Konto** — Abbildung der BESTÄTIGTEN Foundation-Felder auf das
   Marktprofil, kein Abruf. Der stärkste Relaunch-Fall: alte Website gegen neue Foundation;
   ebenso Sub-Marken gegeneinander.
3. **Kuratierte Bibliothek bekannter Marken** — von uns mit demselben Motor gerechnet und
   VON HAND GEPRÜFT, versioniert im Repo (`packages/market/library/*.json`), Namen ja, Logos
   nein, nur wörtliche Zitate, keine Herabsetzung. Erste Paare: adidas/Nike,
   Anthropic/OpenAI, Meta/Apple, dazu drei bis fünf kleinere bekannte Marken je Zielbranche
   (Studio, Coach, Café). Zweck: Beispiele auf der Brand-Check-Startseite UND Kalibrierung
   des Scores.
4. **Fremde Wizard-Marken anderer Kunden** — Davids Entscheidung GEGEN die Empfehlung
   (Phase 2). **Leitplanke, die nicht verhandelbar ist:** eine Marke eines anderen Kontos
   erscheint NUR, wenn ihre Eigentümerin sie ausdrücklich für den Marktvergleich freigegeben
   hat (Opt-in am Profil, `marketVisibility: 'listed'`, Default `'private'`, jederzeit
   widerrufbar; der Vorbereitungs-Schalter ist das in Phase 1 gestrichene `visibility` aus
   dem Phase-1-Plan — jetzt mit einem Zweck). Sichtbar wird dann NUR das Marktprofil (die
   zehn Außen-Felder), nie Foundation-Interna, nie Notizen/Befunde/Wettbewerber. Ohne
   Opt-in gibt es keine Kandidatin — auch nicht per Name-Suche. Das ist Datenschutz und
   Vertrauen in einem: der Wizard ist ein privater Raum.

### 7.3 Der Brand-Score (Entscheidung David, nach Empfehlung)

Eine **deterministische Zahl 0–100 für Klarheit und Konsistenz der öffentlichen
Behauptung** — ausdrücklich NICHT Markterfolg (§1.4 bleibt). Bausteine, je aus dem
Marktprofil berechnet, keiner vom Modell „gefühlt":

| Baustein | Anteil | Misst |
| --- | --- | --- |
| **Vollständigkeit** | 40 | wie viele der zehn Felder öffentlich formuliert sind (stated) |
| **Beleg-Stärke** | 15 | Anteil `stated` gegenüber `implied` |
| **Konsistenz** | 20 | dieselbe Aussage über mehrere Seiten (Häufigkeit ≥ 2 Seiten je Feld) |
| **Unterscheidbarkeit** | 25 | Anteil eigener Aussagen, die KEINE Konvention des Feldes sind (nur mit Vergleichsfeld; sonst aus Bibliotheks-Kategorie oder entfällt anteilig) |

Sichtbar: für die **eigene Marke** und die **Bibliothek**. Für einen namentlich genannten
**Wettbewerber**: intern beim Kunden (Sensitivity `internal`), nie im Export, nie per
Share-Link — § 6 UWG (§1.8). Die Zahl trägt immer ihre Bausteine mit, damit sie erklärbar
bleibt („78 — vollständig, aber vier Aussagen sind Konvention").

### 7.4 Erweiterter Abruf (Entscheidung David)

Statt Startseite + Pfad-Raterei: `robots.txt` (Erlaubnis) · **`sitemap.xml`** (Seitenauswahl:
5–8 Schlüsselseiten nach Relevanz — Start, Über uns, Leistungen/Produkte, Preise, Manifest/
Werte, FAQ) · **`llms.txt`** (die Selbstbeschreibung für KI-Suchen — wo vorhanden die
dichteste Quelle) · **schema.org JSON-LD** (Organization/description/sameAs) · **Meta/OG-Tags**
· `<h1>–<h3>`. Aggregation NICHT als Mittelwert, sondern als **Aussage mit Häufigkeit**: eine
Aussage, die auf mehreren Seiten wiederkehrt, ist zentral (Gewicht), eine einmalige ist
Rand. Vergleichbar wird das durch das feste Schema und die Häufigkeits-Angabe, nicht durch
die Websites. Deckel: 8 Seiten, 2 MB je Seite, 80 000 Zeichen je Marke an das Modell.

### 7.5 KI-Suche als Quelle SCHON in Phase 1 (Entscheidung David, GEGEN die Empfehlung)

Zusätzlich zur Website wird gefragt, **was KI-Antworten über eine Marke sagen** („AI-
Außensicht"): dieselbe Frage an zwei bis drei Modelle über die bestehende ZDR-Naht („What
does <Marke> (<Domain>) stand for, whom does it serve, how does it describe itself?"),
Antworten in dieselben zehn Felder extrahiert. **Leitplanken, weil das Halluzinationsrisiko
hier am höchsten ist:** (a) eigene Herkunft `source: 'ai-search'`, in der Oberfläche IMMER
als „ungeprüfte Außensicht — so beschreiben KI-Antworten die Marke" beschriftet, nie mit
Website-Belegen vermischt; (b) nur Aussagen, die in ≥ 2 Modellantworten übereinstimmen,
werden übernommen (Konsens-Filter); (c) kein Einfluss auf den Brand-Score (der bleibt
belegbasiert); (d) fließt in den Vergleich nur als eigene Spalte/Sicht („Website sagt" vs.
„KI-Antworten sagen") — der Unterschied zwischen beiden IST der Befund („eure Website sagt
X, KI-Antworten beschreiben euch als Y"); (e) eigener Eimer-Anteil, weil es je Marke 2–3
Aufrufe kostet. Ein eigenes Experiment im Prototyp zeigt, ob die Ausgabe trägt; fällt es
durch, wird die Quelle in Phase 2 verschoben — mit Davids Wissen.

### 7.6 Folgen für Konzept und Pakete

- §2.2 bekommt je Feld `frequency` (Seiten) und `source` (`website` | `foundation` |
  `library` | `ai-search`); §2.6 bekommt `market_library` (versioniert im Repo, nicht in der
  DB) und `marketVisibility` am Profil (Migration im brand-Layer, additiv).
- §2.5: Seite „Markt" bekommt einen Quellen-Wähler je Kandidat (Adresse · eigene Marke ·
  Bibliothek · freigegebene Marke) und einen Reiter **Brand-Check** (eigene Marke + Score);
  öffentliche **Brand-Check-Startseite** auf branding.supply mit den Bibliotheks-Paaren als
  Beispiel und der Schranke.
- §5 Pakete: M2 wächst um Sitemap/llms.txt/JSON-LD/Häufigkeit und die AI-Außensicht mit
  Konsens-Filter; M3 um Score + Bibliotheks-Import; M4 um Quellen-Wähler, Brand-Check-Reiter
  und Startseite; neues **M6 Bibliothek** (Rechnen + Handprüfung der ersten Paare, Rechts-
  Check der Namensnennung).
- Prototyp **M0b** setzt die Erweiterung sichtbar um (Quellen-Wähler, Brand-Check mit Score,
  Bibliotheks-Startseite, erweiterter Lauf mit Sitemap/llms.txt/KI-Suche, „Website sagt /
  KI sagt"-Spalte), dann Davids Prototyp-Abnahme.

---

## Anhang A — Recherche-Bericht (2026-09-05, mit Quellen)

## Marktvergleich als Zusatzprodukt zu branding.supply — Recherche

Stand: 2026-09-05. Alle Aussagen mit Quelle (URL + Abrufdatum 2026-09-05, Datumsangaben der Quelle wo erkennbar).
Unsicheres ist als **[unsicher]** markiert. Preise sind Listenpreise Dritter, nicht verhandelt.

---

### 1. Werkzeug-Landschaft

Die Landschaft zerfällt in **vier** Gruppen, die nur scheinbar dasselbe tun:

**(a) Klassische Competitive Intelligence (CI)** — Crayon, Klue, Kompyte. Sie beobachten
Wettbewerber-Websites, Preisseiten, Changelogs, Stellenanzeigen, Bewertungsportale und Social laufend
und erzeugen Battlecards für den Vertrieb. Preise 16–40 k$/Jahr (Klue), 20–100 k$/Jahr (Crayon),
Kompyte ab ~300 $/Jahr als Budget-Option
([parano.ai/blog/klue-vs-crayon](https://parano.ai/blog/klue-vs-crayon), 2026;
[analook.com Vendor Map](https://www.analook.com/research/competitive-intelligence-market-2026.html), 2026).
Zielgruppe ist B2B-SaaS-Vertrieb, nicht die Markenstrategie einer Zwei-Personen-Marke.

**(b) AI-Visibility / GEO** — die 2026 lauteste Kategorie: Wie beschreiben ChatGPT, Perplexity & Co.
die Marke im Vergleich zu Wettbewerbern? Semrush AI Visibility Toolkit 99 $/Monat pro Domain
(1 Domain, 25 Prompts, kein Trial — [semrush.com/pricing/ai](https://www.semrush.com/pricing/ai/);
Preisangabe zitiert bei [honeyb.ai](https://www.honeyb.ai/blog/semrush-ai-visibility-toolkit), 2026),
Ahrefs Brand Radar 199 $/Monat je Plattform bzw. 699 $/Monat gebündelt
([explodingtopics.com](https://explodingtopics.com/blog/ai-visibility-vs-brand-radar), 2026).
Das misst **Sichtbarkeit im Modell**, nicht Positionierung.

**(c) Brand Tracking per Panel** — Tracksuit, Latana. Echte Bekanntheits-/Erwägungswerte, aber
befragungsbasiert: Tracksuit ab ~25 k$/Jahr für Wachstumsmarken, Latana grob 20–50 k$/Jahr
([koji.so](https://www.koji.so/blog/best-brand-tracking-software-2026), 2026;
[latana.com/pricing](https://www.latana.com/pricing)). Es kursieren daneben Angaben von
99–299 $/Monat für Tracksuit-Einstiegsstufen ([tryanalyze.ai](https://www.tryanalyze.ai/blog/brand-tracking-software), 2026) —
die Spanne 99 $/Monat vs. 25 k$/Jahr ist widersprüchlich, **[unsicher]**.
Für Freelancer und Studios ist diese Gruppe schlicht unerreichbar.

**(d) KI-Markenstrategie-Generatoren** — das direkte Nachbarfeld von branding.supply. IdeaProof
erzeugt aus Geschäftsbeschreibung oder Website Archetyp (12 Jung), Mission/Vision, UVP-Formel,
Voice-Achsen, Namen/Taglines, Personas und eine Positionierungs-Map; die Wettbewerbsanalyse ist ein
**separates, extra bezahltes Werkzeug** (70 Credits) ([ideaproof.io/brand-strategy](https://ideaproof.io/brand-strategy), Abruf 2026-09-05).
Genau dieser Zuschnitt — Foundation frei/inklusive, Vergleich als Zusatz — existiert also bereits.

**Befund:** Es gibt kein sichtbares Produkt, das Wettbewerber-Websites in **dieselbe Feldstruktur**
einer eigenen Brand Foundation übersetzt. CI vergleicht Features und Preise, AI-Visibility vergleicht
Nennungen, Panel-Tracker vergleicht Wahrnehmung, Generatoren erzeugen Felder ohne Außenblick. Die
Lücke ist real — aber sie ist eine Lücke im *Nutzen*, nicht im *Angebot*: alle vier Gruppen könnten
den Schritt gehen, keine tut es prominent.

---

### 2. Wie Agenturen den Wettbewerbsteil klassisch machen

Standard ist die **Perceptual / Positioning Map**: zwei Achsen, Wettbewerber als Punkte, freie
Stellen als Zielräume. Üblich sind Preis × Qualität, dazu kategoriespezifische Achsen
(z. B. traditionell ↔ innovativ, spezialisiert ↔ breit)
([online.hbs.edu/blog/post/perceptual-map](https://online.hbs.edu/blog/post/perceptual-map);
[ramotion.com/blog/brand-positioning-map](https://www.ramotion.com/blog/brand-positioning-map/)).
Wichtige Unterscheidung: die **Positioning Map** zeigt, wie die Marke wahrgenommen werden *will*,
die **Perceptual Map** zeigt, wie Kunden sie tatsächlich sehen — nur letztere braucht Kundendaten
(ebd.). Ernstzunehmende Praktiker warnen ausdrücklich: eine Map verdient ihren Platz im Strategiedeck
nur, wenn sie aus echten Kundendaten gebaut, mit zwei klaren Achsen getestet und mindestens jährlich
erneuert wird ([michaelbell.co.uk/blog/brand-positioning-map](https://www.michaelbell.co.uk/blog/brand-positioning-map/)).
Ein Produkt, das eine Map allein aus Website-Texten baut, liefert per Definition eine Positioning Map,
**keine** Perceptual Map — das muss es sagen.

Der zweite Standardbaustein sind **Category Conventions**: Wettbewerber, Kategorie-Konventionen,
Suchsichtbarkeit und KI-Zusammenfassungen werden kartiert, um überfüllte Claims, ungeschützte Stärken
und „für Regeln gehaltene Muster" zu finden
([watsoncreative.com](https://www.watsoncreative.com/insights/how-brand-audit-reveals-whats-not-working/)).
Das ist inhaltlich exakt der Wert, den ein Feld-für-Feld-Vergleich liefern kann — und es ist der
bessere Rahmen als eine Zwei-Achsen-Grafik. Zum „Brand Key" (Unilever) fanden sich nur
Lehrmaterial-Quellen, keine belastbare aktuelle Praxisbeschreibung **[unsicher]**.

---

### 3. Recht (EU/DE)

**Urheberrecht / TDM.** § 44b UrhG erlaubt die automatisierte Auswertung; ein Nutzungsvorbehalt wirkt
bei online zugänglichen Werken nur **maschinenlesbar**
([dejure.org/gesetze/UrhG/44b](https://dejure.org/gesetze/UrhG/44b.html)). Das OLG Hamburg
(10.12.2025, 5 U 104/24, LAION) verlangt ein Signal, das „automatisiert so interpretiert werden kann,
dass die erfassten Inhalte nicht ausgewertet werden"; robots.txt ist im Praxiskodex genannt, die
rechtliche Wirksamkeit einzelner Formen ist **nicht abschließend geklärt**. Die Revision liegt beim
BGH, Verhandlung war für **03.09.2026** terminiert (I ZR 281/25) — der Ausgang ist zum Berichtsstand
offen **[unsicher]** ([itmr-legal.de](https://itmr-legal.de/blog/ki-training-widersprechen-tdm-vorbehalt), Seitenstand 2026-08-12;
[bundesgerichtshof.de PM 2026](https://www.bundesgerichtshof.de/SharedDocs/Pressemitteilungen/DE/2026/2026085.html)).
Praktische Folge: **robots.txt und erkennbare Nutzungsvorbehalte respektieren**, sonst entfällt die
Schranke — und speichern statt zitieren wird zum Risiko.

**Datenschutz.** Der EDSA hat mit den Leitlinien 3/2026 Scraping nicht verboten, aber die
Interessenabwägung (Art. 6 I f) an die **vernünftigen Erwartungen** der Betroffenen gebunden;
technische Signale wie robots.txt, ai.txt oder CAPTCHA wirken sich beim Ignorieren **negativ** aus
([delegedata.de](https://www.delegedata.de/2026/08/edsa-leitlinien-3-2026-scraping-bleibt-moeglich-die-vernuenftigen-erwartungen-werden-zum-zentralen-pruefstein/), 08/2026;
[datenschutzticker.de](https://www.datenschutzticker.de/2026/08/web-scraping-fuer-das-training-von-ki-modellen-neue-edsa-leitlinien-im-ueberblick/), 08/2026).
Namen auf Team- und Impressumsseiten sind personenbezogen — auch wenn ihre Veröffentlichung
gesetzlich verlangt ist ([computerweekly.com/de](https://www.computerweekly.com/de/ratgeber/KI-Scraping-und-die-Grenzen-durch-den-Datenschutz)).
Praktische Folge: Personennamen gar nicht erst in die Analyse ziehen.

**UWG.** § 6 UWG greift, sobald ein Mitbewerber **erkennbar** ist — auch ohne Namensnennung. Zulässig
ist der Vergleich nur, wenn er sich objektiv auf wesentliche, relevante, **nachprüfbare** und typische
Eigenschaften bezieht, keine Verwechslung erzeugt und den Ruf nicht unlauter ausnutzt oder
herabsetzt ([gesetze-im-internet.de/uwg_2004/__6.html](https://www.gesetze-im-internet.de/uwg_2004/__6.html);
[frankfurt-main.ihk.de](https://www.frankfurt-main.ihk.de/recht/uebersicht-alle-rechtsthemen/wettbewerbsrecht/unlauterer-wettbewerb/vergleichende-werbung)).
Entscheidend für die Produktgestaltung: § 6 UWG betrifft **Werbung**, also das, was der Kunde
anschließend nach außen sagt — die interne Analyse ist davon nicht erfasst. Ein Produkt, das
Formulierungen *zum Veröffentlichen* vorschlägt („anders als X …"), führt den Kunden in dieses Risiko.
**Zeigen darf man** dem Kunden: wörtliche Zitate der Wettbewerber-Website als Beleg, neutrale
Einordnung („beide versprechen Geschwindigkeit"), freie Stellen. **Nicht produzieren** sollte man:
Werturteile über die Qualität des Wettbewerbers, Scores/Noten pro Wettbewerber, fertige
Vergleichs-Claims für die eigene Website.

---

### 4. Realistische Datenquellen

**Geht ohne Budget:** Website-Fließtext (Startseite, Über-uns, Leistungen, Preise), `<title>`,
Meta-Description, Open-Graph, JSON-LD/schema.org, Navigationslabels, Sitemap, Blog-Titel als
Themenprofil, App-Store-Beschreibungen. Das reicht für Versprechen, Tonalität, Zielgruppenansprache,
Preistransparenz, Kategorie-Konventionen — also für alles, was branding.supply als Feld führt.

**Geht nicht ohne Geld oder gar nicht:** Marktanteile, gestützte Bekanntheit, Werbedruck, echte
Wahrnehmung. Referenzpreise: Similarweb ab 125 $/Monat (jährlich) für Web Intelligence, API
faktisch nur im Enterprise-Vertrag ab ~1.000 $/Monat, kein Self-Serve-Tarif enthält API
([vendr.com/marketplace/similarweb](https://www.vendr.com/marketplace/similarweb);
[saaspricepulse.com](https://www.saaspricepulse.com/tools/similarweb)); Semrush Pro ab 139,95 $/Monat,
API erst im Business-Tarif 499,95 $/Monat ([getspike.ai](https://getspike.ai/blog/similarweb-vs-semrush/)).
Google Places: Felder mit Bewertungen kosten 40 $/1.000 Anfragen, das alte 200-$-Guthaben ist durch
SKU-Freikontingente ersetzt ([woosmap.com](https://www.woosmap.com/blog/google-places-api-pricing), 2026).
LinkedIn ist **ausgeschlossen**: die Nutzungsbedingungen verbieten Scraping und automatisiertes
Kopieren ausdrücklich ([linkedin.com/legal/l/service-terms](https://www.linkedin.com/legal/l/service-terms);
[linkedin.com/help/…/a1341387](https://www.linkedin.com/help/linkedin/answer/a1341387)).

---

### 5. Praktiker-Stimmen

Der Tenor ist konsistent und unfreundlich: Ohne interne Daten und ohne laufend aktualisierte
Datenschicht bleibt KI-Output **oberflächlich** und muss von Hand verifiziert werden; Preisstufen,
Paketgrenzen und Kundenlogos klingen überzeugend und sind teils **frei erfunden**
([contify.com](https://www.contify.com/resources/blog/competitive-intelligence-reports-with-ai/), 2026).
Klue selbst — also ein Anbieter, der davon lebt — schreibt, ChatGPT liefere zu Wettbewerbern häufig
„generisch, veraltet oder schlicht falsch" ([klue.com/blog/how-to-do-competitive-analysis-with-ai](https://klue.com/blog/how-to-do-competitive-analysis-with-ai)).
Typische Halluzinationen betreffen Gründungsjahr, Standort, Finanzierung, Partnerschaften; in
überfüllten Kategorien werden Alleinstellungsmerkmale dem falschen Anbieter zugeschrieben
([pagecrawl.io](https://pagecrawl.io/blog/ai-hallucination-brand-monitoring)).
Ein Gegenargument aus der Marktforschung ist bemerkenswert: eben diese „Halluzinationen" sind als
Messgröße für **Markenassoziationen** brauchbar — was das Modell falsch zusammenzieht, verrät, wie
schwach die Marke abgegrenzt ist (eMarketer, zitiert 2026 **[unsicher]**, Sekundärquelle).
Spezifische Reddit-/HN-Threads ließen sich über die Suche nicht belegen — die Praktikersicht stammt
hier aus Anbieter- und Agenturblogs, was ein Bias-Risiko trägt **[unsicher]**.

**Was daraus für den Zuschnitt folgt:** Der Wert entsteht nicht durch „mehr Daten", sondern durch
**Belegpflicht**. Jede Aussage über einen Wettbewerber muss ein wörtliches Zitat von dessen Website
plus URL plus Abrufdatum tragen. Was nicht belegbar ist, wird nicht behauptet. Das schließt
Halluzinationen strukturell aus, erfüllt die UWG-Nachprüfbarkeit und ist gleichzeitig das
Verkaufsargument gegenüber „ChatGPT kann das auch".

---

### Tool-Tabelle

| Tool | Vergleicht was | Ausgabe | Preis | Zielgruppe | Sichtbare Schwäche | Quelle |
|---|---|---|---|---|---|---|
| Crayon | Websites, Preisseiten, Changelogs, Stellen, Social | Battlecards, Alerts, Dashboards | 20–40 k$/J. Mid-Market, 50–100 k$+ Enterprise | B2B-SaaS Product/Sales | Signalflut, Vertriebsfokus, kein Markenmodell | [parano.ai](https://parano.ai/blog/klue-vs-crayon) |
| Klue | dito, plus Deal-Intel | Battlecards, CRM/Slack-Push | 16–30 k$/J., Enterprise 40 k$+ | B2B-SaaS Enablement | wie Crayon; Preis für Kleinmarken unmöglich | [parano.ai](https://parano.ai/blog/klue-vs-crayon) |
| Kompyte | automatisiertes Wettbewerber-Tracking | Reports, Alerts | ab ~300 $/J. | Mid-Market | flacher als Crayon/Klue **[unsicher]** | [analook.com](https://www.analook.com/research/competitive-intelligence-market-2026.html) |
| Semrush AI Visibility Toolkit | Nennung/Sentiment in LLM-Antworten vs. Wettbewerber | Prompt-Tracking, Sentiment, Empfehlungen | 99 $/Mon./Domain, 25 Prompts | SEO/Marketing | misst Sichtbarkeit, nicht Positionierung; kein Trial | [semrush.com/pricing/ai](https://www.semrush.com/pricing/ai/) |
| Ahrefs Brand Radar | Markenerwähnung über 6 KI-Plattformen, 260 M+ echte Prompts | Indizes, Vergleiche | 199 $/Mon./Plattform, 699 $ gebündelt | SEO | kein Sentiment-Report, teuer im Vollausbau | [explodingtopics.com](https://explodingtopics.com/blog/ai-visibility-vs-brand-radar) |
| Similarweb | Traffic, Kanäle, Zielgruppenüberschneidung | Dashboards, Reports | ab 125 $/Mon. (jährl.); API Enterprise ~1.000 $+ | Growth/Analytics | keine Markeninhalte; API self-serve nicht verfügbar | [vendr.com](https://www.vendr.com/marketplace/similarweb) |
| Tracksuit / Latana | echte Wahrnehmung per Panel-Befragung | Awareness/Consideration-Dashboards | ~25 k$/J. bzw. 20–50 k$/J. **[unsicher]** | Wachstumsmarken | Sample zu klein für Nischen, für Solo-Marken unbezahlbar | [koji.so](https://www.koji.so/blog/best-brand-tracking-software-2026) |
| IdeaProof | Website→Strategie; Wettbewerbsanalyse separat | Archetyp, Mission, UVP, Voice-Achsen, Taglines, Positioning-Map | Credit-basiert (Strategie 50, Competitor 70) | Gründer/Startups | Vergleich ist Zusatzmodul, Tiefe unklar **[unsicher]** | [ideaproof.io](https://ideaproof.io/brand-strategy) |
| ChatGPT/Perplexity direkt | alles und nichts | Prosa | ~20 $/Mon. | jeder | halluziniert Preise, Logos, Fakten; veraltet | [klue.com](https://klue.com/blog/how-to-do-competitive-analysis-with-ai) |
