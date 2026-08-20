# Wer trägt die Identität einer Adresse — der Slug oder die Id?

**Stand: 2026-08-20 — ENTSCHIEDEN (Weg A, so lassen; DECISION-LOG) und
archiviert. Analyse, nichts gebaut — und bewusst nichts zu bauen.** Ausgelöst von Davids Frage beim
Bau der Kategorie-Übersetzungen: „Wenn Discourse die Id in der URL trägt und
der Slug bloß Kosmetik ist — ist das nicht SEO-, UX- und sicherheitsseitig
besser? Und gilt das nicht für Kategorien, Themen, Feed, Events und Kurse
gleichermaßen?"

Diese Datei beantwortet die Frage, stellt drei Wege gegenüber und sagt, was
sie kosten. **Entscheidung steht aus.**

---

## 1. Was wir heute haben (nachgemessen, nicht erinnert)

Beide Muster laufen bei uns nebeneinander — und das ist kein Versehen, sondern
zwei getrennte Entscheidungen aus zwei Wochen:

| Sache | Adresse heute | Identität | Umbenennen? |
| --- | --- | --- | --- |
| Thema (Discussions) | `/discussions/allgemein/6a71…/polipoli-open-yet` | **Id** | gratis — Titel UND Kategorie |
| Event | `/events/6a71…` | **Id** (ohne Slug) | gratis |
| Kategorie | `/discussions/allgemein` | **Slug** | **nie** |
| Kurs | `/courses/<slug>` | **Slug** | **nie** |
| CMS-Seite | `/imprint` · `/de/imprint` | **Slug + Sprache** (eine Zeile je Sprache) | nie |

Bei Themen ist das Discourse-Muster also längst Hausregel, inklusive der
verworfenen Alternative: der Kopf von `packages/posts/shared/discussionUrl.ts`
hält fest, dass eine Alt-Slug-Tabelle „nichts kauft, was die Id nicht schon
liefert". Nicht-kanonische Varianten rendern nie, sie leiten vorher 301 um.

## 2. Die vier Achsen, ehrlich getrennt

**SEO.** Der Gewinn ist NICHT das Stichwort in der Adresse (ein sehr schwaches
Signal), sondern **Stabilität**: kein toter Link nach einer Umbenennung, und
kein Duplicate Content, weil abweichende Varianten vor dem Rendern umleiten.
Das ist echt. Der Preis — eine längere, technisch aussehende URL — kostet bei
Suchmaschinen praktisch nichts.

**UX.** Für ein Thema mit langem, generiertem, korrigierbarem Titel ist die Id
eindeutig richtig. Für die **Sektions-Adresse** ist sie ein Verlust:
`/discussions/allgemein` ist der Link, den jemand in ein Menü, einen
Newsletter oder auf eine Karte schreibt. Ein Mensch liest den Unterschied
zwischen einem Thema und einer Rubrik.

**Sicherheit.** Neutral. Appwrite-Ids sind nicht durchzählbar (Zeitstempel +
Zufall), ein Angreifer gewinnt also nichts; umgekehrt schützt eine Adresse
ohnehin nie — das tut die Datentür (`tenantDb`). **Ein echter Nebengewinn**
bleibt: mit Id in der Adresse bräuchte es keine `RESERVED_CATEGORY_SLUGS` mehr
(heute gesperrt: `categories`, `new`, `all`, `search`, `api`, `about`,
`badges` — eine Kategorie könnte sonst eine echte Seite VERDECKEN) und keine
Slug-Eindeutigkeit je Mandant (`uq_tenant_slug`).

**Mehrsprachigkeit.** Hier ist das Argument am stärksten: mit Id darf jede
Sprache ihren eigenen Deko-Slug tragen, alle zeigen auf dieselbe Zeile.
**Nur brauchen wir das nicht:** unsere Adressen tragen die Sprache schon im
Präfix (`prefix_except_default`), und der pages-Layer fährt genau so —
`/imprint` und `/de/imprint`, gleicher Slug, je Sprache eine Zeile. Eine
zweite Mechanik daneben wäre kein Fortschritt, sondern eine zweite Wahrheit.

**Fazit der Analyse:** Das Id-Muster ist *ein* sauberer Weg der
Content-Localization — der, den man braucht, wenn die ADRESSE übersetzt werden
soll. Wir fahren den anderen (Sprache im Präfix, Adresse sprachneutral). Der
einzige Grund, der bei Kategorien und Kursen wirklich drückt, ist deshalb
weder SEO noch Sicherheit, sondern: **der Slug ist dort für immer fest.**

## 3. Die drei Wege

### A — So lassen (heutiger Zustand)

Themen und Events tragen die Id, Kategorien und Kurse bleiben kurz und
sprechend. Der Preis ist der feste Slug: ein Tippfehler oder eine Umbenennung
ist nicht heilbar (die Kategorie-Seite hat keine Id, über die ein alter Link
sich selbst reparieren könnte).

* **Aufwand:** keiner. **Risiko:** keins.
* **Passt zu:** wenigen, kuratierten, selten umbenannten Rubriken.

### B — Alt-Slug-Gedächtnis

`/discussions/allgemein` bleibt, aber Umbenennen wird erlaubt: jeder alte Slug
wird mitgeschrieben und leitet dauerhaft 301 auf den aktuellen.

* **Neu:** eine Tabelle (`category_slugs`: communityId, slug, categoryId) samt
  Unique-Index, ein zweiter Auflösungspfad in `[category]/index.vue` und in
  jeder Route, die einen Kategorie-Slug annimmt, eine Aufräumfrage (wie lange
  hält ein Alt-Slug?) und die Kollisionsregel (ein Alt-Slug blockiert den
  Namen für alle anderen Kategorien).
* **Aufwand:** M–L. **Risiko:** mittel — der zweite Pfad muss überall greifen,
  sonst antwortet ein alter Link 404 statt 301.
* **Wichtig:** genau diese Lösung haben wir bei Themen bewusst verworfen, weil
  die Id sie billiger liefert. Sie hier zu bauen heißt, sich die teurere
  Variante für die kleinere Sache zu kaufen.

### C — Id-Muster überall (Hausregel)

Was Menschen benennen, wird über die Id aufgelöst: Kategorien und Kurse
bekommen `/…/<id>/<slug>`, der Slug wird Deko und ist frei änderbar.

* **Dafür:** Umbenennen gratis · keine reservierten Slugs · keine
  Eindeutigkeits-Indizes je Mandant · ein Muster statt zwei · Sprach-Slugs
  wären möglich (brauchen wir laut Abschnitt 2 aber nicht).
* **Dagegen:** längere Adressen an der Stelle, an der sie ein Mensch weitergibt
  · **ein Umbau des URL-Raums**: heute ist `/discussions/<kategorie>` das
  Elternteil von `/discussions/<kategorie>/<id>/<slug>` — bekommt die Kategorie
  selbst eine Id, müssen beide Formen unterscheidbar bleiben (etwa `/c/<id>/…`)
  · 301 für **alle bestehenden Kategorie-Links**, auf freelancer.supply sind
  das heute 20 Kategorien plus jeden geteilten Link darauf.
* **Betroffen:** `discussionUrl.ts`, `[category]/index.vue`,
  `[category]/[id]/[slug].vue`, `DiscussionSidebar`, `DiscussionFilters`,
  `DiscussionCategories`, `DiscussionTopics`, `sidebar.get.ts`, Kurs-Routen,
  Sitemap/hreflang, Analytics-Historie.
* **Aufwand:** L. **Risiko:** hoch, weil live geteilte Adressen betroffen sind.

## 4. Empfehlung

**A lassen, solange Umbenennen kein echter Bedarf ist.** Die Übersetzungen von
Name und Beschreibung (2026-08-17, `shared/categoryI18n.ts`) sind von dieser
Frage unabhängig und bleiben in jedem der drei Wege richtig.

Wird Umbenennen zum Bedarf (Rebranding, Tippfehler, zusammengelegte Rubriken),
dann **C und nicht B**: dieselbe Begründung, die bei den Themen schon zählt —
die Id liefert dasselbe billiger und ohne zweiten Auflösungspfad. Dann aber als
eigenes Paket mit Weiterleitungen, Sitemap- und hreflang-Durchgang.
