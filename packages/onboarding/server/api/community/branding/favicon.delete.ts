import type { CommunityFaviconDeleteResponse } from '../../../../shared/types/communityFavicon'

/**
 * Das eigene Favicon EINER Community entfernen (Community-Favicon-Upload) — die
 * Community fällt danach aufs GENERIERTE Icon zurück.
 *
 * Gleiche Naht wie `favicon.post.ts`: `requireCommunityPermission(event,
 * 'branding.manage')`, 404 ohne Mandanten-Kontext. `removeCommunityFavicon`
 * behandelt eine bereits fehlende Datei als Erfolg (404 = No-op) — der Owner
 * klickt „Entfernen", das Ziel ist erreicht. Fehlender Bucket ⇒ klare
 * 500-Meldung, wie beim Upload.
 */
export default defineEventHandler(async (event): Promise<CommunityFaviconDeleteResponse> => {
  await requireCommunityPermission(event, 'branding.manage')

  const tenant = useTenant(event)
  if (!tenant?.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  await removeCommunityFavicon(event, tenant.communityId)
    .catch((error) => { throw toH3Error(error, 'Favicons bucket missing — run migrations') })

  return { ok: true }
})
