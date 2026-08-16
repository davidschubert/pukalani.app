# Changelog-Entwürfe — Welle 2026-08-11 bis 2026-08-14

**Was das hier ist:** fertige, kuratierte Produkt-Release-Notes zum Einfügen in
**Dashboard → Changelog** auf `admin.pukalani.app`. Sechs Einträge, alle
Kategorie `feature` („Neu"), alle zweisprachig.

**Warum sie als Datei hier liegen und nicht in der Tabelle:** der dokumentierte
Weg (Track 2 in [CHANGELOG-WORKFLOW.md](referenz/CHANGELOG-WORKFLOW.md)) schreibt
in die Appwrite-Tabelle `changelog` — entweder lokal über
`pnpm changelog:draft` mit einem Runtime-Key oder serverseitig über die
Appwrite-Function beim GitHub-Release. Beides braucht Schreibzugriff auf eine
laufende Instanz; aus einem Worktree heraus wäre das ein Schreibvorgang auf
Produktion ohne Abnahme. Der Text ist deshalb hier fertig ausgearbeitet und
wird von Hand eingefügt.

**Feld-Zuordnung im Formular:** `title` / `body` = deutsche Spalten,
`titleEn` / `bodyEn` = englische, `category` = `feature`, `date` = 2026-08-14
(Tag der letzten Auslieferung dieser Welle), `published` erst nach Durchsicht.

**Nach dem Veröffentlichen:** diese Datei löschen — sie ist ein Übergabezettel,
kein Nachschlagewerk. Die Wahrheit steht danach in der `changelog`-Tabelle.

---

## 1 — Reaktionen und Themen-Verweise

**title:** Emoji-Reaktionen und Verweise zwischen Themen

**body:**

```markdown
Zwei Dinge, die Gespräche leichter machen:

- **Reaktionen.** Unter jedem Thema und unter jeder Antwort steht jetzt eine
  Leiste mit acht Emoji: 😂 🎉 🤔 👀 😢 🔥 🙏 💡. Sie sind reiner Ausdruck —
  Score, Sortierung und Abzeichen bleiben von ihnen unberührt. Daumen und Herz
  fehlen bewusst: Zustimmung gibt es hier schon, als Hochstufe.
- **Verweise auf andere Themen.** Ein `#` in der Schreibfläche öffnet ein Menü
  über die Themen deiner Community. Das verlinkte Thema zeigt darunter
  „Verlinkt von" — der Verweis wirkt also in beide Richtungen, ohne dass jemand
  etwas nachtragen muss. Und er überlebt das Umbenennen.

Dazu zwei neue Abzeichen: **Erste Reaktion** und **Erster Themen-Verweis**.

[Nachlesen in der Hilfe](https://help.pukalani.app/anleitung/produkte/diskussionen)
```

**titleEn:** Emoji reactions and links between topics

**bodyEn:**

```markdown
Two things that make conversations easier:

- **Reactions.** Every topic and every reply now carries a bar of eight emoji:
  😂 🎉 🤔 👀 😢 🔥 🙏 💡. They are pure expression — score, sorting and badges
  are untouched by them. Thumbs and hearts are deliberately missing: approval
  already exists here, as an upvote.
- **Links to other topics.** Typing `#` in the editor opens a menu of your
  community's topics. The linked topic then shows a "Linked from" section — so a
  reference works in both directions, without anyone having to maintain it. And
  it survives renaming.

Two new badges come with it: **First Reaction** and **First Link**.

[Read more in the help](https://help.pukalani.app/en/anleitung/produkte/diskussionen)
```

---

## 2 — Mitglieder dürfen einladen

**title:** Mitglieder dürfen jetzt selbst einladen

**body:**

```markdown
Bisher lud nur das Team ein. Ab sofort kann **jedes Mitglied** Menschen
dazuholen — fünf pro Woche, immer als Leserin oder Leser.

- Der Schalter dafür steht unter **Dashboard → Community → Allgemein**
  („Mitglieder dürfen einladen") und lässt sich jederzeit umlegen.
- Owner und Admins bleiben unbegrenzt und vom Schalter unberührt.
- Rollen zu vergeben bleibt eine Team-Entscheidung: eine Mitglieder-Einladung
  macht immer eine Leser-Rolle, nie mehr.

Neu sind auch die Abzeichen **Promoter** (jemand hat deine Einladung
angenommen), **Campaigner** und **Champion** (deine Eingeladenen steigen in den
Vertrauensstufen auf).

[Nachlesen in der Hilfe](https://help.pukalani.app/anleitung/mitglieder-und-rollen)
```

**titleEn:** Members can now invite people themselves

**bodyEn:**

```markdown
Until now only the team could invite. From today **every member** can bring
people in — five per week, always as a reader.

- The switch sits under **Dashboard → Community → General** ("Members can
  invite") and can be flipped at any time.
- Owners and admins stay unlimited and untouched by the switch.
- Handing out roles remains a team decision: a member's invitation always makes
  a reader, never more.

Three new badges come with it: **Promoter** (someone accepted your invitation),
**Campaigner** and **Champion** (the people you invited climb the trust levels).

[Read more in the help](https://help.pukalani.app/en/anleitung/mitglieder-und-rollen)
```

---

## 3 — Tages-Limit für Zustimmungen

**title:** Ein Tages-Limit für Zustimmungen — gestaffelt nach Vertrauensstufe

**body:**

```markdown
Zustimmungen (Hochstufen) haben jetzt eine Obergrenze pro Tag und Community.
Wie viele, hängt an der Vertrauensstufe:

- Stufe 0 und 1: **50** am Tag
- Stufe 2 (Mitglied): **75**
- Stufe 3 (Stammgast) und höher: **100**

Im Alltag merkt das niemand — die Grenze bremst den Massen-Klick, nicht das
Mitlesen. Sie trifft bewusst am stärksten den, über den die Community noch
nichts weiß, und lockert für den, der lange verlässlich mitmacht.

Ist das Kontingent aufgebraucht, sagt Pukalani das ausdrücklich; am nächsten Tag
geht es weiter. Zurücknehmen gibt eine Stimme nicht ins Kontingent zurück,
Runterstufen kostet nichts.

Dazu drei Abzeichen für die fleißigen Tage: **Out of Love**, **Higher Love**,
**Crazy in Love**.

[Nachlesen in der Hilfe](https://help.pukalani.app/anleitung/produkte/diskussionen)
```

**titleEn:** A daily limit on approvals — scaled by trust level

**bodyEn:**

```markdown
Approvals (upvotes) now have a daily cap per community. How many depends on the
trust level:

- Levels 0 and 1: **50** per day
- Level 2 (Member): **75**
- Level 3 (Regular) and above: **100**

In everyday use nobody notices — the limit slows down bulk clicking, not
reading. It deliberately bites hardest for the person the community knows
nothing about yet, and loosens for those who have taken part reliably for a long
time.

When the allowance is used up, Pukalani says so explicitly; the next day it
starts over. Taking a vote back does not return it to the allowance, and
downvotes cost nothing.

Three badges come with it for the busy days: **Out of Love**, **Higher Love**,
**Crazy in Love**.

[Read more in the help](https://help.pukalani.app/en/anleitung/produkte/diskussionen)
```

---

## 4 — Menü, Sucheintrag, Weiterleitungen

**title:** Menü, Sucheintrag und Weiterleitungen selbst in der Hand

**body:**

```markdown
Drei neue Reiter unter **Dashboard → Community**:

- **Navigation.** Menüpunkte ausblenden, umordnen, umbenennen — und eigene
  Links ergänzen, auf eine Seite deiner Community oder auf eine externe Adresse.
  Mit Vorschau in der Reihenfolge, die Besucher sehen.
- **Sucheintrag.** Die Beschreibung, mit der deine Startseite im Suchergebnis
  steht, ein Schalter „aus Suchmaschinen raushalten" und eine Vorschau —
  Suchergebnis und geteilte Link-Karte nebeneinander.
- **Weiterleitungen.** Alte Adressen führen wieder wohin: ein Pfad, ein Ziel,
  bis zu 100 Regeln. Die deutsche Fassung ist mitgefangen, angehängte Parameter
  reisen mit.

[Nachlesen in der Hilfe](https://help.pukalani.app/anleitung/community-einstellungen)
```

**titleEn:** Navigation, search listing and redirects in your own hands

**bodyEn:**

```markdown
Three new tabs under **Dashboard → Community**:

- **Navigation.** Hide, reorder and rename menu entries — and add your own
  links, to a page of your community or to an external address. With a preview
  in the order visitors will see.
- **Search listing.** The description your home page shows in a search result, a
  switch to keep the community out of search engines, and a preview — search
  result and shared link card side by side.
- **Redirects.** Old addresses lead somewhere again: one path, one target, up to
  100 rules. The German version is caught as well, and query parameters travel
  along.

[Read more in the help](https://help.pukalani.app/en/anleitung/community-einstellungen)
```

---

## 5 — Community-Export

**title:** Community-Export: nimm alles mit

**body:**

```markdown
Der Reiter **Export** unter Dashboard → Community lädt herunter, was in deiner
Community steht — Beiträge, Kommentare, Seiten, Termine, den Aufbau deiner Kurse
und dein Team mit Name und Rolle, als eine einzige JSON-Datei.

Nicht dabei sind die Mitgliederliste, E-Mail-Adressen, private Nachrichten und
Meldungen aus der Moderation: Inhalte tragen den Namen ihrer Autorin oder ihres
Autors, die Kontaktdaten deiner Mitglieder bleiben deren Daten. Das Bündel sagt
selbst, was es weglässt.

Der Export ändert nichts an deiner Community und steht allein dem Owner offen.

[Nachlesen in der Hilfe](https://help.pukalani.app/anleitung/community-einstellungen)
```

**titleEn:** Community export: take everything with you

**bodyEn:**

```markdown
The **Export** tab under Dashboard → Community downloads what is in your
community — posts, comments, pages, events, the structure of your courses and
your team with name and role, as one single JSON file.

Not included are the member list, email addresses, private messages and
moderation reports: content carries its author's name, but your members' contact
details remain their data. The bundle states what it leaves out.

Exporting changes nothing in your community and is open to the owner alone.

[Read more in the help](https://help.pukalani.app/en/anleitung/community-einstellungen)
```

---

## 6 — Konto: Zwei-Faktor, Zeitzone, ein Name überall

**title:** Zwei-Faktor-Anmeldung, Zeitzone und ein Name fürs ganze Konto

**body:**

```markdown
Drei Neuerungen in deinen Konto-Einstellungen:

- **Zwei-Faktor-Anmeldung.** Unter Einstellungen → Sicherheit einschalten:
  Code aus einer Authenticator-App zusätzlich zum Passwort, dazu
  Wiederherstellungs-Codes für den Fall der Fälle. Sie gilt für die Anmeldung
  mit Passwort — meldest du dich über Google an, prüft Google die Faktoren.
- **Zeitzone.** Datum und Uhrzeit in deiner Zone statt in der des Geräts, mit
  Suche und einer Zeile, die die Wirkung sofort zeigt.
- **Ein Name für Erwähnungen, konto-weit.** Dein `@name` gilt jetzt in allen
  deinen Communities statt in jeder einzeln. Alte Erwähnungen bleiben heil:
  benennst du dich um, bleibt der alte Name für dich reserviert.

[Nachlesen in der Hilfe](https://help.pukalani.app/anleitung/dein-konto)
```

**titleEn:** Two-factor sign-in, time zone and one name for your whole account

**bodyEn:**

```markdown
Three additions to your account settings:

- **Two-factor sign-in.** Switch it on under Settings → Security: a code from an
  authenticator app on top of your password, plus recovery codes for the worst
  case. It applies to password sign-in — if you sign in with Google, Google
  verifies your factors.
- **Time zone.** Dates and times in your zone rather than your device's, with a
  search field and a line that shows the effect right away.
- **One name for mentions, account-wide.** Your `@name` now applies across all
  your communities instead of in each one separately. Old mentions stay intact:
  if you rename yourself, the old name stays reserved for you.

[Read more in the help](https://help.pukalani.app/en/anleitung/dein-konto)
```
