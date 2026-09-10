# Brand Insights — Kuration, Merkliste, Artikel aus Video (BI2)

> **Sorte:** Plan (noch nicht gebaut). Fortsetzung von
> [BRAND-INSIGHTS.md](BRAND-INSIGHTS.md) — dort steht das Redaktionskonzept
> BI1, hier nur, was Davids Wünsche vom **2026-09-09** daran anbauen.
> Offene Punkte gehören nach `docs/OPEN-ITEMS.md`, nicht in dieses Dokument.

## 0. Der Anlass — Davids sieben Wünsche

Nach dem ersten Blick auf den Themenradar (live seit 2026-09-10) hat David
sieben Dinge benannt. Sie hängen zusammen, aber sie sind nicht dasselbe
Vorhaben — deshalb stehen sie hier einzeln, mit dem, was sie kosten:

1. **Woher kommen die elf Kanäle?** Einsehen und bearbeiten können, die Liste
   einschränken können.
2. **Kanäle in Cluster setzen** — Brand-Design, Branding, SEO, GEO,
   Branding & KI, Brand Strategy.
3. **Filtern und sortieren** — heute ist alles nach Opportunity sortiert, es
   gibt keinen Themen-Filter und keine Sortierung nach Aufrufen oder Likes.
4. **Eine eigene Liste** — YouTube-Link einwerfen, Video wird wie im Radar
   ausgelesen (Kanal, Titel, Thema, Aufrufe, Likes, Kommentare, Alter,
   Opportunity). Getrennt vom Radar, Davids eigene Fundstücke.
5. **Zwei Links je Zeile, in BEIDEN Listen** — einer öffnet das Video in einem
   neuen Tab, einer ist ein Schalter mit drei Stellungen: „Nicht geprüft",
   „Uninteressant", „Interessant".
6. **Filter „nur Interessante"** — die Vorauswahl.
7. **Aus einem Video einen Artikel** — KI liest das Video aus, schreibt einen
   Beitrag nach SEO/GEO-Regeln, der Freude beim Lesen macht und zum
   Diskutieren anregt; darunter das `comments`-Feature.

Punkt 7 ist der einzige mit einer echten Rechtsfrage. Punkte 1–6 sind Handwerk.

---

## 1. Antwort auf Frage 1 — woher die Kanäle kommen

**Sie stehen im Code**, in `apps/branding/app/app.config.ts` unter
`pukalani.insights.radar.channels` — heute **elf Zeilen**. Eine zwölfte
(Pentagram) wurde am 2026-09-10 entfernt, weil die Kanal-Id einem Privatkonto
gehörte; an ihrer Stelle steht ein Kommentar mit der Begründung. Jede Zeile
trägt drei Dinge: die Kanal-Id (`UC…`), das Cluster,
für das der Kanal steht, und einen Anzeigenamen als Lesehinweis.

**Warum sie dort stehen und nicht in einer Tabelle**, steht wörtlich im Kopf
von `packages/insights/shared/insightsRadar.ts`: die Liste ändert sich seltener
als ein Deploy, sie ist eine redaktionelle Entscheidung, und „warum ist dieser
Kanal drin?" beantwortet ein Kommentar neben der Zeile, keine Datenbank-Row.

**Einsehen kannst du sie heute nur im Code, bearbeiten nur per Deploy.** Genau
das soll sich ändern — und damit steht die damalige Begründung zur Revision.
Sie war nicht falsch, sie hat nur mit einer Annahme gerechnet, die sich als
unzutreffend erwiesen hat: dass die Liste selten wechselt. Der erste Prod-Lauf
hat drei tote Kanäle gezeigt, und der Betreiber will jetzt kuratieren, nicht
deployen.

### Entscheidungsfrage A — wo wohnt die Kanalliste künftig?

| | Weg | Was er kostet | Was er bringt |
|---|---|---|---|
| **A1** | Config bleibt, Dashboard zeigt sie nur an | fast nichts | erfüllt „bearbeiten" nicht |
| **A2** | **Tabelle `insights_channels`, Dashboard bearbeitet sie, Config wird einmalig übernommen und danach nicht mehr gelesen** | eine Migration, ein Übernahme-Skript | **eine Wahrheit, an einer Stelle** |
| A3 | Hybrid: Config = Grundstock, Tabelle = Ergänzungen und Ausblendungen | zwei Wahrheiten | nichts, was A2 nicht auch kann |

**Empfehlung: A2.** A3 sieht nach Kompromiss aus und ist der teuerste Weg: bei
jeder Frage „warum läuft dieser Kanal?" müssten künftig zwei Orte gelesen und
in der richtigen Reihenfolge verrechnet werden. Der Verlust bei A2 ist echt,
aber klein — die Begründung „warum ist der drin?" wandert aus dem
Code-Kommentar in ein **Notiz-Feld an der Zeile**, und die Versionsgeschichte
dieser Notiz gibt es dann nicht mehr. Dafür gibt es etwas Besseres: das Feld
steht neben dem Kanal statt in einer Datei, die niemand öffnet.

### Was die Kanal-Seite können muss

* **`/dashboard/insights/channels`** hinter `insights.manage`, wie alle
  Redaktionsseiten. `UTable` (B6), leerer Zustand über `CoreEmptyState`.
* **Spalten:** Kanal (Name + Handle), Cluster, Zustand, jüngster Upload,
  Videos im letzten Lauf, Notiz.
* **Einschränken heißt ausschalten, nicht löschen** — ein Kanal bekommt
  `active: false` und bleibt mit seiner Notiz stehen („liefert seit 2023
  nichts", „Id war ein Privatkonto"). Löschen wäre der Weg, denselben Irrtum
  in einem halben Jahr ein zweites Mal zu machen.
* **Anlegen mit Prüf-Vorschau — die Lehre aus Pentagram.** Wer eine Id oder
  ein Handle einträgt, bekommt vor dem Speichern **Titel, Abonnentenzahl und
  das Datum des jüngsten Uploads** zu sehen und bestätigt DIESEN Kanal. Die
  Regel steht schon im Gedächtnis des Projekts und wird hier zur Mechanik:
  *ein Kanal ist erst geprüft, wenn Titel und jüngster Upload zur Erwartung
  passen, nicht nur die Id.* Kosten: 1 Quota-Einheit je Vorschau.
* **Handles auflösen.** `@thefutur` ist das, was ein Mensch in der Hand hat;
  `UC-b3c7kxa5vU-bnmaROgvog` ist das, was die API will. `channels.list` kann
  `forHandle` — 1 Einheit, und der Betreiber muss nie wieder eine Id von Hand
  suchen.

**Migration `insights-005`,** dieselben Hausregeln wie 001–004 (server-only,
`permissions: []`, kein `communityId`, Indizes über `createIndexSteps`). Die
Zeile enthält keine API-Daten im Sinne der Policies außer Name und
Abonnentenzahl — beide werden vom täglichen Lauf ohnehin neu geholt.

---

## 2. Die Cluster — Davids sechs treffen unsere acht nicht

Heute gibt es **einen** Katalog (`INSIGHTS_TOPICS` in `insightsPost.ts`), und
er trägt zwei Lasten: er rubriziert die Radar-Videos, und er rubriziert die
öffentlichen Beiträge. Acht Schlüssel:

`rebranding` · `brand-psychology` · `brand-analysis` · `brand-strategy` ·
`brand-language` · `seo-geo` · `brand-experience` · `visual-identity`

Davids sechs Wünsche dagegen: Brand-Design · Branding · SEO · GEO ·
Branding & KI · Brand Strategy. Drei Unterschiede fallen auf:

* **SEO und GEO sind bei uns EIN Schlüssel** (`seo-geo`), bei David zwei. Er
  hat recht: das sind zwei Disziplinen mit zwei Fragen. „Wie finde ich das bei
  Google?" und „Wie zitiert mich eine KI-Antwort?" haben verschiedene
  Antworten, und ein Radar, der sie zusammenwirft, kann die eine nicht zeigen,
  ohne die andere mitzuschleppen.
* **„Branding & KI" gibt es bei uns nicht.** Das ist die Lücke, die am
  meisten kostet — es ist das Thema, über das gerade am meisten geredet wird.
* **„Brand-Design" heißt bei uns `visual-identity`.** Dasselbe Ding, anderes
  Wort. Hier braucht es keinen neuen Schlüssel, nur ein anderes Etikett.

### Entscheidungsfrage B — ein Katalog oder zwei?

| | Weg | Folgen |
|---|---|---|
| **B1** | **Den EINEN Katalog erweitern** — er gilt weiter für Radar UND Beiträge | ein Vokabular; das Video, das ein Artikel wird, behält seine Rubrik |
| B2 | Zwei Achsen: öffentliche Themen (8) + freie Radar-Cluster | Radar-Kuration ohne Rückwirkung — aber jeder Schritt vom Video zum Artikel ist eine Übersetzung, und zwei Listen laufen auseinander |

**Empfehlung: B1**, konkret so:

| Schlüssel | Label heute | Label künftig | Änderung |
|---|---|---|---|
| `seo` | — | SEO | **aus `seo-geo` getrennt** |
| `geo` | — | GEO | **aus `seo-geo` getrennt** |
| `brand-ai` | — | Branding & KI | **neu** |
| `visual-identity` | Visual Identity | **Brand Design** | nur das Etikett |
| `brand-strategy` | Brand Strategy | Brand Strategy | — |
| `rebranding`, `brand-psychology`, `brand-analysis`, `brand-language`, `brand-experience` | | | unverändert |

Ergibt **zehn Cluster**. Davids „Branding" als eigener Punkt geht bewusst
nicht mit ein: das ist der Oberbegriff für alle zehn, und ein Cluster, das
alles heißt, sortiert nichts.

**Kosten der Trennung `seo-geo` → `seo` + `geo`:** die Schlagwortliste bekommt
zwei Einträge statt einem (GEO: „ai overview", „llm", „chatgpt", „answer
engine", „aeo", „geo" — SEO behält den Rest), die Tests zeigen, was sich
verschiebt. Bestandsdaten sind kein Problem: Radar-Zeilen werden täglich neu
geschrieben, und `insights_posts` trägt heute keinen veröffentlichten Beitrag
mit dieser Rubrik. Die drei SEO-Kanäle (Ahrefs, Google Search Central,
Semrush) werden auf der neuen Kanal-Seite von Hand zugeordnet.

---

## 3. Filtern und sortieren — was heute fehlt und warum

`InRadar.vue` rechnet die Opportunity je Zeile und sortiert die Liste **fest**
danach, bevor `UTable` sie überhaupt sieht. Deshalb gibt es keine
Spaltensortierung — nicht weil `UTable` sie nicht könnte, sondern weil die
Reihenfolge vorher schon entschieden ist. Ebenso fehlt jeder Filter.

**Zu bauen (reine Oberfläche, keine Migration, kein Gate):**

* **Sortierung über jede Zahlenspalte** — Aufrufe, Likes, Kommentare, Alter,
  Opportunity. `UTable` bringt sie mit, sie muss nur erlaubt werden.
  **Standard bleibt Opportunity absteigend**, damit sich das Bild beim Öffnen
  nicht ändert.
* **Filter Cluster** — Mehrfachauswahl, „nur Brand Strategy" ist damit ein
  Klick.
* **Filter Kanal** — dieselbe Mechanik, für „was macht Ahrefs gerade?".
* **Filter Urteil** — „Nur Interessante", „Ohne Uninteressante" (Vorgabe),
  „Alle". Siehe Abschnitt 5.
* **Zeitraum** — 7 / 30 / 90 / alle Tage. Der Alters-Deckel von 180 Tagen
  bleibt darüber und wird weiter angeschrieben.
* **Eine Zeile Zusammenfassung** über der Tabelle: „37 von 205 Videos",
  damit ein Filter nie unbemerkt greift.

**Wichtig für `null`:** eine Zeile ohne Opportunity heißt „kein Signal", nicht
„schlecht". Sie steht heute am Ende und muss auch bei jeder anderen Sortierung
am Ende stehen, nie als Null mitgerechnet.

---

## 4. Die eigene Liste — „Fundstücke"

Eine zweite Tabelle im selben Bereich, **`/dashboard/insights/fundstuecke`**,
gespeist über ein Feld „YouTube-Link einfügen". Sie zeigt dieselben Spalten
wie der Radar und rechnet mit **denselben reinen Regeln** — dieselbe
Einordnung (`insightsRadarClassify`), dieselbe Opportunity-Formel. Zwei Listen
mit zwei Rechenwegen wären zwei Wahrheiten über dasselbe Video.

**Was der Link-Wurf tut:** Video-Id aus jeder üblichen Form lesen
(`youtube.com/watch?v=`, `youtu.be/`, `/shorts/`, mit und ohne Parameter),
dann `videos.list` (1 Einheit) und, falls der Kanal unbekannt ist,
`channels.list` (1 Einheit). Danach steht die Zeile.

### Der eine Unterschied, der wirklich zählt: die Zeile stirbt nicht

Die Radar-Tabelle ist **flüchtig** — der Lauf überschreibt täglich, das
30-Tage-Netz löscht ganze Zeilen, und Videos über 180 Tage kommen gar nicht
erst hinein. Das ist richtig so (Policies III.E.4) und für den Radar auch
gewollt: er zeigt, was jetzt läuft.

**Für Deine eigene Liste wäre genau das der Fehler.** Du findest ein Video,
hältst es fest, und drei Wochen später ist es weg, weil ein Aufräum-Lauf
nicht wusste, dass es Deins war. Deshalb gilt hier eine andere Aufteilung
innerhalb derselben Zeile:

* **Deins und dauerhaft:** die Video-Id, wann Du es hinzugefügt hast, Dein
  Urteil, Deine Notiz, das Cluster, das Du gesetzt hast. Das sind keine
  API-Daten — das sind Deine Aufzeichnungen über ein Video.
* **Von YouTube und flüchtig:** Aufrufe, Likes, Kommentarzahl, Kanalname,
  Abonnenten, Titel, Veröffentlichungsdatum. Die zieht der tägliche Lauf mit
  (ein Stapel je 50 Videos = 1 Einheit) und schreibt sie neu.
* **Wenn ein Video nicht mehr abrufbar ist** (gelöscht, privat), werden die
  **Zahlen geleert und die Zeile bleibt**, mit einem sichtbaren Hinweis. Im
  Radar geht in diesem Fall die ganze Zeile — der Unterschied ist beabsichtigt
  und gehört in den Kopf der Migration.
* **Kein Alters-Deckel.** Du findest absichtlich auch alte Videos. Die 180
  Tage sind eine Regel des Radars („was läuft gerade"), nicht Deiner Liste.

**Migration `insights-006`**, `insights_watchlist`.

---

## 5. Der Schalter — und warum er nicht auf die Radar-Zeile gehört

David will drei Stellungen: **Nicht geprüft · Uninteressant · Interessant**,
in beiden Listen. Der naheliegende Weg wäre eine Spalte an der Radar-Zeile.
**Das wäre ein Fehler,** und zwar ein stiller: die Radar-Zeile wird täglich
überschrieben und nach spätestens 30 Tagen gelöscht. Ein Urteil, das mit ihr
verschwindet, ist die Arbeit nicht wert, die es gekostet hat.

**Das Urteil lebt deshalb in der Fundstück-Tabelle, geschlüsselt über die
Video-Id.** Der Radar liest es dazu (ein `listRows` über die Ids der
angezeigten Videos). Daraus folgt eine Mechanik, die genau das tut, was David
beschreibt:

> **„Interessant" im Radar zu klicken, LEGT das Video in Deine Liste.**

Der Radar ist damit der Zulauf, die Fundstücke sind die Vorauswahl, und der
Link-Wurf ist der zweite Weg hinein — für alles, was der Radar nicht sieht.
„Uninteressant" ist die Gegenrichtung: das Video bleibt vermerkt und der
Standard-Filter des Radars blendet es aus, damit es morgen nicht wieder oben
steht.

**Der zweite Link je Zeile** ist billig: die Adresse
`https://www.youtube.com/watch?v=<id>` folgt aus der Video-Id, es muss nichts
gespeichert werden. Neuer Tab, `rel="noopener"`, und der Kanalname wird
gleich mit verlinkt.

---

## 6. Aus einem Video ein Artikel — der Punkt mit der Rechtsfrage

Hier ist der Wunsch am größten und der gangbare Weg am schmalsten. Drei
Tatsachen zuerst, weil sie den Zuschnitt bestimmen:

1. **Die YouTube Data API liefert keine Transkripte.** `captions.download`
   funktioniert nur für Kanäle, die einem selbst gehören. Alle bekannten
   Transkript-Bibliotheken holen sich den Text an der API vorbei und verstoßen
   damit gegen die Nutzungsbedingungen — auf derselben Instanz, auf der wir
   einen API-Schlüssel betreiben.
2. **Was die API liefert, reicht weiter als gedacht:** `snippet` enthält
   **Titel, Beschreibung und Tags**. Bei guten Kanälen ist die Beschreibung
   ein Inhaltsverzeichnis mit Kapitelmarken — das ist Substanz, kein Titel.
3. **Ein Artikel, der ein fremdes Video nacherzählt, ist urheberrechtlich
   heikel und redaktionell schwach.** BI1 §4.1 hat dafür schon Regeln: Zitat
   höchstens 200 Zeichen, Quelle mit Datum, keine erfundenen Zitate, keine
   Zahl ohne Beleg.

### Entscheidungsfrage C — wie tief liest die KI das Video?

| | Weg | Rechtslage | Empfehlung |
|---|---|---|---|
| **C1** | **Titel + Beschreibung + Tags werden zu einem BRIEF** (Thesen, offene Fragen, Gegenpositionen) — der Brief geht in den bestehenden Entwurfs-Weg, der Artikel ist unser eigener Text zum THEMA, mit dem Video als einer Quelle | sauber, keine neue Frage | **ja** |
| C2 | Transkript besorgen und auswerten | ToS-Verstoß über Drittanbieter; über Google Speech-to-Text teuer und braucht die Audiospur, an die wir legal nicht kommen | nein |
| C3 | Du schaust das Video und tippst den Brief | geht heute schon | als Ergänzung, nicht als Ersatz |

**Empfehlung: C1, mit C3 daneben.** Der Knopf heißt dann ehrlich **„Brief aus
diesem Video"** und nicht „Video analysieren" — er zündet, er ersetzt Dich
nicht. Was er tut: legt einen Beitrag im Zustand `draft` an, füllt den Brief
mit Thesen und offenen Fragen, trägt das Video als Quelle in `sources` ein
(Kanal als Publisher, Veröffentlichungsdatum als Datum) und lässt Dich vor dem
Entwurf noch einmal darüber. Danach läuft alles durch die bestehende Redaktion
— sechs Prüfregeln, Beleg-Riegel, Freigabe. Neue Prompt-Fassung
`insights-b-1`; der Prompt bekommt ausdrücklich mit, dass er **nicht
zusammenfassen** soll, sondern **anknüpfen**.

### Die SEO/GEO-Regeln — eine Prompt-Frage, kein Bauwerk

Davids zweiter Halbsatz („alle SEO/GEO-relevanten Regeln beachten, Freude beim
Lesen, am Ende zum Diskutieren anregen") ist am billigsten dort aufgehoben, wo
die Regeln heute schon stehen: in einer neuen Fassung des Entwurfs-Prompts,
**`insights-d-2`**. Was hineingehört:

* **Die Antwort im ersten Absatz.** Eine KI-Antwortmaschine zitiert den Satz,
  der die Frage beantwortet — nicht den, der sie ankündigt.
* **Zwischenüberschriften als Fragen**, in der Sprache, in der Menschen sie
  stellen. Das ist zugleich der Aufhänger für FAQ-Auszeichnung.
* **Definierende Sätze** („X ist …") — das ist die Form, die zitierfähig ist.
* **Ein FAQ-Block am Ende** mit drei bis fünf echten Fragen.
* **Eine Diskussionsfrage als letzter Absatz** — Davids Wunsch, und zugleich
  die Brücke zu den Kommentaren.
* **Keine Floskeln, kein „In der heutigen schnelllebigen Welt".** Der Prompt
  soll den Sound benennen, den branding.supply sonst spricht.

Eine **siebte Prüfregel** kann das durchsetzen, wo es prüfbar ist: „endet mit
einer Frage" und „hat mindestens zwei Frage-Zwischenüberschriften" sind reine
Regeln, die ein Test lesen kann. Alles Übrige ist Prompt und bleibt Prompt.

### Kommentare unter den Artikeln

Der `comments`-Layer ist **nicht** im Manifest von `apps/branding` — er müsste
montiert werden (Manifest, extends, LAYER_ORDER, Bilanz, Paritäts-Soll), seine
Tabellen kämen auf die `branding`-Instanz, und Moderation plus DSGVO-Beitrag
hängen mit dran. Vor allem aber: **es gibt noch keine öffentlichen Seiten.**
Paket I3 ist am Anwalts-Gate (BI1-3/BI1-4). Kommentare unter Artikeln sind
deshalb ein eigenes Paket **nach I3**, nicht Teil dieser Runde.

---

## 7. Die Pakete, in der Reihenfolge, in der sie fallen

| # | Paket | Braucht | Aufwand |
|---|---|---|---|
| **K1** | **Cluster-Katalog erweitern** — `seo`/`geo` trennen, `brand-ai` neu, Label „Brand Design"; Schlagwortlisten + Tests | Entscheidung B | S |
| **K2** | **Filtern und sortieren** im Radar — Spaltensortierung, Cluster-/Kanal-/Zeitraum-Filter, Trefferzeile | K1 | S |
| **K3** | **Kanal-Seite** — Migration `insights-005`, `/dashboard/insights/channels`, Handle-Auflösung, Prüf-Vorschau, aktiv/inaktiv, Notiz; Übernahme der elf Config-Zeilen | Entscheidung A · Davids Ja zur Prod-Migration | M |
| **K4** | **Fundstücke + Schalter** — Migration `insights-006`, Link-Wurf, Urteil in beiden Listen, YouTube-Link je Zeile, Filter „nur Interessante"; Sweep zieht die Zahlen mit | K1 · Davids Ja zur Prod-Migration | M |
| **K5** | **Brief aus Video** — Prompt `insights-b-1`, Knopf auf den Fundstücken, Beitrag als Entwurf mit Video-Quelle | Entscheidung C · K4 | S |
| **K6** | **SEO/GEO-Artikelregeln** — Prompt `insights-d-2`, siebte Prüfregel | — | S |
| **K7** | **Kommentare unter Artikeln** — `comments` in `apps/branding` montieren | **nach I3** (Gate Anwalt) | M |

K1 und K2 haben kein Gate und keine Migration — sie können sofort laufen und
liefern schon den größten Teil von Davids Punkten 2 und 3. K3 und K4 brauchen
je ein Ja zur Prod-Migration. K7 wartet auf die Anwaltsantworten, wie I3.

## 8. Was dieses Vorhaben NICHT tut

* **Keine `search.list`-Entdeckung.** Der eigene kleine Tages-Eimer (100
  Aufrufe) und Leitplanke (c) aus BI1 §9.6 gelten weiter. Neue Kanäle kommen
  von Hand oder gar nicht.
* **Keine Kommentar-Texte, keine Nutzernamen.** Leitplanke (b) steht bis zur
  Anwaltsantwort BI1-2 unverändert.
* **Kein Verdichten über Kanäle hinweg.** Auch die Fundstück-Liste bleibt
  „eine Zeile = ein Video" (Policies III.E.2). Es gibt weiterhin keine
  Kanal-Tabelle mit Summen.
* **Keine Transkripte**, solange C2 nicht ausdrücklich entschieden und
  anwaltlich gedeckt ist.
