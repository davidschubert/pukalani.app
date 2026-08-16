# Discussions — Produkt-Konzept

**Teil 1** (2026-07-27) konserviert Davids Produkt-Entscheidungen. **Teil 2**
(2026-08-03, unten) ist der Schnitt-Entwurf: was davon heute noch trägt, wo die
Grenze zu `posts` wirklich verläuft, und welche drei Entscheidungen vor dem
ersten Commit fallen müssen.

Status (2026-08-09): **entscheidungskomplett (3.8); Stufen 1–4 gebaut, und
alle acht Punkte aus Teil 5 sind durch** — Jahrestag, Regeln-Vorlage,
Hilfe-Umbenennung, `posts.editedAt`, Mehrfach-Abzeichen + Benachrichtigung,
Vertrauensstufen und Private Nachrichten (eigener Layer `packages/messages`).

**Teil 4 ist seit dem 2026-08-14 VOLLSTÄNDIG GEBAUT.** Die vier Mechaniken —
Emoji-Reaktionen, Einladungen durch Mitglieder, Tages-Limit für Likes und
zuletzt die **Themen-Verlinkung mit Rückverweis** — stehen samt der Abzeichen,
die daran hängen (`first-reaction`, `promoter`, `out-of-love` …, `first-link`).

**`Campaigner`/`Champion` sind seit dem 2026-08-14 ebenfalls GEBAUT**
(F57-Stufen) — samt dem eigenen Verleihungs-Pfad, den sie brauchten: der
Einladende wird bei der ANNAHME an der Zähler-Zeile des Eingeladenen
hinterlegt (`invitedBy`), und dessen späterer Stufen-Aufstieg zählt bei ihm
hoch. Im selben Paket staffelt das Tages-Like-Limit mit der Vertrauensstufe
(50/50/75/100).

**NICHTS IST MEHR OFFEN — archiviert am 2026-08-15.** Diese Datei ist ab hier
**Begründung und Rezept, keine Arbeitsliste**. Der eine Grund, aus dem sie
zuletzt noch in `docs/plans/` lag, war Davids Frage, ob Reaktionen auch
auf ANTWORTEN gehören. Sie ist am 2026-08-13 mit **„Ja, nachbauen"**
beantwortet und am 2026-08-14 gebaut (eigenes Datenmodell im comments-Layer,
`comment_reactions`/comments-019 — Begründung unten bei „Emoji-Reaktionen").
**Emoji-Reaktionen sind seit dem 2026-08-13 GEBAUT** (Teil 5, „Reaktionen");
`first-reaction` steht im Katalog. F57 ist damit geschlossen und aus
[OPEN-ITEMS.md](../OPEN-ITEMS.md) heraus — der Abschluss steht in
[OPEN-ITEMS-COMPLETE.md](../OPEN-ITEMS-COMPLETE.md), die Entscheidung im
[DECISION-LOG](../DECISION-LOG.md) (2026-08-14).
**Zitat und Emoji im Editor sind seit F48 (2026-08-04) gebaut** — die
Aufzählung in Teil 4, die sie als fehlend führt, ist insoweit überholt.

Der Baustand steht in Teil 5 ganz unten.

---

## Teil 1 — Davids Entscheidungen (2026-07-27)

## Was es ist (Davids Worte, sinngemäß)

Ein Mittelding zwischen geführtem Forum und Reddit:

- Der **Admin legt Kategorien fest** (z. B. „pukalani", „gsap") — Struktur ist
  Admin-Sache, Mitglieder können KEINE Kategorien anlegen.
- **Mitglieder eröffnen Threads** innerhalb einer Kategorie.
- **Threads werden kommentiert** — über den normalen comments-Andockpunkt
  (targetType 'thread'), verdrahtet im site-Layer wie überall sonst.

Abgrenzung zu posts (Feed): Feed = ein Strom, alle posten durcheinander.
Discussions = Admin-Struktur + Threads. Beide nutzen comments darunter.

## Naming

- Kundenname: **Discussions / Diskussionen** (Landing nutzt das Wort schon).
- „Threads" vermieden (Meta-Produktname), „Forum" vermieden (klingt 2005).
- Code-Key beim Bau festlegen (Vorschlag: `discussions`); Kollision mit dem
  bisherigen Landing-Wording „Diskussionen" (dort = comments-Baustein) beim
  Baustart auflösen.

## URL-Schema (entschieden)

```
/discussions/<kategorie>                      z. B. /discussions/pukalani
/discussions/<kategorie>/<id>/<slug>          z. B. /discussions/pukalani/1v7ornq/polipoli-open-yet
```

- **Die ID ist die Wahrheit** (kurz, unveränderlich). Der Slug ist Deko für
  Menschen/SEO und wird aus dem Titel abgeleitet.
- Titel-Änderung ⇒ neuer Slug, alte Links bleiben gültig: der Server löst nur
  über die ID auf und leitet bei falschem/alten Slug per 301 auf die
  kanonische URL um (Reddit-/StackOverflow-Muster; genau dafür trägt Reddit
  die ID in der URL).

**Ergänzung (2026-08-03, Davids Frage „Kategorie in die URL?"):** dieselbe
Regel gilt für das KATEGORIE-Segment. Der Server löst AUSSCHLIESSLICH über die
ID auf; stimmt Kategorie ODER Slug nicht mehr, antwortet er 301 auf die
kanonische URL. Damit ist Umkategorisieren gratis (alte Links leiten für immer
um — nötig, weil der Teil-3-Katalog TL3 das Umkategorisieren als Routine-Recht
gibt) und es entsteht kein Duplicate Content (nicht-kanonische Varianten
rendern nie, die Seite trägt ihr Canonical-Tag). Die SEO-Abwägung ist bewusst
KEIN Grund für das Schema: Keywords im Pfad sind ein schwaches Signal, ein 301
gibt Ranking vollständig weiter — die Kategorie steht für MENSCHEN im Link
(wer den Link geteilt bekommt, weiß vor dem Klick, wo er landet). Zum
Vergleich: Discourse und StackOverflow haben die Kategorie NICHT in der
Topic-URL; Reddit hat sie, dort kann ein Beitrag aber nie umziehen.

Der eine Link, der sich NICHT selbst heilt, ist die Kategorie-SEITE
(`/discussions/<kategorie>` — keine Topic-ID zum Auflösen). Deshalb für
Stufe 1: Kategorie-NAME frei änderbar, Kategorie-SLUG nach Anlage fest —
dasselbe Muster wie beim pages-Layer („Später nicht änderbar").
Slug-Umbenennung mit Alt-Slug-Gedächtnis ist eine spätere Ausbaustufe, falls
je gebraucht.

## Nicht verhandelbare Rahmenbedingungen (aus der Bilanz / Davids Prinzip)

- Konzept existiert EINMAL (eigener Layer), Komposition im site-Layer.
- Von Tag 1 durch die Datentür (`tenantDb`, tenantId, ESLint-Liste,
  Pool-Unique-Indizes mit tenantId) — kein Silo-Umweg wie bei events/courses.
- Produkt-Gate über `pukalani.tenancy.products` (Tarif-Zuordnung entscheidet David
  beim Baustart); An/Aus-Schalter im Dashboard als **USwitch** (nicht Checkbox).
- Nur Erscheinung ist mandanten-variabel (Theme/Schrift), Verhalten nie.

---

# Teil 2 — Schnitt-Entwurf (2026-08-03)

> **Hinweis (noch am 2026-08-03):** Teil 3 unten erweitert den Funktionsumfang
> erheblich — die Messung „zwei Zeilen Unterschied zu posts" und die
> Aufwandsangabe „Tage" gelten seither nur noch für den KERN. Was der
> Vollausbau bedeutet, steht in Teil 3 unter „Was das am Schnitt ändert".

## Zuerst: das Konzept spricht eine Sprache, die es nicht mehr gibt

Teil 1 ist vom 2026-07-27 und nennt als Rahmenbedingungen „Komposition im
site-Layer" und „`tenantId`". Beides existiert so nicht mehr: die Komposition
gehört seit dem 2026-07-27 dem **blueprint**-Layer, und die Spalte heißt seit
E8-3 **`communityId`**. Ebenfalls unbekannt sind dem Text A5 (Mitgliedschaft als
Ereignis), C18 (Publikum je Community), M13 (Sperre friert Inhalte ein) und die
Trennung `as`/`actor` an der Datentür. Nichts davon kippt das Produkt — aber
niemand sollte danach bauen, ohne es zu übersetzen.

## Die Frage, die vor dem Datenmodell steht

**Was genau hätte Discussions, das `posts` heute nicht hat?** Nachgemessen statt
behauptet:

| | posts (heute) | Discussions (Konzept) |
|---|---|---|
| Beitragsarten | `post` · `poll` · `question` | Thread |
| Titel | ja (optional) | ja |
| Text | ja | ja |
| Auf/Ab-Stimmen | ja (`upvotes`/`downvotes`/`score`) | implizit erwartet |
| Kommentare darunter | ja (`targetType: 'post'`) | ja (`targetType: 'thread'`) |
| Moderation | Queue, `hidden`, Melde-Ziel | müsste entstehen |
| Planen/Entwurf | ja (`scheduled`) | — |
| **Kategorie** | **nein** | **ja, vom Admin gepflegt** |
| **Darstellung** | EIN Strom (Feed) | nach Kategorie gegliedert |

Der Unterschied schrumpft auf **zwei Zeilen**: eine Kategorie-Dimension und
eine nach ihr gegliederte Darstellung. Alles Übrige — Threads, Kommentare,
Stimmen, Moderation, Melde-Weg, Datentür, GDPR-Beitrag — steht in `posts` schon
und wurde dort in den letzten Wochen gehärtet.

## Drei Wege

**A — eigener Layer** (die stille Annahme von Teil 1). Eigene Tabellen, Routen,
Moderation, Melde-Ziel, Produkt-Gate. Ehrlicher Aufwand: **Wochen**. Der Preis
ist nicht die erste Version, sondern die zweite: zwei fast gleiche Produkte
driften auseinander, und jede Härtung (wie F15 gerade bei events) muss zweimal
gebaut werden. Genau davor warnt die Produkt-Bilanz.

**B — Kategorie als Dimension von `posts`, Discussions als eigene Ansicht.**
Eine vom Admin gepflegte Kategorien-Tabelle, ein optionales `categoryId` am
Beitrag, dazu die Routen und Seiten aus Teil 1 (`/discussions/<kategorie>/…`).
Ein Datenmodell, eine Moderation, ein Melde-Ziel. Aufwand: **Tage**. Discussions
ist damit ein Struktur- und Darstellungsprodukt auf `posts`, kein zweites
Forum daneben.

**C — nicht bauen.** Feed plus Kommentare decken kleine Communities ab. Für
zehn Mitglieder ist eine Kategorienstruktur Ballast.

**Meine Empfehlung: B.** Sie liefert genau das, was Teil 1 als Produkt
beschreibt — Admin besitzt die Struktur, Mitglieder eröffnen Threads, darunter
hängen Kommentare —, ohne die Hälfte von `posts` ein zweites Mal zu bauen. Und
sie ist umkehrbar: stellt sich heraus, dass Discussions doch ein eigenes Wesen
hat, ist die Kategorie-Spalte kein Hindernis, sondern der Migrationspfad.

## Die drei Entscheidungen, die David treffen muss

1. **Weg A, B oder C.**
2. **Wenn B: Wo erscheint ein kategorisierter Beitrag?** Entweder bleibt der
   Feed der Strom über ALLES (Discussions ist ein Filter darauf) — oder ein
   Beitrag mit Kategorie verlässt den Feed und lebt nur noch in seiner
   Kategorie. Das ist keine technische Frage: sie entscheidet, ob eine
   Community einen Ort hat oder zwei.
3. **Der Name.** Die Landingpage benutzt „Diskussionen" heute schon — für den
   Kommentar-Baustein. Zwei Dinge unter einem Wort ist genau die Sorte
   Verwechslung, die E11 („Produkte" statt „features") gerade beseitigt hat.
   Entweder bekommt der Kommentar-Baustein auf der Landing ein anderes Wort,
   oder das Produkt heißt anders.

## Erster Schnitt, wenn B gewählt wird

Gebaut wird in dieser Reihenfolge, jede Stufe für sich lauffähig:

1. Kategorien-Tabelle (`communityId`, Name, Slug, Reihenfolge, aktiv) +
   Verwaltung im Dashboard hinter `posts.manage`. Ohne Kategorien ändert sich
   für niemanden etwas.
2. `categoryId` am Beitrag (additiv, optional) + Auswahl beim Verfassen.
3. Die Seiten aus Teil 1 samt URL-Schema — inklusive der 301-Regel für den
   veralteten Slug, denn die ist der Grund, warum die Id in der URL steht.
4. Produkt-Gate `discussions` in `pukalani.tenancy.products` + Schalter im
   Dashboard.

**Ausdrücklich NICHT im ersten Schnitt:** Unterkategorien, Anheften, Sperren
eines Threads, „gelöst"-Markierung, Suche über Kategorien hinweg,
Benachrichtigung bei neuen Threads einer Kategorie. Jedes davon ist für sich
klein — zusammen sind sie das, was aus einem Schnitt ein Projekt macht.

## Was der Bau NICHT neu erfinden darf

Kategorien sind mandantengebunden: `communityId` an der Tabelle, Slug-Unique
**nur zusammen mit** `communityId` (Pool-Regel), Zugriff ausschließlich über
`tenantDb`, Melde-Weg über die bestehende Registry (`registerReportTarget`),
Moderation über die vorhandene `posts`-Queue. Wer hier etwas Eigenes baut,
baut die nächste F15.

---

# Teil 3 — Funktionskatalog (Davids Vorgaben, 2026-08-03)

David hat den Zielumfang konkretisiert. Das Vorbild ist erkennbar **Discourse**
— die Badge-Texte sind wortgleich dessen Standard-Katalog. Das ist als Spezifi-
kation vollkommen brauchbar; zwei Konsequenzen gehören aber ausgesprochen:
die TEXTE werden beim Bau eigenständig formuliert (wortgleiche Übernahme wäre
fremde Produktkopie, und sie müssen ohnehin nach de+en), und einige Kriterien
setzen Discourse-Funktionen voraus, die es hier nicht gibt — die stehen unten
je Stelle als **[fehlt: …]** und sind Teil der Aufwandsrechnung, nicht Kleingedrucktes.

## 3.1 Topics — die Startseite

Tabellenansicht (UTable, B6) mit den Spalten:

| Spalte | Inhalt |
|---|---|
| **Topic** | Headline, darunter die Kategorie |
| **Users** | Avatare der Beteiligten (gepostet oder geantwortet) |
| **Replies** | Anzahl Antworten |
| **Views** | Anzahl Aufrufe **[fehlt: Aufruf-Zählung je Topic]** |
| **Activity** | letzte Aktivität, relativ („16min ago", „5h ago", „30 days ago", „Jul 3") |

**Sortierung:** `Hot` · `Latest` · `Categories` · `Top`. Bei `Top` zusätzlich
der Zeitraum: All time · Year · Quarter · Month · Week · Today.
`Categories` wechselt in eine eigene Tabelle: **Category** (Name +
Beschreibung) | **Topics** (Anzahl, z. B. 8 · 322 · 1332 · 8843).

**Seitenleiste, dauerhaft:** die wichtigsten 5 Kategorien ODER die letzten 5,
in denen ich selbst gepostet/kommentiert habe (Entscheidung beim Bau, s. 3.7),
plus ein sechster Link „All categories".

## 3.2 Filter

„Filter topics by category, tag, or other criteria":

- `category` — Topics einer Kategorie
- `created-after` — Datum (YYYY-MM-DD) oder „vor N Tagen"
- `order` — Sortierfeld
- `status` — Topic-Zustand **[fehlt: Topic-Zustände open/closed/archived —
  posts kennt nur scheduled/published/hidden/deleted]**
- `users` — nach Beteiligten

## 3.3 Suche

Drei Bereiche: **Topics/Posts** · **Categories** · **Users**. Dazu aufklappbare
erweiterte Filter:

- Categorized (Dropdown: All categories, …)
- posted before/after (Datumsfeld)
- only return topics/posts: are the very first post · are pinned **[fehlt:
  Anheften]** · are wiki **[fehlt: Wiki-Beiträge]** · include images ·
  matching in title only
- where topics: any · open · closed · public · archived **[fehlt: alle vier
  Zustände]** · have zero replies · contain a single user · are solved ·
  are unsolved **[fehlt: „gelöst" — stand in Teil 2 ausdrücklich NICHT im
  ersten Schnitt; mit dieser Vorgabe wird es Ausbaustufe statt Ablehnung]**
- posted by (User-Suche) · posts (min/max) · views (min/max)

## 3.4 About-Seite des Discussions-Bereichs

- Beschreibungstext + Kontakttext + Möglichkeit, übergeordnet jemanden zu
  kontaktieren
- Zahlen: Anzahl User · Admins · Moderatoren · Startdatum („Created 2 months
  ago")
- Liste der Admins mit Profil-Link, Liste der Moderatoren mit Profil-Link
- Site activity: „58 topics in the last 7 days" · „87 posts today" · „639
  active users in the last 7 days" · „339 sign-ups in the last 7 days"
  (= Beitritte, messbar über community_members/A5) · „47.5k likes all time"

## 3.5 Regelwerk-Seiten (drei Navigationspunkte)

**Guidelines** · **Terms of Service** · **Privacy** — jeweils Text, vom
Community-Owner im Dashboard editierbar, beim Bau mit Beispieltext vorbefüllt.

Mechanik: NICHT neu erfinden — der `pages`-Layer kann genau das (editierbare
Textseiten, mandantengebunden seit pages-004, MEDIUMTEXT-Body, Dashboard-
Verwaltung). Der Bau ist im Kern ein Seed dreier Seiten je Community plus die
Navigation im Discussions-Bereich.

**Eine Rechtsfrage gehört vorher zu David:** eine je Community editierbare
„Privacy"-Seite auf Betreiber-Infrastruktur berührt die Betreiber-Rechtstexte
(A1). Wer haftet für das, was ein Owner dort schreibt — und wie stellt die
Seite klar, dass sie NEBEN der Betreiber-Datenschutzerklärung steht und sie
nicht ersetzt?

## 3.6 Badges

Vier Gruppen; einige mehrfach verleihbar (welche genau, wird beim Bau je Badge
festgelegt — Davids Hinweis: „some of them multiple times"). Kriterien mit
allen Zahlen; **[fehlt: …]** = setzt Nichtvorhandenes voraus.

**Vorab die eine Modell-Frage, an der die halbe Tabelle hängt:** die Kriterien
sprechen durchgehend von **Likes** (Herz), unser Bestand ist überall
**Auf/Ab-Stimmen** (posts UND comments: upvotes/downvotes/score). Entweder
zählt „Like" = Upvote (dann sind Downvotes badge-neutral), oder es kommt ein
echtes Herz NEBEN die Stimmen (zweites Signal, neue Tabelle). Das ist
Entscheidung Nr. 4 in 3.7 — ohne sie ist keine der Like-Zeilen baubar.

### Getting started

| Badge | Kriterium |
|---|---|
| Autobiographer | Profil ausgefüllt + Profilbild |
| Certified | Neuling-Tutorial abgeschlossen **[fehlt: interaktives Tutorial]** |
| Editor | ersten eigenen Beitrag bearbeitet |
| First Emoji | erstes Emoji im Beitrag **[fehlt: Emoji-Picker im Editor]** |
| First Flag | erste Meldung (Melde-Weg existiert) |
| First Like | erstes vergebenes Like |
| First Link | erster Link auf ein anderes Topic — **GEBAUT** (2026-08-14, F57 letzte Mechanik; Zähler `member_counters.linksMade`, gezählt wird der WIRKSAME Verweis) |
| First Mention | erste @-Erwähnung (existiert: comments/server/utils/mentions.ts) |
| First Onebox | erste automatische Link-Vorschau **[fehlt: Onebox]** |
| First Quote | erstes Zitat in einer Antwort **[fehlt: Zitier-Funktion]** |
| First Reaction | erste Emoji-Reaktion **[fehlt: Reaktions-Picker, ≠ Like]** |
| First Reply By Email | erste Antwort per E-Mail **[fehlt: Mail-EINGANG — es gibt nur Versand]** |
| First Share | erster geteilter Link über den Share-Knopf |
| New User of the Month | 2 neue User je Monat, gemessen an erhaltenen Likes **[braucht Monats-Job]** |
| Read Guidelines | Guidelines gelesen **[fehlt: Lese-Tracking]** |
| Reader | langes Topic (100+ Antworten) vollständig gelesen **[fehlt: Lese-Tracking je Topic]** |
| Wiki Editor | ersten Wiki-Beitrag bearbeitet **[fehlt: Wiki]** |
| Licensed | Fortgeschrittenen-Tutorial abgeschlossen **[fehlt: Tutorial]** |

### Community

| Badge | Kriterium |
|---|---|
| Welcome | erstes erhaltenes Like |
| Appreciated | ≥1 Like auf 20 verschiedenen Beiträgen |
| Thank You | 20 gelikte Beiträge + ≥10 vergebene Likes |
| Gives Back | 100 gelikte + ≥100 vergebene |
| Empathetic | 500 gelikte + ≥1000 vergebene |
| Respected | ≥2 Likes auf 100 Beiträgen |
| Admired | ≥5 Likes auf 300 Beiträgen |
| Enthusiast / Aficionado / Devotee | 10 / 100 / 365 Tage in Folge besucht **[fehlt: Besuchs-Streaks]** |
| Anniversary | 1 Jahr Mitglied + ≥1 Beitrag in dem Jahr |
| Out of Love / Higher Love / Crazy in Love | alle Tages-Likes an 1 / 5 / 20 Tagen verbraucht — **GEBAUT** (2026-08-14, F57 Mechanik 3; Zähler `member_counters.likeLimitDays`). Das Kontingent staffelt seit F57-Stufen mit der Vertrauensstufe (50/50/75/100), die Bedingung heißt deshalb „alle **eigenen** Tages-Likes" |
| Promoter / Campaigner / Champion | 1 Einladung / 3 Eingeladene wurden Basic / 5 wurden Member — **alle drei GEBAUT** (2026-08-14; `promoter` zählt die erste ANGENOMMENE Einladung, `campaigner`/`champion` den Stufen-Aufstieg der Eingeladenen über `member_counters.invitedBy` + `inviteesBasic`/`inviteesMember`, posts-021) |
| Nice/Good/Great Share | geteilter Link von 25 / 300 / 1000 externen Besuchern geklickt **[fehlt: Klick-Zählung]** |

### Posting

| Badge | Kriterium |
|---|---|
| Nice / Good / Great Reply | 10 / 25 / 50 Likes auf eine Antwort |
| Nice / Good / Great Topic | 10 / 25 / 50 Likes auf ein Topic |
| Popular / Hot / Famous Link | geposteter Link mit 50 / 300 / 1000 Klicks **[fehlt: Klick-Zählung]** |

### Trust Level

| Badge | Kriterium und verliehene Rechte |
|---|---|
| Basic (TL1) | Grundrechte: private Nachrichten **[fehlt: PN]**, Melden, Wiki **[fehlt]**, mehrere Bilder/Links je Beitrag |
| Member (TL2) | Einladungen, Gruppen-PNs **[fehlt: PN]**, mehr Tages-Likes |
| Regular (TL3) | umkategorisieren/umbenennen fremder Topics, stärkere Spam-Flags, noch mehr Likes |
| Leader (TL4, von Hand ernannt) | alle Beiträge editieren; pin/close/unlist/archive/split/merge **[fehlt: unlist, split, merge]** |

**Trust Levels sind kein Badge-Feature, sondern ein RECHTE-System** — sie
verleihen Fähigkeiten, die heute an Site-Rollen und Capabilities hängen
(requireCommunityPermission). Ein zweites, verhaltensbasiertes Rechtesystem
NEBEN dem RBAC ist die größte Architektur-Entscheidung dieses Katalogs und
braucht ein eigenes Ja von David — nicht als Nebenprodukt der Badges.

## 3.7 Was das am Schnitt ändert

Mit diesem Katalog ist Discussions im Vollausbau **kein „posts + zwei Zeilen"
mehr, sondern ein Forum der Discourse-Klasse** — die Teil-2-Messung gilt nur
noch für den Kern. Ehrliche Rechnung in Stufen (jede für sich lauffähig,
Weg B aus Teil 2 bleibt als Fundament richtig und wird durch den Katalog eher
BESTÄTIGT: nichts hier braucht ein eigenes Thread-Datenmodell, fast alles
braucht Zähl-, Lese- und Rechte-Infrastruktur OBENDRAUF):

1. **Kern (Tage):** Kategorien, Topics-Tabelle (ohne Views), Sortierung
   Hot/Latest/Top+Zeitraum/Categories, Seitenleiste, Basis-Filter,
   einfache Suche. = Teil 2, Stufen 1–4.
2. **Betrieb & Regelwerk (Tage):** Views-Zähler, Activity-Aggregation,
   About-Seite mit Statistiken, Guidelines/ToS/Privacy über die
   pages-Mechanik (+ die Rechtsfrage aus 3.5).
3. **Suche voll (Tage bis Woche):** erweiterte Filter; setzt die
   Topic-Zustände (open/closed/archived/pinned/solved) voraus, die hier
   erstmals entstehen.
4. **Badges (Woche+):** Katalog abzüglich der [fehlt:]-Einträge sofort
   baubar; jeder [fehlt:]-Eintrag ist ein eigenes kleines Feature davor.
   Braucht Ereignis-Zählung je User (Likes erhalten/vergeben, Streaks,
   Klicks) — eine neue, communityId-gebundene Infrastruktur.
5. **Trust Levels (eigenes Projekt):** siehe 3.6 — nur mit ausdrücklicher
   Architektur-Entscheidung.

## 3.8 Die sieben Entscheidungen — ALLE GEFALLEN (David, 2026-08-03)

Damit ist das Konzept **entscheidungskomplett**; offen ist nur noch der
Baustart (Feature-Stopp, siehe OPEN-ITEMS).

1. **Weg B** — Kategorie als Dimension von `posts`, Discussions als eigene
   Ansicht. Ein Datenmodell, eine Moderation; die Spalte wäre später der
   Migrationspfad, falls Discussions doch ein eigenes Wesen entwickelt.
2. **Kategorisierte Beiträge BLEIBEN im Feed.** Der Feed ist der Strom über
   alles, Discussions die strukturierte Sicht — eine Community hat EINEN Ort.
3. **Das Produkt heißt Discussions/Diskussionen**; der Kommentar-Baustein auf
   der Landing wird zu „Kommentare" umbenannt (reine Textänderung, gehört in
   Stufe 1).
4. **Like = Upvote.** Ein Signal, keine neue Tabelle, alle Badge-Kriterien
   sofort messbar. Downvotes bleiben (die Reddit-Hälfte des „Mitteldings")
   und sind badge-neutral.
5. **Trust Levels: später, nach Stufe 1–4** — als eigene
   Architektur-Entscheidung mit eigenem Entwurf. Die vier TL-Badges bleiben
   bis dahin ausgespart.
6. **Regelwerk: nur Guidelines jetzt** (pages-Mechanik, Beispieltext,
   Owner-editierbar). ToS/Privacy je Community erst nach der Rechtsklärung
   mit dem Anwalt — die steht mit A1 ohnehin an.
7. **Seitenleiste: meine letzten 5 Kategorien** (in denen ich gepostet oder
   kommentiert habe); ohne eigene Aktivität Rückfall auf die 5 größten. Plus
   „All categories".

---

# Teil 4 — Stufe-4-Entscheidungen (David, 2026-08-04)

**Zuschnitt Stufe 4: nur heute messbare Badges.** Alles, was an Upvotes,
eigenen Beiträgen, Mitgliedschaftsdauer und Profil hängt — Großteil von
„Getting started"/„Community", komplett „Posting" — plus die Ereignis-Zählung
je Nutzer als Fundament. Fehlende Badges kommen automatisch dazu, sobald ihre
Funktion existiert.

**Tracking-Bündel: NICHTS davon.** Lese-Fortschritt, Besuchs-Streaks und
Klick-Zählung geteilter Links verlangen personenbezogene Verhaltensprotokolle
und widersprechen dem Versprechen „Datenschutz-nativ, ohne Werbe-Tracking".
Kostet 9 Badges (Reader · Read Guidelines · Enthusiast/Aficionado/Devotee ·
Nice/Good/Great Share · Popular/Hot/Famous Link) — die entfallen DAUERHAFT,
nicht „später".

**Schreib-Werkzeuge — gebaut wird (alles über die Nuxt-UI-Editor-Bausteine,
nichts selbst gebaut):** Zitieren (UEditor Blockquote) · Emoji-Auswahl
(UEditorEmojiMenu) · Themen verlinken mit Rückverweis (UEditorSuggestionMenu).
**Alle drei GEBAUT** — Zitat und Emoji seit F48 (2026-08-04), die
Themen-Verlinkung seit dem 2026-08-14 (Einzelheiten in Teil 5).
**Onebox NICHT** — der Server holte fremde URLs ab (SSRF); wenn, dann als
eigenes Paket mit Sicherheitsentwurf.

**Soziale Mechaniken — alle vier gebaut**, in dieser Reihenfolge:
1. **Einladungen durch Mitglieder** (heute nur Owner/Admin) — der einzige
   echte Wachstumshebel, plattformweit nützlich. Braucht ein Kontingent gegen
   Missbrauch. Bringt Promoter/Campaigner/Champion.
   **GEBAUT am 2026-08-14** (5/Woche je Mitglied, Owner-Schalter, Rolle immer
   `viewer`) — Einzelheiten in Teil 5. Davon gekommen sind `promoter` und —
   mit dem Nachzügler-Paket F57-Stufen desselben Tages — `campaigner` und
   `champion`: der Einladende wird bei der Annahme hinterlegt, der spätere
   Aufstieg des Eingeladenen zählt bei ihm hoch.
2. **Tages-Limit für Likes** — klein; macht Likes knapp. Bringt Out of
   Love/Higher Love/Crazy in Love.
   **GEBAUT am 2026-08-14** (UTC-Kalendertag, Config-Wert; Rücknahme erstattet
   nichts) — Einzelheiten in Teil 5. Alle drei Abzeichen sind damit da. Seit
   F57-Stufen **staffelt das Kontingent mit der Vertrauensstufe**: TL0/TL1 =
   50, TL2 = 75, TL3+ = 100 (`likesPerDayByLevel`) — die Bremse trifft den,
   über den man nichts weiß, nicht die eigenen Leute.
3. **Emoji-Reaktionen neben den Stimmen.** Ich hatte abgeraten (drittes Signal
   am selben Beitrag); Davids Entscheidung steht. **Folgeregel, damit die
   Bedeutung eindeutig bleibt:** Badges zählen weiter AUSSCHLIESSLICH Upvotes
   (Entscheidung 4 gilt unverändert), Reaktionen sind reiner Ausdruck und
   badge-neutral — sonst hätte „Like" zwei Quellen.
4. **Private Nachrichten** — eigenes Produkt mit eigener Missbrauchsfläche
   (Belästigung, Spam) und eigener Moderation. Bekommt ein EIGENES Konzept vor
   dem Bau, wie Discussions eines hat; nicht als Anhängsel von Stufe 4.

**Reihenfolge:** Stufe 4 = Badges (heute messbar). Danach die Werkzeuge, dann
die sozialen Mechaniken 1–3, dann PN mit eigenem Konzept. Trust Levels (Stufe
5) bleiben davon unberührt und brauchen weiterhin ihr eigenes Ja.

---

# Teil 5 — Baustand (Stand: Stufe 4)

Damit niemand denselben Weg zweimal geht: was steht, was bewusst NICHT steht,
und wo die Begründung dafür lebt. Offene Punkte gehören nicht hierher, sondern
nach `docs/OPEN-ITEMS.md`.

## Gebaut

- **Stufe 1** Kategorien, Topics-Tabelle, Sortierung, Seitenleiste, URL-Schema
  mit 301-Regel, Produkt-Gate.
- **Stufe 2** Aktivitäts-Vertrag (`lastActivityAt`), Aufruf-Zähler, About-Seite
  mit vier belegbaren Zahlen (die fünfte kam mit dem Jahrestag, s. u.),
  Guidelines über die pages-Mechanik.
- **Stufe 3** Topic-Zustände (angeheftet/geschlossen/gelöst) samt Schreibsperre,
  erweiterte Suche, redigierte Team-Sicht auf der About-Seite, „kommentiert"-
  Hälfte der Seitenleiste.
- **Stufe 4** Abzeichen: der Zähl-Vertrag in core
  (`registerUserCounterProvider`, sechster Cross-Layer-Vertrag), Quellen in
  posts/comments/moderation, Katalog + Verleihung (`user_badges`,
  posts-012), Galerie unter `/discussions/badges`.
- **Einstieg „Thema eröffnen"** (2026-08-04, Davids Regel „Feed und Discussions
  sind unabhängige Produkte"): der Knopf steht in der Kopfzeile von
  `/discussions` (beide Ansichten) und jeder Kategorie-Seite, dort mit der
  Kategorie vorbelegt. Dahinter derselbe `PostComposer` und derselbe Schreibweg
  (`POST /api/posts`) wie im Feed — geteilt wird der MECHANISMUS, nicht der
  Einstieg; einen zweiten Schreibweg gibt es ausdrücklich nicht. Unter
  Discussions ist die Kategorie PFLICHT (`mode="topic"`), weil ein Beitrag ohne
  sie dort gar nicht erschiene. Sichtbarkeit und Ablehnung sind unverändert die
  des Feed-Composers: `isLoggedIn` für den Knopf, Datentür für alles Weitere
  (entzogener Zugang, M13). Beweis:
  `packages/posts/scripts/verify-new-topic-entry.mjs` (8/8).
- **Jahrestag + Beitritts-Zahl** (2026-08-04, Teil-5-Entscheidung 1) Beide
  fehlten aus demselben Grund und kommen deshalb über EINEN Weg: der
  Registry-Vertrag `registerCommunityJoinDatesResolver` (core, siebter
  Cross-Layer-Vertrag) mit zwei Fragen — „seit wann ist wer dabei?" und „wie
  viele kamen in N Tagen dazu?" —, beantwortet vom control-Layer über
  `community_members` (`$createdAt` der Zeile, nur Mitgliedschaften mit
  Zugang), verdrahtet in `apps/platform`. Das Abzeichen verlangt BEIDE Hälften
  des Katalogs (365 Tage dabei UND im letzten Jahr geschrieben); die zweite
  misst der bestehende Zähl-Vertrag über ein optionales `since`, damit auch
  Antworten mitzählen. KEINE Migration, keine neue Tabelle. Ohne Naht
  (apps/comments, Silo) bleibt das Abzeichen unverdient und die About-Kachel
  verschwindet — nie eine 0.
- **F57-Stufen** (2026-08-14) Zwei Nachzügler des Teil-4-Pakets, beide an der
  Vertrauensstufe:
  (a) Das **Tages-Like-Limit staffelt** (`likesPerDayByLevel: [50, 50, 75,
  100]`, Index = Stufe, TL4 bekommt den letzten Eintrag) — EINE pure Regel
  (`likeLimitForLevel`), gelesen an der Datentür-Klinke, die die Zeile ohnehin
  in der Hand hat; kostet keine zusätzliche Abfrage. Die Galerie NENNT die
  Zahl statt „mehr Likes" zu versprechen (`likeLimit` in der Badges-Antwort,
  nie im Übersetzungs-Text).
  (b) **`Campaigner`/`Champion`** konzepttreu: der Einladende wird bei der
  ANNAHME an der Zähler-Zeile des Eingeladenen hinterlegt
  (`member_counters.invitedBy`, posts-021), sein späterer Aufstieg zählt beim
  Einladenden hoch (`inviteesBasic`/`inviteesMember`, Differenz
  `(vorher, nachher]` ⇒ je Eingeladenem und Stufe genau einmal). Die Ernennung
  zu Stufe 4 meldet bewusst nichts.
  Mitgekommen ist eine Sicherung, die die Staffel nötig machte:
  `likeLimitDay` hält den schon gebuchten Abzeichen-Tag fest — ohne sie hätte
  ein Aufstieg mitten am Tag zwei „Tage" für „Out of Love" ergeben.
  Beweis `packages/posts/scripts/verify-trust-perks.mjs` (47/47).
- **Kleines Paket** (2026-08-04) Regeln-Vorlage für Bestands-Communities als
  Laufzeit-Rückfall (Schalter `pukalani.pages.guidelinesFallback`, in
  `platform` an) und die Hilfe-Umbenennung „Diskussionen" → „Kommentare".
- **Kunden-Hilfe** (2026-08-04) eigene Seite
  `apps/help/content/anleitung/3.produkte/04.diskussionen.md` →
  `/anleitung/produkte/diskussionen`, plus je eine Zeile in der Produkt- und
  der Plan-Tabelle (Personal — Discussions sitzt auf dem Produkt-Key `posts`).
  Beschrieben ist AUSSCHLIESSLICH der Baustand oben; ein Abschnitt „Was es
  heute nicht gibt" nennt die Lücken beim Namen. Der 301, den die
  Hilfe-Umbenennung Stunden zuvor auf genau diesem Pfad hinterlassen hatte, ist
  entfernt — eine routeRule gewinnt gegen die Seite, beides ging nicht
  (Begründung im Kopf von `apps/help/nuxt.config.ts`).

- **Themen-Verlinkung mit Rückverweis** (2026-08-14, die LETZTE Teil-4-Mechanik
  — Davids Entscheidung vom 2026-08-13/14, als eigenes Paket nach den
  Mechaniken 2+3). Im Editor öffnet **`#`** ein Menü über die Themen der
  eigenen Community; das Ziel-Thema zeigt darunter „**Verlinkt von …**".
  **EIN VERWEIS IST GEWÖHNLICHER TEXT**, wie `@handle` — der Parser
  (`core/shared/markdown.ts`) bleibt UNANGETASTET, es gibt keine neue
  Markdown-Marke und keine Migration für Bestandsinhalte.
  **ER TRÄGT DIE ROW-ID, NICHT DEN SLUG** (`#<id>-<deko>`), und das war keine
  Geschmacksfrage: der Themen-Slug ist nirgends gespeichert (`topicSlug()`
  leitet ihn bei jedem Aufruf aus Titel und Text ab), er ist nicht eindeutig
  (zwei Themen dürfen denselben Titel tragen) und er vergeht beim Umbenennen.
  Jeder der drei Punkte allein hätte `#mein-thema` unbaubar gemacht — der
  erste sogar auf Kosten der Laufzeit: eine Auflösung Slug → Thema wäre ein
  Vollscan über alle Titel bei JEDEM Seitenaufbau. Es ist damit dieselbe
  Arbeitsteilung wie in der URL: die Id ist die Wahrheit, die Deko dahinter
  steht für Menschen da und wird beim Auflösen ignoriert.
  **DIE ERKENNUNGS-REGEL IST FAIL-CLOSED** (`shared/topicLinks.ts`): `#` +
  16–36 rein alphanumerische Zeichen + optionale `-`-Deko, links kein
  Wortzeichen und kein `#`. Damit sind `#42`, `# Überschrift`, `##thema`, der
  Anker einer URL und jeder Verweis in Code-Spans/Codeblöcken draußen. Ids MIT
  Trennzeichen sind bewusst nicht verlinkbar (sonst ließe sich `#<id>-<deko>`
  nicht eindeutig zerlegen) — betroffen ist genau der Willkommens-Beitrag
  (`wp-…`), und der ist ein Feed-Beitrag ohne Kategorie, also ohnehin nie ein
  Ziel.
  **DER TEXT IST DIE WAHRHEIT, DIE TABELLE IST DER INDEX**: `discussion_links`
  (posts-020, je Paar EINE Zeile) wird NIE gelesen, um einen Beitrag zu
  rendern — die Verweise löst der Server beim Lesen aus dem TEXT auf
  (gebündelt, wie `mentionsForPosts`). Die Tabelle beantwortet allein die
  Gegenrichtung, die im Text nicht steht. Beim Bearbeiten wird sie ERSETZT,
  nicht ergänzt, sonst bliebe ein entfernter Verweis für immer am Ziel stehen.
  Sie trägt bewusst KEIN `authorId` (zwei Row-Ids sind nichts
  Personenbezogenes ⇒ kein GDPR-Beitrag); der Preis dafür ist, dass
  `linksMade` nie geeicht werden kann und „First Link" ab jetzt zählt.
  **ZWEI TÜREN**: die Index-Zeilen laufen über die Operator-Klinke (sie
  gehören keinem Menschen — ohne `ownerUserId` vergibt die Tür nur Leserechte,
  und das Entfernen scheiterte im ersten Beweislauf genau daran, still), die
  ZIELE über die Mitglieds-Tür (wer ein Thema nicht sehen darf, kann weder
  darauf verweisen noch als Verweis darauf erscheinen).
  Ein toter Verweis bleibt schlicht Text und meldet nichts. Beweis:
  `packages/posts/scripts/verify-topic-links.mjs` (42/42).

- **Tages-Limit für Likes** (2026-08-14, Teil-4-Mechanik 2 — Davids Zuschnitt
  vom selben Tag: 50 pro Tag je Mensch und Community, Config-Wert, `0` = aus).
  Durchgesetzt in BEIDEN Aufstimm-Routen (Themen `posts/[id]/score`, Antworten
  `comments/[id]/vote`) VOR dem Schreiben; abgewiesen wird mit **429** und
  `reason: like_limit_reached`, die Oberfläche macht daraus einen eigenen
  Hinweis statt der Fehlermeldung „Stimme kam nicht an".
  **„TAG" IST DER UTC-KALENDERTAG**, ausdrücklich nicht die Zeitzone des
  Nutzers: `prefs.timezone` gibt es seit U15, aber ein Limit, das mit der
  Zonen-Wahl wandert, schenkt beim Umstellen ein zweites Kontingent am selben
  Abend — eine Sicherung darf nicht an einer Einstellung hängen, die der
  Betroffene selbst dreht. Preis: wer in UTC+13 lebt, bekommt sein Kontingent
  mittags.
  **DIE RÜCKNAHME ERSTATTET NICHTS**, und das ist die tragende Eigenschaft:
  eine Stimme lässt sich per Klick zurücknehmen, also wäre ein Limit mit
  Erstattung mit zwei Klicks je Like beliebig zu umgehen. Verbraucht ist ein
  Like mit seiner VERGABE — wie eine Einladung mit ihrer Erzeugung. Abstimmen
  kosten nichts, der Wechsel von Ab- auf Aufstimme schon; entschieden wird das
  über dasselbe `upvoteDelta`, das die Abzeichen-Zähler steuert, damit „was ist
  ein Like" nur EINE Antwort hat.
  **DER STAND LIEGT IN `member_counters`** (posts-019: `likeDay`, `likesToday`,
  `likeLimitDays`) und nicht in eigenen Zeilen — die Zeile gibt es schon, genau
  eine je (Community, Mensch), und sie wird bei jeder Aufstimme ohnehin
  geschrieben. Der Tageswechsel ist deshalb ein Vergleich beim nächsten Like
  und kein nächtlicher Lauf über Millionen Zeilen. Ein Zählen der heutigen
  Vote-Zeilen wäre die naheliegende Alternative und ist FALSCH: die Rücknahme
  löscht die Zeile, das Kontingent käme zurück.
  Regeln PURE in `packages/core/shared/likeAllowance.ts` (dort, weil zwei
  Layer sie brauchen und einander nicht kennen dürfen), Autorität im
  posts-Layer über den Core-Vertrag `registerLikeAllowanceAuthority` — ohne
  posts-Layer gibt es schlicht kein Limit (erlaubender No-Op). Beweis
  `packages/posts/scripts/verify-like-limit.mjs` (28/28 gegen ein testweise auf
  3 gesenktes Kontingent, 75/75 gegen die echten 50).
  **BRINGT `out-of-love` / `higher-love` / `crazy-in-love`** (1 / 5 / 20 Tage
  mit erreichtem Limit). Gebucht wird der Tag GENAU EINMAL — an dem atomaren
  Hochzählen, dessen Ergebnis exakt auf dem Limit landet (`crossesLikeLimit`,
  `=== limit` statt `>=`); jeder weitere abgewiesene Versuch desselben Tages
  bucht nichts, sonst hieße „an 5 Tagen" nur „fünfmal dagegengelaufen".
  Der Zähler startet für alle bei 0 und wird NIE geeicht: „an diesem Tag war
  das Kontingent aufgebraucht" lässt sich aus dem Bestand nicht einmal falsch
  rekonstruieren.

- **Einladungen durch Mitglieder** (2026-08-14, Teil-4-Mechanik 1 — Davids
  Zuschnitt vom selben Tag: 5 pro Woche je Mitglied, je Community abschaltbar,
  Zahl als Config-Wert). Neue Capability `members.invite` beim `viewer`, also
  bei jedem Mitglied mit Zugang; die eingeladene Rolle ist IMMER `viewer`, und
  zwar geprüft in der Route — ein verstecktes Auswahlfeld ist keine Grenze.
  Owner/Admin bleiben kontingent- und schalterfrei: die Mechanik fügt ein Recht
  hinzu und beschneidet keines. Regeln PURE in
  `packages/control/shared/communityInviteQuota.ts`, gezählt an den ERZEUGTEN
  `community_invites`-Zeilen (rollierend 7 Tage, verbraucht mit dem VERSAND —
  nie angenommene Einladungen sind der Missbrauchsfall). Owner-Schalter
  `communities.memberInvitesEnabled` (control-037, fail-open) unter
  /dashboard/community neben der offenen Registrierung; eine Drossel
  (`community:invite`) liegt ZUSÄTZLICH davor, weil das Kontingent erst hinter
  JWT-Mint und Zähl-Abfrage greift. Beweis
  `packages/onboarding/scripts/verify-member-invites.mjs` (40/40).
  **BRINGT `promoter`** (erste ANGENOMMENE Einladung, Zähler
  `member_counters.invitesAccepted`, posts-018) — gezählt wird die ANNAHME, nie
  der Versand; ein Abzeichen fürs Anschreiben wäre eine Auszeichnung für Spam.
  **CAMPAIGNER/CHAMPION fehlten an diesem Stand noch** (seit den F57-Stufen
  vom 2026-08-14 — Eintrag oben — sind sie über genau den hier beschriebenen
  dritten Pfad gebaut), und die Begründung bleibt lesenswert, weil sie den
  Pfad erklärt: sie hängen laut Tabelle oben an der Vertrauensstufe DER
  EINGELADENEN („3
  wurden Basic", „5 wurden Member"). Das ist keine Zahl auf der Zeile des
  Einladenden — sie entsteht Wochen später in einer FREMDEN
  `member_counters`-Zeile und fällt aus dem Zähl-Kreuzungs-Weg heraus, den alle
  Abzeichen dieser Klasse benutzen. Nötig war ein dritter Verleihungs-Pfad
  (beim Aufstieg des Eingeladenen, mit Rückverweis auf den Einladenden) —
  eigenes Paket, eigene Entscheidung; beides kam am 2026-08-14 (F57-Stufen).

- **Emoji-Reaktionen** (2026-08-13, Teil-4-Mechanik 3 — Davids Entscheidung
  vom 2026-08-10 „Reaktionen zuerst"). Ein kuratierter Satz von acht Emojis
  (`packages/posts/shared/reactions.ts`), umgeschaltet je (Ziel, Mensch,
  Emoji) über `POST /api/posts/discussions/reactions`; gelesen wird
  GEBÜNDELT (eine Abfrage je Seite, nicht eine je Karte). Tabelle
  `discussion_reactions` (posts-017), Unique auf (targetId, userId, reaction)
  — ohne `communityId`, weil eine Row-Id global eindeutig ist.
  **BADGE-NEUTRAL, und zwar nachprüfbar** (die Folgeregel aus Teil 4 Punkt 3):
  eine Reaktion meldet AUSSCHLIESSLICH den neuen Zähler `reactionsGiven` für
  den Gebenden — kein `reportContentUpvotes`, kein Empfänger-Zähler, kein
  `reactionsReceived`. Das einzige Abzeichen, das überhaupt von Reaktionen
  weiß, ist `first-reaction`. Festgenagelt an drei Stellen:
  `tests/reactions.test.ts` (Katalog), `tests/reactions-door.test.ts`
  (Schreibweg) und die Gegenprobe im Live-Beweis
  `packages/posts/scripts/verify-reactions.mjs` (27/27) — fünf Reaktionen
  lassen Upvote-Zähler, Beitrags-Score und Like-Abzeichen unverändert.
  **WEDER 👍 NOCH ❤️ im Satz**: beide würden neben dem Aufstimm-Pfeil als
  zweite Zustimmung gelesen und wären damit die zweite Like-Quelle, die
  Entscheidung 4 ausschließt. Gespeichert wird ein SCHLÜSSEL (`tada`), nie das
  Zeichen — ein Emoji ist keine stabile Zeichenkette (Variantenselektor,
  Hauttöne).
  **AM THEMA UND — seit 2026-08-14 — AUCH AN DER ANTWORT.** Am Thema wird auf
  `community_posts`-Zeilen MIT Kategorie reagiert; Feed-Beiträge bleiben
  bewusst draußen (409 `reaction_target_not_topic`).
  Die Antwort-Ebene sind `comments`-Zeilen in einem ANDEREN Layer, und dafür
  standen zwei Wege zur Wahl: eine Abhängigkeit comments→posts (A14-Umkehr)
  oder ein zweites Datenmodell im comments-Layer nach dem Muster der Stimmen.
  **Gebaut ist der zweite** (Davids Entscheidung 2026-08-13 „Ja, nachbauen").
  Die vorsorgliche Spalte `targetType` in `discussion_reactions` kam damit
  NICHT zum Einsatz und bleibt auf `'post'` stehen: sie war für eine
  gemeinsame Tabelle gedacht, und die gibt es bewusst nicht — der Zugriff
  hätte über einen blossen Tabellen-Namen die Layer-Grenze umgangen, ohne
  irgendwo rot zu werden. Die Antworten haben deshalb ihre eigene Tabelle
  (`comment_reactions`, comments-019) und ihre eigene Toggle-Route; GELESEN
  werden ihre Chips ohne eigene Route, nämlich mit der Kommentar-Liste
  (`GET /api/comments`, neben `myVotes`/`myReports`).
  **Geteilt wird die REGEL, nie das Datenmodell:** der 8er-Satz, die
  Aggregation und das Umschalten liegen seither in
  `core/shared/reactions.ts`, die Chip-Leiste als `CoreReactionBar` — Core
  darf von beiden Produkten konsumiert werden. Der Zähler ist bewusst
  derselbe (`reactionsGiven`), also bleibt `first-reaction` EIN Abzeichen,
  egal wo man zuerst reagiert.
  **Keine Realtime** — bewusst: eine Reaktion ist kein Zustand, auf den jemand
  wartet, und ein eingehendes Ereignis müsste gegen die eigene Handlung
  entdoppelt werden. Optimistisch gerechnet wird trotzdem (`toggledChips`,
  dieselbe pure Regel wie auf dem Server); der Andockpunkt für später ist
  `applyServerState()` in `useReactions`.
- **Vertrauensstufen** (2026-08-04, Teilpaket 3 des gemeinsamen Pakets) Davids
  Architektur-Entscheidung ist wörtlich umgesetzt: die Stufe SPEIST das
  bestehende RBAC, es gibt kein zweites Prüfsystem. Zwei pure Regeln an zwei
  Orten, und die Trennung ist die Aussage — `packages/posts/shared/
  trustLevels.ts` sagt, wie man eine Stufe VERDIENT (Davids Schwellen „Mittel",
  UND-verknüpft), `packages/core/shared/trustLevel.ts` sagt, was sie VERLEIHT
  (RBAC, weil core keine Produkt-Schwellen kennen darf). Zusammengeführt werden
  beide an genau EINER Stelle: `decideCommunityAccess` bekommt ein optionales
  `trustLevel` und kennt einen dritten Weg `via: 'trust'` — der als `actor`
  ausdrücklich `'member'` ergibt, damit eine Stufe 4 nicht am Betreiber-Ausweis
  vorbei durch M13 und A5 läuft. Gefragt wird die Stufe NUR, wenn die geprüfte
  Capability überhaupt aus einer folgen kann (`trustLevelGrantsCapability` —
  drei von 31); an allen übrigen Routen kostet das Teilpaket nichts.
  DREI NEUE CAPABILITIES statt einer: `posts.curate` (fremde Themen umbenennen
  und umkategorisieren — TL3, Moderator+), `posts.arrange` (anheften/schließen/
  gelöst — TL4, Moderator+; abgespalten von `posts.moderate`, sonst hätte TL4
  die Melde-Queue mitgeerbt) und `posts.revise` (fremde Beiträge bearbeiten —
  TL4, Admin+). Alle drei tragen auch Rollen: ein automatisch aufgestiegenes
  Mitglied darf nie mehr als der Owner, der es beherbergt — ein Test nagelt das
  fest. Umbenennen konnte vorher ÜBRIGENS niemand, auch kein Moderator; das war
  eine echte Lücke.
  GESPEICHERT in ZWEI Spalten (posts-016): `trustLevel` (0–3, wird nur nach oben
  geschrieben — kein Abstieg) und `trustLevelLeader` (die Ernennung, rücknehmbar).
  Eine einzige Spalte hätte den Entzug gezwungen, die erarbeitete Stufe neu
  auszurechnen — und diese Rechnung braucht das Beitrittsdatum aus dem Control
  Plane, das fail-soft fehlen darf; ein Owner hätte damit bei schlechter
  Verbindung nebenbei eine über Jahre erarbeitete Stufe 3 gelöscht.
  GERECHNET beim SCHREIBEN (an der Zähl-Buchung, wo der neue Stand ohnehin
  vorliegt) und beim HINSEHEN (badges.get.ts) — die zweite Stelle ist keine
  Dopplung, sondern die einzige, die den reinen ZEITABLAUF sieht: wer nur noch
  auf den 60. Tag wartet, löst nichts aus. Die teure Hälfte (Beitrittsdatum,
  Cross-Projekt) wird erst geholt, wenn die billige (Zähler) überhaupt für eine
  höhere Stufe reicht.
  TL4 ERNENNT DER OWNER (`posts.appoint`, owner-only) unter
  `/dashboard/trust-levels` (bis U8: `/dashboard/discussion-leaders`) —
  gelistet wird, wer hier schon geschrieben
  hat (`member_counters`), bewusst NICHT die Mitgliederliste: die gehört
  onboarding, und eine Stufe für jemanden ohne jede Aktivität wäre eine Aussage
  ohne Grundlage. Protokolliert über `logEvent`, nicht `audit_logs` (A14, wie
  bei `events/[id]/redact.post.ts` begründet).
  SICHTBAR in der Galerie als eigener Abschnitt „Vertrauensstufe" mit der
  aktuellen Stufe und JEDER Bedingung zur nächsten einzeln („noch 3 eigene
  Inhalte") — nicht neben Autorennamen in Listen (Teil-5-Entscheidung 8).

## Was Stufe 4 an Abzeichen NICHT bringt — und warum

Der Katalog aus § 3.6 hat 40+ Einträge, gebaut sind 21. Die vollständige
Begründung steht im Kopf von `packages/posts/shared/badges.ts` — dort, wo sie
jemand liest, der ein Abzeichen nachreichen will. Kurzfassung:

- **Dauerhaft draußen** (Davids Entscheidung, Teil 4): die neun, die ein
  personenbezogenes Verhaltensprotokoll bräuchten.
- **Wartet auf seine Funktion**: First Emoji, First Quote, First Onebox,
  First Reply By Email, Wiki Editor, Certified/Licensed.
  („Erste Reaktion" ist seit dem 2026-08-13 gebaut, „Promoter" und die drei
  Like-Limit-Abzeichen seit dem 2026-08-14, „First Link" seit der letzten
  Mechanik desselben Tages — alle sechs sind daher hier heraus.)
- **Nicht baubar, obwohl es so aussieht**: dieser Absatz hat sich geleert —
  „Anniversary" ist seit dem 2026-08-04 GEBAUT (Teil-5-Entscheidung 1), und
  „Editor" ebenfalls (gemeinsames Paket, Teilpaket 1: `posts.editedAt` kam
  per posts-014, gezählt wird über `member_counters`).
- **Trust Levels**: GEBAUT (Teilpaket 3, 2026-08-04) — die vier Stufen-Abzeichen
  stehen als vierte Katalog-Gruppe darin. Was daran hängt, steht unten.

Zwei Eigenschaften der Zählweise standen hier bis zum 2026-08-04 („jedes
Abzeichen genau einmal", „ausgewertet nur beim Hinsehen, deshalb keine
Benachrichtigung"). Beide sind mit Teilpaket 2 des gemeinsamen Pakets
ERLEDIGT: `user_badges.qualifier` (posts-015) unterscheidet zwei Verleihungen
voneinander, verliehen wird zusätzlich am SCHREIBWEG (Stimm-Routen für die
Posting-Gruppe, Zähl-Buchung für die zähler-basierten Abzeichen), der Jahrestag
kommt je Mitgliedsjahr, und jede Verleihung meldet sich über `notify()`
(`badge.awarded`). Das Hinsehen bleibt als Nachzügler-Netz.

## Teil 5 — Davids Entscheidungen nach Stufe 4 (2026-08-04)

Acht Entscheidungen, in zwei Runden gestellt. Sie legen die Reihenfolge für
alles nach Stufe 4 fest.

**In Stufe 4 hinein:**
1. **Anniversary kommt** — als eigenes Stück über die Dienst-Naht (Muster der
   Team-Route aus Stufe 3). Das Beitrittsdatum liegt in `community_members` im
   Control Plane; die naheliegenden Runtime-Quellen (`$createdAt` des Kontos,
   `user.joined`) beantworten eine ANDERE Frage. Schaltet zugleich die
   Beitritts-Statistik der About-Seite frei, die aus demselben Grund fehlt.

**Nächstes Paket (klein, behebt Sichtbares) — GEBAUT am 2026-08-04:**
2. **Verhaltensregeln-Vorlage** für Bestandskunden — jede Community bekommt
   einen bearbeitbaren Standardtext. Geworden ist es ein **Rückfall zur
   Laufzeit statt eines Backfills**: die `pages`-Zeilen liegen im
   Runtime-Projekt, die Liste der Communities im Control Plane, und ein
   Migrationslauf bekommt genau EINEN Schlüssel für EINE Instanz — er müsste
   den Bestand aus vorhandenen Zeilen erraten und verfehlte ausgerechnet die
   Communities ohne jede Seite. Fehlt die Zeile, liefern die Routen die
   Vorlage; das erste Speichern im Dashboard legt sie an. Eine vorhandene
   Zeile gewinnt immer, ein zurückgezogener Entwurf bleibt zurückgezogen.
   Begründung im Kopf von `packages/pages/shared/guidelinesFallback.ts`.
3. **Hilfe-Seiten umbenannt** — „Diskussionen" meinte dort noch die Kommentare.
   Produkt-Seite jetzt `/anleitung/produkte/kommentare` (301 für den alten
   Pfad); auf der Landing war dieselbe Umbenennung schon passiert.

**Erst mit den Werkzeugen, und dann GEMEINSAM — sie hängen alle an derselben
Umstellung (Zähler, die beim SCHREIBEN mitschreiben, statt beim Hinsehen zu
rechnen); getrennt gebaut wäre es dieselbe Arbeit zweimal:**
4. `posts.editedAt` nachziehen (comments hat es) — bringt „Editor" UND einen
   ehrlichen „bearbeitet"-Hinweis am Thema.
5. Abzeichen mehrfach verleihen + Benachrichtigung.
6. **Trust Levels** (die vier Stufen aus dem Katalog).

**Die drei Architektur-Entscheidungen zum gemeinsamen Paket (David,
2026-08-04, strukturierte Fragen — das „eigene Ja" aus § 3.6 ist damit da):**
- **TL speisen das BESTEHENDE RBAC**: die Stufe wird aus den Zählern
  berechnet, und der vorhandene Capability-Resolver vergibt daraus
  zusätzliche Capabilities. EIN Rechtesystem, `requireCommunityPermission`
  bleibt die einzige Tür; ein paralleles TL-Prüfsystem ist ABGELEHNT.
- **TL1–TL3 automatisch** (Schwellen im Discourse-Sinn, ausgewertet beim
  Schreiben über die mitschreibenden Zähler), **TL4 „Leader" nur von Hand**
  durch den Owner. Kein Abstieg — einmal erreicht, bleibt.
- **Mehrfach-Verleihung: ALLE Abzeichen, wo sinnvoll zählbar** — bewusst
  GEGEN die Discourse-Konvention (nur Posting-Gruppe) und als REVISION der
  Stufe-4-Zeile „jedes Abzeichen genau einmal": auch der Jahrestag kommt
  jährlich neu. „Sinnvoll zählbar" heißt: es gibt ein neues qualifizierendes
  Ereignis (neuer Beitrag über der Schwelle, neues Mitgliedsjahr) — reine
  Zustands-Abzeichen (z. B. Profilbild gesetzt) bleiben einmalig.

**Vor dem Bauen ein eigenes Konzept:**
7. **Private Nachrichten** — eigene Tabelle, Meldewege, Sperren, DSGVO-Export.
   Kein Anhängsel an Discussions: ein Nachrichtenweg ohne Meldeweg und Sperre
   ist ein Missbrauchskanal, den man hinterher nicht mehr zumacht.

**Dauerhaft entschieden:**
8. **Abzeichen bleiben auf Profil und Galerie** — NICHT neben dem Autorennamen
   in der Themenliste. Dort wäre es ein N+1 über 25 Autoren, also eine
   denormalisierte Spalte mit denselben Konsistenz-Schreibwegen wie „Hot".
