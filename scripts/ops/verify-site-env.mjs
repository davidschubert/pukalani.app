#!/usr/bin/env node
/**
 * Env-Wächter: prüft für JEDE Site auf dem Server, ob die Variablen gesetzt
 * sind, ohne die sie eine Aufgabe still nicht erfüllt.
 *
 *   node scripts/ops/verify-site-env.mjs                 # alle Sites
 *   node scripts/ops/verify-site-env.mjs platform        # eine Site
 *
 * WARUM ES DAS GIBT (F44, 2026-08-02): `platform.pukalani.app` hatte KEIN
 * `NUXT_SMTP_*`. Damit ging für JEDE Kunden-Community nie eine
 * Benachrichtigungs-Mail raus — Antworten, Erwähnungen, Digest, die
 * Zahlungswarnung des Owners. Niemandem fiel es auf, weil ein fehlender
 * Mailer sich exakt wie ein bewusst abgeschaltetes Produkt verhält: die App
 * läuft, die Seite antwortet, nur die Mail bleibt aus. Gefunden wurde es
 * zufällig beim Beweis für einen ANDEREN Punkt.
 *
 * Das ist dieselbe Sorte Loch wie beim TLS-Wächter nebenan: die Konfiguration
 * ist falsch, aber nichts wird rot. Deshalb dieselbe Antwort — nachsehen, was
 * WIRKLICH auf dem Server steht, statt zu glauben, was in einer Vorlage steht.
 *
 * WERTE VERLASSEN DEN SERVER NIE. Über ssh läuft nur ein `grep -oE` auf die
 * SCHLÜSSELNAMEN; ein Passwort steht damit weder im Terminal noch in einem
 * CI-Log. Deshalb kann dieses Skript auch nur „fehlt ganz" erkennen und nicht
 * „steht drin, ist aber falsch" — für Letzteres ist die Probe im jeweiligen
 * Runbook zuständig.
 *
 * ── ZWEITE FRAGE SEIT 2026-08-18 (E1b): ZEIGT MEIN RECHNER AUFS RICHTIGE
 * PROJEKT? ──────────────────────────────────────────────────────────────────
 * `apps/platform/.env.production` zeigte nach dem Account-Cutover (AH-1) noch
 * auf `pool` — das Projekt, das der Cutover EINGEFROREN hat. Das ist die
 * gefährliche Sorte Altlast, weil sie nicht tot ist, sondern LEISE: ein
 * Migrations-Lauf dagegen wirft keinen Fehler, er schreibt ins Leere, und man
 * hält das Ergebnis für den Prod-Stand. In der Nacht auf den 18. wäre genau
 * das fast passiert (posts-022 gegen `pool` statt `account`).
 *
 * Deshalb vergleicht der Wächter jetzt zusätzlich, WELCHES Appwrite-Projekt
 * der Server nennt, mit dem, was die lokalen Dateien behaupten — die
 * `.env.production` im Repo und die Migrations-Schlüssel unter
 * `~/.appwrite-secrets/migrations/`. Weicht eines ab, ist das ein Fehler und
 * kein Hinweis: es ist die Datei, mit der jemand als Nächstes migriert.
 *
 * DAS VERSPRECHEN „WERTE BLEIBEN AUF DEM SERVER" GILT WEITER. Gelesen wird
 * genau EIN Wert, und der ist per Konstruktion öffentlich:
 * `NUXT_PUBLIC_APPWRITE_PROJECT_ID` steht in jeder ausgelieferten Seite (jedes
 * `NUXT_PUBLIC_*` landet im Browser). Ein zweiter Wert gehört hier NICHT dazu
 * — wer das erweitert, kippt die Zusage, die diesen Wächter überhaupt
 * betreibbar macht.
 *
 * Exit 0 = alles da · Exit 1 = eine Pflicht-Variable fehlt ODER eine lokale
 * Datei zeigt auf ein anderes Projekt als der Server.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SERVER = process.env.PUKALANI_OPS_SSH || 'ploi@49.13.211.173'

/**
 * Pflicht = „ohne das erfüllt die Site eine Aufgabe still nicht".
 *
 * BEWUSST eine gepflegte Liste und nicht die Schlüssel aus `.env.example`:
 * die Vorlage führt auch Optionales (`NUXT_ENTITLEMENTS_URL`), und ein
 * Wächter, der Optionales anmahnt, wird weggelesen — dann übersieht man den
 * echten Fund. Neue Pflicht-Variable ⇒ hier eintragen.
 */
const SITES = [
  {
    dir: 'platform.pukalani.app',
    name: 'platform',
    note: 'Pool-App — alle Kunden-Communities',
    // E1b: genau die zwei Dateien, mit denen jemand versehentlich gegen das
    // eingefrorene `pool` migriert. Beide zeigen auf DIESELBE Site.
    localProjectFiles: ['apps/platform/.env.production', '~/.appwrite-secrets/migrations/account.env'],
    required: [
      'NUXT_APPWRITE_KEY',
      'NUXT_PUBLIC_APPWRITE_ENDPOINT',
      'NUXT_PUBLIC_APPWRITE_PROJECT_ID',
      'NUXT_PLATFORM_CONTROL_KEY',
      'NUXT_ONBOARDING_SERVICE_SECRET',
      // F44: ohne diese fünf verschickt der Pool NICHTS.
      'NUXT_SMTP_HOST',
      'NUXT_SMTP_PORT',
      'NUXT_SMTP_USER',
      'NUXT_SMTP_PASS',
      'NUXT_SMTP_FROM',
      // Link-Basis für Mails ohne Community-Bezug (D5-Rückfall).
      'NUXT_PUBLIC_APP_URL',
      // Analytics v2: ohne den Schlüssel misst die Plattform weiter, aber JEDER
      // Kunde sieht auf /dashboard/community/analytics „Statistik gerade nicht
      // erreichbar" — dieselbe Sorte stiller Ausfall wie das fehlende SMTP.
      'NUXT_ANALYTICS_STATS_API_KEY',
      /**
       * KI (2026-08-18). `apps/platform` erklärt `pukalani.ai.enabled: true`
       * und verkauft `ai` ab dem PRO-Tarif (`tenancy.products`, 149 €) — ohne
       * Schlüssel sind alle Verbraucher dunkel: die zwei
       * Moderations-Assistenten, die Übersetzungs-Vorschläge und der
       * Kategorie-Übersetzer. Dieselbe Sorte Loch wie F44, nur teurer: nichts
       * wird rot, die Knöpfe erscheinen einfach nicht — die Oberfläche ist
       * ehrlich („kein Schlüssel ⇒ kein Knopf"), und genau deshalb fällt
       * niemandem auf, dass ein bezahltes Produkt fehlt. Gefunden, als der
       * Übersetzungs-Knopf auf freelancer.supply (Plan: pro) nicht erschien.
       *
       * PFLICHT IST HIER DER UMSCHLAG, NICHT DER SCHLÜSSEL SELBST: seit
       * system-036 trägt der Betreiber den KI-Schlüssel über die Konsole ein
       * (`instance_secrets`, verschlüsselt). Damit das Feld dort aufgeht, muss
       * `NUXT_INSTANCE_SECRETS_KEY` gesetzt sein. `NUXT_AI_KEY` steht bewusst
       * NICHT in dieser Liste: er ist seither der ZWEITE Weg, und ein Wächter,
       * der einen von zwei gleichwertigen Wegen anmahnt, erzieht zum
       * Weglesen. Ob überhaupt ein Schlüssel da ist, sagt jetzt die Konsole
       * selbst (`aiKeySource`).
       *
       * NUR HIER Pflicht: `control` schaltet `pukalani.ai` nicht ein (seine
       * Ticket-Triage fährt über den EIGENEN Key NUXT_TICKETS_AI_KEY, s. u.),
       * `portfolio` erst recht nicht.
       */
      'NUXT_INSTANCE_SECRETS_KEY',
    ],
  },
  {
    // Seit AH-4b (2026-08-18) heißt die ploi-Site — und damit das Server-
    // Verzeichnis — wirklich `admin.pukalani.app`; nur Release-Slot und
    // Appwrite-Projekt behalten den Namen `control`.
    dir: 'admin.pukalani.app',
    name: 'control',
    note: 'Betreiber-Oberfläche — Stripe-Webhook, Einladungen, Missbrauchsmeldungen',
    // Die `.env.production` steht hier bewusst MIT drin, obwohl sie als tot
    // bekannt ist (E1, Projekt `studio` gelöscht): der Wächter soll sie
    // anschlagen, solange sie auf Davids Rechner liegt — sonst ist „bekannt"
    // nur ein Satz in einer Liste, den man beim nächsten Mal nicht liest.
    // Seit AH-4c (2026-08-18) läuft die Konsole auf dem Appwrite-Projekt
    // `admin` — die Migrations-Env heißt entsprechend; die alte control.env
    // liegt eingefroren daneben (`control.env.ah4c-eingefroren`).
    localProjectFiles: ['apps/control/.env.production', '~/.appwrite-secrets/migrations/admin.env'],
    required: [
      'NUXT_APPWRITE_KEY',
      'NUXT_PUBLIC_APPWRITE_ENDPOINT',
      'NUXT_PUBLIC_APPWRITE_PROJECT_ID',
      'NUXT_CONTROL_ONBOARDING_SECRET',
      'NUXT_SMTP_HOST',
      'NUXT_SMTP_PORT',
      'NUXT_SMTP_USER',
      'NUXT_SMTP_PASS',
      'NUXT_SMTP_FROM',
      'NUXT_PUBLIC_APP_URL',
      /**
       * F55: entschlüsselt die in `stripe_settings` abgelegten Stripe-
       * Geheimnisse (AES-256-GCM, 64 Hex-Zeichen — `openssl rand -hex 32`).
       *
       * PFLICHT NUR HIER, nicht auf jeder Site: `control` ist die einzige
       * Site, auf der ein Mensch die Stripe-Seite bedient. (Bis F3 galt der
       * Zusatz „die Silo-Site `comments` montiert billing zwar auch, fährt
       * ihre Keys aber über NUXT_STRIPE_*" — sie wird seit dem Umzug ins
       * account-Projekt nicht mehr ausgerollt; `apps/comments` gibt es weiter,
       * aber nur noch als E2E-Fahrzeug ohne Server-.env.)
       *
       * Fehlt sie HIER, sieht man das sofort und ehrlich (die Karte sagt
       * „nicht eingerichtet" und nennt den Namen) — es ist also kein stiller
       * Ausfall wie bei F44. Sie steht trotzdem in der Liste, weil sonst nach
       * dem nächsten Server-Umzug niemand mehr weiß, dass es sie gab.
       */
      'NUXT_BILLING_SETTINGS_KEY',
      /**
       * KI-Triage des Ticket-Boards (P3) — seit 2026-08-18 ist das Gate
       * `pukalani.tickets.ai.enabled` in apps/control offen (Davids
       * Entscheidung). Der OpenRouter-Key ist die zweite Hälfte: fehlt er,
       * ist die Triage still aus (isAiAvailable() false) und die App läuft
       * trotzdem — exakt der F44-Fall, den diese Liste fangen soll.
       */
      'NUXT_TICKETS_AI_KEY',
    ],
  },
  {
    dir: 'portfolio.pukalani.app',
    name: 'portfolio',
    note: 'Silo-Kunde — verschickt bewusst keine Mails (kein SMTP nötig)',
    localProjectFiles: ['apps/portfolio/.env.production'],
    required: [
      'NUXT_APPWRITE_KEY',
      'NUXT_PUBLIC_APPWRITE_ENDPOINT',
      'NUXT_PUBLIC_APPWRITE_PROJECT_ID',
      'NUXT_ANALYTICS_STATS_API_KEY',
      /**
       * Die Silo-Naht zum Control Plane (control-036, eigene Domain).
       *
       * DIESELBE SORTE LOCH WIE F44: fehlen sie, läuft die Site völlig normal
       * weiter — sie erfährt nur nie, dass ihr eine eigene Domain gehört. Keine
       * Umleitung, kein „Prüfen", und der Rückruf der Betreiber-Konsole
       * (`POST /api/site/domain/settle`) antwortet 401. Alles fail-soft, also
       * still. Beim Erstlauf am 2026-08-08 fehlten beide auf dem Server und
       * mussten mitten im Durchlauf nachgetragen werden.
       */
      'NUXT_ONBOARDING_CONTROL_URL',
      'NUXT_ONBOARDING_SERVICE_SECRET',
    ],
  },
  {
    dir: 'help.pukalani.app',
    name: 'help',
    note: 'Hilfe-Seiten — reine Inhalte, kein Appwrite, keine Mails',
    required: [],
  },
  {
    dir: 'pukalani.app',
    name: 'marketing',
    note: 'Landing — reine Inhalte, kein Appwrite, keine Mails',
    required: [],
  },
]

/** Liest NUR die Schlüsselnamen einer Server-.env. Werte bleiben dort. */
function readKeyNames(dir) {
  const out = execFileSync('ssh', [
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=20',
    SERVER,
    `test -f /home/ploi/${dir}/.env && grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' /home/ploi/${dir}/.env | tr -d '=' || echo __NO_ENV_FILE__`,
  ], { encoding: 'utf8' })
  const lines = out.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.includes('__NO_ENV_FILE__')) return null
  return new Set(lines)
}

/**
 * Der EINE öffentliche Wert vom Server: welches Appwrite-Projekt diese Site
 * bedient. `head -1`, damit ein doppelter Eintrag nicht zwei Zeilen liefert —
 * gemeint ist die Zeile, die Nitro auch liest.
 */
function readServerProjectId(dir) {
  const out = execFileSync('ssh', [
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=20',
    SERVER,
    `test -f /home/ploi/${dir}/.env && grep -m1 -oE '^NUXT_PUBLIC_APPWRITE_PROJECT_ID=.*' /home/ploi/${dir}/.env | cut -d= -f2- || echo __NO_ENV_FILE__`,
  ], { encoding: 'utf8' })
  const value = out.trim()
  if (!value || value === '__NO_ENV_FILE__') return null
  return value
}

/**
 * Wo liegt das HAUPT-Checkout? Aus einem `.claude/worktrees/…`-Worktree heraus
 * ist das nicht das aktuelle Verzeichnis — und die Dateien, um die es hier
 * geht, sind gitignored und existieren NUR im Haupt-Checkout. Ohne diesen
 * Umweg meldet der Wächter aus einem Worktree „nichts zu vergleichen" und ist
 * damit genau dort blind, wo er greifen soll. (Beim Bau am 2026-08-18 sofort
 * passiert: erster Lauf grün, weil er im Worktree lief.)
 *
 * `--git-common-dir` zeigt in JEDEM Worktree auf dasselbe `.git` des
 * Haupt-Checkouts; sein Elternverzeichnis ist das Checkout. Schlägt das fehl
 * (kein git), bleibt es beim aktuellen Verzeichnis.
 */
function mainCheckoutDir() {
  try {
    const gitDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim()
    return gitDir.endsWith('/.git') ? gitDir.slice(0, -'/.git'.length) : process.cwd()
  }
  catch {
    return process.cwd()
  }
}

const REPO_ROOT = mainCheckoutDir()

/** Projekt-Id aus einer LOKALEN Datei — ohne sie sonst anzufassen. */
function readLocalProjectId(path) {
  const resolved = path.startsWith('~/') ? join(homedir(), path.slice(2)) : join(REPO_ROOT, path)
  if (!existsSync(resolved)) return { path: resolved, missing: true }
  const line = readFileSync(resolved, 'utf8')
    .split('\n')
    .find(l => l.startsWith('NUXT_PUBLIC_APPWRITE_PROJECT_ID='))
  return { path: resolved, projectId: line ? line.split('=').slice(1).join('=').trim() : '' }
}

/**
 * Projekte, die es GAB und die nicht mehr bedient werden. Steht eine lokale
 * Datei auf einem davon, ist die Meldung dieselbe — der ZUSATZ sagt nur, dass
 * es kein Tippfehler ist, sondern eine Altlast aus einem Umzug.
 */
const RETIRED_PROJECTS = {
  pool: 'eingefroren beim Account-Cutover (AH-1, 2026-08-11) — die Wahrheit liegt in `account`',
  studio: 'gelöscht beim Control-Cutover (2026-07-30) — die Wahrheit liegt in `control`',
}

const only = process.argv[2]
const sites = only ? SITES.filter(s => s.name === only || s.dir === only) : SITES
if (sites.length === 0) {
  console.error(`Keine Site namens "${only}". Bekannt: ${SITES.map(s => s.name).join(', ')}`)
  process.exit(2)
}

let broken = 0
for (const site of sites) {
  let present
  try {
    present = readKeyNames(site.dir)
  }
  catch (error) {
    console.log(`✖ ${site.name.padEnd(10)} ssh/Lesen fehlgeschlagen — ${(error && error.message) || error}`)
    broken++
    continue
  }
  if (present === null) {
    // Keine Datei ist nur dann ein Fehler, wenn die Site etwas braucht.
    if (site.required.length === 0) {
      console.log(`✔ ${site.name.padEnd(10)} keine .env nötig (${site.note})`)
      continue
    }
    console.log(`✖ ${site.name.padEnd(10)} KEINE .env vorhanden, ${site.required.length} Pflicht-Variablen erwartet`)
    broken++
    continue
  }
  const missing = site.required.filter(key => !present.has(key))
  if (missing.length === 0) {
    console.log(`✔ ${site.name.padEnd(10)} ${site.required.length} Pflicht-Variablen gesetzt (${site.note})`)
  }
  else {
    console.log(`✖ ${site.name.padEnd(10)} FEHLT: ${missing.join(', ')}`)
    console.log(`  ${' '.repeat(10)} ${site.note}`)
    broken++
  }

  // ── E1b: zeigen die lokalen Dateien auf dasselbe Projekt wie der Server? ──
  if (!site.localProjectFiles?.length) continue
  let serverProject
  try {
    serverProject = readServerProjectId(site.dir)
  }
  catch (error) {
    console.log(`  ${' '.repeat(10)} ⚠ Projekt-Id des Servers nicht lesbar — ${(error && error.message) || error}`)
    continue
  }
  if (!serverProject) {
    console.log(`  ${' '.repeat(10)} ⚠ Server nennt kein NUXT_PUBLIC_APPWRITE_PROJECT_ID`)
    continue
  }

  for (const file of site.localProjectFiles) {
    const local = readLocalProjectId(file)
    // Fehlt die Datei, ist nichts falsch — sie liegt nur nicht auf DIESEM
    // Rechner (Worktree ohne .env.production, fremde Maschine, CI).
    if (local.missing) {
      console.log(`  ${' '.repeat(10)} · ${file} — nicht vorhanden (nichts zu vergleichen)`)
      continue
    }
    if (local.projectId === serverProject) {
      console.log(`  ${' '.repeat(10)} ✔ ${file} → ${serverProject}`)
      continue
    }
    const retired = RETIRED_PROJECTS[local.projectId]
    console.log(`  ${' '.repeat(10)} ✖ ${file} zeigt auf „${local.projectId || '(leer)'}", der Server auf „${serverProject}"`)
    if (retired) console.log(`  ${' '.repeat(10)}   ${local.projectId}: ${retired}`)
    console.log(`  ${' '.repeat(10)}   Ein Migrations-Lauf gegen diese Datei schreibt ins FALSCHE Projekt — und zwar ohne Fehler.`)
    broken++
  }
}

if (broken > 0) {
  console.log(`\n${broken} Befund(e). Fehlende Variablen erklärt die jeweilige apps/<app>/.env.example;`)
  console.log('ein Projekt-Unterschied gehört korrigiert, BEVOR jemand damit migriert (docs/OPEN-ITEMS.md, E1b).')
  process.exit(1)
}
console.log('\nAlle Sites vollständig konfiguriert, alle lokalen Dateien zeigen aufs richtige Projekt.')
