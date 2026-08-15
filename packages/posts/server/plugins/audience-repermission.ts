import { DISCUSSION_REACTIONS_TABLE, POSTS_TABLE } from '../../shared/types/post'

/**
 * C18 — die Tabellen des posts-Layers, deren Zeilen eine
 * Veröffentlichungs-Permission tragen (core-Vertrag
 * registerAudienceRepermissionTable).
 *
 * `community_posts` und `discussion_reactions`.
 *
 * DIE ZWEITE ZEILE IST EIN NACHTRAG ZU F57 MECHANIK 1 (2026-08-14, beim Bau
 * der Antwort-Reaktionen aufgefallen). Die Reaktions-Zeilen werden von der
 * Datentür mit `read: 'public'` angelegt — genau die Permission, die dieser
 * Vertrag umzieht —, waren hier aber nie angemeldet. Ein Umschalten auf „nur
 * für Mitglieder" hätte die Beiträge zugemacht und die Emoji-Zeilen darunter
 * offen gelassen: welche Themen es gibt, wer darauf reagiert hat und womit,
 * per Roh-REST für jeden Gast. Kein Text, aber ein Personenbezug — und exakt
 * der Fehler, den C18 an anderer Stelle schon zweimal einsammeln musste
 * (`events`-Titelbilder, `media`-Dateien).
 *
 * Der Nachtrag ist folgenlos für alles, was schon läuft: der Umzug ist
 * idempotent, und eine Community, die nie umgeschaltet hat, merkt nichts.
 *
 * NICHT dabei: `post_votes` sind wähler-eigen, `poll_votes` tragen gar keine
 * Permissions (nur über die Operator-Tür lesbar), `discussion_links` tragen
 * bewusst nichts Personenbezogenes und `member_counters`/`user_badges` waren
 * nie öffentlich.
 */
export default defineNitroPlugin(() => {
  registerAudienceRepermissionTable({ layer: 'posts', table: POSTS_TABLE })
  registerAudienceRepermissionTable({ layer: 'posts', table: DISCUSSION_REACTIONS_TABLE })
})
