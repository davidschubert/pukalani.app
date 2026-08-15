/**
 * Die AUTORITÄT über die mitschreibenden Zähler (F1, gemeinsames Paket): der
 * posts-Layer besitzt `member_counters` und verbucht deshalb, was core
 * entgegennimmt (`registerUserCounterRecorder`).
 *
 * EINE Autorität je Deployment, und sie gehört zu der Tabelle — nicht zu der
 * Route, die gerade meldet. Genau deshalb kann `comments` in dieselben Zähler
 * melden, ohne `posts` zu kennen (A14): es nennt eine Ereignis-Art, keinen
 * Nachbarn.
 *
 * Fehlt dieser Layer (Silo-App ohne Discussions, Playground), ist der Vertrag
 * unbesetzt und jede Meldung verpufft — kein Fehler, keine Zeile, kein Abzeichen
 * „Editor". Dieselbe gutmütige Richtung wie beim Zähl-Vertrag von Stufe 4.
 */
export default defineNitroPlugin(() => {
  registerUserCounterRecorder(applyMemberCounterEvents)
  /**
   * DASSELBE FÜR DAS TAGES-LIMIT (F57 Mechanik 3): der Tagesstand steht in
   * derselben Zeile, also gehört auch diese Autorität hierher — und in
   * dasselbe Plugin, damit „wer besitzt member_counters" an EINER Stelle
   * beantwortet ist. Ohne posts-Layer bleibt der Vertrag unbesetzt und es gibt
   * schlicht kein Limit (erlaubender No-Op, Begründung im Vertrag).
   */
  registerLikeAllowanceAuthority(spendMemberLikeAllowance)
  /**
   * UND DASSELBE FÜR „WER HAT WEN HERGEHOLT" (F57-Stufen): der Stempel landet
   * in derselben Zeile, also gehört auch diese Autorität hierher. Ohne
   * posts-Layer bleibt der Vertrag unbesetzt — eine Einladung wird dann
   * angenommen wie bisher, es gibt dort nur weder Stufen noch Abzeichen.
   */
  registerCommunityInviterRecorder(rememberCommunityInviter)
})
