# Offene Punkte

**Stand: 2 offen · 4 geparkt/wartend · 13 bewusst zurückgestellt** (Zahlen bei JEDEM Umzug nach COMPLETE mitführen)

Stand: **2026-08-12**. Hier steht **nur, was noch offen ist** — in der
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
| 2 · A1 | **Echte Rechtstexte** für Impressum, Datenschutz und AGB. **pukalani.studio ist fertig** (2026-08-12): Impressum + Datenschutz in de/en veröffentlicht, inkl. **ladungsfähiger Anschrift**; die Texte nennen nur Belegbares, Erfundenes wurde weggelassen. Dort noch offen und beim Anwalt: die Prüfung zu **Art. 27 DSGVO** (Vertreter in der Union — Sitz ausserhalb der EU bei DACH-Ansprache) samt Drittland-Grundlage, dazu die Angabe zur Verbraucherstreitbeilegung. Für **pukalani.app** stehen die Texte weiter aus. **Direkt danach `pukalani.auth.termsUrl` in `apps/platform` setzen** — die AGB-Checkbox fehlt heute genau dort, wo Kunden sich registrieren (Trichter M9). Schaltet Punkt 3 frei. | Hoch | S — Anwalt lesen lassen | Ja: nur David (ggf. Anwalt) | [Agenda: Studio](#a1-anwalt) · [Agenda: Plattform](#a1-plattform) |
| 3 · A2 | **Stripe auf echtes Geld umstellen — über die F55-Seite.** Vorstufe A2a komplett grün, F55 selbst erledigt (beide 2026-08-08). Bei David bleiben: Bank-Aktivierung, Steuer-Registrierung, Live-Key ROTIERT eintragen (der erste ist teil-geleakt und rotiert), Portal-Konfiguration; alles andere klickt die F55-Seite. Braucht Punkt 2 (A1). | Hoch | S | Ja: Bank, Konto, Portal | [STRIPE-GO-LIVE-RUNBOOK.md](runbooks/STRIPE-GO-LIVE-RUNBOOK.md) |

## ⏸️ Geparkt / wartet — in Arbeitsreihenfolge

Die Reihenfolge ist die, in der wir sie anfassen würden: erst was eine
Entscheidung braucht, dann die großen Brocken. **Die Aufwände sind ehrlich
gemeint** — hier steht nichts mehr, was an einem Nachmittag fertig wird; F7
ist Wochen. (F3 ist am 2026-08-11 als AH-6 in die Hauptliste gezogen.)

| # | Reihenfolge | Was (einfach erklärt) | Prio | Aufwand | Braucht David? | Wartet auf … |
| --- | --- | --- | --- | --- | --- | --- |
| U14 | 1 — Tage | **Anmelden mit Google.** Der CODE ist gebaut (Knopf auf Anmelden + Registrieren, erklärte Datenschutz-Zeile, Beitritt/Feed wie beim Passwort-Weg, gedrosselt, ohne Credentials unsichtbar). Offen sind nur noch **Klicks bei David**: Google-Console, Appwrite-Console, zwei Schalter. Die Circle-Falle trifft uns nicht — Google sieht nur die Appwrite-Adresse, nie einen Kunden-Host. | Mittel | S (Rest) | Ja: die Klicks | [Runbook GOOGLE-LOGIN.md](runbooks/GOOGLE-LOGIN.md) |
| F7 | 3 — Wochen | **Bezahlte Communities** — der Owner nimmt Geld von seinen Mitgliedern (Stripe Connect). Eigene Mechanik und eigene Rechtsfragen. **Schluckt D1** (Davids Entscheidung 2026-08-02): bezahlte Pool-Events/-Kurse ergeben erst mit Connect Sinn. Events-Hälfte technisch M, Kurse-Hälfte L/XL (community-scoped Entitlements sind unentworfen). Messlatte laut Benchmark: Skools Merchant-of-Record-Modell inkl. EU-USt., nicht der Prozentsatz. | Mittel | XL | Ja: Rechtsfragen | nach dem Go-Live; erst muss Geldfluss 1 (A6) ankommen |
| F47 | 4 — Klicks | **Analytics v2, Rest = nur noch Plausible-UI-Klicks** (Adblock-Proxy live 2026-08-12; Kundenbereich-Messung ENTSCHIEDEN: Sammel-Site, Code live): (1) Goals der sieben Trichter-Ereignisse in der Sammel-Site WÖRTLICH anlegen (`funnel_cta_start` …, CE hat keine Goals-API), (2) E-Mail-Reports je Site aktivieren. | Niedrig | S | Ja: Plausible-UI | [ANALYTICS-V2.md](plans/ANALYTICS-V2.md) § 5 · DECISION-LOG 2026-08-12 |

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
**admin** (Betreiber; `control.pukalani.app` leitet seit AH-4 per 301 weiter,
ploi-Site und Server-Verzeichnis behalten den Altnamen) + **account**
(Kundenbereich + Wizard; my/start leiten seit AH-1 am 2026-08-11 per 301 weiter),
portfolio (comments ist seit F3 am 2026-08-12 eine Pool-Community), **platform** (Multi-Tenant, `*.pukalani.app`-Wildcard —
demo.pukalani.app als erster Pool-Tenant, neue Kundensite = ein Klick im
Control, kein Build), **help.pukalani.app** (Hilfe-Site, seit 2026-07-27) und
die interne Doku unter `admin.pukalani.app/docs`. Auto-Deploy (6 Sites),
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

**Krümel-Welle 2026-08-12 — KOMPLETT ERLEDIGT** (Font-Seed, Buckets, USlider, C2/C3/C4, C6, Handle-Gegenprobe + Sicherheitsfix): vollständiger Eintrag mit Beweisen in [OPEN-ITEMS-COMPLETE.md](OPEN-ITEMS-COMPLETE.md).

**AP8/AP9/AP10-Entscheidungen — ALLE ENTSCHIEDEN am 2026-08-12** (DECISION-LOG): KI-Vorschlag bleibt gelöscht · Markt-Signal „hinter dem Aha" = neuer Punkt U19 · Copy ehrlich gemacht (Team-Rollen raus, Kurse-Zeile aufs Belegte) · Export-Versprechen gesenkt + Community-Export = neuer Punkt U20.

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

<a id="a1-anwalt"></a>

**A1 — Rechtstexte: Stand und Agenda für den Anwaltstermin.**

**Fertig (2026-08-12):** `pukalani.studio` hat Impressum und
Datenschutzerklärung in de+en, veröffentlicht, mit ladungsfähiger Anschrift.
Die Texte nennen ausschließlich Belegbares — was eine Bewertung oder eine
Willenserklärung braucht, wurde WEGGELASSEN statt geraten. Sie sind live
lesbar (`/de/imprint`, `/de/privacy` und die en-Fassungen) und damit die beste
Vorlage für das Gespräch.

**Offen ist keine Datenlücke mehr, sondern fünf Bewertungen.** Die Fragen sind
so gestellt, dass sie in einem Termin beantwortbar sind — sie sind FRAGEN, keine
Rechtsauffassungen:

1. **Vertreter in der Union (Art. 27 DSGVO)?** Der Verantwortliche sitzt in den
   USA, das Angebot richtet sich deutschsprachig und in Euro an DACH — das
   Marktortprinzip (Art. 3 Abs. 2) greift also. Verarbeitet werden nur
   Server-Protokolle, ein Sprach-Cookie, cookielose Reichweitenmessung und
   Kontaktanfragen; es gibt keine Besucherkonten, keine Profilbildung, keine
   besonderen Kategorien. **Frage:** Greift die Ausnahme nach Art. 27 Abs. 2
   lit. a (gelegentlich, geringes Risiko) — oder ist ein Vertreter zu benennen?
   Falls ja: Name und Anschrift, sie gehören dann in beide Dokumente.
2. **Drittland-Grundlage.** Die Server stehen in Deutschland, der
   Verantwortliche greift aus den USA darauf zu. **Frage:** Ist das eine
   Übermittlung im Sinne von Kapitel V, und was ist im Abschnitt „Zugriff aus
   dem Ausland" konkret zu nennen?
3. **Gilt § 5 DDG überhaupt?** Er verpflichtet in Deutschland niedergelassene
   Anbieter. **Frage:** Welche Pflichten treffen einen US-Anbieter mit
   DACH-Ausrichtung stattdessen (Marktortprinzip, UWG), reicht die jetzige
   Fassung — und ist der Block „Verantwortlich für den Inhalt" wegen der
   redaktionellen Wissen-Artikel (§ 18 Abs. 2 MStV) richtig besetzt?
4. **Verbraucherstreitbeilegung (§ 36 VSBG).** Das Angebot richtet sich an
   Unternehmen, die Guides sind öffentlich. **Frage:** Ist eine Erklärung nötig,
   und wie soll sie lauten? (Der Abschnitt fehlt derzeit bewusst — eine
   Willenserklärung kann niemand außer David abgeben.)
5. **Umsatzsteuer.** Dienstleistungen eines US-Anbieters an Unternehmen in der
   EU. **Frage:** Reverse-Charge-Hinweis nötig, USt-IdNr. erforderlich? Das
   betrifft Rechnungen ebenso wie den Impressums-Abschnitt.

**Mitnehmen zum Termin** (alles steht in der veröffentlichten
Datenschutzerklärung, hier als Kurzfassung): Einzelunternehmen, Sitz Makawao
(Hawaii, USA) · Zielgruppe Unternehmen und Agenturen in DACH · verarbeitet
werden Server-Protokolle, ein Sprach-Cookie (`i18n_redirected`), cookielose
Reichweitenmessung mit **selbst gehostetem** Plausible auf einem Server in
Deutschland sowie Kontaktanfragen per E-Mail/Telefon · Terminbuchung über
cal.com ist nur VERLINKT, nicht eingebettet · keine Besucherkonten, kein
Newsletter, keine Werbenetzwerke, keine eingebetteten Drittinhalte, Schriften
vom eigenen Server · Hosting in Deutschland.

**Danach umzusetzen** (Claude, je Antwort eine Textstelle): Vertreter →
eigener Abschnitt in der Datenschutzerklärung de+en · Drittland-Grundlage →
Abschnitt „Zugriff aus dem Ausland" · Verbraucherstreitbeilegung und
USt-IdNr. → je ein Abschnitt im Impressum de+en. Rechnen: rund eine halbe
Stunde, danach live nachgemessen.

<a id="a1-plattform"></a>

**A1b — pukalani.app: eigener Block im selben Termin.** Die Plattform ist ein
anderer Fall als die Studio-Site: dort sind es Davids eigene Daten, hier sind
es die Daten FREMDER Leute in fremden Communities, dazu Geld und
nutzergenerierte Inhalte. Stand: Impressum, Datenschutz und AGB existieren als
Platzhalter mit sichtbarem Entwurfs-Hinweis und `noindex` — ehrlich, aber leer;
auf Mandanten- und Kontroll-Hosts gibt es gar keine Rechtsseiten (der Fuß
verlinkt auf `pukalani.app`).

**Die Kernfrage, an der alles hängt: Auftragsverarbeiter oder gemeinsam
verantwortlich?** Das eigene Strategiepapier hält beides für möglich und
verlangt eine Einzelfallprüfung. Vier gebaute Tatsachen gehören dem Anwalt
dafür auf den Tisch, weil sie gegen die reine Auftragsverarbeitung sprechen
könnten: (a) **ein Konto gilt plattformweit** — alle Pool-Communities und alle
Nutzer liegen in EINEM Appwrite-Projekt, man registriert sich bei Pukalani,
nicht bei der Community; (b) der Betreiber hat einen **protokollierten
Break-Glass-Zugriff** auf Kunden-Communities; (c) der Betreiber kann eine
Community **sperren** (`suspension: 'abuse'` ⇒ Host 404); (d) der
**Auto-Hide-Schwellwert** (3 offene Meldungen) ist vom Betreiber gesetzt, nicht
vom Owner. Von der Antwort hängen AVV, Rollen-Formulierung in ALLEN Texten und
die Kunden-Vorlagen im `pages`-Layer ab.

**Weitere Fragen, beantwortbar formuliert:**

1. **Anbieter-Identität.** Ist Anbieter von `pukalani.app` dieselbe Person und
   Rechtsform wie bei der Studio-Site (Einzelunternehmen, Sitz USA)? Falls ja,
   gelten die fünf Studio-Fragen (Art. 27, Drittland, § 5 DDG, VSBG, USt) hier
   **erneut und schärfer**, weil es um fremde Nutzerdaten geht.
2. **Verbraucher oder Unternehmer?** Pläne 29 €/149 € im Monat, Brutto-Preise
   „inkl. 19 % MwSt.", Selbstbedienung ohne USt-IdNr.-Abfrage. Richten sie sich
   auch an Verbraucher? Falls ja: **Widerrufsrecht** (im Code und in allen
   Texten bisher nirgends behandelt), Button-Lösung, Preisangaben.
3. **Umsatzsteuer.** US-Anbieter verkauft digital an EU-Kunden, Stripe Tax ist
   an, Rechnungsadresse Pflicht, USt-IdNr. wird **nicht** erfasst, OSS ist ein
   manueller Schritt. Was ist nötig — Reverse Charge, OSS, USt-IdNr.-Erfassung?
4. **DSA-Pflichten.** Die Plattform hostet fremde Inhalte und hat ein
   Meldesystem — aber **kein Beschwerdeverfahren** gegen Moderations-
   entscheidungen, **keine Benachrichtigung des Autors** beim Ausblenden und
   **keinen Transparenzbericht**. Frage: Welche Pflichten treffen einen
   Hosting-Dienst dieser Größe (Art. 16/17/20 DSA), und was davon muss vor dem
   Go-Live gebaut sein?
5. **Mindestalter.** Es gibt keine Altersgrenze, keine Abfrage, keinen Hinweis.
   Ab welchem Alter dürfen Konten entstehen (Art. 8 DSGVO), und wie ist das
   nachzuweisen?
6. **Aufbewahrung.** `audit_logs` enthalten **IP-Adressen ohne Löschfrist**
   (bei Kontolöschung wird pseudonymisiert, nicht gelöscht); Server-Protokolle
   haben kein logrotate. Welche Fristen sind vertretbar, was muss in die Texte?

**Was danach GEBAUT/GESCHRIEBEN werden muss — unabhängig vom Ausgang:**
ein **AVV/DPA für Kunden** (existiert nicht, ist aber auf `/gdpr` öffentlich
zugesagt: „sprich uns an, wir klären das vor dem Start deiner Community" — ein
Versprechen ohne Deckung), eine **Subprozessoren-Liste** (nach dieser Erhebung
mindestens Hetzner, ploi.io, Cloudflare, Resend, Stripe, OpenRouter,
UptimeRobot), die drei echten Texte, ein Zustimmungsschritt im Onboarding und
`pukalani.auth.termsUrl` in `apps/platform` (fehlt genau dort, wo Kunden sich
registrieren).

**Faktenblatt zum Mitnehmen** (alles am Code erhoben, Stand 2026-08-14):
Konten mit E-Mail/Name/Bio/Avatar in **einem** Appwrite-Projekt · Inhalte immer
mit Autor-Id UND Autorname · private Nachrichten (bei Meldung wird eine
Beweiskopie 90 Tage eingefroren) · Meldungen, zweiphasiges Ausblenden statt
Löschen, Auto-Hide ab 3 Meldungen (nur Kommentare, nicht KI-basiert) ·
KI-Assist ist **rein beratend** und bekommt Kommentar-/Beitragstexte samt
Autorname (OpenRouter, in `apps/platform` freigeschaltet) · Zahlungen über
gehostetes Stripe Checkout, **Vertragspartner ist die Community, nicht das
Konto**, Kündigung/Rechnungen laufen über das Stripe-Portal, 14 Tage Testphase
ohne Zahlungsdaten, danach nur-lesend statt Löschung · Stripe Connect ist
**nicht** gebaut · Server bei Hetzner in Deutschland, Appwrite self-hosted auf
eigenem Server, Backups 14 Tage lokal + offsite auf eine Hetzner Storage Box ·
Cookies: Session (nur eingeloggt), Sprache, Darstellung, aufgeklappte Threads —
**kein Consent-Banner aktiv** · Google-Login gebaut, aber nirgends
eingeschaltet · Gast-Kommentare in `apps/platform` bewusst aus.

**Drei Stellen, an denen die AUSSAGE dem CODE widerspricht — die gehören nicht
dem Anwalt, sondern mir** (Reihenfolge = Dringlichkeit): (1) „Plausible
speichert keine personenbezogenen Daten" steht in Kunden-Vorlage,
Entwurfs-Datenschutzseite und `/gdpr` — der Analytics-Proxy leitet aber **IP
und User-Agent** an die Plausible-Instanz weiter; die Aussage beschreibt das
Cookie-Verhalten, nicht die Übermittlung. (2) `/gdpr` wirbt mit „Community
starten – kostenlos", seit F49 ist eine Community ohne Abo nach 14 Tagen
nur-lesend (die Preisseite formuliert es korrekt). (3) Die Hilfeseite führt
Basic weiter als Plan mit „0 €", die Preisseite hat ihn entfernt.
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

- **„Taxes"-Seite** (U15-Runde 2026-08-13): Stripe `automatic_tax` rechnet die
  Steuer im Checkout — eine eigene Seite wäre eine Attrappe. Der Rest ist
  Runbook A2 § 2.4 (Konto-Default „inclusive" prüfen).
- **„Bulk-Logs"-Seite** (U15-Runde 2026-08-13): Aktivitäts- und
  Audit-Protokolle existieren; eine dritte Log-Ansicht ohne neuen Inhalt
  wäre Doppelpflege.
- **Geparkt mit Bedingung** (U15-Runde 2026-08-13): Bio/öffentliches Profil
  (erst wenn öffentliche Profile gewollt sind — heute bewusst nicht) ·
  API-Tokens (erst mit einer öffentlichen API-Story) · SSO (Enterprise-/
  Studio-Angebot) · E-Mail-Einstellungen je Community (erst mit eigenem
  Absender/SMTP je Kunde).

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
