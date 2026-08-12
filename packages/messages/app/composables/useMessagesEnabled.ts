/**
 * LÄUFT DAS PRODUKT IN DIESER COMMUNITY? — der Client-Leser des Owner-Schalters.
 *
 * Der Schalter (§ 2.6, Davids Entscheidung 4) steht ab Werk auf AUS
 * (`MESSAGES_ENABLED_DEFAULT = false`) und lebt in einer Row, nicht in der
 * Config — es gibt für ihn also keinen SSR-Spiegel wie bei Plan oder Rolle.
 * Bis F56 brauchte ihn auch niemand: der Posteingang liest den ABGEWIESENEN
 * Versuch (`MESSAGES_DISABLED_CODE`), und das reicht auf einer Seite, die man
 * bewusst aufruft.
 *
 * Neben einem Autorennamen reicht es NICHT. Dort darf kein Knopf stehen, der
 * in einer Community ohne privates Postfach in einen Fehler führt — die
 * Begründung steht im Kopf von `MessageWriteButton.vue` und gilt hier
 * unverändert. Also wird der Zustand einmal GEFRAGT.
 *
 * DREI DINGE MIT GRUND:
 *  1. **EIN Schlüssel, egal wie viele Namen auf der Seite stehen.** Eine
 *     Kommentarliste hat 25 Autoren; `useAsyncData` unter demselben Schlüssel
 *     macht daraus eine Abfrage und einen SSR-Payload-Eintrag.
 *  2. **`useRequestFetch()`, nicht `$fetch`.** Der Aufruf ist mandanten- UND
 *     sitzungsgebunden: ohne die weitergereichten Kopfzeilen fragte der Server
 *     sich selbst ohne Host und ohne Cookie (dieselbe Falle wie bei der
 *     CMS-Navigation im blueprint-Layout).
 *  3. **Fail-closed.** Jeder Fehler — 401 als Gast, 404 ohne Plan, Netz —
 *     heisst `false`. Ein Knopf, der bei einer wackligen Antwort erscheint,
 *     ist genau der Knopf, den es nicht geben soll.
 */
export function useMessagesEnabled() {
  const { isLoggedIn } = useCurrentUser()
  const requestFetch = useRequestFetch()

  const { data } = useAsyncData(
    'pukalani-messages-enabled',
    async () => {
      if (!isLoggedIn.value) return false
      return await requestFetch<{ enabled: boolean }>('/api/messages/settings')
        .then(response => response.enabled === true)
        .catch(() => false)
    },
    { watch: [isLoggedIn], default: () => false },
  )

  return computed(() => data.value === true)
}
