import { type PresencePrioritySnapshot, yieldsToForeignVisiblePresence } from '../../../shared/presencePriority'

/**
 * Presence sofort entfernen (Tab schließt / Seite verlässt) — per
 * navigator.sendBeacon aufgerufen. Ohne diesen Weg bliebe der User bis zur
 * Expiry (~120s) „online". Best effort; fehlt der User, ist nichts zu tun.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) return { ok: true }
  try {
    const { presences } = createAdminClient(event)

    // VORFAHRT beim LÖSCHEN (2026-08-18, dieselbe Regel wie im Heartbeat):
    // schließt jemand den HINTERGRUND-Tab von Community A, während er Community B
    // sichtbar vor sich hat, träfe das Beacon die EINE gemeinsame Presence — der
    // sichtbare Tab wäre für bis zu 20 s (bis zu seinem nächsten Heartbeat)
    // ausradiert. Gehört die Presence dem eigenen Mandanten, ist sie away oder
    // veraltet, wird wie bisher gelöscht; der andere Tab baut sie sonst binnen
    // ≤60 s ohnehin wieder auf (PRESENCE_VISIBLE_FRESH_MS).
    let existing: PresencePrioritySnapshot | null = null
    try {
      const current = await presences.get({ presenceId: user.$id })
      const metadata = (current.metadata ?? {}) as Record<string, unknown>
      existing = {
        updatedAt: current.$updatedAt,
        away: metadata.away === true,
        tenantId: typeof metadata.tenantId === 'string' ? metadata.tenantId : '',
      }
    }
    catch {
      // fail-open: nicht lesbar (404, Netz) ⇒ löschen wie vor der Regel.
      existing = null
    }
    const tenant = useTenant(event)
    const callerTenantId = tenant?.mode === 'pool' ? tenant.tenantId : ''
    if (yieldsToForeignVisiblePresence(existing, callerTenantId, Date.now())) return { ok: true }

    await presences.delete({ presenceId: user.$id })
  }
  catch (error) {
    // schon weg / abgelaufen → egal; nur der Scope-Fehler ist ein
    // Konfigurationsfehler und wird einmal gemeldet (siehe utils/presence.ts)
    warnPresenceScopeMissingOnce(error, 'presence.leave')
  }
  return { ok: true }
})
