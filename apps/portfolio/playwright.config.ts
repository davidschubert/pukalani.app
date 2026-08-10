import { defineConfig, devices } from '@playwright/test'

/**
 * E2E-Smoke-Tests für portfolio (Port 3005) — Muster von apps/comments.
 * Auth-frei: die Site ist eine öffentliche Landing (kein Login-Flow nötig).
 *
 * Kein `channel` ⇒ Playwrights GEBÜNDELTES Chromium (seit 2026-08-01, vorher
 * `channel: 'chrome'`). Grund wie bei apps/comments: System-Chrome startet auf
 * macOS GoogleUpdater/chrome_crashpad_handler, die Playwrights stdout/stderr-
 * Socketpair erben, zu launchd reparenten und nie schließen — der Worker
 * bekommt kein EOF und hängt bis zum 300-s-Force-Kill (Exit 1 trotz grüner
 * Suite). Preis: `npx playwright install chromium` einmalig; ein CI-Schritt
 * ist NICHT nötig, weil diese Suite (anders als comments) in keinem Workflow
 * läuft — sie ist ein lokales Smoke-Netz.
 */
const baseURL = process.env.PW_BASE_URL ?? 'http://localhost:3005'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Playwrights Standard sind 30 s pro Test. Diese Suite fährt aber gegen den
  // DEV-Server (webServer unten), und der kompiliert jede SEITE beim ERSTEN
  // Zugriff — bei sieben eigenen Seiten trifft das fast jeden Test einmal.
  // Mit 30 s scheitert dann nicht der Testgegenstand, sondern der Kaltstart,
  // und der Bericht zeigt auf eine beliebige Wartezeile. 90 s trennt „Server
  // baut noch" von „Sache kaputt" (dieselbe Zahl und dieselbe Begründung wie
  // in apps/comments); die inneren Erwartungen bleiben eng.
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    locale: 'en-US',
    trace: 'on-first-retry',
  },
  projects: [
    // Kein `channel` ⇒ gebündeltes Chromium (siehe Kopfkommentar).
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
