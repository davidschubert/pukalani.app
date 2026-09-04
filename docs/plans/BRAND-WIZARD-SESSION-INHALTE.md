# Brand-Wizard — die Inhalte der 68 Sessions

**GENERIERT aus `packages/brand/shared/sessionContent.ts` — nicht von Hand editieren.**
Korrekturen gehören in die Registry, danach `pnpm --filter @pukalani/brand print:sessions`.
Ein Test hält beides zusammen: Regenerieren darf keinen Diff erzeugen.

Struktur und Begründung: [BRAND-WIZARD-SESSIONS.md](BRAND-WIZARD-SESSIONS.md) §3/§3a ·
Inhaltsgrundlage: [BRAND-WIZARD-CONTENT-SPEC.md](BRAND-WIZARD-CONTENT-SPEC.md).

Die Ziel-, Qualitäts- und Anti-Muster-Texte sind ENGLISCH: sie reisen wörtlich in den
Prompt (Content-Spec §1.2 — sie beschreiben Verhalten, nicht Text). Die Beispiele stehen
in beiden Oberflächen-Sprachen, weil die Abnahme-Seite je Kapitel sie dem Kunden zeigt.

## Kontext (`context`) — 11 Sessions, **Σ ~14 Min** (35 Züge)

Interview-Technik: **George** (Markenberater). Gesprochen wird alles von George.

### `a.pitch` — Elevator-Pitch

**Art:** Ableitung · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft the elevator pitch of this brand: what they do, who it is for, and what is different about it, in two or three sentences.

**Woran man einen guten Wert erkennt:**

- Someone from outside the industry understands it after reading it once.
- It names who it is for, not only what is made.
- It carries at least one detail that comes from this brand and not from its industry.
- No sentence of it could be moved to a competitor page unchanged.

**Was zurückgewiesen wird:**

- A list of services instead of a sentence about what the customer gets.
- Superlatives with nothing behind them: leading, innovative, world-class.
- Trade jargon that only insiders can decode.

**Form des Werts:** Person: wir · Zeit: Präsens · höchstens 60 Wörter

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 27 Felder in 7 Kapiteln (Purpose, Vision & Mission · Markenarchitektur · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Wir sind ein Tagescafé mit eigener Backstube: Das Brot vom Vortag geht mittags in die Suppe, weggeworfen wird nichts. Für Leute, die zwischen zwei Terminen zwanzig Minuten sitzen und trotzdem etwas Warmes essen wollen.
  - en:
  > We are a daytime café with our own bakery: yesterday's bread goes into the midday soup, and nothing is thrown out. For people who want to sit for twenty minutes between two appointments and still eat something warm.
- **Marken-Relaunch**
  - de:
  > Wir kochen seit 1998 einen Mittagstisch für die Werkstätten und Büros im Viertel — zwei Gerichte am Tag, eines davon ohne Fleisch. Wer um halb eins kommt, sitzt um zehn nach eins wieder draußen.
  - en:
  > Since 1998 we have cooked a midday menu for the workshops and offices in this quarter — two dishes a day, one of them meat-free. Whoever arrives at half past twelve is back outside by ten past one.

### `a.category` — Kategorie

**Art:** Ableitung · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** name the industry / category this brand plays in, normalised to a term the industry itself uses.

**Woran man einen guten Wert erkennt:**

- Five words at most.
- It is a term the person would find in a trade directory.
- It excludes at least half of what a word like "agency" or "shop" would include.
- It says what they DO — the shelf they are compared on comes later.

**Was zurückgewiesen wird:**

- A slogan in place of a category: "we make things people love".
- A word so broad that every company fits: services, consulting, solutions.
- An invented category nobody is looking for.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · höchstens 5 Wörter

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 9 Felder in 4 Kapiteln (Purpose, Vision & Mission · Markenarchitektur · Tagline & Messaging · Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Tagescafé mit eigener Backstube
  - en:
  > Café with its own bakery
- **Marken-Relaunch**
  - de:
  > Mittagstisch für Betriebe im Viertel
  - en:
  > Midday canteen for local businesses

### `a.competitors` — Wettbewerber

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** intern — reist nicht per Share-Link

**Ziel:** write 3-5 short competitor profiles.

**Woran man einen guten Wert erkennt:**

- Every name in the list appears literally in the inputs.
- Each line carries one strength and one weakness, both of them things a customer would notice.
- Anything you could only infer is marked as an assumption in the line itself.
- The weakness is a fact about the offer, not a judgement about the company.

**Was zurückgewiesen wird:**

- Invented competitors that merely sound plausible for the industry.
- Filler such as "not stated in the inputs" instead of a point.
- A strength and a weakness that are the same sentence in two moods.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 9 Felder in 4 Kapiteln (Purpose, Vision & Mission · Markenarchitektur · Tagline & Messaging · Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - (Name aus den Eingaben) — stark: mittags in elf Minuten am Tisch — schwach: dieselbe Karte seit Jahren
  - en:
  > - (name from the inputs) — strong: lunch on the table in eleven minutes — weak: the same menu for years
- **Marken-Relaunch**
  - de:
  > - (Name aus den Eingaben) — Annahme, bitte prüfen: nach 14 Uhr gibt es nichts Warmes mehr
  - en:
  > - (name from the inputs) — assumption, please verify: nothing hot is served after two in the afternoon

### `a.audienceSketch` — Zielgruppen-Skizze

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** sketch the audience of this brand: who they are, what they want, and what holds them back.

**Woran man einen guten Wert erkennt:**

- Each block says what these people are trying to get done, not how old they are.
- What holds them back is a real obstacle, not their ignorance of this brand.
- Three blocks at most — a brand that serves everyone serves nobody.
- Someone who takes the calls would recognise these people from the description.

**Was zurückgewiesen wird:**

- Demographics standing in for a need: "women, 30 to 45, urban".
- An audience described as "everyone who needs what we do".
- "They do not know us yet" as the obstacle.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 14 Felder in 5 Kapiteln (Purpose, Vision & Mission · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > ## Wer
  > Leute aus den Büros zwei Straßen weiter, die mittags raus wollen
  > 
  > ## Was sie wollen
  > In zwanzig Minuten etwas Warmes, ohne vorher zu bestellen
  > 
  > ## Was sie bremst
  > Die Sorge, um halb eins keinen Platz mehr zu bekommen
  - en:
  > ## Who
  > People from the offices two streets away who want to get out at lunchtime
  > 
  > ## What they want
  > Something warm within twenty minutes, without ordering ahead
  > 
  > ## What holds them back
  > The worry that there will be no table left at half past twelve
- **Marken-Relaunch**
  - de:
  > ## Wer
  > Handwerker auf dem Weg zur nächsten Baustelle
  > 
  > ## Was sie wollen
  > Ein Essen, das satt macht und nicht nach Diät aussieht
  > 
  > ## Was sie bremst
  > Der Eindruck, mit staubiger Hose hier fehl am Platz zu sein
  - en:
  > ## Who
  > Tradespeople on the way to the next building site
  > 
  > ## What they want
  > A meal that fills them up and does not look like a diet
  > 
  > ## What holds them back
  > The sense that dusty work trousers are out of place here

### `a.toneAnalysis` — Tonalität eurer bestehenden Texte

**Art:** Ableitung (optional) · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** analyse the tone of the existing texts contained in the inputs below.

**Woran man einen guten Wert erkennt:**

- Every trait carries a short phrase quoted from their own texts.
- Three to five traits, no more.
- It describes how they sound TODAY, not how they ought to sound.
- A reader could find the quoted phrase on their site.

**Was zurückgewiesen wird:**

- A trait with no quote behind it.
- Advice about how the brand should sound instead of a reading of how it does.
- A tone analysis written although no existing text was given.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · höchstens 70 Wörter

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 22 Felder in 5 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Knapp und ohne Werbung — „Brot vom Vortag geht in die Suppe." Viel Handwerk, keine Adjektive. Distanziert: die Seite spricht niemanden direkt an.
  - en:
  > Short and free of advertising — "yesterday's bread goes into the soup". A lot of craft, no adjectives. Distant: the site never addresses anyone directly.
- **Marken-Relaunch**
  - de:
  > Werbend bis laut — „Der beste Mittagstisch der Stadt." Viele Superlative, und nirgends steht, was tatsächlich auf der Karte steht.
  - en:
  > Advertising, verging on loud — "the best midday menu in town". Plenty of superlatives, and nowhere does it say what is actually on the menu.

### `a.origin` — Warum hast du angefangen — was war der Auslöser, welches Problem konntest du nicht ignorieren?

**Art:** Frage · **Umfang:** ~2 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture why this brand was started — or, on a relaunch, what about the current brand must survive the relaunch.

**Woran man einen guten Wert erkennt:**

- It names a concrete trigger: a moment, a job, a person, a year.
- It says which problem was unbearable enough to act on.
- It is told as something that happened, not as a mission statement.
- On a relaunch it names one thing that must stay and one that goes, each with a reason.

**Was zurückgewiesen wird:**

- A founding myth polished into marketing: "we saw an opportunity in a growing market".
- A curriculum vitae instead of a reason.
- On a relaunch: "everything has to change", without one thing worth keeping.

**Gesprächsleiter:**

- Eröffnung: the smallest concrete thing — the moment or the job that started it.
- Nachfrage: what happened right before that, and what was the last straw?
- Nachfrage: who else was in the room, and what did they say?
- Umdeutung: if the answer is a market opportunity, ask what personally annoyed them about the way it was done before
- Umdeutung: if the answer is a career history, ask which single job made them think: never again like that

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: ausführlich · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 23 Felder in 7 Kapiteln (Purpose, Vision & Mission · Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Drei Jahre habe ich in einer Kantine gekocht und jeden Abend zwei Bleche Brot in die Tonne geworfen. An dem Abend, an dem ich den Sack nicht mehr zubinden wollte, habe ich gekündigt und den Laden hier gemietet.
  - en:
  > For three years I cooked in a staff canteen and threw two trays of bread into the bin every evening. On the evening I could not bring myself to tie up the bag again, I quit and rented this place.
- **Marken-Relaunch**
  - de:
  > Bleiben muss der Name und die blaue Tafel neben der Tür — daran findet uns die Nachbarschaft seit 1998. Weg muss das Wort „Gaststätte": es holt niemanden mehr herein, der unter vierzig ist.
  - en:
  > The name stays, and the blue board next to the door — the neighbourhood has found us by it since 1998. What goes is the word "Gaststätte": nobody under forty walks in because of it.

### `a.customerPraise` — Was sagen deine glücklichsten Kunden über euch — in DEREN Worten?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture the sentence their happiest customers say about them, in the words the customers use.

**Woran man einen guten Wert erkennt:**

- It is one sentence a customer actually said, in that customer's words.
- It is specific enough that another company could not have received it.
- It praises a behaviour or a moment, not a product feature.
- It could be printed with quotation marks around it.

**Was zurückgewiesen wird:**

- A summary of feedback: "customers value our reliability".
- A review rewritten in company voice.
- A star rating with no sentence in it.

**Gesprächsleiter:**

- Eröffnung: one sentence, verbatim, the way a customer said it.
- Nachfrage: when did you last hear it, and what had just happened?
- Nachfrage: who said it, and what were they reacting to?
- Umdeutung: if the answer summarises many customers, ask for the last single person who said something
- Umdeutung: if the answer is a feature, ask for the moment where that feature mattered to someone

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 29 Felder in 7 Kapiteln (Purpose, Vision & Mission · Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > „Ihr seid die Einzigen, die mir nicht das letzte Stück Kuchen aufschwatzen, wenn es schon trocken ist."
  - en:
  > "You are the only ones who do not talk me into the last piece of cake when it has already gone dry."
- **Marken-Relaunch**
  - de:
  > „Bei euch weiß ich um halb eins, dass ich um eins wieder auf der Baustelle stehe."
  - en:
  > "With you I know at half past twelve that I will be back on site by one."

### `a.complaints` — Welche Beschwerden oder Kritik bekommt ihr? Ehrlich — das ist so wertvoll wie das Lob.

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** intern — reist nicht per Share-Link

**Ziel:** capture the complaints and negative feedback this brand actually gets, unvarnished.

**Woran man einen guten Wert erkennt:**

- It quotes or paraphrases a complaint that was really made.
- It is uncomfortable enough that no marketing page would print it.
- It says what triggered the complaint, not only the mood it arrived in.
- It does not excuse itself in the same breath.

**Was zurückgewiesen wird:**

- A humblebrag: "we are sometimes too thorough".
- "We have no complaints."
- A complaint blamed entirely on the customer.

**Gesprächsleiter:**

- Eröffnung: the last complaint they actually received, in the words it arrived in.
- Nachfrage: what had happened right before that call or that mail?
- Nachfrage: is that a one-off, or does it come back every few months?
- Umdeutung: if the answer is a humblebrag, ask what the angriest customer of the last year said
- Umdeutung: if the answer is "none", ask what people quietly stop doing instead of complaining

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 19 Felder in 6 Kapiteln (Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > „Zweimal hintereinander war um 13 Uhr die Suppe alle, und auf der Tafel stand sie noch."
  - en:
  > "Twice in a row the soup was gone by one o'clock, and it was still up on the board."
- **Marken-Relaunch**
  - de:
  > „Seit die Karte geändert wurde, gibt es nichts mehr, was mein Vater essen kann — gesagt hat uns das niemand."
  - en:
  > "Since the menu changed there is nothing my father can eat, and nobody told us in advance."

### `a.oneThing` — Was ist das eine, von dem du dir wünschst, dass es jeder Kunde über euch wüsste?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture the one thing they wish every customer knew about them.

**Woran man einen guten Wert erkennt:**

- It is one thing, not a list.
- It is something customers demonstrably do not know today.
- Knowing it would change a decision a customer makes.
- It is checkable, not a claim about attitude.

**Was zurückgewiesen wird:**

- A slogan: "that we really care".
- Three things joined by commas.
- Something their own front page already says.

**Gesprächsleiter:**

- Eröffnung: the one sentence they wish every customer already knew.
- Nachfrage: what do people get wrong about you again and again?
- Nachfrage: what would be different for a customer who knew it before the first call?
- Umdeutung: if the answer is a claim about attitude, ask for the fact behind it
- Umdeutung: if there are three, ask which one costs them the most misunderstandings

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 10 Felder in 4 Kapiteln (Purpose, Vision & Mission · Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Dass wir das Brot am selben Morgen backen und nach 15 Uhr zum halben Preis abgeben, statt es wegzuwerfen.
  - en:
  > That we bake the bread the same morning and sell it at half price after three instead of throwing it away.
- **Marken-Relaunch**
  - de:
  > Dass jedes zweite Gericht ohne Fleisch ist — auf der Tafel steht das seit zwanzig Jahren nicht. Dass jedes zweite Gericht ohne Fleisch ist — auf der Tafel steht das seit zwanzig Jahren nicht.
  - en:
  > That every second dish is meat-free — the board has never said so in twenty years.

### `a.challenge` — Was ist gerade das größte Hindernis vor euch?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** intern — reist nicht per Share-Link

**Ziel:** capture the biggest obstacle standing in front of this brand right now.

**Woran man einen guten Wert erkennt:**

- It names one obstacle, and it is the one actually in the way this month.
- It is specific enough to say what would have to change.
- It is honest about their own part in it.
- It is more than "we need more customers".

**Was zurückgewiesen wird:**

- "The economy" or "the market", with nothing in it they control.
- A goal dressed up as an obstacle: "growing to ten people".
- A list of five problems.

**Gesprächsleiter:**

- Eröffnung: the one thing that is actually in the way right now.
- Nachfrage: what did it stop you from doing in the last four weeks?
- Nachfrage: what would have to be true for it to be gone?
- Umdeutung: if the answer is the market, ask what they would change tomorrow if they could
- Umdeutung: if the answer is a goal, ask what stands between them and it

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Zwischen 11 und 14 Uhr platzen wir, den Rest des Tages steht die Backstube still — die zweite Kraft bekommen wir aber nur ganztags.
  - en:
  > Between eleven and two we burst at the seams, and the rest of the day the bakery stands still — but the second baker is only available full time.
- **Marken-Relaunch**
  - de:
  > Die Stammgäste sind mit uns in Rente gegangen. Die neuen Büros im Viertel bestellen mittags beim Lieferdienst.
  - en:
  > Our regulars retired when we got older. The new offices in the quarter order lunch from a delivery service.

### `a.facts` — Ein paar schnelle Zahlen: Wie groß ist das Team, wie lange gibt es euch, welche Märkte?

**Art:** Sammlung · **Umfang:** ~1 Min, 3 Züge · **Vertraulichkeit:** intern — reist nicht per Share-Link

**Ziel:** collect the plain facts of this brand: how big the team is, how long it has existed and which markets it serves.

**Woran man einen guten Wert erkennt:**

- Every part carries a number or a plain "not yet".
- The team size counts the people who actually work in it, freelancers named as such.
- The age is a year, not "for a long time".
- The markets are named places or channels where money actually came in.

**Was zurückgewiesen wird:**

- "A small, dedicated team" instead of a number.
- "Since forever" instead of a year.
- "Worldwide" for a business that ships inside one country.

**Teile (nacheinander gefragt):**

- `teamSize` — Wie viele Leute arbeiten mit — feste und freie zusammen?
- `age` — Seit wann gibt es euch? Ein Jahr reicht.
- `markets` — Wo verkauft ihr wirklich — welche Orte, welche Kanäle?

**Gesprächsleiter:**

- Eröffnung: three quick facts, one at a time: team, age, markets.
- Nachfrage: does that number include freelancers and part-timers?
- Nachfrage: in which of those markets did you actually sell something last year?
- Umdeutung: if a number is missing, offer the range you can read from the inputs and ask for a yes or no
- Umdeutung: if the answer is "worldwide", ask for the three places the money really comes from

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Team: 3 fest, 1 Aushilfe am Wochenende · Seit: 2023 · Märkte: das Viertel und ein Stand auf dem Wochenmarkt
  - en:
  > Team: 3 permanent, 1 weekend helper · Since: 2023 · Markets: this quarter and a stall at the weekly market
- **Marken-Relaunch**
  - de:
  > Team: 7 Angestellte, davon 3 in Teilzeit · Seit: 1998 · Märkte: das Viertel, dazu Mittagslieferung an vier Betriebe
  - en:
  > Team: 7 employees, 3 of them part-time · Since: 1998 · Markets: this quarter, plus lunch deliveries to four firms

## Purpose, Vision & Mission (`pvm`) — 10 Sessions, **Σ ~14 Min** (35 Züge)

Interview-Technik: **Vera** (Strategin). Gesprochen wird alles von George.

### `b.whyStarted` — Du hast mir schon erzählt, wie es angefangen hat. In einem Satz: Warum zählt das heute noch?

**Art:** Frage · **Umfang:** ~2 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** turn what this person already told you about the beginning of this brand into ONE sentence about why that still matters TODAY.

**Woran man einen guten Wert erkennt:**

- One sentence, two at the very most.
- It says why it matters today, not how it began.
- The reason is traceable to something they already said.
- It stays true when the founding anecdote is removed.

**Was zurückgewiesen wird:**

- The founding anecdote retold in place of the reason.
- A purpose statement smuggled in early: "we exist to change the world of ...".
- A reason any company in the industry could claim.

**Gesprächsleiter:**

- Eröffnung: the reason inside their own origin story, offered back in one sentence.
- Nachfrage: is that still the reason, or has it shifted since?
- Umdeutung: if it comes back as an anecdote, ask what of it is still true on an ordinary Tuesday

**Form des Werts:** Person: wir · Zeit: Präsens · höchstens 30 Wörter

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 15 Felder in 5 Kapiteln (Purpose, Vision & Mission · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Weil die meisten Rücken nicht mehr Dehnung brauchen, sondern jemanden, der beim ersten Mal danebensteht.
  - en:
  > Because most backs do not need more stretching, they need somebody standing beside them the first time.
- **Marken-Relaunch**
  - de:
  > Weil eine Stunde, die niemand versteht, keine Ruhe bringt, sondern ein schlechtes Gewissen.
  - en:
  > Because an hour nobody understands brings no calm, only a bad conscience.

### `b.worldLoses` — Was ginge der Welt verloren, wenn ihr morgen zumacht? Wirkung, nicht Umsatz.

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture what the world would lose if this brand shut down tomorrow — impact, not revenue.

**Woran man einen guten Wert erkennt:**

- It names something concrete that would stop happening.
- It is about people outside the company.
- It is not measured in revenue or in jobs.
- Someone who never heard of this brand would still see the loss.

**Was zurückgewiesen wird:**

- The revenue answer: "our customers would have to go elsewhere".
- An answer about the team losing their jobs.
- A claim of being irreplaceable with nothing behind it.

**Gesprächsleiter:**

- Eröffnung: what would stop happening if they closed tomorrow.
- Nachfrage: who would notice first, and what would they do instead?
- Nachfrage: would somebody else simply take it over, or would it really stop?
- Umdeutung: if the answer is about turnover, ask who would be left without something
- Umdeutung: if the answer is "someone else would do it", ask what would then be done WORSE

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 15 Felder in 5 Kapiteln (Purpose, Vision & Mission · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Dann gäbe es hier keinen Kurs mehr, in dem jemand mit Bandscheibenvorfall in der ersten Reihe stehen darf.
  - en:
  > There would be no class left here where somebody with a slipped disc is allowed to stand in the front row.
- **Marken-Relaunch**
  - de:
  > Zwölf Leute, die seit Jahren dienstags um sieben kommen, hätten keinen festen Termin mehr, an dem jemand ihren Namen kennt.
  - en:
  > Twelve people who have come at seven on Tuesdays for years would lose the one fixed hour where somebody knows their name.

### `b.conviction` — Welche Überzeugung treibt euch — die, die ihr auch verteidigt, wenn sie euch etwas kostet?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture the belief that drives this company — the one they would defend even when it costs them.

**Woran man einen guten Wert erkennt:**

- It is a belief someone could openly disagree with.
- It has already cost them something, and they can say what.
- It is stated as a claim about the world, not about themselves.
- It fits into one sentence.

**Was zurückgewiesen wird:**

- A belief nobody would contradict: "quality matters".
- A list of value words instead of a conviction.
- A conviction that has never cost anything.

**Gesprächsleiter:**

- Eröffnung: the belief they would defend even when it costs them.
- Nachfrage: when did holding it last cost you money or a customer?
- Nachfrage: who in your industry would openly disagree with it?
- Umdeutung: if nobody could disagree, ask for the version their competitor would refuse to sign
- Umdeutung: if it is a list of values, ask which one they have already paid for

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 22 Felder in 7 Kapiteln (Purpose, Vision & Mission · Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Wer eine Übung nicht kann, ist nicht zu unbeweglich — die Übung kommt zu früh. Das hat uns schon zwei Kursleiterinnen gekostet.
  - en:
  > Somebody who cannot do a pose is not too stiff — the pose came too early. That has already cost us two teachers.
- **Marken-Relaunch**
  - de:
  > Yoga ist kein Wellness. Wir haben die Kerzen und die Klangschale abgeschafft und dabei ein Drittel der Anmeldungen verloren.
  - en:
  > Yoga is not wellness. We dropped the candles and the singing bowl and lost a third of the sign-ups doing it.

### `b.tenYears` — In zehn Jahren: Was sieht in der Welt anders aus, weil es euch gab?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture what looks different in the world ten years from now because this brand existed.

**Woran man einen guten Wert erkennt:**

- It describes a state of the world, not a company milestone.
- Somebody could tell whether it has arrived or not.
- It is bigger than this brand and still connected to it.
- It contains no target figures.

**Was zurückgewiesen wird:**

- A growth plan: "three locations, twenty employees".
- A world so large the brand plays no part in it.
- The mission repeated in the future tense.

**Gesprächsleiter:**

- Eröffnung: what looks different in the world in ten years because they existed.
- Nachfrage: who would notice that change without ever hearing your name?
- Nachfrage: what is ordinary by then that is unusual today?
- Umdeutung: if the answer is a growth plan, ask what that growth would make possible for other people
- Umdeutung: if the answer is a better world in general, ask which corner of it they can actually touch

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 8 Felder in 4 Kapiteln (Purpose, Vision & Mission · Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > In zehn Jahren schickt die Hausärztin nach der Reha nicht nur zur Physiotherapie, sondern in einen Kurs, der weitergeht.
  - en:
  > In ten years a family doctor sends people after rehab not only to physiotherapy but into a class that keeps going.
- **Marken-Relaunch**
  - de:
  > Eine Übungsstunde ist dann so selbstverständlich wie Schwimmen — man geht hin, ohne dabei etwas werden zu wollen.
  - en:
  > By then a practice hour is as ordinary as swimming: people go without wanting to become anything.

### `b.legacy` — Wenn man in 20 Jahren über euch spricht — was sollen die Leute sagen?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture what people should be saying about this brand in twenty years.

**Woran man einen guten Wert erkennt:**

- It is a sentence somebody else would say, in that person's words.
- It names something they did, not something they were.
- It survives the founder leaving.
- It is modest enough to be believable.

**Was zurückgewiesen wird:**

- A eulogy for the founder rather than for the brand.
- A superlative: "the best in the region".
- The ten-year answer said again.

**Gesprächsleiter:**

- Eröffnung: the sentence people should be saying about them in twenty years.
- Nachfrage: who says it — a customer, a colleague, a competitor?
- Nachfrage: what did you have to do so that they could say it?
- Umdeutung: if it is about the founder, ask what should be said about the workshop after they stop
- Umdeutung: if it is a superlative, ask what somebody would point at as proof

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 8 Felder in 4 Kapiteln (Purpose, Vision & Mission · Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > „Da konnte man mit einem kaputten Rücken anfangen, ohne sich zu schämen."
  - en:
  > "You could start there with a wrecked back and not feel ashamed."
- **Marken-Relaunch**
  - de:
  > „Die haben nie behauptet, dass eine Stunde das Leben verändert — und alle kamen trotzdem wieder."
  - en:
  > "They never claimed an hour would change your life, and everybody came back anyway."

### `b.purpose` — Purpose

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft the PURPOSE of this brand — the WHY. The reason it exists beyond making money.

**Woran man einen guten Wert erkennt:**

- One sentence.
- It names why the world is better, not what the company sells.
- No competitor in this industry could say it word for word.
- No product, service or feature is mentioned in it.
- A founder could say it out loud without wincing.

**Was zurückgewiesen wird:**

- A sentence assembled from quality, passion and innovation.
- The formula left visible: "we exist so that customers get value".
- A growth or revenue goal in disguise.

**Form des Werts:** Person: wir · Zeit: Präsens · höchstens 25 Wörter · nie darin: the brand name; product or service names; numbers and targets

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 14 Felder in 5 Kapiteln (Purpose, Vision & Mission · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Damit ein schmerzender Rücken kein Grund mehr ist, sich vom Bewegen ganz zu verabschieden.
  - en:
  > So that an aching back stops being a reason to give up on moving altogether.
- **Marken-Relaunch**
  - de:
  > Damit Ruhe nichts ist, das man kaufen muss, sondern etwas, das man üben kann.
  - en:
  > So that calm is not something to be bought but something that can be practised.

### `b.vision` — Vision

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft the VISION of this brand — the WHERE TO. The world once they have succeeded.

**Woran man einen guten Wert erkennt:**

- One sentence describing a state that HAS arrived.
- It contains no figure, market share or headcount.
- A stranger could tell whether the world is there yet.
- It reaches further than a plan and still points at today.

**Was zurückgewiesen wird:**

- A target: "market leader in the region by 2035".
- An intention instead of a picture: "we want X to become normal".
- A world so vague that this brand is not in it.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · höchstens 25 Wörter · nie darin: numbers, market shares and headcounts; the words "we want" and "we will"

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 7 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Ein Anfängerkurs ist selbstverständlich der mit der besten Betreuung, nicht der billigste im Plan.
  - en:
  > A beginners class is obviously the one with the closest attention, not the cheapest on the timetable.
- **Marken-Relaunch**
  - de:
  > Niemand entschuldigt sich mehr dafür, nur wegen des Rückens zu kommen und nicht wegen der Erleuchtung.
  - en:
  > Nobody apologises any more for coming because of their back rather than for enlightenment.

### `b.mission` — Mission

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft the MISSION of this brand — the HOW. What they do every day to get towards the vision.

**Woran man einen guten Wert erkennt:**

- One sentence: what they do, for whom, to what end.
- Concrete enough that a new colleague could act on it tomorrow.
- It sits under the purpose instead of repeating it.
- Active voice, present tense, no conditional.

**Was zurückgewiesen wird:**

- A second purpose: another sentence beginning "we exist to".
- A list of services.
- A sentence whose only verb is "provide" or "offer".

**Form des Werts:** Person: wir · Zeit: Präsens · höchstens 30 Wörter

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 8 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Wir unterrichten in Gruppen von höchstens acht und gehen bei jeder Übung einmal durch die Reihe, damit niemand falsch übt.
  - en:
  > We teach in groups of no more than eight and walk the room during every pose, so that nobody practises it wrong.
- **Marken-Relaunch**
  - de:
  > Wir erklären vor jeder Übung, was sie im Körper tut, und lassen die Sanskrit-Namen weg, bis jemand danach fragt.
  - en:
  > We explain what each pose does in the body before we teach it, and leave the Sanskrit names out until somebody asks.

### `b.positioningCategory` — In welcher Kategorie spielt ihr?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** propose the CATEGORY this brand plays in — the shelf people mentally put it on.

**Woran man einen guten Wert erkennt:**

- It names the shelf they are compared on, not the trade they practise.
- Somebody is already looking for that category.
- It excludes at least half of the industry.
- It can be said in five words.

**Was zurückgewiesen wird:**

- The industry repeated as a category.
- A category that exists only inside this one sentence.
- A category so broad that every competitor is on the same shelf.

**Gesprächsleiter:**

- Eröffnung: name the shelf, say in one sentence why, then append the alternatives as options.
- Nachfrage: who would you be compared against on that shelf?
- Umdeutung: if they take the broadest option, ask which half of it they would rather not be measured against

**Form des Werts:** Person: ohne Person · Zeit: Präsens · höchstens 5 Wörter

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 3 Felder in 2 Kapiteln (Markenarchitektur · Tagline & Messaging)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Rückenkurse für Wiedereinsteiger — nicht „Yoga"
  - en:
  > Back classes for returners — not "yoga"
- **Marken-Relaunch**
  - de:
  > Übungsraum statt „Wellness-Studio"
  - en:
  > A practice room, not "wellness"

### `b.positioningFirstChoice` — Und in dieser Kategorie: Für wen seid ihr die ERSTE Wahl — und gegen wen?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture for whom this brand is the FIRST choice inside its category, and against whom.

**Woran man einen guten Wert erkennt:**

- It names one group for whom they are the first call.
- It names who they are the first choice AGAINST.
- The group is small enough to be recognisable.
- Somebody in that group would agree with the description.

**Was zurückgewiesen wird:**

- "Everyone who values quality."
- A first choice with no competitor named.
- A group defined by budget alone.

**Gesprächsleiter:**

- Eröffnung: for whom, inside that category, they are the first call — and instead of whom.
- Nachfrage: who do those people call if not you, and why do they call you first?
- Nachfrage: which kind of job would you rather send on to somebody else?
- Umdeutung: if the answer is "everyone", ask who has called twice this year and why
- Umdeutung: if no competitor is named, ask who else was on the list the last time they were chosen

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 1 Felder in 1 Kapiteln (Tagline & Messaging)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Für Leute, die nach der Reha weitermachen sollen und sich in ein volles Fitnessstudio nicht trauen — gegen die Volkshochschulkurse mit dreißig Teilnehmern.
  - en:
  > For people told to keep going after rehab who do not dare walk into a busy gym — against the adult-education classes with thirty people in the room.
- **Marken-Relaunch**
  - de:
  > Für Berufstätige, die abends eine feste Stunde brauchen — gegen die Studios mit Zehnerkarte, in denen jede Woche jemand anderes unterrichtet.
  - en:
  > For working people who need one fixed hour in the evening — against the studios with a ten-class pass where somebody different teaches every week.

## Markenarchitektur (`architecture`) — 5 Sessions, **Σ ~6 Min** (17 Züge)

Interview-Technik: **Vera** (Strategin). Gesprochen wird alles von George.

### `b2.visibility` — Sollen eure Produktmarken sichtbar zur Hauptmarke gehören — oder eigenständig auftreten?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle whether the other brands should visibly belong to the main brand or stand on their own.

**Woran man einen guten Wert erkennt:**

- The answer is a decision, not a preference.
- It says what the CUSTOMER should see, not what the ownership looks like.
- It gives one reason.
- It holds for all the sub-brands, or it names the exception.

**Was zurückgewiesen wird:**

- "It depends", without naming what it depends on.
- An answer about internal ownership instead of what a customer sees.
- Both at once — "visible but independent" — with no rule for the conflict.

**Gesprächsleiter:**

- Eröffnung: what a customer should see on the product: the main brand, or not.
- Nachfrage: what should somebody assume about the main brand when they meet the product first?
- Umdeutung: if the answer is "it depends", take the case that comes up most often and decide that one

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 2 Felder in 1 Kapiteln (Markenarchitektur)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Sichtbar. Wer das Rechnungsmodul kauft, soll wissen, dass es aus demselben Haus kommt wie die Zeiterfassung.
  - en:
  > Visible. Whoever buys the invoicing module should know it comes from the same house as the time tracking.
- **Marken-Relaunch**
  - de:
  > Eigenständig. Das Werkzeug für Freiberufler darf nicht nach Lohnbuchhaltung für Konzerne aussehen, sonst probiert es niemand aus.
  - en:
  > On its own. The tool for freelancers must not look like corporate payroll, or nobody will ever try it.

### `b2.roleOfMaster` — Soll die Hauptmarke ihnen Vertrauen leihen — oder dürfen sie Publika erreichen, die die Hauptmarke nicht erreicht?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle whether the main brand lends the other brands its trust, or leaves them free to reach audiences the main brand cannot.

**Woran man einen guten Wert erkennt:**

- It names what the main brand gives the others: trust, reach, or nothing.
- It also names what the main brand costs them.
- It is honest about the audiences the main brand cannot reach.
- It is one decision, not two options side by side.

**Was zurückgewiesen wird:**

- "Both", with no rule for the case where they collide.
- An answer that only lists the advantages of the main brand.
- A statement about reporting lines instead of about customers.

**Gesprächsleiter:**

- Eröffnung: whether the main brand lends trust here, or gets in the way.
- Nachfrage: which customers would be put off if the main brand were on it?
- Umdeutung: if the answer is "both", ask which of the two they would give up if forced

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 2 Felder in 1 Kapiteln (Markenarchitektur)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Vertrauen leihen. Wer Steinlach schon einsetzt, testet das zweite Modul ohne Ausschreibung — ohne den Hausnamen wäre es eines von zwanzig.
  - en:
  > Lend trust. Anyone already running Steinlach will test the second module without a tender — without the house name it would be one of twenty.
- **Marken-Relaunch**
  - de:
  > Freilassen. Die Freiberufler-Marke erreicht Leute, die bei Meerkamp nie anfragen würden, weil sie dort eine Personalabteilung vermuten.
  - en:
  > Set it free. The freelancer brand reaches people who would never approach Meerkamp, because they assume an HR department behind it.

### `b2.namingPattern` — Wie dürfen sie HEISSEN — „Marke Produkt", oder eigene Namen?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle how the other brands are allowed to be named — as "Brand Product" or with names of their own.

**Woran man einen guten Wert erkennt:**

- It is a pattern somebody could apply to the next product without asking.
- It says what is NOT allowed as well as what is.
- It fits the visibility decision they already made.
- It works for a product nobody has thought of yet.

**Was zurückgewiesen wird:**

- A list of existing product names instead of a rule.
- A rule with an exception for every name that already exists.
- "Case by case."

**Gesprächsleiter:**

- Eröffnung: how the next product may be named — the pattern, not the examples.
- Nachfrage: does that rule still work for a product in a completely different field?
- Umdeutung: if the answer is a list of names, ask what those names have in common

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 2 Felder in 1 Kapiteln (Markenarchitektur)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Immer der Hausname vorn, dann die Aufgabe: „Steinlach Rechnung", „Steinlach Zeit". Keine Fantasienamen, keine Versionsnummer im Namen.
  - en:
  > Always the house name first, then the job it does: "Steinlach Rechnung", "Steinlach Zeit". No invented names, no version number in the name.
- **Marken-Relaunch**
  - de:
  > Eigene Namen sind erlaubt, aber nie mit unserem Kürzel davor — sonst hält es jeder für ein Zusatzmodul.
  - en:
  > Names of their own are allowed, but never with our initials in front — otherwise everyone reads it as an add-on module.

### `b2.model` — Welches Architektur-Modell passt zu euch?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** propose the brand ARCHITECTURE model for this brand.

**Woran man einen guten Wert erkennt:**

- The model follows from their three answers, and the reason says how.
- The BASIS line names what this model costs them.
- It is one of the four models, called by its catalogue name.
- It would still hold for a product they have not invented yet.

**Was zurückgewiesen wird:**

- A fifth, invented model, or a "hybrid" that avoids the decision.
- A model chosen because it is the most common one.
- A recommendation with no price named.

**Gesprächsleiter:**

- Eröffnung: name the model, say why and what it costs, then append the four as options.
- Nachfrage: does that still work if you add a product in a different field?
- Umdeutung: if they want a hybrid, ask which of the four a customer would see first

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 1 Felder in 1 Kapiteln (Markenarchitektur)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Branded House — alles läuft unter Steinlach, weil das Haus selbst das Versprechen ist.
  - en:
  > Branded house — everything runs under Steinlach, because the house itself is the promise.
- **Marken-Relaunch**
  - de:
  > Endorsed — die Freiberufler-Marke tritt eigenständig auf und trägt klein „von Meerkamp".
  - en:
  > Endorsed — the freelancer brand stands on its own and carries a small "from Meerkamp".

### `b2.rule` — Eure Namensregel

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** write the NAMING RULE that follows from the architecture model they chose.

**Woran man einen guten Wert erkennt:**

- Somebody naming the next product could apply it without asking.
- It says what the name must contain, what it must not, and who decides.
- It carries two or three examples from their own context.
- Four sentences at most, examples included.

**Was zurückgewiesen wird:**

- A rule illustrated with "Brand Product A".
- A rule that contradicts the architecture model they chose.
- A rule with nobody named as the decider.

**Form des Werts:** Person: wir · Zeit: Präsens · höchstens 80 Wörter

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Jedes neue Modul heißt „Steinlach" plus die Aufgabe in einem Wort. Keine Fantasienamen, keine Jahreszahl. Über Ausnahmen entscheidet die Produktleitung, nicht der Vertrieb.
  - en:
  > Every new module is called "Steinlach" plus the job it does, in one word. No invented names, no year. Product management decides on exceptions, not sales.
- **Marken-Relaunch**
  - de:
  > Untermarken tragen einen eigenen Namen und im Impressum immer „von Meerkamp". Nie das Kürzel im Namen selbst. Jeden neuen Namen gibt die Geschäftsführung frei.
  - en:
  > Sub-brands carry a name of their own and always the line "from Meerkamp" in the legal notice. Never the initials in the name itself. The managing directors sign off every new name.

## Werte (`values`) — 9 Sessions, **Σ ~14 Min** (32 Züge)

Interview-Technik: **Milo** (Werte-Berater). Gesprochen wird alles von George.

### `c.discovery1` — Denk an einen Moment, in dem euer Geschäft am besten war. Was ist da passiert?

**Art:** Frage · **Umfang:** ~2 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture a moment when this business was at its best, told as a scene and not as an adjective.

**Woran man einen guten Wert erkennt:**

- It is one scene with a place, a time and people in it.
- Something was decided or done, not only felt.
- A listener could say what was at stake.
- No other company could tell this scene.

**Was zurückgewiesen wird:**

- An adjective instead of a scene: "when we are at our best we are reliable".
- A whole period: "the first year was great".
- A customer testimonial retold as their own memory.

**Gesprächsleiter:**

- Eröffnung: one day when the business was at its best — as a scene, not as a summary.
- Nachfrage: what happened first, and what did you do next?
- Nachfrage: who else was there, and what did they say afterwards?
- Umdeutung: if the answer is an adjective, ask for the day that made them use that word
- Umdeutung: if it is a whole period, ask for the single moment inside it they remember best

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: ausführlich · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 19 Felder in 6 Kapiteln (Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Eine Kundin kam nach drei gescheiterten Diäten. In der vierten Woche hat sie zum ersten Mal wieder gefrühstückt, statt bis mittags zu warten, und mir das aus dem Zug geschrieben.
  - en:
  > A client came to us after three failed diets. In the fourth week she had breakfast again for the first time instead of waiting until noon, and wrote to me about it from the train.
- **Marken-Relaunch**
  - de:
  > Nach dem Wasserrohrbruch stand die halbe Frühgruppe im Flur. Der Trainer hat die Stunde abgesagt und stattdessen mit allen eine Stunde im Hof trainiert.
  - en:
  > After the burst pipe half the early group stood in the corridor. The trainer called the session off and trained everybody in the yard for an hour instead.

### `c.discovery2` — Denk an einen Moment, in dem sich etwas zutiefst falsch angefühlt hat. Was war da los?

**Art:** Frage · **Umfang:** ~2 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture a moment when something felt deeply wrong in this business, told as a scene.

**Woran man einen guten Wert erkennt:**

- It is a scene, and the discomfort has a cause somebody could name.
- They say what they did about it, or that they did nothing.
- It is about their own work, not about a difficult customer.
- It still bothers them.

**Was zurückgewiesen wird:**

- A complaint about a customer.
- An abstract grievance about the industry.
- A scene in which they were only the victim.

**Gesprächsleiter:**

- Eröffnung: a day when something felt deeply wrong — the scene, not the lesson.
- Nachfrage: what exactly made it feel wrong: what was done, or how it was done?
- Nachfrage: what did you do afterwards?
- Umdeutung: if the answer blames a customer, ask what they themselves would do differently today
- Umdeutung: if the answer stays abstract, ask when they last felt it in the room

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: ausführlich · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 19 Felder in 6 Kapiteln (Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Wir haben ein Zwölf-Wochen-Paket an jemanden verkauft, der ab Woche zwei nicht mehr kam. Angerufen hat ihn niemand, das Geld war ja da.
  - en:
  > We sold a twelve-week package to somebody who stopped showing up in week two. Nobody called him, because the money was already in.
- **Marken-Relaunch**
  - de:
  > Wir haben einen Kunden weiter trainieren lassen, obwohl seine Schulter längst zum Arzt gehört hätte. Gesagt hat das niemand, gesehen haben es alle.
  - en:
  > We kept training a client although his shoulder should long since have seen a doctor. Nobody said it out loud, and everybody saw it.

### `c.discovery3` — Welches Verhalten würdest du nie dulden — auch nicht vom bestzahlenden Kunden?

**Art:** Frage · **Umfang:** ~2 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture where this brand draws its line: solo, the behaviour they would never tolerate even from their best-paying client; with a team, the rule the team decides by when the owner is not in the room.

**Fassung im Team:** Wie soll dein Team entscheiden, wenn du nicht im Raum bist?

**Woran man einen guten Wert erkennt:**

- It names a behaviour or a decision rule, never a type of person.
- It has been applied at least once, and they can say when.
- It would still hold for the best-paying client, and without the owner present.
- It is specific enough to recognise while it is happening.

**Was zurückgewiesen wird:**

- A no-go so extreme that nobody would ever ask for it.
- A preference dressed up as a principle: "we do not like rush jobs".
- A behaviour they have in fact tolerated, or a rule nobody has ever used.

**Gesprächsleiter:**

- Eröffnung: solo: the behaviour they would refuse even from their best-paying client. With a team: the rule the team decides by when the owner is not there.
- Nachfrage: when did that last happen, and what did it cost?
- Nachfrage: who applied it — and did they have to ask first?
- Umdeutung: if the no-go is illegal anyway, ask for the one that is legal and still unacceptable
- Umdeutung: if the rule has never been tested, ask what the team came closest to getting wrong

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 19 Felder in 6 Kapiteln (Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Wer bei uns Nahrungsergänzung auf Provision verkaufen will, ist raus — auch wenn das ganze Jahr gebucht ist.
  - en:
  > Anybody who wants to sell supplements on commission here is out, even when the whole year has been booked.
- **Marken-Relaunch**
  - de:
  > Ist niemand von uns da, gilt: im Zweifel wird die Übung abgebrochen und ein Arztbesuch empfohlen. Das darf jeder Trainer allein entscheiden.
  - en:
  > When none of us is there the rule is: when in doubt the exercise stops and a doctor is recommended. Every trainer may decide that alone.

### `c.candidates` — Wertekandidaten

**Art:** Ableitung · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** distil 5 to 7 candidate VALUES out of what this person has told you.

**Woran man einen guten Wert erkennt:**

- Every candidate carries the moment it comes from, in the same line.
- No two candidates rest on the same sentence.
- A word that could stand under any brand appears only where a specific moment earns it.
- The list is unranked and has no favourite.

**Was zurückgewiesen wird:**

- Poster words with no moment behind them.
- A ranking, or a candidate marked as the obvious one.
- A value invented to round the list up to seven.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 18 Felder in 6 Kapiteln (Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Geduld — der Plan wurde umgeschrieben, statt die Kundin weiterzuschieben
  > - Unbestechlichkeit — das Provisionsangebot eines Herstellers wurde abgelehnt
  - en:
  > - Patience — the plan was rewritten instead of pushing the client along
  > - Incorruptibility — a manufacturer's commission offer was turned down
- **Marken-Relaunch**
  - de:
  > - Ehrlichkeit — kein Training an einer Schulter, die zum Arzt gehört
  > - Verlässlichkeit — bei Krankheit wird abgesagt, nicht vertreten
  - en:
  > - Honesty — no training on a shoulder that belongs at a doctor
  > - Reliability — when a trainer is ill the session is cancelled, not handed over

### `c.final` — Welche drei bis fünf würdet ihr verteidigen, auch wenn es euch etwas kostet?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle the three to five values this brand would defend even when they cost it something.

**Woran man einen guten Wert erkennt:**

- Between three and five values.
- Each one has already cost them something.
- Dropping one of them would change how a decision is made.
- No two of them mean the same thing.

**Was zurückgewiesen wird:**

- Six or more, because none of them could be dropped.
- A value kept because it looks good on a wall.
- Two words for the same behaviour, such as honesty and transparency.

**Gesprächsleiter:**

- Eröffnung: narrow the candidates to three to five, and say which of them have a price.
- Nachfrage: which of these would you still hold in the worst month of the year?
- Umdeutung: if six or more survive, ask which one they have never actually paid for

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** zwischen 3 und 5 Einträgen

**Fliesst später in:** 17 Felder in 6 Kapiteln (Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Geduld
  > - Unbestechlichkeit
  > - Klarheit
  - en:
  > - Patience
  > - Incorruptibility
  > - Clarity
- **Marken-Relaunch**
  - de:
  > - Ehrlichkeit
  > - Verlässlichkeit
  > - Ruhe
  > - Sorgfalt
  - en:
  > - Honesty
  > - Reliability
  > - Calm
  > - Care

### `c.definitions` — Was jeder Wert bei euch heißt

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** for each value they chose, write ONE sentence saying what it means HERE — in this brand, not in a dictionary.

**Woran man einen guten Wert erkennt:**

- One line per chosen value, none missing and none added.
- Each sentence says what somebody DOES or does not do.
- The moment behind the value is recognisable in the sentence.
- It could be read out on a first working day without embarrassment.

**Was zurückgewiesen wird:**

- A dictionary definition: "honesty means being honest".
- A sentence that names an attitude but no action.
- A definition for a value they did not choose.

**Form des Werts:** Person: wir · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** nennt JEDEN Eintrag aus `c.final`

**Fliesst später in:** 6 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Geduld — wir schreiben den Plan so oft um, wie der Alltag es verlangt, und rechnen die Beratung nicht doppelt ab.
  - en:
  > - Patience — we rewrite the plan as often as everyday life demands, and we do not charge for the session twice.
- **Marken-Relaunch**
  - de:
  > - Verlässlichkeit — fällt ein Trainer aus, sagen wir ab und geben den Termin kostenfrei zurück, statt jemanden einspringen zu lassen.
  - en:
  > - Reliability — if a trainer drops out we cancel and refund the slot instead of sending in a stand-in.

### `c.livedExamples` — Zu jedem Wert: EIN echtes Beispiel, wo ihr ihn schon gelebt habt.

**Art:** Frage · **Umfang:** ~2 Min, 5 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture one real example per chosen value where this brand already lived it.

**Woran man einen guten Wert erkennt:**

- One real example per chosen value.
- Each example carries a date, a place or a person.
- It shows the value costing something.
- It happened — it is not what they would do.

**Was zurückgewiesen wird:**

- A hypothetical: "we would always ...".
- The same story used for two values.
- An example in which the value cost nothing.

**Gesprächsleiter:**

- Eröffnung: one thing that really happened, per value.
- Nachfrage: when was that, and who was involved?
- Nachfrage: what did it cost you that time?
- Umdeutung: if the example is hypothetical, ask for the last time it really happened
- Umdeutung: if one value has no story, say so plainly and ask whether it belongs on the list

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: ausführlich · Nachfragen: höchstens 2 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** nennt JEDEN Eintrag aus `c.final`

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Unbestechlichkeit — im März haben wir ein Provisionsangebot über 2.000 Euro abgelehnt und das in der Sprechstunde offen gesagt.
  - en:
  > - Incorruptibility — in March we turned down a commission offer worth 2,000 euros and said so openly in the consultation hour.
- **Marken-Relaunch**
  - de:
  > - Ruhe — im Juli haben wir den Wettkampf abgesagt, weil zwei Leute krank waren; das Startgeld ging zurück.
  - en:
  > - Calm — in July we called off the competition because two people were ill, and the entry fees went back.

### `c.conflictRule` — Wo geraten zwei eurer Werte in Konflikt — und welcher gewinnt?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle which of the chosen values wins when two of them collide, and why.

**Woran man einen guten Wert erkennt:**

- It names two of their own values by name.
- It says which one wins, without "it depends".
- The case it describes has happened, or could happen next month.
- A colleague could apply it without asking.

**Was zurückgewiesen wird:**

- "They never conflict."
- A rule that resolves the conflict by doing both.
- A conflict between a value and something that is not a value, such as time or money.

**Gesprächsleiter:**

- Eröffnung: the case where two of their values collide — and which one wins.
- Nachfrage: which two rub against each other most often in practice?
- Nachfrage: who decides when it happens on a Friday afternoon?
- Umdeutung: if the answer is "they never conflict", offer the pair you can see colliding and ask whether that is right
- Umdeutung: if the answer does both, ask what happens when there is no time for both

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** nennt mindestens 2 Einträge aus `c.final`

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Geduld gegen Klarheit: Trägt ein Plan nach acht Wochen nicht, gewinnt Klarheit — wir sagen es, statt weiter Geduld zu verkaufen.
  - en:
  > Patience against clarity: when a plan is not working after eight weeks, clarity wins — we say so instead of selling more patience.
- **Marken-Relaunch**
  - de:
  > Verlässlichkeit gegen Ehrlichkeit: Ist jemand nicht fit, gewinnt Ehrlichkeit — wir sagen den zugesagten Termin ab.
  - en:
  > Reliability against honesty: if somebody is not fit, honesty wins — we cancel the session we promised.

### `c.teamFilter` — Wenn ihr morgen jemanden einstellt: Welcher Wert ist der unverhandelbare Filter?

**Art:** Frage (optional) · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle which value is the non-negotiable filter when this brand hires someone.

**Woran man einen guten Wert erkennt:**

- It names exactly one of their chosen values.
- It says what would disqualify somebody, not what would be nice to have.
- It has already decided a hire or a parting.
- It can be applied on a trial day, not only to a CV.

**Was zurückgewiesen wird:**

- All the values at once as the filter.
- A skill requirement instead of a value.
- A filter nobody has ever failed.

**Gesprächsleiter:**

- Eröffnung: the one value that decides a hire, and what would fail it.
- Nachfrage: what would somebody have to do on a trial day for you to say no?
- Nachfrage: has anybody ever failed on exactly that?
- Umdeutung: if all the values are named, ask which one they could not train into somebody
- Umdeutung: if the answer is a skill, ask what they would forgive in skill and never in behaviour

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Geduld. Wer am Probetag beim ersten Rückschritt die Stimme hebt, passt nicht zu uns — Fachwissen bringen wir bei.
  - en:
  > Patience. Anybody who raises their voice at the first setback on a trial day does not fit here — knowledge we can teach.
- **Marken-Relaunch**
  - de:
  > Ehrlichkeit. Wer einen Fehler im Studio nicht meldet, weil er klein aussieht, ist raus.
  - en:
  > Honesty. Anybody who hides a small mistake in the studio because it looks harmless is out.

## Archetyp und Stimme (`archetype`) — 12 Sessions, **Σ ~14 Min** (33 Züge)

Interview-Technik: **Milo** (Werte-Berater). Gesprochen wird alles von George.

### `d.hypothesis` — Archetyp-Hypothese aus eurem heutigen Auftritt

**Art:** Ableitung · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** say which archetype speaks out of their appearance TODAY — as a reading, not as a decision.

**Woran man einen guten Wert erkennt:**

- It names one or two archetypes by their catalogue name.
- Each one carries a phrase from their own texts as evidence.
- It reads as a reading of the appearance, never as a decision about them.
- A mixed appearance is named as a finding instead of being smoothed over.

**Was zurückgewiesen wird:**

- "You are the Sage" — a verdict instead of a reading.
- An archetype with no phrase behind it.
- An appearance invented because no texts were given.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · höchstens 70 Wörter

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 21 Felder in 5 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Aus euren Texten spricht vor allem der Schöpfer: „Wir setzen jedes Buch neu, auch wenn es die vierte Auflage ist." Daneben klingt der Weise durch, wo ihr Papier und Bindung erklärt.
  - en:
  > What speaks out of your texts is mostly the Creator: "we typeset every book from scratch, even for a fourth edition". The Sage shows through where you explain paper and binding.
- **Marken-Relaunch**
  - de:
  > Euer Auftritt zieht in zwei Richtungen: „Bilder, die bleiben" klingt nach dem Schöpfer, die Seite mit den Stornobedingungen nach dem Herrscher.
  - en:
  > Your appearance pulls two ways: "pictures that stay" sounds like the Creator, while the cancellation page sounds like the Ruler.

### `d.pairs` — Welche der beiden fühlt sich mehr nach euch an?

**Art:** Instrument · **Umfang:** ~3 Min, 1 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle which archetype of each pair feels more like this brand, until a first and a second place stand.

**Woran man einen guten Wert erkennt:**

- Every pair was decided, none skipped.
- Each winner is one of the twelve catalogue archetypes.
- The result has a first and a second place with a countable margin.
- The decisions came from their own sense, not from a brand they admire.

**Was zurückgewiesen wird:**

- A pair answered with "both".
- A choice justified by a famous brand instead of by their own feeling.
- The result read as a personality test about the founder.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 20 Felder in 5 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

### `d.primary` — Primärer Archetyp

**Art:** Ableitung · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** propose the PRIMARY archetype of this brand — the one that carries how they behave.

**Woran man einen guten Wert erkennt:**

- It names exactly one of the twelve catalogue archetypes.
- The prose and the stored value name the same archetype.
- The BASIS line quotes one of their own sentences as the reason.
- Where their answers and their appearance disagree, the answers win and the text says so.

**Was zurückgewiesen wird:**

- An informal name stored instead of a catalogue archetype.
- A draft where two archetypes are equally defensible.
- A choice derived from the pitch alone.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 18 Felder in 5 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Der Schöpfer — „auch wenn es die vierte Auflage ist" ist euer Satz, nicht der einer Druckerei.
  - en:
  > The Creator — "even for a fourth edition" is your sentence, not a printer's.
- **Marken-Relaunch**
  - de:
  > Der Fürsorgliche — ihr habt dreimal gesagt, dass ihr vorher anruft, wenn jemand zum ersten Mal vor einer Kamera steht.
  - en:
  > The Caregiver — you said three times that you call ahead when somebody stands in front of a camera for the first time.

### `d.secondary` — Sekundärer Archetyp

**Art:** Ableitung · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** propose the SECONDARY archetype — the one that keeps the primary from becoming a cliché.

**Woran man einen guten Wert erkennt:**

- It is a different archetype from the primary.
- The BASIS line says what the pair does: how the second keeps the first bearable.
- It explains a note in their answers that the primary does not.
- It is a catalogue name, not an informal one.

**Was zurückgewiesen wird:**

- The same archetype as the primary, in other words.
- A second name with no relationship to the first.
- A secondary guessed while the primary is missing.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** nennt nicht dasselbe wie `d.primary`

**Fliesst später in:** 2 Felder in 1 Kapiteln (Archetyp und Stimme)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Der Weise als Zweiter — er hält den Schöpfer vom Schwärmen ab: ihr erklärt, warum ein Papier durchscheint, bevor ihr es empfehlt.
  - en:
  > The Sage second — it keeps the Creator from mere enthusiasm: you explain why a paper shows through before you recommend it.
- **Marken-Relaunch**
  - de:
  > Der Entdecker als Zweiter — er hält den Fürsorglichen davon ab, betulich zu werden.
  - en:
  > The Explorer second — it keeps the Caregiver from turning fussy.

### `d.gapReveal` — Selbstbild und Außenbild

**Art:** Ableitung · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** put their self-image next to their outside image and name the difference.

**Woran man einen guten Wert erkennt:**

- It says in one sentence where the two agree.
- It names the difference plainly, without softening it.
- It points at the phrase in their texts that sounds like the other archetype.
- It gives no advice — the finding is the value.

**Was zurückgewiesen wird:**

- A reassuring closing sentence.
- "There are elements of both."
- A gap invented because a finding was expected.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Ihr wollt als Schöpfer gelesen werden, eure Seite klingt aber an drei Stellen nach dem Herrscher: „Wir arbeiten ausschließlich mit Verlagen."
  - en:
  > You want to be read as the Creator, but in three places your site sounds like the Ruler: "we work exclusively with publishers".
- **Marken-Relaunch**
  - de:
  > Selbstbild und Außenbild treffen sich beim Fürsorglichen — nur die Preisliste spricht wie ein Herrscher: „Absagen unter 48 Stunden werden voll berechnet."
  - en:
  > Self-image and outside image meet at the Caregiver — only the price list speaks like a Ruler: "cancellations within 48 hours are charged in full".

### `d.party` — Wenn eure Marke ein Mensch auf einer Party wäre — wie verhält sie sich?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture how this brand would behave as a person at a party.

**Woran man einen guten Wert erkennt:**

- It describes behaviour, not adjectives.
- A stranger could act it out.
- It also says what that person does NOT do at the party.
- It is one person, not a committee.

**Was zurückgewiesen wird:**

- Three adjectives: open, friendly, honest.
- A description of the founder rather than of the brand.
- A guest everybody likes and nobody remembers.

**Gesprächsleiter:**

- Eröffnung: the brand as a person at a party — what they do in the first ten minutes.
- Nachfrage: who do they end up talking to, and about what?
- Nachfrage: what do they never do at that party?
- Umdeutung: if the answer is adjectives, ask what that person actually does when they arrive
- Umdeutung: if the person is likeable to everybody, ask who at that party would find them annoying

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 1 Felder in 1 Kapiteln (Archetyp und Stimme)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Steht am Rand, redet mit einem Menschen zwei Stunden über dessen Familienalbum und geht früh.
  - en:
  > Stands at the edge, talks to one person about their family album for two hours, and leaves early.
- **Marken-Relaunch**
  - de:
  > Merkt sich, wer nicht fotografiert werden will, und fragt kein zweites Mal — hält aber keine Rede.
  - en:
  > Notices who does not want to be photographed and does not ask twice — but never makes a speech. Notices who does not want to be photographed and does not ask twice — but never makes a speech.

### `d.never` — Welche Eigenschaft sollte eure Marke NIEMALS haben?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture the one trait this brand must never have.

**Woran man einen guten Wert erkennt:**

- It is one trait, and this brand could plausibly drift into it.
- It excludes something — some respectable brand somewhere has that trait.
- It is more than the opposite of a virtue.
- They can name a sentence they would refuse to write because of it.

**Was zurückgewiesen wird:**

- A trait nobody wants: dishonest, unprofessional, arrogant.
- The exact opposite of a value they already named.
- A list of five traits.

**Gesprächsleiter:**

- Eröffnung: the one trait this brand must never have.
- Nachfrage: where do you feel yourselves drifting towards it?
- Nachfrage: which sentence would you refuse to write because of it?
- Umdeutung: if the trait is one nobody wants, ask which respectable trait would still be wrong for them

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Belehrend. Wir erklären, warum eine Zeile umbricht, aber wir sagen niemandem, dass er den falschen Geschmack hat.
  - en:
  > Preachy. We explain why a line breaks where it does, but we never tell anybody their taste is wrong.
- **Marken-Relaunch**
  - de:
  > Aufgeregt. Kein „nur noch zwei Termine frei" — dafür ruft hier niemand an.
  - en:
  > Breathless. No "only two slots left" — that is not what people call for.

### `d.admired` — Nenn eine Marke, deren Persönlichkeit du bewunderst — was genau ist es bei denen?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture a brand whose personality they admire and what exactly it is about that brand.

**Woran man einen guten Wert erkennt:**

- It names one brand and one thing about it.
- The thing named is a behaviour, not a logo or a budget.
- It also says what they would NOT copy from that brand.
- The brand comes from another industry, or they say why it does not.

**Was zurückgewiesen wird:**

- A famous name with "they just do everything right".
- Admiration for a marketing budget instead of a behaviour.
- A competitor named as a template to copy.

**Gesprächsleiter:**

- Eröffnung: one brand whose personality they admire, and the exact thing about it.
- Nachfrage: what does that brand DO that you noticed?
- Nachfrage: what about them would be wrong for you?
- Umdeutung: if the answer is a logo or a budget, ask what that brand does that a small company could do too

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Ein Hersteller, der seit Jahren dieselbe Reparaturanleitung beilegt, statt jede Saison eine neue Kampagne zu fahren. Das ständige Predigen der eigenen Haltung wäre uns zu viel.
  - en:
  > A manufacturer that has enclosed the same repair instructions for years instead of running a new campaign every season. The constant preaching about their own stance would be too much for us.
- **Marken-Relaunch**
  - de:
  > Ein Röster, der auf jede Tüte schreibt, was der Bauer bekommen hat. Der belehrende Ton wäre uns zu viel.
  - en:
  > A roaster who prints on every bag what the farmer was paid. The lecturing tone would be too much for us.

### `d.emotion` — Was sollen Leute FÜHLEN, wenn sie mit euch zu tun haben?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture what people should feel when they interact with this brand.

**Woran man einen guten Wert erkennt:**

- It is one feeling, in a word a person would actually use.
- It says at which moment that feeling should arrive.
- A different feeling would be plausible here — so this one is a choice.
- It is a feeling, not a judgement about the company.

**Was zurückgewiesen wird:**

- "Trust", with no moment attached.
- Three feelings at once.
- A judgement in place of a feeling: "they should think we are professional".

**Gesprächsleiter:**

- Eröffnung: the one feeling people should leave with, and at which moment.
- Nachfrage: at which point in dealing with you should that feeling arrive?
- Nachfrage: which feeling would be wrong here, even though others in your industry aim for it?
- Umdeutung: if the answer is "trust", ask what has to happen before somebody feels it
- Umdeutung: if there are three, ask which one they would keep if they had to drop the others

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 17 Felder in 5 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Erleichterung — in dem Moment, in dem jemand merkt, dass sein Manuskript nicht kürzer werden muss.
  - en:
  > Relief — at the moment somebody realises their manuscript does not have to get shorter.
- **Marken-Relaunch**
  - de:
  > Ruhe. Ist der Termin bestätigt, soll niemand mehr überlegen, was er anziehen muss.
  - en:
  > Calm. Once the appointment is confirmed, nobody should still be wondering what to wear.

### `d.voiceSamples` — Welcher dieser Sätze klingt am meisten nach euch?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** write EXACTLY THREE example sentences in the voice of this brand — three lines, no more and no fewer.

**Woran man einen guten Wert erkennt:**

- Exactly three lines, from three different everyday situations.
- Each one is ordinary speech, not a slogan.
- The primary sets the attitude, the secondary keeps it from tipping into caricature.
- You could tell them apart from any competent brand text.

**Was zurückgewiesen wird:**

- Three variations of the same sentence.
- Taglines or headlines instead of speech.
- A call to action.

**Gesprächsleiter:**

- Eröffnung: three sentences in their voice, then let them pick or correct.
- Nachfrage: which of the three sounds least like you, and what is wrong with it?
- Umdeutung: if all three feel right, ask which one they would actually send tomorrow

**Form des Werts:** Person: wir · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Der Satz steht, aber das Papier trägt ihn nicht.
  > - Vor Oktober schaffen wir das nicht — ehrlich gesagt frühestens im November.
  > - 2.400 Euro, weil jede Seite einzeln umbrochen wird und nicht aus einer Vorlage kommt.
  - en:
  > - The typesetting works, but the paper cannot carry it.
  > - We will not manage it before October — honestly, November at the earliest.
  > - 2,400 euros, because every page is set by hand and not poured into a template.
- **Marken-Relaunch**
  - de:
  > - Der Termin steht, die Bilder kommen am Freitag.
  > - Das Licht ist gut, der Hintergrund nicht — besser jetzt gesagt als hinterher.
  > - Ab Freitag gilt der neue Preis, deshalb melden wir uns heute.
  - en:
  > - The appointment is fixed, the pictures arrive on Friday.
  > - The light is good, the background is not — better said now than afterwards.
  > - The new price starts on Friday, which is why we are getting in touch today.

### `d.toneWords` — Welche Wörter beschreiben euren Ton?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** name FOUR to SIX tone words for this brand — the words someone would use to describe how it sounds.

**Woran man einen guten Wert erkennt:**

- Four to six words, one per line, nothing else on the line.
- Every word excludes a plausible brand.
- Together they describe a voice, not a mood.
- They can be held against a finished text as a checklist.

**Was zurückgewiesen wird:**

- Professional, authentic, modern, high-quality — words that exclude nothing.
- Explanations or "but not ..." on the line.
- Words that describe the industry instead of the voice.

**Gesprächsleiter:**

- Eröffnung: offer four to six words and say which came from their texts and which from the archetype.
- Nachfrage: which of these words would you cross out first?
- Umdeutung: if a word excludes nothing, name a brand it would also fit and ask whether that is right

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 10 Felder in 4 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - karg
  > - geduldig
  > - handfest
  > - unbeeindruckt
  - en:
  > - spare
  > - patient
  > - hands-on
  > - unimpressed
- **Marken-Relaunch**
  - de:
  > - nüchtern
  > - vorausschauend
  > - warm ohne Zucker
  > - knapp
  - en:
  > - sober
  > - one step ahead
  > - warm without sugar
  > - brief

### `d.vocabulary` — Welche Wörter würdet ihr NIE benutzen?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** build their vocabulary list — the words they use and the words they avoid.

**Woran man einen guten Wert erkennt:**

- Their own never-words are carried over unchanged, in their wording.
- Every line carries one word and its side.
- The use side contains words their customers actually say.
- A reason is given only where the avoidance is not obvious.

**Was zurückgewiesen wird:**

- Arguing with one of their own no-go words.
- A trade term banned only because it sounds technical.
- A list with none of their own words in it.

**Gesprächsleiter:**

- Eröffnung: the words they would never use — in their wording, unchanged.
- Nachfrage: which word in your own texts makes you wince when you read it back?
- Umdeutung: if a term is banned only for sounding technical, ask whether their customers use it every day

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 1 Felder in 1 Kapiteln (Tagline & Messaging)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - benutzen: gesetzt
  > - benutzen: Bogen
  > - meiden: Premium
  > - meiden: Manufaktur — steht inzwischen auf jeder Tiefkühlpizza
  - en:
  > - use: typeset
  > - use: sheet
  > - avoid: premium
  > - avoid: artisanal — it is on frozen pizza now
- **Marken-Relaunch**
  - de:
  > - benutzen: Abzug
  > - benutzen: Termin
  > - meiden: Traumbilder
  > - meiden: unschlagbar
  - en:
  > - use: print
  > - use: appointment
  > - avoid: dream pictures
  > - avoid: unbeatable

## Manifest (`manifesto`) — 6 Sessions, **Σ ~13 Min** (20 Züge)

Interview-Technik: **Nika** (Sprach-Beraterin). Gesprochen wird alles von George.

### `e.warmup1` — Was regt dich an deiner Branche auf?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture what makes them angry about their own industry.

**Woran man einen guten Wert erkennt:**

- It names something concrete that happens in their industry.
- The anger is aimed at a practice, not at customers.
- Somebody in the industry would object to hearing it said out loud.
- They themselves do it differently, and can say how.

**Was zurückgewiesen wird:**

- Anger at customers for not paying enough.
- A complaint about regulation nobody in the room controls.
- A grievance they are guilty of themselves.

**Gesprächsleiter:**

- Eröffnung: what makes them angry about their own industry.
- Nachfrage: when did you last see it happen?
- Nachfrage: do you do it differently — and how exactly?
- Umdeutung: if the anger is aimed at customers, ask what the industry has taught those customers
- Umdeutung: if it is about rules, ask what colleagues do that they would never do

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 6 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Dass Angebote absichtlich unvergleichbar gemacht werden — vier Seiten Positionen, damit niemand den Stundensatz ausrechnen kann.
  - en:
  > That quotes are made deliberately incomparable — four pages of line items so nobody can work out the hourly rate.
- **Marken-Relaunch**
  - de:
  > Rahmenverträge, die sich verlängern, wenn man die Kündigung um zwei Tage verpasst. Das ist kein Geschäftsmodell, das ist eine Falle.
  - en:
  > Retainers that renew if you miss the notice period by two days. That is not a business model, it is a trap.

### `e.warmup2` — Was sollten mehr Leute über eure Arbeit verstehen?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture what they wish more people understood about their work.

**Woran man einen guten Wert erkennt:**

- It names one misunderstanding, not a general lack of appreciation.
- It is something they could show, not only claim.
- Knowing it would change what a customer asks for.
- It is not a complaint about price.

**Was zurückgewiesen wird:**

- "That good work costs money."
- A lecture about the whole industry.
- Something their own website already explains well.

**Gesprächsleiter:**

- Eröffnung: what they wish more people understood about the work.
- Nachfrage: what do people ask for that they would not ask for if they knew?
- Nachfrage: how would you show it in two minutes?
- Umdeutung: if the answer is about price, ask what exactly the price pays for that nobody sees

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 6 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Dass die Idee nicht das Teure ist. In den meisten Projekten kostet das Abstimmen dreimal so viel wie das Entwerfen.
  - en:
  > That the idea is not the expensive part. In most projects the rounds of approval cost three times as much as the design work.
- **Marken-Relaunch**
  - de:
  > Dass die ersten sechs Wochen nichts mit Kreativität zu tun haben, sondern damit, ob jemand die Zahlen des Kunden versteht.
  - en:
  > That the first six weeks have nothing to do with creativity and everything to do with whether somebody understands the client's numbers.

### `e.statements` — Die Satzanfänge

**Art:** Entwurf · **Umfang:** ~5 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft all 23 statement openers the manifesto will be built from — one line per opener, in the five groups of the instrument (belief, commitment, energy, stance, promise), filled from what they have already said.

**Woran man einen guten Wert erkennt:**

- There are 23 lines, and every group of the instrument is represented.
- Every statement takes a side somebody could refuse.
- Each one is traceable to an answer they gave.
- They are sentences somebody would say, not headlines.
- The strongest ones stand out without needing a marker.

**Was zurückgewiesen wird:**

- Statements everybody in the industry would sign.
- A statement that only praises the brand.
- A filled-in opener with nothing behind it.

**Form des Werts:** Person: wir · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 5 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Wir glauben, dass die teuerste Runde die ist, die niemand gebraucht hätte.
  > - Wir weigern uns, einen Entwurf zu zeigen, bevor die Frage feststeht.
  - en:
  > - We believe the most expensive round is the one nobody needed.
  > - We refuse to show a draft before the question has been settled.
- **Marken-Relaunch**
  - de:
  > - Wir glauben, dass Bleiben wichtiger ist als Auffallen.
  > - Wir weigern uns, Verträge zu verlängern, die niemand nutzt.
  - en:
  > - We believe staying matters more than standing out.
  > - We refuse to renew a contract nobody is using.

### `e.composition` — Ton, Länge und Verwendung des Manifests

**Art:** Auswahl · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle the tone, the length and the intended use of the manifesto.

**Woran man einen guten Wert erkennt:**

- Tone, length and use are each decided, none left open.
- The use names a place where it will really be read.
- The length fits that place.
- The tone is one of the offered ones, not a mixture.

**Was zurückgewiesen wird:**

- "All of them" as the intended use.
- A tone chosen because it sounds impressive.
- A length nobody will read where it is meant to appear.

**Gesprächsleiter:**

- Eröffnung: start with the use — where will this be read first?
- Nachfrage: what length does that place carry?
- Nachfrage: which of the offered tones fits that place — one of them, not a mixture?
- Umdeutung: if every use is ticked, ask which one it has to work for on day one

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 5 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Ton: nüchtern · Länge: kurz, unter 120 Wörtern · Verwendung: die erste Seite jedes Angebots
  - en:
  > Tone: sober · Length: short, under 120 words · Use: the first page of every proposal
- **Marken-Relaunch**
  - de:
  > Ton: direkt · Länge: mittel · Verwendung: das Plakat im Besprechungsraum und die Seite „Über uns"
  - en:
  > Tone: direct · Length: medium · Use: the poster in the meeting room and the About page

### `e.manifesto` — Manifest

**Art:** Entwurf · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft the manifesto of this brand from the confirmed statements and the chosen composition.

**Woran man einen guten Wert erkennt:**

- It takes a side that would put some readers off.
- Every line can be read aloud without wincing.
- It is built from the statements they marked, not from new material.
- It ends without a call to action.

**Was zurückgewiesen wird:**

- A mission statement stretched over ten lines.
- A manifesto that could hang in any company of this industry.
- A closing sales line.

**Form des Werts:** Person: wir · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 4 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Die teuerste Runde ist die, die niemand gebraucht hätte.
  > Deshalb klären wir die Frage, bevor wir entwerfen.
  > Und sagen ab, wenn die Frage nicht zu klären ist.
  - en:
  > The most expensive round is the one nobody needed.
  > So we settle the question before we design.
  > And we say no when the question cannot be settled.
- **Marken-Relaunch**
  - de:
  > Der beste Auftritt ist der, den ein Kunde in drei Jahren noch selbst pflegen kann.
  > Wir zählen keine Preise.
  > Wir zählen, was übrig bleibt.
  - en:
  > The best brand is the one a client can still maintain three years later.
  > We do not count awards.
  > We count what is left.

### `e.anchorLine` — Welche Zeile ist die, die ihr an eine Wand hängen würdet?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle which single line of the manifesto is the one they would put on a wall.

**Woran man einen guten Wert erkennt:**

- It is one line from the manifesto, word for word.
- It stands alone without the lines around it.
- It is short enough to repeat from memory.
- It says something, not merely something pleasant.

**Was zurückgewiesen wird:**

- A new line written for the occasion.
- The most general line of the manifesto.
- Two lines joined into one.

**Gesprächsleiter:**

- Eröffnung: pick the one line they would put on a wall — from the manifesto itself.
- Nachfrage: which line would you still want to say in five years?
- Umdeutung: if they want to write a new one, point back to the manifesto and ask which line comes closest

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** der Wert ist ein Satz aus `e.manifesto`

**Fliesst später in:** 3 Felder in 2 Kapiteln (Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Die teuerste Runde ist die, die niemand gebraucht hätte.
  - en:
  > The most expensive round is the one nobody needed.
- **Marken-Relaunch**
  - de:
  > Wir zählen, was übrig bleibt.
  - en:
  > We count what is left.

## Tagline & Messaging (`verbal`) — 5 Sessions, **Σ ~7 Min** (12 Züge)

Interview-Technik: **Nika** (Sprach-Beraterin). Gesprochen wird alles von George.

### `ep.taglines` — Welche Tagline trägt es?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** propose tagline candidates and settle on the one that carries this brand.

**Woran man einen guten Wert erkennt:**

- Seven words at most.
- It says something only this brand could claim.
- It works without the logo next to it.
- It can be said out loud without a second look.

**Was zurückgewiesen wird:**

- A category description: "your partner for X".
- A rhyme that means nothing.
- A line that would fit the competitor after swapping one word.

**Gesprächsleiter:**

- Eröffnung: offer the candidates, name the one you would take and say why.
- Nachfrage: which of these would you actually say on the phone?
- Umdeutung: if they like the one that describes the category, ask what it says that a competitor could not

**Form des Werts:** Person: ohne Person · Zeit: Präsens · höchstens 7 Wörter

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Erst messen, dann möblieren.
  - en:
  > Measure first, furnish second.
- **Marken-Relaunch**
  - de:
  > Wir planen für den Montag.
  - en:
  > We plan for the Monday.

### `ep.boilerplates` — Boilerplates — Bio, Kurzabsatz, Absatz

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft the three boilerplates of this brand: the one-line bio, the short paragraph and the full paragraph.

**Woran man einen guten Wert erkennt:**

- Three lengths: a bio under 160 characters, a short paragraph, a full paragraph.
- Each one works alone — the short one is not the long one cut off.
- The bio says what they do and for whom, and nothing else.
- None of the three uses a superlative.

**Was zurückgewiesen wird:**

- The same text three times at three lengths.
- A bio that only names the industry.
- A press-release voice nobody speaks.

**Form des Werts:** Person: wir · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > ## Bio
  > Innenarchitektur für kleine Wohnungen in Leipzig — wir messen, bevor jemand kauft.
  - en:
  > ## Bio
  > Interior design for small flats in Leipzig — we measure before anybody buys.
- **Marken-Relaunch**
  - de:
  > ## Bio
  > Innenarchitektur für Praxen und Büros. Wir planen für den Montag, nicht für das Foto.
  - en:
  > ## Bio
  > Interior design for practices and offices. We plan for the Monday, not for the photograph.

### `ep.keyMessages` — Kernbotschaften je Zielgruppe

**Art:** Entwurf · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft the key messages of this brand, one set per audience.

**Woran man einen guten Wert erkennt:**

- One set per audience from the audience sketch, none invented.
- Each message answers something that audience really worries about.
- Three messages per audience at most.
- No message repeats the tagline.

**Was zurückgewiesen wird:**

- The same three messages for every audience.
- A set for an audience that is not in the sketch.
- A feature list disguised as a message.

**Form des Werts:** Person: wir · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > ## Mieterinnen und Mieter
  > - Nichts von dem, was wir planen, muss beim Auszug zurückgebaut werden.
  > - Wir sagen vorher, was sich nicht lohnt.
  - en:
  > ## Tenants
  > - Nothing we plan has to be undone when the lease ends.
  > - We say in advance what is not worth doing.
- **Marken-Relaunch**
  - de:
  > ## Praxen im laufenden Betrieb
  > - In den ersten sechs Wochen zählt nur, dass der Betrieb weiterläuft.
  > - Kein Termin wird ohne Rücksprache verschoben.
  - en:
  > ## Practices that stay open during the work
  > - For the first six weeks the only thing that counts is that the practice keeps running.
  > - No appointment is moved without asking first.

### `ep.vocabulary` — Wörter zum Benutzen, Wörter zum Meiden

**Art:** Ableitung · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** derive the words this brand uses and the words it avoids, as one list for everyday writing.

**Woran man einen guten Wert erkennt:**

- Their own never-words are carried over unchanged.
- Every entry names its side.
- It is usable while writing, not only while reviewing.
- It adds words to the use side, not only bans.

**Was zurückgewiesen wird:**

- A ban list with nothing on the use side.
- Their words rewritten into other wording.
- Entries that merely repeat the tone words.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - benutzen: Grundriss
  > - benutzen: Aufmaß
  > - meiden: Wohntraum
  > - meiden: hochwertig ausgestattet
  - en:
  > - use: floor plan
  > - use: survey
  > - avoid: dream home
  > - avoid: high-end fittings
- **Marken-Relaunch**
  - de:
  > - benutzen: Bestandsaufnahme
  > - benutzen: Bauabschnitt
  > - meiden: Wohlfühlatmosphäre
  > - meiden: Transformation
  - en:
  > - use: survey
  > - use: construction phase
  > - avoid: feel-good atmosphere
  > - avoid: transformation - use: survey
  > - use: construction phase
  > - avoid: feel-good atmosphere
  > - avoid: transformation

### `ep.distinctiveAsset` — Welche Zeile wird euer verbales Erkennungszeichen?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle which line becomes the verbal signature of this brand.

**Woran man einen guten Wert erkennt:**

- It is one line that is already confirmed elsewhere in the foundation.
- It could be recognised without the brand name next to it.
- It survives being repeated for years.
- It is not a description of what they sell.

**Was zurückgewiesen wird:**

- A newly invented line.
- A line that only works next to the logo.
- A seasonal campaign slogan.

**Gesprächsleiter:**

- Eröffnung: confirm the one line that becomes the verbal signature.
- Nachfrage: would you still want to say it in five years?
- Umdeutung: if they want a new line, ask what the anchor line is missing

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Erst messen, dann möblieren.
  - en:
  > Measure first, furnish second.
- **Marken-Relaunch**
  - de:
  > Wir planen für den Montag.
  - en:
  > We plan for the Monday.

## Name (`naming`) — 8 Sessions, **Σ ~12 Min** (21 Züge)

Interview-Technik: **Otto** (Namens-Berater). Gesprochen wird alles von George.

### `f.nameType` — Welche Sorte Name passt zu euch?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle which kind of name fits this brand.

**Woran man einen guten Wert erkennt:**

- It is one of the nine catalogue types.
- The reason names what that type buys and what it costs.
- It fits the no-gos already given.
- It leaves room for more than three candidates.

**Was zurückgewiesen wird:**

- A type chosen because famous brands use it.
- Two types at once.
- A descriptive type chosen while the no-gos rule out every describing word.

**Gesprächsleiter:**

- Eröffnung: name the type you would take, say what it buys and what it costs, then offer the types.
- Nachfrage: is there a type you would rule out straight away?
- Umdeutung: if they pick a descriptive name, say plainly what that costs in protectability

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 5 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Erfundener Name — kurz, schützbar, sagt nichts über Texte und passt auch noch, wenn später Konzeptarbeit dazukommt.
  - en:
  > An invented name — short, protectable, says nothing about copywriting, and still fits if concept work comes later.
- **Marken-Relaunch**
  - de:
  > Gründername bleibt, aber ohne Zusatz: „Ohlsen" statt „Ohlsen Webentwicklung".
  - en:
  > The founder name stays, but without the add-on: "Ohlsen" instead of "Ohlsen Webentwicklung".

### `f.taste` — Nenn drei bis fünf Markennamen, die du liebst — egal welche Branche — und sag warum.

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture three to five brand names they love, from any industry, and why each one works for them.

**Woran man einen guten Wert erkennt:**

- Three to five names, each with a reason.
- The reason is about the name itself: sound, length, image.
- At least one comes from outside their own industry.
- A pattern is visible across the reasons.

**Was zurückgewiesen wird:**

- Names loved because the company behind them is successful.
- A list with no reasons.
- Nothing but competitor names.

**Gesprächsleiter:**

- Eröffnung: three to five names they love, each with the reason.
- Nachfrage: what do those names have in common when you say them out loud?
- Nachfrage: which of them would you never have dared to choose yourselves?
- Umdeutung: if the reason is the company, ask what they would think of the name if the company were unknown

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 5 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Kolibri — man sieht sofort ein Bild. Anker — kurz und am Telefon sofort verstanden. Marlen — weich, zwei Silben, erklärt nichts.
  - en:
  > Kolibri — you see a picture at once. Anker — short and understood on the phone straight away. Marlen — soft, two syllables, explains nothing.
- **Marken-Relaunch**
  - de:
  > Nordlicht, weil es die Gegend mitnimmt, ohne sie zu buchstabieren. Hain, weil man es nach einmal Hören schreiben kann. Kiesel, weil es ein einziges Wort ist.
  - en:
  > Nordlicht, because it carries the region without spelling it out. Hain, because you can write it down after hearing it once. Kiesel, because it is a single word.

### `f.noGos` — Gibt es Wörter, Stile oder Längen, die tabu sind?

**Art:** Frage · **Umfang:** ~1 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture the words, styles and lengths that are off-limits for this name.

**Woran man einen guten Wert erkennt:**

- It names words, styles or lengths that are out, each with a reason.
- At least one no-go is about language or region, not taste.
- It is short enough to leave a brainstorm room to work.
- Somebody else could apply it to a new candidate without asking.

**Was zurückgewiesen wird:**

- A no-go list so long that nothing is left.
- "Nothing boring" as a rule.
- No-gos with no reason, which nobody can apply to a name they have not seen.

**Gesprächsleiter:**

- Eröffnung: the words, styles and lengths that are out — and why each one.
- Nachfrage: is there a word that means something else in a language your customers speak?
- Nachfrage: how long may it be before it stops working on a van door?
- Umdeutung: if the list rules out everything, ask which three of them are truly non-negotiable

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 5 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Kein „Text", kein „Media", nichts mit Bindestrich. Höchstens drei Silben — der Name muss in eine Signatur passen.
  - en:
  > No "Text", no "Media", nothing with a hyphen. Three syllables at most — the name has to fit into an email signature.
- **Marken-Relaunch**
  - de:
  > Nichts mit „dev" oder „digital". Kein Wort, das man buchstabieren muss, wenn ein Kunde am Telefon mitschreibt.
  - en:
  > Nothing with "dev" or "digital". No word that has to be spelled out when a client is taking it down over the phone.

### `f.candidates` — Namens-Kandidaten

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** propose name candidates that fit the chosen name type, their taste and their no-gos.

**Woran man einen guten Wert erkennt:**

- Each candidate carries the name type it belongs to.
- None of them breaks a stated no-go.
- The candidates come from more than one route, not from one word varied.
- Each one can be said on the phone without spelling it out.

**Was zurückgewiesen wird:**

- Ten variations of a single word.
- Candidates that break the no-gos "as an idea".
- A list in which every name is descriptive.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 4 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Bogen — erfunden
  > - Satzbau — beschreibend, aus dem Handwerk
  > - Nordfeld — zusammengesetzt
  - en:
  > - Bogen — invented
  > - Satzbau — descriptive, from the trade
  > - Nordfeld — compound
- **Marken-Relaunch**
  - de:
  > - Ohlsen — Gründername
  > - Kiesel — abstrakt
  > - Tagwerk — bildhaft
  - en:
  > - Ohlsen — founder name
  > - Kiesel — abstract
  > - Tagwerk — evocative

### `f.shortlist` — Welche Kandidaten kommen auf die Shortlist?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle which name candidates make the shortlist.

**Woran man einen guten Wert erkennt:**

- Every entry comes from the candidate list.
- Between three and six names.
- Each survivor has been said out loud at least once.
- None of them breaks a no-go.

**Was zurückgewiesen wird:**

- A new name appearing for the first time at the shortlist stage.
- A shortlist of one.
- Names kept because they are hard to give up rather than because they work.

**Gesprächsleiter:**

- Eröffnung: narrow the candidates down to the ones worth checking.
- Nachfrage: say each one on the phone — which of them needs spelling?
- Umdeutung: if a new name appears here, put it back into the candidate list first

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 3 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Bogen
  > - Satzbau
  > - Nordfeld
  - en:
  > - Bogen
  > - Satzbau
  > - Nordfeld
- **Marken-Relaunch**
  - de:
  > - Ohlsen
  > - Kiesel
  > - Tagwerk
  - en:
  > - Ohlsen
  > - Kiesel
  > - Tagwerk

### `f.checks` — Vorprüfung der Verfügbarkeit

**Art:** Ableitung · **Umfang:** ~3 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** derive the availability checks for the shortlisted names.

**Woran man einen guten Wert erkennt:**

- Every shortlisted name has its own block, none missing.
- Domain and handle results are stated as indicators, never as legal facts.
- A foreign-language finding names the language and the meaning.
- Nothing is claimed that was not actually checked.

**Was zurückgewiesen wird:**

- A trademark verdict: "this name is free".
- A check reported for a name that is not on the shortlist.
- An availability claim with no source behind it.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 2 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > ## Bogen
  > Domain: bogen.de vergeben, bogen-texte.de frei · Handles: ungeprüft, Suchlink unten · Marke: DPMA-Suche noch offen · Fremdsprache: keine Auffälligkeit
  - en:
  > ## Bogen
  > Domain: bogen.de taken, bogen-texte.de free · Handles: unverified, search link below · Trademark: DPMA search still open · Other languages: nothing conspicuous
- **Marken-Relaunch**
  - de:
  > ## Kiesel
  > Domain: kiesel.de vergeben, kiesel-code.de frei · Handles: ungeprüft · Marke: geführte Suche noch offen · Fremdsprache: keine Auffälligkeit
  - en:
  > ## Kiesel
  > Domain: kiesel.de taken, kiesel-code.de free · Handles: unverified · Trademark: guided search still open · Other languages: nothing conspicuous

### `f.criteria` — Bewertet die Finalisten an den acht Kriterien.

**Art:** Auswahl · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** rate the shortlisted names against the eight criteria.

**Woran man einen guten Wert erkennt:**

- Only two or three finalists are rated.
- Every one of the eight criteria carries a rating, none skipped.
- A weak rating stays weak instead of being argued away.
- The ratings together point at a name rather than at a tie.

**Was zurückgewiesen wird:**

- All eight criteria rated high for the favourite.
- A criterion skipped because it is inconvenient.
- Ten names rated instead of three.

**Gesprächsleiter:**

- Eröffnung: name the one criterion that would decide it, and compare the finalists on that one first.
- Nachfrage: which criterion comes second — and does it change the order?
- Umdeutung: if every criterion is high, ask where the name is weakest; every name is weak somewhere

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 1 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > ## Bogen
  > Sprechbar: gut · Schreibbar: gut · Merkbar: mittel · Schützbar: gut · Passend: mittel · Erweiterbar: gut · Frei: offen · Zeitlos: gut
  - en:
  > ## Bogen
  > Sayable: good · Spellable: good · Memorable: medium · Protectable: good · Fitting: medium · Extendable: good · Available: open · Timeless: good
- **Marken-Relaunch**
  - de:
  > ## Kiesel
  > Sprechbar: gut · Schreibbar: gut · Merkbar: mittel · Schützbar: mittel · Passend: gut · Erweiterbar: gut · Frei: offen · Zeitlos: gut
  - en:
  > ## Kiesel
  > Sayable: good · Spellable: good · Memorable: medium · Protectable: medium · Fitting: good · Extendable: good · Available: open · Timeless: good

### `f.decision` — Eure Top drei, in Reihenfolge.

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle their top three names, in order — first choice first, then the two fallbacks.

**Woran man einen guten Wert erkennt:**

- Exactly three names, in order.
- Every one of them comes from the shortlist.
- The reason for first place is supported by one of the criteria.
- Second and third are real fallbacks, not filler.

**Was zurückgewiesen wird:**

- A single name with no fallbacks.
- A ranking that contradicts the criteria ratings.
- A name that never was on the shortlist.

**Gesprächsleiter:**

- Eröffnung: settle the top three, in order, with a reason for first place.
- Nachfrage: if the trademark check kills number one, is number two really your next choice?
- Umdeutung: if only one name is named, ask which two they could live with

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** jede Zeile stammt aus `f.shortlist`

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Bogen
  > - Nordfeld
  > - Satzbau
  - en:
  > - Bogen
  > - Nordfeld
  > - Satzbau
- **Marken-Relaunch**
  - de:
  > - Kiesel
  > - Ohlsen
  > - Tagwerk
  - en:
  > - Kiesel
  > - Ohlsen
  > - Tagwerk

## Ergebnis (`result`) — 2 Sessions, **Σ ~2 Min** (3 Züge)

Interview-Technik: **George** (Markenberater). Gesprochen wird alles von George.

### `result.direction` — Welche Richtung passt zu eurer Marke?

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** settle which direction fits this brand.

**Woran man einen guten Wert erkennt:**

- One of the offered directions is chosen, not a mixture.
- The reason refers to the archetype or the tone words, not to a colour preference.
- It is a direction for the brand, not for one page.
- They could explain the choice to somebody who was not in the room.

**Was zurückgewiesen wird:**

- A choice made on colour taste alone.
- A mixture of two directions.
- The direction that looks the most expensive.

**Gesprächsleiter:**

- Eröffnung: show the directions, name the one that follows from their archetype and tone, and say why.
- Nachfrage: which of these would still feel right on an invoice?
- Umdeutung: if the choice is about colour only, ask which one sounds like their tone words

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Die ruhige Richtung — sie passt zu „knapp" und „zugewandt"; die kontrastreiche wirkt wie ein Werbebanner.
  - en:
  > The quiet direction — it matches "brief" and "attentive"; the high-contrast one looks like an advertising banner.
- **Marken-Relaunch**
  - de:
  > Die warme Richtung, weil unsere Leute wiederkommen sollen und nicht angetrieben werden wollen.
  - en:
  > The warm direction, because our people are meant to come back, not to be pushed.

### `result.rating` — Wie hilfreich war das Ergebnis?

**Art:** Auswahl (optional) · **Umfang:** ~1 Min, 1 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture how helpful this result was — voluntary, and never pressed for.

**Woran man einen guten Wert erkennt:**

- It is their own answer, given without being pressed.
- A low rating is recorded as it stands.
- Skipping it is a valid outcome and ends the session.

**Was zurückgewiesen wird:**

- A rating recorded although they skipped the question.
- A rating nobody gave, filled in from the mood of the conversation.
- A number that is not one of the offered ones.

**Gesprächsleiter:**

- Eröffnung: ask once, plainly, accept a skip as an answer, never ask again after one, and never read the number as a confirmation of the result.

**Form des Werts:** Person: ohne Person · Zeit: Präsens · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

## Umfang insgesamt

- **Basispfad** (ohne Markenarchitektur, ohne Name): ~78 Min · 170 Züge
- **Vollpfad** (mit beiden): ~96 Min · 208 Züge

Die Zahl je Session ist eine SCHÄTZUNG der aktiven Zeit, nicht der Sitzungsdauer;
kommuniziert wird sie als Kapitel-Etappe („11 Sessions, ~14 Min"), damit sichtbar
bleibt, dass man aufhören und zurückkommen kann.
