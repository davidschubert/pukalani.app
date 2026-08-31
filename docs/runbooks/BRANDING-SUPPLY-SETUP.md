# branding.supply — Einrichtung (Runbook)

Stand: 2026-09-01. Ausführung des abgenommenen Plans
[BRANDING-SUPPLY-INFRA.md](../plans/BRANDING-SUPPLY-INFRA.md).
Arbeitsteilung: **Schritt 1 klickt David** (Konsole, ~5 min — es gibt
bewusst keinen Script-Console-Zugang), den Rest fährt Claude. Häkchen
sind ECHT — je Durchlauf abhaken.

## 1 · Appwrite-Projekt `branding` (Konsolen-Klicks: David)

Konsole der Prod-Appwrite öffnen (dieselbe wie für portfolio/admin).

- [x] **Projekt anlegen:** Create project → Name „Branding Supply",
      **Project-Id MANUELL auf `branding`** stellen (Ids sind
      unveränderlich — NICHT die Auto-Id nehmen!), Team = dein
      Pukalani-Team (dasselbe wie portfolio/admin/account).
- [x] **Database anlegen:** Databases → Create → **Id MANUELL `main`**,
      Name „main". (Die Migrationen legen KEINE Database an —
      AH-4c-Falle.)
- [x] **Web-Platform 1:** Overview → Add platform → Web → Name
      „branding.supply", Hostname `branding.supply`.
- [x] **Web-Platform 2:** ebenso für Hostname `www.branding.supply`.
      (F45-Lehre: ohne Platform ist jeder Browser-Flow des Hosts tot.)
- [x] **Key 1 „nuxt-ssr-prod" (Runtime):** API keys → Create, Ablauf
      „Never". Scopes: EXAKT die 10 Häkchen des bestehenden
      `nuxt-ssr-prod`-Keys im Projekt `admin` spiegeln (dort ablesen —
      das ist die beim admin-Cutover verengte, geprobte Liste; KEIN
      „Select all", das ist die 84-Scope-Falle).
- [x] **Key 2 „migrations" (Migrationen):** ebenso, Scopes exakt wie der
      `migrations`-Key im Projekt `admin` (12 Häkchen).
- [ ] **Ablage (file-to-file, nie in den Chat) — EINZIGER offener Punkt
      aus Schritt 1, David:**
      `~/.appwrite-secrets/migrations/branding.env` anlegen mit den vier
      Zeilen des bekannten Formats (wie `migrations/admin.env`):
      Endpoint der Prod-Appwrite, `NUXT_PUBLIC_APPWRITE_PROJECT_ID=branding`,
      `NUXT_PUBLIC_APPWRITE_DATABASE_ID=main`, `NUXT_APPWRITE_KEY=<Key 2>`.
      Den Runtime-Key (Key 1) zusätzlich in
      `~/.appwrite-secrets/branding-runtime.key` ablegen (eine Zeile) —
      er wandert in Schritt 5 in die Server-.env der Site.
- [x] Claude Bescheid geben („Projekt steht").

## 2 · Migrationen (Claude, nach Schritt 1)

- [ ] `pnpm migrate --app branding` gegen die Prod-Instanz (Env aus
      `~/.appwrite-secrets/migrations/branding.env`): system-001…038 +
      brand-001…008. Zweiter Lauf = Idempotenz-Beweis (alles ↷).
- [ ] app_config-Row prüfen/anlegen (Seed-Verhalten der system-Migrationen).
- [ ] `pnpm ops:schema-parity` — neue Instanz `branding` grün.

## 3 · Monorepo (Claude — läuft bereits parallel)

- [x] apps/branding (**Dev**-Port 3006) + portfolio-Rückbau +
      Wächter-Listen, CI grün. (Details im Infra-Plan §2.)

## 4 · DNS + ploi + TLS (Claude)

- [x] ~~**D2 (David):** Cloudflare-Token mit Scope für die Zone
      branding.supply~~ — **NICHT NÖTIG GEWESEN.** Beide Namen sind
      eigene Domains DIESER ploi-Site und grau (nicht proxied), also
      antwortet Port 80 für sie und **HTTP-01 hat gereicht**. Die
      DNS-01-Pflicht der Zone pukalani.app kommt von Wildcards und
      Aliassen — die gibt es hier nicht.
- [x] DNS: `branding.supply` A → 49.13.211.173 (grau) · `www` CNAME
      auf den Apex (grau).
- [x] ploi-Site branding.supply (**Id 402929**) auf Server app-prod
      (118713) → **Port 3007** (D3: freigegeben).
      **NICHT 3006:** Dev- und Prod-Portachse sind getrennt, und auf dem
      SERVER hält help die 3006 (Portkarte: 3002 portfolio · 3003 admin ·
      3004 platform · 3005 www/marketing · 3006 help · 3007 branding).
      Der Plan hatte die beiden Achsen verwechselt.
- [x] Zertifikat branding.supply + www (eigene Lineage `branding.supply`,
      HTTP-01); nginx www→Apex 301.
- [x] verify-tls.mjs um beide Hosts erweitern.

## 5 · Deploy (Claude)

- [ ] **Server-.env der Site füllen — wartet auf Davids Runtime-Key aus
      Schritt 1.** Pflichtliste = der `branding`-Block in
      `scripts/ops/verify-site-env.mjs`: `NUXT_APPWRITE_KEY`,
      `NUXT_PUBLIC_APPWRITE_ENDPOINT`, `NUXT_PUBLIC_APPWRITE_PROJECT_ID`,
      `NUXT_PUBLIC_APPWRITE_DATABASE_ID`, `NUXT_SMTP_HOST/PORT/USER/PASS/FROM`,
      `NUXT_PUBLIC_APP_URL=https://branding.supply`,
      `NUXT_PUBLIC_I18N_BASE_URL=https://branding.supply`.
      Der Migrations-Key gehört NICHT auf den Server.
- [x] deploy.yml + ecosystem-branding.config.cjs (pm2 `brandingsupply`,
      Port 3007), Release-Slot `releases/branding`, Health-Probe.
- [ ] Erster Deploy; Proben: `/` 200 · `/api/health` 200 ·
      `/api/brand/profiles` 404 · invite/check neutral {valid:false}.
- [ ] production-watch nachziehen (der `server`-Job fährt
      `ops:site-env` täglich — der neue Block wird dort automatisch
      mitgeprüft, sobald die .env steht).

## 6 · Beta öffnen (Claude + David)

- [ ] `pnpm brand:invite` → Code für David (Mail-gebunden).
- [ ] `pnpm brand:access --mode invite`.
- [ ] David registriert sich über den Einladungs-Link, läuft den Wizard
      an — der lebendige End-to-End-Beweis des Streaming-Protokolls
      (Dev-Stub bleibt aus; ohne P2-Prompts antwortet George statisch).
