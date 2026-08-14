/**
 * Dürfen die MITGLIEDER dieser Community einladen? (F57 Mechanik 2, Davids
 * Entscheidung vom 2026-08-14) — SSR-gespiegelt via tenant-brand-Plugin,
 * reist im Payload.
 *
 * Drei Zustände, gebaut wie `useTenantOpenRegistration()`:
 *   true  = Tenant-Host, Mechanik an (Vorgabe)
 *   false = Tenant-Host, Owner hat sie abgeschaltet
 *   null  = KEIN Tenant-Host (Silo-App, Kontroll-Host, Playground) — dort gibt
 *           es keine Community-Grenze und damit auch keine Mechanik.
 *
 * WOFÜR ER DA IST UND WOFÜR NICHT: er trägt den Zustand der
 * EINSTELLUNGS-KARTE unter /dashboard/community. Ob ICH gerade einladen darf,
 * beantwortet er NICHT — dazu gehören die Rolle, das Wochen-Kontingent und
 * dessen Verbrauch, und die kommen gebündelt aus
 * `/api/community/invites/quota`. Aus diesem Wert ein Knopf-Gate zu bauen
 * hieße, die halbe Regel ein zweites Mal hinzuschreiben; die Oberfläche zeigte
 * dann einen Knopf, den die Route mit 403 beantwortet.
 */
export function useTenantMemberInvites() {
  const state = useState<boolean | null>('pukalani-tenant-member-invites', () => null)
  /** Explizit abgeschaltet — nur `false` zählt, `null` ist kein Tenant. */
  const disabled = computed(() => state.value === false)
  return { memberInvitesEnabled: state, disabled }
}
