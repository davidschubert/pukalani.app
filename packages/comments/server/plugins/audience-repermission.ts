import { COMMENTS_TABLE, COMMENT_REACTIONS_TABLE } from '../../shared/types/comment'

/**
 * C18 — die Tabellen des comments-Layers, deren Zeilen eine
 * Veröffentlichungs-Permission tragen und beim Umschalten der Sichtbarkeit
 * mitziehen müssen (core-Vertrag registerAudienceRepermissionTable).
 *
 * `comments` und seit F57 auch `comment_reactions`: eine Reaktion ist so
 * öffentlich wie das, worauf sie sich bezieht — die Datentür schreibt sie mit
 * `read: 'public'` an. Ohne diese zweite Zeile hieße „nur für Mitglieder" für
 * die Emoji-Leiste bloß „ab jetzt", und der Bestand bliebe per Roh-REST für
 * jeden Gast lesbar: welche Antworten es gibt, wer darauf reagiert hat und
 * womit. Das ist wenig Text und trotzdem ein Personenbezug.
 *
 * NICHT dabei: `comment_votes` sind wähler-eigen (`read(user:…)`, die Liste
 * liefert nur Summen), `guest_authors` liegen bewusst operator-only und
 * `embed_sites` sind Betreiber-Konfiguration — keine davon war je öffentlich
 * lesbar, keine ändert sich also mit dem Publikum.
 */
export default defineNitroPlugin(() => {
  registerAudienceRepermissionTable({ layer: 'comments', table: COMMENTS_TABLE })
  registerAudienceRepermissionTable({ layer: 'comments', table: COMMENT_REACTIONS_TABLE })
})
