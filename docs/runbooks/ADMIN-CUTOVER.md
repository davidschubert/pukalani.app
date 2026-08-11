# Runbook: Betreiber-Konsole `control.` → `admin.` (AH-4)

**Vorgang:** die Betreiber-Oberfläche antwortet künftig unter
`admin.pukalani.app`. Der Altname `control.pukalani.app` bleibt bestehen und
antwortet 301 — Pfad und Query unverändert.

**Davids Entscheidung 2026-08-11.** Spezifikation: docs/plans/ACCOUNT-HORIZONT.md
(AH-4). Vorlage dieses Vorgangs: docs/runbooks/CONTROL-CUTOVER.md
(studio→control, 2026-07-26) — dort stehen die Fallen, die hier vermieden sind.

---

## Das Wichtigste in vier Sätzen

1. **Nur die Adresse zieht um.** ploi-Site, Verzeichnis
   `/home/ploi/control.pukalani.app/`, Release-Slot `releases/control`, der
   pm2-Prozess `controlpukalaniapp`, die certbot-Lineage und das
   Appwrite-Projekt `control` behalten alle ihren Namen. Das ist bewusst so:
   eine Site-Umbenennung war beim letzten Cutover die teuerste Falle (pm2 findet
   seinen Prozess über den NAMEN und startet bei einer Umbenennung DANEBEN —
   zwei Prozesse, ein Port, gemischte Builds).
2. **Das Zertifikat muss beide Namen tragen.** Eine 301 wird erst NACH dem
   TLS-Handshake gesprochen. Ein Zertifikat nur für `admin` macht den Altnamen
   sofort unerreichbar — samt aller Lesezeichen und Dienste, die noch dorthin
   zeigen.
3. **Stripe folgt keiner Weiterleitung.** Die Webhook-URL im Stripe-Dashboard
   gehört aktiv umgehängt. Bis das passiert ist, kommen keine Ereignisse an,
   und das sieht man an nichts, was von allein rot würde.
4. **Es wird kein Schlüssel rotiert** (bewusst — Key-Swap ist ein eigenes
   Runbook, docs/runbooks/APPWRITE-KEYS.md).

---

## Vorher prüfen

- [ ] Code-Paket ist auf `main` und deployt (Branch `ah4-admin`): Middleware
      `apps/control/server/middleware/00.legacy-console-hosts.ts`, `PROBE`-Map in
      `.github/workflows/deploy.yml`, `admin.pukalani.app` in
      `scripts/ops/verify-tls.mjs`.
- [ ] `admin` steht in `RESERVED_SUBDOMAINS`
      (`packages/control/schemas/tenant.ts`) — kein Selbstbedienungs-Kunde kann
      den Namen beantragen.
- [ ] Aktuellen Zustand notieren: `pm2 jlist` (Name + cwd des control-Prozesses)
      und die heutige Stripe-Webhook-URL.

---

## 1 · DNS + Alias

- [ ] Cloudflare: `admin.pukalani.app` zeigt auf `49.13.211.173`.
      **Grau (nicht proxied)** wie alle Hosts außer dem Apex.
- [ ] ploi → Site `control.pukalani.app` → Verwalte → **Domain aliases** →
      `admin.pukalani.app` hinzufügen. ploi pflegt `server_name` selbst und lädt
      nginx neu.
- [ ] Gegenprobe, dass nginx den Namen kennt (noch ohne gültiges Zertifikat):
      `curl -sk -o /dev/null -w '%{http_code}\n' https://admin.pukalani.app/api/health`

## 2 · Zertifikat

Die Site hat eine EIGENE Lineage (`control.pukalani.app`) — sie hat mit dem
Wildcard `*.pukalani.app` nichts zu tun, und das ist der Grund, warum dieser
Schritt hier gefahrlos ist.

- [ ] ploi → Site `control.pukalani.app` → SSL → Zertifikat für **beide** Namen
      anfordern: `control.pukalani.app` UND `admin.pukalani.app`.
      **DNS-01 über Cloudflare** (Port 80 antwortet nur für explizit
      konfigurierte Hosts, die HTTP-Prüfung scheitert sonst).
- [ ] **NIEMALS** auf der ploi-Site `pukalani.app` ein Zertifikat anfordern —
      das überschreibt das Kunden-Wildcard (Vorfall 2026-07-27, platform + demo
      40 min tot).
- [ ] Gegenprobe: `node scripts/ops/verify-tls.mjs admin.pukalani.app` und
      `node scripts/ops/verify-tls.mjs control.pukalani.app` — beide grün.

## 3 · Env-Patch

- [ ] ploi → Site → Umgebung: `NUXT_PUBLIC_APP_URL=https://admin.pukalani.app`.
      Nicht kosmetisch: daraus baut `stripeWebhookUrl()` die URL, die unter
      `/dashboard/stripe` angezeigt und bei Stripe registriert wird.
- [ ] Bleibt LEER (die app.config trägt die Prod-Werte bereits):
      `NUXT_PUBLIC_CONTROL_CANONICAL_HOST`, `NUXT_PUBLIC_CONTROL_LEGACY_HOSTS`.
      Nur setzen, wenn eine Umgebung ohne Deploy umgehängt werden soll.
- [ ] Dienste, die die Konsole von außen ANSPRECHEN, mitziehen — eine 301 ist
      für einen Dienst-Aufruf kein Ersatz:
      - [ ] `apps/platform` → `NUXT_ONBOARDING_CONTROL_URL=https://admin.pukalani.app`
      - [ ] weitere Fundstellen prüfen: `pnpm ops:site-env`
- [ ] `pm2 reload` (bzw. der Deploy in Schritt 4) übernimmt die Env
      (`--update-env`).

## 4 · Deploy + 301

- [ ] Deploy laufen lassen (CI). Die Serien-Probe fragt jetzt
      `https://admin.pukalani.app/api/health` — sie ist damit selbst der erste
      Beweis, dass der neue Name lebt.
- [ ] Falls die Probe rot wird und pm2 zwei Prozesse am Port 3003 zeigt:
      `pm2 delete controlpukalaniapp` und Deploy erneut (die Falle aus dem
      studio→control-Umzug; hier NICHT zu erwarten, weil der Prozessname
      unverändert bleibt).

## 5 · Stripe-Webhook umhängen

Der Geldweg. Stripe folgt **keiner** 301.

- [ ] Stripe-Dashboard → Entwickler → Webhooks → bestehenden Endpunkt öffnen.
- [ ] URL ändern auf `https://admin.pukalani.app/api/stripe/webhook`.
      Ereignisliste unverändert lassen (alle neun, s.
      docs/runbooks/STRIPE-GO-LIVE-RUNBOOK.md).
- [ ] **Signing-Secret prüfen:** bleibt es beim Ändern der URL gleich, ist
      nichts zu tun. Vergibt Stripe ein neues, gehört es unter
      `/dashboard/stripe` (bzw. `NUXT_STRIPE_WEBHOOK_SECRET`) hinterlegt —
      sonst laufen alle Ereignisse in eine Signaturprüfung, die scheitert.
- [ ] Denselben Schritt im **Testmodus** wiederholen
      (docs/runbooks/STRIPE-TEST-WALKTHROUGH.md).

---

## Verifikation

- [ ] `curl -s -o /dev/null -w '%{http_code}\n' https://admin.pukalani.app/api/health`
      → **200**, und `jq .build` meldet den erwarteten Commit.
- [ ] `/docs` lebt: Login auf `https://admin.pukalani.app/docs` (Betreiber-Auth),
      Inhalt erscheint.
- [ ] **301 mit Pfad UND Query** — das ist der eigentliche Beweis:
      ```
      curl -sI 'https://control.pukalani.app/dashboard/stripe?tab=keys' | head -3
      ```
      Erwartung: `HTTP/2 301` und
      `location: https://admin.pukalani.app/dashboard/stripe?tab=keys`.
- [ ] Auch für eine API-Adresse (die 301 gilt bewusst für alles):
      `curl -sI https://control.pukalani.app/api/health | head -3`
- [ ] Keine Schleife: `curl -sIL https://control.pukalani.app/ | grep -c '^HTTP'`
      → genau zwei Antworten (301, dann 200).
- [ ] Stripe: im Dashboard **Testereignis senden** an den neuen Endpunkt →
      Antwort 200. Danach unter `/dashboard/stripe` prüfen, dass der zuletzt
      empfangene Zeitstempel frisch ist.
- [ ] `node scripts/ops/verify-tls.mjs` → alle Hosts grün (admin UND control).
- [ ] Anmeldung auf `admin.pukalani.app` funktioniert und das Konto-Menü zeigt
      **`/dashboard/settings`** (nicht `/settings`) — die Gegenprobe darauf,
      dass die Konsole nicht versehentlich als Kundenbereich gilt.
- [ ] Glocke oben in der Seitenleiste zeigt weiterhin die kontobezogenen
      Meldungen.

## Danach

- [ ] `docs/OPEN-ITEMS.md`: AH-4 raus, vollständiger Eintrag mit Datum und einer
      fetten **Gelernt:**-Zeile nach `docs/OPEN-ITEMS-COMPLETE.md`.
- [ ] UptimeRobot: Monitor auf `https://admin.pukalani.app/api/health` umstellen
      (Friendly-Name mitziehen — die alte „studio…"-Zeile hat 2026-07-26
      wochenlang falsch geheißen).
- [ ] Lesezeichen/Passwortmanager auf den neuen Namen ziehen.
- [ ] Den Altnamen NICHT abschalten. Er bleibt als 301 stehen und in
      `RESERVED_SUBDOMAINS` gesperrt — ein zurückgegebener Plattform-Name ist
      der beste Phishing-Köder, den es gibt.
