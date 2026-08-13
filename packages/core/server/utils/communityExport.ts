import type { Models } from 'node-appwrite'
import { Query } from 'node-appwrite'
import type { H3Event } from 'h3'
import type { TenantDb } from './tenantDb'
import { useTenant } from './tenant'

/**
 * U20 — DER COMMUNITY-EXPORT: der Vertrag, über den jeder Produkt-Layer seinen
 * Anteil am Bündel beisteuert.
 *
 * Wortgleich zum GDPR-Vertrag daneben (`userData.ts`), und das ist Absicht:
 * dort exportiert ein KONTO seine Daten quer über alle Layer, hier eine
 * COMMUNITY ihre Inhalte quer über alle Layer. Wer den einen kennt, kennt den
 * anderen — Registry als Modul-Map, Registrierung per Nitro-Plugin
 * (`server/plugins/community-export.ts`), idempotent über die `id`, Ausgabe in
 * stabiler Reihenfolge.
 *
 * WARUM EIN VERTRAG UND KEIN SAMMLER: die Route liegt im onboarding-Layer
 * (dort hängt der Community-Hub und dort liegt die Naht zum Control Plane).
 * Ein onboarding, das `community_posts` und `lessons` beim Namen kennt, wäre
 * genau die Cross-Layer-Kopplung, die A14 verbietet — und jeder neue
 * Produkt-Layer müsste sie erweitern, statt sich anzumelden. Eine App ohne
 * `courses` hat so automatisch keinen Kurs-Abschnitt im Bündel, ohne dass
 * irgendwo eine Liste gepflegt wird.
 *
 * DER CONTRIBUTOR BEKOMMT NUR DEN `H3Event` — bewusst KEINE communityId.
 * Sie steht im Mandanten-Kontext, und der einzige Weg, mit ihr zu lesen, ist
 * die Datentür (`tenantDb`). Gäbe der Vertrag sie mit heraus, wäre die
 * naheliegende Implementierung ein `Query.equal('communityId', …)` am
 * Admin-Client vorbei an der Tür — also genau das, was der ESLint-Backstop
 * in `server/api/**` verhindert und was hier niemand prüfen würde.
 */

export interface CommunityExportContributor {
  /** stabil + eindeutig, z. B. 'posts', 'comments', 'pages'. */
  id: string
  /**
   * Der Anteil DIESES Layers als export-fertiges, JSON-serialisierbares
   * Objekt. MUSS intern vollständig paginieren (collectTenantRows) und MUSS
   * über die Datentür lesen — sie ist der Mandanten-Filter.
   *
   * Darf werfen: der Orchestrator bricht dann ab. Ein halbes Bündel wäre der
   * schlimmere Ausgang — es sähe vollständig aus.
   */
  exportCommunityData(event: H3Event): Promise<unknown>
}

const contributors = new Map<string, CommunityExportContributor>()

/** Registrierung ist idempotent (HMR/Doppel-Plugin überschreibt nur sich selbst). */
export function registerCommunityExportContributor(contributor: CommunityExportContributor): void {
  contributors.set(contributor.id, contributor)
}

/** Deterministische Reihenfolge — unabhängig von der Plugin-Ladereihenfolge. */
export function listCommunityExportContributors(): CommunityExportContributor[] {
  return [...contributors.values()].sort((a, b) => a.id.localeCompare(b.id))
}

/** Nur für Tests — die Registry ist sonst prozessweit und additiv. */
export function __resetCommunityExportContributors(): void {
  contributors.clear()
}

/**
 * VOLLSTÄNDIG PAGINIERTES LESEN DURCH DIE DATENTÜR.
 *
 * Das Gegenstück zu `listAllRows` (GDPR), aber über `tenantDb` statt über den
 * rohen Admin-Client: `db.list()` hängt den Mandanten-Filter selbst an, der
 * Aufrufer kann ihn nicht vergessen.
 *
 * `queries` OHNE limit/cursor übergeben — die Schleife besitzt beide. Der
 * harte Deckel wirft, statt stillschweigend abzuschneiden: ein Export, der bei
 * 50.000 Zeilen heimlich endet, ist eine Lüge in Dateiform.
 */
const PAGE = 100
const HARD_CAP = 50_000

export async function collectTenantRows<T extends Models.Row>(
  db: TenantDb,
  tableId: string,
  queries: string[] = [],
): Promise<T[]> {
  const out: T[] = []
  let cursor: string | undefined

  for (;;) {
    const res = await db.list<T>(tableId, [
      ...queries,
      Query.limit(PAGE),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ])
    out.push(...res.rows)
    if (res.rows.length < PAGE) return out
    if (out.length >= HARD_CAP) {
      throw createError({ status: 507, statusText: 'Export too large' })
    }
    cursor = res.rows.at(-1)!.$id
  }
}

/** Das Bündel, so wie es in der Datei steht. */
export interface CommunityExport {
  /** Zeitpunkt des Laufs (ISO). */
  exportedAt: string
  /** Format-Marke — steigt nur, wenn sich die BEDEUTUNG eines Feldes ändert. */
  format: 1
  community: {
    id: string
    name: string
    host: string
  }
  /**
   * WAS BEWUSST NICHT DRIN IST — als Feld, nicht als Fußnote. Ein Bündel, das
   * verschweigt, was es weglässt, lässt den Leser raten, ob seine Community
   * leer ist oder der Export unvollständig.
   */
  omitted: readonly string[]
  /** Layer-Id → Anteil dieses Layers. */
  data: Record<string, unknown>
}

/**
 * Was in KEINEM Community-Export steht (Davids Zuschnitt vom 2026-08-12):
 * die Mitgliederliste. Gewöhnliche Mitglieder erscheinen nur als anonyme
 * Zahl; E-Mail-Adressen gar nicht.
 */
const OMITTED = [
  'member-list',
  'member-emails',
  'member-user-ids',
  'guest-author-contact-details',
  'private-messages',
  'moderation-reports',
] as const

/**
 * Alle Contributors einsammeln — der EINE Ort, an dem das Bündel entsteht.
 *
 * Fail-fast wie beim Konto-Export: ein werfender Contributor bricht den Lauf
 * ab. Der Owner bekommt dann einen Fehler statt einer Datei, in der sein
 * halbes Archiv fehlt.
 */
export async function exportCommunityCompletely(event: H3Event): Promise<CommunityExport> {
  const tenant = useTenant(event)
  if (!tenant?.communityId) {
    throw createError({ status: 404, statusText: 'Not found' })
  }

  const data: Record<string, unknown> = {}
  for (const contributor of listCommunityExportContributors()) {
    data[contributor.id] = await contributor.exportCommunityData(event)
  }

  return {
    exportedAt: new Date().toISOString(),
    format: 1,
    community: {
      id: tenant.communityId,
      name: tenant.name ?? '',
      host: tenant.canonicalHost ?? '',
    },
    omitted: OMITTED,
    data,
  }
}
