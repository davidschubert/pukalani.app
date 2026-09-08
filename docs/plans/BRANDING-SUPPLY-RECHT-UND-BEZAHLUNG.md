# branding.supply — Rechtstexte und Bezahlweg (BS1)

Status: **ENTSCHIEDEN — Fragenrunde 2026-09-07 beantwortet, Umsetzung läuft.**
Die acht Entscheidungen stehen in **§9**; **§8 bleibt als Protokoll stehen**
(Fragen samt Empfehlungen — nur so ist nachlesbar, wovon abgewichen wurde).
Damit ist der Paketschnitt in **§7 verbindlich**: R0 läuft, alles Weitere in
der dort genannten Reihenfolge.

**Dies ist keine Rechtsberatung.** Wo unten eine juristische Einordnung steht,
ist sie als *Laien-Einschätzung* gekennzeichnet und mündet in eine FRAGE an den
Anwalt — dasselbe Vorgehen wie im Rechts-Check des Marktvergleichs
([archiv/BRAND-MARKTVERGLEICH.md](../archiv/BRAND-MARKTVERGLEICH.md) Anhang G).

---

## 0. Was das hier ist

Zwei Stränge in EINEM Vorhaben, weil sie dieselbe Vorbedingung teilen: **ohne
beide kann die Beta von branding.supply nicht für Fremde geöffnet werden.**

- **(A) Rechtstexte.** Die Site ist seit 2026-09-01 öffentlich, nimmt Konten
  auf, verschickt Mails und veröffentlicht Bewertungen fremder Marken — und hat
  weder Impressum noch Datenschutzerklärung noch AGB.
- **(B) Bezahlweg.** „Fundament frei, Ableitung bezahlt" (Davids Entscheidung
  2026-08-27) ist die Produktstrategie, aber es gibt auf branding.supply keinen
  einzigen Weg, Geld zu nehmen — und die Schranke, die den bezahlten Teil
  bewachen soll, ist im Code hart auf „offen" verdrahtet.

Sie gehören zusammen, weil der Bezahlweg die Rechtstexte VORAUSSETZT (AGB,
Widerruf, Rechnungsangaben, Stripe-Portal verlangt die URLs) und weil beide auf
denselben Termin bei Davids Anwalt zulaufen ([OPEN-ITEMS](../OPEN-ITEMS.md)
`3 · A1`) beziehungsweise auf denselben Stripe-Go-Live (`4 · A2`).

Vorbild für Aufbau und Ton: das Marktvergleichs-Dokument. Kurze Strategie mit
belegtem Ist-Stand, dann ein Konzept mit Verträgen, am Ende die Fragen.

---

# TEIL A — RECHT

## 1. Strategie A — wo wir stehen und was fehlt

### 1.1 Der Ist-Stand, am Code erhoben (2026-09-07)

| Frage | Befund | Beleg |
| --- | --- | --- |
| Gibt es Rechtsseiten? | **Nein.** `/imprint`, `/privacy`, `/terms`, `/impressum`, `/datenschutz`, `/agb` existieren als Route nicht — weder in der App noch in einem der vier Layer. | `apps/branding/app/pages/` kennt nur `index`, `about`, `team`, `beispiel/kailua-coffee`; `packages/brand/app/pages/**`, `packages/market/app/pages/**` |
| Ist der `pages`-Layer montiert? | **Nein.** | `apps/branding/site.manifest.ts` → `['themes','admin','brand','market']` |
| Was steht dann im Fuß? | Drei Wörter — **Impressum · Datenschutz · AGB — als `<span>`, ohne Link und ohne Ziel.** | `packages/brand/app/components/BwSiteFooter.vue:17-20` und `:37` |
| Wo hängt dieser Fuß? | Unter **jeder** öffentlichen Seite. | `apps/branding/app/layouts/default.vue:24` |
| AGB-Checkbox bei der Registrierung? | **Nein.** `pukalani.auth.termsUrl` ist nicht gesetzt, Core-Default `''` ⇒ `requireTerms === false` ⇒ weder Checkbox noch Link, auch nicht im Google- und im OTP-Weg. | `apps/branding/app/app.config.ts`; `packages/core/app/components/auth/RegisterForm.vue:69-71`, `:226`, `:230-234` |
| Cookie-Banner / Consent? | Nicht gesetzt, Core-Default aus — und das ist **richtig**: es läuft kein Tracking. | `packages/core/app/app.config.ts` (`consent.enabled: false`, `analytics.enabled: false`) |
| Reichweitenmessung? | **Aus.** Anders als `pukalani.studio` hat branding.supply kein Plausible. | keine `analytics`-Zeile in `apps/branding/app/app.config.ts` |
| Beta-Modus | `invite` — Zugang nur über Warteliste → Double-Opt-in → Einladungscode. | `packages/brand/shared/brandAccess.ts`, `packages/system/scripts/migrations/038-brand-flags.ts` |

**Die drei Footer-Wörter sind der unangenehmste Teil des Befundes.** Ein
fehlender Link ist eine Lücke; ein Wort, das aussieht wie ein Link und keiner
ist, ist eine Behauptung. Die Nav-Einträge daneben (About, Team) sind echte
`NuxtLink`s — der Unterschied fällt einem Besucher erst beim Klicken auf.

### 1.2 Was branding.supply verarbeitet

Erhoben aus Migrationen, Routen und den Archiv-Plänen. **Die Spalte
„Rechtsgrundlage" ist ein KANDIDAT, keine Feststellung** — sie ist die
Vorarbeit für den Anwalt, nicht sein Ergebnis.

| # | Verarbeitung | Zweck | Empfänger / Drittland | Rechtsgrundlage (Kandidat) | Speicherdauer |
| --- | --- | --- | --- | --- | --- |
| 1 | **Konto** — E-Mail, Name, Passwort-Hash bzw. Google-Kennung | Zugang zur Beta und zur Werkstatt | Appwrite self-hosted, Hetzner DE; bei „Anmelden mit Google" zusätzlich Google (US) | Art. 6 I b | bis Löschung des Kontos |
| 2 | **Sitzungen** — IP, User-Agent, Land (Appwrite-Sessions) | Anmeldung, Sitzungsliste unter `/dashboard/settings/sessions` | keiner | Art. 6 I b / f | bis Abmeldung bzw. Ablauf |
| 3 | **Wizard-Inhalte** — `brand_profiles`, `brand_steps`, `brand_messages` (Antworten, Gesprächsverlauf, Entwürfe) | das Produkt selbst | — | Art. 6 I b | bis Löschung |
| 4 | **KI-Aufrufe** — Kundentexte an ein Sprachmodell (George, Review, Brand-Check-Bewertung, Marktvergleich-Extraktion) | Entwürfe und Bewertungen erzeugen | **OpenRouter (US)** → Anbieter mit `zdr: true`, `dataCollection: 'deny'`, `allowFallbacks: false` | Art. 6 I b | beim Anbieter laut ZDR keine Speicherung; Ergebnis bei uns dauerhaft |
| 5 | **Brand-Check** — fremde Website-URL, gerechnete Werte, Befunde; **öffentliches Ranking nur mit Opt-in** | Produkt + Marketing | Abruf der fremden Website (deren Server sieht unsere IP und unseren Absender) | Art. 6 I b (eigene Marke) / Art. 6 I f (fremde) | Ergebnis-Cache 7 Tage je URL; Ranking-Eintrag bis Entfernen |
| 6 | **Marktvergleich** — Abruf fremder Websites, Rohtext, Marktprofile mit Zitaten ≤ 200 Zeichen | Vergleich der eigenen Marke gegen das Feld | fremde Server; Bot-Auskunft unter `/market-bot` | Art. 6 I f | **Rohtext ≤ 24 h** (Sweep), Profil dauerhaft |
| 7 | **Share-Links** — `brand_shares` (Token, eingefrorener Stand) | Ergebnis teilen | jeder, der den Link hat | Art. 6 I b | bis Widerruf |
| 8 | **Warteliste** — `brand_waitlist` mit Double-Opt-in | Beta-Zugang vergeben | SMTP-Anbieter | Art. 6 I a (Einwilligung) | bis Einladung oder Löschung |
| 9 | **Mailversand** — Verifizierung, Einladung, Warteliste | Betrieb | SMTP-Anbieter laut Server-`.env` (**für die Subprozessoren-Liste zu benennen**) | Art. 6 I b | Zustellprotokoll beim Anbieter |
| 10 | **Server-Protokolle** (nginx/ploi) | Betrieb, Sicherheit | Hetzner DE | Art. 6 I f | **offen** — kein logrotate; derselbe Befund wie in A1b für pukalani.app |
| 11 | **Betreiber-Ereignisse** — `brand_events` (Funnel, Trichter) | Messung | intern | Art. 6 I f | **offen — keine Frist gesetzt** |
| 12 | Reichweitenmessung | — | — | — | **findet nicht statt** |

**Was NICHT stattfindet und im Text ausdrücklich stehen sollte, weil es
Vertrauen schafft:** kein Werbenetzwerk, kein eingebetteter Drittinhalt, keine
fremden Schriften, kein Cookie-Banner (weil nichts zu fragen ist), kein
Training fremder Modelle mit Kundentexten (`zdr`/`dataCollection: 'deny'`),
keine Personendaten aus fremden Websites (Pfad-Sperrliste + `filterMarketPii`).

### 1.3 Was hier ANDERS ist als bei pukalani.studio

pukalani.studio ist seit 2026-08-12 fertig (Impressum + Datenschutz de/en, mit
ladungsfähiger Anschrift). Man kann diese Texte **nicht kopieren**, und zwar aus
sechs benennbaren Gründen:

1. **Es gibt Konten.** Die Studio-Site hat keine Besucherkonten. Hier entstehen
   Konten mit E-Mail, Sitzungen, Inhalten, Löschanspruch und Auskunftsanspruch.
2. **Kundentexte gehen an ein Sprachmodell.** Das ist die zentrale neue
   Aussage: was ein Gründer über seine Marke, sein Team und seine Kunden
   erzählt, verlässt unseren Server. Die Schutzmaßnahme (ZDR, kein Fallback)
   gehört in den Text, nicht in einen Nebensatz.
3. **Wir rufen fremde Websites ab.** Brand-Check und Marktvergleich. Dafür gibt
   es bereits eine Bot-Auskunft (`/market-bot`), robots-/TDM-Respekt und einen
   PII-Filter — alles Zusagen, die belegt werden sollten.
4. **Wir bewerten fremde Marken öffentlich.** Brand-Score, Ranking (mit
   Opt-in), Bibliothek. Das berührt § 6 UWG, Markenrecht, § 824 BGB und
   Zitatrecht — die sechs Fragen aus Anhang G und die vier aus BI1 §4.3 sind
   dieselben Fragen, nur betreffen sie hier eine Site, die es schon gibt.
5. **Die Phase ist unentgeltlich, das Ziel nicht.** Eine kostenlose Beta, aus
   der ein bezahltes Angebot wird, braucht AGB, die den Übergang beschreiben —
   sonst ist unklar, was für Bestandskonten gilt (das ist zugleich §8 Frage 6).
6. **Es ist eine eigene Marke, kein Unterordner.** Der Anbieter mag derselbe
   sein; der Impressumspflicht genügt man auf der Domain selbst, nicht per Link
   auf eine andere (dieselbe Begründung steht schon im Kopf von
   `apps/marketing/app/pages/impressum.vue`).

### 1.4 Zielbild in einem Satz

> Auf branding.supply steht unter jeder Seite ein echter Link auf Impressum,
> Datenschutz und AGB in beiden Sprachen; die Datenschutzerklärung erklärt in
> einfachen Worten, dass Markentexte an ein Sprachmodell gehen und unter
> welchen Bedingungen — und die AGB sagen, was in der Beta gilt und was danach.

### 1.5 Risiken, wenn nichts passiert

| Risiko | Warum es real ist |
| --- | --- |
| **Abmahnung wegen fehlendem Impressum** | Die Site ist öffentlich, geschäftsmäßig und deutschsprachig. Der Standardfall. |
| **Die Footer-Wörter machen es schlimmer** | Sie belegen, dass die Pflicht bekannt war. Ein leerer Fuß wäre ehrlicher. |
| **Kein Rechtsgrund für die KI-Verarbeitung dokumentiert** | Nutzer erfahren heute an keiner Stelle, dass ihre Texte einen fremden Anbieter erreichen. Das ist der Punkt, an dem ein Firmenkunde aussteigt — oder nachfragt und keine Antwort bekommt. |
| **DB1 („Discover Brands") ist blockiert** | Der Plan nennt die Rechtstexte selbst als Gate für die Öffnung an Fremde. |
| **A2 (Stripe live) ist blockiert** | Das Live-Customer-Portal verlangt AGB- und Datenschutz-URL (DECISION-LOG-Befund zur Studio-Site). |
| **Beta-Öffnung ist blockiert** | Solange `brandAdmissionMode` auf `invite` steht, ist der Kreis klein und bekannt. Jede Öffnung vergrößert den Kreis der Betroffenen. |

### 1.6 Offene Anwaltsfragen, gebündelt

Nichts davon ist neu erfunden — es ist die Zusammenführung dessen, was an drei
Stellen verstreut offen liegt, plus vier Fragen, die nur branding.supply hat.

**(a) Aus A1 / A1b, hier ERNEUT zu stellen** (die Antworten können abweichen,
weil dieses Angebot Konten, KI und Bewertungen hat):
Vertreter nach Art. 27 DSGVO · Drittland-Grundlage bei Zugriff aus den USA ·
Geltung § 5 DDG / § 18 Abs. 2 MStV · Verbraucherstreitbeilegung § 36 VSBG ·
Umsatzsteuer bei einem US-Anbieter mit DACH-Ausrichtung.

**(b) Aus Anhang G des Marktvergleichs, unverändert offen:**
fremde Markennamen im bezahlten Produkt und im Marketing · Zitate ≤ 200 Zeichen ·
TDM-Vorbehalt § 44b UrhG · § 6 UWG · DSGVO/PII beim Website-Abruf ·
Datenbank-Herstellerrecht § 87b UrhG.

**(c) Aus BI1 §4.3, für den Brand-Score schon heute einschlägig:**
Presse-/Wikipedia-Zitate · YouTube-Kommentare · **Score einer fremden Marke
ohne deren Zustimmung** · verantwortlicher Autor bei einer Wir-Stimme.
Der dritte Punkt gilt NICHT erst mit BI1: das Brand-Check-Ranking ist bereits
live (mit Opt-in des Prüfenden — aber der Prüfende ist nicht immer der
Markeninhaber).

**(d) Neu, nur für branding.supply:**

1. **Rolle bei der KI-Verarbeitung.** Kundentexte gehen über OpenRouter an
   einen Modellanbieter unter ZDR. Ist das eine Auftragsverarbeitung, für die
   ein AVV mit dem Kunden nötig ist — oder verarbeiten wir als Verantwortlicher
   zur Erfüllung unseres eigenen Vertrags? Braucht ein Firmenkunde einen AVV
   und eine Subprozessoren-Liste, bevor er das Produkt nutzen darf?
   *Laien-Einschätzung: der Kunde beauftragt hier keine Verarbeitung fremder
   Endnutzerdaten (anders als bei pukalani.app, A1b) — das spricht gegen eine
   Auftragsverarbeitung. Belastbar ist das nicht.*
2. **Öffentlicher Score fremder Marken.** Der Brand-Check bewertet jede Website,
   die jemand einträgt; das Ranking ist opt-in des Prüfenden, nicht des
   Bewerteten. Reicht die offengelegte Methodik plus Korrekturweg, oder braucht
   es eine Anhörung oder eine Beschränkung auf die eigene Marke?
3. **Beta ohne Entgelt.** Braucht eine unentgeltliche Beta AGB — und wenn ja,
   was muss darin über Verfügbarkeit, Datenverlust, Kündigung und den Übergang
   in ein bezahltes Angebot stehen?
4. **Absender-Zusagen des Crawlers.** `/market-bot` beschreibt, was unser
   Abruf tut und was er ausspart. Ist eine solche Seite eine bindende Zusage,
   und muss sie in die Datenschutzerklärung verlinkt werden?

---

## 2. Konzept A — wo die Texte leben und wie sie erreichbar werden

### 2.1 Drei Orte zur Wahl (Entscheidung: §8 Frage 1)

**Option 1 — der `pages`-Layer, wie auf pukalani.studio.** *(Empfehlung)*

Rechtstexte sind CMS-Zeilen in der Tabelle `pages`, eine Zeile je Slug ×
Sprache, bearbeitet unter `/dashboard/pages`. Alles dafür ist gebaut:

| Baustein | Ort |
| --- | --- |
| Slug-Wahrheit | `packages/pages/shared/types/page.ts:49` (`LEGAL_PAGE_SLUGS`) |
| Textvorlagen (de/en) | `packages/pages/shared/legalTemplates.ts` — mit `[AUSFÜLLEN: …]`-Markern, immer `status: 'draft'` |
| Silo-Seed | `packages/pages/scripts/seed-legal-pages.ts` (`pnpm --filter <app> seed:legal`) |
| Öffentliche Route | `packages/pages/app/pages/[slug].vue` + `server/api/pages/public/[slug].get.ts` |
| Bearbeiten | `/dashboard/pages`, Capability `pages.manage` |

*Dafür:* Ein Anwalt schickt einen korrigierten Absatz, David fügt ihn ein —
ohne Deploy. Die Vorlagen mit unübersehbaren Platzhaltern und dem harten
`draft`-Filter sind genau die Sicherung, die ein halbfertiger Rechtstext
braucht. Und der Weg ist zweimal erprobt (Pool und Silo).
*Dagegen:* ein Produkt mehr im Site-Manifest, sechs Migrationen auf der Instanz
`branding`, ein zusätzlicher Dashboard-Menüpunkt in einer Betreiber-Konsole,
die für diese Site bewusst schlank ist.
*Lücke:* für `terms`/`agb` gibt es **keine Vorlage** — nur `imprint` und
`privacy` sind in `LEGAL_TEMPLATE_SLUGS`. Die AGB entstehen also als leere
Seite; das ist kein Hindernis, aber es soll niemanden überraschen.

**Option 2 — statische Seiten im `brand`-Layer, Muster `apps/marketing`.**

`apps/marketing/app/components/LegalPage.vue` rendert Abschnitte aus i18n
(`marketing.legal.<scope>.sections.N.{title,body}`), setzt `robots: 'noindex,
follow'` solange die Texte Entwürfe sind, und die Seiten tragen per
`defineI18nRoute` deutsche Adressen (`/impressum`, `/datenschutz`, `/agb`).

*Dafür:* kein Schema, keine Migration, keine Instanz-Berührung; die Seiten sind
im Repo versioniert und im Review sichtbar. Für eine Site, die genau einen
Betreiber hat, ist ein CMS strenggenommen Überbau.
*Dagegen:* jede Korrektur des Anwalts ist ein Commit, ein Build und ein Deploy —
und zwei Sprachen im JSON gepflegt. Bei drei Runden Korrektur ist das der
teurere Weg.

**Option 3 — geteilte Textbausteine über beide Sites.**

*Dagegen, und deutlich:* Anbieter, Zwecke und Empfänger unterscheiden sich
grundlegend (§1.3). Ein gemeinsamer Text müsste beides sagen und wäre damit auf
BEIDEN Seiten teilweise falsch — auf der Studio-Site stünden KI-Anbieter und
Crawler, auf branding.supply Wissen-Artikel und Terminbuchung. Der einzige
sinnvoll geteilte Teil ist der ANBIETER-Block des Impressums, und der ist drei
Zeilen lang. Aufgeführt, damit die Ablehnung dokumentiert ist.

### 2.2 Was in beiden Optionen gleich gebaut wird

1. **Der Fuß bekommt echte Links.** `BwSiteFooter.vue` rendert heute drei
   `<span>`. Muster für den Umbau ist `apps/portfolio/app/components/SiteFooter.vue`:
   drei Zustände statt zwei, mit einem harten Rückfall —

   > „Ein Link, der im Ausfall auf eine 404 zeigt, ist besser als kein
   > Impressums-Link."

   Das gilt hier genauso, unabhängig von der gewählten Option.
2. **Zweisprachigkeit nach Monorepo-Konvention.** EN ohne Präfix, DE unter
   `/de/*`; interne Links immer über `localePath()`. Bei Option 2 zusätzlich
   `defineI18nRoute` für die deutschen Adressen.
3. **`noindex`, solange Entwurf** — und der Entwurfs-Hinweis als ERSTER Block,
   nicht als Kleingedrucktes (Muster `LegalPage.vue`). Bei Option 1 erledigt
   das der `draft`-Filter: die Seite ist dann gar nicht öffentlich.
4. **`pukalani.auth.termsUrl` in `apps/branding/app/app.config.ts`** — eine
   Zeile, die Checkbox und AGB-Link in Register-, OTP- und Google-Weg
   gleichzeitig scharfstellt. Reihenfolge: **erst Text, dann Schalter** (§8
   Frage 7).
5. **Kein Consent-Banner.** Es gibt nichts einzuwilligen; ein Banner ohne
   Gegenstand ist eine Lüge über die eigene Datenverarbeitung. Sollte
   branding.supply später Plausible bekommen, bleibt es cookielos — genau wie
   auf pukalani.studio, wo aus demselben Grund kein Banner steht.
6. **Die Bot-Auskunft und eine Methodik-Seite gehören zur Rechtsauskunft.**
   `/market-bot` existiert (Layer `market`). Eine **Methodik-Seite** für den
   Brand-Score ist in BI1 §4.2 vorgesehen, aber nicht gebaut — sie ist die
   Antwort auf „warum dürft ihr uns bewerten?" und sollte aus der
   Datenschutzerklärung UND von jedem Score aus verlinkt sein.
7. **Eine Subprozessoren-Liste** als eigener Abschnitt der
   Datenschutzerklärung: nach dieser Erhebung mindestens Hetzner, ploi.io,
   OpenRouter (+ die tatsächlich zugelassenen Modellanbieter), der
   SMTP-Anbieter und — nur beim Google-Login — Google.

### 2.3 Reihenfolge, die nicht verhandelbar ist

Bei Option 1 gilt die Regel aus dem Portfolio-Relaunch: **Migration VOR
Code-Deploy.** Sonst zeigt der Footer auf eine Route, deren Tabelle es nicht
gibt. Danach `seed:legal` gegen die Instanz `branding`, dann füllen, dann
veröffentlichen.

---

# TEIL B — BEZAHLWEG

## 3. Strategie B — was frei ist, was bezahlt, und womit

### 3.1 Der Ist-Stand, am Code erhoben

| Frage | Befund |
| --- | --- |
| Gibt es einen Bezahlweg auf branding.supply? | **Nein.** `billing` steht weder im Site-Manifest noch in `extends`; keine `billing_*`-Tabellen, keine Stripe-Keys, kein Webhook. |
| Was bewacht die Schranke heute? | Nichts. `resolveMarketPaywall({ betaAccess })` hat genau eine Eingabe, und der einzige Produktiv-Aufrufer übergibt sie **hart als `true`** (`packages/market/server/api/market/profiles/[id]/index.get.ts:74`) — mit der ehrlichen Begründung, dass jeder, der dort ankommt, ohnehin durch das Beta-Gate ging. |
| Steht die Zuteilung je Branding? | **Nein — und die Datei sagt es selbst:** „DIE ZUTEILUNG JE BRANDING IST NICHT GEBAUT, UND DAS STEHT HIER" (`packages/market/shared/marketPaywall.ts`). |
| Gibt es ein Feld dafür? | Nein. `brand_profiles` hat kein `plan`, kein `entitlement`, kein `paidAt`. Der einzige Freischalt-Speicher ist `brand_access` — **binär und je KONTO**, nicht je Branding. |
| Taugt das Entitlement-Dokument? | Nur bedingt: `evaluateEntitlement` entscheidet je **Produkt-Key und je SITE** (`siteProjectId`), nicht je Kunde und nicht je Branding. Für „dieses eine Branding ist bezahlt" ist es die falsche Granularität. Für branding.supply ist zudem `entitlementsUrl` leer ⇒ Enforcement neutral AN. |
| Wohin zeigt der CTA an der Schranke? | Auf `/erstgespraech` — eine Route, die es **nur in `apps/portfolio`** gibt. Auf branding.supply antwortet sie **404**. `completionCta.to` ist in `apps/branding` nicht überschrieben. |
| Preis-Anker heute | `market.paywall.price` = „Preis im Erstgespräch", `…beta` = „Beta-Konten haben ihn freigeschaltet." |
| Stripe-Preise im Monorepo | Vier `lookup_keys`, alle `workspace_*` (Personal 29 €, Pro 149 €, jährlich −25 %) — **nichts Branding-Bezogenes.** `tax_behavior: 'inclusive'` ist am Price unveränderlich; `automatic_tax` und Pflicht-Rechnungsadresse sind in allen Checkout-Pfaden gesetzt; `tax_id_collection` (USt-ID/B2B) ist bewusst nicht gebaut. |

**Der 404 ist der teuerste Einzelbefund dieses Dokuments.** Der Weg vom Produkt
zum Geld besteht heute aus genau einem Klick, und dieser Klick führt ins Leere —
inklusive `trackFunnel('studio_cta_erstgespraech')`, das die Absicht sauber
misst und dann eine Fehlerseite zeigt.

### 3.2 Was die Entscheidungen bereits festlegen

- **2026-08-27 (David):** „Frei bauen, bezahlt anwenden." Das Fundament ist
  frei und Trichter; bezahlt wird die ABLEITUNG. Die Schranke soll von Tag eins
  SICHTBAR sein, damit „kostenlos" nicht zur Markterwartung wird.
- **MV1 §1.9:** Der Marktvergleich ist Anwendung, also bezahlt; die Schranke ist
  „eine Zuteilung — sie entscheidet je Branding und nie je Deployment".
- **2026-09-07, G4 (David):** „An der Schranke steht **kein Preis**: Brand
  Design ist Studio-Angebot, das Erstgespräch der Weg — Enterprise = Studio,
  solange Produkt 02 keine Selbstbedienung ist."
- **BD1 §1.10 d (David, 2026-09-07):** „Studio-begleitet, Freischaltung je
  Marke, kein Preis" — **kein Stripe im `brand`-Layer** in der ersten Fassung.

Damit ist die Richtung für Phase 1 vorgezeichnet: **der Weg zum Geld ist ein
Gespräch, nicht ein Kaufknopf.** Was fehlt, ist nicht die Entscheidung, sondern
die Mechanik dahinter — die Zuteilung und ein Gesprächs-Einstieg, der existiert.

### 3.3 Wie der Markt abrechnet (Recherche, Quellen im Anhang)

| Anbieter | Modell | Preis | Passt zu „frei bauen, bezahlt anwenden"? |
| --- | --- | --- | --- |
| **Looka** | hybrid: Logo einmalig, Brand Kit als Jahres-Abo | Logo 20 $ / 65 $ einmalig; Brand Kit 96 $/Jahr, mit Web 129 $/Jahr | **am nächsten dran.** Der Kern ist einmalig je Marke, das Weiterarbeiten ist Abo. |
| **Tailor Brands** | reines Abo, kein Einmalkauf | Lite frei · Essential 199 $/Jahr · Elite 249 $/Jahr | nein — bindet an eine Laufzeit, die ein Branding-Projekt nicht hat |
| **Brandmark** | einmalig je Logo-Paket | einmalig | ja, aber ohne Beratungsanteil |
| **Frontify / Corebook°** | Abo je Sitz, Demo/Editionen | auf Anfrage | nein — sie verwalten, was andere entschieden haben |
| **IdeaProof** | Credits je Lauf (Strategie 50, Competitor 70) | Credits | passt zum Marktvergleich, dessen Läufe echtes Geld kosten |
| **Agentur** | Erstgespräch → Angebot → Festpreis/Retainer | individuell | **das ist der G4-Weg**, und der einzige, der Beratung mitverkauft |

**Drei Lehren daraus:**

1. **Einmalig je Marke ist im Markt etabliert** (Looka-Logo, Brandmark). Ein
   Branding ist ein Projekt mit Anfang und Ende — ein Abo darauf erklärt sich
   schlecht, außer man verkauft das PFLEGEN mit (Looka Brand Kit, Frontify).
2. **Der Zuschnitt „Basis inklusive, Vergleich zusätzlich" existiert nebenan**
   (IdeaProof: 50 vs. 70 Credits) — als flacher Zusatz ohne Beleg. Das
   bestätigt die Strategie und zeigt die Unterscheidung: Tiefe und Beleg.
3. **Niemand in dieser Liste verkauft Beratung.** Genau dort liegt der Grund
   für G4: solange die Ableitung Designer-Arbeit einschließt, ist ein
   Kaufknopf eine falsche Zusage.

### 3.4 Vier Modelle für branding.supply

| # | Modell | Was es verlangt | Was es bringt |
| --- | --- | --- | --- |
| 1 | **Erstgespräch + Angebot** (G4, heute entschieden) | eine Gesprächsseite, eine Zuteilung je Branding, Rechnung von Hand | kein Stripe, kein Widerruf, keine Preisangabenpflicht im Produkt; lernt am Kunden |
| 2 | **Einmalpreis je Branding** (Stripe Checkout) | A2 live · eigener Preis-Katalog · AGB + Widerruf + Rechnungsangaben · Zuteilung je Branding | skaliert; die Schranke wird ein Knopf statt eines Formulars |
| 3 | **Abo je Konto** | wie 2, plus Kündigungs- und Zahlungsverzugs-Logik | planbarer Umsatz; passt schlecht zu einem Projekt mit Ende |
| 4 | **Credits / Läufe** | wie 2, plus Guthabenkonto und Verbrauchsanzeige | bildet die echten Kosten je Lauf ab; ist die komplexeste Abrechnung und erklärt sich am schlechtesten |

**Alle vier setzen dieselbe fehlende Mechanik voraus: die Zuteilung je
Branding.** Sie ist deshalb Paket Z1 und nicht optional — sie ist auch bei
Modell 1 nötig, weil sonst „freigeschaltet" bedeutet „hat ein Beta-Konto".

### 3.5 Steuer und Rechnung — was zu klären ist

- Der Verantwortliche sitzt in den USA und verkauft digital an Kunden in DACH.
  Die deutsche **Kleinunternehmerregelung** und das **OSS-Verfahren** setzen
  eine Ansässigkeit bzw. Registrierung in der EU voraus; sie sind vermutlich
  nicht der richtige Rahmen. *Laien-Einschätzung — genau das ist A1-Frage 5,
  und sie gilt hier erneut.*
- Im Code ist die Weichenstellung bereits gefallen und **unveränderlich**:
  `tax_behavior: 'inclusive'` an jedem Price. Ein Preis für branding.supply
  wird also brutto gedacht.
- **`tax_id_collection` (USt-ID, B2B) ist nicht gebaut.** Für ein Angebot, das
  sich überwiegend an Unternehmen richtet, ist das die erste Frage, sobald
  Modell 2–4 gewählt wird.
- **Verbraucher oder Unternehmer?** Wenn auch Verbraucher kaufen können:
  Widerrufsrecht, Button-Lösung, Preisangaben — im Code und in den Texten
  bisher nirgends behandelt (derselbe offene Punkt wie A1b Frage 2).

---

## 4. Konzept B — ein Weg für Phase 1

**Empfohlener Zuschnitt: Modell 1, mit drei gebauten Teilen und keinem Stripe.**

> **Teilweise überholt durch §9 (2026-09-07).** David hat **Modell 2** gewählt
> (Einmalpreis je Branding über Stripe Checkout) und die Freischaltung als
> **Feld an `brand_profiles`** statt als eigene Tabelle. Es gilt weiter: **(a)**
> der Gesprächs-Einstieg — er ist jetzt Paket **Z0**. Ersetzt sind **(b)**
> `brand_entitlements` und **(c)** „der Preis bleibt Text" für die
> Selbstbedienungs-Ableitung; für Studio-Leistungen (Brand Design, G4) bleibt
> „Preis im Erstgespräch" unverändert. Der Rest steht hier als Begründungs-
> Protokoll.

### 4.1 Die drei Teile

**(a) Ein Gesprächs-Einstieg, der existiert.** Heute 404. Drei Wege in §8
Frage 5; empfohlen ist eine **eigene, schlanke Seite `/erstgespraech` im
`brand`-Layer**:

- Felder: Name · E-Mail · welches Branding (vorbelegt, wenn man aus der
  Werkstatt kommt) · Anliegen (Freitext) · optional Telefon.
- Drei Bremsen wie beim Studio-Wizard: Rate-Limit-Bucket, Honeypot, Zod mit
  engen Längen (`apps/portfolio/server/api/intro-call.post.ts` ist die Vorlage).
- **Zwei entkoppelte Zustellwege** (dieselbe Regel wie dort, Davids
  Entscheidung 2026-08-21): Mail an David UND eine Zeile in einer neuen
  Tabelle `brand_intro_requests` (`permissions: []`, server-only, wie alle
  `brand_*`-Tabellen). Erfolg = mindestens einer.
- Sichtbar unter `/dashboard/…` für den Betreiber, damit keine Anfrage nur in
  einem Postfach lebt.
- Der Wizard von pukalani.studio wird **nicht** kopiert und **nicht** verschoben:
  er stellt neun Fragen für ein Website-Projekt, hier geht es um eine Marke.

**(b) Die Zuteilung je Branding.** Neue Tabelle `brand_entitlements` statt
eines Feldes auf `brand_profiles` — aus demselben Grund, aus dem `brand_access`
eine eigene Tabelle ist: eine Freischaltung hat eine Herkunft, ein Datum, einen
Vermerk und einen möglichen Entzug, und das gehört in Zeilen, nicht in eine
Spalte.

```
brand_entitlements
  profileId    string  (indiziert)
  productKey   string  ('market' | 'design' | …)
  grantedVia   string  ('operator' | 'beta' | später: 'purchase')
  grantedBy    string  (userId des Betreibers)
  note         string  (warum — für die Betreiber-Sicht)
  grantedAt    datetime
  revokedAt    datetime | null
  uq: (profileId, productKey)
```

Die pure Regel bleibt, wo sie ist: `resolveMarketPaywall` bekommt eine **zweite
Eingabe** neben `betaAccess` — genau so, wie es die Datei selbst vorschreibt
(„Wer sie baut, erweitert die EINGABE dieser Funktion und nicht die
Oberfläche"). Die Seite fragt schon heute nach `unlocked`, nicht nach „Beta";
an der UI ändert sich nichts.

Der **Betreiber-Schalter** hängt an der bestehenden Brandings-Liste im
Dashboard (Muster: die Warteliste unter `/dashboard/waitlist`, Capability
`users.manage`, `dashboardScope: 'operator'`). Ein Häkchen je Produkt, mit
Pflicht-Vermerk — der Vermerk ist die Verbindung zwischen Angebot, Rechnung und
Freischaltung, solange es keine Zahlung im System gibt.

**(c) Der Preis-Anker bleibt Text.** „Preis im Erstgespräch" ist nach G4 die
richtige Aussage, solange die Ableitung Beratung enthält. Der einzige Umbau
dort: der Knopf führt jetzt irgendwohin.

### 4.2 Was bewusst NICHT gebaut wird

Kein `billing` im Site-Manifest, kein Stripe-Preis, kein Checkout, kein
Widerrufs-Prozess, kein Guthabenkonto. Alles davon ist Paket Z2 und wartet auf
zwei Dinge, die nicht im Code liegen: **A2 (Stripe live)** und **ein Produkt,
das ohne Designer trägt.**

> **Überholt durch §9 Frage 4.** Genau das wird gebaut — als Paket **Z1**, mit
> denselben zwei Vorbedingungen als Gate. Guthabenkonto und Abo bleiben
> abgelehnt.

### 4.3 Messung

Drei Ereignisse reichen, alle über den bestehenden `trackFunnel`/`brand_events`-Weg:
`intro.viewed` (Seite gesehen) · `intro.submitted` (abgeschickt) ·
`entitlement.granted` (Betreiber schaltet frei). Die interessante Zahl ist der
Abstand zwischen den letzten beiden — er ist die Verkaufsdauer.

---

## 5. Abhängigkeiten

| Wovon | Was hängt daran |
| --- | --- |
| **Anwaltstermin (A1)** | ALLES in Teil A. Die fünf A1-Fragen gelten hier erneut, dazu (b)–(d) aus §1.6. |
| **A2 — Stripe live** | jeder Bezahlweg außer Modell 1. A2 hängt seinerseits an A1 (Portal verlangt AGB-/Datenschutz-URL). |
| **BF1-Schranke (G4)** | „kein Preis an der Schranke" ist entschieden und live; dieses Dokument ändert daran nichts, es baut die Mechanik dahinter. |
| **MV1-Schranke** | `resolveMarketPaywall` ist die Stelle, an der die Zuteilung ankommt. |
| **DB1 „Discover Brands"** | der Plan nennt A1 selbst als Gate für die Öffnung an Fremde. |
| **BI1** | vier weitere Anwaltsfragen (§4.3) — sie gehören in denselben Termin, auch wenn BI1 selbst wartet. |
| **BD1 (Brand Design)** | erste bezahlte Ableitung; braucht dieselbe Zuteilung je Branding wie `market`. |

---

## 6. Nicht-Ziele

- **Keine Rechtsberatung.** Dieses Dokument bereitet Fragen vor und liefert das
  Faktenblatt; die Texte schreibt ein Anwalt oder David.
- **Kein AVV/DPA für branding.supply-Kunden in Phase 1** — ob einer nötig ist,
  ist §1.6 (d) Frage 1. (Für pukalani.app ist er ein eigener offener Punkt.)
- **Kein Consent-Banner** — es läuft kein Tracking.
- ~~**Kein Stripe, kein Widerrufs-/Rückerstattungsprozess**, solange es keinen
  Selbstbedienungs-Kauf gibt.~~ **Überholt durch §9 Frage 4** — der
  Selbstbedienungs-Kauf ist entschieden; beides gehört zu Paket Z1.
- **Keine Rechtstexte auf Vorrat für andere Sites.** pukalani.app bleibt A1b.
- **Keine dritte Sprache.** de + en, wie überall.
- **Keine Änderung an der G4-Entscheidung.** Der Preis bleibt im Gespräch.

---

## 7. Pakete (VERBINDLICH — Paketschnitt nach der Entscheidungsrunde 2026-09-07)

Die Reihenfolge ist Entscheidung §9 Frage 8: **Recht zuerst, Stripe direkt
danach.** Zwei Stränge — `R*` ist Recht, `Z*` ist Bezahlweg — und sie laufen
NICHT parallel: `Z1` fängt erst an, wenn `R3` durch ist. `R0` ist die Ausnahme,
weil es nur einen kaputten Knopf repariert.

**Die Namen weichen von der alten Skizze ab.** Was dort `Z1` hiess, ist jetzt
auf `Z0` (Erstgespräch) und `Z1` (Stripe) verteilt; das alte `Z2` ist das
heutige `Z1`. Wer ältere Notizen liest: es gilt diese Tabelle.

| Paket | Inhalt | Gate | Braucht David? |
| --- | --- | --- | --- |
| **R0 — Sofort** *(läuft)* | Der 404 verschwindet: Wizard-Ende (`completionCta`) und die Marktvergleich-Schranke zeigen auf die **Studio-Erstgespräch-Seite** mit Herkunft `?source=branding-supply`. Die drei Fußzeilen-Wörter ohne Ziel werden **ausgeblendet**, bis es Seiten gibt (Links kommen in R1). | keins | Nein |
| **R1 — Technik** | `pages` in `apps/branding` montieren (`site.manifest.ts` + `extends`), Migrationen auf der Instanz `branding`, `seed:legal` · die drei Seiten als **Entwurf** mit Hinweis „Entwurf, in anwaltlicher Prüfung" als ERSTEM Block und `noindex` · Fuß bekommt echte Links mit hartem Rückfall · `pukalani.auth.termsUrl` gesetzt, Hinweis neben dem Häkchen · **AGB-Fassung am Konto speichern** (s. Befund unten) | **Davids Ja zur Prod-Migration auf `branding`**; Migration **vor** Code-Deploy (§2.3) | Ja — nur die Migrations-Freigabe |
| **R2 — Inhalt** | Davids Generator-Texte für Impressum, Datenschutz, AGB · dazu **meine drei Abschnitte**, die kein Generator kennt: KI-Verarbeitung von Kundentexten (OpenRouter/ZDR) · Abruf fremder Websites samt `/market-bot` und TDM-Vorbehalt · öffentliche Bewertung fremder Marken mit Korrekturweg · **Faktenblatt** aus §1.2 + §1.6 · Subprozessoren-Liste · Methodik-Seite für den Brand-Score · alles de + en; die drei Abschnitte sind für den Anwalt als **Prüfpunkte markiert** | David liefert die Generator-Texte; **David liest gegen** | Ja |
| **R3 — Anwalt** | EIN Termin, **drei Blöcke**: (1) Studio-Rest aus A1 · (2) branding-Texte mit den drei markierten Prüfpunkten · (3) die Anhang-G/BI1-Fragen aus §1.6 (b)(c)(d). Danach **Fassung 2** einsetzen, Art.-27- und § 36-VSBG-Abschnitte füllen (bis dahin als benannte leere Plätze vorgebaut), **Entwurfs-Hinweis weg, `noindex` weg**. Beweis: sechs Routen 200 in beiden Sprachen · Fuß verlinkt · Häkchen in allen drei Anmeldewegen, mit Gegenprobe (`termsUrl` entfernen ⇒ rot) | **Anwaltstermin** | Ja — Termin und Abnahme |
| **Z0 — Erstgespräch-Seite** | `/erstgespraech` im `brand`-Layer: fünf Felder (Name · E-Mail · welches Branding, vorbelegt · Anliegen · optional Telefon) · **zwei entkoppelte Zustellwege** (Mail an David UND Zeile in `brand_intro_requests`, Erfolg = mindestens einer) · drei Bremsen (Rate-Limit-Bucket, Honeypot, enge Zod-Längen) · Betreiber-Sicht im Dashboard · Ereignisse `intro.viewed` / `intro.submitted`. **Ersetzt die R0-Weiterleitung** | R1 durch (dieselbe Migrations-Freigabe); Migration vor Deploy | Nein (ausser Migrations-Freigabe) |
| **Z1 — Stripe** | `billing` ins Manifest · **eigener Preis-Katalog für branding.supply** (NICHT die Community-Preise) · Checkout **je Branding** an der Schranke · Webhook schreibt das **Freischalt-Feld an `brand_profiles`** (Migration) · der **Betreiber-Schalter im Dashboard bleibt** für Handfälle · `automatic_tax` wie bei den Communities, Rechnung und Portal · AGB tragen die **Widerrufsbelehrung für digitale Inhalte** (§ 356 Abs. 5 BGB: Verzicht beim Start der Ausführung) | **A2 live** (Bank, Steuer, Live-Key, Portal) **UND** R3 durch; ausserdem Name + Betrag des Kaufgegenstands (offen, §9) | Ja — A2, Name und Preis |
| **Z2 — Beta-Regel** | „**Beta-Konten dauerhaft frei**" im Code — je **KONTO** (`brand_access` / Beta-Zulassung), nicht als unbegrenzte Branding-Zahl · als benannter Abschnitt „Beta-Konten" in den AGB · Widerruf je Konto durch den Betreiber bei Missbrauch · die bestehenden Eimer (3 Läufe/Tag je Branding, Instanz-Deckel) bleiben die Kostenbremse | R2 (AGB-Abschnitt) + Z1 (die Zuteilung ist das Gegenstück, gegen das die Ausnahme greift) | Nein |

**Ein Befund, der R1 grösser macht als eine Konfigzeile.** Der Core **speichert
die AGB-Zustimmung heute nicht**. `pukalani.auth.termsUrl` schaltet nur Häkchen
und Link frei; das Feld `terms` ist ausdrücklich ein „reiner UI-Belang"
(`packages/core/schemas/auth.ts:53`, Kommentar im Code) und erreicht weder die
Route noch das Konto — es gibt weder `termsAcceptedAt` noch `termsVersion`,
nirgends. Weil Frage 7 ein Häkchen auf einen **Entwurf** setzt, ist die
Fassungsnummer am Konto keine Kür, sondern der Grund, warum das Häkchen später
noch etwas wert ist: nur so lässt sich sagen, WELCHEM Text jemand zugestimmt
hat. Gehört deshalb in R1 und nicht in R3.

---

## 8. Entscheidungsfragen für David

Acht Fragen. **Die erste Option ist jeweils die Empfehlung.**

### Frage 1 — Wo leben die Rechtstexte auf branding.supply?

- **A (Empfehlung) — `pages`-Layer, wie auf pukalani.studio.** Texte sind
  CMS-Zeilen, editierbar unter `/dashboard/pages`; Vorlagen, Seed, öffentliche
  Route und Footer-Muster sind gebaut und zweimal erprobt. *Preis:* ein Produkt
  mehr im Manifest, sechs Migrationen auf der Instanz `branding`, ein
  Menüpunkt. *Gewinn:* jede Anwaltskorrektur ist eine Texteingabe, kein Deploy.
- **B — Statische Seiten im `brand`-Layer** (Muster `apps/marketing`,
  `LegalPage.vue` + i18n). Kein Schema, keine Instanz-Berührung, im Review
  sichtbar. *Preis:* jede Korrektur ist Commit + Build + Deploy, zweisprachig
  im JSON gepflegt.
- **C — Geteilte Bausteine über beide Sites.** Klingt sparsam, ist es nicht:
  die Verarbeitungen unterscheiden sich grundlegend, ein gemeinsamer Text wäre
  auf beiden Seiten teilweise falsch. Aufgeführt, damit die Ablehnung
  dokumentiert ist.

### Frage 2 — Wer schreibt die Texte?

- **A (Empfehlung) — Anwalt schreibt Datenschutz und AGB, David das
  Impressum, ich liefere das Faktenblatt und setze ein.** Das Angebot hat drei
  Dinge, die kein Standardtext kennt: KI-Verarbeitung von Kundentexten, Abruf
  fremder Websites, öffentliche Bewertung fremder Marken.
- **B — Generator (eRecht24 o. Ä.) + Anwaltsprüfung.** Schneller und billiger
  im ersten Schritt. *Preis:* Generatoren kennen genau die drei Punkte oben
  nicht; der Prüfaufwand landet trotzdem beim Anwalt, dann aber an einem Text,
  der Vollständigkeit suggeriert.
- **C — Selbst schreiben nach dem Studio-Muster („nur Belegbares"), danach
  prüfen lassen.** Hat am 2026-08-12 gut funktioniert. *Preis:* dort gab es
  keine Konten, keine KI und keine Bewertungen Dritter.

### Frage 3 — Die fünf ungeklärten A1-Punkte (Art. 27 · Drittland · § 5 DDG/§ 18 MStV · § 36 VSBG · Umsatzsteuer): für branding.supply mitfragen oder die Studio-Antworten übernehmen?

- **A (Empfehlung) — Als eigener Block im selben Termin mitfragen.** Die
  Antworten können abweichen: hier gibt es Konten, KI-Verarbeitung und
  Bewertungen Dritter. Ein Termin, drei Blöcke (Studio · Plattform ·
  branding.supply) ist billiger als drei Termine.
- **B — Studio-Antworten 1:1 übernehmen.** Spart Zeit und Geld. *Preis:* das
  Risiko liegt genau dort, wo dieses Angebot anders ist.
- **C — Nur Art. 27 und Umsatzsteuer mitfragen, den Rest übernehmen.**
  Mittelweg; die beiden mit dem größten Geldrisiko werden neu bewertet.

*Zusatz zur selben Frage, unabhängig von A/B/C:* Für **Art. 27** und **§ 36
VSBG** empfehle ich, die Texte so zu bauen, dass beide Abschnitte als benannte,
leere Plätze existieren — dann ist die Antwort später ein eingesetzter Satz und
kein Umbau. Einen Vertreter jetzt schon zu beauftragen (Dienstleister, grob
200–400 €/Jahr) nimmt das Risiko sofort, kostet aber möglicherweise für nichts.

### Frage 4 — Bezahlmodell für Phase 1

- **A (Empfehlung) — Erstgespräch + Angebot, Freischaltung je Branding als
  Betreiber-Schalter, Rechnung von Hand.** Genau die G4- und BD1-Entscheidung,
  nur mit gebauter Mechanik. Kein Stripe, kein Widerruf, keine
  Preisangabenpflicht — und wir lernen am ersten zahlenden Kunden, was das
  Produkt wirklich wert ist.
- **B — Einmalpreis je Branding über Stripe Checkout.** Skaliert, macht die
  Schranke zu einem Knopf. *Preis:* braucht A2 live, einen eigenen
  Preis-Katalog, AGB mit Widerruf, Rechnungsangaben — und ein Produkt, das ohne
  Designer trägt.
- **C — Abo je Konto.** Planbarer Umsatz. *Preis:* ein Branding ist ein Projekt
  mit Ende; ein Abo darauf muss das Pflegen mitverkaufen, das es noch nicht
  gibt.
- **D — Credits je Lauf** (Muster IdeaProof). Bildet die echten KI-Kosten ab.
  *Preis:* die komplizierteste Abrechnung und die schwerste Erklärung.

### Frage 5 — Erstgespräch auf branding.supply: eigene Seite oder Weiterleitung?

*(Egal wie: der heutige 404 muss weg.)*

- **A (Empfehlung) — Eigene, schlanke Seite `/erstgespraech` im `brand`-Layer**
  (fünf Felder, Mail + Tabelle, drei Bremsen). Der Besucher bleibt in der
  Marke, das Formular kennt das Branding, aus dem er kommt. *Preis:* eine
  Route, eine Tabelle, ein Formular — plus eine Migration.
- **B — Sofortlösung: `completionCta.to` auf die absolute Studio-URL setzen.**
  Eine Zeile in `apps/branding/app/app.config.ts`, heute machbar. *Preis:*
  Markenbruch mitten im Trichter (der Kunde landet auf einer anderen Marke) und
  ein cross-domain-Sprung, den die Messung als neue Sitzung zählt — der offene
  Punkt D4 aus dem Infra-Plan.
- **C — Den Portfolio-Wizard in einen Layer heben und auf beiden Sites
  betreiben.** Sauberste Wiederverwendung. *Preis:* ein Umbau an einer
  laufenden Conversion-Strecke, und der Wizard stellt neun Fragen zu einem
  Website-Projekt — hier geht es um eine Marke.

*(A und B schließen sich nicht aus: B ist heute Abend machbar und hält, bis A
gebaut ist.)*

### Frage 6 — Beta-Konten nach der Öffnung: bleibt der Marktvergleich frei?

- **A (Empfehlung) — Bestandsschutz mit Frist.** Heutige Beta-Konten behalten
  ihn bis Beta-Ende plus einer genannten Frist (Vorschlag: acht Wochen), danach
  gilt die Zuteilung. Ehrlich, endlich, und niemand verliert etwas über Nacht.
  Muss in die AGB.
- **B — Dauerhaft frei.** Dankbare erste Kunden. *Preis:* jede spätere
  Zuteilung wirkt gegenüber Neukunden willkürlich, und die Kosten je Lauf
  laufen unbegrenzt weiter.
- **C — Sofort umstellen, sobald die Zuteilung steht.** Sauberste Grenze.
  *Preis:* entwertet die Beta-Zusage bei genau den Leuten, die das Produkt
  bisher getestet haben.

### Frage 7 — AGB-Checkbox bei der Registrierung: jetzt oder mit den Texten?

- **A (Empfehlung) — Mit den Texten.** `termsUrl` ist eine Zeile, aber ein
  Häkchen auf einen Entwurf ist schlechter als kein Häkchen: es dokumentiert
  eine Zustimmung zu etwas Unfertigem. Reihenfolge: Text → Veröffentlichung →
  Schalter (Paket R3).
- **B — Sofort mit Entwurf, sichtbarem Entwurfs-Hinweis und `noindex`**
  (Muster `apps/marketing`). Zeigt Absicht und schließt die sichtbare Lücke.
  *Preis:* siehe oben.
- **C — Weiter ohne.** Nichts zu tun. *Preis:* die Beta nimmt schon heute
  Konten auf, und der Fuß behauptet bereits, es gäbe AGB.

### Frage 8 — Reihenfolge zu A2 (Stripe live)

- **A (Empfehlung) — Recht zuerst, Bezahlweg danach.** A1 ist ohnehin
  Vorbedingung für A2 (das Live-Portal verlangt die URLs) UND für die
  Beta-Öffnung; Modell 1 aus Frage 4 braucht Stripe gar nicht. Ein Strang, eine
  Entscheidung nach der anderen.
- **B — Parallel.** Schneller, wenn beim Anwalt ohnehin gewartet wird. *Preis:*
  zwei offene Entscheidungsstränge gleichzeitig, beide mit David als Engpass.
- **C — Bezahlweg zuerst.** Nur sinnvoll, wenn ein zahlender Kunde konkret
  wartet — dann aber über Modell 1 (Rechnung von Hand), was A2 nicht braucht.

---

## 9. Entscheidungen (David, 2026-09-07)

Alle acht Fragen aus §8 sind beantwortet. **§8 bleibt unverändert stehen** —
ohne die Empfehlungen wäre nicht mehr nachvollziehbar, wovon abgewichen wurde.
**Vier Entscheidungen weichen von der Empfehlung ab** (2, 4, 6, 7); jede trägt
eine Leitplanke, die den Preis der Abweichung bezahlt.

| # | Frage | Entscheidung | Empfehlung war | Leitplanke |
| --- | --- | --- | --- | --- |
| 1 | Ort der Rechtstexte | **`pages`-Layer, wie auf pukalani.studio** | A (dieselbe) | Migration auf `branding` **vor** dem Code-Deploy (§2.3); die AGB haben keine Vorlage in `LEGAL_TEMPLATE_SLUGS` und entstehen als leere Seite |
| 2 | Wer schreibt die Texte | **Generator + Anwaltsprüfung.** David bedient den Generator selbst (welchen, ist seine Wahl) und liefert die Texte | A — „Anwalt schreibt Datenschutz und AGB" | Der Generator-Text ist ein **Entwurf**. Die drei Dinge, die kein Generator kennt, werden aus dem Faktenblatt (§1.2) als **eigene Abschnitte** geschrieben — KI-Verarbeitung von Kundentexten über OpenRouter/ZDR · Abruf fremder Websites inkl. Bot-Seite und TDM · öffentliche Bewertung fremder Marken mit Korrekturweg — und dem Anwalt **ausdrücklich als Prüfpunkte markiert**. Bis zur Prüfung tragen alle Seiten „Entwurf, in anwaltlicher Prüfung" + `noindex` |
| 3 | Die fünf ungeklärten A1-Punkte | **Im selben Termin als eigener Block mitfragen** | A (dieselbe) | **Art. 27** und **§ 36 VSBG** werden als *benannte leere Abschnitte* vorgebaut — die Antwort ist dann ein eingesetzter Satz und kein Umbau |
| 4 | Bezahlmodell Phase 1 | **Einmalpreis je Branding über Stripe Checkout** | A — „Erstgespräch + Angebot, Freischaltung von Hand" | Braucht **A2 live** · **eigener Preis-Katalog für branding.supply**, nicht die Community-Preise · AGB mit **Widerrufsbelehrung für digitale Inhalte** (§ 356 Abs. 5 BGB: Verzicht beim Start der Ausführung) · Rechnung/USt über Stripe mit `automatic_tax` wie bei den Communities · Freischaltung als **FELD an `brand_profiles`** (Migration), geschrieben vom Webhook — der **Betreiber-Schalter bleibt zusätzlich** für Handfälle. **Erstgespräch + Angebot bleibt daneben** der Weg für Studio-Leistungen; **G4 gilt für Brand Design unverändert** |
| 5 | Erstgespräch auf branding.supply | **Eigene schlanke Seite im `brand`-Layer; bis dahin Weiterleitung** | A (dieselbe, mit dem B-Sofortpflaster davor) | Die Weiterleitung ist **R0** und trägt die Herkunft `?source=branding-supply`; die eigene Seite ist **Z0** und ersetzt sie |
| 6 | Beta-Konten nach der Öffnung | **Dauerhaft frei** | A — „Bestandsschutz mit Frist (acht Wochen)" | Gilt je **KONTO** (`brand_access` / Beta-Zulassung), **nicht** als unbegrenzte Zahl von Brandings · die bestehenden Eimer (3 Läufe/Tag je Branding, Instanz-Deckel) bleiben die Kostenbremse · in den AGB als „**Beta-Konten**" benannt · der Betreiber kann die Zusage **je Konto widerrufen** (Missbrauch) |
| 7 | AGB-Checkbox | **Sofort, mit Entwurf und sichtbarem Hinweis** | A — „mit den fertigen Texten" | Hinweis „Entwurf, in anwaltlicher Prüfung" **auf der AGB-Seite UND im Registrierformular neben dem Häkchen** · `noindex` · die **Fassungsnummer wird beim Konto gespeichert** (heute nicht vorhanden, s. §7-Befund — deshalb Bauarbeit in R1) · nach der Prüfung neue Fassung, Hinweis weg |
| 8 | Reihenfolge zu A2 | **Recht zuerst, Stripe direkt danach** | A (dieselbe) | „Direkt danach" heisst: `Z1` startet, sobald `R3` durch ist — nicht parallel, David ist in beiden Strängen der Engpass |

### 9.1 Was diese Entscheidungen im Dokument überholen

- **§4.1 (b)** — die eigene Tabelle `brand_entitlements` ist ersetzt durch ein
  **Feld an `brand_profiles`** (Frage 4). Die Begründung für eine Tabelle
  (Herkunft, Datum, Vermerk, Entzug) bleibt lesenswert; sie ist gegen den
  einfacheren Weg entschieden worden, weil der Webhook genau ein Häkchen
  schreiben muss und der Vermerk am Betreiber-Schalter hängt.
- **§4.1 (c)** — „der Preis-Anker bleibt Text" gilt nur noch für
  Studio-Leistungen (G4/BD1), nicht mehr für die Selbstbedienungs-Ableitung.
- **§4.2** und der Stripe-Punkt in **§6** — beides ist jetzt Paket **Z1**, mit
  denselben zwei Vorbedingungen als Gate.
- **§7** ist kein Vorschlag mehr, sondern der verbindliche Schnitt.

### 9.2 Offen — das muss David noch benennen

Nicht geraten, weil es Preisangaben und Vertragsgegenstand sind:

1. **Name des Kaufgegenstands.** Vorschlag: **ein** Preis je Branding für „die
   Ableitung" = Marktvergleich + später Book & Kit. Wie das auf der Seite und
   auf der Rechnung heisst, legt David fest.
2. **Der Betrag** — und ob es beim EINEN Preis bleibt oder später nach Produkt
   (`market`, `design`) getrennt wird. Beides sind Eingaben für den
   Preis-Katalog in Z1.
3. **Welcher Generator** die Grundfassung liefert (Frage 2) — für R2 nur
   insofern wichtig, als die drei Zusatz-Abschnitte in dessen Gliederung
   passen müssen.
4. **Art.-27-Vertreter jetzt beauftragen oder auf die Anwaltsantwort warten?**
   (§8 Frage 3, Zusatz — Dienstleister grob 200–400 €/Jahr.)

---

## Anhang — Quellen

**Im Repo (Code, am 2026-09-07 gelesen):**
`apps/branding/site.manifest.ts` · `apps/branding/nuxt.config.ts` ·
`apps/branding/app/app.config.ts` · `apps/branding/app/layouts/default.vue` ·
`packages/brand/app/components/BwSiteFooter.vue` ·
`packages/brand/app/app.config.ts` (`completionCta`) ·
`packages/brand/scripts/migrations/006-brand-access.ts` ·
`packages/brand/shared/brandAccess.ts` ·
`packages/brand/server/utils/brandProviderRouting.ts` (ZDR) ·
`packages/market/shared/marketPaywall.ts` ·
`packages/market/server/utils/marketAccess.ts` ·
`packages/market/server/api/market/profiles/[id]/index.get.ts` ·
`packages/market/app/pages/market-bot.vue` ·
`packages/core/app/components/auth/RegisterForm.vue` ·
`packages/core/app/app.config.ts` (`auth.termsUrl`, `consent`, `analytics`) ·
`packages/core/server/utils/entitlementDocument.ts` ·
`packages/pages/shared/legalTemplates.ts` · `packages/pages/shared/types/page.ts` ·
`packages/pages/scripts/seed-legal-pages.ts` ·
`apps/portfolio/app/components/SiteFooter.vue` ·
`apps/portfolio/server/api/intro-call.post.ts` ·
`apps/marketing/app/components/LegalPage.vue` ·
`packages/billing/**` · `packages/control/shared/stripePriceCatalog.ts` ·
`scripts/stripe/ensure-prices.mjs` · `scripts/ops/verify-site-env.mjs`

**Dokumente:**
[OPEN-ITEMS.md](../OPEN-ITEMS.md) `3 · A1` samt Anker `#a1-anwalt` und
`#a1-plattform`, `4 · A2` ·
[OPEN-ITEMS-COMPLETE.md](../OPEN-ITEMS-COMPLETE.md) (P13, Portfolio-Relaunch) ·
[DECISION-LOG.md](../DECISION-LOG.md) 2026-09-07 (G4), 2026-09-07 (BD1
Strategie), 2026-09-05 (Brand Foundation als Guidelines) ·
[archiv/BRAND-MARKTVERGLEICH.md](../archiv/BRAND-MARKTVERGLEICH.md) §1.7, §1.9,
Anhang G · [plans/BRAND-INSIGHTS.md](BRAND-INSIGHTS.md) §4 ·
[plans/BRAND-DESIGN.md](BRAND-DESIGN.md) §1.7–§1.10 ·
[plans/BRANDING-SUPPLY-INFRA.md](BRANDING-SUPPLY-INFRA.md) (D4) ·
[runbooks/STRIPE-GO-LIVE-RUNBOOK.md](../runbooks/STRIPE-GO-LIVE-RUNBOOK.md) ·
[runbooks/BRANDING-SUPPLY-SETUP.md](../runbooks/BRANDING-SUPPLY-SETUP.md)

**Extern (Preismodelle, abgerufen 2026-09-07):**
Looka-Preise (Logo einmalig 20/65 $, Brand Kit 96 $/Jahr, mit Web 129 $/Jahr) —
[checkthat.ai/brands/looka/pricing](https://checkthat.ai/brands/looka/pricing),
[ecomm.design/looka-pricing](https://ecomm.design/looka-pricing/) ·
Tailor Brands (Abo-only, Lite frei / Essential 199 $ / Elite 249 $ pro Jahr) —
[ecommerceparadise.com](https://ecommerceparadise.com/tailor-brands-pricing-2026/),
[cybernews.com](https://cybernews.com/marketing-tools/tailor-brands-review/) ·
Umsatzsteuer digitaler Leistungen, OSS und Kleinunternehmergrenze —
[eclear.com](https://eclear.com/de/artikel/saas-und-digitale-leistungen-ort-der-leistung-und-oss-fallen-in-der-praxis/),
[norman.finance](https://norman.finance/de/en/blog/oss-scheme-germany),
[pandotax.de](https://pandotax.de/rechtliches/elektronische-dienstleistung-umsatzsteuer/) ·
Brandmark, Frontify/Corebook°, IdeaProof: Preisformen zitiert aus den
Recherche-Anhängen von BD1 §1.7/Anhang A und BF1 §1.5, dort mit den
Ursprungsquellen.
