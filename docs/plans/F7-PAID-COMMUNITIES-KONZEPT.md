# F7 — Bezahlte Mitgliedschaften: Konzept und Entscheidungsvorlage

**Status:** NICHT gebaut · **Sorte:** Konzept + Entscheidungsvorlage, kein
Umsetzungsplan · **Erstellt:** 2026-08-15 · **Wartet auf:** A2 (Stripe live)

> Diese Datei liegt in `docs/plans/`, weil noch nichts davon existiert. Sie
> enthält BEWUSST keine Häkchen-Liste: zuerst müssen vier Fragen (Abschnitt 7)
> beantwortet sein, danach entsteht der Umsetzungsplan. Offene Punkte gehören
> weiter ausschließlich in [OPEN-ITEMS.md](../OPEN-ITEMS.md) (Zeile F7) — nicht
> hierher.

## Verhältnis zu F7-PAYMENTS-CONNECT

[F7-PAYMENTS-CONNECT.md](F7-PAYMENTS-CONNECT.md) (2026-08-01) ist die
Entscheidungsvorlage für **Einmalkäufe** — Event-Tickets und Kurse — und für
das Connect-Fundament darunter. Es führt die wiederkehrende Mitgliedschaft als
Etappe 4 auf, nennt sie **XL** und vertagt sie ausdrücklich („Erst nach Etappe 3
diskutieren").

Dieses Dokument holt genau diese Etappe nach, und es kommt in zwei Punkten zu
einem **anderen** Ergebnis als das Vorgängerdokument. Beide sind belegt, beide
stehen unten mit Quelle:

1. **Die Mitgliedschaft ist architektonisch die EINFACHSTE der drei Etappen,
   nicht die schwerste** — weil ihr Zielobjekt bereits dort liegt, wo der
   Stripe-Webhook ankommt (§ 3.3).
2. **Die Empfehlung „Express + direct charges" ist so nicht haltbar.** Stripe
   empfiehlt direct charges ausdrücklich für Konten MIT vollem Dashboard und
   destination charges für Express — und daran hängt eine Restriktion, die
   Pukalani sonst den Bau einer kompletten Abo-Verwaltung für fremde Endkunden
   aufbürdet (§ 2.2).

Was aus dem Vorgängerdokument **unverändert gilt** und hier nicht wiederholt
wird: die Rechts-Checkliste für Anwalt und Steuerberater (§ 6 dort), die
Anbieter-Naht für einen späteren zweiten Zahlungsdienst (§ 4 dort), und die
ZAG-/PSD2-Begründung, warum Pukalani Geld niemals selbst durchleiten darf.

---

## 1. Marktbild — was die Konkurrenz TATSÄCHLICH tut

> **Quellenlage, ehrlich:** die Zahlen sind am 2026-08-15 an den Preisseiten und
> Help-Centern der Anbieter erhoben. Vier Help-Center (Patreon, Substack,
> Discord, Circle) antworten bei direktem Abruf mit 403 — dort stammt die Zahl
> aus einem Suchergebnis-Snippet derselben Domain und ist **nicht am Volltext
> geprüft**. Die Vorgänger-Recherche vom 2026-08-01 lief über Vergleichsseiten
> und ist an drei Stellen dadurch überholt (§ 1.3).

### 1.1 Die Tabelle

| Anbieter | Owner zahlt | Provision auf Mitglieds-Zahlungen | PSP obendrauf? | Merchant of Record |
|---|---|---|---|---|
| **Skool** | $9 (Hobby) · $99 (Pro) | 10 % + $0,30 · **2,9 % + $0,30** (bis $899), 3,9 % darüber | **nein, enthalten** | **Skool** |
| **Circle** | $89 / $199 / custom | 2 % / 1 % / 0,5 % | ja | Owner |
| **Patreon** | $0 | 10 % (Standard seit 04.08.2025) | ja | **Patreon** |
| **Mighty Networks** | $79 / $179 / custom | 2 % / 1 % / 0,5 % | ja | Owner |
| **Substack** | $0 | 10 % | ja | nicht belegt |
| **Kajabi** | ab $179 | 2,9 % + $0,30 (eigener PSP) | enthalten | nicht belegt |
| **Podia** | $42 / $84 / $150 | 5 % / 0 % / 0 % | ja | Owner |
| **Ghost Pro** | ab $18 | **0 %** | ja | Owner |
| **Discord** | $0 | 10 % | unklar | nicht belegt |

**Die Spalte, auf die es ankommt, ist die vorletzte.** Nur bei Skool und Kajabi
ist die genannte Provision die Gesamtbelastung. Überall sonst kommt der
Zahlungsdienstleister obendrauf: Circle Professional landet real bei rund
4,9 %, Substack bei rund 13,6 % + $0,30.

### 1.2 Zwei Philosophien, und die Grenze verläuft nicht beim Prozentsatz

- **MoR + EINE sichtbare Zahl** (Skool, Patreon): die Plattform ist Verkäufer,
  zieht die Umsatzsteuer selbst ein und führt sie ab. Der Owner sieht einen
  Satz und muss nichts über OSS wissen.
- **Owner-PSP + Plattform-Aufschlag** (Circle, Mighty, Podia, Ghost): billiger,
  aber der Owner ist Verkäufer — mit allem, was in der EU daran hängt.

Kein einziger Anbieter im Feld hat eine flache Provision über alle Pläne. Die
Staffelung ist überall das Upgrade-Argument — diese Beobachtung aus dem
Vorgängerdokument ist durch die neue Erhebung bestätigt.

### 1.3 Drei Korrekturen an der Recherche vom 2026-08-01

1. **Skool ist Merchant of Record — belegt, nicht vermutet.** Das Help Center
   sagt es wörtlich und nennt Skool eine *„qualifying platform and
   marketplace"*, die für das Einziehen und Abführen der EU-Umsatzsteuer
   zuständig ist. Der Owner braucht keine eigene EU-Registrierung. Die alte
   Notiz („widersprüchlich → prüfen") ist damit aufgelöst.
2. **Skools Steuer-Mechanik schont den Owner.** Die Umsatzsteuer wird auf den
   Preis AUFGESCHLAGEN, nicht herausgerechnet: $100 in Deutschland heißt, das
   Mitglied zahlt $119 und der Owner behält seine $100-Basis.
3. **„Ein Preis je Community" ist überholt.** Skool kennt heute fünf Modelle —
   Free, Subscription, **Freemium**, **Tiers** und **Einmalzahlung** — und
   Freemium erlaubt ausdrücklich einen freien UND einen bezahlten Plan in
   derselben Gruppe. Der V1-Schnitt in § 6.1 ist deshalb eine bewusste
   Verengung gegenüber dem Benchmark, keine Abbildung davon.

### 1.4 Zwei Dinge, die Skool schlechter kann als wir

- **USD-only.** *„All subscription prices on Skool are in USD."* Für einen
  DACH-Zielmarkt ist das ein realer Nachteil, kein Detail.
- **Niemand dokumentiert das Ende.** Für KEINEN Anbieter ließ sich an einer
  Primärquelle belegen, wie lang die Kulanzfrist bei fehlgeschlagener Zahlung
  ist und was mit den Beiträgen eines gekündigten Mitglieds geschieht. Bei
  Skool schweigt der Kündigungsartikel dazu ausdrücklich. Belegt ist nur: das
  Mitglied wird zum ENDE des Abrechnungszeitraums entfernt, und bei einer
  Preisänderung behalten Bestandsmitglieder ihren Preis.

Das ist die Stelle, an der Pukalani schon heute weiter ist als der
dokumentierte Stand des Feldes: M13 hat für „was passiert, wenn nicht gezahlt
wird" eine ausformulierte Antwort, A5 eine für „kommt der Zugang von selbst
zurück" (nein). Beide sind gebaut und bewiesen. Das ist kein Werbeargument —
aber es ist der Grund, warum dieses Konzept die Endzustände zuerst beschreibt
und den Kauf danach.

---

## 2. Empfehlung

**Stripe Connect · Connected Account mit vollem Stripe-Dashboard · direct
charges · `application_fee_percent` als Plan-Hebel. Start EUR-only,
Owner-aktiviert, ganze Community bezahlt.**

Der Owner ist Verkäufer und Merchant of Record. Das ist Davids D1-Entscheidung
vom 2026-08-02 („kein Betreiber-als-Verkäufer"), und direct charges sind die
einzige Variante, in der das auch nach außen stimmt.

**Diese Empfehlung erfüllt die Skool-Messlatte NICHT, und das gehört an den
Anfang statt in eine Fußnote.** Die OPEN-ITEMS-Zeile zu F7 nennt als Messlatte
ausdrücklich *„Skools Merchant-of-Record-Modell inkl. EU-USt., nicht den
Prozentsatz"* — also genau das, was D1 ausschließt. Beides gleichzeitig geht
nicht. Das ist Entscheidungsfrage 1 (§ 7.1), und sie ist die einzige, die vor
allen anderen fallen muss.

### 2.1 Warum direct charges

- **Der Owner ist Verkäufer.** Bei destination charges ist laut Stripe
  ausdrücklich *„the platform is the merchant of record"*. Wer destination
  charges wählt, hat D1 damit aufgehoben — nicht als Nebenwirkung, sondern als
  Definition.
- **Destination charges sind für uns vermutlich gar nicht baubar.** Stripe
  verlangt für destination charges und für separate charges & transfers, dass
  Plattform und Connected Account **in derselben Region** liegen (Ausnahme:
  eine gesonderte Freigabe für grenzüberschreitende Auszahlungen). Pukalanis
  Anbieter sitzt in den USA, die Owner sitzen im DACH-Raum. Das ist kein
  Nachteil, den man abwägt, sondern womöglich ein Ausschlussgrund — **vor jeder
  Entscheidung für ein MoR-Modell über Connect zu prüfen** (§ 7.1, Option B).
- **Es kostet Pukalani nichts.** Bei direct charges mit „Stripe handles
  pricing" rechnet Stripe direkt mit dem Connected Account ab: keine
  Monatsgebühr je aktivem Konto, keine Auszahlungsgebühr für die Plattform. Das
  Gegenmodell („You handle pricing") kostet $2 je aktivem Konto und Monat plus
  0,25 % + 25¢ je Auszahlung.
- **Es hält das Risiko klein.** Chargebacks landen zuerst beim Verkäufer.

### 2.2 Warum volles Dashboard statt Express — die Korrektur am Vorgängerdokument

Das Vorgängerdokument empfiehlt Express und begründet es mit der niedrigeren
Einstiegshürde. Das Argument ist richtig, aber es übersieht eine Restriktion,
die Stripe wörtlich nennt:

> *„Only connected accounts with access to the full Stripe Dashboard can manage
> their customers' subscriptions. For other connected accounts, the platform
> must manage their customers' subscriptions."*

Im Klartext: mit Express-Konten müsste **Pukalani** die Abos der Mitglieder
verwalten — Kündigung, Zahlungsmethoden-Wechsel, Portal, Mahnwesen. Für fremde
Endkunden, in fremdem Namen, ohne einen Vertrag mit ihnen zu haben. Das ist
kein Feld in einer Maske, das ist ein zweites Produkt. Mit vollem Dashboard
verwaltet der Owner seine Abos selbst und seine Mitglieder bekommen Stripes
eigenes Kundenportal — gebaut, gepflegt und übersetzt von Stripe.

Dazu kommt die Steuer: bei Konten OHNE volles Dashboard *„must build an
interface"* die Plattform, um Steuersitz und Registrierungen zu setzen (oder
Connect embedded components einbinden). Mit vollem Dashboard macht der Owner
das im Stripe-Dashboard selbst.

Und Stripe empfiehlt genau diese Paarung: *„Direct charges are recommended for
connected accounts with access to the full Stripe Dashboard"*, während
destination charges für Express und Custom empfohlen werden.

**Der Preis dieser Wahl, offen benannt:** die Einstiegshürde ist höher. Der
Owner legt ein vollwertiges Stripe-Konto an. Das Vorgängerdokument nennt genau
das als Abbruchgrund, und es hat damit recht — nur ist die Alternative nicht
„einfacher", sondern „einfacher für den Owner und erheblich teurer für uns".
Circle, der nächste Verwandte im Benchmark, verlangt dieselbe Hürde.

Abgefedert wird sie durch das **Onboarding**, nicht durch den Kontotyp: Stripe
bietet gehostetes und eingebettetes Onboarding an, beide führen durch
Identitätsprüfung und Bankverbindung. Der Owner klickt in *Settings → Payments*
und kommt mit `charges_enabled: true` zurück.

### 2.3 Zwei Dinge, die sich seit dem 2026-08-01 geändert haben

- **Accounts v2 ist die Empfehlung für Neueinsteiger.** Stripes eigener Text:
  *„If you're a new Connect user, use the Accounts v2 API instead."* Die
  Begriffe Standard/Express/Custom sind die v1-Sprache; in v2 setzt man
  Eigenschaften einzeln zusammen (Onboarding, Dashboard-Zugang, wer für
  Negativsalden haftet). Dieses Dokument benutzt weiter die alten Namen, weil
  sie gemeinter sind — aber **beim Bau ist v2 der Einstieg**, nicht v1.
- **Stripe kann die Negativsaldo-Haftung übernehmen.** Für Software-Plattformen
  nennt Stripe das *„the best default choice"*. Das entschärft den Punkt, den
  das Vorgängerdokument als reales Betreiberrisiko in die Rechts-Checkliste
  geschrieben hat (Nr. 10) — es beseitigt ihn nicht, aber es ist ein Schalter,
  über den man vor dem Bau entscheiden kann statt danach.

**Eine Falle, die man nur einmal stellt:** der Dashboard-Typ eines Connected
Accounts ist **unveränderlich**. *„To change a connected account's dashboard,
you must create a new Account object."* Wer mit Express startet und später auf
volles Dashboard will, migriert jeden Verkäufer einzeln — samt seiner laufenden
Abos. Das ist der eigentliche Grund, diese Entscheidung vor dem ersten Kunden
zu treffen und nicht danach.

### 2.4 Die Provision steht bereits fest

David hat am 2026-08-02 entschieden: **Basic verkauft gar nicht · Personal 2 %
· Pro 0 %.** Aktivieren dürfen Owner ab Personal. Das ist keine offene Frage
mehr und wird hier nicht neu aufgemacht.

Technisch trägt `application_fee_percent` das: ein Dezimalwert zwischen 0 und
100 mit höchstens zwei Nachkommastellen, den Stripe einmal je Abrechnungsperiode
vom Rechnungsbetrag abzieht — **vor** den Stripe-Gebühren. Ein fester Betrag je
Abo geht ausdrücklich nicht (*„You can't set a subscription's recurring
application fee as a flat amount"*), was hier gelegen kommt: die Provision ist
ohnehin prozentual gedacht.

**Zwei Fallen aus der Stripe-Doku, die in den Bau gehören:**

- `application_fee_percent` greift **nicht** auf Rechnungen außerhalb des
  normalen Abrechnungslaufs — etwa auf Proration bei einem Plan-Wechsel. Dort
  braucht es einen expliziten `application_fee_amount`.
- **Bei einer Trennung läuft die Provision weiter.** Trennt sich ein Owner von
  der Plattform, kassiert Pukalani bei direct charges weiter mit, bis der Wert
  entfernt wird. Stripe sagt ausdrücklich, man solle ihn vorher entfernen. Eine
  Provision, die nach dem Ende der Geschäftsbeziehung weiterläuft, ist kein
  Detail, sondern ein Rückforderungsanspruch.

---

## 3. Entitlements-Design — was eine bezahlte Mitgliedschaft im BESTEHENDEN Bau ist

### 3.1 Die eine Frage, an der alles hängt: wie viele Publiken hat eine Community?

Appwrite kennt nur ODER-Rollen. Das Lese-Publikum einer Community ist heute
GENAU EIN Label: `read("label:<communityId>")`, vergeben an den, der eine
`community_members`-Zeile mit Zugang hat (A5). Daraus folgen zwei — und nur
zwei — Bauformen:

**(a) Die Community ist die Bezahlschranke.** Ein Publikum bleibt ein Publikum.
Bezahlt wird der EINTRITT; wer nicht zahlt, ist kein Mitglied. Am
Publikums-Modell ändert sich nichts, die Zahlung wird zur weiteren Art, wie
eine Mitgliedschaft entsteht.

**(b) Zwei Publiken in einer Community.** Ein zweites, ABGELEITETES Label neben
dem Mitglieder-Label — exakt die Bauart des Moderations-Labels
(`mod<communityId>`, `core/shared/communityModeratorLabel.ts`): abgeleitet aus
der communityId, nie gespeichert, vergeben und eingezogen von derselben
Middleware. Ein `pay<communityId>` wäre 23 Zeichen und damit innerhalb der
Appwrite-Grenze von 36 — technisch belegt, nicht spekuliert.

V1 baut (a). Die Begründung steht in § 6.1, weil sie eine Abgrenzung ist.

### 3.2 Zahlung als weiterer Beitritts-Auslöser

`core/shared/communityJoin.ts` kennt heute `registration`, `contribution` und
die Bestands-Übernahme `legacy`. Die bezahlte Mitgliedschaft fügt genau einen
Auslöser hinzu — `purchase` — und ändert sonst nichts:

- `decideJoin` (`packages/control/shared/communityTeam.ts`) bekommt einen
  Zweig: ist die Community kostenpflichtig, führen `registration` und
  `contribution` NICHT mehr zur Mitgliedschaft. Man wird durch Zahlung
  Mitglied, nicht durch Tippen.
- Die Rolle bleibt `COMMUNITY_JOIN_ROLE = 'viewer'`. Eine sechste Rolle
  „zahlendes Mitglied" wäre ein zweiter Name für dieselbe Sache — dieselbe
  Begründung, mit der A5 die Rolle „member" abgelehnt hat. Ob jemand ZAHLT, ist
  keine Rollenfrage, sondern eine Vertragsfrage.

### 3.3 Warum das Ende der Zahlung ohne neue Naht wirkt

Der Stripe-Webhook läuft auf `apps/control` — dem einzigen Deployment mit
Stripe-Schlüssel (`apps/platform` bindet `packages/billing` bewusst nicht ein).
Bei Event-Tickets ist das ein Problem: die Ticket-Zeile liegt im
Runtime-Projekt, also braucht es eine Fulfillment-Naht control → platform
(F7-PAYMENTS-CONNECT § 3.2 — der Grund, warum die Events-Hälfte M ist und
nicht S).

Bei der MITGLIEDSCHAFT entfällt genau dieser Aufwand, denn `community_members`
liegt bereits im Control Plane (control-015). Der Webhook schreibt in seine
EIGENE Tabelle. Und das Lese-Publikum zieht von selbst nach:

> `core/server/middleware/06.community-label.ts` — trägt jemand das Label, hat
> aber keine gültige Mitgliedschaft, ruft die Middleware `joinCommunity(event,
> 'legacy')`; ist die Zeile entzogen, wird das Label eingezogen. Diese
> Selbstheilung ist schon gebaut: sie ist die A5-Antwort auf „kommt der Zugang
> beim nächsten Besuch zurück?" — nein.

Das Control Plane braucht damit **keinen Pool-Schlüssel**, um jemanden
auszusperren. Dieselbe Grenze, an der sich `revokeCommunityLabel` (A5) und die
Zahlungswarnung (C15) stoßen und die dort je eine eigene Konstruktion nötig
machte, ist hier bereits umschifft.

**Der Preis, ehrlich benannt:** die Wirkung tritt nicht in der Sekunde des
Webhooks ein, sondern beim nächsten Request auf dem Community-Host, plus 30 s
Rollen-Cache. Für ein Abo, das zum Periodenende ausläuft, ist das folgenlos —
für eine Rückerstattung, die sofort wirken soll, nicht (§ 5.4).

### 3.4 Was M13 beisteuert — und was NICHT übernommen wird

M13 (`core/shared/communitySuspension.ts`) hat für den Zahlungsverzug EINER
COMMUNITY die Antwort „nur-lesend statt Rauswurf" gefunden. Für ein zahlendes
MITGLIED ist dieselbe Antwort falsch: eine bezahlte Community, deren Inhalte
ein Nichtzahler weiterlesen darf, verkauft nichts. Übernommen wird deshalb die
FORM, nicht der Wert:

- **Übernommen:** die Trennung von „DASS" und „WARUM" (der Abgewiesene erfährt
  die Tatsache über `error.data.reason`, den Grund nur, wer ihn angeht), der
  pure, unit-getestete Regelkern ohne h3/Appwrite, und die Kulanzfrist als
  benannte Konstante statt als verstreute Zahl.
- **Nicht übernommen:** der Lesemodus. Endet die Zahlung, endet die
  Mitgliedschaft — Inhalte bleiben liegen, der Zugang nicht.

### 3.5 Was mit den Beiträgen eines ausgetretenen Zahlers passiert

Nichts. `community_members` LÖSCHT nie (control-019): die Zeile bleibt als
positive Tatsache stehen, Inhalte und Namen bleiben, und die Ansicht
„Ehemaliges Mitglied" greift wie bei jedem anderen Austritt. Das ist bereits
entschieden und wird von der Bezahlung nicht berührt — im Benchmark hat dazu
kein einziger Anbieter eine dokumentierte Antwort (§ 1.4).

---

## 4. Datenmodell

### 4.1 Die Arbeitsteilung: Vertrag ≠ Zugang

Zwei Fragen, zwei Orte — dieselbe Trennung, die A6 zwischen den
Abo-Zeilen und `communities.plan` schon zieht:

| Frage | Wo sie beantwortet wird | Wer sie liest |
|---|---|---|
| **Darf diese Person hinein?** | `community_members.status` (bestehend) | Rollen-Resolver, Label-Middleware — im HEISSEN Pfad, bei jedem Request |
| **Welcher Vertrag steht dahinter?** | `member_subscriptions` (**neu**) | Der Webhook, die Owner-Ansicht, die Rechnungshistorie |

Der Webhook übersetzt die zweite Frage in die erste. **Damit ändert sich am
Heißpfad nichts**: keine zweite Abfrage bei der Rollen-Auflösung, kein neues
Feld, das ein Leser vergessen könnte. Wer heute `hasCommunityAccess(status)`
fragt, fragt morgen dasselbe.

### 4.2 `community_members` — eine Tür, die schon offensteht

`COMMUNITY_MEMBER_STATUSES` enthält seit control-015 den Wert **`suspended`**,
und er wird heute nirgends geschrieben. Er passt ohne eine einzige Änderung:

- `hasCommunityAccess()` lässt nur `'active'` durch ⇒ der Zugang endet.
- `decideJoin()` gibt für jede Zeile ohne Zugang `outcome: 'removed'` zurück
  ⇒ ein Nichtzahler kommt NICHT über `contribution` zurück, sondern nur über
  eine neue Zahlung.
- Die Zeile bleibt stehen ⇒ Inhalte, Namen und „Ehemaliges Mitglied" bleiben.

Der Unterschied zu `'removed'` ist die ABSICHT und damit der Satz, den die
Oberfläche sagt: `removed` heißt „der Owner hat dich entfernt", `suspended`
heißt „deine Zahlung fehlt".

**Eine Ehrlichkeits-Notiz:** `decideJoin` bildet heute beide auf denselben
Outcome `'removed'` ab. Für die Anzeige braucht es deshalb einen eigenen
Outcome-Wert — sonst liest ein Nichtzahler „Zugang entzogen", und das stimmt
nicht.

**Nicht dazuerfunden:** eine sechste Rolle, ein `paid`-Flag auf der
Mitgliedschaft, ein zweites Publikums-Label. Alle drei wären Wege, dieselbe
Tatsache ein zweites Mal zu speichern.

### 4.3 `member_subscriptions` (neu, Control Plane)

Warum eine eigene Tabelle und keine Spalten an `community_members`: eine
Mitgliedschaft ist ein Zugang, ein Abo ist ein Vertrag mit eigener Lebensdauer.
Es kann enden, ohne dass die Zeile verschwindet; es kann mehrere nacheinander
geben; Rückerstattungen und Perioden brauchen mehr als ein Feld. Und der
Read-only-Key der Runtime läse sonst bei JEDER Rollen-Auflösung Zahlungsdaten
mit. Derselbe Grund, aus dem der Kommentar an `TenantRow.billingStatus` steht:
*„Geldfluss 2 (F7) kommt später DANEBEN, nie hinein."*

| Spalte | Zweck |
|---|---|
| `communityId` | = `communities.$id` |
| `runtimeProjectId` + `runtimeUserId` | dasselbe Anker-Tripel wie `community_members` |
| `stripeSubscriptionId` | der Vertrag auf dem **Connected Account des Owners** |
| `stripeCustomerId` | der Käufer-Customer — gehört dem Connected Account, nicht Pukalani |
| `status` | Stripe-Statusraum 1:1 (B3-Regel: nie eine eigene Übersetzung erfinden) |
| `currentPeriodEnd` | bis wann bezahlt ist |
| `cancelAtPeriodEnd` | gekündigt, läuft aber noch |
| `priceAmount` / `currency` / `interval` | was tatsächlich gezahlt wird (Anzeige + Historie) |

Unique-Index auf dem Tripel {communityId, runtimeProjectId, runtimeUserId} —
eine laufende Mitgliedschaft je Person und Community. Der Index ist
**tenant-relativ** und braucht deshalb `communityId` (Pool-Unique-Regel); ein
Index über `stripeSubscriptionId` allein wäre global eindeutig, beantwortet
aber die falsche Frage („welches Abo?" statt „zahlt diese Person hier?").

**Anlage NUR über die Index-Fabrik** `createIndexSteps` aus
`scripts/migrations-lib/indexRetry.mts` — rohes `createIndex` verbietet ESLint,
und der Metadaten-Cache-Anstoß gehört in die Schnittstelle, nicht in die
Disziplin.

### 4.4 `communities` — zwei additive Spalten, kein drittes Geld-Feld

- `memberPriceAmount` (Ganzzahl, Cent) — `0` = die Community ist kostenlos.
  **Cent als Ganzzahl, nie Fließkomma im Geldpfad** (dieselbe Regel, mit der
  das Vorgängerdokument die Provision in Basispunkten führt).
- `memberPriceInterval` — `'monthly' | 'yearly' | ''`.

Was hier BEWUSST nicht steht: die Provision (die gehört an den Plan, nicht an
die Zeile), der Connect-Account (`connectAccountId` kommt aus derselben
Vorstufe, F7-PAYMENTS-CONNECT § 3.3), und irgendetwas neben `billingStatus`.
Geldfluss 1 (die Community zahlt an Pukalani) und Geldfluss 2 (das Mitglied
zahlt an den Owner) teilen sich keine einzige Spalte.

**Folge, die man kennen muss:** `createRow<TenantRow>` verlangt ALLE Spalten
explizit. Zwei neue Spalten heißen zwei Entscheidungen an BEIDEN Anlegestellen
(`packages/control/server/api/control/tenants/index.post.ts` und
`packages/control/server/utils/onboardingProvision.ts`) — und die Migration
muss VOR dem Code-Deploy laufen, sonst bricht das Anlegen einer Community.

---

## 5. Die Flüsse

### 5.1 Kauf

```
Mitglied auf kunde-a.pukalani.app
  │  POST /api/community/membership/checkout        (onboarding-Layer)
  │  ├─ eingeloggt? Mandant? → sonst 404
  │  ├─ mintRuntimeJwt(event)          ← WER handelt
  │  └─ callControlPlane(…)            ← WELCHES Deployment fragt
  ▼
apps/control — der einzige Stripe-Schlüssel-Halter
  │  prüft das JWT selbst gegen das Runtime-Projekt
  │  liest communities.memberPriceAmount + connectAccountId
  │  Checkout-Session AUF DEM CONNECTED ACCOUNT (Stripe-Account-Header),
  │  application_fee_percent = Provision des PLANS
  │  metadata: { communityId, runtimeUserId, runtimeProjectId }
  ▼
Stripe → Erfolgs-URL zurück auf den Community-Host (aus communities.host,
         NIE aus dem Body — kein offener Redirect)
```

Das ist Zeile für Zeile das Muster des Community-Checkouts
(`packages/onboarding/server/api/community/billing/checkout.post.ts` →
`apps/control/server/utils/communityCheckout.ts`), mit genau zwei
Unterschieden: der Zahler ist ein Mitglied statt des Owners, und das Geld
entsteht auf dem Connected Account statt bei Pukalani.

**Ein Gate weniger:** `requireCommunityTeamGate` prüft eine Capability — hier
darf jedes eingeloggte Konto kaufen, das ist der Sinn. Also ein
Geschwister-Vorraum ohne Capability, nicht eine aufgeweichte Kopie des
bestehenden. Ein Gate, das mal prüft und mal nicht, ist der Anfang eines Lochs.

**`communityId` kommt NIE aus dem Body** — sonst kauft jemand eine
Mitgliedschaft in einer fremden Community.

**Preis und Price-Objekt leben auf dem Connected Account.** Der Owner darf
keine von David angelegten Stripe-Preise brauchen; sie entstehen bei ihm. Damit
fällt der `lookupKey`-Weg weg, den Geldfluss 1 benutzt — und mit ihm die
Allowlist `resolvePlanPrice`, die dort die Sicherung ist. Was hier an ihre
Stelle tritt, ist `communities.memberPriceAmount`: der Betrag kommt aus der
Community-Zeile, nie aus dem Request.

### 5.2 Webhook → Zugang

Der Handler ist die Geschwister-Funktion zu
`subscriptionUpdateToCommunityAction` — pure, unit-getestet, ohne Stripe und
ohne Appwrite:

| Stripe-Status | `member_subscriptions` | `community_members` |
|---|---|---|
| `active` / `trialing` | Zeile anlegen/aktualisieren | `status: 'active'` — Zugang |
| `past_due` / `unpaid` | Status stempeln | **unverändert** — Stripe-Dunning läuft, der Zugang bleibt (dieselbe Kulanz wie bei Geldfluss 1) |
| `canceled` / `incomplete_expired` | Status stempeln | `status: 'suspended'` — Zugang endet |
| alles andere | ignorieren, protokollieren | nichts anfassen |

Drei Eigenschaften sind nicht verhandelbar, alle drei aus dem
Money-Path-Review:

1. **Idempotent** — Stripe wiederholt Webhooks. Der Unique-Index trägt das
   (409 → bestehende Zeile).
2. **Transiente Fehler WERFEN, nie still zurückkehren** — sonst quittiert
   Pukalani einen Zustellversuch, den es nicht verarbeitet hat, und Stripe
   wiederholt nie wieder.
3. **Der Cross-Sub-Guard gilt hier auch.** `shouldApplyFreeFallback` schützt
   Geldfluss 1 davor, dass eine gekündigte ALTE Subscription ein frisch
   gekauftes Abo kannibalisiert. Wer hier kündigt und sofort neu kauft, löst
   dieselbe Reihenfolge aus — die Kündigung darf den neuen Zugang nicht
   einziehen. Die Regel wird nicht neu erfunden, sondern in ihrer Form
   übernommen.

**Ein Connect-Webhook ist NICHT derselbe Endpunkt.** Ereignisse von Connected
Accounts tragen ein eigenes `account`-Feld und brauchen einen getrennten
Endpunkt mit eigenem Signing-Secret. Beide in denselben Handler zu leiten wäre
der Weg, auf dem ein fremdes Konto in Pukalanis eigenen Geldpfad schreibt.

### 5.3 Kündigung

Der Käufer kündigt im Stripe-Kundenportal **des Connected Accounts** —
`cancel_at_period_end`. Stripe hält den Status bis zum Periodenende auf
`active`, erst dann kommt `canceled`. Der Zugang endet also exakt dann, wenn
das Bezahlte aufgebraucht ist, und Pukalani rechnet dafür nichts selbst aus.
Dieselbe Entscheidung wie bei Geldfluss 1: **Kündigungs-Timing macht Stripe.**
Der Benchmark bestätigt sie — Skool entfernt das Mitglied ebenfalls zum Ende
des Abrechnungszeitraums.

Dass dieses Portal überhaupt existiert, ist eine direkte Folge der
Kontotyp-Wahl aus § 2.2. Mit Express gäbe es hier nichts zu verlinken.

### 5.4 Rückerstattung

Erstattet wird im Stripe-Dashboard des Owners — es ist sein Geld und sein
Kunde. Zwei Dinge, die das Produkt trotzdem entscheiden muss (→ Frage 3):
ob die Provision mit erstattet wird, und ob eine Erstattung den Zugang sofort
beendet. **Von selbst tut sie das nicht:** eine Erstattung erzeugt
`charge.refunded`, nicht `customer.subscription.deleted`. Wer „Geld zurück
heißt Zugang weg" will, muss diesen Weg bauen.

### 5.5 Was passiert, wenn die Community endet oder den Besitzer wechselt

Die unangenehme Frage, und sie hat heute keine Antwort. Drei Wege führen
dorthin, und alle drei sind bereits gebaut — nur kennen sie zahlende
Mitglieder nicht:

- **Stilllegung (C16):** setzt alle Mitgliedschaften auf `'removed'`. Gesperrt
  ist sie nur, solange ein Abo läuft — aber das meint Geldfluss 1, das Abo des
  Owners bei Pukalani. Die Verträge seiner Mitglieder prüft `deleteBlockedBySubscription`
  nicht.
- **Besitz-Übergabe:** `transferBlockedBySubscription` prüft ebenfalls nur den
  Vertrag des Owners. Der neue Owner erbt einen Connected Account, der ihm
  nicht gehört — genauer: er erbt ihn nicht, und die Abos laufen auf dem des
  Vorgängers weiter.
- **Der Owner kündigt sein eigenes Pukalani-Abo.** Seit F49 wird die Community
  dann nur-lesend. Seine Mitglieder zahlen aber weiter an ihn, denn ihre Abos
  liegen bei Stripe und wissen von F49 nichts.

Der dritte Fall ist der schlimmste: **Menschen zahlen für den Zugang zu einer
Community, die eingefroren ist.** Das ist kein Randfall, sondern die
wahrscheinlichste Art, wie diese Sache schiefgeht — und der Grund, warum sie
Entscheidungsfrage 4 ist und nicht eine Zeile im Umsetzungsplan.

---

## 6. Was V1 bewusst NICHT kann

Der Benchmark kann all das (§ 1.3). Es bleibt trotzdem draußen, und jede
Auslassung hat einen eigenen Grund — nicht „später", sondern „nicht jetzt und
deshalb".

### 6.1 Keine Tiers, keine bezahlten Bereiche innerhalb einer Community

**Das ist die teuerste Auslassung.** Technisch wäre sie machbar: ein zweites
abgeleitetes Label `pay<communityId>` (§ 3.1). Was sie kostet, ist nicht das
Label, sondern die Frage dahinter — **jede Zeile jedes Produkt-Layers müsste ab
dann entscheiden, welches Publikum sie trägt.** Beiträge, Kommentare, Termine,
Kurse, Umfragen, Anwesenheit, Erwähnungen, Benachrichtigungen. Heute trifft
diese Entscheidung die Datentür zentral (`tenantRowPermissionsFor`); mit zwei
Publiken wird sie zu einer Entscheidung je Inhaltsart.

Zwei Stufen bedeuten außerdem zwei Preise, zwei Abos, einen Wechsel zwischen
ihnen (mit Proration — und die Proration ist genau der Fall, in dem
`application_fee_percent` nicht greift, § 2.4) und die Frage, was ein
Herabstufen mit bereits geschriebenen Inhalten macht.

**Die Verengung ist ehrlich zu benennen:** eine Community, die V1 verkauft, ist
ganz bezahlt. Wer erst hineinschauen und dann kaufen will, sieht die öffentliche
Seite und sonst nichts. Skools „Freemium" kann mehr. → Frage 2.

### 6.2 Kein Einzelverkauf von Kursen oder Beiträgen

Das ist die Kurs-Hälfte aus F7-PAYMENTS-CONNECT § 3.5 (Etappe 3) und weiterhin
unentworfen. Sie braucht ein community- UND nutzerbezogenes Entitlement-Objekt
(„dieser Mensch hat in dieser Community diesen Kurs gekauft") samt Rückgabe,
Ablauf und Widerruf. Die vorhandene `entitlements`-Mechanik im billing-Layer
beantwortet eine ANDERE Frage — sie ist die Lizenz einer INSTALLATION („welche
Produkte darf dieses Deployment betreiben"). Sie dafür zu biegen wäre der
Fehler, den dieses Konzept ausdrücklich nicht macht.

### 6.3 Keine Gutscheine, keine Testphasen für Mitglieder

Skool gibt Mitgliedern 7 Tage. Beides ist bei Stripe billig zu haben
(`trial_period_days`, Promotion Codes) und bleibt trotzdem draußen: ein Trial
verlangt eine Antwort darauf, was beim Nichtkauf mit den in der Testzeit
geschriebenen Beiträgen passiert — dieselbe Frage wie § 6.1, nur zeitlich statt
räumlich.

### 6.4 Keine Einmalzahlung als Eintritt

„Lebenslanger Zugang" klingt nach einem kleinen Feature und ist eine
Verpflichtung ohne Ende: der Zugang müsste auch dann noch gelten, wenn der
Owner sein Pukalani-Abo längst gekündigt hat. Das ist § 5.5 in seiner härtesten
Form.

### 6.5 Nur EUR, und ein Mindestbetrag

EUR-only und mindestens 5 € — unverändert der Vorschlag aus
F7-PAYMENTS-CONNECT § 5.4. Unter 5 € frisst die feste Stripe-Gebühr einen
zweistelligen Prozentsatz. Mehrwährung ist ein eigenes Thema (Anzeige,
Umrechnung, Steuersatz) — Skools USD-only zeigt, dass man hier auch als
Marktführer schwach sein darf.

### 6.6 Kein zweiter Zahlungsdienst

Die Anbieter-Naht (`SellerPaymentProvider`) ist in F7-PAYMENTS-CONNECT § 4
skizziert und bleibt eine Skizze. Einen zweiten Anbieter vor dem ersten Verkauf
zu bauen heißt, die Verträge eines Systems zu schneiden, das man nie angebunden
hat.

---

## 7. Entscheidungen für David

Vier Fragen. Ohne sie entsteht kein Umsetzungsplan — und Frage 1 muss vor den
anderen dreien fallen, weil sie deren Rahmen setzt.

### 7.1 Frage 1 — Wer verkauft: der Owner oder Pukalani?

*Die OPEN-ITEMS-Zeile nennt als Messlatte Skools Merchant-of-Record-Modell
inklusive EU-Umsatzsteuer. Deine D1-Entscheidung vom 2026-08-02 schließt
„Betreiber als Verkäufer" aus. Beides gleichzeitig geht nicht.*

| Option | Beschreibung |
|---|---|
| **A — Owner verkauft (Empfehlung)** | Connect mit vollem Stripe-Dashboard, direct charges. Der Owner ist Verkäufer und schuldet die Umsatzsteuer; er verwaltet Abos und Steuer-Einstellungen selbst, seine Mitglieder bekommen Stripes Kundenportal. Connect kostet uns nichts. Hält D1 ein. Preis: der Owner legt ein eigenes Stripe-Konto an — die höchste Einstiegshürde im Feld, dieselbe wie bei Circle. Erreicht die Skool-Messlatte NICHT. |
| **B — Pukalani verkauft** | Destination charges; laut Stripe ist damit die Plattform Merchant of Record. Erreicht die Skool-Messlatte, hebt D1 auf. Wir schulden die Umsatzsteuer in bis zu 27 Ländern, tragen Chargebacks und Widerruf, und unser Name steht auf jedem Beleg. Für ein Einzelunternehmen mit Sitz USA, dessen eigene Rechtstexte (A1) noch beim Anwalt liegen, ist das eine sehr große Zusage. **Und vermutlich technisch versperrt:** destination charges verlangen Plattform und Verkäufer in derselben Region (§ 2.1). Ein MoR-Modell führte dann über einen externen Anbieter (Paddle, Lemon Squeezy, Polar) — und genau dazu fehlt die Recherche noch (§ 8). |
| **C — Owner verkauft, wir tragen mehr** | Express-Konten + direct charges (die Empfehlung vom 2026-08-01). Niedrigste Hürde für den Owner, D1 bleibt gewahrt — aber Stripe verlangt dann, dass WIR die Abos seiner Mitglieder verwalten und seine Steuer-Einstellungen per API pflegen. Ein zweites Produkt, ohne dass wir Verkäufer wären. |
| **D — F7 weiter vertagen** | Erst Geldfluss 1 (A6) ankommen lassen. Kostet nichts und verschiebt alles. |

**Empfehlung: A.** Es ist die einzige Option, in der wir weder Händler noch
Abo-Verwalter für fremde Endkunden werden. Die Einstiegshürde ist real — aber
sie trifft nur Owner, die tatsächlich verkaufen wollen, und die haben einen
Grund, sie zu nehmen. **Wichtig: Der Dashboard-Typ eines Connected Accounts ist
unveränderlich.** Ein späterer Wechsel von C nach A migriert jeden Verkäufer
einzeln samt laufender Abos.

### 7.2 Frage 2 — Was genau kann man in V1 kaufen?

| Option | Beschreibung |
|---|---|
| **A — Ganze Community bezahlt (Empfehlung)** | Ein Preis, ein Publikum. Wer zahlt, ist Mitglied; wer nicht zahlt, sieht die öffentliche Seite. Ändert nichts am Publikums-Modell und ist deshalb die einzige Variante, die nicht jeden Produkt-Layer anfasst. |
| **B — Freemium (frei + bezahlt in einer Community)** | Skools Modell und der stärkste Verkaufsmechanismus im Feld: hineinschauen, dann kaufen. Braucht ein zweites Lese-Publikum und damit an JEDER Inhaltsart die Frage, wer sie sehen darf. |
| **C — Mehrere Stufen (Tiers)** | Bronze/Silber/Gold. Alles aus B, plus Wechsel zwischen Stufen mit Proration und die Frage, was ein Herabstufen mit bereits geschriebenen Inhalten macht. |

**Empfehlung: A**, mit offenem Auge: B ist der Punkt, an dem uns Skool im
direkten Vergleich schlägt, und das Datenmodell dafür ist skizziert (§ 3.1) —
es ist eine Frage des Zeitpunkts, nicht der Machbarkeit.

### 7.3 Frage 3 — Rückerstattungen

*Stripe lässt jede Variante zu; wir müssen uns für eine entscheiden, bevor der
erste Fall eintritt.*

| Option | Beschreibung |
|---|---|
| **A — Owner erstattet, Provision geht mit zurück, Zugang endet sofort (Empfehlung)** | Der Owner erstattet in seinem Stripe-Dashboard. Unsere Provision wird mit erstattet — an einem rückabgewickelten Kauf haben wir nichts verdient. Der Zugang endet sofort; das müssen wir bauen (eine Erstattung beendet ein Abo nicht von selbst). |
| **B — wie A, aber der Zugang läuft bis Periodenende** | Weniger Bau, und es ist die mildere Auslegung. Wirkt aber wie ein Geschenk: Geld zurück UND weiter drin. |
| **C — Provision bleibt bei uns** | Deckt unsere Kosten, ist am Markt aber schwer zu erklären und macht jede Erstattung zum Streitfall mit dem Owner. |

**Empfehlung: A.** Der Bau ist überschaubar (ein Webhook-Zweig auf
`charge.refunded`), und die Regel ist in einem Satz erklärbar.

### 7.4 Frage 4 — Was passiert mit bezahlten Mitgliedschaften, wenn die Community endet?

*Drei Wege führen dorthin (§ 5.5); der wichtigste ist: der Owner kündigt sein
eigenes Pukalani-Abo, seine Community wird nur-lesend — und seine Mitglieder
zahlen weiter.*

| Option | Beschreibung |
|---|---|
| **A — Verkauf sperrt die Endzustände (Empfehlung)** | Solange zahlende Mitglieder existieren, sind Stilllegung und Besitz-Übergabe gesperrt (wie heute schon bei laufendem Owner-Abo), und wer sein Pukalani-Abo kündigt, muss zuerst die Mitglieder-Abos beenden. Die Sperre ist ehrlich und existiert als Muster bereits. Kostet: der Owner kommt nicht sofort raus. |
| **B — Automatisch beenden** | Beim Ende der Community kündigt Pukalani alle Mitglieder-Abos auf dem Connected Account. Bequem — aber wir greifen in fremde Verträge ein und müssten anteilig erstatten, um fair zu sein. |
| **C — Nur warnen** | Wir zeigen dem Owner, was er auslöst, und lassen ihn entscheiden. Billigster Bau, verlagert das Problem auf die Mitglieder — und auf uns, wenn sie sich beschweren. |

**Empfehlung: A**, mit der Warnung aus C davor. Das ist zugleich die Frage, bei
der die Antwort in die AGB gehört und nicht nur in den Code — sie gehört auf
die Liste für den Anwaltstermin (A1).

---

## 8. Was hier bewusst nicht steht

- **Kein Umsetzungsplan, keine Häkchen.** Der entsteht, wenn Abschnitt 7
  beantwortet ist.
- **Keine zweite Rechts-Checkliste.** Die steht vollständig in
  F7-PAYMENTS-CONNECT § 6 und gilt unverändert — deemed supplier (Art. 9a
  MwSt-DVO), Kleinunternehmer-Owner, ZAG/PSD2, DSA Art. 30, Widerrufsrecht.
  **Fünf Nachträge** aus diesem Durchgang, die dort ergänzt gehören:

  1. Die **Provision läuft nach einer Trennung weiter** (§ 2.4) — bei direct
     charges kassiert Pukalani mit, bis der Wert entfernt wird.
  2. Die **Endzustände** aus Frage 4 gehören in die AGB, nicht nur in den Code.
  3. **Die ZAG-Frage ist im Vorgängerdokument falsch gestellt.** Einschlägig
     ist nicht die Handelsvertreterausnahme, sondern der **technische
     Dienstleister nach § 2 Abs. 1 Nr. 9 ZAG**: erlaubnisfrei bleibt, wer zu
     keiner Zeit Zugriff auf die Gelder hat. Bei direct charges berührt das
     Geld unser Konto nie — dann stellt sich die Handelsvertreterfrage gar
     nicht erst. Die Handelsvertreterausnahme legt die BaFin ohnehin eng aus
     (nur EINE Seite vertreten, echte, tatsächlich ausgeübte Vollmacht), und
     sie könnte unter PSD3/PSR verengt werden — Inkrafttreten des neuen Regimes
     wird für Ende 2027 erwartet.
  4. **DSA Art. 13 ist für uns der praktisch wichtigste DSA-Punkt und steht im
     Vorgängerdokument gar nicht.** Wer ohne Niederlassung in der EU dort
     Dienste anbietet, muss einen **gesetzlichen Vertreter in der EU** benennen
     und melden — **ohne Ausnahme für Kleinunternehmen**. Das ist die
     Zwillingsfrage zu Art. 27 DSGVO, die für die Studio-Site bereits beim
     Anwalt liegt (A1); sie gehört in denselben Termin.
  5. **DSA Art. 30 (Know Your Business Customer) trifft uns möglicherweise
     nicht.** Art. 29 nimmt Kleinst- und Kleinunternehmen von Abschnitt 4 aus.
     Maßgeblich ist nach überwiegender Lesart die Größe des
     **Plattformbetreibers** — der Wortlaut ist allerdings mehrdeutig, und
     zwei Quellen lesen ihn auf die Händler bezogen. **Nicht selbst
     entscheiden**: davon hängt ab, ob wir von jedem verkaufenden Owner
     Ausweis, Registernummer und Selbstbescheinigung erheben müssen.
- **Keine erfundenen Zahlen.** Wo die Recherche nichts hergab, steht das
  ausdrücklich — insbesondere bei den Kulanzfristen und dem Umgang mit
  Inhalten gekündigter Mitglieder, die im gesamten Wettbewerbsfeld
  undokumentiert sind (§ 1.4).
- **Keine Aussage über Stripe Tax für nicht registrierte Owner.** Stripe
  liefert bei fehlender Registrierung *„errors or zero-tax calculations"* und
  meldet über den Schwellenwert-Status, wenn eine Registrierung nötig wird. Ob
  das für einen Kleinunternehmer der steuerlich richtige Zustand ist, ist eine
  Frage an den Steuerberater und keine ans Produkt.

- **Vier Recherche-Lücken, offen benannt.** Sie sind für die EMPFEHLUNG (§ 2)
  nicht nötig, wohl aber für Frage 1, falls David zu einem MoR-Modell neigt:

  1. **MoR-Anbieter mit Marktplatz-Modell** — Paddle, Lemon Squeezy, Polar.sh,
     Creem, FastSpring: bedienen sie überhaupt eine Plattform mit VIELEN
     Verkäufern unter einem MoR, oder nur „ein Verkäufer je Konto"? Ohne diese
     Antwort ist Option B in Frage 1 nicht bewertbar — zumal destination
     charges für uns vermutlich ausfallen (§ 2.1).
  2. **Deemed supplier** (Art. 9a MwSt-DVO / § 3 Abs. 11a UStG) — die Frage,
     ob uns direct charges wirklich vor der Leistenden-Stellung schützen.
  3. **ViDA, EU-Kleinunternehmerregelung ab 2025, OSS** — der Rahmen, in dem
     ein verkaufender Owner steht.
  4. **DAC7 / PStTG** — Meldepflichten über unsere Verkäufer.

  Punkte 2–4 sind ohnehin Fragen an Anwalt und Steuerberater und keine, die
  eine Web-Recherche abschließend beantwortet. Punkt 1 ist reine
  Marktrecherche und nachholbar.

## Quellen (erhoben 2026-08-15)

**Stripe (Primärquelle, am Volltext gelesen):**

- [Design an advanced Connect integration](https://docs.stripe.com/connect/design-an-integration) — Accounts v2 als Empfehlung für Neueinsteiger, Dashboard-Typen, Unveränderlichkeit des Dashboard-Typs, Haftung für Negativsalden, Charge-Typen
- [Create subscriptions with Stripe Billing (Connect)](https://docs.stripe.com/connect/subscriptions) — `application_fee_percent`, Restriktionen bei Konten ohne volles Dashboard, Empfehlung direct vs. destination, Verhalten bei Trennung, „platform is the merchant of record" bei destination charges
- [Use Stripe Tax with Connect](https://docs.stripe.com/tax/connect) — Plattform vs. Marktplatz, wer die Steuer schuldet
- [Tax for software platforms](https://docs.stripe.com/tax/tax-for-platforms) — Steuer-Einrichtung je Connected Account, Schwellenwert-Überwachung, Verhalten ohne Registrierung
- [Connect Pricing](https://stripe.com/connect/pricing) — „Stripe handles pricing" vs. „You handle pricing"
- [Interactive platform guide](https://docs.stripe.com/connect/interactive-platform-guide) — Platform vs. Marketplace, **Cross-border-Einschränkung** bei destination charges, Managed Risk
- [Express Dashboard](https://docs.stripe.com/connect/express-dashboard) · [Cross-border payouts](https://docs.stripe.com/connect/cross-border-payouts)

**Aufsichts- und Plattformrecht:**

- [BaFin — Merkblatt ZAG](https://www.bafin.de/SharedDocs/Veroeffentlichungen/DE/Merkblatt/mb_111222_zag.html) — technischer Dienstleister, § 2 Abs. 1 Nr. 9 ZAG
- [fin-law — Finanztransfergeschäft](https://fin-law.de/en/zag/money-remittance-business/) · [fin-law — Handelsvertreterausnahme](https://fin-law.de/en/zag/commercial-agent-exemption-in-the-zag/) · [mzs-recht — Handelsvertreterausnahme unter PSD3/PSR](https://www.mzs-recht.de/online-plattformen-vor-dem-aus-was-wird-aus-der-handelsvertreterausnahme-unter-psd3-und-psr/)
- [BaFin — grenzüberschreitendes Geschäft (Zielmarktansatz, KWG)](https://www.bafin.de/SharedDocs/Veroeffentlichungen/DE/Merkblatt/mb_050401_grenzueberschreitend.html)
- [MoFo — PSD3 und PSR, Stand 2026](https://www.mofo.com/resources/insights/260430-psd3-and-the-payment-services-regulation-key-developments)
- [DSA Art. 30](https://gesetz-digitale-dienste.de/dsa/artikel-30/) · [DSA Art. 29 (Ausnahme Kleinst-/Kleinunternehmen)](https://gesetz-digitale-dienste.de/dsa/artikel-29/) · [DSA Art. 13 (Vertreter in der EU)](https://gesetz-digitale-dienste.de/dsa/artikel-13/) · [DSA Art. 3 Nr. 6 („Unternehmer")](https://gesetz-digitale-dienste.de/dsa/artikel-3/)
- [Empfehlung 2003/361/EG — KMU-Schwellen](https://eur-lex.europa.eu/eli/reco/2003/361/oj?locale=de)

**Benchmark:**

- [skool.com/pricing](https://www.skool.com/pricing) · [Skool Payments FAQs](https://help.skool.com/article/86-subscriptions-faq) (Stand 13.08.2026) · [Skool VAT FAQs](https://help.skool.com/article/232-skool-vat-faqs) (Stand 15.06.2026) · [Skool: Preise einrichten](https://help.skool.com/article/215-how-to-setup-pricing-for-the-group) (Stand 28.10.2025) · [Skool: Kündigung](https://help.skool.com/article/99-how-to-cancel-my-subscription-to-a-community) (Stand 13.05.2026)
- [circle.so/pricing](https://circle.so/pricing) · [circle.so/payments](https://circle.so/payments)
- [patreon.com/pricing](https://www.patreon.com/pricing)
- [mightynetworks.com/pricing](https://www.mightynetworks.com/pricing) · [Mighty Networks: Transaktionsgebühren](https://docs.mightynetworks.com/for-hosts/payments-and-access/does-mighty-networks-charge-a-transaction-fee)
- [kajabi.com/pricing](https://kajabi.com/pricing) · [podia.com/pricing](https://www.podia.com/pricing) · [ghost.org/pricing](https://ghost.org/pricing/)
- Nur über Suchergebnis-Snippets belegt (Help-Center antworten mit 403): [Patreon Creator fees](https://support.patreon.com/hc/en-us/articles/11111747095181-Creator-fees-overview) · [Substack Kosten](https://support.substack.com/hc/en-us/articles/360037607131-How-much-does-Substack-cost) · [Discord Premium Memberships](https://support.discord.com/hc/en-us/articles/5371495812631-Premium-Memberships-For-Creators-Server-Owners-Admins)
