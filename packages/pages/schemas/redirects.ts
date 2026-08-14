import { z } from 'zod'
import {
  MAX_REDIRECT_FROM,
  MAX_REDIRECT_RULES,
  MAX_REDIRECT_TO,
  communityRedirectConfigFits,
  findRedirectChain,
  isSafeExternalRedirectTarget,
  isSafeInternalRedirectTarget,
  isSafeRedirectSource,
  normalizeRedirectPath,
} from '../../core/shared/communityRedirects'

type TranslateFn = (key: string) => string
const identity: TranslateFn = key => key

/**
 * DIE WEITERLEITUNGEN EINER COMMUNITY SPEICHERN (U15 Teil 3).
 *
 * Die Regel selbst (was ein gespeichertes Dokument BEDEUTET) steht in
 * `core/shared/communityRedirects.ts`; hier steht, was überhaupt hinein darf.
 * Beides prüft dieselben Prädikate — das Schema beim SCHREIBEN, die
 * Auflösungsregel noch einmal beim LESEN. Das ist keine Doppelung aus
 * Vorsicht: das Dokument ist JSON in einer Spalte, es überlebt jede
 * Schema-Änderung, und was hier durchkommt, leitet einen Besucher weiter.
 *
 * ── DIE SPERRLISTE IST DIE SCHÄRFSTE ZUSAGE DIESES SCHEMAS ────────────────
 * `isSafeRedirectSource` lehnt jede Quelle ab, die in einem Bereich liegt, den
 * das System besitzt (`/login`, `/dashboard`, `/api`, …). Der Grund steht
 * ausführlich an `RESERVED_REDIRECT_PREFIXES`; kurz: eine Weiterleitung von
 * `/login` auf eine fremde https-Adresse ist ein Anmeldeformular, das der
 * Besucher unter dem Namen DIESER Community aufruft, und eine von
 * `/dashboard` sperrt den Owner aus der Fläche aus, auf der er es zurücknehmen
 * müsste. Beides ist kein Missbrauch durch Dritte — es ist ein Fehler, den ein
 * Owner mit den besten Absichten machen kann, und deshalb gehört er hierher
 * und nicht in eine Warnung.
 *
 * ── EIN ZIEL DARF NICHT SELBST QUELLE SEIN ────────────────────────────────
 * `findRedirectChain` (Begründung dort). Das verbietet den Ringschluss
 * (A⇒B, B⇒A wäre eine Endlosschleife im Browser) und, bewusst gröber, auch die
 * harmlose Kette — weil beim Lesen genau EIN Schritt aufgelöst wird und eine
 * Kette damit immer die schlechtere Weiterleitung ist.
 *
 * ── WAS HIER NICHT GEPRÜFT WIRD ───────────────────────────────────────────
 * Ob das ZIEL existiert. Anders als beim Menü (Teil 1, `unknown_page`) wird
 * ein interner Pfad hier NICHT gegen die veröffentlichten Seiten gehalten, und
 * das hat einen Grund: eine Weiterleitung wird oft angelegt, BEVOR die neue
 * Seite steht (erst die Adressen ordnen, dann umziehen), und sie darf auch auf
 * ein Produkt zeigen (`/discussions`), das gar keine CMS-Seite ist. Die Prüfung
 * beim Menü ist richtig, weil ein MENÜ-Eintrag sofort öffentlich beworben wird;
 * eine Weiterleitung wirkt erst, wenn jemand die alte Adresse aufruft.
 *
 * Und ebenso wenig geprüft: ob die QUELLE einmal existiert hat. Das kann
 * niemand — genau darum geht es hier (s. `RESERVED_REDIRECT_PREFIXES`).
 */
export function createCommunityRedirectsSchema(t: TranslateFn = identity) {
  const ruleSchema = z.object({
    from: z.string().trim().max(MAX_REDIRECT_FROM, t('pages.redirects.validation.fromMax')),
    to: z.string().trim().max(MAX_REDIRECT_TO, t('pages.redirects.validation.toMax')),
    external: z.boolean().optional(),
  }).strict().superRefine((rule, ctx) => {
    if (!isSafeRedirectSource(rule.from)) {
      ctx.addIssue({ code: 'custom', path: ['from'], message: t('pages.redirects.validation.fromInvalid') })
    }
    const ok = rule.external === true
      ? isSafeExternalRedirectTarget(rule.to)
      : isSafeInternalRedirectTarget(rule.to)
    if (!ok) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: rule.external === true
          ? t('pages.redirects.validation.externalInvalid')
          : t('pages.redirects.validation.internalInvalid'),
      })
    }
  })

  return z.object({
    rules: z.array(ruleSchema).max(MAX_REDIRECT_RULES, t('pages.redirects.validation.tooMany')),
  }).strict().superRefine((value, ctx) => {
    const seen = new Set<string>()
    for (const rule of value.rules) {
      const from = normalizeRedirectPath(rule.from)
      if (seen.has(from)) {
        ctx.addIssue({ code: 'custom', path: ['rules'], message: t('pages.redirects.validation.duplicateFrom') })
        break
      }
      seen.add(from)
    }
    if (findRedirectChain(value.rules)) {
      ctx.addIssue({ code: 'custom', path: ['rules'], message: t('pages.redirects.validation.chain') })
    }
    // Die Spalte ist die Grenze (MAX_REDIRECT_CONFIG_CHARS) — ein sauberes 400
    // mit Begründung statt eines 500 aus Appwrite.
    if (!communityRedirectConfigFits(value)) {
      ctx.addIssue({ code: 'custom', path: ['rules'], message: t('pages.redirects.validation.tooLarge') })
    }
  })
}

// Server-seitige Instanz (Fehlertexte = Keys; die UI validiert mit t()) —
// dasselbe Muster wie `communityNavigationSchema` und `communitySeoSchema`.
export const communityRedirectsSchema = createCommunityRedirectsSchema()
