# Pukalani — Wettbewerbs- und Best-Practice-Benchmark

**Stand: 2026-08-10.** Alle Preise und Seiteninhalte an diesem Tag erhoben.
Preise ändern sich; jede Zahl trägt ihre Quelle.

**Methode.** Fünf parallele Rechercheläufe (Direktabruf der Marketing-, Preis-
und Hilfeseiten, dazu Capterra/G2/Trustpilot/Reddit/Meta-Foren und
dokumentierte UX-Teardowns), plus eine eigene Erhebung des DACH-Felds und des
Pukalani-Stands aus dem Code. **Was nicht belegt werden konnte, ist als
„unbestätigt" markiert** — insbesondere bei Konversions-Zahlen, wo viele
kursierende Werte nur über Sekundärblogs laufen.

**Der Pukalani-Stand ist am Code erhoben**, nicht aus dem Gedächtnis:
`packages/onboarding/**`, `packages/control/shared/onboarding.ts`,
`apps/marketing/app/components/PricingSection.vue`,
`packages/*/app/app.config.ts`. Arbeitszettel:
`scratchpad/pukalani-baseline.md`.

---

## 1. Kurzprofile

### Circle.so
Marktführer im Creator-Segment. **„Build a home for your community, events, and
courses — all under your own brand."** ([circle.so](https://circle.so/)) Beweis
über Prominente (Tim Ferriss, Mel Robbins, Ali Abdaal), „70k+ reviews",
G2-Badges, eine Umsatzzahl („$3 million over two years"). Jeder Feature-Block
endet mit einem namentlichen Kundenzitat statt mit einer Aufzählung.
**Professional 89 $ · Business 199 $ · Circle Plus individuell**, Gebühr
**2 % / 1 % / 0,5 % ZUSÄTZLICH zu Stripe**, Admins 3/5/unbegrenzt.
**14 Tage, „No credit card required."** Eigene Domain schon im Einstiegsplan,
**Branding-Entfernung erst ab 199 $**, dazu ein **Email-Hub-Aufpreis von
99 $/Mon**. Wichtig und direkt auf der Seite belegt: *„Prices displayed in USD,
based on annual billing and do not include applicable taxes."* — **es gibt
keinen Monats-/Jahres-Umschalter**, der Monatspreis erscheint erst an der Kasse.
([circle.so/pricing](https://circle.so/pricing))

### Mighty Networks
**„The Community Platform That Delivers"** mit „Community. Courses. Events.
$500M earned on Mighty in 2025." Ein interaktiver **Umsatzrechner** steht weit
oben auf der Seite. Preise mit sichtbarem Umschalter: **monatlich 95 $ / 215 $**,
**jährlich 79 $ / 179 $** („2 Months Free", ≈ −17 %), Mighty Pro individuell;
Gebühr 2 / 1 / 0,5 %; 14 Tage ohne Kreditkarte — **die Testphase läuft auf dem
großen Funktionsumfang, nicht auf dem Einstiegsplan**.
([mightynetworks.com/pricing](https://www.mightynetworks.com/pricing))
Nebenbefund: auf derselben Seite heißen die Stufen in Karten und Tabelle
Launch/Scale/Mighty Pro, im Rechner und in der FAQ aber Explore/Launch/Scale/
**Growth** — eine halb durchgeführte Umbenennung, die live steht.

### Skool
Das Gegenmodell: Einfachheit als Produktversprechen. Eigene Worte: **„Skool is
simple, you can set it up in less than 30-minutes"**
([skool.com/about](https://www.skool.com/about)). Und eine bemerkenswerte
Landing-Strategie: **skool.com bewirbt gar nicht die Plattform**, sondern zeigt
ausgeloggt ein **Verzeichnis lebender Communities** mit Mitgliederzahlen und
Preisen — die Kunden sind der Beweis. Zwei Stufen: **Hobby 9 $ · Pro 99 $**,
Unterschied im Wesentlichen **Gebühr 10 % vs. 2,9 %** (+0,30 $; **ab 900 $
Transaktionswert 3,9 %**) und die eigene Adresse. **Skool ist Merchant of
Record und führt die EU-Umsatzsteuer selbst ab** — die Gebühr ist damit
inklusive Zahlungsabwicklung, anders als bei Circle und Mighty, wo Stripe
obendrauf kommt. ([skool.com/pricing](https://www.skool.com/pricing),
[help.skool.com](https://help.skool.com/article/86-subscriptions-faq))

### Heartbeat.chat
**„Build a community people will pay for."** 37.000+ Communities, 25 Mio. $
verarbeitet, Fallstudien mit Umsatzdeltas. Build 49 $ · Grow 149 $ · Scale
849 $ (jährlich ~−17 %), Gebühr **5 / 2,5 / 1,25 %**, Mitglieder
350/5.000/unbegrenzt, 14 Tage ohne Kreditkarte.
([heartbeat.chat/pricing](https://www.heartbeat.chat/pricing)) Navigation
**Kommandozeile zuerst** (⌘K navigiert *und* erzeugt). Kritik: keine
Lokalisierung („the core UI remains strictly in English"), Feed ohne Titel und
Sortierung.

### Bettermode (ehem. Tribe)
Mittelstands-/Enterprise-Ende. **„Launch fast with no code and turn engagement
into measurable retention and growth."** Starter **399 $** · Growth 1.500 $ ·
Premium auf Anfrage, jährlich ~−16 %, **keine Transaktionsgebühr**, Mitglieder
10k/25k/100k+, Branding-Entfernung ab Growth.
([bettermode.com/pricing](https://www.bettermode.com/pricing)) Template-Galerie
(25+ Anwendungsfälle) als Onboarding-Kern.

### Discourse
Forum-Schwergewicht, Open Source. **„Where tech companies build communities"** —
22.000+ Communities, Logos OpenAI/GitLab/Atlassian. **Seit Juli 2026 mit echtem
Gratisplan** (`*.discourse.group`): Free 0 $ · Pro 100 $ · Business 500 $ ·
Enterprise. **Eigene Domain erst ab Pro.**
([Ankündigung](https://blog.discourse.org/2026/07/introducing-the-discourse-free-plan/),
[Preise](https://www.discourse.org/pricing)) Ihr Setup-Wizard war auf ~5
Schritte angelegt und ist **„ballooned up to 13"**
([Meta](https://meta.discourse.org/t/designing-the-first-time-setup-wizard/49512)).

### Ghost (Memberships / Ghost Pro)
**„Turn your audience into a business."** Beweis in einem Satz, den man neidlos
bewundern darf: **„$100,000,000+ Revenue earned each year… with 0% payment
fees"**, dazu „Last week, 16,718 brand new publications got started with Ghost"
([ghost.org](https://ghost.org)). Starter 18 $ · Publisher 29 $ · Business
199 $ · Custom, **0 % Transaktionsgebühr**, **eigene Domain auf ALLEN bezahlten
Stufen**. Ghost ist der einzige Anbieter im Feld, der **Zahlen zu seinem
eigenen Onboarding veröffentlicht** (§3, M2).

### Kajabi
„Turn What You Know Into What You're Known For." Beweis über konkrete
Creator-Umsätze (Justin Welsh 10 Mio. $+). Basic 179 $/143 $ · Growth 249 $/
199 $ · Pro 499 $/399 $ (jährlich ~−20 %), Revenue-Share 2/1/0,5 % **nur auf
fremde Zahlungsabwickler** ([kajabi.com/pricing](https://kajabi.com/pricing)).
Der Einstiegsplan „Kickstarter" (89 $) wurde Anfang 2026 gestrichen, die Preise
stiegen **ohne Bestandsschutz**. Onboarding gemeldet ~2 Stunden.
Capterra-Wert „Preis-Leistung": **3,7/5** — die schlechteste Unterkategorie.

### Patreon
Kein Wizard, sondern eine **Launch Checklist**. Gebühr **seit 04.08.2025 flach
10 %** für neue Creator (vorher Lite 5 / Pro 8 / Premium 12 %); Bestand behält
den alten Satz — **verliert ihn aber endgültig, sobald die Seite einmal
depubliziert wird** ([Patreon](https://www.patreon.com/posts/were-increasing-130695366),
[TechCrunch](https://techcrunch.com/2025/06/16/patreon-will-increase-the-cut-it-takes-from-new-creators)).
Social-Login prominent.

### Substack
Maßstab für Anmeldegeschwindigkeit. Kostenlos publizieren, **10 % flat** plus
Stripe (~13–16 % effektiv), nie eine Kreditkarte beim Anlegen. **Die Subdomain
wird im ersten Bildschirm gefragt** („whatever you enter as subdomain … will be
the permanent web URL"), der mittlere Schritt ist ganz überspringbar, Schritt 3
ist das Veröffentlichen
([FAQ](https://faq.substack.com/p/how-to-start-a-substack-in-three)). Eigene
Domain: **einmalig 50 $**. Lock-in: über iOS gewonnene zahlende Abonnenten sind
**nicht exportierbar**
([Indie Hackers](https://www.indiehackers.com/post/the-problems-with-building-on-substack-62cdbd1df9)).

### DACH-Feld (selbst ergänzt — Pukalanis eigentlicher Nahbereich)
- **coapp** (deutsch, EU-Hosting): „Mit coapp verbindest du Kommunikation &
  Einnahmen in einer Community App – alles unter deiner Marke." Free 0 € ·
  Starter 19 € · Professional 99 € · Business 399 €, **netto** („Alle
  Preisangaben verstehen sich netto, zzgl. der jeweils gesetzlich gültigen
  Mehrwertsteuer"), **Plattformgebühr 15 / 15 / 5 / 2 %**, Mitglieder
  50/100/500/1.000, eigene Domain ab Starter. CTA **„Kostenlos starten"** —
  wortgleich mit Pukalani. ([coapp.io/preise](https://www.coapp.io/preise))
- **Heylo**: Base 0 $ / Plus 19 $ / Pro 59 $ / Business 199 $, Gebühr
  5 % + 0,59 $ bis 1 % + 0,10 $, unbegrenzte Mitglieder gratis.
- Im deutschen Vergleichsartikel von coapp weist **nur coapp selbst**
  ausschließliches EU-Hosting aus; bei allen anderen steht „Nicht öffentlich
  als ausschließlich EU-basiert ausgewiesen"
  ([Vergleich](https://www.coapp.io/blog-eintraege/die-beste-community-plattform-2026-vergleich-der-wichtigsten-anbieter)).

### Kontrast-Vorbilder (keine Wettbewerber)
**Linear** (dünnes Onboarding, saubere Einstellungs-IA) · **Vercel / Netlify /
Webflow / Framer** (Domain-Einrichtung) · **Notion** (eine Segmentierungsfrage,
danach vorbefüllter Arbeitsbereich) · **Stripe** (Dreiteilung „Personal /
Account / Product") · **Hivebrite** als Enterprise-Kontrast: ab ~799 $/Monat,
**durchschnittliche Einführungsdauer 4 Monate**
([Capterra](https://www.capterra.com/p/147279/Hivebrite/)).

---

## 2. Vergleichstabellen

### 2.1 Preise und Modell

| | Stufen | Einstieg | Spitze (Selbstbedienung) | Jahresrabatt | Transaktions­gebühr | Testphase | Gratis-Plan | Darstellung |
|---|---|---|---|---|---|---|---|---|
| **Pukalani** | **2 + Studio** | **29 € Personal** | **149 € Pro** | **−25 %** | **0 %** | **14 T. Pro, ohne Karte** | nein (nur-lesend ohne Abo) | **brutto, „inkl. 19 % MwSt." am Preis** |
| Circle | 3 | 89 $ | 199 $ (+99 $ E-Mail) | **kein Umschalter — gezeigt ist der Jahrespreis** | 2/1/0,5 % **+ Stripe** | 14 T., ohne Karte | nein | netto, „do not include applicable taxes" |
| Mighty | 3 | 95 $ mtl. / 79 $ jährl. | 215 $ / 179 $ | **„2 Months Free"** (~−17 %) | 2/1/0,5 % **+ Stripe** | 14 T., ohne Karte | nein | netto |
| Skool | **2** | 9 $ | 99 $ | „2 Months Free" | **10 % / 2,9 %** (ab 900 $: 3,9 %), **inkl. Abwicklung, MoR + EU-USt.** | 14 T. (Karte, unbestätigt) | nein | netto |
| Heartbeat | 3 | 49 $ | 849 $ | ~−17 % | 5/2,5/1,25 % | 14 T., ohne Karte | nein | netto |
| Bettermode | 3 | **399 $** | 1.750 $ | ~−16 % | keine | 14 T., ohne Karte | nein | netto |
| Discourse | 4 | 0 $ | 500 $ | k. A. | keine | 14 T. | **ja (seit 7/2026)** | netto |
| Ghost | 4 | 18 $ | 199 $ | jährlich abgerechnet | **0 %** | 14 T., Karte (sek.) | nein (Open Source) | netto |
| Kajabi | 3 | 179 $ | 499 $ | ~−20 % | 2/1/0,5 %¹ | 14–30 T., **mit Karte** | nein | netto |
| Patreon | 1 Modell | 0 $ | — | — | **10 % flat** | — | ja | netto |
| Substack | 1 Modell | 0 $ | — | — | **10 % + Stripe** | — | ja | netto |
| coapp (DE) | 4 | 0 € / 19 € | 399 € | k. A. | **15/15/5/2 %** | k. A. | ja | **netto, „zzgl. MwSt."** |

¹ nur bei fremdem Zahlungsabwickler; mit Kajabi Payments 0 %.

**Was daraus folgt.** Pukalani ist der **einzige** Anbieter im Feld mit
gleichzeitig keiner Transaktionsgebühr, keinem Preis pro Mitglied und einem
Bruttopreis direkt am Betrag. Selbst Ghost, das mit „0% payment fees" wirbt,
nennt netto; Circle schreibt die Steuer ausdrücklich heraus **und** versteckt
den Monatspreis. Im deutschen Wettbewerb ist das ein echter Unterschied: coapp,
der nächste Nachbar, nennt netto — bei 19 % ist das der Abstand zwischen 19 €
und 22,61 €, und der fällt dem Verein erst an der Kasse auf.

**Zweiter Befund, der später wichtig wird (F7):** Skool ist **Merchant of
Record und führt die EU-Umsatzsteuer selbst ab**. Wenn Pukalani irgendwann
bezahlte Communities anbietet, ist das die Erwartung, gegen die man antritt —
nicht die Höhe der Gebühr, sondern wer den Steuerkram trägt.

### 2.2 Registrierung

| | Schritte bis „drin" | Social-Login | E-Mail-Bestätigung | Community-Name gefragt |
|---|---|---|---|---|
| **Pukalani** | Konto (2-Schritt-OTP) → Code-Tor → 7 Wizard-Schritte | **nein** (nur OTP) | vor dem Einlösen des Codes | **nach** der Registrierung |
| Substack | E-Mail → Name → **Subdomain** | k. A. | unbestätigt | **sofort, erster Bildschirm** |
| Skool | Community-Name **+ Zahlungsdaten** als Anlegevorgang | **Google** | widersprüchlich | **als Anlegevorgang selbst** |
| Mighty | 2 Schritte (Name → E-Mail/Passwort) | **Google, Facebook, LinkedIn, Apple** | **blockiert den Zugang** | im KI-Setup |
| Circle | 4 (Konto → Name/URL/Sichtbarkeit → Fragebogen → Vorlage) | ja (unbestätigt) | — | **Schritt 2** |
| Patreon | Konto → Launch Checklist | **Google/Apple/Facebook** | — | in der Checkliste |
| Bettermode | E-Mail **oder Google** | ja | Code nach der Anmeldung | im Setup |
| Ghost | E-Mail + Karte | k. A. | — | **im Signup** ⇒ `name.ghost.io` |
| Discourse (Free) | Discourse-ID (~30 s) → Branding → Subdomain | vorverdrahtet | — | im Signup, „you can change this in the future!" |
| Linear | **Google-OAuth** | ja | — | Schritt 3 |

**Was daraus folgt.** Pukalani ist der einzige ohne Social-Login — und hat
zusätzlich das Einladungs-Tor davor. Das Tor ist für Early Access richtig und
im Code sauber begründet (erst prüfen, dann ausfüllen). Der fehlende
Google-Knopf ist es nicht. **Aber**: Circle dokumentiert eine Falle, die man
kennen sollte — *setzt ein Kunde seine eigene Domain, sind Google-, Facebook-
und Twitter-Login für die Mitglieder auf dieser Domain dauerhaft abgeschaltet*
([Circle-Hilfe](https://help.circle.so/p/administration/custom-domains/set-up-a-custom-root-domain)).
Wer Social-Login in ein Mandanten-Produkt einbaut, kauft sich dieses Problem
mit ein; Pukalanis OTP-Weg hat es nicht.

### 2.3 Wizard und erster Erfolg

| | Schritte | Fragen vor dem ersten Wert | Vorlagen | Gefüllter erster Zustand | Checkliste danach | Gemessene Zeit |
|---|---|---|---|---|---|---|
| **Pukalani** | **7** (+ Code-Tor) | **6** | **6 Vibes** | Startseite aus der Beschreibung | **nein** | **Median 0,3 s** Anlegezeit |
| Circle | **4** | 1 Fragebogen | **5 Templates** ⇒ Spaces angelegt | ja (Spaces) | **ja, im Admin-Dashboard** | — |
| Mighty | **1 Frage** („who do you want to bring together?") | **1** | KI erzeugt Landingpage, Logo, Bildwelt, Template | ja, KI-generiert | unbestätigt | — |
| Skool | kein Wizard | 0 | **keine** | **nein** | **nein** | 30–90 Min. (Dritte) |
| Linear | ~7, sehr dünn | **0** | — | **vorbefüllter, realistischer Arbeitsbereich** | **ja, Aufgaben-Checkliste** | ~60 s |
| Notion | wenige | **1** | Template-Galerie | ja, aus der Antwort | — | — |
| Substack | **3**, Schritt 2 überspringbar | 0 Pflicht | — | — | — | Minuten |
| Ghost | — | 0 | Themes | **Musterbeiträge, die den Editor erklären** | **5-Schritte-Balken in der Navigation** | — |
| Discourse | „ballooned up to **13**" | viele | — | — | — | — |
| Bettermode | wenige | einige | **25+ Templates** | ja | — | — |
| Kajabi | 9 Stationen | viele | Templates + „Cofounder AI" | — | **ja** | ~2 h (Nutzerbericht) |
| Hivebrite | Projekt | — | — | — | — | **4 Monate** (Capterra) |

**Was daraus folgt — und das ist der wichtigste Befund des Berichts.**
Pukalanis Wizard ist technisch der schnellste im Feld und **fragen-schwerer als
jeder direkte Wettbewerber**: sechs Antworten vor dem ersten Wert, gegen
Circles einen Fragebogen und Mightys **einzige Frage**. Zugleich fehlt genau
das, was die beiden Nachbarn haben: Circle hat eine **eingebaute
Getting-started-Checkliste im Admin-Dashboard**
([Circle-Hilfe](https://help.circle.so/p/basics/getting-started/get-to-know-the-admin-dashboard)),
Mighty erzeugt Landingpage, Logo und Bildwelt aus einer Frage. Pukalani stellt
also mehr Fragen und macht daraus weniger.

Der Trost: Pukalanis Fragen sind kein Ballast, sondern **Produkt-Signal** (die
Kategorien sind deckungsgleich mit den Zielgruppenseiten, die
`earlyAccess`-Ziele messen Nachfrage). Der richtige Zug ist deshalb nicht
Streichen, sondern **Verschieben** (§5, E5) — und aus den Antworten endlich
etwas bauen (E2).

### 2.4 Dashboard- und Einstellungs-IA

| | Form | Oberste Trennung | Umfang | URL-Muster | Suche |
|---|---|---|---|---|---|
| **Pukalani** | **volle Seiten** | **Konto** vs. **Community** | **27 Sidebar-Einträge in 7 Gruppen** + 10 Community-Reiter + 4 Konto-Reiter | `/dashboard/community/<reiter>` | **nein** |
| Circle | volle Seiten | Dropdown am Community-Namen (Settings/Dashboard/Site) | **13 Oberkategorien** (Hilfe-Struktur als Abbild) | — | — |
| Mighty | volle Seiten | Profilbild → Admin Settings, Einstieg „Frequently Accessed" | **11 flache Kategorien** | — | — |
| Skool | volle Seiten | **6 Reiter** + ein Settings-Knopf | klein | — | — |
| Linear | **volle Seiten** | **Account · Features · Administration · Your teams**, **rechte-gefiltert** | mittel | `linear.app/settings/<x>` | — |
| Stripe | volle Seiten | **Personal · Account · Product** | groß | `/settings/<x>` | — |
| Vercel | volle Seiten | persönlich vs. Team; **Abrechnung in beiden** | mittel | `/teams/<slug>/settings/<x>` | — |
| Ghost | **eine Scrollseite + linke Navigation + globales Suchfeld** | flach | mittel | — | **ja** |
| Notion | **Modal** | persönlich vs. Workspace + Admin-Konsole | groß | — | — |
| Discourse | Admin-Sidebar (seit 3.4 die einzige) | — | groß | `/admin/...` | — |

**Was daraus folgt.** Die Zweiteilung Konto/Community ist genau Linears und
Vercels Form — und ausdrücklich nicht Notions Modal. Richtig entschieden. Das
Problem sitzt in der **Menge**: 27 Sidebar-Einträge in sieben Gruppen, davon
eine mit neun und drei mit je einem. Skool kommt mit sechs Reitern aus, Mighty
mit elf flachen Kategorien, Circle mit dreizehn. Genau an dieser Größe hat
Ghost 2023 umgebaut, mit einer bemerkenswert ehrlichen Begründung: *„as we
introduced new concepts, it became difficult to organise their settings"*
([Ghost](https://ghost.org/changelog/refreshed-settings/)) — und ein Suchfeld
ergänzt. Discourse zeigt, was passiert, wenn man es laufen lässt (§4, K1).

### 2.5 Eigene Domain

| | Ab welchem Plan | Records | Nachweis | Prüfung | SSL | Registrar-Hilfe |
|---|---|---|---|---|---|---|
| **Pukalani** | **Pro (149 €)** | **A (Apex) / CNAME (www)**, Werte **vom Server** | **TXT** | **Knopf „Prüfen"**, 5 Statusstufen | automatisch (LE) | **nein** |
| Circle | **Professional (89 $, Einstieg)** | **CNAME**; Root **mit `www.`-Präfix eintragen** | — | „Setup domain" → **„pending" → aktiv**, alte URL leitet um; **CAA `pki.goog` wird automatisch erkannt und nachgefordert** | automatisch (Google-Zertifikat) | 15 Anbieter |
| Mighty | alle bezahlten (unbestätigt) | A `147.185.161.77/.78` **oder** CNAME → `ssl.mn.co` | — | **„Save and wait" → Benachrichtigung → „Activate Your Domain"** | automatisch | Cloudflare: „Set Proxy Status to DNS Only" |
| **Skool** | **gar nicht** | — | — | — | — | — |
| Ghost | **alle bezahlten Stufen** | CNAME; **A/ANAME/ALIAS** für Apex | — | Knopf „Setup" | automatisch, gratis | **ja, je Registrar** |
| Discourse | **ab Pro** (nicht Free) | **nur CNAME**, Apex separat | — | automatisch | automatisch | **ja, 12+** |
| Bettermode | Starter (399 $) | **TXT + CNAME** | TXT | **„Revalidate DNS Settings"** | automatisch | Warnung: Domain **vor** SSO |
| Heartbeat | ungesperrt (unbestätigt) | A (+ ggf. TXT) | TXT | **„Domain not working?"** stößt neu an | „Setting up" 24–48 h | **Entri** für Subdomains |
| Vercel | alle | **projekt-eigener** CNAME / A; Nameserver als Alternative | TXT („Connect External") | **automatisch**, Fehler = **„Invalid Configuration"** | HTTP-01; Wildcard ⇒ DNS-01 ⇒ Nameserver Pflicht | **Domain Connect: Ein Klick** |
| Webflow | alle | **Quick connect (Entri)** oder 2× A + CNAME | TXT | — | Let's Encrypt | eigene Seite je Registrar |
| Framer | alle | 2× A + www-CNAME; **keine AAAA** | — | — | automatisch | feste Liste |
| Netlify | alle | A/CNAME **oder** Nameserver | — | — | automatisch nach DNS | — |

**Skool hat gar keine eigene Domain.** Es gibt nur einen Wunsch-Slug unter
`skool.com/deine-marke` — **erste Änderung gratis, jede weitere 100 $**, und
nur im Pro-Plan ([help.skool.com](https://help.skool.com/article/121-how-to-change-my-group-url)).
Alles, was in Suchergebnissen nach „Skool custom domain CNAME" aussieht, sind
Fremdwerkzeuge und Weiterleitungs-Tricks.

**Drei Schlüsse.**
1. **Pukalanis Sperre auf Pro (149 €) ist die härteste im Feld** — mit
   Ausnahme von Skool, das gar keine anbietet. Ghost gibt die Domain für 18 $
   auf jeder bezahlten Stufe, Circle im **Einstiegsplan**, Bettermode und coapp
   ab Starter, Mighty offenbar überall.
2. **Der manuelle „Prüfen"-Knopf ist kein Nachteil.** Circle („Setup domain"),
   Mighty („Activate Your Domain"), Bettermode („Revalidate DNS Settings") und
   Heartbeat („Domain not working?") machen es genauso. Die Begründung im
   Pukalani-Code — ein ehrlicher Knopf schlägt einen lügenden
   Fortschrittsbalken — deckt sich mit der Praxis der Besten.
3. **Der Ein-Klick-Pfad ist kaufbar, nicht baubar.** Vercels „Domain Connect"
   und Webflows/Heartbeats „Quick connect" laufen über **Entri** bzw. den
   GoDaddy-Domain-Connect-Standard
   ([Vercel](https://vercel.com/changelog/automated-dns-configuration-with-domain-connect),
   [Entri/GoDaddy](https://www.businesswire.com/news/home/20250618915761/en/Entri-and-GoDaddy-Announce-Agreement-to-Streamline-Domain-Configuration-for-Businesses-Worldwide)) —
   eine Einkaufsentscheidung, keine Roadmap-Frage.

Und eine Idee zum Abgucken, die fast nichts kostet: **Circle erkennt selbst,
ob ein CAA-Eintrag fehlt, und fordert ihn dann gezielt nach.** Genau daran
scheitern Zertifikate am häufigsten (Vercel nennt fehlende CAA-Records als
häufigste Ursache eines fehlgeschlagenen Zertifikats). Ein CAA-Check im
„Prüfen"-Lauf wäre ein kleiner Eingriff mit großer Wirkung.

---

## 3. Muster der Besten

**M1 — Der erste Zustand ist nie leer.** Linear liefert einen vorbefüllten,
*realistischen* Arbeitsbereich (Issues über Stunden, nicht Wochen; Projekte
„Mobile App", „API"). Notion befüllt nach der einen Segmentierungsantwort.
Ghost setzt Musterbeiträge, die zugleich den Editor erklären. Circle legt aus
der Template-Wahl gleich Spaces an. Mighty erzeugt Landingpage, Logo und
Bildwelt aus einer einzigen Frage. NN/g formuliert es normativ: *„Provide
direct pathways (i.e., links) to getting started with key tasks related to
populating the empty state."*
([NN/g](https://www.nngroup.com/articles/empty-state-interface-design/))
Wer es **nicht** tut: Skool — und genau das ist dessen meistgenannte
Onboarding-Schwäche jenseits der Anmeldung.

**M2 — Eine kurze Checkliste, keine Produkttour.** Ghost ist der einzige mit
veröffentlichten Zahlen, und sie sind deutlich: wer ein eigenes Theme hochlud,
wurde zu **~10 %** zahlender Kunde gegen **0,9 %** ohne — rund das Zehnfache;
wer die Tutorials nutzte, schloss Theme- und Domain-Einrichtung zu **26 %**
statt **7 %** ab; Theme-Anpasser veröffentlichten **4,4 Beiträge/Monat**
statt 2 ([Ghost](https://ghost.org/changelog/ghost-onboarding/)). Appcues nennt
die Obergrenze: *„Checklists with more than five items see significantly lower
completion rates"*, mit einem Fall von **+21 %** Setup-Rate. Gegenprobe von
NN/g: **Tutorials** (nicht Checklisten) *„don't result in better task
performance"*, weil vorab Gezeigtes *„hard to remember when the user needs it"*
ist ([NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)). Also:
Checkliste ja, Tour nein. Circle und Kajabi haben eine, Skool und Pukalani
nicht.

**M3 — So wenige Fragen wie möglich vor dem ersten Wert.** Linear stellt keine,
Notion eine, Mighty eine, Vercel gar keine (das verbundene Repository *ist* die
Antwort). Die beste Formulierung stammt aus dem Notion-Teardown: jede Frage vor
dem ersten Wert ist ein Grund zu gehen
([Candu](https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users)).

**M4 — Der Wizard darf unterbrochen werden.** NN/g: *„Allow users to exit the
wizard midway and save state. Allow them to resume the process at a later
time."* und *„Wizard steps should be self-sufficient"*
([NN/g](https://www.nngroup.com/articles/wizards/)). Pukalani erfüllt das
bereits: Schritt in der URL, Entwurf gespeichert, Zurück-Taste funktioniert.

**M5 — Karten für die Entscheidung, Tabelle für den Zweifler.** Alle fünf
Benchmark-Preisseiten (Vercel, Framer, Webflow, Notion, Linear) legen unter die
Karten eine vollständige Vergleichstabelle; Circle, Mighty und Skool ebenso.
Keiner verlässt sich ab drei Stufen auf Karten allein.

**M6 — Der Jahresrabatt wird in Monaten erzählt, nicht in Prozent.** Skool
(„2 Months Free!"), Mighty („2 Months Free"), Notion („Save up to 20% with
yearly"). Dass „2 Monate gratis" besser wirkt als das rechnerisch identische
„−17 %", ist **nicht primär belegt** — aber die Häufung bei den Marktführern
ist selbst ein Signal.

**M7 — Der Einstiegs-/Gratiszustand wird nie „begrenzt" genannt.** „Free
forever" (Vercel), „Free for everyone" + „Unlimited members" (Linear),
„Essentials for staying organized" (Notion). Knappheit sitzt bei einer *Menge*,
nie im Namen der Stufe.

**M8 — Die Domain-Einrichtung ist eine ehrliche Gabelung, kein Wizard-Schritt.**
Vercel und Netlify stellen „eigene Records setzen (du behältst dein DNS)" gegen
„Nameserver übergeben (wir machen alles)" — als Abwägung formuliert. Vercels
bester Nebensatz ist zugleich der praktischste Rat im ganzen Feld: *„we
recommend updating your existing DNS record to 'lower' the TTL (for example 60
seconds)"* vor dem Umzug
([Vercel](https://vercel.com/docs/domains/troubleshooting)).

**M9 — Einstellungen: volle Seiten, rechte-gefilterte Navigation, zwei bis drei
oberste Schubladen, ab einer gewissen Größe ein Suchfeld.** Linear (*„Members
will see settings related to their own work, while admins and owners also see
workspace administration settings"*,
[Changelog](https://linear.app/changelog/2024-12-18-personalized-sidebar)),
Stripe (*„The Dashboard's settings are broken into three categories: Personal,
Account, and Product"*, [Stripe](https://docs.stripe.com/dashboard/basics)),
Vercel, Ghost.

**M10 — Die Einstiegshürde ist im ganzen Feld dieselbe: 14 Tage, keine
Kreditkarte.** Circle, Mighty, Heartbeat, Bettermode, Discourse, Ghost. Nur
Kajabi verlangt die Karte — und wird dafür kritisiert. Erwartungsrahmen:
Free-Trial-Produkte gelten bei **8–12 %** als gut, **15–25 %** als sehr gut
([Lenny/Poyar+Pendo](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion)).

---

## 4. Häufigste Kritik an den Wettbewerbern — und was daran unsere Chance ist

**K1 — „Zu viele Einstellungen, an zu vielen Orten."** Die am besten belegte
Schwäche im Feld, weil Discourse sie im eigenen Forum verhandelt:
- *„there are too many options in Preferences"*
- *„Very valuable options like Saved Searches, AI and Activitypub are only
  visible when pressing the > icon"*
- *„It is very hard for a new user to realise that these things are all in
  different places."*
- *„those settings are simply not visible, except when you know that they're
  there, and you scroll horizontally."*
([Meta](https://meta.discourse.org/t/there-are-too-many-options-in-preferences/353298))
Dazu Circle: *„At first, Circle can feel a bit overwhelming due to its many
features."* (Vilma K., 08.10.2024,
[Capterra](https://www.capterra.com/p/10002260/Circle/reviews/)), *„overwhelmed
when trying to track something down"* (G2), Kajabi: *„It takes a lot to learn
how to use Kajabi and I am probably still learning."* (Louise H., 27.06.2022),
Mighty: *„I don't know how to find things"*. NN/g liefert die Zahl: schlechte
Auffindbarkeit war *„responsible for 45% of the many task failures"*, und den
Satz zum Einrahmen: *„It's too easy to resolve a design debate by simply
offering all the possible options as preference settings."*
([NN/g](https://www.nngroup.com/articles/customization-of-uis-and-products/))
**⇒ Chance:** „Einfachheit ist Leitprinzip" ist die Lücke — aber nur so lange,
wie 27 Sidebar-Einträge nicht 40 werden.

**K2 — „Sieht aus wie alle anderen."**
- Circle: *„Only comes with one template making all Circle communities look
  very homogenous and restricted in customizations."* (Jessa B., 12.01.2023)
- Mighty: *„The branding capabilities are very subpar… I wish there were more
  flexibility with what you could do to design the landing pages."*
  (Marlena B., 29.07.2021,
  [Capterra](https://www.capterra.com/p/185819/Mighty-Networks/reviews/))
- Bettermode: *„Customization is limited to colors and graphics."*
  (Shaun N., 02.11.2020)
- Skool: starre Optik, „limited branding" — bei Skool ist selbst die eigene
  Adresse nur ein Slug.
Dazu das Gating: Circle entfernt sein eigenes Branding erst ab 199 $,
Bettermode erst ab Growth (1.500 $).
**⇒ Chance: die deutlichste im ganzen Bericht.** Pukalani gibt ab 29 € einen
26×11-Theme-Katalog, eigene Schriften, eine Ramp aus einer Basisfarbe — und
setzt das Aussehen als **Schritt 6 des Wizards** („Vibe"), bevor die Community
existiert. Das gehört auf `/vs/*` und `/wechseln`, mit diesen Zitaten als Beleg.

**K3 — Preis-Überraschung.** Das zweite große Thema:
- Mighty: *„The annual fee hit just a few days ago… they refuse to offer any
  grace, and we are stuck with an annual fee for a product we are no longer
  using."* (Eleanor H., 13.09.2025)
- Circle: *„Pricing also jumps quickly as you scale"* (Riya B., 18.02.2025);
  *„there is not an cheap entry plan"* (Francesco P., 04.02.2026) — plus die
  auf der Preisseite selbst nachprüfbare Eigenheit, dass **nur der Jahrespreis
  gezeigt wird** und der Monatspreis erst an der Kasse auftaucht.
- Kajabi: *„The cost was so high, there are a lot of features included that I
  didn't utilize."* (Renata Z., 27.01.2026); Preiserhöhung Anfang 2026 **ohne
  Bestandsschutz**; Capterra „Preis-Leistung" 3,7/5.
- Skool: *„when they create a $1 community they're surprised to learn that they
  only get $0.67 out of that $1"* — die 10 % + 0,30 $ auf Hobby; dazu die
  3,9 %-Stufe ab 900 $, die nur im Kleingedruckten steht, und **„Growth Boost"
  ist standardmäßig AN**.
- Patreon: *„This platform is completely not transparent in what they bill…"*
- Kumuliert: bei 500 zahlenden Mitgliedern gehen je nach Anbieter **8–14 %**
  des Community-Umsatzes an Plattform- und Zahlungsgebühren
  ([wbcomdesigns](https://wbcomdesigns.com/mighty-networks-circle-skool-wordpress-cost/)).
**⇒ Chance:** „Ein fairer Preis für deine ganze Community – nicht pro Produkt"
trifft die richtige Achse. Was fehlt, ist die **zweite Zahl**: keine
Transaktionsgebühr, keine Staffel nach Mitgliedern. Bei 300 zahlenden
Mitgliedern à 20 € sind das gegenüber Circle Professional ~120 €/Monat allein
an Gebühr.

**K4 — Kündigung und Lock-in.** Circle-Kündigung auf Trustpilot als *„like a
hostage negotiation"* und *„a trap designed to make you give up"* (sekundär).
Substack: über iOS gewonnene zahlende Abonnenten **nicht exportierbar**.
Patreon: der günstigere Alt-Gebührensatz ist **unwiderruflich weg**, sobald die
Seite einmal depubliziert wird. Skool: 100 $ je URL-Änderung.
**⇒ Chance:** „Datenexport inklusive" steht bereits in der Preis-Zeile, aber
als Nebensatz. Es ist der stärkste Gegensatz zu K4 und verdient eine eigene
FAQ-Antwort mit dem konkreten Format.

**K5 — Onboarding für Alleinarbeitende.** Mighty: *„as someone just starting
out, with no team, MN is a nightmare"*; ein migrierender Host beschreibt die
Admin-Erfahrung als *„NOT for solo entrepreneurs"*. Skool: *„The onboarding
experience does not really educate on where the designated places are to post
questions relating to how to grow a group."*
**⇒ Chance:** Pukalanis Zielgruppen — Coaches, Vereine, Creator — sind fast
alle Einzelpersonen. Die Checkliste aus E1 ist genau hierfür da.

**K6 — Support und Abrechnung.** Trustpilot: Substack ~1,4/5, Patreon ~1,2/5,
Skool ~1,9/5 (alle sekundär, Direktabruf blockiert). Das ist **kategorieweit**
— also keine Lücke, sondern eine Latte: wer hier normal ist, ist schon
überdurchschnittlich.

**K7 — Was auffallend SELTEN kritisiert wird.** Domain-Einrichtung und
Datenexport tauchen in Rezensionen kaum auf (einzige Fundstelle: ein
Mighty-Support-Thread, in dem die GoDaddy-Anleitung „confusing" genannt wird).
Das relativiert die Dringlichkeit der Domain-Politur: sie ist ein
Verkaufsargument und eine Gating-Frage, aber kein Absprungpunkt.

---

## 5. Empfehlungen für Pukalani

Sortiert nach Wirkung geteilt durch Aufwand. **Verdikt** = übernehmen /
anpassen / bewusst nicht. **Aufwand** in Repo-Konvention (S = Stunden,
M = ein Tag, L = mehrere Tage).

### E1 — Setup-Checkliste nach dem Wizard, höchstens fünf Punkte
**Verdikt: übernehmen · Aufwand: M**
Heute endet der Trichter auf `/start/done`, danach steht der Owner ohne Führung
in seiner Community — es gibt im Repo **keine Checkliste, keinen
Fortschrittsbalken im Dashboard, keine Musterinhalte**. Circle hat eine
eingebaute, Kajabi hat eine, Ghost hat eine mit veröffentlichten Zahlen
(26 % statt 7 % Abschluss; Theme-Anpasser konvertieren ~10× besser), Appcues
zieht die Grenze bei fünf Punkten. Vorschlag: *ersten Beitrag schreiben ·
Farbe und Logo setzen · ein Mitglied einladen · Startseite anpassen · Abo
abschließen*. Ghosts Daten legen **Branding vor Einladen** nahe. Platz: die
Dashboard-Startseite, nicht eine schwebende Blase.

### E2 — Der erste Zustand darf nicht leer sein
**Verdikt: übernehmen · Aufwand: M**
`O6` hat bereits die *Startseite aus der Beschreibung* gebaut — der Gedanke ist
da, nur nicht zu Ende geführt. Linear, Notion, Ghost, Circle und Mighty
befüllen alle. Konkret: ein Willkommens-Beitrag im Feed aus Name +
Beschreibung + **Kategorie** (Schritt 3 des Wizards wird heute nur gespeichert
und nie verwendet — die günstigste Zutat im Haus), sichtbar als Beispiel
markiert und mit einem Klick löschbar. NN/g: der leere Zustand soll *„direct
pathways… to getting started with key tasks"* zeigen.

### E3 — Eigene Domain ab Personal statt ab Pro
**Verdikt: anpassen (Entscheidung David) · Aufwand: S (Plan-Gate) · Wirkung: hoch**
Ghost gibt sie ab 18 $ auf jeder bezahlten Stufe, **Circle im Einstiegsplan
(89 $)**, Bettermode und coapp ab Starter, Mighty offenbar überall. Pukalani
sperrt sie hinter 149 € — die härteste Sperre im Feld außer Skool, das gar
keine anbietet. Für einen Verein oder Coach ist die eigene Adresse *der* Grund,
überhaupt zu zahlen; sie hinter dem Team-und-KI-Plan zu verstecken, verkauft
Pro an Leute ohne Team. Faires Gegenargument: die Domain kostet Betrieb
(Zertifikat, Origin, Prüflauf) und ist frisch gebaut. Kompromiss: Personal
bekommt **eine** eigene Domain, Pro beliebig viele.

### E4 — Preisseite: Vergleichstabelle unter die Karten, Jahresrabatt in Monaten
**Verdikt: übernehmen · Aufwand: S**
Alle Benchmark- *und* alle Wettbewerber-Preisseiten legen unter die Karten eine
Feature-Tabelle; Pukalani hat nur Karten mit Fließtext (`plans.personal.desc`
ist ein Satz mit sieben Merkmalen darin). Wer zwischen 29 € und 149 € schwankt,
will die Zeile „Eigene Domain" mit einem Häkchen sehen, keinen Absatz. Zweitens:
**−25 % sind drei Monate geschenkt** — in Monaten erzählt wie bei Skool und
Mighty, und rechnerisch großzügiger als deren „2 Months Free". Drittens ein
Anstandsvorteil, den man ausspielen darf: Circle zeigt **nur** den Jahrespreis;
Pukalanis Umschalter zeigt beide.

### E5 — Wizard: drei Pflichtschritte, der Rest nach dem ersten Erfolg
**Verdikt: anpassen (nicht streichen) · Aufwand: M**
Sechs Antworten vor dem ersten Wert — gegen Mightys **eine Frage** und Circles
einen Fragebogen. Vorschlag: **Pflicht = Name/Adresse · Kategorie · Vibe**
(beide formen den ersten Zustand aus E2, tragen also unmittelbar). **Größe,
Zweck, Ziel und Beschreibung wandern hinter den Aha** — als zwei Punkte der
Checkliste aus E1 oder als Karte im Dashboard („Hilf uns, Pukalani zu
schärfen"). Das Produkt-Signal geht nicht verloren, es kommt später und von
Leuten, die schon investiert sind. Der Fortschrittsbalken mit Zahl bleibt — er
ist gut gebaut, und NN/g belegt, dass sichtbarer Fortschritt die Geduld etwa
verdreifacht.

### E6 — Domain-Seite: CAA-Prüfung, Registrar-Anleitungen, TTL-Hinweis, automatisches Nachprüfen
**Verdikt: anpassen · Aufwand: M**
Der manuelle „Prüfen"-Knopf bleibt — Circle, Mighty, Bettermode und Heartbeat
machen es genauso. Vier Ergänzungen, alle abgeschaut:
1. **CAA-Prüfung im „Prüfen"-Lauf.** Circle erkennt selbst, ob ein CAA-Eintrag
   fehlt, und fordert ihn gezielt nach; Vercel nennt fehlende CAA-Records als
   häufigste Ursache eines fehlgeschlagenen Zertifikats. Kleiner Eingriff,
   große Wirkung — und er trifft genau den Zustand `pending_cert`.
2. **Anleitungen je Registrar** (Ghost, Discourse mit 12+, Circle mit 15,
   Framer mit 6). Für Deutschland: IONOS, Strato, United Domains, Hetzner,
   Cloudflare — eine Textliste, kein Bau.
3. **Der TTL-Rat vor dem Umzug** (*„lower the TTL (for example 60 seconds)"*) —
   der praktischste Satz im ganzen Feld, kostet eine Zeile.
4. **Automatisches Nachprüfen, solange die Seite offen ist** (alle 15–30 s).
   Kein Hintergrund-Job, kein Versprechen — es erspart nur das Klicken beim
   Warten. Heartbeats „Domain not working?" ist die ehrliche Variante.
Später und optional: **Entri** als Ein-Klick-Pfad einkaufen.

### E7 — Social-Login (Apple/Google) — mit erklärter Haltung
**Verdikt: anpassen · Aufwand: M**
Pukalani ist der einzige im Vergleich ohne, und hat zusätzlich das
Einladungs-Tor davor. Circle, Mighty (vier Anbieter), Bettermode, Patreon,
Discourse und Linear haben es. Der Gate-Code ist vorgesehen
(`pukalani.auth.providers`, heute `[]`) — es ist eine Aktivierungs- und
Datenschutzentscheidung, keine Architekturfrage. **Zwei Dinge dazu:** Erstens
braucht ein Google-Knopf unter dem Versprechen „kein Werbe-Tracking" eine
erklärte Haltung (Apple/Passkeys statt Google, oder eine ehrliche Zeile, was
wohin fließt). Zweitens die Falle, die Circle dokumentiert: dort schaltet eine
eigene Kundendomain den Social-Login für die Mitglieder **dauerhaft ab**. Wer
das einbaut, muss es für Mandanten-Hosts von Anfang an mitdenken — sonst
verspricht man ein Merkmal, das genau den Kunden fehlt, die am meisten zahlen.

### E8 — Einstellungen: Suchfeld und ein Schnitt durch die 27 Sidebar-Einträge
**Verdikt: anpassen · Aufwand: M**
27 Einträge in sieben Gruppen, davon eine mit neun und **drei mit je einem**
(„website", „studio", „branding" sind keine Gruppen, sondern Zeilen). Skool
kommt mit sechs Reitern aus, Mighty mit elf flachen Kategorien. Ghost hat bei
dieser Größe umgebaut und ein **globales Suchfeld** ergänzt; Linear filtert die
Navigation zusätzlich nach Rechten. Zwei Schritte: (a) Suchfeld über die
vereinigte Menge aus Sidebar + Community-Reitern + Konto-Reitern; (b) einmal
durchgehen, welcher Eintrag ein *Produkt* und welcher eine *Einstellung* ist.

### E9 (kleiner Zusatz, hohe Rendite) — die Gebühren-Rechnung auf `/vs/*` und `/wechseln`
**Verdikt: übernehmen · Aufwand: S**
Ein kleiner Rechner oder auch nur eine Tabelle: „300 Mitglieder à 20 €/Monat" ⇒
Circle 2 % + Stripe, Skool 2,9 %, Heartbeat 5 %, coapp 15 % — **Pukalani 0 %**.
Mighty macht genau das auf seiner eigenen Startseite (Umsatzrechner ganz oben)
und beweist damit, dass die Zielgruppe so rechnet. Es ist die einzige Zahl, die
K3 in ein Verkaufsargument verwandelt.

### Bewusst NICHT

- **Transaktionsgebühr einführen.** Der meistkritisierte Mechanismus im Feld
  (K3), und er würde den einen Satz zerstören, der Pukalani unterscheidet.
  Auch bei F7 (bezahlte Communities) ist Stripe Connect die Frage, nicht die
  Marge — und die Messlatte dort ist Skools **Merchant-of-Record-Modell inkl.
  EU-Umsatzsteuer**, nicht der Prozentsatz.
- **Preis pro Mitglied.** Dieselbe Begründung. Circle, Mighty und Skool werben
  aktiv mit „Unlimited members".
- **Produkttour, Tooltips, Coachmarks.** NN/g: Tutorials *„don't result in
  better task performance"*, mobil *„make them perceive the tasks as more
  difficult"*. Die Checkliste (E1) ist die belegte Alternative, nicht die
  Vorstufe einer Tour.
- **Kreditkarte in der Testphase.** Das ganze Feld verzichtet; nur Kajabi
  nicht, und es wird dafür kritisiert. Die kursierenden Zahlen zur höheren
  Konversion mit Karte streuen zwischen 30 % und 60 % und sind **nicht primär
  belegt**.
- **Ein dritter „Köder"-Plan zwischen Personal und Pro.** Der Decoy-Effekt gilt
  als schlecht repliziert (*„mostly disappeared once realistic stimuli were
  used"*). Zwei Pläne plus Studio sind eine Haltung; ein dritter wäre ein Trick.
- **KI-generiertes Setup wie Mightys Co-Host.** Reizvoll, aber es erzeugt Logo,
  Bildwelt und Marketingtexte — also genau die Sorte Inhalt, für die Pukalani
  eine Claim-Disziplin hat (die `earlyAccess`-Kennzeichnung im Wizard zeigt,
  dass hier nichts versprochen wird, was nicht steht). Die 6 Vibes sind der
  ehrlichere Weg zum selben Ziel.
- **Einstellungen im Modal** (Notions Weg) und **Basic als Gratisplan
  wiederbeleben** (Discourses Weg). Ersteres ist die schlechtere Form,
  Letzteres die Rücknahme der F49-Entscheidung — der Bericht liefert für
  beides kein Argument.

---

## 6. Wo Pukalani schon vorn liegt

**V1 — Das Preismodell ist im Feld einzigartig sauber.** Keine
Transaktionsgebühr, kein Preis pro Mitglied, kein Aufpreis für das Entfernen
fremden Brandings, **Monats- und Jahrespreis beide sichtbar**, und der Endpreis
**inklusive MwSt. direkt am Betrag**. Danebengelegt: Skool 10 % bzw. 2,9 %
(ab 900 $ 3,9 %), Circle 2 % *plus* Stripe *plus* 99 $ für E-Mail, Mighty 2 %,
Heartbeat 5 %, Substack und Patreon je 10 %, der deutsche Nachbar coapp **15 %**
im Einstieg — und coapp nennt netto. Bei 500 zahlenden Mitgliedern verlieren
Kunden anderswo 8–14 % ihres Umsatzes an die Plattform.

**V2 — Von der Entscheidung zur laufenden Community in Sekunden.** Median
**0,3 s** über zehn unbeaufsichtigte Läufe, danach ein Handoff-Token, mit dem
man auf dem eigenen Host **eingeloggt** ankommt. Danebengelegt: Skool
verspricht „less than 30-minutes" (Dritte messen 30–90), Kajabi-Nutzer
berichten ~2 Stunden, Hivebrite hat eine durchschnittliche Einführungsdauer von
**4 Monaten**. Den Handoff macht kaum jemand richtig — bei Substack und Ghost
landet man auf einer Subdomain, aber das nahtlose Eingeloggt-Ankommen über eine
Cookie-Grenze hinweg ist eigene Ingenieursarbeit.

**V3 — Aussehen ist ab dem ersten Plan echt, nicht kosmetisch.** 26×11
Theme-Katalog, eigene Schriften, Ramp aus einer Basisfarbe, „Vibe" als
Wizard-Schritt **bevor** die Community existiert. Dagegen die belegte Kritik am
Feld: Circle *„Only comes with one template making all Circle communities look
very homogenous"*, Mighty *„branding capabilities are very subpar"*, Bettermode
*„Customization is limited to colors and graphics"* — und das Entfernen des
Fremd-Brandings kostet bei Circle 199 $, bei Bettermode 1.500 $. Pukalanis
stärkster unbeanspruchter Verkaufsraum.

**V4 — DSGVO und deutsches Hosting sind eine echte Lücke, keine Fußnote.** Im
deutschen Vergleichsartikel weist **nur coapp** ausschließliches EU-Hosting
aus; bei allen anderen steht „Nicht öffentlich als ausschließlich EU-basiert
ausgewiesen". Pukalani führt es bereits im Hero — und hat mit dem cookiefreien
Besucherzähler und dem fehlenden Werbe-Tracking die Substanz dahinter.

**V5 — Die Testphase ist besser als der Standard, obwohl sie gleich aussieht.**
14 Tage ohne Kreditkarte ist Feldstandard — aber Pukalani gibt in dieser Zeit
**Pro**, und danach wird **nichts gelöscht**: die Community wird nur-lesend und
öffnet sich mit dem ersten Abo sofort wieder. Gegen Mightys *„we are stuck with
an annual fee for a product we are no longer using"*, Circles Kündigungs-Ruf
und Skools 100 $ je URL-Änderung ist das ein Argument, das heute nirgends steht.

**V6 — Die Einstellungs-Zweiteilung ist schon die richtige.** Konto vs.
Community, volle Seiten statt Modal, Alt-Pfade mit 301 — genau Linears und
Vercels Form. Der Wizard erfüllt außerdem **alle fünf NN/g-Wizard-Regeln**
(Schritt in der URL, Zustand gespeichert, Zurück-Taste, lineare Ordnung, in
sich geschlossene Schritte); im Feld ist das sonst nirgends nachweisbar.

**V7 — Der Wizard prüft das Tor VOR dem Ausfüllen.** Der Kommentar im Code sagt
es besser als jeder Benchmark: sieben Schritte auszufüllen und dann abgewiesen
zu werden, wäre die schlechteste mögliche erste Erfahrung. Diese Sorgfalt
findet man bei den 400-$-Anbietern nicht durchgängig.

**V8 — Keine versteckten Voreinstellungen zu Lasten des Kunden.** Skools
„Growth Boost" ist standardmäßig AN, Circles Monatspreis erscheint erst an der
Kasse, Skools 3,9 %-Stufe steht im Kleingedruckten. Pukalani hat nichts
Vergleichbares — das ist keine Funktion, aber es ist Vertrauen, und in einer
Kategorie mit Trustpilot-Werten um 1,2 bis 1,9 ist es viel wert.

---

## 7. Vorbehalte zur Belastbarkeit

- **Direkt abgerufen und belastbar:** die Preisseiten von Circle, Mighty,
  Skool, Heartbeat, Bettermode, Discourse, Ghost, Kajabi, Notion, Linear,
  Framer, Vercel, coapp, Heylo; Mightys und Circles Domain-Hilfeartikel;
  Skools Gebühren- und URL-Artikel; alle NN/g-Zitate; Ghosts Onboarding- und
  Settings-Changelogs; Discourse Meta; die Capterra-Zitate mit Namen und Datum;
  Substacks 3-Schritte-FAQ.
- **Nur über Sekundärquellen, vorsichtig zu behandeln:** die
  Trustpilot-Bewertungen (Direktabruf 403), Kajabis exakte Testphasenlänge (die
  eigene Seite widerspricht Dritten), Skools Kreditkartenpflicht beim Trial,
  Circles Signup-Schrittfolge, Mightys Domain-Verfügbarkeit auf allen Stufen
  (aus der Tabellenformatierung geschlossen, nicht ausgeschrieben), Webflows
  aktuelle A-Record-IPs.
- **Ausdrücklich unbestätigt und nicht als Entscheidungsgrundlage geeignet:**
  „drei Stufen konvertieren 1,4× besser als zwei"; die konkreten
  Konversionszahlen für Trials mit vs. ohne Kreditkarte (Quellen streuen
  30–60 %); die Zahl, dass 39 % der Anbieter wertbasiert bepreisen. Der
  Decoy-Effekt gilt als schlecht repliziert und taugt nicht als
  Gestaltungsprinzip.
- **Preise sind Tagesware.** Discourse hat im Juli 2026 einen Gratisplan
  eingeführt, Kajabi Anfang 2026 seinen Einstiegsplan gestrichen, Patreon im
  August 2025 sein Gebührenmodell umgestellt, Skool führt inzwischen zwei
  Stufen statt einer, Mightys eigene Preisseite trägt zwei widersprüchliche
  Plan-Benennungen. Vor einer Preisentscheidung noch einmal nachsehen.
