import { evaluateBrandInvite } from '../utils/brandInvites'

/**
 * DIE ZULASSUNG ZUR KONTOANLAGE — der brand-Layer verdrahtet seine Antwort an
 * die generische Core-Naht (`registerSignupAdmissionProvider`).
 *
 * ── WARUM DIESE NAHT ÜBERHAUPT EXISTIERT ──────────────────────────────────
 * Der Core darf `brand` nicht kennen (A14), und KEIN bestehender Mechanismus
 * trug den Fall: `invite_codes` schaltet Community-GRÜNDUNG frei, `inviteToken`
 * im Signup gehört zu `community_invites`, und `registrationEnabled` lehnt VOR
 * jeder Invite-Prüfung ab (Plan §6). Also fragt der Core, und dieser Layer
 * antwortet — dasselbe Registry-Muster wie `registerCommunityJoinHandler`.
 *
 * ── HIER WIRD NICHTS VERBRAUCHT ───────────────────────────────────────────
 * Das ist die wichtigste Zeile dieser Datei. Der Provider sagt NUR, ob diese
 * Anlage die geschlossene Registrierung passieren darf; die Einladung wird erst
 * NACH der E-Mail-Verifizierung eingelöst, über `POST /api/brand/invite/redeem`
 * (Plan §6: „ein unverifiziertes Konto hat den Code nicht verbrannt"). Würde
 * hier gestempelt, verbrennte jede angefangene Registrierung einen Code — und
 * eine falsch getippte Adresse wäre eine verlorene Einladung.
 *
 * ── ZWEI GRENZEN, DIE NICHT VERSCHIEBBAR SIND ─────────────────────────────
 * (1) `maintenanceMode` ist durch KEINE Einladung umgehbar — die Naht kennt ihn
 *     gar nicht, der Aufrufer prüft ihn vorher und unabhängig.
 * (2) Sie übersteuert AUSSCHLIESSLICH `registrationEnabled`, nie eine andere
 *     Sperre. Beides steht im Kopf von `core/server/utils/signupAdmission.ts`;
 *     hier steht es noch einmal, weil man diese Datei liest, wenn man die Regel
 *     ändern will.
 *
 * ── FAIL-CLOSED ───────────────────────────────────────────────────────────
 * Ohne Code, bei einem Lesefehler, bei einem Modus ausser `invite`: `false`.
 * Der Core behandelt eine Ausnahme ebenso als Nein — geworfen wird trotzdem
 * nicht, damit die Ablehnung für jeden Grund GLEICH aussieht und die
 * Laufzeit nichts verrät.
 */
export default defineNitroPlugin(() => {
  registerSignupAdmissionProvider(async (event, request) => {
    if (!request.inviteCode) return { opensRegistration: false }
    try {
      // Die Adresse kommt aus dem Signup-Rumpf und ist NOCH NICHT verifiziert —
      // sie taugt trotzdem für die Bindung: ein Code, der an eine andere
      // Adresse ging, soll diese Anlage nicht öffnen. Bewiesen wird die
      // Adresse später, und erst dann entsteht Zugang.
      const { valid } = await evaluateBrandInvite(event, request.inviteCode, request.email.toLowerCase())
      return { opensRegistration: valid }
    }
    catch {
      return { opensRegistration: false }
    }
  })
})
