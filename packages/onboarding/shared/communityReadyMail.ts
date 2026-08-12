/**
 * „DEINE COMMUNITY STEHT" — die Mail, die es bis 2026-08-12 nicht gab
 * (Trichter-G6).
 *
 * Bis dahin war der einzige Beleg für die Existenz einer frisch angelegten
 * Community die Seite `/start/done` im offenen Tab. Wer sie schloss, hatte
 * keine Adresse mehr: den Hostnamen hat er einmal gesehen und nirgends
 * bestätigt bekommen, und dass sein Kundenbereich `account.pukalani.app` heißt,
 * stand in der ganzen Reise nirgends. Für Einladungen, Early-Access-Anfragen
 * und Missbrauchsmeldungen gibt es je eine Mail — ausgerechnet der wichtigste
 * Moment hatte keine.
 *
 * VIER DINGE, mehr nicht: die Adresse der Community · der Weg ins Dashboard ·
 * der Kundenbereich · das Ende der Testphase.
 *
 * DIESE MAIL DARF LINKS TRAGEN. Der Anti-Scam-Grundsatz der WARTUNGS-Mails
 * („eine Mail, die zum Klicken auffordert, erzieht zum Phishing-Opfer") gilt
 * hier bewusst nicht: sie bestätigt eine Handlung, die der Empfänger vor zehn
 * Sekunden selbst ausgelöst hat, und ihr Hauptzweck IST die Adresse. Eine
 * Bestätigung ohne die bestätigte Adresse wäre sinnlos.
 *
 * Textbau pur und ohne `H3Event`, damit er ohne laufenden Server prüfbar ist —
 * dasselbe Muster wie bei den Stripe-Dashboard-Texten.
 */

export interface CommunityReadyMailInput {
  /** Anzeigename der Community. */
  siteName: string
  /** Kanonischer Host der Community (ohne Schema). */
  host: string
  /** Host des Kundenbereichs (account.pukalani.app), ohne Schema. */
  accountHost: string
  /** Ende der Testphase (ISO) — leer/null = keine Testphase, Absatz entfällt. */
  trialEndsAt: string | null
  /** Sprache der Mail ('de' | 'en'). */
  locale: string
}

export interface CommunityReadyMailText {
  subject: string
  text: string
}

/**
 * Locale-Prefix von Hand, weil es hier kein `localePath()` gibt (Server-Util):
 * 'prefix_except_default' heißt `/dashboard` für en und `/de/dashboard` für de.
 * Dieselbe Handarbeit wie in `communityInviteMail.ts`.
 */
function siteLink(host: string, path: string, german: boolean): string {
  // Port ABSCHNEIDEN, bevor auf `.localhost` geprüft wird: lokal heißt der
  // Host `kunde-a.localhost:3002`, und der endet auf den Port. Die
  // Einladungs-Mail kommt ohne diesen Schritt aus, weil ihre Hosts nie einen
  // tragen — hier stünde sonst `https://…:3002` in jedem Beweislauf.
  const bare = host.split(':')[0] ?? host
  const scheme = bare === 'localhost' || bare.endsWith('.localhost') ? 'http' : 'https'
  return `${scheme}://${host}${german ? '/de' : ''}${path}`
}

/**
 * Datum ohne `toLocaleDateString`: das Ergebnis hinge sonst an den ICU-Daten
 * der Maschine, auf der der Server gerade läuft — bei einer Mail, die niemand
 * noch einmal ansieht, eine unnötige Unbekannte. Deutsch TT.MM.JJJJ,
 * englisch JJJJ-MM-TT.
 */
export function formatMailDate(iso: string, german: boolean): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  const year = String(parsed.getUTCFullYear())
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  return german ? `${day}.${month}.${year}` : `${year}-${month}-${day}`
}

export function buildCommunityReadyMail(input: CommunityReadyMailInput): CommunityReadyMailText {
  // Deutsch ist der Rückfall (wie in den Einladungs-Mails): nur ein
  // ausdrückliches 'en' schaltet um.
  const german = input.locale !== 'en'
  const address = siteLink(input.host, '', german)
  const dashboard = siteLink(input.host, '/dashboard', german)
  const account = siteLink(input.accountHost, '', german)
  const trialDate = input.trialEndsAt ? formatMailDate(input.trialEndsAt, german) : ''

  const subject = german
    ? `Deine Community steht: ${input.siteName}`
    : `Your community is live: ${input.siteName}`

  const lines = german
    ? [
        `${input.siteName} ist angelegt und erreichbar.`,
        '',
        `Adresse deiner Community: ${address}`,
        `Verwaltung (Dashboard): ${dashboard}`,
        `Dein Kundenbereich: ${account}`,
        ...(trialDate
          ? ['', `Deine Testphase läuft bis zum ${trialDate}. Danach ist die Community ohne Abo nur noch zum Lesen — Inhalte und Mitglieder bleiben.`]
          : []),
        '',
        'Im Dashboard wartet eine kurze Liste mit den ersten fünf Schritten.',
      ]
    : [
        `${input.siteName} has been created and is reachable.`,
        '',
        `Your community address: ${address}`,
        `Admin area (dashboard): ${dashboard}`,
        `Your account area: ${account}`,
        ...(trialDate
          ? ['', `Your trial runs until ${trialDate}. After that the community stays read-only without a subscription — content and members remain.`]
          : []),
        '',
        'A short list with your first five steps is waiting in the dashboard.',
      ]

  return { subject, text: lines.join('\n') }
}
