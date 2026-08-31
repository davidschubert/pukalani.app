import type { H3Event } from 'h3'

/**
 * ZULASSUNG ZUR KONTOANLAGE — die generische Naht, über die ein Produkt-Layer
 * eine geschlossene Registrierung für EINEN benannten Fall öffnen darf.
 *
 * WARUM EINE REGISTRY (A14): der erste Konsument ist die Brand-Beta
 * (`brand_invites`, eigener Vertrag im brand-Layer) — und der Core darf `brand`
 * nicht kennen. Also dasselbe Muster wie `registerCommunityJoinHandler` und
 * `registerReportEscalationHandler`: der Core stellt die FRAGE, der Layer
 * verdrahtet per Nitro-Plugin die ANTWORT. Ohne registrierten Provider bleibt
 * der Signup exakt wie heute.
 *
 * DREI REGELN, die den Sinn dieser Datei ausmachen:
 *
 * 1. FAIL-CLOSED. Kein Provider, keine E-Mail, ein werfender Provider oder eine
 *    Antwort, die nicht wörtlich `opensRegistration: true` sagt ⇒ die
 *    Registrierung bleibt zu. Eine Zulassungs-Naht, die bei Störung öffnet,
 *    wäre eine Hintertür statt einer Einladung.
 *
 * 2. SIE ÜBERSTEUERT GENAU EINE ABLEHNUNG: `app_config.registrationEnabled`.
 *    NIEMALS `maintenanceMode` und nie irgendeine andere Sperre (Mandanten-
 *    Registrierung, Sperrzustand, Drossel). Der Aufrufer prüft die anderen
 *    Sperren deshalb VORHER und unabhängig — hier steht bewusst keine Logik,
 *    die eine zweite Sperre kennen könnte.
 *
 * 3. KEINE ENUMERATION. Das Ergebnis ist ein blankes Ja/Nein. Ob ein Code
 *    falsch, abgelaufen, widerrufen oder schon verbraucht war, erfährt weder
 *    der Aufrufer noch der Gast — die Ablehnung ist in jedem Fall dieselbe.
 *    Aus demselben Grund trägt die Log-Zeile bei einem Fehlschlag keine
 *    E-Mail und keinen Code.
 *
 * EINZIGER KONSUMENT IST HEUTE `POST /api/auth/signup`. Der OTP-Weg
 * (`otp.post.ts`) bleibt bewusst außen vor: er trägt keinen Code im Request,
 * und sein Zweig für geschlossene Registrierung ist die Attrappen-Antwort gegen
 * Konten-Enumeration (Audit-Befund 8) — eine Zulassungsprüfung dort machte
 * genau daraus wieder ein Orakel.
 */

export interface SignupAdmissionRequest {
  /** Die Adresse, mit der das Konto angelegt werden soll (bereits Zod-normalisiert). */
  email: string
  /**
   * Optionaler Zulassungs-Code aus dem Request. Der Core kennt sein Format
   * NICHT — Prüfung, Bindung an die Adresse, Ablauf und Widerruf gehören dem
   * Provider. Ein Provider darf auch ohne Code entscheiden (z. B. Freigabe
   * einer bereits eingeladenen Adresse).
   */
  inviteCode?: string
}

export interface SignupAdmissionDecision {
  /**
   * `true` = diese Anlage darf trotz geschlossener Registrierung stattfinden.
   * Alles andere (auch ein fehlendes Feld) heißt „nein".
   */
  opensRegistration: boolean
}

export type SignupAdmissionProvider = (
  event: H3Event,
  request: SignupAdmissionRequest,
) => Promise<SignupAdmissionDecision> | SignupAdmissionDecision

let admissionProvider: SignupAdmissionProvider | null = null

/** Vom Layer/der App (Nitro-Plugin) registriert — EINE Autorität pro Deployment. */
export function registerSignupAdmissionProvider(fn: SignupAdmissionProvider): void {
  if (admissionProvider) {
    console.warn('[core] registerSignupAdmissionProvider: bestehender Provider wird ersetzt — pro Deployment ist EINE Autorität vorgesehen')
  }
  admissionProvider = fn
}

export function getSignupAdmissionProvider(): SignupAdmissionProvider | null {
  return admissionProvider
}

/**
 * „Gibt es hier überhaupt jemanden, der öffnen könnte?"
 *
 * Der Signup fragt das VOR dem Lesen des Bodys: ohne Provider soll die Route
 * sich bis aufs Byte wie vor dieser Naht verhalten — gleiche Reihenfolge,
 * gleicher Status, gleiche Meldung.
 */
export function hasSignupAdmissionProvider(): boolean {
  return admissionProvider !== null
}

/** Nur für Tests: Registry zurücksetzen. */
export function __resetSignupAdmissionProvider(): void {
  admissionProvider = null
}

/**
 * Darf DIESE Anlage die geschlossene Registrierung passieren? Der EINE Aufruf,
 * den Auth-Routen benutzen. Wirft nie — jeder Fehlschlag ist ein „nein".
 */
export async function signupAdmissionOpensRegistration(
  event: H3Event,
  request: SignupAdmissionRequest,
): Promise<boolean> {
  if (!admissionProvider) return false
  if (!request.email) return false

  try {
    const decision = await admissionProvider(event, {
      email: request.email,
      inviteCode: request.inviteCode,
    })
    return decision?.opensRegistration === true
  }
  catch (error) {
    // Bewusst ohne E-Mail/Code: die Log-Zeile sagt dem Betreiber, DASS die
    // Zulassungs-Naht gestört ist, nicht WER angeklopft hat.
    logEvent('warn', 'auth.signup_admission_failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
