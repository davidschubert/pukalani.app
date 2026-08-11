import { describe, expect, it } from 'vitest'
import {
  DEFAULT_APP_CONFIG,
  DEFAULT_PUBLIC_APP_CONFIG,
  toPublicAppConfig,
  type AppConfig,
} from '../shared/types/config'

/**
 * Audit-Befund K5: `entitlementsDoc` (signiertes kaufmännisches Dokument) reiste
 * über GET /api/config und den useState `pukalani-runtime-flags` im Klartext in den
 * __NUXT__-Payload JEDER Seite — auch unauthentifiziert (/login). Es hat keinen
 * Client-Leser.
 *
 * Audit-Befund N2 (Nachfolge): der Appwrite-Direktweg umging diese Diät — die
 * Tabelle app_config ist Table-read(any) (system-005, für Realtime-Flags und
 * Theme-Live-Propagation an Gäste) und trug die Spalte `entitlements`. Das
 * Dokument liegt seit system-020 in der server-only Tabelle `app_secrets` und
 * ist KEIN AppConfig-Feld mehr. Diese Tests halten beides fest: AppConfig
 * trägt nichts Server-Only, und die Projektion bleibt die bewusste Naht.
 */
const full: AppConfig = {
  registrationEnabled: false,
  commentsEnabled: false,
  maintenanceMode: true,
  onboardingInviteOnly: false,
  products: { posts: { enabled: false, status: 'inactive' } },
}

/** Was der Client sehen darf — die Liste, gegen die geprüft wird. */
const PUBLIC_KEYS = ['registrationEnabled', 'commentsEnabled', 'maintenanceMode', 'products'].sort()

describe('toPublicAppConfig', () => {
  it('AppConfig trägt kein Entitlement-Dokument mehr (N2)', () => {
    expect('entitlementsDoc' in DEFAULT_APP_CONFIG).toBe(false)
    expect(JSON.stringify(DEFAULT_APP_CONFIG)).not.toContain('entitlements')
  })

  it('lässt nichts Entitlement-Artiges in den Client-Payload', () => {
    // Ein versehentlich durchgereichtes Server-Feld darf nicht mitreisen —
    // die Projektion kopiert Feld für Feld (kein Rest-Spread)
    const leaky = { ...full, entitlementsDoc: 'eyJ2IjoxfQ.c2lnbmF0dXJl' } as unknown as AppConfig
    const publicConfig = toPublicAppConfig(leaky)
    expect('entitlementsDoc' in publicConfig).toBe(false)
    expect(JSON.stringify(publicConfig)).not.toContain('entitlements')
    expect(JSON.stringify(publicConfig)).not.toContain('c2lnbmF0dXJl')
  })

  it('reicht JEDES vom Client gelesene Flag unverändert durch', () => {
    // Leser: register-Seiten (registrationEnabled/maintenanceMode),
    // useCommentPolicy (commentsEnabled/maintenanceMode), useProduct +
    // Dashboard-Nav (products)
    expect(toPublicAppConfig(full)).toEqual({
      registrationEnabled: false,
      commentsEnabled: false,
      maintenanceMode: true,
      products: { posts: { enabled: false, status: 'inactive' } },
    })
  })

  it('hält genau die freigegebenen Schlüssel — nicht mehr, nicht weniger', () => {
    expect(Object.keys(toPublicAppConfig(full)).sort()).toEqual(PUBLIC_KEYS)
    expect(Object.keys(DEFAULT_PUBLIC_APP_CONFIG).sort()).toEqual(PUBLIC_KEYS)
    // Jeder freigegebene Schlüssel muss es in der Voll-Config auch geben —
    // sonst reicht die Projektion etwas durch, das gar nicht existiert.
    expect(Object.keys(DEFAULT_APP_CONFIG)).toEqual(expect.arrayContaining(PUBLIC_KEYS))
  })

  /**
   * DER ERSTE BEWUSST SERVER-ONLY GEBLIEBENE SCHLÜSSEL (U2, 2026-08-10) — und
   * damit der erste Beweis für die `Pick`-Regel aus shared/types/config.ts
   * („neue Felder sind erst mal server-only").
   *
   * `onboardingInviteOnly` ist nicht geheim, es ist WERTLOS AM FALSCHEN ORT:
   * geschrieben und gelesen wird es ausschließlich im Projekt `control`. In
   * der Pool-Instanz stünde dort der unbeschriebene Default, und wer im
   * Browser `useRuntimeFlags().onboardingInviteOnly` läse, bekäme eine Zahl,
   * die niemand pflegt — auf my.pukalani.app also womöglich das Gegenteil der
   * Wahrheit. Der öffentliche Weg für diesen Zustand ist GET
   * /api/onboarding/gate, nicht die Laufzeit-Flags.
   */
  it('trägt den Tor-Schalter NICHT in den Client-Payload', () => {
    expect('onboardingInviteOnly' in toPublicAppConfig(full)).toBe(false)
    expect('onboardingInviteOnly' in DEFAULT_PUBLIC_APP_CONFIG).toBe(false)
    expect(DEFAULT_APP_CONFIG.onboardingInviteOnly).toBe(true)
  })

  it('die öffentlichen Defaults bleiben permissiv wie die Voll-Defaults', () => {
    expect(DEFAULT_PUBLIC_APP_CONFIG).toEqual(toPublicAppConfig(DEFAULT_APP_CONFIG))
  })
})
