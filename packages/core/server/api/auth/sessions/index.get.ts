import { createSessionClient } from '../../../lib/appwrite'
import type { UserSessionListResponse } from '../../../../shared/types/session'

/** Eigene aktive Sessions des Users (SessionClient — nur seine eigenen). */
export default defineEventHandler(async (event): Promise<UserSessionListResponse> => {
  if (!event.context.user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const { account } = createSessionClient(event)
  const list = await account.listSessions()

  // mapSafeSession (server/utils): vollständige, aber Secret-freie Sicht.
  // lookupCityForIp reichert um Stadt/Region aus der LOKALEN MMDB an — ohne
  // konfigurierten Pfad liefert es null und die Antwort ist die von vorher.
  // Promise.all statt Schleife: nur der ERSTE Aufruf liest wirklich die Datei,
  // danach rechnet der Leser synchron im gehaltenen Puffer.
  const sessions = await Promise.all(
    list.sessions.map(async s => mapSafeSession(s, s.current, await lookupCityForIp(event, s.ip))),
  )
  return { sessions }
})
