import type { MyCommunitiesResponse, MyCommunityView } from '../../../control/shared/myCommunities'

/**
 * „Meine Communities" — EIN Abruf, drei Leser (AH-3).
 *
 * Die Mitgliedschaftsliste mit Rolle, Plan, Testphase und Sperrzustand gibt es
 * seit F12 (`GET /api/onboarding/communities` → Service-Naht →
 * `POST /api/control/community/mine`). Sie beantwortet inzwischen drei Fragen
 * an drei Orten: die Übersichtskarten (`/communities`), die Abrechnungs-
 * Übersicht (`/settings/billing`) und die Community-NAMEN in der eigenen
 * Aktivität (`/profile/activity`, die nur Hosts kennt).
 *
 * Der feste `key` ist der Punkt: ohne ihn baut Nuxt je Aufrufstelle einen
 * eigenen — beim Wechsel von `/communities` nach `/profile/activity` liefe der
 * Control-Plane-Ruf dann ein zweites Mal, obwohl die Antwort schon im Payload
 * liegt. Mit dem Schlüssel teilen sich alle drei Seiten einen Abruf.
 *
 * BEWUSST KEIN eigener Endpunkt für die Namen: eine zweite Route mit
 * derselben Auskunft wäre eine zweite Wahrheit, und dieser Weg trägt bereits
 * die Rechte-Projektion (`projectMyCommunities`) — was der Aufrufer nicht
 * sehen darf, kommt hier gar nicht erst an.
 */
export function useMyCommunities() {
  return useFetch<MyCommunitiesResponse>('/api/onboarding/communities', {
    key: 'my-communities',
    default: () => ({ communities: [] as MyCommunityView[] }),
  })
}
