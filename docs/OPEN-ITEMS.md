# Offene Punkte

**Stand: 5 offen · 2 geparkt/wartend · 13 bewusst zurückgestellt** (Zahlen bei JEDEM Umzug nach COMPLETE mitführen)

Stand: **2026-08-19**. Hier steht **nur, was noch offen ist** — in der
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
| 1 · S3 | **Zweiter Faktor fehlt überall — und Google für die Konsole.** Nachgemessen 2026-08-23: `admin`, `account` und `portfolio` haben je genau EIN Admin-Konto (`mail@davidschubert.com`), und bei allen dreien steht MFA auf **aus**. Das `admin`-Konto darf Communities stilllegen und Stripe verwalten, das `account`-Konto reicht per Break-Glass in jede Kunden-Community. (a) MFA in allen drei Projekten einschalten, (b) Google-Client für Projekt **`admin`** anlegen — Redirect-URI endet auf `/admin`, NICHT `/control` (das Projekt ist gelöscht). Code-Seite ist live und bewusst wirkungslos, bis (b) steht; danach setzt Claude die Env und misst nach. | **Hoch** | S | Ja: Konsolen-Durchgänge | [GOOGLE-LOGIN.md](runbooks/GOOGLE-LOGIN.md) |
| 3 · A1 | **Echte Rechtstexte** für Impressum, Datenschutz und AGB. **pukalani.studio ist fertig** (2026-08-12): Impressum + Datenschutz in de/en veröffentlicht, inkl. **ladungsfähiger Anschrift**; die Texte nennen nur Belegbares, Erfundenes wurde weggelassen. Dort noch offen und beim Anwalt: die Prüfung zu **Art. 27 DSGVO** (Vertreter in der Union — Sitz ausserhalb der EU bei DACH-Ansprache) samt Drittland-Grundlage, dazu die Angabe zur Verbraucherstreitbeilegung. Für **pukalani.app** stehen die Texte weiter aus. **Direkt danach `pukalani.auth.termsUrl` in `apps/platform` setzen** — die AGB-Checkbox fehlt heute genau dort, wo Kunden sich registrieren (Trichter M9). Schaltet Punkt 3 frei. | Hoch | S — Anwalt lesen lassen | Ja: nur David (ggf. Anwalt) | [Agenda: Studio](#a1-anwalt) · [Agenda: Plattform](#a1-plattform) |
| 4 · A2 | **Stripe auf echtes Geld umstellen — über die F55-Seite.** Vorstufe A2a komplett grün, F55 selbst erledigt (beide 2026-08-08). Bei David bleiben: Bank-Aktivierung, Steuer-Registrierung, Live-Key ROTIERT eintragen (der erste ist teil-geleakt und rotiert), Portal-Konfiguration; alles andere klickt die F55-Seite. Braucht Punkt 2 (A1). | Hoch | S | Ja: Bank, Konto, Portal | [STRIPE-GO-LIVE-RUNBOOK.md](runbooks/STRIPE-GO-LIVE-RUNBOOK.md) |
| 5 · W2–W4 | **Studio-Funnel ausbauen.** Wizard + Messung sind seit 2026-08-22 LIVE (s. COMPLETE). Offen: (a) die 5 `studio_*`-Goals in der Plausible-UI anlegen (CE hat keine API — nur David), (b) W3 Startseiten-Ausbau (Problem-Spiegel, Vergleichstabelle, Selbst-Selektion), (c) W4 echte Kennzahlen in die Cases (Zahlen von David). | Mittel | S–M je Paket | Ja: Goals klicken, Schmerz-Texte gegenlesen, Case-Zahlen | [STUDIO-ERSTGESPRAECH-FUNNEL.md](plans/STUDIO-ERSTGESPRAECH-FUNNEL.md) |
| 6 · BW1 | **Brand-Wizard Phase 1 „Fundament" — FREIGEGEBEN 2026-08-28, in Umsetzung.** KI-Markenberater „George" (Layer `brand`, pukalani.studio/Projekt `portfolio`, später branding.supply). Sechs Audits eingearbeitet; P0b-Clickdummy LÄUFT (packages/brand/.playground, Port 3009, Korrekturrunden mit David); P0 GESCHRIEBEN (plans/BRAND-WIZARD-CONTENT-SPEC.md — 3 David-Gates offen: Fragen gegenlesen, „George" absegnen, Bilanz-Befund); P1a-Code FERTIG (Admission-Naht, providerRouting, system-038, Brand-Gates — alles auf main); Schema ABGENOMMEN, P1b FERTIG (Migrationen brand-001–008, Slot-Registry 68, Zustandsmaschine, 14 API-Routen fail-closed auf pukalani.studio; Beta zu, Modus closed). KEHRTWENDE 2026-08-31 (David): eigenes Appwrite-Projekt `branding` + Domain branding.supply — INFRA KOMPLETT AUSGEFÜHRT, SITE LIVE SEIT 2026-09-01 (Beta-Modus invite, Davids Code ausgestellt; Runbook runbooks/BRANDING-SUPPLY-SETUP.md alles ✔ bis auf Davids Erst-Registrierung). P1c-FOUNDATION FERTIG (i18n-Kataloge 180 Schlüssel je Sprache, Store+Autosave/409, echte Seiten /dashboard/brands + Anlage + Vollbild-Werkstatt; 176 Tests). P1c KOMPLETT (inkl. SSE-Streaming mit Dev-Stub + Fassungs-Historie; 227 brand- + 1422 core-Tests). MERKER: KI-Drosseln (§6) Pflicht vor brandAiEnabled=true (P2). P1d-ZUGANGS-DURCHSTICH LIVE (2026-09-01): /invite?code= → admissionCode → Redeem nach Mail-Verifizierung; Live-Probe mit Davids Code zeigt das Registrierformular. P1d ABGENOMMEN (2026-09-01: David registriert→verifiziert→eingelöst→drin; Zweiter-Tab-Falle dabei gefunden+gefixt). P2 KOMPLETT GEBAUT (2026-09-01, vier Teilpakete auf main): Drossel-Vertrag (200/10/Burst 2/Instanz-Deckel, Launch-Gate), George-Generator Baustein A (ZDR-Routing, Formvertrag Stub↔echt), Startkarte (brand-009, Anlage-Dialog, George-Kontext), URL-Analyse (brand-010, SSRF-Vertrag geschlossen, 81 Fälle). Migrationen 009+010 sind auf Prod GEFAHREN. KI EINGESCHALTET + P2 ABGENOMMEN (2026-09-01/02, Davids Go + Live-Persona-Audit: 5 Test-Brands, 9 Befunde, alle behoben; Bericht claude.ai/code/artifact/42d6a3f3…). P2-NACHSCHÄRFUNG `george-a-4` + SICHTBARES BERATERTEAM GEBAUT (2026-09-01, nach Live-Persona-Audit an Davids erstem Branding): fünf Berater (George Gastgeber, Vera Strategie, Milo Werte, Nika Sprache, Otto Naming), Rahmung des Chat-Zugs, Rückfrage statt erfundenem Entwurf (`outcome: question`), Bereitschafts-Gate je Slot (409 `not_ready`), B4/B6/B8/B9. WERKSTATT-FEINSCHLIFF (2026-09-02, Davids Live-Befunde): Bestätigen ist ein ZUSTAND (Server erzwingt, „Korrigieren" einziger Rückweg — vorher lief Feld neben Dokument still auseinander!), Ampel grau/bernstein/grün + Sticky-Kapitel-Fortschritt, EINE Fortschritts-Wahrheit („x von y bestätigt"; Plan-§3b-Füllformel lebt nur noch in den Übersichts-Karten), Schein-Konflikt still aufgelöst, Georges Chat-Sprache folgt der Seite, /team live (Produkt-Team + Wizard-Crew). PROFESSIONELLES TEAM (2026-09-02, Davids Entscheidung, DECISION-LOG): die Hunde-Welt ist komplett verworfen — neue Namen (Wizard: George Winter, Vera Stein, Milo Berger, Nika Sommer, Otto Kessler; About: Martens/Weber/Hoffmann/Nowak/Sander/Krüger), `personal` = Arbeitsweise statt Steckbrief, Platzhalter-Foto gelöscht (Monogramme). P3 KOMPLETT GEBAUT (2026-09-02): Cross-Step-Quellen erreichen den Generator (ein listRows trug schon alle 9 Zeilen — nur nie ausgewertet; inputHash jetzt Step-übergreifend ehrlich), Vera entwirft B+B2 (Formeln §5/§5a, geschlossene Architektur-Modelle als stabile Ids, Positionierungs-Kategorie bewusst offen mit Form-Prüfung), Milo entwirft C (Werte-Kandidaten NUR mit Moment-Beleg), KONVERSATIONS-RUNDE B5b (converse-Route: Berater reagiert auf getippte Antworten, eigener Gesprächs-Eimer 40/Tag je Brand, Fragen-Reihenfolge bleibt bei der Registry, Katalog-Frage wird unterdrückt wenn der Berater sie in eigenen Worten stellt); brand-Tests 672. OFFEN: Davids P3-Durchlauf (Kontext abschließen → Vera erleben) = P3-Abnahme; b2.model zeigt rohe Id bis zur §12.3-Karten-UI (P4). GESPRÄCH-ALS-BÜHNE AUSGEFÜHRT + LIVE (2026-09-03): Umbau nach plans/BRAND-WIZARD-GESPRAECH-UMBAU.md in zwei Opus-Läufen (Layout; Eine Stimme), drei Code-Audits + Fix-Runde, Davids Zuschnitte (Tagline & Messaging, Tablet voll, Mobil-Overlay + Start im Gespräch, „+ N optional"-Subline), Live-Audit auf branding.supply mit drei Befunden — alle behoben (Hydration der Konfidenz, toSlotFacts-Zählung, Georges Abschluss-Satz; Details OPEN-ITEMS-COMPLETE). Kachel-Farbwelten je Brand GEBAUT (12 kuratierte Dreiklänge, live verifiziert). NACHT 2026-09-03 KOMPLETT (Davids „alle offenen Tasks" + zwei Live-Tests, Details OPEN-ITEMS-COMPLETE): Mobil-Drawer schmal+Backdrop, C5-reopen, george-a-6/a-7 + converse-2 (keine Slot-Ids, EINE Frage pro Zug, Blöcke unsichtbar), Autosave-Retry, Gegenfragen füllen keine Felder mehr, **-Strip, P4-Architektur-Karten, 50×2 Kurz-Labels + 9×2 Erklär-Absätze, EIN Kopf (BwSiteNav-default-Layout auf /, /team, Übersicht). Dazu Nav-Konto echt (Initialen/Logout/Gast-Login) + b2.model-Korrigieren führt auf die Karten zurück. NEU OFFEN aus der Nacht: mehrteilige Katalog-Fragen (a.facts) einzeln nacheinander = Antwort-AKKUMULATION, ändert abgenommene Frage-Texte ⇒ Davids Gate ①; Ergebnis-SEITE P5–P7 (einziger Dummy ist Iteration 2 von vor dem Bühnen-Umbau, widerspricht Spec „ohne George" ⇒ Konzept-Gate); P4-Karten-Klickpfad ohne Live-Beweis (Davids Blick genügt). MOBIL: „reicht für jetzt" (Davids Entscheidung 2026-09-03 — primär eine Desktop-Anwendung; Mobil-Feinschliff später als eigene Runde). KOMPLETT-TEST 2026-09-03/04 (Davids Auftrag; Details OPEN-ITEMS-COMPLETE): Links/404 gefixt, Google-Login LIVE + END-TO-END BEWIESEN 2026-09-04 (ein Client, zweite Redirect-URI, neues Add-secret; Davids Google-Login auf branding.supply erfolgreich), Betreiber-Dashboard montiert (admin-Label gesetzt; admin-Migrationen mit Davids Ja 2026-09-03 gefahren — changelog-Tabelle da, Schema-Parität branding 22/22 grün), step_locked-Blocker gefixt (Kapitel nach Vorgänger-Abschluss waren NIE abschliessbar), 5 Brandings live durchgespielt. KONVERSATIONS-SENKE GESCHLOSSEN + GESPRÄCHS-RUNDE 2026-09-04 (Davids Go; Details OPEN-ITEMS-COMPLETE): george-a-9 (Verlauf reist in den Entwurf, beantwortete Fragen nie erneut — Loop+Sackgasse geheilt), Bühnen-Einstieg zeigt aufs erste offene Feld, converse-3 („keine Frage mehr“ ist nicht „nichts offen“ — Davids Krume-Fund), Antwort-Chips für Entweder-oder-Fragen (george-a-10/converse-4, OPTION-Marker), Konto-Menü „Brandings“-Link. NOCH OFFEN aus dem Komplett-Test: Rückfragen zeigen auf Felder fertiger Kapitel ohne Weg; d.voiceSamples-Frage setzt nicht existierende Auswahl voraus (Davids Zuschnitt). Launch-Gates: A1-AVV, Interaktionsbilanz, Schema-/P0b-/P1d-Abnahmen. | Mittel | XL | Ja: Dummy-Korrekturen, P0 gegenlesen, Schema abnehmen | [BRAND-WIZARD-PHASE-1.md](plans/BRAND-WIZARD-PHASE-1.md) |
| 7 · BW2 | **Brand-Wizard „Branding-Atome": eine Session je Feld, Spezialist beim Schliessen, Korrektur-Regel, Schlussanalyse — GESAMTBILD FREIGEGEBEN 2026-09-04 (David), Plan geschrieben.** Sieben Pakete (§15): Session-Vertrag → Zielsätze (Davids Inhalts-Gate) → Verlauf+Nav → Schliess-Aufruf → Konflikt-Chips → Korrektur-Regel → Dokument+Prüfblick (beantwortet das Ergebnis-Seiten-Gate aus BW1). Löst aus BW1 mit: a.facts-Akkumulation (`collect`), „Rückfragen ohne Weg" (Befund-Chips). **PAKET 1 FERTIG (2026-09-04, Opus-Lauf + Fable-Prüfung):** Session-Vertrag mit allen §3/§3a-Feldern, `sessionsAffectedBy` (68 Hüllen-Zahlen = Anhang A, mit Gegenprobe), `resolveSessionStates`, `computeSourcesHash`, Invarianten (2 registriert, inert bis Paket 6 den Wert mitreicht), EIN Prompt-Bauer statt vier Tabellen — Prompts ZEICHENGLEICH (Fixture unabhängig gegen origin/main regeneriert, 42/42); 799→1013 Tests, 3 Lints + Typecheck grün. NÄCHSTES: Paket 2 = 68 Zielsätze/Qualität/Anti-Muster/Leiter/Form/Beispiele als Content-Spec §14 (Davids Gate). | Hoch | XL | Ja: 68 Zielsätze gegenlesen, Leiste/Hinweis/Ergebnis-Seite abnehmen | [BRAND-WIZARD-SESSIONS.md](plans/BRAND-WIZARD-SESSIONS.md) |

## ⏸️ Geparkt / wartet — in Arbeitsreihenfolge

Die Reihenfolge ist die, in der wir sie anfassen würden: erst was eine
Entscheidung braucht, dann die großen Brocken. **Die Aufwände sind ehrlich
gemeint** — hier steht nichts mehr, was an einem Nachmittag fertig wird; F7
ist Wochen. (F3 ist am 2026-08-11 als AH-6 in die Hauptliste gezogen.)

| # | Reihenfolge | Was (einfach erklärt) | Prio | Aufwand | Braucht David? | Wartet auf … |
| --- | --- | --- | --- | --- | --- | --- |
| F7 | 3 — Wochen | **Bezahlte Communities** — der Owner nimmt Geld von seinen Mitgliedern. **Konzept steht, alle vier Entscheidungen GEFALLEN** (2026-08-15, DECISION-LOG): Owner verkauft (Connect, volles Dashboard, direct charges) · V1 = ganze Community · Erstattung nimmt Provision mit + Zugang endet sofort · Verkauf sperrt Endzustände. [F7-PAID-COMMUNITIES-KONZEPT.md](plans/F7-PAID-COMMUNITIES-KONZEPT.md). **Schluckt D1.** Offen nur noch: Anwaltsliste (§ 9, allen voran Art. 9a) + Bau nach A2. | Mittel | XL | Anwalt (§ 9) | A2 (Stripe live) |
| F60 | 4 — Tage | **Mehrsprachige Betreiber-Seiten.** Der Owner pflegt je Sprache eine Fassung seiner Seiten (Muster Kategorie-Übersetzungen: Fassung ÜBERSCHREIBT, Adresse bleibt einsprachig) — optional mit KI-Vorschlag im Dashboard, der Mensch veröffentlicht. Bewusst KEINE Leser-Auto-Übersetzung (Rechtstexte, 200k-Body; Begründung im COMPLETE-Eintrag „KI-Übersetzung"). | Niedrig | M | Ja: 2–3 Zuschnitts-Entscheidungen bei Baubeginn | Bedarf (erste mehrsprachige Kunden-Community) |

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
(F55). **Seit 2026-08-18 sind freelancer.supply, Morgenlicht und Comments
Demo-Spielwiesen** — 8 Demo-Konten mit Rollen und Inhalte über alle Produkte,
alles über die echten Routen (Werkzeug in `~/.appwrite-secrets/freelancer-demo/`,
Protokoll in [OPEN-ITEMS-COMPLETE.md](OPEN-ITEMS-COMPLETE.md)).
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

**Die Entscheidung vom 2026-08-21**: Google-Login auf der Betreiber-Konsole JA
(S3 — Anlass ist der fehlende zweite Faktor, nicht Bequemlichkeit), auf
`pukalani.studio` **NEIN**: dort meldet sich niemand ausser David an, es gibt
keinen wiederkehrenden Anmelde-Schmerz, und jeder weitere OAuth-Client ist ein
weiteres Geheimnis, das gepflegt, rotiert und irgendwann aufgeraeumt werden
muss. Nicht erneut aufwerfen.

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
