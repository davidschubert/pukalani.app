/**
 * Brute-Force-/Spam-Schutz (Konzept A2): Auth-Routen nutzen den AdminClient und
 * umgehen Appwrites eingebaute Rate Limits — hier drosselt Nitro selbst. Zwei
 * Klassen:
 *  - Auth (Login/Recovery/OTP): eng, 5/min und IP.
 *  - Schreib-Endpoints (Comments/Votes/Reports): weiter, da legitime Nutzung
 *    (v.a. Voten) deutlich frequenter ist — reiner Bot-/Spam-Schutz, kein
 *    Bremsen normaler Nutzung.
 *
 * Zählung läuft über den Rate-Limit-Store (server/utils/rateLimitStore.ts):
 * mit NUXT_REDIS_URL geteilt über alle Instanzen/Cluster-Worker (Fixed-
 * Window in Redis), ohne wie bisher in-memory pro Instanz. Fail-open bei
 * totem Redis (Fallback drosselt pro Instanz weiter).
 */
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 5
const WRITE_MAX = 60
// Presence-Heartbeats laufen legitim hochfrequent (20s-Intervall + jede
// metadata-Änderung, pro Tab) — großzügiges eigenes Budget, das nur echtes
// Hämmern (Scripting) stoppt, nie normale Multi-Tab-Nutzung.
const PRESENCE_MAX = 120
const TOKEN_MAX = 10
// Kommentar-Lesen (Embed-Vorarbeit E0): jeder Request kostet bis zu 4 Appwrite-
// Queries (top-level, replies, total, avatars) — großzügig, aber nicht frei,
// sonst ist die öffentliche Route ein billiger DoS-Hebel auf Drittseiten.
const READ_MAX = 120

// Routen werden je METHODE+Pfad gematcht, damit z.B. der Reset-Confirm
// (PUT /recovery) nicht das Mail-Budget des Anforderns (POST /recovery) teilt.
// Mail-versendende Routen: JEDER Request zählt (Mail-Bombing-Schutz).
const ALWAYS_LIMITED = new Set([
  'POST /api/auth/recovery',
  'POST /api/auth/otp',
  'POST /api/auth/verification',
  // Sicherheits-Audit 2026-08-02 (HOCH): die Registrierung fehlte hier — sie
  // ist aber die schärfste der drei Mail-Routen. Sie LEGT KONTEN AN und
  // verschickt die Verifizierungs-Mail an eine frei wählbare Adresse, und weil
  // sie über den Admin-Client läuft, greift Appwrites eigenes Limit nicht.
  // Ungedrosselt war das ein Mail-Bombing-Werkzeug MIT Konto-Müll als
  // Nebenwirkung. Budget wie die Geschwister (5/min und IP): ein Mensch legt
  // sich kein zweites Konto in derselben Minute an, und geteilte Anschlüsse
  // (Verein im selben Netz, Konferenz-WLAN) bleiben mit fünf Anmeldungen je
  // Minute bequem darunter.
  'POST /api/auth/signup',
])
// Credential-/Code-/Token-Prüfung: nur FEHLgeschlagene Versuche zählen — ein
// erfolgreicher Login/Reset (200) soll das Budget nicht aufbrauchen. Der
// Reset-Confirm (PUT /recovery) versendet keine Mail → hier, nicht ALWAYS.
const FAILURE_LIMITED = new Set([
  'POST /api/auth/login',
  'POST /api/auth/otp/verify',
  'PUT /api/auth/recovery',
  // Verification-Confirm ist session-los (Cross-Device) → Token-Raten drosseln
  'PUT /api/auth/verification',
  // Embed-Handoff-Einlösung (E2): session-los, Token = Beweis → Raten drosseln
  'POST /api/auth/embed-session',
  // Einladungs-Vorschau: session-los, der Token IST der Beweis. Sie legt nichts
  // an und verschickt nichts — geratene Token sollen trotzdem ins Budget laufen.
  'POST /api/community/invites/preview',
  // Site-Handoff (O6): dito — der Token IST der Beweis, also nur Fehlversuche
  // zählen (ein erfolgreicher Sprung in die eigene Community kostet nichts).
  'GET /api/auth/site-session',
  // Zwei-Faktor (U15 Teil 4) — die drei Stellen, an denen ein CODE geraten
  // werden kann. Hier zählen bewusst nur FEHLversuche: ein TOTP-Code lebt 30 s,
  // wer sich vertippt und sofort korrigiert, darf nicht am eigenen Budget
  // scheitern. Fünf Fehlversuche je Minute und IP reichen für Menschen bequem
  // und machen Raten aussichtslos (6-stellig ⇒ 10^6 Möglichkeiten).
  //
  // Diese Drossel ist NICHT bloß Gürtel zum Hosenträger: ein falscher Code
  // VERBRAUCHT Appwrites Challenge nicht (Challenges/Update.php löscht sie nur
  // bei Erfolg), dieselbe Challenge lässt sich also weiter beschicken. Appwrites
  // eigenes `abuse-limit` von 10 hängt zudem am challengeId bzw. an der userId —
  // wer je Versuch eine FRISCHE Challenge anlegt, läuft daran vorbei. Der
  // wirksame Deckel ist deshalb dieser hier.
  'POST /api/auth/mfa/challenge',
  'POST /api/auth/mfa/verify',
  'POST /api/auth/mfa/disable',
])
// Schreib-Routen mit teils dynamischen Segmenten ([id]) → Regex + stabiler
// Bucket-Name, damit z.B. Vote-Spam über viele Kommentar-IDs EIN Budget teilt
// (statt je ID ein frisches). Jeder Request zählt. `reports/resolve` fehlt
// bewusst: schon Moderator-gated, kein offener Abuse-Vektor.
const WRITE_LIMITED: { re: RegExp, bucket: string, max?: number }[] = [
  { re: /^POST \/api\/comments$/, bucket: 'comments:create' },
  // Gast-Kommentare (Embed E4): unauth. Write → enges Budget wie Feedback,
  // reiner Spam-Backstop (die harte Grenze ist zusätzlich das Tenant-Quota).
  { re: /^POST \/api\/comments\/guest$/, bucket: 'comments:guest', max: 5 },
  { re: /^PATCH \/api\/comments\/[^/]+$/, bucket: 'comments:edit' },
  { re: /^POST \/api\/comments\/[^/]+\/vote$/, bucket: 'comments:vote' },
  { re: /^POST \/api\/reports$/, bucket: 'reports:create' },
  /**
   * EMOJI-REAKTIONEN (F57) — die beiden Umschalter, hier und beim Beitrag.
   *
   * Sie haben SCHON eine Drossel, und die bleibt: 60 Umschaltungen je Mensch,
   * Community und Minute, gezählt IN der Route. Was ihr fehlt, ist die
   * Reihenfolge — sie greift erst, NACHDEM `resolveReactionTarget` die fremde
   * Zeile über die Operator-Klinke gelesen hat. Eine Anfrage, die ohnehin
   * abgewiesen wird, kostete damit einen Appwrite-Abruf. Ein Deckel, der erst
   * nach der Arbeit greift, schützt den Server nicht (dieselbe Begründung wie
   * beim Einladungs-Kontingent weiter unten).
   *
   * Die Zeile hier zählt deshalb DAVOR, je IP, mit dem Standard-Schreibdeckel
   * (60/min) — genau die Zahl der Route, damit die feinere Grenze (Mensch +
   * Community) im Normalfall die wirksame bleibt und diese hier nur den
   * Ansturm abfängt. Eigene Buckets je Layer, wie bei den Stimmen darüber.
   */
  { re: /^POST \/api\/comments\/[^/]+\/reactions$/, bucket: 'comments:reactions' },
  { re: /^POST \/api\/posts\/discussions\/reactions$/, bucket: 'posts:reactions' },
  // Community-Posts (Phase 25): member-led → Spam-Backstop. hide/restore
  // fehlen bewusst (Moderator-gated, wie reports/resolve).
  { re: /^POST \/api\/posts$/, bucket: 'posts:create' },
  { re: /^PATCH \/api\/posts\/[^/]+$/, bucket: 'posts:edit' },
  { re: /^POST \/api\/posts\/[^/]+\/(vote|score)$/, bucket: 'posts:vote' },
  // Events + Kurse (Audit-Runde 5, 2026-08-16): dieselbe Spam-/Amplifikations-
  // Klasse wie posts/comments:vote — die Zu-/Absage, das Aufstimmen (verdoppelt:
  // 2× count + Zähler-Update je Ruf), die Einschreibung und der Lektions-
  // Abschluss sind member-led und waren als einzige ihrer Art OHNE Backstop.
  // Session-gated, Standard-Schreibdeckel (60/min/IP), eigene Buckets je Zweck.
  { re: /^POST \/api\/events\/[^/]+\/rsvp$/, bucket: 'events:rsvp' },
  { re: /^POST \/api\/events\/[^/]+\/score$/, bucket: 'events:vote' },
  { re: /^POST \/api\/courses\/[^/]+\/enroll$/, bucket: 'courses:enroll' },
  { re: /^POST \/api\/lessons\/[^/]+\/complete$/, bucket: 'courses:lesson' },
  // Presence-Schreibwege (Admin-Client-Amplifikation) + JWT-Mint: session-
  // gated, aber ein Skript/XSS soll den Server nicht ungedrosselt Appwrite-
  // Writes/JWTs erzeugen lassen. heartbeat+leave teilen EIN Budget.
  { re: /^POST \/api\/presence\/(heartbeat|leave)$/, bucket: 'presence:write', max: PRESENCE_MAX },
  { re: /^GET \/api\/auth\/realtime-token$/, bucket: 'auth:jwt', max: TOKEN_MAX },
  // Zwei-Faktor einrichten (U15 Teil 4): jeder Aufruf legt bei Appwrite einen
  // neuen TOTP-Authenticator an (der vorherige wird still ersetzt) und lässt
  // zusätzlich ein QR-Bild rendern. Session-gated, also kein offener Vektor —
  // aber ein Skript soll daraus keine Schleife machen. Ein Mensch richtet
  // einmal ein.
  { re: /^POST \/api\/auth\/mfa\/setup$/, bucket: 'auth:mfa-setup', max: 10 },
  /**
   * DEN EIGENEN @NAMEN ÄNDERN (AH-7) — Audit-Befund AU2, 2026-08-15.
   *
   * Zwei Gründe, und der zweite ist der schärfere:
   *  1. SCHREIBLAST. Jeder Versuch legt über den ADMIN-Client eine Zeile in
   *     `account_handles` an (und stellt die alte um). Appwrites eigene Bremse
   *     greift wegen des API-Keys nicht — dieselbe Lage wie bei den
   *     Auth-Routen ganz oben.
   *  2. EIN EXISTENZ-ORAKEL ÜBER DEN GLOBALEN NAMENSRAUM. Der Namensraum ist
   *     seit AH-7 instanzweit; ein 409 `taken` verbraucht weder Zustand noch
   *     die 30-Tage-Sperrfrist. Ungedrosselt liess sich damit die gesamte
   *     Namensliste durchprobieren UND ein freiwerdender Name automatisch im
   *     selben Moment wegschnappen. Der Kommentar in `accountHandles.ts`
   *     begründet das Zuschnappen — nicht das beliebig schnelle Fragen.
   *
   * FÜNF JE MINUTE UND IP, wie die Auth-Geschwister. Ein Mensch benennt sich
   * einmal in dreissig Tagen um; ein erfolgreicher Wechsel sperrt sich danach
   * ohnehin selbst.
   *
   * WARUM HIER UND NICHT (auch) IN `FAILURE_LIMITED`: der Vorschlag im Audit
   * war „beides". Beides geht nicht und wäre auch schwächer — steht eine Route
   * in WRITE_LIMITED, gewinnt dieser Eintrag unten Bucket, Deckel UND
   * Zählweise, der FAILURE-Eintrag bliebe wirkungslos. Vor allem aber ist
   * „jeder Versuch zählt" strikt schärfer als „nur Fehlversuche zählen": das
   * Orakel FRAGT, und jede Frage ist hier ein Request.
   */
  { re: /^PATCH \/api\/account\/handle$/, bucket: 'account:handle', max: 5 },
  // Social-Login (U14): zwei GETs, die beide ÜBER DEN ADMIN-CLIENT schreiben —
  // der Start prägt einen OAuth-Token bei Appwrite, die Rückkehr eine SESSION.
  // Beide sind session-los erreichbar, Appwrites eigene Bremse greift wegen des
  // API-Keys nicht, und der Rest der Auth-Routen ist längst gedeckelt: hier
  // fehlte es schlicht (Befund beim Bau von U14). EIN gemeinsamer Bucket, weil
  // es EIN Vorgang ist — hin und zurück; ein Mensch macht das einmal, 10/min
  // sind fünf vollständige Anmeldungen je Minute und IP.
  { re: /^GET \/api\/auth\/oauth$/, bucket: 'auth:oauth', max: TOKEN_MAX },
  { re: /^GET \/api\/auth\/oauth\/callback$/, bucket: 'auth:oauth', max: TOKEN_MAX },
  // „Deine Communities" (F12): ein GET, aber kein billiger. Jeder Aufruf prägt
  // ein Appwrite-JWT und lässt danach das Control Plane zwei Tabellen lesen —
  // vier Operationen über ZWEI Projekte, also dieselbe Kostenklasse wie der
  // JWT-Mint darüber und deshalb derselbe Deckel. Die Seite ruft sie einmal je
  // Aufbau; 10/min ist für einen Menschen unerreichbar und für ein Skript die
  // Grenze.
  { re: /^GET \/api\/onboarding\/communities$/, bucket: 'onboarding:communities', max: TOKEN_MAX },
  // Der Sprung IN eine Community (O6): seit dem Audit 2026-08-02 belegt diese
  // Route die Mitgliedschaft, bevor sie siegelt — sie prägt also dasselbe JWT
  // und liest dieselben zwei Tabellen wie die Übersicht darüber. Gleiche
  // Kostenklasse, gleicher Deckel; ein Mensch klickt eine Community an, kein
  // Dutzend je Minute.
  { re: /^POST \/api\/onboarding\/handoff$/, bucket: 'onboarding:communities', max: TOKEN_MAX },
  // Die F50-Geschwister auf den MANDANTEN-Hosts — zweimal unabhängig gefunden
  // (Session-Audit + Selbst-Review, beide 2026-08-09; der Kommentar in
  // communityHandoff.ts versprach „dasselbe Rate-Limit-Budget", der Code hielt
  // es nicht): `switcher` (Liste) und `switch` (Sprung) prägen je ein
  // Appwrite-JWT und lassen das Control Plane zwei Tabellen lesen — Wort für
  // Wort die Kostenklasse der Kundenbereichs-Zwillinge darüber, mit denen sie
  // sich die Implementierung teilen. `control-handoff` ist nur ein
  // Krypto-Aufruf, aber ein Siegel-Aussteller ohne Deckel bleibt ein Geschenk
  // an Skripte. Gemeinsamer Bucket, weil es EIN Verhalten ist: aufklappen und
  // springen; ein Klick pro Sprung ist für Menschen unerreichbar weit weg.
  { re: /^GET \/api\/community\/switcher$/, bucket: 'onboarding:communities', max: TOKEN_MAX },
  { re: /^POST \/api\/community\/switch$/, bucket: 'onboarding:communities', max: TOKEN_MAX },
  { re: /^POST \/api\/community\/control-handoff$/, bucket: 'onboarding:communities', max: TOKEN_MAX },
  // Der Community-Export (U20): die mit Abstand teuerste Leseroute im Haus —
  // sie paginiert durch JEDEN Produkt-Layer (Beiträge, Kommentare, Seiten,
  // Termine, Kurse, Lektionen), prägt zusätzlich ein Appwrite-JWT und lässt
  // das Control Plane die Mitgliederliste lesen. EIN Klick baut eine Datei;
  // wer sie zweimal je Minute braucht, tut etwas anderes als exportieren.
  // Eigener Bucket, weil ein Export das Budget des Switchers sonst leerräumt.
  { re: /^GET \/api\/community\/export$/, bucket: 'community:export', max: 2 },
  // Das Community-MENÜ speichern (U15): owner-/admin-gated, also kein offener
  // Vektor — aber jeder Klick im Editor schreibt eine Appwrite-Zeile UND liest
  // vorher die veröffentlichten Seiten, um die eigenen Links zu prüfen. Ein
  // Ziehen-und-Ablegen-Formular lädt zum Speichern im Sekundentakt ein; der
  // Standard-Schreibdeckel (60/min) liegt weit über jedem Menschen und stoppt
  // genau das Skript, das die Zeile in einer Schleife umschreibt.
  { re: /^PATCH \/api\/pages\/navigation$/, bucket: 'pages:navigation' },
  // Den Sucheintrag speichern (U15 Teil 2): dieselbe Sorte Formular und
  // derselbe Grund wie eine Zeile darüber — owner-/admin-gated, aber ein Feld
  // mit Live-Vorschau lädt zum Speichern nach jedem Satz ein. Eigener Bucket,
  // damit ein Owner, der an seiner Beschreibung feilt, sich nicht sein
  // Menü-Budget verbraucht.
  { re: /^PATCH \/api\/pages\/seo$/, bucket: 'pages:seo' },
  // Die Weiterleitungen speichern (U15 Teil 3): dieselbe Sorte Formular wie die
  // zwei Zeilen darüber — owner-/admin-gated, aber eine Tabelle mit
  // Hinzufügen und Löschen je Zeile lädt zum Speichern nach jedem Handgriff
  // ein. Eigener Bucket, damit ein Owner, der zwanzig alte Adressen einträgt,
  // sich nicht sein Menü- oder Sucheintrags-Budget verbraucht. Der
  // Standard-Schreibdeckel (60/min) liegt weit über jedem Menschen und stoppt
  // genau das Skript, das die Zeile in einer Schleife umschreibt.
  { re: /^PATCH \/api\/pages\/redirects$/, bucket: 'pages:redirects' },
  // Öffentliche Kommentar-Lese-Routen (Embed macht sie zur beworbenen Fläche
  // auf fremden Seiten) — eigener Read-Bucket statt „GET ist frei".
  // count (E3) ist CORS-offen und microcached, teilt denselben Bucket.
  { re: /^GET \/api\/comments$/, bucket: 'comments:read', max: READ_MAX },
  { re: /^GET \/api\/comments\/count$/, bucket: 'comments:read', max: READ_MAX },
  // Anwesende zählen (Audit 2026-08-02): unauthentifiziert erreichbar und pro
  // Aufruf bis zu fünf Seiten über die Presences-API — mit dem ADMIN-Client,
  // also ohne jede Appwrite-seitige Bremse. Das war der billigste
  // Verstärker-Hebel im System (ein GET ⇒ fünf Admin-Abrufe). Derselbe
  // Lese-Deckel wie die öffentlichen Kommentar-Routen: die Seite fragt beim
  // Aufbau und danach alle 20 s, 120/min ist dafür reichlich.
  { re: /^GET \/api\/presence\/count$/, bucket: 'presence:read', max: READ_MAX },
  // Die Themen-Suche des `#`-Menüs (F57): sie läuft bei JEDEM getippten
  // Zeichen los (client-seitig um 150 ms entprellt, mehr nicht) und macht je
  // Aufruf eine Volltext-Abfrage. Ein eigener Bucket, weil sie ein
  // MITGLIEDER-Gate hat und deshalb nicht zu den öffentlichen Lese-Routen
  // gehört. Die Rückverweise sind gastoffen und teilen ihn: beide gehören zur
  // selben Funktion, und 120/min reicht für beide zusammen bequem.
  { re: /^GET \/api\/posts\/discussions\/link-search$/, bucket: 'posts:links', max: READ_MAX },
  { re: /^GET \/api\/posts\/discussions\/backlinks$/, bucket: 'posts:links', max: READ_MAX },
  /**
   * Die Handle-Suche des `@`-Menüs (AU2, 2026-08-15) — bis heute stand hier
   * statt eines Eintrags nur die Notiz, dass sie fehlt. Sie ist der EXAKTE
   * Zwilling der beiden Zeilen darüber: dasselbe Menü in derselben
   * Schreibfläche, ein `startsWith` je getipptem Zeichen, ein MITGLIEDER-Gate
   * davor. Ungedrosselt war sie die Ausleitung der MITGLIEDERLISTE im
   * Sekundentakt — acht Namen je Antwort, aber beliebig oft und über jedes
   * Präfix (`a`, `b`, `aa`, …).
   *
   * EIGENER BUCKET, NICHT `posts:links`: beide Menüs leben in DERSELBEN
   * Schreibfläche (PostBodyEditor), und wer in einem Beitrag Themen UND
   * Menschen verlinkt, würde sich sonst mitten im Satz selbst aussperren.
   *
   * WARUM 120 UND NICHT 30 (der Vorschlag aus dem Audit): der Client entprellt
   * um 150 ms, ein Mensch tippt langsamer als das — es fliegt also im Regelfall
   * EINE Anfrage JE ZEICHEN. Ein Beitrag mit vier Erwähnungen von je acht
   * Zeichen verbraucht damit gut 30 Anfragen ganz allein; 30/min hätte das
   * Menü im normalen Schreiben abgewürgt. 120/min ist dieselbe Zahl, die die
   * gleich teure Themen-Suche trägt, und begrenzt die Ausleitung trotzdem hart
   * (eine Anfrage je halbe Sekunde statt beliebig vieler).
   */
  { re: /^GET \/api\/handles\/search$/, bucket: 'handles:search', max: READ_MAX },
  // Medien-Upload: der einzige Schreibweg, der BINÄRDATEN auf die geteilte
  // Platte legt (bis 15 MB je Bild) — ein ungedrosseltes Budget ist hier nicht
  // „viele Zeilen", sondern viele Gigabyte. 30/min ist für eine Redaktion, die
  // eine Galerie füllt, reichlich (ein Mensch wählt keine 30 Bilder je Minute
  // aus) und für ein Skript die Grenze. Capability-gated ist die Route
  // ohnehin — das hier ist der Schutz gegen ein Konto, das durchdreht.
  { re: /^POST \/api\/media$/, bucket: 'media:upload', max: 30 },
  // Avatar-Upload (Audit 2026-08-02): derselbe Vorwurf wie oben, nur war er
  // hier nie gedeckelt — bis 5 MB je Datei auf dieselbe geteilte Platte, und
  // jede Datei ist eine eigene Row in Appwrites Storage. Ein Konto braucht
  // keine 30 Profilbilder je Minute; dasselbe Budget wie /api/media, weil es
  // dieselbe Ressource angreift. Der Bucket bleibt eigen: ein Redakteur, der
  // eine Galerie füllt, soll sich nicht selbst am Profilbild aussperren.
  { re: /^POST \/api\/storage\/[^/]+$/, bucket: 'storage:upload', max: 30 },
  // Event-Cover + Ticket-Anhang (Audit-Runde 5, 2026-08-16): dieselbe
  // Binär-auf-die-Platte-Klasse wie /api/media — Cover bis Bildgröße,
  // Ticket-Anhang bis 10 MB. Ticket ist operator-gated, aber eine durchdrehende
  // Betreiber-Sitzung schreibt sonst ungebremst Gigabyte. Deckel 30/min wie media.
  { re: /^POST \/api\/events\/[^/]+\/cover$/, bucket: 'events:cover', max: 30 },
  { re: /^POST \/api\/tickets\/[^/]+\/files$/, bucket: 'tickets:files', max: 30 },
  // Stripe-Anlege-Routen (Audit-Runde 5, 2026-08-16): jeder Ruf legt bei Stripe
  // an — checkout: Customer + Checkout-Session, portal: Portal-Session. Session-
  // gated, aber ohne Deckel könnte ein eingeloggter Nutzer unbegrenzt
  // Stripe-Objekte/-Last erzeugen (besonders heikel, sobald A2 live ist). Der
  // Webhook bleibt bewusst frei (signiert, weiter unten begründet). checkout
  // enger (10), weil es zwei Stripe-Objekte je Ruf anlegt.
  { re: /^POST \/api\/billing\/checkout$/, bucket: 'billing:checkout', max: 10 },
  { re: /^POST \/api\/billing\/portal$/, bucket: 'billing:portal', max: 30 },
  // Client-Error-Inbox (Observability-Gate): der Client dedupliziert/kappt
  // selbst (10/Session) — das Limit hier stoppt Scripting/kaputte Clients.
  { re: /^POST \/api\/telemetry\/error$/, bucket: 'telemetry:error', max: 30 },
  /**
   * Das Mess-Ereignis (F47, Eintrag AU2 2026-08-15): gastoffen, und jeder
   * Request löst einen AUSGEHENDEN `fetch` an die Plausible-Instanz aus (bis
   * 16 KiB Rumpf, die Route reicht ihn 1:1 weiter). Ungedrosselt ist das kein
   * „ein paar Zeilen mehr in der Statistik", sondern ein Weiterleitungsdienst,
   * mit dem ein Fremder unsere Instanz auf eine andere Maschine zielen lässt.
   * Dasselbe Budget wie das Geschwister `telemetry/error` — dieselbe Klasse
   * (gastoffener Client-Melder, ein ausgehender Ruf je Aufruf).
   *
   * DASS 30/min JE IP FÜR EIN GETEILTES NETZ KNAPP SEIN KANN, ist bekannt und
   * hier hinnehmbar: verloren geht dann eine MESSUNG, keine Handlung — und
   * dieselbe Datei deckelt die Registrierung längst bei 5/min je IP.
   */
  { re: /^POST \/api\/stats-event$/, bucket: 'stats:event', max: 30 },
  // Feedback-Widget: auch Gäste dürfen senden → enges Budget gegen Spam
  { re: /^POST \/api\/feedback$/, bucket: 'feedback:create', max: 5 },
  /**
   * DER CLAIM-POLL DES AI-RUNNERS (docs/plans/AI-RUNNER.md § 5).
   *
   * Kein Spam-Schutz, sondern SELBST-DoS-SCHUTZ: der Runner fragt alle paar
   * Sekunden „hast du was für mich?", und ein Poll-Loop, der in einen Fehler
   * läuft und sofort neu fragt, hämmert die eigene Betreiber-Konsole — mit
   * einem gültigen Bearer-Secret, also an jeder anderen Bremse vorbei. Genau
   * dieser Fall steht im Konzept.
   *
   * GROSSZÜGIG (30/min), weil der legitime Aufrufer EIN Rechner ist, der im
   * Sekundentakt fragen darf: 30 lässt einen Poll alle zwei Sekunden zu und
   * stoppt trotzdem die Endlosschleife. Der Bucket zählt je IP — mehrere
   * Runner hinter DERSELBEN Adresse teilen ihn sich; heute ist das einer, und
   * wenn es je zwei werden, ist die Zahl zu erhöhen, nicht der Schutz zu
   * entfernen.
   *
   * Die übrigen Runner-Routen stehen bewusst NICHT hier: `events`, `finish`
   * und `transcript` laufen nur, solange ein echter Lauf existiert, und der
   * Claim davor ist bereits gedeckelt.
   */
  { re: /^POST \/api\/runner\/runs\/claim$/, bucket: 'runner:claim', max: 30 },
  // E10, Davids Entscheidung 8 („volle Notbremse in Fassung 1"): Wählen und
  // Kommentieren sind session-gated, aber sie schreiben ins BETREIBER-System
  // eines anderen Projekts — ein Skript soll daraus keinen Hebel machen.
  // Wählen ist legitim frequent (durch eine Liste klicken), Kommentieren nicht.
  { re: /^POST \/api\/feedback\/[^/]+\/vote$/, bucket: 'feedback:vote' },
  { re: /^POST \/api\/feedback\/[^/]+\/comments$/, bucket: 'feedback:comment', max: 10 },
  // Self-Service-Onboarding (SAAS-ROADMAP #1): das Anlegen ist teuer (Rows im
  // Control Plane, eine Subdomain wird belegt) → enges Budget. Die Vorprüfung
  // ist billiger, aber ein Rate-Limit gehört trotzdem davor: sie beantwortet
  // „gilt dieser Code?" und „ist dieser Name frei?" und wäre sonst ein
  // Werkzeug zum Durchprobieren. Beides ist zusätzlich session-gated.
  { re: /^POST \/api\/onboarding\/site$/, bucket: 'onboarding:create', max: 5 },
  { re: /^POST \/api\/onboarding\/precheck$/, bucket: 'onboarding:precheck', max: 30 },
  // KI-Vorschlag: jeder Klick kostet echtes Geld beim Anbieter.
  { re: /^POST \/api\/onboarding\/suggest$/, bucket: 'onboarding:suggest', max: 10 },
  // Early-Access-Anfrage: die EINZIGE session-lose Schreibroute des Trichters,
  // und sie verschickt Mail an den Betreiber → engstes Budget.
  { re: /^POST \/api\/onboarding\/request$/, bucket: 'onboarding:request', max: 3 },
  /**
   * Einladen (F57 Mechanik 2): seit dem 2026-08-14 darf JEDES Mitglied das,
   * und jeder Versuch verschickt eine MAIL an eine frei wählbare fremde
   * Adresse. Das ist die Kostenklasse der Early-Access-Anfrage, nur mit
   * Session — also derselbe enge Deckel.
   *
   * DIE DROSSEL IST NICHT DAS KONTINGENT, und beide werden gebraucht. Das
   * Kontingent (5 je Woche, an den erzeugten Zeilen gezählt) begrenzt die
   * MENGE über die Zeit; es liegt hinter Rollen- und Schalter-Prüfung, hinter
   * einem JWT-Mint und hinter einer Zähl-Abfrage über die Service-Naht. Diese
   * Zeile hier begrenzt den ANSTURM davor — sie kostet nichts und hält ein
   * Skript ab, das dieselbe teure Kette hundertmal je Minute anstößt, nur um
   * am Ende fünfmal 429 zu bekommen. Ein Deckel, der erst NACH der Arbeit
   * greift, schützt den Server nicht.
   *
   * Der Bucket ist EIGEN und wird NICHT mit `onboarding:communities` geteilt:
   * wer gerade sechs Leute einlädt, soll deswegen nicht den
   * Community-Wechsler verlieren.
   */
  { re: /^POST \/api\/community\/members$/, bucket: 'community:invite', max: 5 },
  /**
   * MEIN Kontingent lesen (F57) — Eintrag aus AU1, Audit 2026-08-15.
   *
   * Ein GET, aber die Kostenklasse der JWT-prägenden Geschwister weiter oben:
   * jeder Aufruf prägt ein Appwrite-JWT und lässt das Control Plane die eigene
   * Mitgliedschaft, die Community-Zeile und den Einladungs-Zähler lesen — vier
   * Operationen über ZWEI Projekte. Seit F57 hängt er zusätzlich am SSR-Aufbau
   * der Mitglieder-Seite, die jedem Mitglied offensteht; ungedrosselt war das
   * der billigste Weg, die Service-Naht zum Control Plane zu beschäftigen.
   * Deshalb derselbe Deckel wie `onboarding:communities` (TOKEN_MAX).
   *
   * EIGENER BUCKET, nicht der der Geschwister — aus demselben Grund, aus dem
   * `community:invite` eine Zeile höher einen eigenen hat: die Mitglieder-Seite
   * holt das Kontingent beim Aufbau UND nach jeder abgelehnten Einladung. Wer
   * sich dabei den Community-Wechsler leerräumte, verlöre eine Funktion, die
   * mit dem Einladen nichts zu tun hat. Und NICHT der Bucket von
   * `community:invite` (max 5): fünf Einladungen plus deren
   * Kontingent-Nachfragen sperrten sich sonst gegenseitig aus.
   */
  { re: /^GET \/api\/community\/invites\/quota$/, bucket: 'community:invite-quota', max: TOKEN_MAX },
  // Missbrauchsmeldung (M13): ebenfalls session-los, verschickt Mail UND weckt
  // jeden Betreiber per Glocke. Etwas großzügiger als die Early-Access-Anfrage
  // (5 statt 3), weil bei einem echten Vorfall mehrere Menschen gleichzeitig
  // melden — und die kommen oft aus demselben Netz.
  { re: /^POST \/api\/abuse\/report$/, bucket: 'abuse:report', max: 5 },
  // BEWUSST NICHT gelistet: POST /api/stripe/webhook — Stripe-Retries dürfen
  // nie in den 429-Bucket laufen; ungelistete Routen sind hier ohnehin frei,
  // der Schutz des Webhooks ist die Signatur-Verifikation (billing B4).
]

export default defineEventHandler(async (event) => {
  const isWriteMethod = event.method === 'POST' || event.method === 'PUT' || event.method === 'PATCH'
  const pathname = getRequestURL(event).pathname
  const route = `${event.method} ${pathname}`
  // GET ist grundsätzlich frei — Ausnahme: explizit gelistete teure GETs (JWT-Mint).
  const write = WRITE_LIMITED.find(w => w.re.test(route))
  if (!isWriteMethod && !write) return
  const always = ALWAYS_LIMITED.has(route)
  const onFailure = FAILURE_LIMITED.has(route)
  if (!always && !onFailure && !write) return

  // `trustedClientIp` statt `getRequestIP(…, { xForwardedFor: true })`:
  // h3 nimmt das ERSTE X-Forwarded-For-Segment, unser nginx HÄNGT die echte IP
  // hinten AN — ein selbst gesetzter Header erzeugte damit pro Request einen
  // frischen Bucket und hebelte genau dieses Login-Limit aus (Audit
  // 2026-08-02). Begründung und Grenzen: server/utils/clientIp.ts.
  //
  // Fehlt die IP (exotische Proxy-Setups), NICHT alle Clients in einen
  // gemeinsamen 'unknown'-Topf werfen (sie würden sich gegenseitig aussperren) —
  // stattdessen auf die Session-Identität ausweichen; 'unknown' nur als letzter
  // Fallback für anonyme Requests ohne IP.
  const ip = trustedClientIp(event)
    ?? (event.context.user ? `user:${event.context.user.$id}` : undefined)
    ?? 'unknown'
  // Eigenes Budget pro Bucket bzw. Methode+Route — Login-/Reset-Versuche und
  // verschiedene Schreib-Aktionen verbrauchen nicht gegenseitig ihr Kontingent.
  const { store, prefix } = useRateLimitStore(event)
  const key = `${prefix}${ip}:${write ? write.bucket : route}`
  const max = write ? (write.max ?? WRITE_MAX) : MAX_ATTEMPTS

  // Zähl-Routen (always/write): hit() zählt UND prüft in einem Schritt (kein
  // peek/hit-Race, atomar in Redis) — der (max+1)-te Request im Fenster blockt.
  // Failure-Routen: nur lesen; gezählt wird erst nach 4xx/5xx-Antwort.
  const counting = always || Boolean(write)
  const state = counting ? await store.hit(key, WINDOW_MS) : await store.peek(key, WINDOW_MS)

  if (counting ? state.count > max : state.count >= max) {
    setHeader(event, 'Retry-After', Math.max(1, Math.ceil(state.resetInMs / 1000)))
    // Der GRUND reist als `data.code` — der zentrale Handler (server/error.ts)
    // hebt genau diesen Schlüssel als `reason` ins Envelope. Ohne ihn konnten
    // die Auth-Formulare eine Sperre nicht von einem echten Fehlversuch
    // unterscheiden und schrieben „Passwort falsch" bzw. „bitte erneut
    // versuchen" — beides falsch, und beides fordert genau die Handlung, die
    // gerade geblockt wird (Audit-Befund G7, 2026-08-09). Der Status allein
    // reicht dem Client nicht: eine 429 kann auch von einem vorgelagerten
    // Proxy kommen und trägt dann nicht unser Fenster.
    throw createError({ status: 429, statusText: 'Too Many Requests', data: { code: 'rate_limited' } })
  }

  if (!always && !write) {
    // Erst nach der Antwort entscheiden: nur 4xx/5xx (Fehlversuch) zählt.
    event.node.res.once('finish', () => {
      if (event.node.res.statusCode >= 400) void store.hit(key, WINDOW_MS)
    })
  }
})
