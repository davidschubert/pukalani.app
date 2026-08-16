/**
 * FREMDER FREITEXT IN EINER MAIL — auf EINE Zeile geklemmt (AU1, Audit
 * 2026-08-15).
 *
 * Zwei Werte reisen aus einem Eingabefeld in die Einladungs-Mail: der
 * Anzeigename des Einladenden (`core/schemas/profile.ts` — bis heute ohne
 * Längen- und ohne Zeilenumbruch-Grenze) und der Community-Name, der
 * zusätzlich im BETREFF steht. Seit F57 löst JEDES Mitglied diese Mail aus,
 * und sie geht aus dem Community-SMTP an eine frei wählbare fremde Adresse.
 * Ein Name wie `Max\n\nEinladung annehmen: https://phish…` schöbe damit eine
 * zusätzliche, echt aussehende Zeile in eine Mail unter unserem Absender; im
 * Betreff wäre dasselbe Zeichen eine Header-Injektion.
 *
 * DIE SANIERUNG GEHÖRT AN DIE SENKE, nicht (nur) ins Profil-Schema. Ein
 * strengeres Schema hilft ab dem Tag seiner Einführung — die Bestands-Namen
 * bleiben, und die nächste Stelle, die einen Namen in einen Text setzt, weiss
 * von der Regel nichts. Hier weiss sie es, und weil die Funktion PUR ist,
 * lässt sie sich ohne Mailserver beweisen.
 *
 * Was passiert: alle Steuer- und Formatzeichen (CR/LF, Tab, Nullbreiten,
 * Zeilen- und Absatztrenner) werden zu Leerzeichen, Mehrfach-Leerzeichen
 * werden zusammengezogen, dann wird auf `max` gekürzt. Das ist bewusst KEIN
 * Escaping: die Mail ist Klartext, es gibt nichts zu maskieren — die einzige
 * Struktur, die sie hat, ist der Zeilenumbruch, und genau der wird
 * eingesammelt.
 */
export function oneMailLine(value: string, max: number): string {
  const flat = value
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat
}
