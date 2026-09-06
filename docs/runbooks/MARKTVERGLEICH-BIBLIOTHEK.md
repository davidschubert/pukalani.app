# Runbook — Kuratierte Bibliothek des Marktvergleichs

**Zweck:** einen Bibliotheks-Eintrag (Plan §7.2 Nr. 3) von der Kandidatenliste bis in
`packages/market/shared/library/index.ts` bringen — mit einer Handprüfung dazwischen, die
ein Mensch macht und mit seinem Zeichen unterschreibt.

**Wer:** David (Redaktion). **Wie oft:** je Marke einmal, danach nur bei Auffrischung.
**Konzept:** [BRAND-MARKTVERGLEICH.md](../plans/BRAND-MARKTVERGLEICH.md) §7.2 und Anhang G.

---

## 0. Warum das nicht automatisch geht

Ein Bibliotheks-Eintrag ist eine **öffentliche Aussage über eine fremde Marke unter ihrem
Namen**. Die Maschine kann belegen, dass ein Zitat wörtlich im abgerufenen Text stand
(Beleg-Riegel, Anhang C) — sie kann nicht belegen, dass sie das Richtige zitiert,
das Feld richtig zugeordnet und niemanden herabgesetzt hat. Deshalb trägt jeder Eintrag
`status: 'verified'`, `verifiedAt` und `verifiedBy`, und das Werkzeug setzt keines der drei.

Was das Werkzeug erzeugt, heisst **Entwurf**, liegt unter `shared/library/drafts/` und
**fällt durch das Bibliotheks-Schema** (`status: 'draft'`). Es kann also nicht versehentlich
in Betrieb gehen.

---

## 1. Aufnahme-Regeln (gelten vor jedem Lauf)

- [ ] **Nur die eigene Website der Marke.** Keine Presse, keine Wikipedia, keine
      Datenbank, kein Verzeichnis. Wir zeigen, was eine Marke über sich SAGT — eine
      fremde Zusammenfassung ist etwas anderes.
- [ ] **Paare aus derselben Kategorie.** Zwei Sportartikel-Marken, zwei Röstereien.
      Über Kategoriegrenzen zeigt ein Vergleich nur, dass Kategorien verschieden sind.
- [ ] **Balance:** klein neben gross, DE neben US. Eine Bibliothek aus fünf Konzernen
      kalibriert nichts für eine Rösterei mit drei Leuten.
- [ ] **Firmen-Websites, nie die Website einer Person.** Ein Einzelunternehmen mit
      Firmenauftritt ist in Ordnung, ein persönlicher Blog nicht (DSGVO, §1.7 Nr. 3).
- [ ] **Keine Logos, keine Favicons, keine Bildmarken** — Wortname genügt (Anhang G a).

Die Liste steht in `packages/market/shared/library/candidates.json`. Eine neue Marke wird
dort eingetragen, nicht im Werkzeug.

---

## 2. Machbarkeit (Trockenlauf, kostet nichts)

```bash
node packages/market/scripts/market-library-compute.mjs --check
# eine einzelne Marke:
node packages/market/scripts/market-library-compute.mjs --check --only the-barn
```

Höchstens **drei Anfragen je Host** (`robots.txt`, `/.well-known/tdmrep.json`,
Startseite), kein Unterseiten-Abruf, kein gespeicherter Seiteninhalt. Ergebnis: Tabelle im
Terminal und `packages/market/shared/library/feasibility.<datum>.json`.

Vier Urteile:

| Urteil | Heisst | Was zu tun ist |
| --- | --- | --- |
| `erlaubt` | robots erlaubt uns, kein Nutzungsvorbehalt | weiter mit Schritt 3 |
| `robots-verbot` | die Website sperrt unseren Absender aus | **fertig — diese Marke kommt nicht in die Bibliothek** |
| `bot-abwehr` | schon die `robots.txt` antwortet 401/403 | fertig, gleiche Wirkung |
| `tdm-vorbehalt` | Nutzungsvorbehalt (§ 44b UrhG) in einer der vier Formen | fertig |
| `erlaubt (Ursprung prüfen)` | die Startseite leitet auf einen anderen Host um | Adresse in `candidates.json` auf den Zielhost korrigieren und **erneut prüfen** — dort gilt eine andere `robots.txt` |

- [ ] Trockenlauf gelaufen, Bericht liegt im Repo.
- [ ] Jede Marke mit `robots-verbot`, `bot-abwehr` oder `tdm-vorbehalt` ist aus der
      Arbeitsliste gestrichen. **Das wird nicht umgangen** — nicht mit einem anderen
      Absender, nicht über einen Proxy, nicht über eine Zwischenquelle.

---

## 3. Rechnen

### 3a. Ohne Kosten üben (jederzeit erlaubt)

```bash
# Dev-Server der branding-App AUS DEM WORKTREE
MARKET_DEV_STUB=1 BRAND_SITE_FETCH_ALLOW_LOOPBACK=1 \
  pnpm --filter branding exec nuxi dev --port 3016

BRANDING_PORT=3016 node --env-file=apps/branding/.env \
  packages/market/scripts/market-library-compute.mjs --compute --stub
```

Läuft gegen die erfundenen Demo-Websites des Playgrounds und beweist, dass das Werkzeug
gültige Entwürfe erzeugt. Kein Modell-Aufruf, keine echte Marke.

### 3b. Der echte Lauf (kostet Geld)

```bash
BRANDING_PORT=3016 node --env-file=apps/branding/.env \
  packages/market/scripts/market-library-compute.mjs --compute --only the-barn
```

Ohne `MARKET_LIBRARY_ALLOW_PAID=1` **bricht das Werkzeug ab** und druckt vorher die
Kostenschätzung. Das ist Absicht: eine Freigabe ohne Betrag wäre keine.

- [ ] Kostenschätzung gelesen.
- [ ] Freigabe erteilt (Davids Ja steht als eigener Punkt in OPEN-ITEMS).
- [ ] Lauf mit `MARKET_LIBRARY_ALLOW_PAID=1` wiederholt.

Der Lauf legt ein Wegwerf-Konto und ein Wegwerf-Branding an, geht denselben Weg wie ein
Kunde und räumt hinter sich auf. Kandidaten ohne belegtes Feld bekommen **keinen** Entwurf
— das ist der Riegel, kein Fehler.

---

## 4. Die Handprüfung — je Eintrag, je Feld

Datei öffnen: `packages/market/shared/library/drafts/<schlüssel>.json`.
`computed.pages` nennt die Seiten, aus denen die Belege stammen — das ist der Prüfpfad.

Für **jedes** Feld im Entwurf:

- [ ] **Zitat gegen die Quelle.** `sourceUrl` im Browser öffnen, `quote` dort suchen.
      Steht es nicht wörtlich da (auch nicht anders formatiert), **Feld löschen**.
- [ ] **Feld richtig zugeordnet?** Ein Satz über die Zielgruppe gehört nicht ins
      Versprechen. Falsch zugeordnet ⇒ Feld löschen, nicht verschieben (die
      Zuordnung ist die Aussage).
- [ ] **Keine personenbezogenen Daten.** Kein Name, keine Rolle mit Namen, keine
      E-Mail, keine Telefonnummer — auch nicht im `value`.
- [ ] **Keine Herabsetzung, keine Wertung.** Der Eintrag beschreibt, was die Marke
      sagt. Er bewertet nicht, und er vergleicht nicht.
- [ ] **Zitat ≤ 200 Zeichen** und nicht der ganze Absatz (Zitatzweck, Anhang G b).
- [ ] **Nichts älter als 90 Tage.** Ein `computed.at`, das älter ist, wird nicht
      geprüft, sondern neu gerechnet.

Für den **Eintrag**:

- [ ] `name` ist der Wortname, wie die Marke ihn selbst schreibt (`adidas`, nicht `Adidas AG`).
- [ ] `homepage` zeigt auf die Seite, die tatsächlich gelesen wurde.
- [ ] `category` passt zu seinem Paar.
- [ ] Mindestens **drei** belegte Felder — weniger ist kein Marktprofil, sondern ein Name.

Dann im Entwurf setzen:

```jsonc
"status": "verified",
"verifiedAt": "2026-09-06",     // heute
"verifiedBy": "DS"              // Zeichen des Prüfenden
```

---

## 5. Übernehmen

```bash
node packages/market/scripts/market-library-compute.mjs --promote the-barn
```

Das Werkzeug verweigert die Übernahme, solange `status` auf `draft` steht oder
`verifiedAt`/`verifiedBy` fehlen. Danach schreibt es den Eintrag nach
`shared/library/index.ts` und lässt `tests/marketLibrary.test.ts` laufen — fällt der Test,
wird `index.ts` **zurückgesetzt**.

- [ ] `--promote` grün.
- [ ] **`MARKET_LIBRARY_VERSION` in `shared/library/index.ts` gehoben.** Sie geht in
      `market_reports.revisionKey` ein; ohne Erhöhung halten sich gespeicherte Berichte
      für aktuell, obwohl sich ihre Grundlage bewegt hat.
- [ ] Entwurf aus `drafts/` gelöscht (er ist jetzt in `index.ts`, und zwei Fassungen
      derselben Aussage laufen auseinander).
- [ ] `pnpm --filter @pukalani/market test` grün.
- [ ] Commit mit dem Namen der Marke im Betreff — ein Bibliotheks-Eintrag gehört in ein
      eigenes Diff, damit man ihn im Nachhinein einzeln lesen kann.

---

## 6. Zurücknehmen

Meldet sich eine Marke oder ändert sie ihre Website:

- [ ] Eintrag aus `shared/library/index.ts` entfernen.
- [ ] `MARKET_LIBRARY_VERSION` heben — dadurch werden gespeicherte Berichte, die den
      Eintrag benutzt haben, `stale` und rechnen beim nächsten Aufschlagen neu.
- [ ] Marke in `candidates.json` mit einer Notiz versehen, warum sie draussen ist.

Es gibt bewusst **keinen** Laufzeit-Schalter dafür: die Bibliothek ist Repo-Inhalt, und
eine Rücknahme soll ein Diff und einen Deploy hinterlassen, keine stille Änderung in einer
Konsole.
