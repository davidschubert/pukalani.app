# Runbook: Appwrite-Projekt `control` → `admin` (AH-4c)

**Was passiert hier:** das Appwrite-Projekt der Betreiber-Konsole zieht von
`control` nach `admin` um — neues Projekt (Ids sind unveränderlich, ein
„Umbenennen" gibt es nicht), alle Daten und Nutzer mit, danach Env-Schnitt.
Der Betreiber wird dabei genau einmal abgemeldet (Cookie wechselt von
`a_session_control` auf `a_session_admin`).

**Davids Entscheidung 2026-08-18** (DECISION-LOG; strukturierte Frage, gegen
die Empfehlung „nur Anzeige-Name" — der Gewinn ist Konsistenz der Namenswelt,
kein Kunde sieht die Projekt-Id). Vorlage: [ACCOUNT-CUTOVER.md](ACCOUNT-CUTOVER.md)
(AH-1, pool→account — dasselbe Muster, kleinerer Datenbestand).

**Die eine Stelle, an der es Kunden treffen kann:** die platform-App löst
JEDEN Mandanten-Host über dieses Projekt auf (`NUXT_PLATFORM_CONTROL_*`,
Read-only-Key). Ein toter oder falscher Verweis dort hat beim
studio-Aufräumen schon einmal alle Tenant-Hosts mit 500 gelegt. Deshalb:
Wartungsfenster, Env-Schnitt als EIN Handgriff je Site, Serien-Proben.

Die Kästchen sind **echt** und werden pro Durchlauf abgehakt. Wo eine Zahl
steht, gehört sie eingetragen — ein Häkchen ohne Messwert ist eine Behauptung.

---

## Inventar (Momentwerte! — vor dem Fenster FRISCH messen)

Stand 2026-08-18: **41 Tabellen · ~248 Rows · 5 Buckets** (nur `runner-files`
trägt Dateien: 4; die übrigen vier sind leer) · **1 Nutzer (OTP-only, ohne
Passwort-Hash) · 0 Teams**. Die Row-Zahl ist ein MOMENTWERT: `run_events` ist
zwischen zwei Messungen am selben Tag von 35 auf 104 gewachsen — der
AI-Runner schreibt laufend. Deshalb zählt für Phase 3 nur die Messung NACH
dem Runner-Stopp; Werkzeug: `--phase inventory`.

---

## 0 · Vorbedingungen (VOR dem Fenster, ohne Wirkung nach außen)

- [x] **Transfer-Werkzeug bereit** (2026-08-18):
      `scripts/ops/ah4c-project-transfer.mjs` + pure Regeln in
      `scripts/ops/ah4c-lib/rules.mts` (nutzt `hashPlanFor` aus f3-lib).
      Selbsttest 30/30 · vitest 54/54
      (`packages/control/tests/ah4cProjectTransfer.test.ts`) · Inventar-Lauf
      read-only bewiesen (schreibt im Trockenlauf wirklich nichts).
      Phasen: inventory → users (inkl. Teams) → rows → files → verify;
      Delta-Semantik: vorhandene, abweichende Rows werden mit `--execute`
      aktualisiert.
- [x] **Quell-Key** (2026-08-18): Transfer-Key auf `control` angelegt und
      grün geprobt (tables/users/teams/files je 200), Ablage
      `~/.appwrite-secrets/ah4c-transfer-control.env`. Befund: der
      BESTEHENDE Key in `migrations/control.env` konnte ohnehin schon 10
      von 11 Lese-Scopes (F42-Muster „breiter Schlüssel") — nach AH-4c
      gehören BEIDE widerrufen bzw. verengt (Schritt 6).
      Schlüssel-Ablage-Falle aus diesem Lauf: beim `pbpaste`-Rezept muss das
      SECRET der LETZTE Kopiervorgang sein — wer den Befehl selbst kopiert,
      trägt den Befehlstext als Key ein (zweimal passiert; die Befehle
      prüfen seither das `standard_`-Präfix).
- [x] **Ziel-Keys** (2026-08-18): Migrations-Key des neuen Projekts um
      `users.read/write`, `teams.read/write`, `files.read/write` ergänzt
      (ohne sie stirbt Phase users/files beim ersten Schreibversuch) und
      grün geprobt; Ablage `~/.appwrite-secrets/migrations/admin.env`.
      Runtime-Key grün inkl. Presences- und `/health`-Probe; Ablage
      `~/.appwrite-secrets/admin-runtime.key` (kommt beim Env-Schnitt in
      die Site-`.env`).
- [x] Nutzer-/Team-/Datei-Zahlen: Users **1** · Teams **0** · Dateien nur
      `runner-files` (4), übrige Buckets leer (2026-08-18).
- [x] Hash-Verfahren geprüft: das eine Konto ist OTP-only, kein Hash —
      Übernahme als `users.create` ohne Passwort (Betreiber-Konto per H2
      bewusst passwortlos).
- [ ] **AI-Runner pausiert einplanen**: der Mac-Daemon (tools/ai-runner)
      schreibt in `runners`/`runs`/`run_events` DIESES Projekts. Vor der
      Daten-Phase LaunchAgent stoppen, nach dem Schnitt mit neuem Projekt/Key
      wieder starten (seine Config zeigt auf die Konsole — Pfade im Memory
      „AI-Runner produktiv auf dem Mac").
- [ ] `pnpm ops:site-env` gelaufen — Env-Schlüssel-Listen je Server liegen vor
      (F44: eine fehlende Variable wird nicht rot).
- [ ] Wartungsfenster mit David abgestimmt: ______ (Datum/Uhrzeit; Bedarf
      grob 1–2 h, Kunden merken im Normalfall nichts)
- [ ] Stripe: Testmodus bestätigt (heute sk_test in der Site-Env,
      `stripe_settings` ist leer) — im Testmodus ist der Webhook-Teil
      risikoarm; NACH Stripe-Go-Live (A2) würde dieses Runbook einen eigenen
      Stripe-Abschnitt brauchen. Stand: ______

## 1 · Projekt `admin` anlegen (Konsolen-Klicks: David — oder Wegwerf-Provisioner)

- [ ] Projekt angelegt, Id **exakt** `admin`, Team „Pukalani App",
      Anzeigename „Admin (Control Plane)". (Tippfehler in der Id kostet den
      ganzen Durchlauf — Ids sind unveränderlich.)
- [ ] **Web-Platform `admin.pukalani.app` eingetragen.** Ohne sie ist in der
      Konsole jede Realtime lautlos tot — Sofort-Abmeldung, Glocke, Live-Theme
      (F45, im Projekt `control` live erwischt).
      Probe: `curl -H "Origin: https://admin.pukalani.app" https://api.pukalani.app/v1/account`
      mit `X-Appwrite-Project: admin` → **401** (akzeptiert), nicht
      `403 general_unknown_origin`. Ergebnis: ______
- [ ] Zwei API-Keys erzeugt (Ablage als Dateien unter `~/.appwrite-secrets/`):
      **Runtime** mit der vollen 10-Scope-Liste aus DEPLOYMENT.md —
      sessions/users/rows/health **plus** files.read/files.write **plus**
      presences.read/presences.write (genau an den Presences-Scopes ist AH-1
      gestolpert: eine Woche „0 online", lautlos) — und **Migrations**
      (databases/tables/columns/indexes + buckets + rows).
- [ ] TablesDB `main` angelegt.

## 2 · Schema (✅ VOR dem Fenster erledigt, 2026-08-18 — das Ziel ist leer und unbenutzt)

- [x] Projekt-Grundlagen von David angelegt und per Probe bestätigt: Id
      `admin`, Web-Platform `admin.pukalani.app` (Origin-Probe 401 =
      akzeptiert), drei Keys grün (Transfer-Key liest alles; Runtime-Key
      besteht die Presences-Probe UND `/health` — Achtung: `/health/version`
      ist konsolen-intern und antwortet JEDEM Server-Key 401, nicht als
      fehlenden Scope deuten). TablesDB `main` per API angelegt.
- [x] Voller Migrations-Lauf über den zentralen Runner (Layer-Satz =
      control-Manifest ∩ LAYER_ORDER + system, explizit übergeben — bei
      `--env-file` OHNE `--app` greift der Manifest-Filter nicht und es
      migrierten ALLE Layer):
      `pnpm migrate --env-file ~/.appwrite-secrets/migrations/admin.env
      --layer system --layer billing --layer pages --layer tickets
      --layer runner --layer control --layer admin` — alle grün.
- [x] Alle 41 Quell-Tabellen existieren im Ziel; alle 5 Buckets ebenfalls —
      die AH-1-Bucket-Lücke ist von den heutigen Migrationen selbst
      geschlossen (Werkzeug-Inventar Quelle↔Ziel).
- [x] **Ziel-SEEDS geprüft** (Migrationen seeden Rows — beim 1:1-Umzug sind
      das potenzielle Duplikate): `app_config`/`app_secrets` (je Id `global`)
      und `community_plans` (Plan-Key-Ids) sind deterministisch — die
      Delta-Semantik der rows-Phase ERSETZT sie durch die Quelle. Nur
      `ticket_lists` seedet mit Zufalls-Ids: die 6 Ziel-Seeds sind gelöscht
      (6×204, Ziel steht auf 0). Bei einem WIEDERHOLTEN Schema-Lauf diesen
      Punkt erneut prüfen.

## 3 · Daten und Nutzer (AI-Runner ist ab hier PAUSIERT)

> Reihenfolge zählt: erst Nutzer, dann Rows — Row-Permissions verweisen auf
> User-Ids; eine Row mit `read(user:…)` ins Leere ist unsichtbar.

- [ ] **Nutzer** übernommen (Users-API, Hashes/prefs/Labels/Verifikation,
      Ids erhalten). Übernommen: ______ von ______
- [ ] **Teams samt Mitgliedschaften** übernommen (per userId, ohne
      Einladungs-Mail; heute 0 — der Zweig läuft trotzdem mit, weil er zum
      1:1-Umzug gehört). Übernommen: ______
- [ ] **Rows** aller 41 Tabellen kopiert (Ids + Permissions erhalten,
      `Query.limit`-Paginierung). Rows: ______ von ______ (FRISCH gemessen
      nach Runner-Stopp; die 248 vom 2026-08-18 sind ein Momentwert)
- [ ] **Buckets + Dateien** kopiert — per REST, nicht über SDK
      `getFileDownload` (liefert keinen Buffer-tauglichen Typ, AH-1-Lektion).
      Dateien: ______
- [ ] Stichproben mit denselben Ids sichtbar: eine Community-Row, ein Ticket,
      ein `run_events`-Eintrag, eine Changelog-Zeile, eine Datei. ______

## 4 · Env-Schnitt (der eigentliche Cutover, EIN Handgriff je Site)

- [ ] **admin-Site** (`/home/ploi/admin.pukalani.app/.env`):
      `NUXT_PUBLIC_APPWRITE_PROJECT_ID=admin` + neuer Runtime-Key.
      Alles andere bleibt (`NUXT_PUBLIC_CONTROL_POOL_PROJECT=account`,
      Onboarding-Secret, Stripe-Envs, ploi-Token).
- [ ] **platform-Site**: `NUXT_PLATFORM_CONTROL_PROJECT_ID=admin` + neuer
      Read-only-Key (nur `rows.read`, wie `platform-control-readonly` heute).
      `NUXT_ONBOARDING_CONTROL_URL` bleibt — die Naht spricht den HOST, nicht
      das Projekt. **Das ist die kundenwirksame Zeile dieses Runbooks.**
- [ ] Delta-Lauf der Daten-Phase direkt vor dem Flip (was seit Phase 3
      dazukam). Delta: ______
- [ ] `pm2 reload` beider Sites (Deploy oder `--update-env`-Reload); Backups
      der alten `.env`-Stände als `.ah4c-backup` daneben.
- [ ] Gegenprobe `pnpm ops:site-env`: keine Pflicht-Variable fehlt — **ein
      Env-Häkchen gilt erst nach dieser Gegenprobe gegen die LIVE-Datei**
      (die AH-4-Lektion: zwei Sites trugen den Altwert, abgehakt war es
      trotzdem). Ergebnis: ______

## 5 · Verifikation (nichts davon ist optional, dreimal statt einmal)

- [ ] Betreiber-Login auf `admin.pukalani.app` (OTP) — neues Cookie
      `a_session_admin`, Dashboard vollständig (Communities-Liste = 8 Rows).
- [ ] `demo.pukalani.app` → 200 und richtige Community; ein zweiter
      Mandanten-Host ebenso; `comments.pukalani.app` → 200. (Das prüft die
      platform→admin-Naht — DIE Risiko-Stelle.)
- [ ] Realtime in der Konsole lebt: Glocke/Live-Theme reagiert (sonst
      Web-Platform aus Schritt 1 prüfen, F45).
- [ ] Presence-Probe gegen den neuen Runtime-Key (AH-1-Stolperstein):
      `curl -s .../v1/presences` → Liste, nicht 401. Ergebnis: ______
- [ ] Stripe-Testereignis an `https://admin.pukalani.app/api/stripe/webhook`
      → 200 (URL unverändert, aber der Handler liest jetzt aus `admin`).
- [ ] AI-Runner mit neuem Projekt/Key gestartet; `runs`-Smoke aus
      tools/ai-runner grün. Ergebnis: ______
- [ ] `packages/control/scripts/verify-onboarding.mjs` und
      `packages/onboarding/scripts/verify-control-exit.mjs`: ______ / ______
- [ ] Eine Community anlegen/ändern über den Wizard-Weg (Service-Naht
      platform→control schreibt jetzt in `admin`).

## 6 · Aufräumen (frühestens nach der Beobachtungszeit)

- [ ] Beobachtungszeit vereinbart: ______ (Vorschlag 14 Tage — und diesmal
      die Kästchen erst NACH der Tat abhaken; die F3-Lektion vom 2026-08-18).
- [ ] Projekt `control` **einfrieren**: Transfer-Key sofort widerrufen, die
      zwei Alt-Keys nach der Beobachtung (der Bestands-Key in
      `migrations/control.env` ist ohnehin zu breit — F42); Anzeigename in
      der Konsole auf „control [eingefroren, AH-4c]" — löschen erst viel
      später und mit dem Delete-500-Rezept griffbereit.
- [ ] **`app_secrets` prüfen/rotieren:** anders als bei F3 wandert diese
      Tabelle beim 1:1-Umzug MIT — die Kopie trägt also die Geheimnisse des
      alten Projekts. Nach dem Schnitt sichten und rotieren, was rotierbar
      ist; dasselbe gilt sinngemäß für kopierte `audit_logs` (Protokoll,
      bleibt) und `app_config` (gewollt).
- [ ] Alte Keys aus allen Server-`.env` und `.ah4c-backup`-Dateien entfernt.
- [ ] `~/.appwrite-secrets/migrations/control.env` → durch `admin.env`
      ersetzt; Wave-/Runner-Aufrufe (`pnpm migrate --app control`) zeigen auf
      die neue Env.
- [ ] Doku nachgezogen: CLAUDE.md (Projekt `control`/Cookie
      `a_session_control` → `admin`), DEPLOYMENT.md, hosts-und-ports,
      Memory `control-cutover-2026-07-26`; danach sagt die Namenswelt überall
      dasselbe — nur Ordner `apps/control`, Paketname und Release-Slot
      bleiben als Code-Anker (Davids geprüfte Ausnahme: `admin` ist als
      Layer-Name packages/admin vergeben).
- [ ] Eintrag in `docs/OPEN-ITEMS-COMPLETE.md` mit **Gelernt:**-Zeile.

---

## Wenn es schiefgeht

Der Rückweg ist **die Env**: `NUXT_PUBLIC_APPWRITE_PROJECT_ID=control` +
alte Keys auf der admin-Site, `NUXT_PLATFORM_CONTROL_PROJECT_ID=control` +
alter Read-only-Key auf platform, Reload — das alte Projekt ist bis zum
Aufräumen unangetastet. **Was der Rückweg nicht heilt:** alles, was zwischen
Schnitt und Rücknahme in `admin` geschrieben wurde (Tickets, Runs,
Audit-Log, neue Communities). Die Entscheidung gehört in die erste Stunde.
