# AI-Runner — der Rechner-Dienst

Der Mac-Daemon zu [docs/plans/AI-RUNNER.md](../../docs/plans/AI-RUNNER.md)
(Paket 4). Er holt sich Läufe bei `admin.pukalani.app` ab, startet die
Claude-Code-CLI in einem eigenen Worktree, meldet den Fortschritt zurück und
schreibt am Ende Commit, Diffstat, Testergebnisse und Kosten in den Lauf.

Kein Appwrite-SDK, keine Laufzeit-Abhängigkeit: nur `node:`-Builtins und das
globale `fetch`. Eine Naht, ein Secret (§ 3.2).

---

## Einrichtung

### 1. Rechner registrieren — das Token gibt es GENAU EINMAL

Im Board unter **`/dashboard/runner` → „Runner registrieren"**. Der Dialog
zeigt das Bearer-Token ein einziges Mal und bleibt dafür offen; gespeichert
wird serverseitig nur sein Hash. Wer es wegklickt, registriert einen neuen
Rechner — nachreichen kann es niemand.

Das Token hat die Form `<runnerId>.<secret>`. Es kommt in eine eigene Datei:

```bash
mkdir -p ~/.config/pukalani-runner
printf '%s\n' '<runnerId>.<secret>' > ~/.config/pukalani-runner/secret
chmod 600 ~/.config/pukalani-runner/secret
```

### 2. Config anlegen

`~/.config/pukalani-runner/config.json` (anderer Ort per Umgebungsvariable
`PUKALANI_RUNNER_CONFIG`):

```jsonc
{
  "endpoint": "https://admin.pukalani.app",
  "secretFile": "~/.config/pukalani-runner/secret",
  "pollSeconds": 3,          // optional, Minimum 2 (wird geklemmt)
  "heartbeatSeconds": 60,    // optional
  "maxRunMinutes": 30,       // optional — harte Obergrenze je Lauf
  "stateDir": "~/.local/state/pukalani-runner",  // optional
  "claudeBin": "claude",     // optional — voller Pfad, wenn PATH karg ist (launchd!)
  "repos": {
    "maui-monorepo": {
      "path": "/Users/davidschubert/Developer/Projects/nuxt/maui-monorepo",
      "protectedBranches": ["main"],              // optional, Vorgabe ["main"]
      "allowedModes": ["plan", "acceptEdits"],    // Pflicht
      "allowedModels": ["opus", "sonnet"],        // optional — weglassen = alle
      "maxBudgetUsd": 5                           // Pflicht
    }
  }
}
```

**Diese Datei ist die Wahrheit, nicht die Datenbank** (§ 8.1). Über die Naht
reist nur ein `repoKey`, nie ein Pfad; erlaubte Modi, Modelle, Budget-Deckel
und geschützte Branches stehen ausschliesslich hier. Ein Lauf, der etwas
anderes will, wird still heruntergestuft — mit je einer Zeile in der
Zeitleiste, damit man es am Board sieht.

Prüfen, ohne etwas zu starten:

```bash
node --experimental-strip-types src/main.ts --dry-config
```

Das druckt die geladene Config **ohne** das Secret (nur den Pfad der Datei).

### 3. Starten

```bash
pnpm start              # Dauerbetrieb
pnpm start -- --once    # genau EIN Claim-Zyklus (End-zu-End-Beweis)
```

Node 22.6+ genügt (`--experimental-strip-types`); ab 22.18 ist das
Type-Stripping ohnehin die Vorgabe.

### 4. Als Dienst (Ausblick)

Noch nicht gebaut, aber vorgesehen: eine `launchd`-Datei unter
`~/Library/LaunchAgents/app.pukalani.ai-runner.plist` mit
`KeepAlive`, `RunAtLoad`, `StandardOutPath`/`StandardErrorPath` in eine
Log-Datei — und `claudeBin` als vollem Pfad in der Config, weil launchd einen
kargen `PATH` mitbringt. Bis dahin läuft der Dienst in einem Terminal.

---

## Was ein Lauf tut (§ 7.2)

1. `sessionId` würfeln und **sofort** melden — das Ticket kennt seine Session
   ab Sekunde null, `--resume` trägt auch nach einem Absturz des Runners.
2. `repoKey` gegen die lokale Allowlist auflösen. Unbekannt ⇒ Fehlschlag
   `unknown_repo_key`.
3. Modus, Modell und Budget kappen. Bei `promptTrusted: false` bleiben nur
   `plan` und `acceptEdits` (§ 8.2, zweite Sicherung neben der serverseitigen).
4. Anhänge nach `<stateDir>/runs/<runId>/files/` laden, `prompt.md` schreiben —
   Anhänge werden dort mit **absolutem** Pfad genannt, weil der Agent mit cwd
   im Worktree startet.
5. `claude -p --session-id … --worktree ai-<runId> --add-dir <files>
   --output-format stream-json --verbose` starten; der Prompt geht über
   **stdin**, nicht als Argument.
6. `stream-json` mitlesen, verdichten, alle 2 s oder 20 Zeilen gebündelt
   melden. Das rohe Protokoll landet als `transcript.jsonl` im Lauf-Ordner.
7. **Der Runner committet selbst** im Worktree (`acceptEdits` erlaubt kein
   `git commit`). Es wird **nie** gepusht und **nie** auf einem geschützten
   Branch gearbeitet.
8. Testbefehle im Worktree fahren, Exit-Code und die letzten 20 Zeilen
   einsammeln. Ein Fehlschlag bricht die Kette nicht ab.
9. Transkript hochladen, `finish` mit Bericht.

### Der Ausgang wird nicht am Exit-Code abgelesen

Ein blockierter Lauf endet in der CLI als `success` mit `is_error: false`
(§ 11, gemessen). `needs_input` kommt deshalb aus zwei anderen Quellen: dem
`permission_denials`-Array der Abschluss-Zeile und einem `post_turn_summary`
mit `status_category: 'blocked'`.

---

## Betriebsgrenzen

- **Eine Instanz je Secret.** Zwei Prozesse mit demselben Token claimen
  gegeneinander; der Server serialisiert zwar den Claim, aber die zwei Läufe
  liefen dann gleichzeitig auf demselben Rechner — geteilte Ports, geteilte
  Caches, zwei Zeitleisten, die niemand mehr auseinanderhält. Der Daemon fährt
  bewusst nur **einen** Lauf gleichzeitig und pollt währenddessen nicht.
- **Stirbt der Daemon mitten im Lauf, bleibt der Lauf auf `running` stehen.**
  Jeder normale Weg endet in genau einem `finish` — auch Abbruch,
  Zeitüberschreitung, unerwarteter Fehler und `SIGINT`/`SIGTERM` (dann
  `failed` mit `runner_shutdown`). Was das nicht abdeckt, ist ein `kill -9`
  oder ein Stromausfall. Die Kur ist der **Abbrechen-Knopf im Board**; ein
  Zeitgeber, der fremde Läufe für tot erklärt, gehört nicht in einen Dienst,
  der auch mal drei Tage offline ist.
- **Testbefehle kennen keine Shell.** `"pnpm -r test"` wird an Leerzeichen
  zerlegt und ohne Shell gestartet — Pipes, Umleitungen, Variablen und
  Anführungszeichen gibt es nicht. Ein Befehl mit solchen Zeichen wird
  **nicht ausgeführt** und im Bericht als solcher ausgewiesen (Exit `-1`);
  wer eine Pipeline braucht, legt ein Skript ins Repo und ruft das auf.
  Zeitüberschreitung eines Tests ⇒ Exit `-2`.
- **Kein automatisches `pnpm install`.** Ein Worktree hat weder `node_modules`
  noch `.env`. Wer Abhängigkeiten braucht, schreibt den Install als **ersten**
  Testbefehl — das kostet Minuten und landet in jedem Budget, und das soll man
  sehen.
- **Abgebrochene Läufe werden nicht committet.** Die Arbeit liegt im Worktree
  und kann von Hand angesehen werden.
- Ein Lauf mit `interactive: true` (§ 7.3) öffnet stattdessen **Terminal.app**
  mit dem fertigen `claude`-Befehl ohne `-p` (zum Zuschauen und Genehmigen). Das
  Ende meldet ein **SessionEnd-Hook** an `POST …/session-end`; committet, getestet
  und abgeschlossen wird danach wie sonst. „Abbrechen" vom Board beendet das
  offene Terminal **nicht** — es hängt an keinem Prozess, den der Runner hält.

## Ablage

```
<stateDir>/runs/<runId>/
├── prompt.md          # der Auftrag, wie er abgeschickt wurde (+ Anhang-Pfade)
├── files/             # die Anhänge — nur dieser Ordner geht per --add-dir hinein
└── transcript.jsonl   # das rohe stream-json (wird zusätzlich hochgeladen)
```

Der Ordner wird **nicht** aufgeräumt: er ist das lokale Gedächtnis eines Laufs
und die Grundlage für ein späteres `--resume`.

## Prüfen

```bash
node --experimental-strip-types scripts/smoke.mjs   # lädt jede Datei + prüft die puren Regeln
pnpm typecheck                                      # tsc --noEmit (braucht die Workspace-Verdrahtung)
```

Der Smoke-Test kommt ohne Netz, ohne Agent und ohne Commit aus. Er prüft
genau die Stellen, die Sicherungen sind: das Kappen gegen die Allowlist, die
`needs_input`-Ableitung, das Zerlegen der Testbefehle, das Säubern der
Anhang-Namen und das Schrumpfen des Berichts auf das Spalten-Budget.
