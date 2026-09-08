# Runbook: Appwrite 1.9.6 → 2.0.0 (self-hosted, MariaDB)

Gilt für beide Instanzen: **dev** (`~/Developer/orbstack/appwrite-maria/`,
OrbStack) und **prod** (`ploi@188.245.61.155:~/appwrite/`, `api.pukalani.app`).
Dev ist am 2026-09-08 nach genau diesem Ablauf gelaufen; die Fallen unten sind
dort live erwischt worden, nicht vermutet. Davids Entscheidung (DECISION-LOG
2026-09-08): Server UND SDKs in einem Vorhaben, Reihenfolge Code (SDK 28) →
dev → prod → SDK 29 + Web 27.

## Was 2.0.0 mitbringt (für uns relevant)

- Console IV (`appwrite/new:1.1.16`, ersetzt `appwrite/console:8.7.30`),
  neue Container `clickhouse` (Usage), `appwrite-geo`, `orchestrator`,
  Worker `jobs` + `notifications`; `worker-audits` entfällt.
- MariaDB bleibt (das Werkzeug **behält** die Engine, Postgres ist nur
  Default für Neuinstallationen). `_APP_DB_ADAPTER` steht schon in der .env.
- Entfernt: `GET /v1/health/executions`. Response-Format `2.0.0` für die
  SDKs `node-appwrite 29` / `appwrite 27`.
- `registers.php` trägt weiterhin `keepAlive: true` (Zeile 443) — der
  SMTP-Patch bleibt Pflicht (docs/runbooks/DEPLOYMENT.md § 1.5).
- Traefik-Basisflags sind zu 1.9.6 **unverändert**; die XFF-Override kann
  eins zu eins bleiben.

## Stufe 1 — node-appwrite 28 (läuft gegen 1.9.6 UND 2.0)

Zwei SDK-Brüche, beide am 2026-09-08 gegen die 2.0-Dev-Instanz bewiesen:

- `Health`-Service weg (seit 27) → REST-Helfer
  `packages/core/server/utils/appwriteHealth.ts` (gleiche Methodennamen, 5-s-
  Timeout, nackter 502). Beweis: `/api/admin/system` liefert die vier Pillen
  API/Database/Cache/Storage mit `pass`, Serverversion, Zeitabweichung 0.
- `account.createJWT` weg (seit 28) → `users.createJWT` am ADMIN-Client, die
  userId kommt NUR aus der bewiesenen Session (`account.get()` bzw.
  `event.context.user`). Braucht am API-Key den Scope **`users.write`** —
  alle vier Prod-Runtime-Keys (account, admin, portfolio, branding) haben ihn
  (Probe: users.create 201 → users/{id}/jwts 201 → delete 204, je Projekt).
  Das Web-SDK reicht den JWT als `&jwt=` in der Realtime-URL durch; der
  Socket meldet `connected` mit dem Nutzer — geprüft.
- Beweise dazu: verify-onboarding 28/28, verify-presence-boundary 23/23,
  verify-site-authz (Läufe hintereinander drosseln sich selbst: 429 in der
  Einladungs-Route ist ein Artefakt, nicht 2.0).

## Drei Fallen des Upgrade-Werkzeugs (2.0.0, live erwischt)

1. **`--no-start` wird ignoriert.** Das Werkzeug führt nach dem Schreiben
   der Dateien IMMER `docker compose up -d --remove-orphans
   --renew-anon-volumes` aus. Downtime beginnt also mit dem Aufruf, nicht
   erst mit einem eigenen `up`.
2. **Der Start läuft OHNE `docker-compose.override.yml`** (das Werkzeug
   ruft compose mit explizitem `-f docker-compose.yml`). Traefik lief danach
   ohne `trustedIPs`, der mails-Worker ohne SMTP-Patch. Kur: direkt danach
   ein eigenes `docker compose up -d` im `appwrite/`-Verzeichnis — das liest
   die Override und ersetzt nur die abweichenden Container.
3. **Die Override zeigt noch auf die 1.9.6-Patchdatei.** Ein 1.9.6-
   `registers.php` in einem 2.0.0-Container ist falsch (52 Diff-Zeilen: DB-
   Defaults, DocumentsDB/VectorsDB-Zweige). Vor dem eigenen `up` die Zeile
   auf `patches/registers-2.0.0-keepalive-off.php` umstellen. Die Datei
   NICHT vorher umstellen: sie würde bei jedem Container-Neustart in das
   noch laufende 1.9.6-Image gemountet.

Und: `migrate` läuft NICHT automatisch (Flag `--migrate` steht auf false).

## Ablauf

- [ ] **Backup.** Im `appwrite/`-Verzeichnis:
  ```bash
  TS=$(date +%Y%m%d-%H%M); mkdir -p ../backups
  docker exec appwrite-mariadb sh -c 'mariadb-dump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --quick --all-databases' | gzip > ../backups/appwrite-pre-2.0.0-$TS.sql.gz
  tar czf ../backups/appwrite-config-pre-2.0.0-$TS.tgz docker-compose.yml docker-compose.override.yml .env patches
  gzip -dc ../backups/appwrite-pre-2.0.0-$TS.sql.gz | grep -c '^CREATE TABLE'   # dev: 669
  ```
  Die Variable heißt `MYSQL_ROOT_PASSWORD` (nicht `MARIADB_ROOT_PASSWORD`) —
  mit der falschen ist der Dump 20 Byte groß und sieht nur im `ls` verdächtig aus.
- [ ] **Patchdatei bereitlegen** (aus dem Image, eine Zeile geändert):
  ```bash
  docker run --rm --entrypoint=cat appwrite/appwrite:2.0.0 /usr/src/code/app/init/registers.php > patches/registers-2.0.0.orig.php
  sed 's/keepAlive: true,/keepAlive: false,/' patches/registers-2.0.0.orig.php > patches/registers-2.0.0-keepalive-off.php
  diff patches/registers-2.0.0.orig.php patches/registers-2.0.0-keepalive-off.php   # genau Zeile 443
  ```
- [ ] **Images vorziehen** (verkürzt das Fenster): `appwrite/appwrite:2.0.0`,
  `appwrite/new:1.1.16`, `appwrite/geo:0.3.1`, `appwrite/browser:0.3.4`,
  `appwrite/embedding:0.3.1`, `clickhouse/clickhouse-server:26.4.3-alpine`,
  `ghcr.io/open-runtimes/orchestrator/orchestrator:1.9.2`,
  `openruntimes/executor:0.29.0`.
- [ ] **Upgrade-Werkzeug** im ELTERN-Verzeichnis (das mit dem Ordner `appwrite/`):
  ```bash
  docker run --rm --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="upgrade" appwrite/appwrite:2.0.0 --interactive=N
  ```
  Schreibt `docker-compose.yml` + `.env` neu (Backups `*.<epoch>.backup`
  daneben), kopiert das Builds-Volume um (`appwrite_appwrite-builds` →
  `appwrite-builds`, Original bleibt) und STARTET die Container (Falle 1+2).
  Erwartet: „Appwrite installed successfully".
- [ ] **Override umstellen + eigenes `up`:**
  ```bash
  cd appwrite
  sed -i 's#registers-1.9.6-keepalive-off.php#registers-2.0.0-keepalive-off.php#' docker-compose.override.yml
  docker compose up -d
  docker inspect appwrite-traefik --format '{{json .Config.Cmd}}' | tr ',' '\n' | grep -c trustedIPs   # 2
  docker exec appwrite-worker-mails grep -n keepAlive /usr/src/code/app/init/registers.php          # false
  ```
- [ ] **Migration:** `docker compose exec -T appwrite migrate` → endet mit
  „Migration completed" (dev: ~1 min, alle Collections + Documents).
- [ ] **Beweise:** `curl -s http://localhost/v1/health/version` → `2.0.0`;
  mit Projekt-Key `health/db`, `health/cache`, `health/storage` → `pass`;
  `users?limit=1` und `tablesdb/main/tables` liefern die alten Bestände;
  Console (`/console`) antwortet 302 → Login. Realtime-Log: „JWT expired"-
  Zeilen sind offene Tabs mit altem Token, KEIN Befund — Subscriptions
  müssen `realtime.success true` melden.
- [ ] **.env-Diff lesen** (`diff .env.*.backup .env`): 2.0 ergänzt ~60
  Schlüssel (VCS, DocumentsDB/VectorsDB, Jobs, Geo, ClickHouse), entfernt
  `_APP_USAGE_*_INTERVAL`, quotet Werte neu. Eigene Werte (SMTP, Domain,
  Keys) bleiben — nachprüfen.
- [ ] **Aufräumen:** `docker-compose.yml.<epoch>.backup` und `.env.<epoch>.backup`
  behalten, bis prod eine Woche stabil läuft; das alte Volume
  `appwrite_appwrite-builds` erst dann löschen.

## Prod-Besonderheiten

- Fenster: dev brauchte vom Werkzeug-Aufruf bis „Migration completed" rund
  vier Minuten mit vorgezogenen Images. Prod hat 28 Container und ~30 GB
  belegt (43 GB frei, 2026-09-08).
- Die Web-Apps sprechen währenddessen ins Leere: `/api/health` bleibt 200
  (die Route fragt Appwrite nicht), Seiten mit Session laufen in 5xx —
  kein Deploy in diesem Fenster.
- Danach die drei Wächter: `pnpm ops:schema-parity` (alle vier Prod-
  Projekte), `verify-tls.mjs` (unberührt, nur zur Sicherheit),
  Mail-Beweis: eine OTP-Anmeldung auf `account.pukalani.app` löst die erste
  Instanz-Mail nach Leerlauf aus — genau die, die der KeepAlive-Bug fraß.

## Rückweg

`.env` und `docker-compose.yml` aus `*.backup` zurückkopieren
(`_APP_VERSION=1.9.6`), Override auf die 1.9.6-Patchdatei, `docker compose
up -d --remove-orphans`, Dump zurückspielen (`mariadb < dump.sql` im
mariadb-Container). Das umkopierte Builds-Volume stört den Rückweg nicht.
