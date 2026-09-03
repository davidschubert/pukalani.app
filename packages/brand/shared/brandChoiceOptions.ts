/**
 * DIE LEGALE MENGE EINER AUSWAHL — die eine Stelle, an der steht, was ein
 * `choice`-Slot überhaupt enthalten darf (P3.1).
 *
 * ── WARUM ES DIESE DATEI GIBT ─────────────────────────────────────────────
 * Bis P3.1 stand die Antwort auf „welche Optionen hat dieser Slot" NIRGENDS:
 * die Registry kennt nur `kind: 'choice'` und `editor: 'chips' | 'cards'`, der
 * i18n-Katalog trägt die FRAGE (`brand.q.b2.model`) und den Lehrblock, und die
 * Werkstatt rendert für `chips`/`cards` heute noch ein gewöhnliches Textfeld.
 * Ein Generator, der eine Auswahl entwerfen soll, hätte sich die Optionen also
 * selbst ausdenken müssen — und ein erfundenes fünftes Architektur-Modell im
 * Brand-Dokument ist genau die Sorte Schaden, die niemand mehr zurückrechnet.
 *
 * ── ZWEI ARTEN VON AUSWAHL, UND DAS IST KEIN VERSEHEN ─────────────────────
 * `b2.model` ist GESCHLOSSEN: die vier Architektur-Modelle stehen wörtlich in
 * der Content-Spec §5a und in der Infografik §12.3 (Branded House · Sub-Brands ·
 * Endorsed · House of Brands). Mehr gibt es nicht, und was nicht dazugehört, ist
 * falsch.
 *
 * `b.positioningCategory` ist OFFEN: „In welcher Kategorie spielt ihr?" hat
 * keine Liste, aus der man wählt — die Kategorie gehört DIESER Marke („Software
 * agency for online shops"), und eine Taxonomie zu erfinden, aus der George
 * wählen MUSS, hiesse den Menschen in ein Raster zu zwingen, das aus diesem
 * Projekt käme und nicht aus seinem Markt. Geprüft wird deshalb die FORM (eine
 * Zeile, wenige Wörter, kein Satz) — dieselbe Regel, die `a.category` schon in
 * seiner Instruktion trägt („at most five words").
 *
 * Beide Arten enden bei einem Verstoss GLEICH: der Lauf wird eine RÜCKFRAGE
 * (`outcome: 'question'`), nie ein kaputter Entwurf. Ein Feld, das ein
 * Auswahl-Element werden soll, darf keinen Absatz enthalten — und ein Modell,
 * das die Menge verfehlt hat, hat eher zu wenig Material als zu wenig Willen.
 *
 * ── DIE RÜCKFRAGE STEHT HIER UND NICHT IM i18n-KATALOG ────────────────────
 * Sie wird im GENERATOR gebraucht (Server, ohne vue-i18n) und landet als
 * `brand_messages`-Zeile im Verlauf — sie wird also GESPEICHERT, nicht aus einem
 * Schlüssel gerendert. Derselbe Fall wie `advisorOpenersFor` in
 * `brandAdvisors.ts`, und dieselbe Auflösung: zwei kurze Sätze je Sprache,
 * neben der Regel, die sie auslöst.
 *
 * DIESE DATEI IST PUR: kein i18n, kein H3, kein Appwrite.
 */

/** Eine legale Option einer GESCHLOSSENEN Auswahl. */
export interface BrandChoiceOption {
  /**
   * Der GESPEICHERTE Wert — stabil, sprachneutral, nie übersetzt. Er steht in
   * `brand_steps.slots` und ist damit dieselbe Art Zusage wie eine Slot-Id.
   */
  readonly id: string
  /** Wie die Option im Prompt heisst (englisch, wie der Rest des Prompt-Kerns). */
  readonly label: string
  /** Ein Halbsatz Wirkung — er steht im Prompt neben dem Namen. */
  readonly hint: string
  /**
   * WIE DIE OPTION DEM MENSCHEN HEISST, je Sprache der Oberfläche (P4).
   *
   * Sie steht HIER und nicht nur im i18n-Katalog, weil die Auflösung eines
   * GESPEICHERTEN Wertes (`brandChoiceDisplayLabel`) pur bleiben muss: sie
   * läuft in Log-Karten und Bühnen-Modulen, aber auch dort, wo es kein
   * vue-i18n gibt. Der Katalog trägt dieselben Namen — dass beide nicht
   * auseinanderlaufen, nagelt `brandChoiceOptions.test.ts` fest.
   *
   * Die vier Modell-Namen sind EIGENNAMEN (wie die Theme-Namen im Core), de
   * und en sind heute deshalb wörtlich gleich. Das Feld ist trotzdem
   * zweisprachig: ein künftiger geschlossener Vertrag („Ja"/„Nein") wäre es
   * nicht, und ein einsprachiges Feld hätte ihn still falsch beschriftet.
   */
  readonly display: { readonly de: string, readonly en: string }
  /**
   * Die WURZEL der Karten-Copy im i18n-Katalog (`.label`, `.hint`,
   * `.example`). Sie steht ausgeschrieben da und wird NICHT aus der Id
   * gerechnet: die Ids tragen Bindestriche, ein Schlüssel-Pfad verträgt sie
   * schlecht, und eine versteckte Umwandlung wäre eine Kopplung, die kein
   * Test sieht.
   */
  readonly copyKey: string
}

/**
 * DIE VIER ARCHITEKTUR-MODELLE (Content-Spec §5a + Infografik §12.3).
 *
 * Die Beispiele sind dieselben wie in der Infografik — ein Modell, das im
 * Prompt andere Beispiele sieht als der Mensch in der Grafik, erklärt ihm
 * hinterher etwas anderes, als er gelesen hat.
 */
export const BRAND_ARCHITECTURE_MODELS: readonly BrandChoiceOption[] = [
  {
    id: 'branded-house',
    label: 'Branded House',
    hint: 'one brand carries everything; the products are named after it (Apple)',
    display: { de: 'Branded House', en: 'Branded House' },
    copyKey: 'brand.choice.model.brandedHouse',
  },
  {
    id: 'sub-brands',
    label: 'Sub-Brands',
    hint: 'products carry a name of their own NEXT to the main brand (FedEx Express)',
    display: { de: 'Sub-Brands', en: 'Sub-Brands' },
    copyKey: 'brand.choice.model.subBrands',
  },
  {
    id: 'endorsed',
    label: 'Endorsed Brands',
    hint: 'products stand on their own and name who backs them ("by Marriott")',
    display: { de: 'Endorsed Brands', en: 'Endorsed Brands' },
    copyKey: 'brand.choice.model.endorsed',
  },
  {
    id: 'house-of-brands',
    label: 'House of Brands',
    hint: 'the brands stand alone, the parent stays invisible (P&G)',
    display: { de: 'House of Brands', en: 'House of Brands' },
    copyKey: 'brand.choice.model.houseOfBrands',
  },
]

/** Zweisprachige Rückfrage — s. Kopf, warum sie nicht im i18n-Katalog steht. */
export interface BrandChoiceFallbackQuestion {
  readonly de: string
  readonly en: string
}

export type BrandChoiceContract =
  | {
    readonly slotId: string
    readonly kind: 'closed'
    readonly options: readonly BrandChoiceOption[]
    readonly fallbackQuestion: BrandChoiceFallbackQuestion
  }
  | {
    readonly slotId: string
    readonly kind: 'open'
    /** Höchstens so viele Wörter — eine Kategorie ist ein Etikett, kein Satz. */
    readonly maxWords: number
    readonly fallbackQuestion: BrandChoiceFallbackQuestion
  }

const CONTRACTS: readonly BrandChoiceContract[] = [
  {
    slotId: 'b.positioningCategory',
    kind: 'open',
    // Fünf Wörter sind die Zusage von `a.category`; sechs lassen einem
    // deutschen Kompositum-Ersatz („Agentur für kleine Online-Shops") Luft,
    // ohne dass ein Satz durchrutscht.
    maxWords: 6,
    fallbackQuestion: {
      de: 'Aus dem, was ich habe, bekomme ich noch keine saubere Kategorie. '
        + 'Sagt es mir in höchstens fünf Wörtern: Als was würdet ihr gesucht werden?',
      en: 'From what I have, I cannot pin down a clean category yet. '
        + 'In five words or fewer: what would people search for to find you?',
    },
  },
  {
    slotId: 'b2.model',
    kind: 'closed',
    options: BRAND_ARCHITECTURE_MODELS,
    fallbackQuestion: {
      de: 'Ich kann daraus noch nicht genau EIN Architektur-Modell ableiten. '
        + 'Eine Frage dazu: Tragen eure weiteren Angebote heute euren Markennamen — oder eigene Namen?',
      en: 'I cannot pin this down to exactly ONE architecture model yet. '
        + 'One question: do your other offerings carry your brand name today — or names of their own?',
    },
  },
]

const CONTRACTS_BY_SLOT = new Map<string, BrandChoiceContract>(
  CONTRACTS.map(contract => [contract.slotId, contract]),
)

/** `null` = dieser Slot ist keine geregelte Auswahl (dann gilt nur `maxLength`). */
export function brandChoiceContract(slotId: string): BrandChoiceContract | null {
  return CONTRACTS_BY_SLOT.get(slotId) ?? null
}

/**
 * DIE REGEL FÜR DEN PROMPT — englisch, wörtlich in die Slot-Instruktion.
 *
 * Bei der geschlossenen Auswahl nennt sie die Menge EXPLIZIT (Id, Name,
 * Halbsatz Wirkung) und sagt, dass genau eine Id im Feld steht. Ein Prompt, der
 * „choose one of the common models" sagt, bekommt „Hybrid" zurück.
 */
export function brandChoicePromptRule(contract: BrandChoiceContract): string[] {
  if (contract.kind === 'open') {
    return [
      `The field value is a CATEGORY LABEL, not a sentence: one line, at most ${contract.maxWords} words, `
      + 'no full stop, no explanation. The explanation belongs in the BASIS line of your turn.',
    ]
  }
  return [
    'The field value is EXACTLY ONE of these ids, written on a single line and nothing else:',
    ...contract.options.map(option => `  ${option.id} = ${option.label} — ${option.hint}`),
    'Do not invent a fifth model, do not combine two, do not write a "hybrid". Why you chose it and what '
    + 'it costs them belongs in the BASIS line of your turn, never in the field.',
  ]
}

export type BrandChoiceViolation = 'not_an_option' | 'not_a_label'

export type BrandChoiceCheck =
  | { readonly ok: true, readonly value: string }
  | { readonly ok: false, readonly violation: BrandChoiceViolation }

/** Zeilenumbrüche, Aufzählungszeichen und Anführungszeichen weg — was bleibt, wird geprüft. */
function tidy(draft: string): string {
  return draft
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/^["'„»]+|["'“«]+$/g, '')
    .trim()
}

/**
 * HÄLT DIESER ENTWURF SEINEN AUSWAHL-VERTRAG EIN?
 *
 * NACHSICHTIG BEIM LESEN, STRENG BEIM SPEICHERN: eine geschlossene Auswahl darf
 * das Modell mit der Id ODER mit dem Namen beantworten („house-of-brands" wie
 * „House of Brands"), gespeichert wird immer die Id. Alles andere — ein
 * erfundenes Modell, zwei Modelle, ein ganzer Absatz — ist ein Verstoss, und aus
 * dem Verstoss macht der Generator eine Rückfrage.
 *
 * Der Grund für die Nachsicht ist kein Entgegenkommen, sondern Sparsamkeit:
 * jede unnötige Rückfrage kostet den Menschen einen Zug und uns einen zweiten
 * Anbieter-Lauf, ohne dass die ENTSCHEIDUNG des Modells falsch gewesen wäre.
 */
export function checkBrandChoiceDraft(contract: BrandChoiceContract, draft: string): BrandChoiceCheck {
  const text = tidy(draft)
  if (!text) return { ok: false, violation: contract.kind === 'closed' ? 'not_an_option' : 'not_a_label' }

  if (contract.kind === 'closed') {
    // Nur EINE Zeile darf übrig sein: „branded-house\nsub-brands" ist keine
    // Entscheidung, sondern eine Liste.
    if (text.includes('\n')) return { ok: false, violation: 'not_an_option' }
    const needle = text.toLowerCase().replace(/[.,;:!?]+$/, '').trim()
    const hit = contract.options.find(option => (
      option.id.toLowerCase() === needle || option.label.toLowerCase() === needle
    ))
    return hit ? { ok: true, value: hit.id } : { ok: false, violation: 'not_an_option' }
  }

  if (text.includes('\n')) return { ok: false, violation: 'not_a_label' }
  const label = text.replace(/[.;:!?]+$/, '').trim()
  const words = label.split(/\s+/).filter(word => word.length > 0)
  if (words.length === 0 || words.length > contract.maxWords) {
    return { ok: false, violation: 'not_a_label' }
  }
  return { ok: true, value: label }
}

/**
 * Die Rückfrage in der Sprache der OBERFLÄCHE (nicht der Marke): sie ist Chat,
 * und Chat folgt Regel 9. Alles, was nicht mit `de` beginnt, bekommt Englisch —
 * dieselbe Konvention wie `advisorOpenersFor`.
 */
export function brandChoiceFallbackQuestion(contract: BrandChoiceContract, locale: string): string {
  return locale.toLowerCase().startsWith('de') ? contract.fallbackQuestion.de : contract.fallbackQuestion.en
}

/**
 * WAS DER MENSCH STATT DER ROHEN ID LIEST (P4).
 *
 * Gespeichert bleibt IMMER die stabile Id (`branded-house`) — sie ist die
 * Zusage an das Brand-Dokument, an den Prompt und an jede spätere Ableitung.
 * Angezeigt wird sie nie: „branded-house" in einer Log-Karte sieht aus wie ein
 * Datenbank-Leck, und der Mensch hat auf einer KARTE „Branded House" geklickt.
 *
 * DREI FÄLLE, EINE ANTWORT — und der Rückfall ist der WERT SELBST:
 *  - geschlossener Vertrag + bekannte Id ⇒ der Name in der Sprache der
 *    Oberfläche;
 *  - geschlossener Vertrag + UNBEKANNTER Wert (Alt-Bestand aus der Zeit des
 *    Textfelds, ein von Hand korrigierter Slot) ⇒ unverändert. Ein „—" oder
 *    eine leere Zeile würde einen vorhandenen Wert verschwinden lassen;
 *  - offener Slot (`b.positioningCategory`) oder gar kein Vertrag ⇒
 *    unverändert. Dort IST der Text die Antwort.
 *
 * Sprach-Konvention wie überall in dieser Datei: alles, was nicht mit `de`
 * beginnt, bekommt Englisch.
 */
export function brandChoiceDisplayLabel(slotId: string, storedValue: string, locale = 'en'): string {
  const contract = brandChoiceContract(slotId)
  if (!contract || contract.kind !== 'closed') return storedValue
  const hit = contract.options.find(option => option.id === storedValue)
  if (!hit) return storedValue
  return locale.toLowerCase().startsWith('de') ? hit.display.de : hit.display.en
}
