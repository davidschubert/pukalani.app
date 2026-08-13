import { resolveOauthProviders, type OauthProviderId } from '../../shared/oauthProviders'

/** Was ein Knopf zum Zeichnen braucht. Der Text kommt aus i18n, nie von hier. */
export interface OauthProviderButton {
  id: OauthProviderId
  icon: string
}

const PROVIDER_ICONS: Record<OauthProviderId, string> = {
  google: 'i-ph-google-logo',
  github: 'i-ph-github-logo',
}

/**
 * Welche Social-Login-Knöpfe erscheinen? (U14)
 *
 * EINE Stelle für beide Formulare — Anmelden und Registrieren zeigen dieselben
 * Knöpfe, und zwei Kopien wären zwei Gelegenheiten, sich zu unterscheiden.
 *
 * Die Rechnung selbst ist pur und unit-getestet (`resolveOauthProviders`):
 * angeboten von der APP (`pukalani.auth.providers`) UND belegt von der INSTANZ
 * (`NUXT_PUBLIC_AUTH_OAUTH_PROVIDERS`). Beides muss gelten — sonst stünde auf
 * jeder Instanz, die den Layer erbt, ein Knopf ins Leere. Begründung
 * ausführlich in core/shared/oauthProviders.ts.
 *
 * Dieselbe Rechnung macht die Start-Route noch einmal selbst: die UI
 * entscheidet, was SICHTBAR ist, nie was ERLAUBT ist.
 */
export function useOauthProviders() {
  const appConfig = useAppConfig()
  const runtimeConfig = useRuntimeConfig()

  return computed<OauthProviderButton[]>(() =>
    resolveOauthProviders(
      appConfig.pukalani?.auth?.providers,
      runtimeConfig.public.authOauthProviders,
    ).map(id => ({ id, icon: PROVIDER_ICONS[id] })),
  )
}
