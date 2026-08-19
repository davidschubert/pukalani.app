/**
 * DIE SMTP-EINSTELLUNGEN ALS DATENSATZ — pur und unit-getestet.
 *
 * Anlass (Davids Wunsch 2026-08-18): auch der Mailversand soll ohne
 * Env-Datei einzurichten sein. SMTP ist dabei die heikelste der Ablagen, und
 * zwar aus zwei Gründen, die beide hier abgefangen werden:
 *
 * (1) ES IST NICHT EIN GEHEIMNIS, SONDERN EIN BLOCK. Host, Port, Benutzer,
 *     Passwort und Absender gehören zusammen; ein halb umgezogener Block
 *     (Host aus der Ablage, Passwort aus der Env) wäre eine Konfiguration,
 *     die niemand mehr erklären kann. Deshalb reist er als EIN Wert.
 *
 * (2) DAS PASSWORT DARF NICHT VERSEHENTLICH VERSCHWINDEN. Wer nur den
 *     Absender ändert, tippt das Passwort nicht neu — das Feld kommt leer
 *     zurück. Leer heisst deshalb „unverändert", nie „löschen". Ohne diese
 *     Regel nimmt die erste harmlose Korrektur den Versand mit, und zwar
 *     STILL: der Server antwortet 200, die Karte meldet Erfolg, und erst
 *     Stunden später fehlt die erste Mail.
 */

export interface MailerSettings {
  host: string
  port: string
  user: string
  pass: string
  from: string
}

export const EMPTY_MAILER_SETTINGS: MailerSettings = { host: '', port: '', user: '', pass: '', from: '' }

/** Was die Oberfläche sehen darf: alles ausser dem Passwort. */
export type MailerSettingsView = Omit<MailerSettings, 'pass'> & { hasPassword: boolean }

export function toMailerView(settings: MailerSettings): MailerSettingsView {
  const { pass, ...rest } = settings
  return { ...rest, hasPassword: Boolean(pass) }
}

/** JSON aus der Ablage → Datensatz. FAIL-SOFT: Unlesbares heisst „nichts
 *  hinterlegt", damit ein kaputter Wert nicht den Versand kappt, solange die
 *  Env trägt. */
export function parseMailerSettings(raw: string | null | undefined): MailerSettings | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  }
  catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  const value = parsed as Record<string, unknown>
  const str = (key: string) => (typeof value[key] === 'string' ? (value[key] as string).trim() : '')
  const settings: MailerSettings = {
    host: str('host'),
    port: str('port'),
    user: str('user'),
    pass: typeof value.pass === 'string' ? value.pass : '',
    from: str('from'),
  }
  // Ohne Host gibt es keinen Versandweg — dann ist die Zeile so gut wie leer.
  return settings.host ? settings : null
}

/**
 * Eingabe aus dem Formular + bisheriger Stand ⇒ was gespeichert wird.
 *
 * Das leere Passwort-Feld behält das alte Passwort (siehe Kopf, Punkt 2).
 * ENTFERNEN geht ausdrücklich über einen leeren HOST — das ist die Handlung
 * „diesen Zugang gibt es nicht mehr", und sie sieht anders aus als „ich habe
 * das Passwort nur nicht wieder eingetippt".
 */
export function mergeMailerSettings(previous: MailerSettings | null, incoming: MailerSettings): MailerSettings {
  return {
    host: incoming.host.trim(),
    port: incoming.port.trim(),
    user: incoming.user.trim(),
    pass: incoming.pass ? incoming.pass : (previous?.pass ?? ''),
    from: incoming.from.trim(),
  }
}

/** Ablage schlägt Env — dieselbe Rangfolge wie bei allen anderen Zugängen. */
export function pickMailerSettings(stored: MailerSettings | null, env: MailerSettings): MailerSettings | null {
  if (stored?.host) return stored
  return env.host ? env : null
}
