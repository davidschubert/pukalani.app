import type { CommunitySeoSettings } from '../../shared/communitySeo'

/**
 * Sucheinstellung DIESER Community (U15 Teil 2) — SSR-gespiegelt vom
 * `community-seo.server.ts`-Plugin, reist im Payload.
 *
 * Drei Zustände, und der dritte ist wieder der wichtige (Muster
 * useTenantAudience):
 *   Werte  = Mandanten-Host mit gespeicherter Wahl
 *   null   = Mandanten-Host OHNE eigene Wahl (der Normalfall)
 *   null   = KEIN Mandanten-Host (Silo, Kontroll-Host, Playground)
 * Die letzten beiden sehen für den Kopf gleich aus, und das ist Absicht: ohne
 * Wahl gilt das Verhalten von vor U15, und ohne Community gibt es nichts zu
 * wählen.
 *
 * ZWEI LESER, und beide brauchen ihn SSR-fest:
 *   (1) `useLocaleSeoHead()` stempelt das robots-Signal — ein Crawler liest
 *       das SSR-HTML, ein Client-Nachtrag käme zu spät.
 *   (2) die Startseite nimmt die Beschreibung als Vorrang vor dem Anriss.
 * Der Editor unter /dashboard/community/seo liest denselben State als
 * Anfangszustand seines Formulars — er braucht dafür keine eigene Leseroute,
 * weil die Werte auf diesem Host ohnehin schon im Payload stehen.
 *
 * KEIN GEHEIMNIS, und das ist die Bedingung fürs Spiegeln: beide Werte landen
 * als `<meta>` im HTML jeder Seite. Wer sie im Payload liest, liest sie zwei
 * Zeilen weiter oben noch einmal.
 */
export function useCommunitySeoSettings() {
  return useState<CommunitySeoSettings | null>('pukalani-community-seo', () => null)
}
