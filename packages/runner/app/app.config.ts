/**
 * Noch nichts anzumelden: die Dashboard-Sektion des AI-Runners (Registry
 * `pukalani.admin.modules`, Capability `runner.manage`) kommt zusammen mit
 * seiner Oberfläche in Paket 3 des Konzepts (docs/plans/AI-RUNNER.md § 10).
 *
 * Die Datei steht trotzdem schon hier, weil `app.config.ts` NUR in `app/`
 * aufgelöst wird — im Package-Root wird sie stillschweigend ignoriert, und
 * genau das fällt beim späteren Nachrüsten niemandem auf.
 */
export default defineAppConfig({})
