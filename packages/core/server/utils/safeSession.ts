import type { Models } from 'node-appwrite'
import type { UserSession } from '../../shared/types/session'
import type { SessionGeoCity } from './geoCity'

/**
 * Appwrite-Session → sichere Client-Form (EINE Quelle für Self-Sicht und
 * Admin-Detailseite). Secrets/Tokens (secret, providerAccessToken/-Refresh)
 * werden hier bewusst NICHT übernommen. Appwrite liefert für nicht auflösbare
 * (lokale/private) IPs 'Unknown'/'--' als Land — auf leer normalisiert, damit
 * die UI lokalisiert „Unbekannt" zeigen kann.
 *
 * `geo` kommt aus `lookupCityForIp()` (lokale MMDB) und ist UNABHÄNGIG vom
 * Land: die zwei Quellen wissen unterschiedlich viel, und ein Sonderfall
 * „ohne Land keine Stadt" würde eine Angabe verschweigen, die wir haben.
 * Fehlt die Auflösung (kein Pfad konfiguriert, private IP, kein Treffer),
 * bleiben beide Felder leer und die Anzeige ist exakt die von vorher.
 */
export function mapSafeSession(s: Models.Session, current: boolean, geo?: SessionGeoCity | null): UserSession {
  const countryName = (!s.countryName || s.countryName === 'Unknown' || s.countryName === '--') ? '' : s.countryName
  return {
    $id: s.$id,
    $createdAt: s.$createdAt,
    $updatedAt: s.$updatedAt,
    provider: s.provider,
    ip: s.ip,
    osCode: s.osCode,
    osName: s.osName,
    osVersion: s.osVersion,
    clientType: s.clientType,
    clientName: s.clientName,
    clientVersion: s.clientVersion,
    clientEngine: s.clientEngine,
    clientEngineVersion: s.clientEngineVersion,
    deviceName: s.deviceName,
    deviceBrand: s.deviceBrand,
    deviceModel: s.deviceModel,
    countryCode: countryName ? s.countryCode : '',
    countryName,
    city: geo?.city ?? '',
    region: geo?.region ?? '',
    factors: s.factors ?? [],
    expire: s.expire,
    current,
  }
}
