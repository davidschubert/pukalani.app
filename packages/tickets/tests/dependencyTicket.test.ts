import { describe, expect, it } from 'vitest'
import {
  dependencyTicketDescription,
  dependencyTicketKey,
  dependencyTicketTitle,
  type DependencyTicketInput,
} from '../shared/dependencyTicket'

/**
 * Der TEXT des Update-Prüf-Tickets ist das Produkt (die Route legt nur eine
 * Zeile an). Zwei Dinge nagelt diese Suite fest:
 *
 *  1. Der Dedup-Schlüssel — an ihm hängt die Doppel-Anlage-Sperre in
 *     `server/utils/ticketIngest.ts` (Spalte `feedbackId`). Ändert sich sein
 *     Format still, legt derselbe Knopf plötzlich zwei Karten an.
 *  2. Die Kopplungs-Hinweise JE ART — inklusive GEGENPROBE: die Fallen des
 *     einen kind dürfen im anderen nicht auftauchen. Ohne die Gegenprobe wäre
 *     ein „alles in einen Topf"-Text genauso grün.
 */

const pkg: DependencyTicketInput = { kind: 'package', name: 'nuxt', from: '4.5.1', to: '4.5.2' }
const appwrite: DependencyTicketInput = { kind: 'appwrite', name: 'appwrite-server', from: '1.9.6', to: '1.10.0' }

describe('dependencyTicketKey', () => {
  it('trägt das dep:-Präfix und die ZIEL-Version', () => {
    expect(dependencyTicketKey(pkg)).toBe('dep:nuxt@4.5.2')
    expect(dependencyTicketKey(appwrite)).toBe('dep:appwrite-server@1.10.0')
  })

  it('eine neue Zielversion ist ein neuer Schlüssel (und damit ein neues Ticket)', () => {
    expect(dependencyTicketKey({ ...pkg, to: '4.6.0' })).not.toBe(dependencyTicketKey(pkg))
  })
})

describe('dependencyTicketTitle', () => {
  it('nennt Paket, Ausgangs- und Zielversion', () => {
    const title = dependencyTicketTitle(pkg)
    expect(title).toContain('nuxt')
    expect(title).toContain('4.5.1')
    expect(title).toContain('4.5.2')
  })

  it('der Appwrite-SERVER heißt nicht wie das npm-Paket', () => {
    expect(dependencyTicketTitle(appwrite)).toContain('Appwrite-Server')
  })
})

describe('dependencyTicketDescription', () => {
  it('stellt den Fragenkatalog', () => {
    for (const input of [pkg, appwrite]) {
      const text = dependencyTicketDescription(input)
      expect(text).toContain('Vor- und Nachteile')
      expect(text).toContain('Breaking')
      expect(text).toContain('kaputt')
      expect(text).toContain('gekoppelte Pakete')
    }
  })

  it('nennt Ausgangs- und Zielversion', () => {
    const text = dependencyTicketDescription(pkg)
    expect(text).toContain('4.5.1')
    expect(text).toContain('4.5.2')
  })

  it('kein ##-Heading — der Markdown-Sink rendert keine', () => {
    for (const input of [pkg, appwrite]) {
      expect(dependencyTicketDescription(input)).not.toMatch(/^#{1,6} /m)
    }
  })

  it('Paket: die Kopplungen des Monorepos stehen drin', () => {
    const text = dependencyTicketDescription(pkg)
    expect(text).toContain('@nuxtjs/i18n')
    expect(text).toContain('@pinia/nuxt')
    expect(text).toContain('check:single-copy')
    expect(text).toContain('pnpm-workspace.yaml')
  })

  it('Appwrite: Betriebs-Fallen statt Paket-Kopplungen', () => {
    const text = dependencyTicketDescription(appwrite)
    expect(text).toContain('registers.php')
    expect(text).toContain('SMTP')
    expect(text).toContain('appwrite-realtime')
  })

  it('GEGENPROBE: jede Art trägt NUR ihre eigenen Fallen', () => {
    const packageText = dependencyTicketDescription(pkg)
    expect(packageText).not.toContain('registers.php')
    expect(packageText).not.toContain('appwrite-realtime')

    const appwriteText = dependencyTicketDescription(appwrite)
    expect(appwriteText).not.toContain('@pinia/nuxt')
    expect(appwriteText).not.toContain('check:single-copy')
  })
})
