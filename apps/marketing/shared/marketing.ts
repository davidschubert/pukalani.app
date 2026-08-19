/**
 * DIE KATALOGE LIEGEN JETZT IM LAYER — hier steht nur noch der Durchreicher.
 *
 * WARUM ER BLEIBT: `#shared` ist der Alias auf das `shared/` DIESER App, nicht
 * auf das des Layers. Die bestehenden Aufrufstellen (Seiten, Sektionen,
 * `server/utils/marketingRoutes.ts`, die Unit-Tests und deren
 * Vitest-Alias) importieren allesamt `#shared/marketing` — ohne diesen
 * Durchreicher müssten sie alle auf einen relativen Layer-Pfad umgestellt
 * werden, und das an genau der Stelle, an der ein Umzug nichts verbessert.
 *
 * `export *` deckt auch die TYPEN ab (ProductKey, AudienceKey,
 * MarketingLocale, MarketingPageName, VsSlug, FeeProvider) — `isolatedModules`
 * verlangt nur bei EINZELN benannten Typ-Exporten ein `export type`.
 */
export * from '../../../packages/marketing/shared/marketing'
