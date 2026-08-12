/**
 * F3 / AH-6 — die PUREN Regeln des comments→Pool-Umzugs.
 *
 * Hier steht nichts, was das Netz anfasst. Grund: die drei Stellen, an denen
 * dieser Umzug laut Plan (docs/plans/F3-COMMENTS-POOL.md § 10) am ehesten
 * schiefgeht, sind alle drei RECHENFEHLER und keine Netzfehler —
 *
 *   1. die zwei Community-Schlüssel (Spalte trägt `tenantId`, Label trägt `$id`),
 *   2. die Zusammenführungs-Entscheidung bei gleicher E-Mail,
 *   3. das Umschreiben der Row-Permissions.
 *
 * Ein Fehler in (1) läuft GRÜN durch und liefert eine leere Community. Deshalb
 * sind diese Regeln hier abgetrennt, unit-getestet
 * (`packages/control/tests/f3CommentsToPool.test.ts`) und werden vom Werkzeug
 * `scripts/ops/f3-comments-to-pool.mjs` nur noch aufgerufen.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Die ZWEI Community-Schlüssel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Eine Community hat zwei Schlüssel, und sie werden an verschiedenen Stellen
 * gebraucht (Plan § 4.2). Sie heißen hier bewusst NICHT beide „communityId":
 *
 * | Wofür                                   | Welcher Wert          |
 * | --------------------------------------- | --------------------- |
 * | Spalte `communityId` in jeder Datenzeile | `communities.tenantId` (`t-…`) |
 * | `Role.label(...)` / `read("label:…")`    | `communities.$id`     |
 * | `community_members.communityId`          | `communities.$id`     |
 */
export interface CommunityKeys {
  /** `communities.$id` — der LABEL-Schlüssel. Beginnt NIE mit `t-`. */
  rowId: string
  /** `communities.tenantId` — der SPALTEN-Schlüssel. Beginnt IMMER mit `t-`. */
  tenantId: string
}

export const TENANT_ID_PREFIX = 't-'

/**
 * Verwechslungs-Sperre. Die beiden Werte sehen gleich aus (beide sind
 * Appwrite-Ids), und genau deshalb kann man sie tauschen, ohne dass irgendetwas
 * rot wird: gestempelte Zeilen wären dann für `rowBelongsToTenant` fremd
 * (fail-closed) und die Community nach einem grünen Lauf leer.
 *
 * Die einzige maschinell prüfbare Asymmetrie ist das `t-`-Präfix, das
 * `tenants/index.post.ts` beim Anlegen setzt (`t-${ID.unique()}`) — sie wird
 * hier zur harten Bedingung gemacht.
 */
export function assertCommunityKeys(keys: CommunityKeys): void {
  if (!keys.rowId || !keys.tenantId) {
    throw new Error('F3: communityKeys unvollständig — rowId ($id) UND tenantId (t-…) werden beide gebraucht.')
  }
  if (!keys.tenantId.startsWith(TENANT_ID_PREFIX)) {
    throw new Error(`F3: tenantId "${keys.tenantId}" trägt kein "${TENANT_ID_PREFIX}"-Präfix — steht hier versehentlich die communities.$id?`)
  }
  if (keys.rowId.startsWith(TENANT_ID_PREFIX)) {
    throw new Error(`F3: rowId "${keys.rowId}" sieht aus wie eine tenantId — Spalten- und Label-Schlüssel sind vertauscht.`)
  }
}

/**
 * Der STEMPEL für jede Datenzeile. Nimmt `tenantId`, niemals `$id`.
 * Gegenstück im Produktivcode: `scopeRowFor()` in
 * `packages/core/server/utils/tenant.ts` — *„die SPALTE heißt communityId; der
 * Kontext-WERT bleibt tenant.tenantId"*.
 */
export function rowStampFor(keys: CommunityKeys): { communityId: string } {
  assertCommunityKeys(keys)
  return { communityId: keys.tenantId }
}

/**
 * Der LABEL-Schlüssel für Row-Permissions. Nimmt `$id`, niemals `tenantId`.
 * Gegenstück: `tenantRowPermissionsFor()` in
 * `packages/core/server/utils/tenantRowPermissions.ts`.
 */
export function memberLabelFor(keys: CommunityKeys): string {
  assertCommunityKeys(keys)
  return `label:${keys.rowId}`
}

/** Moderations-Label — `mod<communities.$id>`, wie
 *  `communityModeratorLabel()` in `packages/core/shared/communityModeratorLabel.ts`. */
export function moderatorLabelFor(keys: CommunityKeys): string {
  assertCommunityKeys(keys)
  return `label:mod${keys.rowId}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Nutzer: anlegen, zusammenführen oder Einzelfall
// ─────────────────────────────────────────────────────────────────────────────

export interface SourceAccount {
  $id: string
  email: string
  emailVerification: boolean
}

export interface TargetAccount {
  $id: string
  email: string
  emailVerification: boolean
}

export type UserDecision =
  /** Konto im Ziel anlegen, Id BEHALTEN (Plan § 3.2 — dann ist Remapping die Ausnahme). */
  | { action: 'create' }
  /** Dieselbe Person: kein neues Konto, altes Id zeigt im Mapping auf das Zielkonto. */
  | { action: 'merge', targetUserId: string }
  /** Wiederanlauf: die Id steht im Ziel schon mit derselben Adresse. */
  | { action: 'exists', targetUserId: string }
  /** FAIL-CLOSED: nicht migrieren, in den Kollisions-Report, David entscheidet. */
  | { action: 'collision', reason: UserCollisionReason }

export type UserCollisionReason =
  /** Gleiche Adresse, aber nicht BEIDE Konten haben sie bestätigt. */
  | 'email_unverified'
  /** Die Id existiert im Ziel bereits — mit einer ANDEREN Adresse. */
  | 'id_taken_by_other'

function sameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== ''
}

/**
 * Davids Abnahme-Entscheidung (b) vom 2026-08-12, wörtlich:
 *
 * > **Dieselbe E-Mail ist DANN dieselbe Person, wenn BEIDE Konten
 * > `emailVerification === true` tragen. Sonst nicht — dann entscheidet David
 * > den Einzelfall.**
 *
 * Warum fail-closed (Plan § 3.3): ein 500 beim Migrieren ist ein
 * Wiederholungsversuch, eine falsche Verschmelzung ist ein Datenschutzvorfall
 * und unumkehrbar.
 *
 * Die Id-Prüfung steht VOR der E-Mail-Prüfung: eine belegte Id mit fremder
 * Adresse ist ebenfalls ein Einzelfall und darf nicht still überschrieben
 * werden (Plan § 3.2, Kollisionsfall 1).
 */
export function decideUserMigration(params: {
  source: SourceAccount
  /** Konto im Ziel mit DERSELBEN `$id` (oder null). */
  targetById: TargetAccount | null
  /** Konto im Ziel mit DERSELBEN E-Mail (oder null). */
  targetByEmail: TargetAccount | null
}): UserDecision {
  const { source, targetById, targetByEmail } = params

  if (targetById) {
    // Wiederanlauf-Fall: dieselbe Id, dieselbe Adresse ⇒ schon migriert.
    if (sameEmail(targetById.email, source.email)) {
      return { action: 'exists', targetUserId: targetById.$id }
    }
    return { action: 'collision', reason: 'id_taken_by_other' }
  }

  if (targetByEmail) {
    if (source.emailVerification && targetByEmail.emailVerification) {
      return { action: 'merge', targetUserId: targetByEmail.$id }
    }
    return { action: 'collision', reason: 'email_unverified' }
  }

  return { action: 'create' }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Passwort-Hashes (Plan § 3.4)
// ─────────────────────────────────────────────────────────────────────────────

export interface SourceCredentials {
  /** Der HASH, wie ihn die Users-API des Quellprojekts herausgibt. */
  password?: string
  /** `bcrypt` · `argon2` · `scrypt` · `scryptMod` · `md5` · `phpass` · `sha` · `plaintext` */
  hash?: string
  hashOptions?: Record<string, unknown>
}

export type HashPlan =
  /** OTP-only — kein Passwort, `users.create` ohne `password`. */
  | { method: 'create', needs: [] }
  /** Klartext-Passwort (Appwrite-Hash `plaintext`) — `users.create` MIT `password`. */
  | { method: 'create', needs: ['password'] }
  | { method: 'createBcryptUser' | 'createArgon2User' | 'createMD5User' | 'createPHPassUser', needs: ['password'] }
  | { method: 'createSHAUser', needs: ['password'], passwordVersion: string }
  | { method: 'createScryptUser', needs: ['password'], options: ScryptOptions }
  | { method: 'createScryptModifiedUser', needs: ['password'], options: ScryptModifiedOptions }
  /** Verfahren, das die Ziel-Instanz nicht übernehmen kann → Kollisions-Report. */
  | { method: 'unsupported', hash: string }

export interface ScryptOptions {
  passwordSalt: string
  passwordCpu: number
  passwordMemory: number
  passwordParallel: number
  passwordLength: number
}

export interface ScryptModifiedOptions {
  passwordSalt: string
  passwordSaltSeparator: string
  passwordSignerKey: string
}

/**
 * Welchen Users-API-Endpunkt braucht dieses Konto? (Hash-aware wie AH-1.)
 *
 * Konten OHNE `password` brauchen gar nichts — sie melden sich mit einem Code
 * an (bei AH-1 waren das alle zwei). Ein unbekanntes Verfahren wird NICHT
 * geraten: das Konto landet im Kollisions-Report, statt mit einem kaputten
 * Passwort im Ziel zu stehen.
 */
export function hashPlanFor(credentials: SourceCredentials): HashPlan {
  if (!credentials.password) return { method: 'create', needs: [] }
  const options = credentials.hashOptions ?? {}
  switch (credentials.hash) {
    case 'bcrypt': return { method: 'createBcryptUser', needs: ['password'] }
    case 'argon2': return { method: 'createArgon2User', needs: ['password'] }
    case 'md5': return { method: 'createMD5User', needs: ['password'] }
    case 'phpass': return { method: 'createPHPassUser', needs: ['password'] }
    case 'sha': return {
      method: 'createSHAUser',
      needs: ['password'],
      passwordVersion: String(options.type ?? options.version ?? 'sha256'),
    }
    case 'scrypt': return {
      method: 'createScryptUser',
      needs: ['password'],
      options: {
        passwordSalt: String(options.salt ?? ''),
        passwordCpu: Number(options.costCpu ?? options.cpu ?? 0),
        passwordMemory: Number(options.costMemory ?? options.memory ?? 0),
        passwordParallel: Number(options.costParallel ?? options.parallel ?? 0),
        passwordLength: Number(options.length ?? 0),
      },
    }
    case 'scryptMod': return {
      method: 'createScryptModifiedUser',
      needs: ['password'],
      options: {
        passwordSalt: String(options.salt ?? ''),
        passwordSaltSeparator: String(options.saltSeparator ?? ''),
        passwordSignerKey: String(options.signerKey ?? ''),
      },
    }
    case 'plaintext': return { method: 'create', needs: ['password'] }
    default: return { method: 'unsupported', hash: credentials.hash ?? '(leer)' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Row-Permissions umschreiben (Plan § 4.3)
// ─────────────────────────────────────────────────────────────────────────────

export interface PermissionRewriteContext {
  keys: CommunityKeys
  /** alte User-Id → Ziel-Id. Enthält AUCH die Identitäts-Einträge (`id -> id`),
   *  damit ein fehlender Eintrag eindeutig „nicht migriert" heißt und nicht
   *  „unverändert" (Plan § 3.5). */
  mapping: Record<string, string>
  /** `communities.audience === 'public'`. Nur dann bleibt `read("any")` stehen. */
  audiencePublic: boolean
}

export interface PermissionRewriteResult {
  permissions: string[]
  /** `user:<id>`-Rollen ohne Mapping-Eintrag — die Zeile wird trotzdem kopiert,
   *  die Permission zeigt aber ins Leere (bewusst, bis David entscheidet). */
  unmapped: string[]
  /** Rollen, die im Pool keine Bedeutung haben und deshalb WEGFALLEN. */
  dropped: string[]
}

const PERMISSION_PATTERN = /^([a-z]+)\("([^"]+)"\)$/

/**
 * Aus Silo-Permissions werden Pool-Permissions. Rein mechanisch — und deshalb
 * hier als Funktion mit Tests statt als `replace()` in einer Schleife.
 *
 * | Silo heute                              | Pool danach                       |
 * | --------------------------------------- | --------------------------------- |
 * | `read("any")`                           | bleibt (nur bei `audience: public`)|
 * | `read("users")`                         | `read("label:<$id>")`             |
 * | `read("label:admin"/"label:moderator")` | `read("label:mod<$id>")`          |
 * | `update/delete("user:<id>")`            | gemappte Id, sonst unverändert    |
 *
 * Unbekannte Rollen (fremde Labels, Teams) fallen WEG statt mitzureisen: ein
 * Silo-Label bedeutet im geteilten Projekt etwas anderes, und eine zu VIEL
 * vergebene Leseberechtigung ist der teurere Fehler (§ 3.6).
 */
export function rewriteRowPermissions(
  permissions: string[],
  ctx: PermissionRewriteContext,
): PermissionRewriteResult {
  assertCommunityKeys(ctx.keys)
  const memberLabel = memberLabelFor(ctx.keys)
  const moderatorLabel = moderatorLabelFor(ctx.keys)

  const out: string[] = []
  const unmapped: string[] = []
  const dropped: string[] = []
  const seen = new Set<string>()

  const push = (action: string, role: string) => {
    const entry = `${action}("${role}")`
    if (seen.has(entry)) return
    seen.add(entry)
    out.push(entry)
  }

  for (const raw of permissions) {
    const match = PERMISSION_PATTERN.exec(raw.trim())
    if (!match) { dropped.push(raw); continue }
    const action = match[1]!
    const role = match[2]!

    if (role === 'any') {
      // Öffentlich bleibt öffentlich — aber nur, wenn die neue Community es
      // auch ist. Sonst wäre der Umzug eine unangekündigte Veröffentlichung.
      if (ctx.audiencePublic) push(action, 'any')
      else push(action, memberLabel)
      continue
    }

    if (role === 'users') {
      // Im Silo ist das PROJEKT die Grenze, im Pool das Label.
      push(action, memberLabel)
      continue
    }

    if (role === 'guests') {
      push(action, 'guests')
      continue
    }

    if (role.startsWith('user:')) {
      const oldId = role.slice('user:'.length)
      const mapped = ctx.mapping[oldId]
      if (mapped) push(action, `user:${mapped}`)
      else { unmapped.push(oldId); push(action, role) }
      continue
    }

    if (role === 'label:admin' || role === 'label:moderator') {
      push(action, moderatorLabel)
      continue
    }

    dropped.push(raw)
  }

  return { permissions: out, unmapped, dropped }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Welche Tabelle wandert — und welche bewusst nicht
// ─────────────────────────────────────────────────────────────────────────────

export type TablePlanAction =
  /** Zeilen kopieren, Id behalten, `communityId` stempeln, Permissions umschreiben. */
  | 'copy'
  /** Wie `copy`, aber nur wenn der Handle im Ziel noch frei ist (§ 3.7). */
  | 'copy-if-handle-free'
  /** Bleibt im eingefrorenen Projekt zurück. */
  | 'skip'

export interface TablePlanEntry {
  tableId: string
  layer: string
  action: TablePlanAction
  /** Warum. Steht im Inventar-Bericht und im Runbook — ein „skip" ohne Grund
   *  ist beim nächsten Durchlauf nicht mehr nachvollziehbar. */
  reason: string
}

/**
 * Der Tabellen-Plan. `apps/comments` montiert vierzehn Layer, die Instanz trägt
 * also weit mehr als die vier `comments`-Tabellen (Plan § 1.2). Jede Tabelle
 * steht hier mit einer EXPLIZITEN Entscheidung — die Phase `inventory` meldet
 * zusätzlich jede Tabelle der Instanz, die hier FEHLT, damit ein neuer Layer
 * nicht stillschweigend durchrutscht.
 */
export const TABLE_PLAN: readonly TablePlanEntry[] = [
  // ── comments (der Kern des Umzugs) ─────────────────────────────────────────
  { tableId: 'comments', layer: 'comments', action: 'copy', reason: 'Der Inhalt, um den es geht' },
  { tableId: 'comment_votes', layer: 'comments', action: 'copy', reason: 'Stimmen gehören zu ihren Kommentaren' },
  { tableId: 'embed_sites', layer: 'comments', action: 'copy', reason: 'Die echten Einbetter stehen in der DB, nicht in der Config (§ 5.1)' },
  { tableId: 'guest_authors', layer: 'comments', action: 'skip', reason: 'Entscheidung (f): tote Tabelle seit F18, PII ohne Lese-Stelle — bleibt im eingefrorenen Projekt' },

  // ── posts ─────────────────────────────────────────────────────────────────
  { tableId: 'community_posts', layer: 'posts', action: 'copy', reason: 'Beiträge der Community' },
  { tableId: 'post_votes', layer: 'posts', action: 'copy', reason: 'Stimmen zu Beiträgen' },
  { tableId: 'poll_votes', layer: 'posts', action: 'copy', reason: 'Stimmen in Umfragen' },
  { tableId: 'post_categories', layer: 'posts', action: 'copy', reason: 'Kategorien der Beiträge' },
  { tableId: 'post_views', layer: 'posts', action: 'copy', reason: 'Lesezähler je Beitrag' },
  { tableId: 'user_badges', layer: 'posts', action: 'copy', reason: 'Abzeichen hängen an Konten, die mitziehen' },
  { tableId: 'member_counters', layer: 'posts', action: 'copy', reason: 'Beitrags-Zähler je Mitglied' },

  // ── moderation / events / courses / media / messages / activity ───────────
  { tableId: 'reports', layer: 'moderation', action: 'copy', reason: 'Offene Meldungen dürfen nicht verschwinden' },
  { tableId: 'events', layer: 'events', action: 'copy', reason: 'Termine der Community' },
  { tableId: 'event_rsvps', layer: 'events', action: 'copy', reason: 'Zu- und Absagen zu Terminen' },
  { tableId: 'event_votes', layer: 'events', action: 'copy', reason: 'Abstimmungen über Termine' },
  { tableId: 'event_tickets', layer: 'events', action: 'skip', reason: 'Entscheidung (9): bezahlte Tickets sind Stripe-TESTMODUS und im Pool ungebaut (F7/Connect). Vor Phase 4 messen; mit --tables event_tickets bewusst überstimmbar' },
  { tableId: 'courses', layer: 'courses', action: 'copy', reason: 'Kurse der Community' },
  { tableId: 'lessons', layer: 'courses', action: 'copy', reason: 'Lektionen der Kurse' },
  { tableId: 'enrollments', layer: 'courses', action: 'copy', reason: 'Einschreibungen in Kurse' },
  { tableId: 'lesson_progress', layer: 'courses', action: 'copy', reason: 'Lernfortschritt je Konto' },
  { tableId: 'media_items', layer: 'media', action: 'copy', reason: 'Medien-Register (die DATEIEN kopiert dieses Werkzeug NICHT — s. Kopf von f3-comments-to-pool.mjs)' },
  { tableId: 'conversations', layer: 'messages', action: 'copy', reason: 'Unterhaltungen (Direktnachrichten)' },
  { tableId: 'conversation_members', layer: 'messages', action: 'copy', reason: 'Teilnehmer der Unterhaltungen' },
  { tableId: 'messages', layer: 'messages', action: 'copy', reason: 'Die Nachrichten selbst' },
  { tableId: 'message_blocks', layer: 'messages', action: 'copy', reason: 'Blockierungen zwischen Konten' },
  { tableId: 'message_settings', layer: 'messages', action: 'copy', reason: 'Nachrichten-Einstellungen je Konto' },
  { tableId: 'activities', layer: 'system', action: 'copy', reason: 'Der Aktivitäts-Feed der Community' },

  // ── system: Ablage-Stempel und Register ───────────────────────────────────
  {
    tableId: 'notifications',
    layer: 'system',
    action: 'copy',
    reason: 'Glocken-Inhalt. ACHTUNG: `notifications.communityId` trägt denselben t-Stempel (C15) — im Silo stand dort \'\', danach die Community',
  },
  { tableId: 'community_handles', layer: 'system', action: 'copy', reason: '§ 3.7: wandert VOLLSTÄNDIG inkl. Historien-Zeilen, sonst zeigen alte Erwähnungen ins Leere' },
  { tableId: 'account_handles', layer: 'system', action: 'copy-if-handle-free', reason: '§ 3.7 + AH-7: global eindeutig — ist der Handle im Ziel vergeben, bekommt der Zuziehende KEINEN Eintrag und wählt selbst neu (nie eine automatische Umbenennung)' },
  { tableId: 'analytics_settings', layer: 'analytics', action: 'copy', reason: 'Analytics-Konfiguration der Community (Plausible-Entscheidung selbst gehört in Phase 8)' },

  // ── bewusst zurückgelassen ────────────────────────────────────────────────
  {
    tableId: 'app_config',
    layer: 'system',
    action: 'skip',
    reason: 'INSTANZ-Einstellung (EINE Row je Projekt). Kopieren würde die Einstellungen des account-Projekts überschreiben — der teuerste denkbare Fehler dieses Laufs',
  },
  { tableId: 'app_secrets', layer: 'system', action: 'skip', reason: 'Geheimnisse der alten Instanz — sie werden in Phase 8 widerrufen, nicht umgezogen' },
  { tableId: 'audit_logs', layer: 'system', action: 'skip', reason: 'Protokoll der alten INSTANZ; bleibt beim eingefrorenen Projekt' },
  { tableId: 'custom_themes', layer: 'system', action: 'skip', reason: 'Projekt-weit mit Table-read(any) — im geteilten Projekt sähe JEDE fremde Community das Silo-Theme. Community-Farbe setzt Phase 1 über communities.theme/variant/neutral' },
  { tableId: 'custom_fonts', layer: 'system', action: 'skip', reason: 'Wie custom_themes; die WOFF2 liegen zudem im Bucket, den dieses Werkzeug nicht anfasst' },
  { tableId: 'community_branding', layer: 'system', action: 'skip', reason: 'SPIEGEL (D6), rowId = communities.$id — wird vom nächsten Branding-PATCH selbst geschrieben' },
  { tableId: 'billing_customers', layer: 'billing', action: 'skip', reason: 'Entscheidung (9): Stripe-TESTMODUS, ersatzlos; billing ist in apps/platform nicht montiert' },
  { tableId: 'billing_subscriptions', layer: 'billing', action: 'skip', reason: 'Wie billing_customers' },
  { tableId: 'stripe_settings', layer: 'billing', action: 'skip', reason: 'Wie billing_customers — die Keys werden in Phase 8 widerrufen' },
  // Beim Inventar-Lauf 2026-08-12 gefunden — fünf Tabellen ohne Plan-Zeile,
  // alle BETREIBER-Werkzeuge der alten Silo-Instanz, kein Community-Inhalt:
  // Tickets (Board des Betreibers) und Feedback (seit E10 zentral im Control
  // Plane, control-032) gehören nicht auf einen Mandanten-Host (N7) — sie
  // bleiben, wie audit_logs, beim eingefrorenen Projekt.
  { tableId: 'feedback', layer: 'feedback', action: 'skip', reason: 'Betreiber-Feedback der Alt-Instanz — zentral seit E10 im Control Plane' },
  { tableId: 'tickets', layer: 'tickets', action: 'skip', reason: 'Betreiber-Board der Alt-Instanz (N7) — bleibt beim eingefrorenen Projekt' },
  { tableId: 'ticket_lists', layer: 'tickets', action: 'skip', reason: 'Wie tickets' },
  { tableId: 'ticket_watchers', layer: 'tickets', action: 'skip', reason: 'Wie tickets' },
  { tableId: 'ticket_files', layer: 'tickets', action: 'skip', reason: 'Wie tickets' },
  { tableId: 'changelog', layer: 'admin', action: 'skip', reason: 'BETREIBER-Inhalt (N7) — gehört nicht auf einen Mandanten-Host' },
]

const PLAN_BY_TABLE = new Map(TABLE_PLAN.map(entry => [entry.tableId, entry]))

export function tablePlanFor(tableId: string): TablePlanEntry | null {
  return PLAN_BY_TABLE.get(tableId) ?? null
}

/** Tabellen, die kopiert werden — in Plan-Reihenfolge. */
export function tablesToCopy(): TablePlanEntry[] {
  return TABLE_PLAN.filter(entry => entry.action !== 'skip')
}

/**
 * Tabellen, die in der Instanz stehen, aber in keiner Plan-Zeile — der
 * Wächter gegen einen neuen Layer, der stillschweigend nicht mitzieht.
 */
export function unplannedTables(tableIdsInInstance: readonly string[]): string[] {
  return tableIdsInInstance.filter(id => !PLAN_BY_TABLE.has(id)).sort()
}

// ─────────────────────────────────────────────────────────────────────────────
// 6 · Die communities-Row (Plan § 7 Phase 1, Entscheidung 2 + 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Die Feldmenge ist 1:1 an `packages/control/server/api/control/tenants/
 * index.post.ts` genagelt (der Test hält sie dagegen). Warum am Schema vorbei:
 *
 * `comments` steht in `RESERVED_SUBDOMAINS` (`packages/control/schemas/tenant.ts`)
 * und zusätzlich in der Betreiber-Zusatzliste `reserved_names` (control-027).
 * Die Route weist `comments.pukalani.app` deshalb ab — sie SOLL das, der Name
 * bleibt auch nach dem Umzug gesperrt (er ist dann VERGEBEN statt nur
 * gesperrt, dieselbe Logik wie bei `account`). Der Weg über die Route wäre
 * „Name kurz von der Sperrliste nehmen, zwei control-Deploys, wieder
 * drauf" — zwei Deploys an einer Sicherheitsliste, und AH-5 hat gezeigt, wie
 * so eine Streichung noch am selben Abend zurückgenommen werden muss.
 *
 * Was die Route sonst schützt, ist hier nicht verloren: die Eindeutigkeit des
 * Hosts hängt am UNIQUE-Index `uq_host` der Tabelle, nicht am Zod-Schema. Der
 * Index ist die Wahrheit und greift auch für diesen Weg.
 */
export interface CommunityRowInput {
  name: string
  host: string
  projectId: string
  tenantId: string
  /** Entscheidung (3): `pro` — die einzige Stufe, auf der alle heute montierten
   *  Produkte sichtbar bleiben (events/courses sind pro-Gates). */
  plan: 'basic' | 'personal' | 'pro'
  /** Entscheidung (3): KEIN Stripe-Abo, aber `trialEndsAt` weit in der Zukunft —
   *  ohne das sperrt der F49-trialSweep die Community binnen einer Stunde
   *  auf NUR-LESEND (M13-`billing`). */
  trialEndsAt: string
  theme: string
  variant: string
  neutral: string
}

export function communityRowData(input: CommunityRowInput): Record<string, unknown> {
  return {
    name: input.name,
    host: input.host,
    mode: 'pool',
    projectId: input.projectId,
    tenantId: input.tenantId,
    status: 'active',
    wave: 'stable',
    plan: input.plan,
    theme: input.theme,
    variant: input.variant,
    neutral: input.neutral,
    // Entscheidung (7): das heutige Verhalten des Silos. `members` bräche das
    // Embed-Produkt (Gäste sähen keine Kommentare mehr).
    audience: 'public',
    trialEndsAt: input.trialEndsAt,
    profile: '',
    inviteCodeId: '',
    openRegistration: true,
    // Entscheidung (3): kein Abo. Der Community-Checkout füllt das beim ersten Kauf.
    stripeCustomerId: '',
    stripeSubscriptionId: '',
    billingStatus: '',
    suspension: '',
    suspensionReason: '',
    suspendedAt: null,
    pastDueSince: null,
    customDomain: '',
    customDomainStatus: 'none',
    customDomainToken: '',
    customDomainError: '',
    customDomainVerifiedAt: null,
    customDomainActivatedAt: null,
  }
}

/** Die Owner-Mitgliedschaft — Feldmenge aus `onboardingProvision.ts`.
 *  `communityId` ist hier `communities.$id` (NICHT der t-Stempel!). */
export function ownerMembershipData(params: {
  keys: CommunityKeys
  runtimeProjectId: string
  runtimeUserId: string
  email: string
}): Record<string, unknown> {
  assertCommunityKeys(params.keys)
  return {
    communityId: params.keys.rowId,
    runtimeProjectId: params.runtimeProjectId,
    runtimeUserId: params.runtimeUserId,
    role: 'owner',
    status: 'active',
    email: params.email,
  }
}

/** Mitgliedschafts-Rolle aus dem alten INSTANZ-Label (Plan § 3.6). */
export function roleFromInstanceLabels(labels: readonly string[]): 'admin' | 'moderator' | 'viewer' {
  if (labels.includes('admin')) return 'admin'
  if (labels.includes('moderator')) return 'moderator'
  return 'viewer'
}
