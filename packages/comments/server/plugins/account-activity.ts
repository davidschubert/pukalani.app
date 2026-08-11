/**
 * Registriert den Konto-Aktivitäts-Contributor des comments-Layers beim
 * core-Vertrag (AccountActivityContributor, AH-3) — einmal beim Serverstart.
 *
 * NICHT ZU VERWECHSELN mit `user-activity.ts` NEBENAN. Der Layer beantwortet
 * zwei verschiedene Fragen und meldet sich deshalb an zwei Registries an:
 *  - `user-activity.ts` → „wo habe ich IN DIESER COMMUNITY zuletzt
 *    kommentiert?" (tenantDb, Klinke `member`, nur Ziel-Ids, Konsument ist die
 *    Discussions-Seitenleiste)
 *  - diese Datei      → „was habe ich ÜBER ALLE COMMUNITIES geschrieben?"
 *    (Admin-Client, Besitz-Spalte als Grenze, mit Titel und Pfad, Konsument
 *    ist `/profile/activity` auf dem Kontroll-Host)
 * Zusammenlegen geht nicht: die erste DARF die Mandantengrenze nicht
 * überschreiten, die zweite MUSS es.
 */
export default defineNitroPlugin(() => {
  registerAccountActivityContributor({
    id: 'comments',
    listAccountActivity: commentsListAccountActivity,
  })
})
