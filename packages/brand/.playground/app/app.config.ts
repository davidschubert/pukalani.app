/**
 * Der Playground ist die EINZIGE Stelle, an der Georges Entwicklungs-Ersatz
 * läuft (`packages/brand/app/app.config.ts` erklärt, warum er sonst überall aus
 * ist): so lässt sich das §3e-Streaming-Protokoll ohne KI-Schlüssel, ohne
 * Anbieter und ohne Kosten von Anfang bis Ende durchspielen.
 */
export default defineAppConfig({
  pukalani: {
    brand: {
      devStubGenerator: true,
    },
  },
})
