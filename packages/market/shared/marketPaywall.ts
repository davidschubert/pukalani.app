/**
 * DIE SCHRANKE (Plan §1.9, Davids Entscheidung 3 in §6) — PUR.
 *
 * ── WAS SIE IST ───────────────────────────────────────────────────────────
 * „Frei bauen, bezahlt anwenden": die Foundation ist der Trichter, der
 * Marktvergleich ist die ANWENDUNG und damit der bezahlte Teil. Die Seite
 * „Markt" existiert von Tag eins, zeigt was sie tut und nennt den Preis-Anker
 * („Preis im Erstgespräch"); gesperrt ist nur die HANDLUNG, die Geld kostet —
 * der Lauf.
 *
 * ── WARUM DIE RECHNUNG HIER STEHT UND NICHT IN DER SEITE ─────────────────
 * Weil sie beide Zustände haben muss und heute nur einer vorkommt. Der
 * einzige Weg auf die Seite führt über das Beta-Gate des Wizards
 * (`requireBrandAccess`, 404 ohne Zugang) — wer sie sieht, hat ein
 * Beta-Konto, und Beta-Konten sind freigeschaltet. Eine Seite, die das per
 * `true` fest verdrahtete, hätte den gesperrten Zweig als toten Code, und
 * toter Code ist nach dem dritten Umbau falscher Code. Diese Funktion macht
 * daraus eine TATSACHE mit zwei möglichen Antworten, die ein Test beide
 * stellen kann.
 *
 * ── DIE ZUTEILUNG JE BRANDING IST NICHT GEBAUT, UND DAS STEHT HIER ───────
 * §1.9 sieht sie vor („die Schranke ist eine Zuteilung — sie entscheidet je
 * Branding und nie je Deployment"). Bis es sie gibt, ist `betaAccess` die
 * einzige Zutat. Wer sie baut, erweitert die EINGABE dieser Funktion und
 * nicht die Oberfläche: die Seite fragt schon heute nach `unlocked`, nicht
 * nach „Beta".
 *
 * ── KEIN SCHALTER IM PRODUKT ──────────────────────────────────────────────
 * Der Prototyp hatte einen (`market.paywall.toggle`), um David beide Bilder
 * zu zeigen. Im Produkt gibt es ihn nicht: ein Kunde, der seine eigene
 * Schranke umlegen kann, hat keine.
 */

/** Woher die Freischaltung kommt. `none` = keine — die Schranke steht. */
export type MarketPaywallGrant = 'beta' | 'none'

export interface MarketPaywallState {
  readonly unlocked: boolean
  readonly grant: MarketPaywallGrant
}

export interface MarketPaywallInput {
  /** Hat das Konto einen gültigen Beta-Zugang (`brand_access`)? */
  readonly betaAccess: boolean
}

export function resolveMarketPaywall(input: MarketPaywallInput): MarketPaywallState {
  return input.betaAccess
    ? { unlocked: true, grant: 'beta' }
    : { unlocked: false, grant: 'none' }
}
