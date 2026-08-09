import { z } from 'zod'
import { resolveControlHosts } from '../../../../core/shared/controlCenter'
import { controlExitTarget, type ControlExitHandoff } from '../../../shared/controlExit'
import { sealControlHostHandoff } from '../../utils/communityHandoff'

/**
 * DER SPRUNG AUF EINEN KONTROLL-HOST — eingeloggt (F50-Nachtrag, Davids
 * Entscheidung 2026-08-08).
 *
 * Die zwei Ausgänge des Community-Switchers („Community anlegen" → `/start` auf
 * dem Wizard-Host, „Communities verwalten" → `/communities` im Kundenbereich)
 * waren schlichte Links, und der Nutzer landete drüben ausgeloggt vor dem
 * Anmeldeformular —
 * obwohl es dieselbe Platform-App und dasselbe Pool-Projekt ist. Diese Route
 * gibt ihnen dasselbe Siegel-Verfahren, das der Community-WECHSEL im selben
 * Menü schon benutzt (`POST /api/community/switch`): 60-Sekunden-Token hier,
 * Einlösung drüben gegen Appwrite (`GET /api/auth/site-session`), erst dann ein
 * eigenes Cookie.
 *
 * ── DREI UNTERSCHIEDE ZUM COMMUNITY-SPRUNG, alle bewusst ──────────────────
 *  1. **Kein Ruf ins Control Plane.** Ein Kontroll-Host ist kein Mandant; es
 *     gibt keine Mitgliedschaft zu belegen (ausführlich in
 *     `shared/controlExit.ts`). Der Klick kostet damit nur einen Krypto-Aufruf.
 *  2. **Das Ziel ist eine Wahl aus ZWEI**, nicht eine Id. Der Body sagt
 *     `create` oder `manage`, den Host holt die Route selbst aus
 *     `pukalani.tenancy.*` — der Aufrufer kann keinen fremden Host in ein
 *     Siegel schreiben (Eigenschaft aus dem Audit 2026-08-02).
 *  3. **Der Pfad reist mit.** Er gehört zum Ziel, nicht zum Klickenden; die
 *     Antwort trägt ihn, damit die Seite ihn nicht ein zweites Mal kennt.
 *
 * ── DERSELBE ORT WIE DER SWITCHER (404 sonst) ─────────────────────────────
 * Diese Route lebt auf den MANDANTEN-Hosts, wo das Menü hängt — Gate wie bei
 * `switcher.get.ts`/`switch.post.ts` (nur `mode: 'pool'`). Auf einem
 * Kontroll-Host wäre sie sinnlos (dort IST man schon) und fiele ohnehin durch
 * das fail-closed Präfix-Tor; im Silo gibt es keine Kontroll-Hosts.
 *
 * ── HOSTS: ENV VOR app.config ─────────────────────────────────────────────
 * `resolveControlHosts` statt eines rohen Griffs in die app.config — dieselbe
 * Reihenfolge wie in `useControlCenter`/`useTenantHost`. Lokal heißen die
 * Kontroll-Hosts anders (`app.localhost`), und ein Siegel für
 * `my.pukalani.app` schickte den Entwickler mitten aus seiner Sitzung in die
 * Produktion.
 */
const bodySchema = z.object({
  /** WELCHER der zwei Ausgänge — mehr sagt der Aufrufer nicht, mehr darf er nicht. */
  target: z.enum(['create', 'manage']),
}).strict()

export default defineEventHandler(async (event): Promise<ControlExitHandoff> => {
  const tenant = useTenant(event)
  if (tenant?.mode !== 'pool') {
    throw createError({ status: 404, statusText: 'Not found' })
  }
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const config = useRuntimeConfig(event)
  const appConfig = useAppConfig() as {
    pukalani?: { tenancy?: { controlHosts?: string[], wizardHosts?: string[] } }
  }
  const publicTenancy = (config.public as { tenancy?: { controlHosts?: string, wizardHosts?: string } }).tenancy
  const destination = controlExitTarget(body.target, {
    controlHosts: resolveControlHosts(publicTenancy?.controlHosts, appConfig.pukalani?.tenancy?.controlHosts),
    wizardHosts: resolveControlHosts(publicTenancy?.wizardHosts, appConfig.pukalani?.tenancy?.wizardHosts),
  })
  if (!destination) {
    // Kein Kontroll-Host konfiguriert: dann zeigt das Menü den Eintrag ohnehin
    // nicht — hier gäbe es nichts zu siegeln, also 404 statt eines Tokens auf
    // einen leeren Host.
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const { token, host } = sealControlHostHandoff(event, destination.host)
  return { token, host, path: destination.path }
})
