/**
 * Was hier NICHT mehr steht: die Paket-Kataloge und die Datei-System-Auflösung
 * (`DEP_GROUPS`, `ALL_DEP_NAMES`, `pkgVersion`). Die sind nach
 * `../../build/systemManifest.ts` umgezogen, weil sie ZUR BAUZEIT laufen
 * müssen — in Produktion liegt nur `.output/`, dort findet ein
 * `require('<pkg>/package.json')` nichts. Sie werden hier weiter EXPORTIERT,
 * damit die bestehenden Aufrufstellen (system.get.ts, system/update.post.ts)
 * unverändert bleiben; im Dev sind sie zugleich der Laufzeit-Rückfall.
 *
 * Hier bleibt, was in Produktion wirklich Laufzeit ist: der npm-/GitHub-Blick
 * nach draußen und der Versions-Vergleich.
 */
export { ALL_DEP_NAMES, DEP_GROUPS, pkgVersion } from '../../build/systemManifest'

// --- npm-Registry: neueste Version + Aktualitäts-Vergleich -------------------

// Erfolgreiche Lookups 1 h cachen (Fehler werden NICHT gecacht → nächster
// Refresh versucht es erneut). Lebt im Modul-Scope über Requests hinweg.
const latestCache = new Map<string, { value: string, at: number }>()
const LATEST_TTL_MS = 60 * 60 * 1000

/** Neueste Stable-Version eines Pakets von der npm-Registry — best effort. */
export async function latestVersion(name: string): Promise<string | null> {
  const cached = latestCache.get(name)
  if (cached && Date.now() - cached.at < LATEST_TTL_MS) return cached.value
  try {
    // Kein abbreviated-Accept-Header: der liefert beim /latest-Endpoint für
    // scoped Pakete (@scope/name) einen leeren Body. Plain JSON funktioniert für beide.
    // `, string` als Anfrage-Generic: das hier ist eine FREMDE URL, keine
    // Route dieser App — ohne ihn rechnet TypeScript sie trotzdem gegen die
    // Vereinigung aller Server-Routen und kippt ueber die Rekursionsgrenze
    // (TS2589), sobald die App genug Routen hat. Begruendung ausfuehrlich in
    // apps/platform/server/utils/tenantBrandMark.ts.
    const res = await $fetch<{ version?: string }>(`https://registry.npmjs.org/${name}/latest`, {
      timeout: 4000,
    })
    const value = res.version ?? null
    if (value) latestCache.set(name, { value, at: Date.now() })
    return value
  }
  catch {
    return null
  }
}

// Neueste stabile Appwrite-Serverversion vom GitHub-Release (eigener Cache).
const appwriteCache = new Map<string, { value: string, at: number }>()

export async function latestAppwriteVersion(): Promise<string | null> {
  const cached = appwriteCache.get('appwrite')
  if (cached && Date.now() - cached.at < LATEST_TTL_MS) return cached.value
  try {
    // GitHub verlangt einen User-Agent; releases/latest = neuestes Nicht-Prerelease.
    // Fremde URL, `, string` — siehe die Begruendung eine Funktion darueber.
    const res = await $fetch<{ tag_name?: string }>('https://api.github.com/repos/appwrite/appwrite/releases/latest', {
      timeout: 4000,
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'pukalani-monorepo' },
    })
    const value = res.tag_name?.replace(/^v/, '') ?? null
    if (value) appwriteCache.set('appwrite', { value, at: Date.now() })
    return value
  }
  catch {
    return null
  }
}

export function parseSemver(v: string): [number, number, number] | null {
  const m = v.match(/(\d+)\.(\d+)\.(\d+)/)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/** true = installiert < latest (veraltet), false = aktuell/voraus, null = unbestimmbar */
export function isOutdated(installed: string, latest: string | null): boolean | null {
  if (!latest) return null
  const a = parseSemver(installed)
  const b = parseSemver(latest)
  if (!a || !b) return null
  // Destrukturieren statt Index-Zugriff (sauber unter noUncheckedIndexedAccess)
  const [aMajor, aMinor, aPatch] = a
  const [bMajor, bMinor, bPatch] = b
  if (aMajor !== bMajor) return aMajor < bMajor
  if (aMinor !== bMinor) return aMinor < bMinor
  return aPatch < bPatch
}
