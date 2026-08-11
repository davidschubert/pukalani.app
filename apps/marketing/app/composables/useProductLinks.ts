/**
 * Ziel-Links der Marketing-CTAs. Der Kundenbereich lebt seit AH-1
 * (2026-08-11) auf account.pukalani.app (vorher my., davor app.), die
 * Live-Demo auf demo.pukalani.app.
 *
 * Die Werte stehen als Skeleton in nuxt.config.ts (runtimeConfig.public) —
 * dort auch die Prod-Defaults. Lokal/Staging per NUXT_PUBLIC_MARKETING_*_URL
 * überschreibbar; ohne den Skeleton-Key mappt die Env-Var ins Leere, deshalb
 * gehören Default UND Key in die Config, nicht hierher.
 */
export function useProductLinks() {
  const {
    marketingStartUrl,
    marketingSignInUrl,
    marketingDemoUrl,
    marketingRequestUrl,
  } = useRuntimeConfig().public
  return {
    start: marketingStartUrl,
    signIn: marketingSignInUrl,
    demo: marketingDemoUrl,
    /** Zugang anfragen — für Absichten ohne Selbstbedienungs-Kauf (U3). */
    request: marketingRequestUrl,
  }
}
