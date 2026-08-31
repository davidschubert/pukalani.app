# branding.supply — Einrichtung (Runbook)

Stand: 2026-09-01. Ausführung des abgenommenen Plans
[BRANDING-SUPPLY-INFRA.md](../plans/BRANDING-SUPPLY-INFRA.md).
Arbeitsteilung: **Schritt 1 klickt David** (Konsole, ~5 min — es gibt
bewusst keinen Script-Console-Zugang), den Rest fährt Claude. Häkchen
sind ECHT — je Durchlauf abhaken.

## 1 · Appwrite-Projekt `branding` (Konsolen-Klicks: David)

Konsole der Prod-Appwrite öffnen (dieselbe wie für portfolio/admin).

- [ ] **Projekt anlegen:** Create project → Name „Branding Supply",
      **Project-Id MANUELL auf `branding`** stellen (Ids sind
      unveränderlich — NICHT die Auto-Id nehmen!), Team = dein
      Pukalani-Team (dasselbe wie portfolio/admin/account).
- [ ] **Database anlegen:** Databases → Create → **Id MANUELL `main`**,
      Name „main". (Die Migrationen legen KEINE Database an —
      AH-4c-Falle.)
- [ ] **Web-Platform 1:** Overview → Add platform → Web → Name
      „branding.supply", Hostname `branding.supply`.
- [ ] **Web-Platform 2:** ebenso für Hostname `www.branding.supply`.
      (F45-Lehre: ohne Platform ist jeder Browser-Flow des Hosts tot.)
- [ ] **Key 1 „nuxt-ssr-prod" (Runtime):** API keys → Create, Ablauf
      „Never". Scopes: EXAKT die 10 Häkchen des bestehenden
      `nuxt-ssr-prod`-Keys im Projekt `admin` spiegeln (dort ablesen —
      das ist die beim admin-Cutover verengte, geprobte Liste; KEIN
      „Select all", das ist die 84-Scope-Falle).
- [ ] **Key 2 „migrations" (Migrationen):** ebenso, Scopes exakt wie der
      `migrations`-Key im Projekt `admin` (12 Häkchen).
- [ ] **Ablage (file-to-file, nie in den Chat):**
      `~/.appwrite-secrets/migrations/branding.env` anlegen mit den vier
      Zeilen des bekannten Formats (wie `migrations/admin.env`):
      Endpoint der Prod-Appwrite, `NUXT_PUBLIC_APPWRITE_PROJECT_ID=branding`,
      `NUXT_PUBLIC_APPWRITE_DATABASE_ID=main`, `NUXT_APPWRITE_KEY=<Key 2>`.
      Den Runtime-Key (Key 1) zusätzlich in
      `~/.appwrite-secrets/branding-runtime.key` ablegen (eine Zeile) —
      er wandert in Schritt 5 in die Server-.env der Site.
- [ ] Claude Bescheid geben („Projekt steht").

## 2 · Migrationen (Claude, nach Schritt 1)

- [ ] `pnpm migrate --app branding` gegen die Prod-Instanz (Env aus
      `~/.appwrite-secrets/migrations/branding.env`): system-001…038 +
      brand-001…008. Zweiter Lauf = Idempotenz-Beweis (alles ↷).
- [ ] app_config-Row prüfen/anlegen (Seed-Verhalten der system-Migrationen).
- [ ] `pnpm ops:schema-parity` — neue Instanz `branding` grün.

## 3 · Monorepo (Claude — läuft bereits parallel)

- [ ] apps/branding (Port 3006) + portfolio-Rückbau + Wächter-Listen,
      CI grün. (Details im Infra-Plan §2.)

## 4 · DNS + ploi + TLS (Claude; braucht D2-Token für TLS)

- [ ] **D2 (David):** Cloudflare-Token mit Scope für die Zone
      branding.supply ablegen (Scope des bestehenden
      `~/.appwrite-secrets/cloudflare-dns.token` erweitern ODER eigenen
      Token als `cloudflare-dns-branding.token` daneben).
- [ ] DNS: `branding.supply` A → Maui-Server (grau) · `www` CNAME Apex.
- [ ] ploi-Site branding.supply → Port 3006 (D3: freigegeben).
- [ ] Zertifikat branding.supply + www via DNS-01; nginx www→Apex 301.
- [ ] verify-tls.mjs um beide Hosts erweitern.

## 5 · Deploy (Claude)

- [ ] Server-.env der Site füllen (Runtime-Key aus Schritt 1, SMTP,
      NUXT_PUBLIC_I18N_BASE_URL=https://branding.supply).
- [ ] deploy.yml + ecosystem-branding.config.cjs (pm2 `brandingsupply`),
      Release-Slot `releases/branding`, Health-Probe.
- [ ] Erster Deploy; Proben: `/` 200 · `/api/health` 200 ·
      `/api/brand/profiles` 404 · invite/check neutral {valid:false}.
- [ ] ops:site-env-Pflichtliste + production-watch nachziehen.

## 6 · Beta öffnen (Claude + David)

- [ ] `pnpm brand:invite` → Code für David (Mail-gebunden).
- [ ] `pnpm brand:access --mode invite`.
- [ ] David registriert sich über den Einladungs-Link, läuft den Wizard
      an — der lebendige End-to-End-Beweis des Streaming-Protokolls
      (Dev-Stub bleibt aus; ohne P2-Prompts antwortet George statisch).
