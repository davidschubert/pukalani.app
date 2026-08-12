# Offene Punkte

**Stand: 16 offen · 5 geparkt/wartend · 10 bewusst zurückgestellt** (Zahlen bei JEDEM Umzug nach COMPLETE mitführen)

Stand: **2026-08-11**. Hier steht **nur, was noch offen ist** — in der
Reihenfolge, in der es abgearbeitet wird. Alles Erledigte (mit Begründung,
Beweis und den gelernten Lektionen) steht final in
**[OPEN-ITEMS-COMPLETE.md](OPEN-ITEMS-COMPLETE.md)**.
**Pflege-Regel (David, 2026-07-30):** diese Datei kurz halten — pro Eintrag
höchstens drei Zeilen, Einzelheiten leben im verlinkten Plan, und Erledigtes
zieht **sofort** nach COMPLETE um.

Legende — **Prio:** Hoch / Mittel / Niedrig ·
**Aufwand:** S (Stunden) · M (ein Tag) · L (mehrere Tage) · XL (Woche+) ·
**Braucht David?** Nein = ich mache es allein.

## ✅ Jetzt dran — in dieser Reihenfolge

Die Klammer **[AP1]–[AP10]** ist das Arbeitspaket: was dieselbe Klammer trägt,
wird am Stück gebaut (Planungsrunde 2026-08-10). **Seit 2026-08-11 steht der
[Account-Horizont](plans/ACCOUNT-HORIZONT.md) (AH-1…AH-6) auf Davids Anweisung
VOR den restlichen UX-Paketen** — ein Konto, das überall gilt: account. statt
my./start., Projekt-Migration pool→account, admin. statt control., master- und
demo-Ausbau, comments in den Pool. Entscheidungen: DECISION-LOG 2026-08-11.

| # | Was (einfach erklärt) | Prio | Aufwand | Braucht David? | Details |
| --- | --- | --- | --- | --- | --- |
| 2 · A1 | **Echte Rechtstexte** für Impressum, Datenschutz und AGB. **pukalani.studio ist seit 2026-08-12 live** — Impressum + Datenschutz in de/en veröffentlicht, ohne erfundene Angaben, aber **ohne ladungsfähige Anschrift** (Davids Entscheidung: erst mal ohne); nachzutragen dort die Anschrift (§ 5 DDG, Pflicht — Postfach genügt nicht) und die Prüfung zu Art. 27 DSGVO (Vertreter in der Union) samt Drittland-Grundlage. Für **pukalani.app** stehen die Texte weiter aus. **Direkt danach `pukalani.auth.termsUrl` in `apps/platform` setzen** — die AGB-Checkbox fehlt heute genau dort, wo Kunden sich registrieren (Trichter M9). Schaltet Punkt 3 frei. | Hoch | S — Anschrift eintragen, Anwalt lesen lassen | Ja: nur David (ggf. Anwalt) | [Notizen](#notizen) |
| 3 · A2 | **Stripe auf echtes Geld umstellen — über die F55-Seite.** Vorstufe A2a komplett grün, F55 selbst erledigt (beide 2026-08-08). Bei David bleiben: Bank-Aktivierung, Steuer-Registrierung, Live-Key ROTIERT eintragen (der erste ist teil-geleakt und rotiert), Portal-Konfiguration; alles andere klickt die F55-Seite. Braucht Punkt 2 (A1). | Hoch | S | Ja: Bank, Konto, Portal | [STRIPE-GO-LIVE-RUNBOOK.md](runbooks/STRIPE-GO-LIVE-RUNBOOK.md) |
| 8 · AH-4 | **Cutover `control.` → `admin.`** — zweiter Host-Umzug nach dem studio→control-Muster (Runbook existiert). Nicht vergessen: Stripe-Webhook-URL, eigenes Zertifikat per DNS-01 (NIE über die Wildcard-Site), CI-Ziele, RESERVED_SUBDOMAINS. | Mittel | M–L | Ja: Zeitpunkt | [ACCOUNT-HORIZONT.md](plans/ACCOUNT-HORIZONT.md) · [CONTROL-CUTOVER.md](runbooks/CONTROL-CUTOVER.md) |
| 10 · AH-6 | **F3: comments zieht in den Pool** (Davids Entscheidung 2026-08-11, aus „geparkt" hierher). Erst Plan-Dokument (Nutzer-Migration ins Account-Projekt, Embed bleibt, neuer E2E-Anker — die CI hängt an apps/comments), dann Bau. Danach: genau zwei Auth-Welten (account + admin); portfolio bleibt Davids Silo. | Mittel | XL | Ja: Plan-Abnahme | [ACCOUNT-HORIZONT.md](plans/ACCOUNT-HORIZONT.md) |
| 11 · U4 | **[AP2] Die ersten Minuten in der neuen Community sind leer.** Der frisch angelegte Owner wird mit „Willkommen **zurück**" begrüßt, sieht lauter Nullen. Entschieden 2026-08-10, die fünf Schritte: **Beitrag · Farbwelt · Einladen · Startseite · Abo**. Dazu ein erster Beispiel-Inhalt und eine Mail mit der Adresse der Community. Dazu: die gesäte Startseite in **beide** Sprachen (Trichter M4). Ghost misst dafür **26 % statt 7 %** Abschluss. | Hoch | M | Nein | [UX-Trichter G1, G2, G6, M4](archiv/audits/2026-08-09-ux-trichter.md) · [Wettbewerb E1, E2](archiv/audits/2026-08-09-wettbewerb-benchmark.md) |
| 12 · U5 | **[AP3] Ein Tippfehler im Community-Namen bleibt für immer.** Der Name wird einmal im Wizard gesetzt und ist danach für niemanden mehr änderbar — auch nicht für uns. Er steht im Menükopf, im Browser-Tab, im Vorschaubild und als Absender jeder Mail. Soll: ein Feld „Name und Beschreibung" dort, wo man es sucht; die Adresse bleibt unberührt. | Hoch | M | Nein | [UX-Dashboard K1](archiv/audits/2026-08-09-ux-dashboard.md) |
| 13 · F56 | **[AP3] Private Nachrichten sind schwer zu finden.** Der Einstieg „Nachricht schreiben" neben dem Autorennamen ist im Konzept § 1 zugesagt; `MessageWriteButton.vue` ist gebaut, aber **nirgends verdrahtet**. Heute führt nur der Posteingang hin. | Mittel | S — Knopf im blueprint andocken | Nein | [PN-Konzept § 1](plans/PRIVATE-NACHRICHTEN-KONZEPT.md) |
| 14 · U6 | **[AP4] Ein Wort je Sache.** Entschieden 2026-08-10: das Geld-Wort ist **„Plan"** („Abo" nur für den Vertragszustand, „Tarif" fliegt — löst den Widerspruch der zwei Audits). Dazu englisch „products" statt „blocks", im Betreiber-Menü Community statt Tenant/Mandant, und die Rolle `viewer` heißt künftig **„Leser/in"** (en „Reader"; nur Anzeige, Key bleibt — entschieden 2026-08-10). Rund 40 Textstellen, kein Code. | Mittel | M | Nein (entschieden) | [UX-Trichter § 3](archiv/audits/2026-08-09-ux-trichter.md) · [UX-Dashboard § 3](archiv/audits/2026-08-09-ux-dashboard.md) |
| 15 · U7 | **[AP5] Das Menü aufräumen.** 27 Einträge in sieben Gruppen, drei davon mit einem einzigen Eintrag — und für Moderatoren gibt es keine Gruppe „Moderation": ihre vier Arbeitsflächen liegen unter „Produkte" und „Einstellungen". Im Silo heißt der Sammelpunkt „Community-Einstellungen" und enthält „System". Soll: eine Gruppe je Aufgabe, dazu ein Suchfeld. | Mittel | M | Nein | [UX-Dashboard G1, G5, G8](archiv/audits/2026-08-09-ux-dashboard.md) · [Wettbewerb E8](archiv/audits/2026-08-09-wettbewerb-benchmark.md) |
| 16 · U8 | **[AP5] Die Adressen sagen etwas anderes als die Namen darüber.** Posteingang vs. PN-Schalter ein Wort auseinander, Adressen mit Wörtern aus keiner Oberfläche, eine Umbenennung ohne Weiterleitung. Dazu die Sprachregel für Pfade: Dashboard/Kundenbereich bleibt englisch, `/anfragen` → `/request-access` + 301 (Trichter M5). | Mittel | M | Nein | [UX-Dashboard G4, G7, M13](archiv/audits/2026-08-09-ux-dashboard.md) |
| 17 · U9 | **[AP6] Die Übersichtsseite zeigt echte Zahlen.** Der Owner sieht auf seiner Startseite genau eine Zahl, und die zählt Kommentare — keine Mitglieder, keine Beiträge, keinen Speicherplatz, kein Wort zur Testphase. Die Kacheln stammen aus der Zeit, als es nur Kommentare gab. Gezählt wird das meiste ohnehin schon an anderer Stelle. | Mittel | M | Nein | [UX-Dashboard K2](archiv/audits/2026-08-09-ux-dashboard.md) |
| 18 · U10 | **[AP4+AP9] Preise und Pläne erzählen überall dasselbe.** Die Spalte „Basic — 0 €" samt „Free Plan" fliegt sofort mit AP4. Preisseiten-Teil mit AP9: Vergleichstabelle unter die Karten (Zeile „Eigene Domain — ab Pro", U13-Entscheidung 2026-08-10), Jahresrabatt als „drei Monate geschenkt". | Mittel | S–M | Nein | [UX-Trichter G5](archiv/audits/2026-08-09-ux-trichter.md) · [Wettbewerb E4, M5, M6](archiv/audits/2026-08-09-wettbewerb-benchmark.md) |
| 19 · U11 | **[AP7] Fehlermeldungen, leere Seiten, Seitentitel.** Die Minuten-Sperre sagt „Passwort falsch", eine Hinweisseite verweist auf einen Knopf, den es dort nicht gibt, ein Dutzend leerer Listen zeigt einen Gedankenstrich. Dazu: 17 Dashboard-Seiten ohne Browser-Titel + 2 tote `useHead`-Aufrufe (C5, Dashboard M6) und der „Geschichte"-Doppellink (Trichter M6). | Mittel | M | Nein | [UX-Trichter G7, M3, M6, M7](archiv/audits/2026-08-09-ux-trichter.md) · [UX-Dashboard M6, M8](archiv/audits/2026-08-09-ux-dashboard.md) |
| 20 · U12 | **[AP8] Der Wizard fragt sieben Mal.** Entschieden 2026-08-10: Pflicht bleiben **Name/Adresse · Kategorie · Vibe** (beide formen den ersten Zustand) — Größe, Zweck, Ziel und Beschreibung wandern in die Checkliste aus U4, deshalb NACH U4 bauen. Der @handle gehört nicht in den Wizard (Konto-Einstellung). | Mittel | M | Nein (entschieden) | [UX-Trichter M1](archiv/audits/2026-08-09-ux-trichter.md) · [Wettbewerb E5, M3](archiv/audits/2026-08-09-wettbewerb-benchmark.md) |
| 21 · U16 | **[AP9] Die Pro-Domain spürbar hochwertiger machen.** CAA-Prüfung im „Prüfen"-Lauf (häufigste Zertifikatsfehler-Ursache, macht Circle vor), Anleitungen je Registrar (IONOS, Strato, United Domains, Hetzner, Cloudflare), TTL-Hinweis vor dem Umzug, automatisches Nachprüfen bei offener Seite. Der ehrliche „Prüfen"-Knopf bleibt. | Mittel | M | Nein | [Wettbewerb E6](archiv/audits/2026-08-09-wettbewerb-benchmark.md) |
| 22 · U17 | **[AP10] Die Wettbewerbs-Munition auf die Marketing-Seite.** Gebühren-Rechner auf `/vs/*` und `/wechseln` (300 Mitglieder à 20 € ⇒ anderswo 8–14 % Gebühr, hier 0 %), die belegten Branding-Zitate der Wettbewerber, das Testphasen-Argument („danach wird nichts gelöscht") und eine Datenexport-FAQ. | Mittel | S–M | Nein | [Wettbewerb E9, V3, V5, K4](archiv/audits/2026-08-09-wettbewerb-benchmark.md) |

## ⏸️ Geparkt / wartet — in Arbeitsreihenfolge

Die Reihenfolge ist die, in der wir sie anfassen würden: erst was eine
Entscheidung braucht, dann die großen Brocken. **Die Aufwände sind ehrlich
gemeint** — hier steht nichts mehr, was an einem Nachmittag fertig wird; F7
ist Wochen. (F3 ist am 2026-08-11 als AH-6 in die Hauptliste gezogen.)

| # | Reihenfolge | Was (einfach erklärt) | Prio | Aufwand | Braucht David? | Wartet auf … |
| --- | --- | --- | --- | --- | --- | --- |
| U14 | 1 — Tage | **Anmelden mit Google.** Entschieden 2026-08-10: nur Google (Apple kostet 99 $/Jahr Developer-Programm). Braucht im Bau: eine erklärte Datenschutz-Zeile neben „kein Werbe-Tracking" und die Circle-Falle (Social-Login fällt anderswo auf eigenen Kunden-Domains dauerhaft aus) von Anfang an mitgedacht. | Mittel | M | Nein (entschieden) | Account-Horizont + AP2–AP8 |
| U15 | 2 — Tage | **Die zugesagten Dashboard-Seiten, die es nicht gibt** — allen voran „Navigation" (der Owner stellt das Menü seiner eigenen Community zusammen) und „SEO". Entschieden 2026-08-10: bleibt geparkt bis Account-Horizont + AP2–AP8 durch sind; dann zuerst „Navigation". | Mittel | L | Ja: Zuschnitt je Seite | Account-Horizont + AP2–AP8 · [UX-Dashboard § 5](archiv/audits/2026-08-09-ux-dashboard.md) · [DASHBOARD-IA.md](plans/DASHBOARD-IA.md) |
| F57 | 3 — Tage | **Die drei sozialen Mechaniken aus dem Discussions-Konzept Teil 4** — Emoji-**Reaktionen**, **Einladungen durch Mitglieder**, **Tages-Limit für Likes** — plus **Themen-Verlinkung mit Rückverweis**; an ihnen hängen sechs fehlende Abzeichen. Entschieden 2026-08-10: bleibt geparkt bis Account-Horizont + AP2–AP8; dann Reaktionen zuerst. | Mittel | L | Ja: Rest-Zuschnitt | Account-Horizont + AP2–AP8 · [DISCUSSIONS-KONZEPT.md](plans/DISCUSSIONS-KONZEPT.md) Teil 4 |
| F7 | 4 — Wochen | **Bezahlte Communities** — der Owner nimmt Geld von seinen Mitgliedern (Stripe Connect). Eigene Mechanik und eigene Rechtsfragen. **Schluckt D1** (Davids Entscheidung 2026-08-02): bezahlte Pool-Events/-Kurse ergeben erst mit Connect Sinn. Events-Hälfte technisch M, Kurse-Hälfte L/XL (community-scoped Entitlements sind unentworfen). Messlatte laut Benchmark: Skools Merchant-of-Record-Modell inkl. EU-USt., nicht der Prozentsatz. | Mittel | XL | Ja: Rechtsfragen | nach dem Go-Live; erst muss Geldfluss 1 (A6) ankommen |
| F47 | 5 — Tage | **Analytics v2, Rest = nur noch Optionales** (Pakete 1–4 live seit 2026-08-04): Adblock-Proxy · Plausible-Mail-Reports. Die vordefinierten Trichter-Events sind als **U18** in die Hauptliste vorgezogen (2026-08-10). Nichts davon drängt. | Niedrig | je S–M | Nein | [ANALYTICS-V2.md](plans/ANALYTICS-V2.md) |

---

<a id="notizen"></a>

## 📎 Anhang: Notizen

Hier steht, was zu einem offenen Punkt gehört, aber in kein Plan-Dokument
passt. Nichts davon ist eine zusätzliche Aufgabenliste — die eine Liste steht
oben.

### So arbeiten wir

Ein Durchgang, immer gleich — das ist die Arbeitsweise, die sich in den
Audit-Wochen bewährt hat:

1. **Griff wählen** — aus der Reihenfolge oben, nicht nach Lust. Ein Paket,
   nicht drei.
2. **Bauen** — bei mehreren unabhängigen Paketen je ein Agent in eigenem
   Worktree; sie committen dort, aber mergen NICHT.
3. **Prüfen, nicht glauben** — jeden Agenten-Befund am Code nachlesen, bevor
   er gemerged wird. Erfahrung: einzelne Meldungen halten der Prüfung nicht
   stand, und ein Agent hat schon Dinge „gefixt", die keine Fehler waren.
4. **Grün herstellen** — `pnpm lint`, `pnpm -r test`, `pnpm typecheck` der
   betroffenen Apps, `pnpm check:manifests`. **Und CI ansehen**
   (`gh run list --branch main --limit 8`), nicht nur die lokale Konsole: der
   E2E-Job war über einen Tag rot, ohne dass es jemand merkte.
5. **Deployen + live nachmessen** — Build-SHA je Host, der konkrete Beweis für
   das Gefixte, `node scripts/ops/verify-tls.mjs`.
6. **Nachtragen** — erledigte Punkte nach
   [OPEN-ITEMS-COMPLETE.md](OPEN-ITEMS-COMPLETE.md) (mit der Zeile
   **Gelernt:**, wenn etwas nicht auf Anhieb ging), bei
   Architektur-Entscheidungen eine Zeile in
   [DECISION-LOG.md](DECISION-LOG.md) und ggf. CLAUDE.md. Dann melden und auf
   David warten (paketweise, kein Dauerlauf).
7. **Entscheidungen als strukturierte Fragen** (Davids Regel, 2026-08-04):
   Braucht ein Punkt eine Entscheidung von David, wird sie NIE als
   Fließtext-Frage versteckt und NIE still defaultet — sondern als
   Auswahl-Frage gestellt: konkrete Optionen, je mit ehrlichem Trade-off,
   die Empfehlung als erste Option und als solche markiert. Mehrere offene
   Entscheidungen werden gesammelt und in einem Rutsch gefragt; die
   Antworten wandern SOFORT ins betroffene Plan-Dokument, ins
   [DECISION-LOG.md](DECISION-LOG.md) und in die Zeile hier. Bewährt bei den
   sieben Discussions-Entscheidungen (§ 3.8): Minuten statt Pendeln.

### Was gerade live ist

**7 Hosts:** **pukalani.app** (Landing, seit 2026-07-27 — Apex proxied über
Cloudflare, braucht am Ursprung KEIN Zertifikat mehr und kann das
Kunden-Wildcard damit nicht mehr überschreiben; TLS-Wächter alle 30 min),
**control** (Betreiber) + **account** (Kundenbereich + Wizard; my/start leiten seit AH-1 am 2026-08-11 per 301 weiter),
comments + portfolio, **platform** (Multi-Tenant, `*.pukalani.app`-Wildcard —
demo.pukalani.app als erster Pool-Tenant, neue Kundensite = ein Klick im
Control, kein Build), **help.pukalani.app** (Hilfe-Site, seit 2026-07-27) und
die interne Doku unter `control.pukalani.app/docs`. Auto-Deploy (6 Sites),
Zero-Downtime Stufe 2, Changelog-2B, Alerting, GDPR, pages-Layer
(/imprint,/terms,/privacy editierbar + Footer-Links). M1–M9 komplett,
Self-Service-Onboarding komplett, **alle sechs Kundenprodukte durch die
Datentür** (comments, posts, pages, moderation, events, courses).
Release **v3.0.0** (2026-07-28).

**Dazu seit der Woche 2026-08-04..09:** **eigene Kundendomains** (Pool ab Pro,
Silo je Site) mit `www.pukalani.studio` als erstem echten Fall — Rest siehe
Punkt 1 —, **private Nachrichten** (Layer `messages`, ab Personal, ab Werk
ausgeschaltet), **Vertrauensstufen + 22 Abzeichen** in den Diskussionen,
**Handles/Erwähnungen** und die **Stripe-Verwaltung im Control-Dashboard**
(F55).
**Als Betriebssystem für eigene Sites: ~98 %. Als verkaufbares SaaS: ~85 %.**

### Einzelheiten zu den offenen Punkten

<a id="ux-herkunft"></a>

**U1–U18 — Herkunft und Zuschnitt.** Am 2026-08-09/10 sind drei Berichte
entstanden und im Archiv abgelegt: die **Reise von der Startseite bis in die
neue Community** ([UX-Trichter](archiv/audits/2026-08-09-ux-trichter.md), 26
Befunde), das **Dashboard** mit allen 57 Seiten und vier Menü-Registern
([UX-Dashboard](archiv/audits/2026-08-09-ux-dashboard.md), 36 Befunde) und ein
**Vergleich mit zwölf Wettbewerbern**
([Wettbewerb](archiv/audits/2026-08-09-wettbewerb-benchmark.md), Preise und
Zitate mit Quelle und Datum). Die 88 Einzelbefunde stehen dort — hier oben
stehen nur die **Pakete**, die man am Stück bauen kann. Was die Berichte
ausdrücklich als *richtig entschieden* markieren (Testphase ohne Karte, 404
statt 403 bei fehlendem Produkt, Karten statt Tabelle im Kundenbereich, der
ehrliche „Prüfen"-Knopf bei der Domain, kein Basic auf der Preisseite), ist
bewusst **kein** Punkt geworden.

**Die Entscheidungen vom 2026-08-11 (Account-Horizont)**: ein Konto überall — echte Projekt-ID-Migration pool→account (Davids Wahl gegen die Empfehlung; jetzt der einzige günstige Moment), my./start. gehen in account. auf, control. wird admin., master-Werkstatt + demo-Vollausbau, F3 fest eingeplant. Tiefe: [ACCOUNT-HORIZONT.md](plans/ACCOUNT-HORIZONT.md).

**Die Entscheidungen vom 2026-08-10** (Planungsrunde, strukturierte Fragen —
Details im [DECISION-LOG](DECISION-LOG.md)): Code-Pflicht bleibt, bekommt aber
einen Betreiber-Schalter (U2) · eigene Domain bleibt Pro-only (U13, damit
erledigt → COMPLETE) · Wizard-Pflicht = Name/Adresse · Kategorie · Vibe (U12) ·
Social-Login nur Google, nach AP1–AP8 (U14) · Geld-Wort „Plan" (U6) ·
U15/F57 bleiben geparkt bis AP1–AP8.

**AH-3-Krümel — Deploy-Gate prüfen (ESKALIERT: ZWEIMAL aufgetreten, AH-3 und AH-7 — beide Male gate:success/deploy:skipped bei echtem Code-Diff; Prio jetzt Hoch).** Der AH-3-Code-Commit wurde vom Diff-Gate als „nichts zu deployen" gewertet (deploy-Job skipped, Gate grün) — vermutlich stört ein schneller Folge-Push die Diff-Auflösung in der concurrency-Gruppe. Nachstellen und härten; der workflow_dispatch-Hebel bleibt der Ausweg. [Klein, S]

**Font-Seed-Krümel — der Schutz verfällt am 2026-08-18 still.** Die unifont-Metadaten im Prod-Seed (`~/fonts-cache`) tragen eine 7-Tage-TTL (`expires` nachgemessen), und das additive Zurückschreiben (`--ignore-existing`) ersetzt gleichnamige Metadaten-Dateien nie — nach Ablauf löst jeder CI-Build wieder LIVE gegen Google auf, das gstatic-404-Risiko ist zurück. Seed periodisch von einer gesunden Maschine auffrischen ODER das Rückschreiben für `meta/*/…-data.json` gezielt öffnen (Blobs bleiben additiv). [Klein, S]

**AH-1-Krümel — Bucket-Anlage in die Migrationen.** Beim Cutover zeigte sich: `avatars` und `gdpr-exports` existierten im Pool nur von Hand — kein Migrations-Script legt sie an (fonts/media/event-covers/ticket-files schon). Nachziehen, sonst fehlt beides in jeder frischen Instanz. [Klein, S]

**C19 — `/de` war für englischsprachige Browser eine Endlosschleife.**
Code-Fix erledigt 2026-07-31, auf prod REPRODUZIERT und lokal behoben. Kein
Konfigurationsfehler, ein Modul-Bug: `@nuxtjs/i18n` 10.6.0 baut das
Redirect-Ziel per `joinURL('', '/', '/')` — ufo kollabiert lauter Schrägstriche
zu `''`, genau EIN Fall betroffen (Ziel = Wurzel UND keine Query; traf auch
Cookie-Kombinationen, nicht nur EN-Browser). 10.6.0 ist die einzige
existierende 10.6.x-Version — kein Upstream-Patch zum Nachziehen. Fix:
`packages/core/server/plugins/i18n-empty-redirect.ts` (`render:response`-Hook,
normalisiert JEDEN 3xx mit leerem Location auf die App-Wurzel + repariert den
meta-refresh-Body; bewusst sprachagnostisch — wird der Bug upstream behoben,
wird der Handler still wirkungslos). Die dokumentierten i18n-Entscheidungen
(kein fallbackLocale, redirectOn all) sind unangetastet; 10-Fälle-Matrix inkl.
Crawler-Fall grün, gegen marketing UND comments verifiziert. **Auf
pukalani.app seit 2026-07-31 DEPLOYED und live nachgemessen** (302 auf `/`
statt leerem Location). Offen nur noch: die übrigen Hosts (my/control/
comments/portfolio/help) erben den Fix über core mit ihrem jeweils nächsten
Release — keine Eile, der Bug traf praktisch nur die Landing (einzige Seite,
deren `/de`-Links öffentlich geteilt werden).

**A1 — Rechtstexte.** Entwürfe sind LIVE (2026-07-23): vollständige,
stack-spezifische Texte (Impressum § 5 DDG, DSGVO-Datenschutzerklärung mit
Hetzner/Resend/Stripe/Cookies/Betroffenenrechten, AGB mit Plänen/Kündigung/
UGC/Haftung) DE+EN auf /imprint, /terms, /privacy — jeweils mit sichtbarem
„Entwurf"-Hinweis und `noindex`. Rest bei David: Adresse und
USt-IdNr.-Platzhalter im Dashboard ausfüllen + Anwalt drüberschauen lassen.
Schaltet A2 frei.

<a id="a2a"></a>

**A2 — Stripe-Live scharfschalten.** Fünf Schritte laut
[Runbook](runbooks/STRIPE-GO-LIVE-RUNBOOK.md): 2.1 Bank-Aktivierung [David] ·
2.2 Live-Webhook [David] · 2.3 Keys in Server-.env [David] · 2.4 Live-Portal
konfigurieren (braucht A1) [Claude] · 2.5 Minimal-Verifikation [beide].
**Vorstufe A2a — ENTSCHIEDEN (2026-08-07, 4. Runde): Claude spielt sie NACH
F49 durch** (sonst probt man einen Ablauf, der sich direkt danach ändert):
die 6 manuellen Testmodus-Schritte in
[STRIPE-TEST-WALKTHROUGH.md](runbooks/STRIPE-TEST-WALKTHROUGH.md) durchspielen
(ensure-prices, Monats-/Jahres-Checkout, Portal-Kündigung,
Test-Clock-Periodenende, `payment_failed`) — die Absicherung, bevor echtes Geld
fließt. **ACHTUNG, das Runbook ist ab Schritt 2 veraltet** (Warn-Kasten oben,
seit 2026-08-01): es beschreibt die mit A6 Schritt 5 gefallene Workspace-Welt
(`/dashboard/workspaces`, `/workspace`, Pläne free/pro/business, Preise
19/190 € bzw. 49/490 €). Heutiger Weg ist
`<community-host>/dashboard/community/plan` (Reiter „Plan" im
Community-Settings-Hub, seit F51; Capability `community.billing`, nur Owner —
`packages/onboarding/app/pages/dashboard/community/plan.vue`),
Checkout/Portal über `POST /api/community/billing/{checkout,portal}`,
Rückkehr-URLs baut `apps/control/server/utils/communityCheckout.ts` aus
`communities.host`. Unverändert richtig: Webhook-Endpunkt + Ereignis-Liste,
`scripts/stripe/ensure-prices.mjs`, die lookup_keys
`workspace_{personal,pro}_{monthly,yearly}` (gewachsene Stripe-Identitäten,
kein Hinweis auf Workspaces), Testkarten, Zahlungsfehler-Pfad. **Der Durchlauf
schreibt die Anleitung mit und entfernt danach den Warn-Kasten** — bewusst kein
Umschreiben am Schreibtisch: ein erfundener Klickpfad ist schlimmer als ein
markiert veralteter. **Dazu der Rest aus A3 (Brutto-Preise):** Stripe legt die Prices ohne
`tax_behavior` an und die Checkouts laufen mit `automatic_tax` — steht das
Konto-Default auf „exclusive", rechnet Stripe 19 % oben drauf und widerspricht
der Landing. Prüfung vor dem Live-Gang: Runbook §2.4. Der Klammer-Hinweis „zeigt
noch auf den `studio`-Alias" ist seit 2026-07-30 gegenstandslos: der
Test-Webhook zeigt auf `control`, der Alias ist entfernt.

**C5 — Seitentitel.** Der ursprünglich gemeldete Teil war schon erledigt
(nachgemessen 2026-07-30): `register/index.vue`, `forgot-password.vue` und
`reset-password.vue` rufen alle drei `useBrandTitle(...)`. **Daneben liegt eine
größere, nie erfasste Lücke:** von allen Seiten in core/admin/blueprint setzen
nur **9** einen Titel — **17 Dashboard-Seiten** (`dashboard/index`,
`settings/*`, `users/*`, `admin/*`, `storage`, `system`) und das ÖFFENTLICHE
`core/app/pages/verify.vue` setzen gar keinen, und **kein Layout springt ein**.
In einer SPA heißt das nicht „kein Titel", sondern: der Titel der ZUVOR
besuchten Seite bleibt im Tab stehen. Fix ist mechanisch (`useBrandTitle` je
Seite, i18n-Schlüssel existieren größtenteils). **Seit 2026-08-10 Teil von U11
(AP7)** — zusammen mit den zwei toten `useHead`-Aufrufen aus Dashboard-M6.

**C2 — UI-Plan-Gate für Kurse/Events** in der Nav (`pukalani.chrome.nav`,
blueprint) — heute per Direktlink erreichbar, läuft in den API-404.
Herkunft: Kurse-Bericht / Audit S4.

**C3 — Kompositionen Events + Kurse in den Bauplan.** `EventDetail` und
`LessonView` füllen ihren `#comments`-Slot bisher nur in `apps/comments`.
Herkunft: Produkt-Bilanz.

**C4 — Nav-Einträge events/courses** aus `apps/comments/app/app.config.ts` in
die Layer verschieben. Herkunft: S9-Bericht.

**C6 — Aufräum-Migration:** Legacy-Spalte `app_config.entitlements` droppen.
Gebaut am 2026-07-31 als `packages/system/scripts/migrations/027-drop-app-config-entitlements.ts`,
zusammen mit dem Code-Abbau des 2-Wege-Reads (`getLegacyEntitlementsDocument`/
`clearLegacyEntitlementsDocument` sind gefallen). **Offen ist nur noch das
Ausführen, und die Reihenfolge ist Pflicht:** erst den Code deployen, dann
migrieren — andersherum liest der Fallback gegen eine gelöschte Spalte.
Herkunft: Pool-Audit N2.

**M13 — Reste des Self-Service-Onboardings:** Trial-Banner +
Ablauf-Erinnerung · Kundenbereich-Umzug `/workspace` → `my.*` ·
Abuse-/Suspend-Pfad · 301 von den Altnamen (bewusst später: Deploy-Verify und
Stripe-Webhook hingen an `studio.*`) · Statusseite bei UptimeRobot.
Details: [SAAS-ROADMAP #1](archiv/SAAS-ROADMAP.md).

**E1 — tote Schlüsseldatei.** `apps/control/.env.production` zeigt noch auf das
gelöschte Projekt `studio` (Cutover-Altlast) — die Datei ist tot: die Keys darin
gehören einem Projekt, das es nicht mehr gibt. **Sie liegt NICHT im Repo**
(gitignored, kein Skript und kein Workflow verweist darauf; die frühere
Formulierung „die Datei im Repo" war falsch) — es ist eine lokale Altlast auf
Davids Rechner, und ein Aufruf `--env-file=apps/control/.env.production` würde
gegen ein nicht existierendes Projekt laufen. Der richtige Pfad ist
`~/.appwrite-secrets/migrations/control.env`. **Löschen ist Davids Klick**
(Datei mit Schlüsselmaterial) — **zugesagt für zeitnah (2026-08-07, 4. Runde;
E3 und E4 wurden dabei bewusst NICHT gewählt und bleiben liegen).** Die anderen drei `.env.production`
(platform → `pool`, comments, portfolio) sind korrekt.

**E3 — Hetzner-Rescale** prüfen (CX33 knapp bei sechs Apps + Builds). [David]

**E4-Rest — Cutover-Krümel:** Read-only-Key im Projekt `control` erzeugen
[David, Console]. Der ploi-Alias `studio.` ist entfernt (2026-07-30), und das
„Doppel-Zertifikat" ist bewusst KEIN Aufräum-Punkt — Einzelheiten in
[OPEN-ITEMS-COMPLETE.md](OPEN-ITEMS-COMPLETE.md).

### Bewusst zurückgestellt (kein Aufgabenpunkt)

- **Flag-Registry statt `commentsEnabled`** — mittlerer Refactor der
  AppConfig-Typen, lohnt erst mit dem nächsten neuen Flag.
- **`useFormatCurrency`** bleibt als Baukasten-Vorhaltung (billing nutzt sie).
- **targetType-LOW-Residual** — kommt mit dem `comment_reports`-Modell.
- **Entwurfs-DATEIEN im Medien-Bucket** tragen nur den globalen Operator-Read:
  im Pool könnte die Redaktion einer Kunden-Site ihre eigenen Entwürfe nicht
  vorschauen. Kein Leck; Richtung (server-seitige Vorschau-Route) steht in
  `media/server/utils/mediaPermissions.ts`.
- **Eigenes og:image hochladen** — bewusst nicht gebaut, die Karte wird
  generiert.
- **Glocke auf `my.pukalani.app`** — dort gibt es heute nichts zu zeigen;
  kommt Pool-Billing (D1), braucht das Onboarding-Layout eine.
- **Gast-Kommentar in einer geschlossenen Community** bekommt `read(label:…)`
  und ist damit für seinen eigenen Verfasser unsichtbar — die ehrliche Folge
  daraus, dass Gast-Kommentare und „nur für Mitglieder" einander
  widersprechen. Wer es sauber will, schaltet `pukalani.comments.embed.guests`
  ab. (Aus dem C18-Abschluss übernommen.)
- **Inline-Embed ohne iframe** (eigener Sanitizer + CORS-Allowlist) und eine
  dedizierte `apps/embed-comments` — bewusst später, supervised.
- **Gebühr auf die Einnahmen der Kunden, Preis pro Mitglied, ein dritter
  „Köder"-Plan** — der Wettbewerbsvergleich rät von allen dreien ab: die
  Gebühr ist der meistkritisierte Mechanismus im ganzen Feld (8–14 % des
  Umsatzes gehen anderswo an die Plattform), und 0 % ist der eine Satz, der
  Pukalani unterscheidet.
- **Produkttour mit Sprechblasen und Kreditkarte in der Testphase** — für die
  Tour ist belegt, dass sie nichts verbessert (die Startliste aus U4 ist die
  Alternative, nicht ihre Vorstufe); auf die Karte verzichtet das ganze Feld
  außer einem Anbieter, und der wird dafür kritisiert.
