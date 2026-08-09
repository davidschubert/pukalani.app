import { siteRequestOrigin } from '../utils/siteRequestOrigin'

/**
 * robots.txt — als GENERIERTE Route statt als Datei in `public/`.
 *
 * WARUM (Muster `apps/marketing/server/routes/robots.txt.get.ts`): die
 * statische Datei verdrahtete `https://pukalani.studio/sitemap.xml`. Sobald
 * diese Site ihre zweite Domain bedient (Kundendomain, Freischaltung über den
 * `domains`-Layer), verwiese die robots.txt DORT auf eine fremde Domain — und
 * eine Sitemap unter fremder Domain ignoriert Google. Es ist derselbe Grund,
 * aus dem canonical/hreflang seit Befund B1 aus dem Request-Host kommen; die
 * Origin-Rechnung ist wörtlich dieselbe (`siteRequestOrigin`, Schema aus der
 * Env, Host aus dem Request).
 *
 * Die AI-Crawler stehen EINZELN da, obwohl `User-agent: *` sie längst erlaubt:
 * das ist eine ausdrückliche Zusage (GEO). Mehrere dieser Bots — Google-
 * Extended, Applebot-Extended, CCBot — sind reine Opt-out-Namen, die man nur
 * dadurch bedient, dass man sie NICHT sperrt. Wer die Liste kürzt, ändert
 * nichts am Verhalten, verliert aber die Aussage.
 *
 * NEU gegenüber der Datei: `/api/` und `/dashboard` sind für alle gesperrt.
 * Die Health-/Telemetrie-Routen der Layer und der Anmeldebereich haben in
 * einem Index nichts zu suchen — sie sind keine Seiten, sondern Werkzeug.
 * Das ist keine Zugriffssperre (die machen die Routen selbst), sondern eine
 * Bitte, Crawl-Budget nicht zu verbrennen.
 */

/**
 * Assistenten und Antwortmaschinen, die ausdrücklich erlaubt sind. Reihenfolge
 * wie in der bisherigen Datei — sie folgt den Anbietern, nicht dem Alphabet.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'meta-externalagent',
  'DuckAssistBot',
  'CCBot',
  'MistralAI-User',
]

export default defineEventHandler((event) => {
  const origin = siteRequestOrigin(event)

  const body = [
    '# pukalani.studio – robots.txt',
    '# Klassische Suchmaschinen und AI-Crawler sind ausdrücklich erlaubt (SEO + GEO).',
    `# Kompakte Inhaltsübersicht für LLMs: ${origin}/llms.txt`,
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /dashboard',
    '',
    '# --- AI-Assistenten & Answer Engines (explizit erlaubt) ---',
    ...AI_CRAWLERS.flatMap(agent => ['', `User-agent: ${agent}`, 'Disallow:']),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  // Öffentlich + user-agnostisch → darf am Edge/Proxy liegen (wie sitemap.xml).
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return body
})
