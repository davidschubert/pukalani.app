import { z } from 'zod'

/**
 * DER RUMPF EINER GENERIERUNG (§3e „Streaming-Protokoll").
 *
 * Drei Felder, mehr braucht es nicht: WELCHER Slot, ein optionaler HINWEIS des
 * Menschen und der Idempotenzschlüssel.
 *
 * ── WARUM DER HINWEIS BEI 500 ZEICHEN ENDET ───────────────────────────────
 * Er ist die Nachjustierung („wärmer", „kürzer", „weniger Agentur-Sprech"),
 * nicht der Inhalt — der steht in den Slots. Ohne Deckel wäre er der bequemste
 * Weg, beliebigen Fremdtext in den Prompt zu schieben, und die
 * Prompt-Injection-Grenze (Plan §6) hätte ein Loch in Nutzergrösse.
 *
 * ── WAS HIER BEWUSST NICHT STEHT ──────────────────────────────────────────
 * Kein `model`, kein `temperature`, kein `promptVersion`. Die Override-Kette
 * ist Serversache (Plan §6: `app_config.aiModel > pukalani.brand.ai >
 * pukalani.ai`); ein Modell aus dem Client wäre ein Kostenhebel für jeden
 * angemeldeten Beta-Nutzer.
 *
 * Auch KEINE `revision`: anders als der Autosave überschreibt eine Generierung
 * nichts, was der Mensch gerade tippt — sie legt einen ENTWURF daneben und
 * erhöht die revision selbst. Der Client bekommt die neue Fassung im
 * `generation.completed`-Frame und zieht nach.
 */
export function createBrandGenerateSchema() {
  return z.object({
    slotId: z.string().min(1).max(64),
    hint: z.string().max(500).optional(),
    idempotencyKey: z.string().min(1).max(128).optional(),
  }).strict()
}

export type BrandGenerateBody = z.infer<ReturnType<typeof createBrandGenerateSchema>>
