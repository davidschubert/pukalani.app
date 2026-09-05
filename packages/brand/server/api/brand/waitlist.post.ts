import type { H3Event } from 'h3'
import { ID, Query } from 'node-appwrite'
import { type BrandWaitlistInput, createBrandWaitlistSchema } from '../../../schemas/brandWaitlist'
import type { BrandWaitlistResponse } from '../../../shared/types/brand'
import { BRAND_WAITLIST_TABLE, type BrandWaitlistRow, brandDb } from '../../utils/brandStore'

/**
 * „FRÜHZUGANG ANFRAGEN" — die DRITTE öffentliche Route des Layers (neben der
 * Code-Prüfung und dem token-geschützten Share-GET), und die einzige, die
 * ohne jeden Beweis SCHREIBT.
 *
 * ── WARUM SIE ÖFFENTLICH SEIN MUSS ────────────────────────────────────────
 * Sie ist die Antwort auf die geschlossene Beta: wer keinen Einladungscode hat,
 * hatte bisher keinen Weg, etwas zu hinterlassen. `requireBrandAccess` davor
 * wäre ein Zirkel — die Route existiert für genau die Menschen, die das Gate
 * nicht passieren.
 *
 * ── VIER SICHERUNGEN STATT EINES GATES ────────────────────────────────────
 * (1) Die DROSSEL in `packages/core/server/middleware/05.rate-limit.ts`
 *     (`brand:waitlist`, 5/min je IP) — sie zählt VOR jedem Appwrite-Ruf.
 * (2) Der HONIGTOPF `hp`: gefüllt ⇒ dieselbe 200-Antwort wie sonst, nur ohne
 *     Zeile. Ein 400 oder eine andere Antwortform wäre eine Rückmeldung an den
 *     Bot, an der er seinen Schreiber verbessert.
 * (3) Der UNIQUE-Index auf `emailLower` (brand-012): auch wenn zwei Anfragen
 *     gleichzeitig ankommen, entsteht höchstens eine Zeile.
 * (4) Das Schema deckelt JEDES Feld — eine offene Schreibroute ohne Längen ist
 *     ein Speicher-Angebot.
 *
 * ── PERSONENBEZOGENE DATEN OHNE KONTO — BEKANNTE GRENZE ───────────────────
 * Eine Zeile trägt eine Adresse und optional Name/Firma, aber keine `userId`;
 * sie entsteht, bevor es ein Konto gibt. `registerUserDataContributor`
 * (core-Vertrag für GDPR-Export und -Löschung) greift deshalb NICHT — er hängt
 * an einer userId, die es hier nicht gibt. Löschung auf Zuruf ist heute ein
 * Handgriff in der Appwrite-Konsole (Zeile über `emailLower`). Wer die
 * Warteliste später an Konten koppelt, erbt diese Aufgabe; dieselbe Notiz steht
 * im Kopf der Migration.
 *
 * ── DIE ADRESSE STEHT NIE IM LOG ──────────────────────────────────────────
 * Weder im Erfolgs- noch im Fehlerfall. Das Log sagt `source`, `locale` und ob
 * es eine Dublette war; im Ausfall-Fall zusätzlich die MASKIERTE Adresse
 * (`x***@domain`, dieselbe Form wie in `core/server/utils/mailer.ts`) — genug,
 * um einer Meldung „ich komme nicht rein" nachzugehen, ohne eine
 * Empfängerliste ins Log zu schreiben.
 */

/** `x***@domain` — die Maskierung aus `mailer.ts`, hier für das Log. */
function maskEmail(value: string): string {
  return value.replace(/(.).*(@.*)/, '$1***$2')
}

export default defineEventHandler(async (event): Promise<BrandWaitlistResponse> => {
  const body = await readValidatedBody(event, createBrandWaitlistSchema().parse)

  // Der Honigtopf. Die Antwort ist ununterscheidbar von der echten — nur dass
  // nichts geschrieben und niemand benachrichtigt wird.
  if (body.hp) {
    logEvent('info', 'brand.waitlist_honeypot', { source: body.source, locale: body.locale })
    return { ok: true, duplicate: false }
  }

  const { tablesDB, databaseId } = brandDb(event)

  // Ohne Vorbelegung: der `catch` wirft, hinter dem Block ist der Wert also
  // immer gesetzt — ein `false` davor wäre ein Wert, den nie jemand liest.
  let duplicate: boolean
  try {
    // Erst nachsehen: eine zweite Anfrage derselben Person soll die erste NICHT
    // überschreiben — dort steht womöglich schon eine Betreiber-Notiz oder ein
    // `status: 'invited'`. Der UNIQUE-Index bleibt die Garantie darunter, diese
    // Abfrage ist nur der freundliche Weg dorthin.
    const existing = await tablesDB.listRows<BrandWaitlistRow>({
      databaseId,
      tableId: BRAND_WAITLIST_TABLE,
      queries: [Query.equal('emailLower', body.email), Query.limit(1)],
    })
    duplicate = existing.rows.length > 0

    if (!duplicate) {
      await tablesDB.createRow({
        databaseId,
        tableId: BRAND_WAITLIST_TABLE,
        rowId: ID.unique(),
        data: {
          // `email` ist vom Schema schon getrimmt und kleingeschrieben — der
          // Vergleichswert und die Anrede sind hier also derselbe String. Beide
          // Spalten stehen trotzdem EXPLIZIT (CLAUDE.md: `createRow` verlangt
          // jede Spalte), damit ein späterer Wechsel zur Original-Schreibweise
          // eine Entscheidung an dieser Stelle ist und kein stiller Default.
          emailLower: body.email,
          email: body.email,
          name: body.name,
          company: body.company,
          website: body.website,
          locale: body.locale,
          source: body.source,
          status: 'new',
          note: '',
        },
      })
    }
  }
  catch (error) {
    // Fehlende Tabelle (Migration nicht gelaufen) oder eine kranke Appwrite —
    // beides ist für den Menschen davor dasselbe: „gerade nicht möglich".
    // `code` reist über den zentralen Handler als `reason` ins Envelope, damit
    // das Formular „später nochmal" sagen kann statt „ungültige Eingabe".
    logEvent('warn', 'brand.waitlist_unavailable', {
      source: body.source,
      locale: body.locale,
      email: maskEmail(body.email),
      message: error instanceof Error ? error.message : 'unknown',
    })
    throw createError({
      status: 503,
      statusText: 'Waitlist unavailable',
      data: { code: 'waitlist_unavailable' },
    })
  }

  // Die Betreiber-Mail steht AUSSERHALB des `try` — sonst würde ein
  // SMTP-Aussetzer aus einer gespeicherten Anfrage ein 503 machen, und der
  // Mensch trüge sich ein zweites Mal ein. Sie ist fail-soft (s. u.).
  if (!duplicate) await notifyOperator(event, body)

  logEvent('info', 'brand.waitlist_joined', {
    source: body.source,
    locale: body.locale,
    duplicate,
  })
  return { ok: true, duplicate }
})

/**
 * Die Anfrage landet als Mail beim Betreiber — sonst müsste er die Tabelle
 * beobachten, und eine Warteliste, die niemand liest, ist keine.
 *
 * Die Adresse kommt aus `pukalani.brand.waitlistNotify`; LEER heißt „keine
 * Mail" und ist der Default (ein erfundener Empfänger wäre eine Zustellung ins
 * Nichts). Ein Fehler ändert die Antwort NIE — die Zeile steht bereits, und der
 * Mensch davor kann für ein SMTP-Problem nichts.
 */
async function notifyOperator(event: H3Event, body: BrandWaitlistInput): Promise<void> {
  const appConfig = useAppConfig() as { pukalani?: { brand?: { waitlistNotify?: string } } }
  const to = (appConfig.pukalani?.brand?.waitlistNotify ?? '').trim()
  if (!to) return

  const lines = [
    `E-Mail:  ${body.email}`,
    `Name:    ${body.name || '—'}`,
    `Firma:   ${body.company || '—'}`,
    `Website: ${body.website || '—'}`,
    `Sprache: ${body.locale}`,
    `Seite:   ${body.source || '—'}`,
  ]
  await sendMail(event, {
    to,
    subject: `Neue Warteliste-Anfrage: ${body.company || body.email}`,
    text: `Jemand möchte Frühzugang zu branding.supply.\n\n${lines.join('\n')}\n`,
  }).catch(() => false)
}
