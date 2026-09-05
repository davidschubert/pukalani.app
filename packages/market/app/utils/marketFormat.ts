/**
 * PROTOTYP (M0) — Komponenten-Vorlage für M1–M4.
 *
 * Datum-Anzeige der Belege. Sie steht hier und nicht in `shared/`, weil sie
 * die Oberflächen-Sprache braucht: das Abrufdatum reist als ISO-Zeichenkette
 * (maschinenlesbar, sortierbar) und wird erst beim Anzeigen zu „5. Sept.
 * 2026" bzw. „Sep 5, 2026". Ein im Server formatiertes Datum wäre in der
 * zweiten Sprache falsch.
 */
export function marketDate(iso: string, locale: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsed)
}

/** Die Adresse, wie ein Mensch sie liest — ohne Schema, ohne Schrägstrich am Ende. */
export function marketHost(sourceUrl: string): string {
  return sourceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
