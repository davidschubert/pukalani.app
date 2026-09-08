import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * brand-Layer — Brand-Wizard (Plan: docs/plans/BRAND-WIZARD-PHASE-1.md).
 * Enthält die UI-Komponenten des Clickdummys (app/components, `Bw*`), die
 * Design-Tokens, die Routen unter /api/brand/** (P1b) und seit P1c die
 * ECHTEN Seiten (app/pages, app/stores, app/composables, app/layouts).
 * Der Dummy selbst läuft im .playground — Punkt-Ordner werden vom
 * Manifest-Scan und von extends nicht erfasst.
 */
export default defineNuxtConfig({
  // absoluter Pfad wie im Core-Layer (relative css-Pfade lösen Apps sonst
  // relativ zu sich selbst auf)
  //
  // ZWEITE DATEI, kein Anhang an brand.css: `brand-fonts.css` ist keine
  // Gestaltung, sondern eine DEKLARATION für den Build — `@nuxt/fonts`
  // self-hostet nur Familien, die es im CSS sieht (§2.17). Sie steht
  // getrennt, damit niemand sie beim Aufräumen für toten CSS-Code hält:
  // ihre Klassen werden nirgends benutzt, und ohne sie fiele die
  // Vorschau-Szene still auf Georgia/Arial zurück.
  css: [
    join(currentDir, './app/assets/css/brand.css'),
    join(currentDir, './app/assets/css/brand-fonts.css'),
  ],

  /**
   * DER SCHNITT 300 MUSS EXTRA BESTELLT WERDEN (Brand Design D4, am eigenen
   * Klick gefunden).
   *
   * `@nuxt/fonts` lädt per Voreinstellung nur den BEREICH `400 700` — eine
   * `.bw-face-*-300`-Deklaration im CSS wird zwar gesehen, aber nicht
   * beschafft. Das ist der teuerste Fall dieser ganzen Falle: die Seite sieht
   * richtig aus, der Browser malt den leichten Schnitt SELBST (ausgedünnte
   * Konturen), und beurteilt würde eine Schrift, die es nicht gibt. Gemessen:
   * `document.fonts` kannte NULL Faces mit Gewicht 300, obwohl die Typografie-
   * Bühne es anbot.
   *
   * Der Bereich steht deshalb im LAYER (wie `css` darüber): wer die
   * Typografie-Bühne erbt, erbt auch ihre Schnitte. Familien ohne leichten
   * Schnitt (PT Sans, PT Serif) bleiben davon unberührt — es gibt dort nichts
   * zu holen, und `BRAND_DECLARED_FONT_WEIGHTS` sagt es der Bühne.
   */
  fonts: {
    defaults: { weights: [300, 400, 500, 600, 700] },
  },

  // Das Dokument („Euer Branding") trägt sein Inhaltsverzeichnis in einer
  // `UPageAside` mit `UContentToc` (Davids Wunsch 2026-09-05). Nuxt UI
  // registriert die Content-Komponenten NUR mit diesem Schalter oder mit
  // installiertem @nuxt/content — ohne ihn bleibt `<UContentToc>` ein
  // unaufgelöstes Element: leere Spalte, im Browser nur eine Vue-Warnung
  // („Failed to resolve component"), kein Build- und kein Typfehler. Im
  // Playground am 2026-09-05 live erwischt. Der Schalter steht deshalb im
  // LAYER (wie die `image`-Optionen im Core), damit ihn jede App erbt, die
  // die Wizard-Seiten mitnimmt — heute `apps/branding`.
  ui: {
    content: true,
  },

  // Layer-stores werden nicht auto-gescannt (Stolperfalle, CLAUDE.md)
  imports: {
    dirs: [join(currentDir, './app/stores')],
  },

  // Eigene Layer-Strings — mergen mit Core- und App-Locales (gleiche codes).
  // Sie lösen die Schuld ein, die `app/app.config.ts` seit P1a notiert:
  // `completionCta.labelKey` versprach `brand.cta.book`, ohne dass es den
  // Schlüssel gab. Der Wächter `pnpm check:i18n-keys` prüft es jetzt.
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
