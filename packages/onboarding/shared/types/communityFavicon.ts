/**
 * ANTWORT-TYPEN DER FAVICON-ROUTEN — von BEIDEN Seiten benutzt
 * (Community-Favicon-Upload).
 *
 * Seit Nitros Routen-Typisierung aus ist (packages/core/nuxt.config.ts,
 * `types:extend`), leitet `$fetch('/api/…')` seinen Antworttyp nicht mehr aus
 * dem Handler ab. Die Form steht EINMAL hier und wird an beiden Enden verlangt:
 * der Handler annotiert `): Promise<CommunityFaviconResponse>`, die
 * Aufrufstelle schreibt `$fetch<CommunityFaviconResponse>(…)`.
 *
 * Domain-Types gehören nach `shared/types/`, nie nach `app/types/` — der Server
 * sieht sie sonst nicht (CLAUDE.md).
 */

/**
 * POST /api/community/branding/favicon — nach erfolgreichem Upload.
 *
 * `updatedAt` ist der `$updatedAt` der gespeicherten Datei; die Dashboard-Karte
 * baut daraus über `uploadedBrandIconKey` sofort die frische Vorschau-URL, ohne
 * auf den nächsten Seitenaufbau zu warten.
 */
export interface CommunityFaviconResponse {
  ok: true
  updatedAt: string
}

/** DELETE /api/community/branding/favicon — nach dem Entfernen. */
export interface CommunityFaviconDeleteResponse {
  ok: true
}
