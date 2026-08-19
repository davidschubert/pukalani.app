/**
 * DER VERTRAG DER SEITE „INTEGRATIONEN" (2026-08-18).
 *
 * Sie zeigt je Dienst, WOHER sein Zugang kommt — nie den Zugang selbst.
 * Der Wert wandert verschlüsselt in `instance_secrets` (system-036) und
 * verlässt den Server nicht; stünde er in dieser Antwort, läge er im
 * __NUXT__-Payload der Seite und die Verschlüsselung wäre eine Verkleidung.
 */

/**
 * Die Dienste, deren Schlüssel über die Oberfläche gepflegt werden können.
 *
 * Die letzten beiden sind keine fremden Dienste, sondern die GETEILTEN
 * Geheimnisse unserer eigenen Nähte (A0, 2026-08-18): dasselbe Wort muss auf
 * ZWEI Deployments stehen. Sie stehen hier, weil sie dieselbe Frage
 * beantworten („woher kommt dieser Zugang, und wie ändere ich ihn ohne ssh") —
 * mit EINEM Unterschied, der auf der Karte steht: rotiert wird in einer
 * REIHENFOLGE. Welche, hängt davon ab, ob die Naht in eine oder in beide
 * Richtungen läuft — siehe `shared` unten und `sharedSeamSecret.ts`.
 */
export const INTEGRATION_IDS = ['ai', 'analytics', 'tickets-ai', 'onboarding-service', 'events-sweep'] as const
export type IntegrationId = typeof INTEGRATION_IDS[number]

/** Woher der benutzte Wert stammt. Ablage schlägt Env — überall gleich. */
export type IntegrationSource = 'settings' | 'env' | 'none'

export interface IntegrationState {
  id: IntegrationId
  /** Der Env-Name als Rückfall — die Oberfläche nennt ihn im Hinweistext. */
  envName: string
  source: IntegrationSource
  /**
   * GETEILTES Naht-Geheimnis (dieselbe Zeichenkette auf zwei Deployments) —
   * und wenn ja, WELCHER Art. Die Karte zeigt danach zwei verschiedene
   * Rotations-Anleitungen, denn es sind zwei verschiedene Lagen:
   *
   * `'one-way'` — einer sendet, einer empfängt (`events-sweep`: der Cron
   *   schickt, der Sweep prüft). Hier gibt es KEIN Fenster: neuen Wert zuerst
   *   beim Empfänger eintragen, der nimmt ab da alt UND neu an, danach beim
   *   Sender. Niemand merkt etwas.
   *
   * `'two-way'` — BEIDE Seiten senden und empfangen über dieselbe Sorte
   *   (`onboarding-service`: platform→control beim Onboarding,
   *   control→site beim Domain-Settle). Hier gibt es das Fenster SEHR WOHL,
   *   und „erst beim Empfänger" ist keine brauchbare Anweisung, weil jede
   *   Seite Empfänger IST: ein Konsolen-Eintrag ändert immer beides auf
   *   einmal — was die Seite annimmt UND was sie sendet (`preferredSeamSecret`
   *   nimmt die Konsole zuerst). Zwischen den zwei Einträgen ist deshalb
   *   genau EINE Richtung tot. Bewiesen in
   *   `packages/core/tests/seamRotationOrder.test.ts`.
   *
   * Ein einzelnes Boolean könnte das nicht sagen — und weil die falsche
   * Anleitung genau die Naht reisst, die sie schützen soll, ist der
   * Unterschied ein eigener Wert und kein zweites Flag daneben.
   */
  shared?: 'one-way' | 'two-way'
}

/**
 * SMTP ist kein einzelner Schlüssel, sondern ein BLOCK — Host, Port, Benutzer,
 * Passwort, Absender gehören zusammen. Die Antwort zeigt alles ausser dem
 * Passwort; von dem gibt es nur die Auskunft, DASS eines hinterlegt ist.
 */
export interface SmtpIntegrationState {
  source: IntegrationSource
  host: string
  port: string
  user: string
  from: string
  hasPassword: boolean
}

export interface IntegrationsResponse {
  items: IntegrationState[]
  smtp: SmtpIntegrationState
  /** Ist `NUXT_INSTANCE_SECRETS_KEY` gesetzt? Ohne ihn kein Eingabefeld. */
  editable: boolean
  bootstrap: readonly string[]
}

/**
 * Was NICHT über die Oberfläche gehen kann, und zwar prinzipiell: man braucht
 * diese Werte, um überhaupt an die verschlüsselte Zeile zu kommen. Henne und
 * Ei — läge einer davon dort, käme niemand mehr an ihn heran.
 *
 * Sie stehen trotzdem auf der Seite: eine Übersicht, die „alle Zugänge"
 * verspricht und die Hälfte verschweigt, schickt beim nächsten Suchen in die
 * Irre.
 */
export const BOOTSTRAP_SECRETS = [
  'NUXT_APPWRITE_KEY',
  'NUXT_INSTANCE_SECRETS_KEY',
  'NUXT_PLATFORM_CONTROL_KEY',
  'NUXT_BILLING_SETTINGS_KEY',
  'NUXT_REDIS_URL',
] as const

/** PURE: die Rangfolge in einer Zeile — Ablage vor Env, sonst nichts. */
export function integrationSource(stored: string | undefined, env: unknown): IntegrationSource {
  if (stored) return 'settings'
  return env ? 'env' : 'none'
}
