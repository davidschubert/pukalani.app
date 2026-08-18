/**
 * Ein Logger, mehr braucht ein Ein-Mann-Dienst nicht.
 *
 * Er schreibt auf stdout/stderr, weil das der Ort ist, an dem launchd
 * mitschreibt (README). Was er NIE schreibt, ist das Bearer-Secret: es taucht
 * in dieser Anwendung an genau zwei Stellen auf — im `Authorization`-Header
 * (api.ts) und in der Secret-Datei — und an keiner davon geht es durch diese
 * Funktionen.
 */

function stamp(): string {
  return new Date().toISOString()
}

export const log = {
  info(message: string): void {
    process.stdout.write(`${stamp()} [info]  ${message}\n`)
  },
  warn(message: string): void {
    process.stderr.write(`${stamp()} [warn]  ${message}\n`)
  },
  error(message: string): void {
    process.stderr.write(`${stamp()} [error] ${message}\n`)
  },
}
