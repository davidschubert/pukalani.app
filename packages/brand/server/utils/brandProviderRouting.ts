/**
 * DIE DATENSCHUTZ-BEDINGUNGEN JEDES BRAND-AUFRUFS — an EINER Stelle.
 *
 * `zdr` (nur Anbieter mit Zero-Data-Retention) und `dataCollection: 'deny'`
 * sind der Grund, warum Markeninhalte überhaupt über einen fremden Anbieter
 * gehen dürfen. `allowFallbacks: false` ist die Sicherung dahinter: ohne sie
 * weicht OpenRouter bei Last auf einen Anbieter AUSSERHALB dieser Bedingungen
 * aus, und der Lauf gelänge — mit genau dem Ergebnis, das die zwei Felder
 * verhindern sollen. Lieber „gerade nicht verfügbar".
 *
 * ── WARUM JETZT EINE DATEI UND NICHT DREI KONSTANTEN ──────────────────────
 * Bis zum Brand-Check gab es zwei Kopien mit einer geschriebenen Begründung
 * („die eine hängt an der Stream-Naht, die andere am JSON-Transport") und dem
 * Zusatz, dass die drei WERTE nie abweichen dürfen. Mit dem dritten Aufrufer
 * ist das keine tragfähige Verabredung mehr: eine Regel, die drei Dateien
 * gleichzeitig einhalten müssen, ohne dass irgendetwas es prüft, ist keine
 * Regel, sondern eine Hoffnung. Die Kopplung, die die alte Begründung fürchtet
 * („beim nächsten Umbau versehentlich gelöst"), ist genau die, die hier
 * gewollt ist: WER auch immer ein Modell ruft, ruft es unter diesen
 * Bedingungen.
 *
 * Wer für einen künftigen Aufrufer ANDERE Bedingungen braucht, schreibt sie
 * dort als eigene Konstante hin — mit einem Satz, warum. Ein zusätzliches Feld
 * hier hätte still auf alle drei gewirkt.
 *
 * Der Typ bleibt bewusst ungenannt (`as const` statt `: AiProviderRouting`):
 * `AiProviderRouting` liegt im Core und wird per Auto-Import gefunden — ein
 * `import type` quer über die Layer-Grenze wäre der einzige in diesem Ordner.
 */
export const BRAND_PROVIDER_ROUTING = {
  zdr: true,
  dataCollection: 'deny',
  allowFallbacks: false,
} as const
