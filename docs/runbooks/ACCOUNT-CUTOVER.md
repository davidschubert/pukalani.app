# Runbook: Account-Cutover (AH-1)

**Was passiert hier:** das geteilte Appwrite-Projekt `pool` zieht nach `account`,
und der Kundenbereich zieht von `my.pukalani.app` / `start.pukalani.app` nach
`account.pukalani.app`. **In EINEM Fenster** — Kunden werden dabei genau einmal
abgemeldet (Sessions wandern nicht mit).

Grundlage: `docs/plans/ACCOUNT-HORIZONT.md`, Davids Entscheidung vom 2026-08-11
(DECISION-LOG). Muster für die Deploy-Handgriffe: `docs/runbooks/CONTROL-CUTOVER.md`.

Die Kästchen sind **echt** und werden pro Durchlauf abgehakt. Wo eine Zahl
steht, gehört sie eingetragen — ein Häkchen ohne Messwert ist eine Behauptung.

---

## 0 · Vorbedingungen (VOR dem Fenster, ohne Wirkung nach außen)

- [ ] Der Code-Stand ist auf `main` und deployt: `controlHosts:
      ['account.pukalani.app']`, `wizardHosts: []`, `legacyControlHosts`
      gefüllt, `defaultPoolProject: 'account'`.
      **Wichtig:** dieser Stand ist erst NACH dem Env-Wechsel richtig — bis
      dahin zeigen die Envs auf `pool` und `my.`, und die Envs schlagen den
      Code-Default. Deshalb ist ein Deploy hier ungefährlich.
- [ ] Hash-Algorithmus der Bestandskonten gegen die Users-API der 1.9.6
      verifiziert (`createBcryptUser` / `createArgon2User` / …). Ergebnis: ______
- [ ] Anzahl zu migrierender Konten: ______ · Communities: ______ ·
      Rows gesamt (grob): ______
- [ ] Wartungsfenster mit David abgestimmt: ______ (Datum/Uhrzeit, Dauer)
- [ ] `pnpm ops:site-env` gelaufen — Liste der Env-SCHLÜSSEL je Server liegt
      vor, damit hinterher nichts fehlt (F44: eine fehlende Variable wird nicht rot).

## 1 · Projekt `account` anlegen

- [ ] Projekt in der Appwrite-Konsole angelegt, Id **exakt** `account`,
      Anzeigename „Account". (Ids sind unveränderlich — ein Tippfehler hier
      kostet den ganzen Durchlauf.)
- [ ] **Web-Platform `*.pukalani.app` eingetragen.** Ohne sie ist auf JEDEM
      Mandanten-Host jede Realtime tot, und zwar lautlos (F45).
      Probe: `curl -H "Origin: https://demo.pukalani.app" https://api.pukalani.app/v1/account`
      → erwartet **401** (akzeptiert), NICHT `403 general_unknown_origin`. Ergebnis: ______
- [ ] Zwei API-Keys erzeugt: Runtime (sessions/users/rows/health) und
      Migrations (databases/tables/columns/indexes). Ablage wie gehabt als
      Dateien, nie im Repo.
- [ ] Datenbank `main` angelegt.

## 2 · Schema

- [ ] Voller Migrations-Lauf gegen die neue Instanz über den zentralen Runner:
      `pnpm migrate --app platform` mit der Config des neuen Projekts.
- [ ] `pnpm ops:schema-parity` — die `system`-Tabellen von `account` decken sich
      mit der Vereinigung aller Instanzen. Abweichungen: ______

## 3 · Daten und Nutzer

> Reihenfolge zählt: erst Nutzer, dann Rows. Row-Permissions verweisen auf
> User-Ids; eine Row, deren `read(user:…)` ins Leere zeigt, ist unsichtbar.

- [ ] **Nutzer** übernommen (Users-API, Passwort-Hashes mitgenommen), inklusive
      `prefs` und aller `Role.label(<communityId>)`-Labels.
      Übernommen: ______ von ______
- [ ] **Rows** aller Tabellen kopiert (tabellenweise, `Query.limit`-Paginierung,
      Row-Ids und Permissions beibehalten). Tabellen: ______ · Rows: ______
- [ ] **Buckets + Dateien** kopiert (`fonts`, `media`, Avatare, GDPR-Snapshots).
      Dateien: ______
- [ ] Stichprobe: eine Community, ein Kommentar, ein hochgeladenes Bild, ein
      Custom Theme — in der neuen Instanz sichtbar und mit denselben Ids.

## 4 · Envs umstellen (der eigentliche Schnitt)

- [ ] `platform`: `NUXT_PUBLIC_APPWRITE_PROJECT_ID=account`, neuer Runtime-Key,
      `NUXT_PUBLIC_TENANCY_CONTROL_HOSTS=account.pukalani.app`,
      `NUXT_PUBLIC_TENANCY_WIZARD_HOSTS=` (leer),
      `NUXT_PUBLIC_TENANCY_LEGACY_CONTROL_HOSTS=my.pukalani.app,start.pukalani.app`
- [ ] `platform`: `NUXT_PUBLIC_APP_URL` und `NUXT_PUBLIC_I18N_BASE_URL` auf den
      neuen Host gezogen (soweit sie den Kundenbereich nennen).
- [ ] `control`: `NUXT_PUBLIC_CONTROL_POOL_PROJECT=account`,
      `NUXT_ONBOARDING_START_URL=https://account.pukalani.app`,
      Pool-Lesekey (`NUXT_PLATFORM_CONTROL_*` bzw. der Runtime-Key für Labels)
      auf das neue Projekt.
- [ ] `marketing`: die vier `NUXT_PUBLIC_MARKETING_*_URL` zeigen auf
      `account.pukalani.app` (oder sind leer — dann greift der Code-Default,
      der schon dorthin zeigt).
- [ ] Gegenprobe `pnpm ops:site-env`: keine Pflicht-Variable fehlt. Ergebnis: ______

## 5 · Deploy

- [ ] `platform`, `control` und `marketing` neu deployt (CI oder Runbook
      DEPLOYMENT.md). Build-SHA live: ______
- [ ] `pm2` läuft auf allen drei Sites, kein Restart-Loop.
- [ ] `node scripts/ops/verify-tls.mjs` — grün, inklusive `account.pukalani.app`
      UND der zwei Altnamen (die 301 wird erst nach dem Handshake gesprochen).
      Ergebnis: ______

## 6 · Verifikation (nichts davon ist optional)

- [ ] `https://account.pukalani.app/` → Kunden-Übersicht „Deine Communities"
      (nicht der Wizard).
- [ ] `https://account.pukalani.app/start` → Wizard.
- [ ] `https://my.pukalani.app/communities` → **301** auf
      `https://account.pukalani.app/communities`.
- [ ] `https://start.pukalani.app/?code=TEST-1234` → **301** auf
      `https://account.pukalani.app/?code=TEST-1234`, und dort landet man im
      Wizard mit vorbefülltem Code. (Der teuerste Einzelfall des ganzen
      Cutovers — Einladungs-Mails sind sieben Tage gültig.)
- [ ] Anmeldung auf `account.pukalani.app` mit einem MIGRIERTEN Bestandskonto
      und dessen altem Passwort. Konto: ______
- [ ] Handoff `account.` → Community-Dashboard: eingeloggt angekommen.
- [ ] Community-Switcher im Dashboard: beide Ausgänge sichtbar
      („Community anlegen" → `account.pukalani.app/start`,
      „Communities verwalten" → `account.pukalani.app/communities`) und beide
      landen EINGELOGGT.
- [ ] Realtime auf einem Mandanten-Host: Live-Branding oder Glocke reagiert.
      (Schlägt das fehl: Web-Platform aus Schritt 1 prüfen.)
- [ ] Verify-Skripte des onboarding-Layers gegen die neue Instanz:
      `verify-control-host` ______ · `verify-site-authz` ______ ·
      `acceptance-onboarding` ______ · `verify-control-exit` ______
- [ ] Eine Einladungs-Mail ausgelöst und den Link gelesen: er nennt
      `account.pukalani.app`, kein `start.`.
- [ ] Stripe: eine Rückkehr aus dem Checkout landet auf
      `/dashboard/community/plan` der richtigen Community.

## 7 · Kunden informieren

- [ ] Wartungs-Hinweis raus: „Du wurdest einmalig abgemeldet, bitte neu
      anmelden. Der Kundenbereich heißt jetzt account.pukalani.app."
- [ ] **OHNE Link in der Mail.** Eine Mail, die kurz nach einem
      Adresswechsel zum Anmelden auffordert, ist formal von einer
      Phishing-Mail nicht zu unterscheiden — der neue Name gehört genannt,
      nicht verlinkt.
- [ ] Hilfe-Site (`apps/help`) nennt den neuen Namen (im Code erledigt, nach
      dem Deploy einmal nachsehen).

## 8 · Aufräumen (frühestens nach der Beobachtungszeit)

- [ ] Beobachtungszeit vereinbart: ______ (Vorschlag: bis alle
      Einladungs-Codes abgelaufen sind, also mindestens 7 Tage; die 301 selbst
      darf länger stehen bleiben — sie kostet nichts).
- [ ] Projekt `pool` bleibt **eingefroren**, nicht gelöscht: keine neuen Rows,
      keine Keys im Umlauf. Runtime-Key von `pool` widerrufen: ______
- [ ] Alte Keys aus allen Server-`.env` entfernt (nicht nur überschrieben).
- [ ] `my.`/`start.` bleiben in `RESERVED_SUBDOMAINS` — **nie** freigeben.
- [ ] Plausible-Site für die Kontroll-Hosts anlegen (U18) — jetzt erst, damit
      sie den richtigen Namen trägt. Davids Entscheidung dazu steht noch aus.
- [ ] Eintrag in `docs/OPEN-ITEMS-COMPLETE.md` mit einer Zeile **Gelernt:**,
      wo etwas nicht auf Anhieb ging.

---

## Wenn es schiefgeht

Der Rückweg ist **die Env**, nicht der Code: alle Host- und Projekt-Werte sind
Env-Overrides über Code-Defaults. Auf den alten Stand zurück heißt also
`NUXT_PUBLIC_APPWRITE_PROJECT_ID=pool`,
`NUXT_PUBLIC_TENANCY_CONTROL_HOSTS=my.pukalani.app,start.pukalani.app`,
`NUXT_PUBLIC_TENANCY_WIZARD_HOSTS=start.pukalani.app`,
`NUXT_PUBLIC_TENANCY_LEGACY_CONTROL_HOSTS=` (leer),
`NUXT_PUBLIC_CONTROL_POOL_PROJECT=pool` — plus die alten Keys, plus ein Deploy.

**Was der Rückweg NICHT heilt:** alles, was zwischen Schnitt und Rücknahme in
`account` geschrieben wurde, steht dann in der falschen Instanz. Je länger das
Fenster offen ist, desto teurer wird die Rücknahme — die Entscheidung gehört
deshalb in die erste Stunde, nicht in den zweiten Tag.
