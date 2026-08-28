import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * brand-Layer — Phase-1-Gerüst (P0b). Enthält aktuell die UI-Komponenten
 * des Clickdummys (app/components) und die Design-Tokens; server/ und
 * Tabellen kommen mit P1a/P1b (Plan: docs/plans/BRAND-WIZARD-PHASE-1.md).
 * Der Dummy selbst läuft im .playground — Punkt-Ordner werden vom
 * Manifest-Scan und von extends nicht erfasst.
 */
export default defineNuxtConfig({
  // absoluter Pfad wie im Core-Layer (relative css-Pfade lösen Apps sonst
  // relativ zu sich selbst auf)
  css: [join(currentDir, './app/assets/css/brand.css')],
})
