/**
 * WELCHE SPRACHEN DIESE SEITE NICHT HAT — der VERTRAG zwischen der Seite, die
 * es weiss, und dem Kopf, der es schreibt (BI1 I3, Plan §9.5).
 *
 * Wörtlich dieselbe Bauart wie `useBrandOgImage()` und aus demselben Grund:
 * `useLocaleSeoHead()` ist der EINZIGE Ort, an dem hreflang-Alternates
 * entstehen (CLAUDE.md) — eine Seite, die ihre eigenen setzte, hätte einen
 * zweiten Kopf neben dem einen. Was sie stattdessen tut: sie SAGT, welche
 * Sprachfassung es hier nicht gibt, und der Kern lässt genau die weg.
 *
 * Leer ist der Default: jede App und jede Seite ohne Eintrag bekommt
 * unverändert alle Alternates.
 *
 * ZURÜCKSETZEN IST PFLICHT, NICHT KOSMETIK — es ist ein APP-WEITER State.
 * Bliebe er stehen, verlöre die nächste Seite im selben Client-Lauf ihre
 * deutsche Adresse, ohne dass es jemand sieht (dieselbe Falle wie beim
 * og:image, dort live erwischt). Die Seite räumt in `onBeforeRouteLeave` UND
 * `onUnmounted` auf.
 */
export function useSeoHiddenLocales() {
  return useState<string[]>('pukalani-seo-hidden-locales', () => [])
}
