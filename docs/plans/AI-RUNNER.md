# AI-Runner — Tickets, die sich selbst umsetzen

**Status:** Konzept, noch nicht gebaut · **Angelegt:** 2026-08-17 ·
**Entscheider:** David

Ein Ticket auf `admin.pukalani.app` bekommt einen Knopf. Ein Klick, und auf
Davids Mac läuft Claude Code in einem eigenen Worktree gegen genau dieses
Ticket — mit dem Beschreibungstext als Auftrag, den Anhängen als Material,
dem gewählten Modell und Berechtigungs-Modus. Was dabei herauskommt (Branch,
Commit, Diffstat, Testergebnis, Kosten), steht danach im Ticket.

Kein neues Ticketsystem. Das Board steht seit `tickets-001`; hier kommt die
**Ausführungs-Schicht** dazu.

---

## 1. Was schon steht — und was nicht

**Steht:**

- [packages/tickets](../../packages/tickets) — Board mit Listen, Priorität,
  Aufwand, Checklisten, Fälligkeiten, Beobachtern, **Anhängen** (Bucket
  `ticket-files`, [ticketFiles.ts](../../packages/tickets/server/utils/ticketFiles.ts))
  und **KI-Triage** ([ticketTriage.ts](../../packages/tickets/server/utils/ticketTriage.ts)).
  Operator-Werkzeug: `requiredCapability: 'tickets.manage'`, `scope: 'operator'`.
- [packages/feedback](../../packages/feedback) — Feedback + Roadmap, und die
  Übernahme „Feedback → Ticket" inklusive Rückreferenz `feedbackId`
  ([ticketIngest.ts](../../packages/tickets/server/utils/ticketIngest.ts)).
- Der Zustand „In Prüfung → Geplant" ist heute schon eine Board-Liste. Listen
  sind Daten, keine Enum — das bleibt so.

**Steht NICHT, entgegen dem ersten Eindruck:** Der Kommentarbereich am Ticket
ist ein **Platzhalter**.
[TicketModalComments.vue](../../packages/tickets/app/components/TicketModalComments.vue)
rendert einen Hinweis, und `apps/control` extended `packages/comments` gar
nicht. Der comments-Layer *kann* `targetType: 'ticket'` als Operator-Ziel
(`pukalani.comments.operatorTargets`), aber in der Betreiber-Konsole ist er
nicht verdrahtet. **Das Ergebnis kann im MVP also nicht einfach „als Kommentar"
zurückfließen** — siehe §3.4.

---

## 2. Abgrenzung

Gebaut wird ein **Betreiber-Werkzeug für Davids eigene Arbeit**. Kein
Kundenprodukt, kein Mandanten-Thema, keine Datentür — der Layer läuft
ausschließlich in `apps/control`, und alles darin ist operator-only.

Nicht-Ziele (bewusst, nicht vergessen):

- Kein Deep-Link in die Claude-Desktop-App. Dafür gibt es keine belastbare
  öffentliche Übergabe. Der interaktive Weg ist ein Terminal mit fertigem
  Befehl (§7.3).
- Kein Cloud-Executor, keine GitHub-Action im ersten Wurf.
- Kein zweiter Agent (Codex o. ä.) — aber die Spalte `executor` wird angelegt
  und trägt heute nur `'claude-code'`. Das kostet jetzt nichts und spart
  später eine Migration.

---

## 3. Entscheidungen (David, 2026-08-17)

### 3.1 Eigener Layer `packages/runner` (Name entschieden 2026-08-17)

**Der Name ist `runner`, Produkt-Titel „AI-Runner"** (de = en, wie das
Konzeptdokument und der Mac-Daemon `tools/ai-runner`). Verworfen wurden:
`agents` (kollidiert mit Claude-Code-Vokabular im eigenen Haus —
`.claude/agents/`, `claude agents`, `--agents` — und ist zu breit, KI steckt
auch in core/tickets/moderation) sowie `ticket-runner`/`board-runner`/
`roadmap-runner` (Davids Kandidaten — ein Subjekt im Namen bäckt genau die
Kopplung ein, die dieser Abschnitt herausschneidet, und wäre der erste
Bindestrich-Layer neben 21 Einwort-Layern). Der sprechende Teil lebt im
Manifest-Titel, wo er nichts falsch verspricht.

Nicht in `tickets` hinein. Begründung: Prozess-Steuerung, Runner-Registrierung
und Ausführungs-Secrets haben in einem Board-Produkt nichts verloren, und der
Auslöser soll später auch ein Roadmap-Eintrag oder ein GitHub-Issue sein
können. `runner` kennt `tickets` **nicht** — die App verdrahtet (A14), so wie
`tickets` den `feedback`-Layer nicht kennt.

Der Bezug läuft über zwei neutrale Spalten `subjectType` / `subjectId`
(heute nur `'ticket'`), nicht über eine `ticketId`.

### 3.2 Transport: Polling mit Bearer-Secret, nicht Realtime

Appwrite Realtime authentifiziert per Session-Cookie oder JWT, **nicht per
API-Key**. Ein Hintergrunddienst müsste sich als Dienst-Nutzer anmelden und
sein JWT alle 15 Minuten erneuern. Für einen Ein-Mann-Dienst, der Standby,
Netzwechsel und VPN überleben soll, ist ein `POST /api/runner/runs/claim`
alle paar Sekunden schlicht robuster.

Folge: **der Runner braucht kein Appwrite-SDK.** Er spricht ausschließlich
HTTPS mit `admin.pukalani.app`. Eine Naht, ein Secret.

Die *Anzeige* im Board läuft weiterhin über die bestehende geteilte
JWT-Realtime — `run_events` mit `rowSecurity: false` und
Operator-Read, genau das Muster aus
[001-tickets-tables.ts](../../packages/tickets/scripts/migrations/001-tickets-tables.ts).

### 3.3 Headless zuerst

`claude -p --output-format stream-json`. Der Runner ist Elternprozess und
sieht alles — Live-Status und Abschlussbericht brauchen **keine Hooks**.
Hooks werden erst nötig, wenn David selbst im Terminal tippt (§7.3); dann
gibt es keinen mitlesenden Elternprozess mehr.

### 3.4 Ergebnis-Darstellung: eigener Bericht, kein Kommentar (MVP)

Weil der Kommentarbereich am Ticket ein Platzhalter ist (§1), rendert der
`runner`-Layer seinen **eigenen Lauf-Bericht** im Ticket-Modal. Das ist
ohnehin die bessere Form: Branch, Commit, Diffstat, Tests, Kosten und
Session-Id sind strukturierte Daten und keine Fließtext-Nachricht.

Der Ausbauweg bleibt offen und ist vorgesehen: `apps/control` extended
`packages/comments`, überschreibt `TicketModalComments` — genau das, was der
Platzhalter-Kommentar beschreibt. Dann kann der Runner zusätzlich einen
Kommentar schreiben und David darunter antworten. **Nicht im MVP:** das zieht
einen Layer mit eigenen Tabellen und einer Migration in die Betreiber-Konsole.

---

## 4. Datenmodell (Migration `runner-001`)

Alle drei Tabellen: `rowSecurity: false`, Schreiben **ausschließlich** über
Server-Routen mit dem Admin-Client.

**Lese-Publikum bewusst enger als bei `tickets`:** dort lesen `admin` UND
`moderator`. Hier nur `read(label:admin)`. Ein Lauf trägt Repo-Pfade,
Branch-Namen und Kostendaten von Davids Rechner; das ist keine
Moderations-Sache. Entsprechend ist die neue Capability `runner.manage` in
[authz.ts](../../packages/core/shared/authz.ts) **nur** in der Admin-Rolle,
nicht in `moderator` — anders als `tickets.manage`.

### `runners`

Ein registrierter Runner. Ein Eintrag je Rechner.

| Spalte | Typ | Bedeutung |
| --- | --- | --- |
| `name` | varchar | „MacBook Pro (David)" |
| `kind` | varchar | `'local' \| 'ssh'` — Anzeige, der Runner entscheidet selbst |
| `secretHash` | varchar | **Hash** des Bearer-Secrets (M9-Muster wie `community_invites`), nie der Klartext |
| `capabilitiesJson` | text | Was der Runner meldet: Repos, Modelle, erlaubte Modi — **Anzeige-Kopie**, keine Wahrheit (§8.1) |
| `lastSeenAt` | datetime | letzter Claim-Poll |
| `status` | varchar | `'active' \| 'disabled'` |

### `runs`

Ein Auftrag. Der Zustandsautomat lebt hier.

| Spalte | Typ | Bedeutung |
| --- | --- | --- |
| `subjectType` / `subjectId` | varchar | heute `'ticket'` + Ticket-Row-Id |
| `runnerId` | varchar | Ziel-Runner (`''` = beliebiger) |
| `executor` | varchar | heute immer `'claude-code'` |
| `status` | varchar | siehe unten |
| `repoKey` | varchar | **Schlüssel** aus der Runner-Allowlist, NIE ein Pfad (§8.1) |
| `baseBranch` | varchar | z. B. `main` |
| `workBranch` | varchar | vom Runner AUSGELESEN, nicht erfunden: mit CLI-Worktree vergibt die CLI den Namen (`worktree-<name>`, gemessen 2026-08-17) |
| `model` | varchar | `fable`/`opus`/`sonnet` oder voller Modellname |
| `permissionMode` | varchar | `default\|auto\|plan\|acceptEdits\|dontAsk\|bypassPermissions` |
| `interactive` | boolean | false = headless (MVP), true = Terminal öffnen |
| `promptSource` | mediumtext | der zusammengesetzte Auftrag, wie er abgeschickt wurde — als Mediumtext (off-row), NICHT varchar: mit Beschreibung + Checkliste + zitiertem Feedback sprengt eine große Karte sonst das ~65-KB-Zeilenbudget von MariaDB (pages-002-Lektion) |
| `promptTrusted` | boolean | false, wenn Text aus Gast-Feedback stammt (§8.2) |
| `testCommands` | text | JSON `string[]`, z. B. `["pnpm lint","pnpm -r test"]` |
| `maxBudgetUsd` | float | Deckel, wird vom Runner gegen seinen eigenen gekappt |
| `sessionId` | varchar | UUID, **vor** dem Start vergeben (§7.2) |
| `claimedAt`/`startedAt`/`finishedAt` | datetime | |
| `resultJson` | text | Commit, Diffstat, Tests, Kosten, Dauer |
| `error` | text | Klartext-Grund bei `failed` |
| `createdBy` | varchar | |

Zustände:

```
queued → claimed → running → ┬→ succeeded
                             ├→ needs_input   (Rückfrage, per --resume fortsetzbar)
                             ├→ failed
                             └→ cancelled
```

`queued → cancelled` muss auch **vor** dem Claim gehen (Knopf „Abbrechen").

### `run_events`

Eine Zeile Fortschritt. Das ist die Live-Anzeige.

| Spalte | Typ |
| --- | --- |
| `runId` | varchar (Index) |
| `seq` | integer — monoton, der Runner zählt |
| `kind` | `'status' \| 'tool' \| 'text' \| 'error'` |
| `message` | text |
| `at` | datetime |

**Nicht** das komplette `stream-json` hier ablegen. Der Runner verdichtet:
Statuszeilen, Werkzeugaufrufe mit Ziel, Fehler. Das volle Transkript bleibt
auf dem Mac und geht am Ende in einen EIGENEN Bucket des runner-Layers
(`runner-files`), hochgeladen über die Runner-Naht (§5). NICHT in den
Bucket `ticket-files`: dessen Upload-Route verlangt Session +
`tickets.manage` — der Runner hat nur sein Bearer-Secret —, und `runner`
kennt `tickets` nicht (A14). Der Lauf-Bericht (§3.4) verlinkt die Datei;
im Ticket-Modal ist das derselbe Ort.

---

## 5. Die Naht Website ↔ Runner

Alle Endpunkte unter `/api/runner/*`, Manifest-`apiPrefixes` entsprechend.
Zwei Publikums-Klassen, streng getrennt:

**Vom Board (Session, Capability `runner.manage`):**

- `POST /api/runner/runs` — Lauf anlegen (`queued`)
- `POST /api/runner/runs/:id/cancel`
- `GET /api/runner/runs?subjectId=…`
- `GET /api/runner/runners`
- `POST /api/runner/runners` — einen Rechner registrieren; die Antwort trägt
  das Bearer-Token **genau einmal**, gespeichert wird nur sein Hash. Nachgetragen
  am 2026-08-17 beim Bau der Routen: dieser Abschnitt beschreibt die NAHT — wie
  der erste Runner zu seinem Secret kommt, war darin schlicht nicht gestellt,
  und „Zeile von Hand anlegen und den Hash selbst ausrechnen" ist ein
  Betriebsschritt, den man irgendwann falsch macht (die Naht antwortet auf
  JEDEN Fehlweg 401 — ein Tippfehler ist von einem Angriff nicht zu
  unterscheiden).

**Vom Runner (Bearer-Secret, keine Session):**

- `POST /api/runner/runs/claim` — „hast du was für mich?"; setzt atomar
  `queued → claimed`, gibt höchstens einen Lauf zurück
- `POST /api/runner/runs/:id/events` — Fortschritt, gebündelt (nicht je Zeile)
- `POST /api/runner/runs/:id/finish` — Endzustand + `resultJson`
- `POST /api/runner/runs/:id/transcript` — Transkript-Datei (multipart) in
  den Bucket `runner-files`; Größe gedeckelt, nur für den claimenden Runner
- `POST /api/runner/runners/heartbeat` — `lastSeenAt` + gemeldete Fähigkeiten

Regeln für die Runner-Endpunkte:

- Secret als `Authorization: Bearer`, verglichen gegen `secretHash`
  (zeitkonstant). Nie als Query-Parameter — das landet in Logs.
- **Rate-Limit auf `claim`.** Ein Poll-Loop mit Fehler ist eine
  Selbst-DoS gegen die eigene Konsole.
- Ein Runner darf nur Läufe bewegen, die auf **ihn** geclaimt sind.
- `controlApiPrefixes` ist hier NICHT nötig — und das ist nachgelesen, nicht
  geraten: `01.control-center.ts` greift nur, wenn `00.tenant.ts`
  `event.context.controlCenter` gesetzt hat, also auf den Kontroll-Hosts der
  PLATFORM-App (`account.pukalani.app`). `apps/control` hat keinen
  Tenant-Gate; dort läuft die Middleware als No-op. Merkposten statt Regel:
  wandert der Layer je in die Platform-App, MUSS `/api/runner/` dort in die
  Präfix-Liste — sonst antwortet der Kundenbereich 404 auf jeden Claim.
- Der Claim `queued → claimed` ist mit Appwrite NICHT atomar zu haben —
  `updateRow` kennt kein Compare-and-swap. Reicht trotzdem, wenn man es
  ehrlich baut: die Konsole läuft als EIN Nitro-Prozess (pm2, Port 3003),
  also serialisiert ein In-Prozess-Mutex um den Claim-Handler alle Runner;
  zusätzlich prüft jede Folge-Route (`events`, `finish`), dass `runnerId`
  wirklich der Aufrufer ist. Wird die Konsole je mehr-instanzig, bricht
  diese Annahme — der Mutex gehört deshalb mit einem Kommentar an die
  Stelle geschrieben.

---

## 6. Prompt-Zusammenbau

Der Runner lädt sich den fertigen Auftrag, er baut ihn nicht selbst:

```
.ai-runs/<runId>/
├── prompt.md            # Titel, Beschreibung, Checkliste, Testbefehle
├── ticket.json          # Metadaten inkl. Rück-URL
└── files/               # Anhänge aus dem ticket-files-Bucket
    ├── screenshot-mobile.png
    └── fehler-log.pdf
```

Der Ordner liegt beim Runner (z. B. `~/.local/state/pukalani-runner/`),
NICHT im Repo. Weil die CLI den Worktree selbst anlegt, startet der Agent mit
cwd IM Worktree — ein relativer Pfad auf `.ai-runs/…` zeigt dort ins Leere,
und Lesen außerhalb des Arbeitsverzeichnisses ist ohne Freigabe gesperrt.
Deshalb: `prompt.md` nennt die Anhänge mit ABSOLUTEM Pfad, und der Start
bekommt `--add-dir` auf den `files/`-Ordner des Laufs (nur diesen einen —
nicht den ganzen State-Ordner, sonst liest ein Lauf die Anhänge fremder
Läufe). Der Rück-Link auf das Ticket geht per `--append-system-prompt`,
nicht in den Prompt — er ist Kontext, nicht Auftrag.

---

## 7. Der Runner

Liegt unter `tools/ai-runner` als eigenes Workspace-Paket (Node/TS). **Keine**
Nuxt-App, gehört nicht nach `apps/`.

### 7.1 Die Allowlist liegt lokal

`~/.config/pukalani-runner/config.json` — nicht in der Datenbank:

```jsonc
{
  "endpoint": "https://admin.pukalani.app",
  "secretFile": "~/.config/pukalani-runner/secret",
  "repos": {
    "maui-monorepo": {
      "path": "/Users/davidschubert/Developer/Projects/nuxt/maui-monorepo",
      "protectedBranches": ["main"],
      "allowedModes": ["plan", "acceptEdits", "auto"],
      "maxBudgetUsd": 5
    }
  }
}
```

Das ist die **wichtigste Einzelregel des ganzen Systems** (§8.1).

### 7.2 Ablauf eines headless Laufs

1. Claim erhalten. `sessionId` per `crypto.randomUUID()` erzeugen und sofort
   melden — das Ticket kennt seine Session ab Sekunde null, und `--resume`
   funktioniert auch dann noch, wenn der Runner zwischendurch abstürzt.
2. Repo aus der Allowlist auflösen (`repoKey` → Pfad). Unbekannt ⇒ `failed`.
3. Modus, Modell und Budget gegen die Allowlist kappen. Kein Fehler, sondern
   stilles Herunterstufen mit einer Ereigniszeile („Modus auf `plan` begrenzt").
4. Anhänge herunterladen.
5. Starten — der **Worktree kommt von der CLI**, nicht vom Runner:

   ```bash
   claude -p \
     --session-id "$RUN_SESSION" \
     --model "$MODEL" \
     --permission-mode "$MODE" \
     --worktree "ai-$RUN_ID" \
     --add-dir "$RUN_DIR/files" \
     --max-budget-usd "$BUDGET" \
     --append-system-prompt "Ticket: https://admin.pukalani.app/dashboard/tickets?ticket=$TICKET_ID" \
     --output-format stream-json --verbose \
     "$(cat .ai-runs/$RUN_ID/prompt.md)"
   ```

6. `stream-json` zeilenweise lesen, verdichten, gebündelt als Ereignisse
   schicken (etwa alle 2 s oder alle 20 Zeilen — nicht je Zeile).
   **`needs_input` kommt aus zwei Quellen, nicht aus dem Exit-Code:** dem
   `post_turn_summary`-Ereignis (`status_category: 'blocked'` samt
   `needs_action`-Text) und dem `permission_denials`-Array im Abschluss-JSON.
   Der Exit-Code lügt hier — siehe §11.
7. Testbefehle im Worktree fahren, Ergebnis einsammeln.
8. **Der Runner committet selbst** im Worktree (`git add -A && git commit`)
   und liest danach Branch, Commit-Hash und `--shortstat`. Nicht der Agent:
   `acceptEdits` erlaubt Dateiänderungen, aber kein `git commit` (gemessen
   2026-08-17 — der Commit-Versuch des Agenten wurde verweigert), und
   `Bash(git *)` freizugeben wäre mehr Rechte für weniger Kontrolle. So ist
   die Commit-Message deterministisch und trägt Ticket-Id + Session-Id.
   **Kein automatisches Pushen.**
9. `finish` mit `resultJson`, Transkript über
   `POST /api/runner/runs/:id/transcript` (eigener Bucket, §4 — nie über die
   tickets-Upload-Route, die verlangt eine Session).

### 7.3 Interaktiv (nach dem MVP)

`interactive: true` ⇒ der Runner öffnet ein Terminal mit demselben Befehl ohne
`-p` und mit `-n "T-0142 Mobile Navigation"` (die CLI kennt `-n/--name`,
das erscheint im `/resume`-Picker und im Fenstertitel). Der Rückkanal läuft
dann über **Hooks** (`SessionEnd`), weil kein Elternprozess mitliest.
`--tmux` ist optional und lohnt erst bei mehreren gleichzeitigen Läufen.

---

## 8. Sicherheit

### 8.1 Die Grenze liegt auf dem Mac, nicht in der Website

Die Datenbank darf **auswählen**, was der Runner **erlaubt** — nie umgekehrt.
Erlaubte Repo-Pfade, Modelle, Modi, Budget-Deckel und geschützte Branches
stehen in der lokalen Config. Deshalb reist auch nur ein `repoKey` über die
Naht, nie ein Pfad.

Warum das nicht verhandelbar ist: ein Auftrag an diesen Runner ist
Code-Ausführung auf Davids Rechner mit Dateisystem-Zugriff. Läge die
Allowlist in der DB, wäre jede Lücke in der Betreiber-Konsole eine
Remote-Code-Execution auf dem Laptop. Mit lokaler Allowlist ist der Schaden
auf „führt einen erlaubten Auftrag in einem erlaubten Repo aus" begrenzt.

Weitere Runner-seitige Riegel:

- `bypassPermissions` ist **per Repo** freizuschalten und nirgends Vorgabe.
- Nie auf einem geschützten Branch arbeiten — immer Worktree + eigener Branch.
- Kein `git push` ohne ausdrückliche Freigabe im Lauf.
- `.env`-Dateien werden nicht in den Worktree kopiert.
- Harte Laufzeit-Obergrenze; der Runner killt selbst.

### 8.2 Gast-Feedback ist ein Prompt-Injection-Pfad

[feedback/index.post.ts](../../packages/feedback/server/api/feedback/index.post.ts)
nimmt **bewusst auch Gäste** an, und `createTicketFromFeedback` macht daraus
ein Ticket. Baut man den Agent-Auftrag später aus `ticket.description`, kann
ein fremder Text Anweisungen enthalten. Dass ein Mensch auf „Übernehmen"
klickt, ist kein Schutz — er liest nicht jede Zeile.

Regel: Läufe zu einem Ticket mit `feedbackId !== ''` bekommen
`promptTrusted: false`. Dann gilt:

- Der Feedback-Text wird in `prompt.md` als **Daten** gerahmt (abgesetzter
  Block mit einem Satz davor, der sagt, dass es ein Zitat ist), nie als
  Auftragszeile.
- `permissionMode` ist auf `plan` und `acceptEdits` begrenzt —
  `bypassPermissions` und `dontAsk` sind gesperrt.
- Die Sperre sitzt **serverseitig** beim Anlegen des Laufs UND im Runner. Eine
  UI, die den Knopf ausgraut, ist keine Sicherung.

---

## 9. UI im Board

Im Ticket-Modal ein Bereich „Ausführen":

- **Vor dem Lauf:** Runner, Repo, Basis-Branch, Modell, Modus, Testbefehle,
  Budget. Vorbelegt aus der zuletzt benutzten Wahl. Ein Knopf.
- **Während des Laufs:** die Ereigniszeilen live (Realtime auf
  `run_events`), plus Abbrechen.
- **Danach:** der Bericht — Branch, Commit, Diffstat, Testergebnis, Dauer,
  Kosten, Session-Id, Transkript-Anhang. Bei `needs_input` ein Feld
  „Antworten" (`--resume`).

Auf der Karte selbst genügt ein kleines Zeichen mit dem Lauf-Zustand.
Datenlisten sind `UTable` (B6), aber ein Lauf-Verlauf ist keine Datenliste —
hier ist eine Zeitleiste richtig.

---

## 10. MVP-Schnitt

1. Layer `runner` anlegen: `product.manifest.ts`, `nuxt.config.ts`,
   `app.config.ts`, in `apps/control` extends + `site.manifest.ts`, in
   `LAYER_ORDER` von [migrate.mjs](../../scripts/migrate.mjs). Capability
   `runner.manage` in core (admin-only). `pnpm check:manifests` muss grün sein.
2. Migration `runner-001` — drei Tabellen, Indizes über
   `createIndexSteps`/`indexStep` (nie rohes `createIndex`).
3. Routen: die fünf Board-Routen + die fünf Runner-Routen.
4. UI: Bereich „Ausführen" im Ticket-Modal, verdrahtet in `apps/control`.
5. `tools/ai-runner`: Claim-Loop, lokale Allowlist, headless Start,
   Ereignis-Bündelung, Abschlussbericht.
6. Beweis: `packages/runner/scripts/verify-runner-boundary.mjs` — ein
   erfundener `repoKey`, ein gesperrter Modus und ein `promptTrusted:false`-Lauf
   mit `bypassPermissions` müssen **einzeln** rot werden. Gegenprobe wie bei
   `verify-handle-search-boundary.mjs`: die Prüfung ist erst etwas wert, wenn
   das Entfernen der Sicherung sie fallen lässt.

Erst danach: interaktiver Modus, SSH-Runner, comments-Verdrahtung in
`apps/control`, GitHub-Actions-Executor.

---

## 11. Fallen, vorab notiert

- **`--max-turns` gibt es nicht** (gegen die installierte CLI geprüft).
  Budget läuft über `--max-budget-usd`, und das wirkt nur mit `--print`.
- Die CLI kann Worktrees selbst (`-w/--worktree`). Baut der Runner sie
  zusätzlich, hat man zwei Wahrheiten. **Die Kombination `-w` MIT `-p` ist
  GEMESSEN und trägt** (2026-08-17, drei Testläufe im Scratch-Repo):
  Worktree entsteht unter `.claude/worktrees/<name>`, der Agent arbeitet
  nachweislich darin, `--session-id` mit vorab gewürfelter UUID kommt im
  Abschluss-JSON identisch zurück. Der Fallback (`git worktree add` von
  Hand) ist NICHT nötig.
- **Ein blockierter Lauf endet als „success" (gemessen).** Ohne passenden
  Permission-Mode verweigert die CLI headless jede Schreibaktion, beendet
  den Lauf aber mit `subtype: 'success'`, `is_error: false` — das Ergebnis
  ist dann nur die höfliche Bitte um Berechtigung. Die Wahrheit steht in
  `permission_denials` und im `post_turn_summary` (`status_category:
  'blocked'`). Ein Runner, der nur auf Exit-Code und `is_error` schaut,
  meldet Erfolge, die keine sind — genau daraus wird `needs_input`
  abgeleitet (§7.2).
- **`acceptEdits` erlaubt kein `git commit` (gemessen).** Dateien schreiben
  ja, committen nein. Deshalb committet der RUNNER (§7.2 Schritt 8) — dem
  Agenten `Bash(git *)` freizugeben wäre die falsche Antwort.
- `--output-format stream-json` braucht `--verbose`, sonst fehlen Zeilen.
- Ein Worktree hat weder `node_modules` noch `.env`. Wer im Lauf `pnpm test`
  fährt, braucht ein `pnpm install` davor — und muss wissen, dass das Minuten
  kostet und in jedem Budget landet.
- Dev-Server aus dem Worktree starten sonst mit dem cwd des Hauptrepos, und
  Ports sind von fremden Sitzungen belegt (CLAUDE.md „Worktree-Beweise").
  Ein Lauf, der einen Dev-Server braucht, muss seinen Port selbst wählen.
- Die Migration muss **vor** dem Code-Deploy laufen.
