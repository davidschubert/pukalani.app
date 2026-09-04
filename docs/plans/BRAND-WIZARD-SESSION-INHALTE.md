# Brand-Wizard — die Inhalte der 68 Sessions

**GENERIERT aus `packages/brand/shared/sessionContent.ts` — nicht von Hand editieren.**
Korrekturen gehören in die Registry, danach `pnpm --filter @pukalani/brand print:sessions`.
Ein Test hält beides zusammen: Regenerieren darf keinen Diff erzeugen.

Struktur und Begründung: [BRAND-WIZARD-SESSIONS.md](BRAND-WIZARD-SESSIONS.md) §3/§3a ·
Inhaltsgrundlage: [BRAND-WIZARD-CONTENT-SPEC.md](BRAND-WIZARD-CONTENT-SPEC.md).

Die Ziel-, Qualitäts- und Anti-Muster-Texte sind ENGLISCH: sie reisen wörtlich in den
Prompt (Content-Spec §1.2 — sie beschreiben Verhalten, nicht Text). Die Beispiele stehen
in beiden Oberflächen-Sprachen, weil die Abnahme-Seite je Kapitel sie dem Kunden zeigt.

## Kontext (`context`) — 11 Sessions

Interview-Technik: **George** (Markenberater). Gesprochen wird alles von George.

### `a.pitch` — Elevator-Pitch

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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
  > Wir bauen Einbauschränke für Altbauwohnungen mit schiefen Wänden — vor Ort eingemessen statt aus dem Katalog. Für Leute, die ihre Wohnung behalten und trotzdem Platz brauchen.
  - en:
  > We build fitted cupboards for old flats with crooked walls, measured on site instead of ordered from a catalogue. For people who want to keep the flat and still find room for their things.
- **Marken-Relaunch**
  - de:
  > Wir sind eine Physiotherapie für Menschen nach einer Knie-Operation. Wir nehmen uns 45 Minuten statt 20 und sprechen direkt mit der Klinik, die operiert hat.
  - en:
  > We are a physiotherapy practice for people recovering from knee surgery. We take 45 minutes instead of 20 and talk directly to the clinic that did the operation.

### `a.category` — Kategorie

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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
  > Imkerei mit Direktvermarktung
  - en:
  > Beekeeping with direct sales
- **Marken-Relaunch**
  - de:
  > Steuerkanzlei für Handwerksbetriebe
  - en:
  > Tax practice for skilled trades

### `a.competitors` — Wettbewerber

**Art:** Entwurf · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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
  > - Backhaus Merten — stark: sechs Filialen, alle am Bahnhof — schwach: eine Teiglinie für alles, kein Sauerteig
  - en:
  > - Merten Bakeries — strong: six shops, all next to the station — weak: one dough line for everything, no sourdough
- **Marken-Relaunch**
  - de:
  > - Velo Grün — stark: Termin am selben Tag — schwach: repariert nur Räder, die sie selbst verkauft haben
  - en:
  > - Velo Grün — strong: same-day appointments — weak: only repairs bikes they sold themselves

### `a.audienceSketch` — Zielgruppen-Skizze

**Art:** Entwurf · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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
  > Eltern beim ersten Kind, ohne Familie in der Stadt
  > 
  > ## Was sie wollen
  > Jemanden, der nachts ans Telefon geht
  > 
  > ## Was sie bremst
  > Sie wissen nicht, was die Kasse zahlt
  - en:
  > ## Who
  > First-time parents with no family in the city
  > 
  > ## What they want
  > Somebody who picks up the phone at night
  > 
  > ## What holds them back
  > They do not know what the insurance covers
- **Marken-Relaunch**
  - de:
  > ## Wer
  > Erwachsene, die mit 40 wieder anfangen zu klettern
  > 
  > ## Was sie wollen
  > Einen Abend, an dem sie nicht die Schlechtesten sind
  > 
  > ## Was sie bremst
  > Die Angst, vor Zwanzigjährigen zu scheitern
  - en:
  > ## Who
  > Adults taking up climbing again at 40
  > 
  > ## What they want
  > An evening where they are not the worst in the room
  > 
  > ## What holds them back
  > The fear of failing in front of twenty-year-olds

### `a.toneAnalysis` — Tonalität eurer bestehenden Texte

**Art:** Ableitung (optional) · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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
  > Sachlich und knapp — „Wir brennen zweimal, bei 1240 Grad." Viel Handwerk, keine Werbung. Distanziert: die Seite sagt nirgends „du" oder „ihr".
  - en:
  > Plain and short — "we fire twice, at 1240 degrees". A lot of craft, no advertising. Distant: the site never addresses anyone directly.
- **Marken-Relaunch**
  - de:
  > Feierlich bis pathetisch — „Wo Sonne und Schiefer sich begegnen." Traditionsschwer, ohne eine einzige Jahreszahl oder einen Preis.
  - en:
  > Solemn to the point of pathos — "where sun and slate meet". Heavy with tradition, without a single year or price anywhere.

### `a.origin` — Warum hast du angefangen — was war der Auslöser, welches Problem konntest du nicht ignorieren?

**Art:** Frage · **Umfang:** ~5 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Nach zwölf Jahren im Reitstall habe ich zum dritten Mal einen Sattel abgenommen, der ein Pferd wundgescheuert hat, weil er von der Stange war. Danach habe ich angefangen, selbst zu messen.
  - en:
  > After twelve years in the stable I took off the third saddle that had rubbed a horse raw because it came off the shelf. That was when I started measuring and building them myself.
- **Marken-Relaunch**
  - de:
  > Bleiben muss der Name und das gelbe Klavier auf dem Schild — daran erkennen uns die Eltern seit 1994. Weg muss das Wort „Konservatorium": es schreckt genau die Erwachsenen ab, die abends anfangen wollen.
  - en:
  > The name stays, and the yellow piano on the sign — parents have recognised us by it since 1994. What goes is the word "conservatory": it scares off exactly the adults who want to start in the evening.

### `a.customerPraise` — Was sagen deine glücklichsten Kunden über euch — in DEREN Worten?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > „Ihr habt als Einzige die Kiste mit dem Geschirr meiner Mutter nicht gestapelt — ich hatte das nur einmal gesagt."
  - en:
  > "You were the only ones who did not stack the box with my mother's china. I only mentioned it once."
- **Marken-Relaunch**
  - de:
  > „Bei euch fragt mich jemand, ob ich das schon mal genommen habe. Sonst bekomme ich nur die Schachtel über den Tresen."
  - en:
  > "Here somebody asks whether I have taken this before. Everywhere else I just get the box handed over the counter."

### `a.complaints` — Welche Beschwerden oder Kritik bekommt ihr? Ehrlich — das ist so wertvoll wie das Lob.

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** intern — reist nicht per Share-Link

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
  > „Ihr habt den Termin zweimal verschoben, und beide Male musste ich selbst nachfragen."
  - en:
  > "You moved the appointment twice, and both times I had to ask before anyone told me."
- **Marken-Relaunch**
  - de:
  > „Am Ende waren es 900 Euro mehr als im Kostenvoranschlag, und vorher hat niemand Bescheid gesagt."
  - en:
  > "The final bill was 900 euros over the estimate, and nobody warned us before the work was done."

### `a.oneThing` — Was ist das eine, von dem du dir wünschst, dass es jeder Kunde über euch wüsste?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Dass wir eine Sohle auch dann noch retten, wenn zwei andere Werkstätten schon abgelehnt haben.
  - en:
  > That we still save a sole after two other workshops have turned it down.
- **Marken-Relaunch**
  - de:
  > Dass wir Berufskleidung reparieren statt sie zu ersetzen — das steht auf keinem unserer Angebote.
  - en:
  > That we repair workwear instead of replacing it — it is on none of our quotes.

### `a.challenge` — Was ist gerade das größte Hindernis vor euch?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** intern — reist nicht per Share-Link

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
  > Wir sind vier Monate im Jahr ausgebucht und acht Monate leer — die Ausbilder kann ich aber nur ganzjährig halten.
  - en:
  > We are booked out four months a year and empty the other eight — but I can only keep instructors on a full-year contract.
- **Marken-Relaunch**
  - de:
  > Unsere Stammkunden sind mit uns alt geworden. Die Vierzigjährigen kennen uns nur vom Etikett im Getränkemarkt.
  - en:
  > Our regulars have grown old with us. People in their forties only know us from the label in the supermarket.

### `a.facts` — Ein paar schnelle Zahlen: Wie groß ist das Team, wie lange gibt es euch, welche Märkte?

**Art:** Sammlung · **Umfang:** ~2 Min, 3 Züge · **Vertraulichkeit:** intern — reist nicht per Share-Link

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Team: 3 fest, 2 auf Saison · Seit: 2021 · Märkte: Landkreis und Wochenmarkt in der Stadt
  - en:
  > Team: 3 permanent, 2 seasonal · Since: 2021 · Markets: the county and the city farmers market
- **Marken-Relaunch**
  - de:
  > Team: 11 Angestellte, davon 4 in Teilzeit · Seit: 1978 · Märkte: Deutschland und Österreich, Versand ab Werk
  - en:
  > Team: 11 employees, 4 of them part-time · Since: 1978 · Markets: Germany and Austria, shipped from the works

## Purpose, Vision & Mission (`pvm`) — 10 Sessions

Interview-Technik: **Vera** (Strategin). Gesprochen wird alles von George.

### `b.whyStarted` — Du hast mir schon erzählt, wie es angefangen hat. In einem Satz: Warum zählt das heute noch?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Weil Reparieren immer noch billiger und schöner ist als neu kaufen — nur weiß das kaum jemand.
  - en:
  > Because mending is still cheaper and better looking than buying new — and almost nobody knows it.
- **Marken-Relaunch**
  - de:
  > Weil eine Brille ein medizinisches Gerät ist, das jemand den ganzen Tag im Gesicht trägt.
  - en:
  > Because a pair of glasses is a medical device somebody wears on their face all day.

### `b.worldLoses` — Was ginge der Welt verloren, wenn ihr morgen zumacht? Wirkung, nicht Umsatz.

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Dann gäbe es im Ort keinen Platz mehr, an dem jemand einem Zwölfjährigen zeigt, wie man einen Toaster aufschraubt.
  - en:
  > There would be no place left in town where somebody shows a twelve-year-old how to open a toaster.
- **Marken-Relaunch**
  - de:
  > Zwölf Dorfkirchen hier hätten niemanden mehr, der ihre Orgeln stimmt, ohne sie vorher umzubauen.
  - en:
  > Twelve village churches would have nobody left who tunes their organs without rebuilding them first.

### `b.conviction` — Welche Überzeugung treibt euch — die, die ihr auch verteidigt, wenn sie euch etwas kostet?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Rohmilch gehört in Käse. Pasteurisieren macht ihn sicher und gleichzeitig belanglos — das hat uns schon zwei Supermärkte gekostet.
  - en:
  > Raw milk belongs in cheese. Pasteurising makes it safe and meaningless at once — that has already cost us two supermarket listings.
- **Marken-Relaunch**
  - de:
  > Wer Angst vor dem Kreisverkehr hat, braucht keine dreißig Übungsstunden, sondern einen Fahrlehrer, der nicht schreit.
  - en:
  > Somebody afraid of a roundabout does not need thirty more lessons, they need an instructor who does not shout.

### `b.tenYears` — In zehn Jahren: Was sieht in der Welt anders aus, weil es euch gab?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > In den Neubaugebieten hier stehen dann Bäume, die 2040 noch Schatten werfen — nicht die drei Sorten, die im Container am billigsten sind.
  - en:
  > By then the new housing estates here have trees that will still give shade in 2040 — not the three varieties that are cheapest in a pot.
- **Marken-Relaunch**
  - de:
  > Eine Stadtbibliothek ist dann selbstverständlich der Ort, an dem einem jemand beim Antrag hilft, nicht nur beim Buch.
  - en:
  > By then a public library is obviously the place where somebody helps you with a form, not only with a book.

### `b.legacy` — Wenn man in 20 Jahren über euch spricht — was sollen die Leute sagen?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > „Bei denen konnte man mitsingen, ohne vorher Noten lesen zu können — und es klang trotzdem gut."
  - en:
  > "You could sing with them without reading music first, and it still sounded good."
- **Marken-Relaunch**
  - de:
  > „Die haben das Geländer gemacht, das seit vierzig Jahren hält, und man sieht keine einzige Schweißnaht."
  - en:
  > "They made the railing that has held for forty years, and you cannot see a single weld."

### `b.purpose` — Purpose

**Art:** Entwurf · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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
  > Damit niemand mehr glaubt, guter Kaffee sei eine Frage der Maschine und nicht der Bohne.
  - en:
  > So that nobody keeps believing good coffee is a question of the machine rather than the bean.
- **Marken-Relaunch**
  - de:
  > Damit alt werden zu Hause nicht davon abhängt, ob die Familie in der Nähe wohnt.
  - en:
  > So that growing old at home does not depend on whether your family lives nearby.

### `b.vision` — Vision

**Art:** Entwurf · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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
  > Ein Haus aus Holz zu bauen ist hier so normal wie eines aus Stein — und niemand fragt mehr, ob das hält.
  - en:
  > Building a house out of wood is as ordinary here as building one out of stone, and nobody asks any more whether it lasts.
- **Marken-Relaunch**
  - de:
  > Ein Tier zum Arzt zu bringen ist kein Kraftakt mehr, weil die Praxis dorthin kommt, wo das Tier lebt.
  - en:
  > Taking an animal to the vet is no longer an ordeal, because the practice comes to where the animal lives.

### `b.mission` — Mission

**Art:** Entwurf · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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
  > Wir lesen, was wir verkaufen, und legen jedem Kind das Buch in die Hand, das es tatsächlich zu Ende liest.
  - en:
  > We read what we sell, and we put into every child's hands the book they will actually finish.
- **Marken-Relaunch**
  - de:
  > Wir passen Hörgeräte in der Wohnung der Kundin an, damit sie dort funktionieren, wo sie getragen werden.
  - en:
  > We fit hearing aids in the customer's own living room, so that they work where they are actually worn.

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 3 Felder in 2 Kapiteln (Markenarchitektur · Tagline & Messaging)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Naturseifen für empfindliche Haut — nicht „Kosmetik"
  - en:
  > Natural soap for sensitive skin — not "cosmetics"
- **Marken-Relaunch**
  - de:
  > Breitensport für späte Anfänger — nicht „Leistungssport"
  - en:
  > Community sport for late starters — not "competitive sport"

### `b.positioningFirstChoice` — Und in dieser Kategorie: Für wen seid ihr die ERSTE Wahl — und gegen wen?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Für Hausbesitzer mit Reetdach, die schon einmal Pfusch bezahlt haben — gegen die großen Bedachungsfirmen, die Reet nebenbei mitnehmen.
  - en:
  > For owners of a thatched roof who have already paid for a botched job — against the big roofing firms that carry thatch as a sideline.
- **Marken-Relaunch**
  - de:
  > Für Gastwirte, die ein ganzes Tier abnehmen können — gegen den Großhandel, der nur Teilstücke liefert.
  - en:
  > For restaurant owners who can take a whole animal — against the wholesalers who only deliver cuts.

## Markenarchitektur (`architecture`) — 5 Sessions

Interview-Technik: **Vera** (Strategin). Gesprochen wird alles von George.

### `b2.visibility` — Sollen eure Produktmarken sichtbar zur Hauptmarke gehören — oder eigenständig auftreten?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Sichtbar. Wer den Quittenbrand kauft, soll wissen, dass er vom selben Hof kommt wie der Most.
  - en:
  > Visible. Whoever buys the quince spirit should know it comes from the same farm as the juice.
- **Marken-Relaunch**
  - de:
  > Eigenständig. Die Reha-Marke darf nicht nach Sanitätshaus aussehen, sonst kommt kein Sportverein auf uns zu.
  - en:
  > On their own. The rehab brand must not look like a medical supplies shop, or no sports club will ever call us.

### `b2.roleOfMaster` — Soll die Hauptmarke ihnen Vertrauen leihen — oder dürfen sie Publika erreichen, die die Hauptmarke nicht erreicht?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** intern — reist nicht per Share-Link

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
  > Vertrauen leihen. Wer unseren Most kennt, probiert auch den Brand — ohne den Hofnamen stünde er im Regal wie jeder andere.
  - en:
  > Lend trust. People who know our juice will try the spirit — without the farm name it would sit on the shelf like any other.
- **Marken-Relaunch**
  - de:
  > Freilassen. Die Reha-Marke erreicht junge Sportler, die bei „Sanitätshaus Krause" gar nicht erst anrufen.
  - en:
  > Set them free. The rehab brand reaches young athletes who would never call a shop named "Krause Medical Supplies".

### `b2.namingPattern` — Wie dürfen sie HEISSEN — „Marke Produkt", oder eigene Namen?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Immer der Hofname vorn, dann die Frucht: „Lindenhof Quitte", „Lindenhof Schlehe". Keine Fantasienamen.
  - en:
  > Always the farm name first, then the fruit: "Lindenhof Quince", "Lindenhof Sloe". No invented names.
- **Marken-Relaunch**
  - de:
  > Eigene Namen sind erlaubt, aber nie mit unserem Kürzel davor — sonst hält es jeder für eine Eigenmarke.
  - en:
  > Names of their own are allowed, but never with our initials in front — otherwise everyone reads it as a store brand.

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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 1 Felder in 1 Kapiteln (Markenarchitektur)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Branded House — alles läuft unter dem Hofnamen, weil der Hof selbst das Versprechen ist.
  - en:
  > Branded house — everything runs under the farm name, because the farm itself is the promise.
- **Marken-Relaunch**
  - de:
  > Endorsed — die Reha-Marke tritt eigenständig auf und trägt klein „vom Sanitätshaus Krause".
  - en:
  > Endorsed — the rehab brand stands on its own and carries a small "from Krause Medical Supplies".

### `b2.rule` — Eure Namensregel

**Art:** Entwurf · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Jeder neue Brand heißt „Lindenhof" plus die Frucht. Keine Fantasienamen, keine Jahreszahl im Namen. Über Ausnahmen entscheidet Marie, nicht die Etikettendruckerei.
  - en:
  > Every new spirit is called "Lindenhof" plus the fruit. No invented names, no year in the name. Marie decides on exceptions, not the label printer.
- **Marken-Relaunch**
  - de:
  > Untermarken tragen einen eigenen Namen und in der Fußzeile immer „vom Sanitätshaus Krause". Nie das Kürzel im Namen selbst. Jeden neuen Namen gibt die Geschäftsführung frei.
  - en:
  > Sub-brands carry a name of their own and always the line "from Krause Medical Supplies" in the footer. Never the initials in the name itself. The managing directors sign off every new name.

## Werte (`values`) — 9 Sessions

Interview-Technik: **Milo** (Werte-Berater). Gesprochen wird alles von George.

### `c.discovery1` — Denk an einen Moment, in dem euer Geschäft am besten war. Was ist da passiert?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Ein Hund kam nach zwei abgebrochenen Kursen zu uns. In der vierten Stunde hat er zum ersten Mal von allein Blickkontakt gehalten, und die Besitzerin hat auf dem Platz geweint.
  - en:
  > A dog came to us after two abandoned courses. In the fourth session he held eye contact by himself for the first time, and his owner stood there and cried.
- **Marken-Relaunch**
  - de:
  > Nach dem Gewitter stand die halbe Schulklasse durchnässt in der Halle. Der Stallmeister hat den Unterricht abgesagt und stattdessen alle beim Trockenreiben mitmachen lassen.
  - en:
  > After the thunderstorm half a school group stood soaked in the arena. The stable master called off the lesson and had everybody help rub the horses down instead.

### `c.discovery2` — Denk an einen Moment, in dem sich etwas zutiefst falsch angefühlt hat. Was war da los?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Wir haben einen Kurs mit zwölf Hunden angenommen, weil die Gruppe voll bezahlt war. Nach der zweiten Stunde hat kein Hund mehr etwas gelernt, und ich wusste vorher, dass es zu viele sind.
  - en:
  > We took a course with twelve dogs because the group was fully paid. After the second session no dog was learning anything, and I had known beforehand that it was too many.
- **Marken-Relaunch**
  - de:
  > Wir haben ein lahmes Pferd noch eine Woche im Unterricht gelassen, weil der Ersatz gefehlt hat. Gesagt hat das niemand — bemerkt haben es alle.
  - en:
  > We kept a lame horse in lessons for another week because we had no replacement. Nobody said it out loud, and everybody noticed.

### `c.discovery3` — Welches Verhalten würdest du nie dulden — auch nicht vom bestzahlenden Kunden?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** capture the behaviour this brand would never tolerate, not even from its best-paying client.

**Woran man einen guten Wert erkennt:**

- It names a behaviour, not a type of person.
- It has been refused at least once, and they can say when.
- It would still be refused from the best-paying client.
- It is specific enough to recognise while it is happening.

**Was zurückgewiesen wird:**

- A no-go so extreme that nobody would ever ask for it.
- A preference dressed up as a principle: "we do not like rush jobs".
- A behaviour they have in fact tolerated.

**Gesprächsleiter:**

- Eröffnung: the behaviour they would refuse even from their best-paying client.
- Nachfrage: when did you last say no to it, and what did it cost?
- Nachfrage: has anybody ever asked you for exactly that?
- Umdeutung: if the no-go is illegal anyway, ask for the one that is legal and still unacceptable
- Umdeutung: if it has never been tested, ask what they came closest to tolerating

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: mittel · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 19 Felder in 6 Kapiteln (Werte · Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Wer seinen Hund vor uns am Halsband hochreißt, kommt nicht in den Kurs zurück — auch wenn er den ganzen Block bezahlt hat.
  - en:
  > Anybody who yanks their dog up by the collar in front of us does not come back to the course, even if they paid for the whole block.
- **Marken-Relaunch**
  - de:
  > Wir schreiben kein Pferd gesund, damit es verkauft werden kann. Das hat uns zwei Einstaller gekostet.
  - en:
  > We will not sign a horse off as sound so that it can be sold. That has cost us two boarders.

### `c.candidates` — Wertekandidaten

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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
  > - Geduld — der Kurs wurde wiederholt, statt den Hund weiterzuschieben
  > - Unbestechlichkeit — Kursplatz gekündigt, obwohl der ganze Block bezahlt war
  - en:
  > - Patience — the course was repeated instead of pushing the dog along
  > - Incorruptibility — a place was cancelled although the whole block had been paid
- **Marken-Relaunch**
  - de:
  > - Ehrlichkeit — kein Pferd wird für den Verkauf gesundgeschrieben
  > - Verlässlichkeit — bei Sturm wird abgesagt, nicht geritten
  - en:
  > - Honesty — no horse is signed off as sound to make a sale
  > - Reliability — in a storm the lesson is cancelled, not ridden

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

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

**Art:** Entwurf · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 6 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Geduld — wir wiederholen eine Übung so lange, wie der Hund braucht, und rechnen die Stunde nicht doppelt ab.
  - en:
  > - Patience — we repeat an exercise for as long as the dog needs, and we do not charge the hour twice.
- **Marken-Relaunch**
  - de:
  > - Verlässlichkeit — bei Sturm sagen wir ab und geben den Termin kostenfrei zurück, auch wenn die Halle frei wäre.
  - en:
  > - Reliability — in a storm we cancel and refund the slot, even when the indoor arena would be free.

### `c.livedExamples` — Zu jedem Wert: EIN echtes Beispiel, wo ihr ihn schon gelebt habt.

**Art:** Frage · **Umfang:** ~5 Min, 5 Züge · **Vertraulichkeit:** öffentlich

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

**Antwort-Regeln:** Mindest-Substanz: ausführlich · Nachfragen: höchstens 2 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Unbestechlichkeit — im März haben wir Familie K. den Kursplatz gekündigt und 240 Euro zurückgezahlt.
  - en:
  > - Incorruptibility — in March we cancelled the K. family's place and refunded 240 euros.
- **Marken-Relaunch**
  - de:
  > - Ruhe — im Juli haben wir das Turnier abgesagt, weil zwei Pferde husteten; das Nenngeld ging zurück.
  - en:
  > - Calm — in July we called off the show because two horses had a cough, and the entry fees went back.

### `c.conflictRule` — Wo geraten zwei eurer Werte in Konflikt — und welcher gewinnt?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Geduld gegen Klarheit: Wenn ein Hund den Kurs nicht schafft, gewinnt Klarheit — wir sagen es nach der dritten Stunde, statt weiter Geduld zu verkaufen.
  - en:
  > Patience against clarity: when a dog is not going to manage the course, clarity wins — we say so after the third session instead of selling more patience.
- **Marken-Relaunch**
  - de:
  > Verlässlichkeit gegen Ehrlichkeit: Ist ein Pferd nicht fit, gewinnt Ehrlichkeit — wir sagen den zugesagten Termin ab.
  - en:
  > Reliability against honesty: if a horse is not fit, honesty wins — we cancel the lesson we promised.

### `c.teamFilter` — Wenn ihr morgen jemanden einstellt: Welcher Wert ist der unverhandelbare Filter?

**Art:** Frage (optional) · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Geduld. Wer am Probetag die Leine strafft, sobald es hektisch wird, passt nicht zu uns — Fachwissen bringen wir bei.
  - en:
  > Patience. Anybody who tightens the lead on their trial day as soon as things get hectic does not fit here — knowledge we can teach.
- **Marken-Relaunch**
  - de:
  > Ehrlichkeit. Wer einen Fehler im Stall nicht meldet, weil er klein aussieht, ist raus.
  - en:
  > Honesty. Anybody who hides a small mistake in the stable because it looks harmless is out.

## Archetyp und Stimme (`archetype`) — 12 Sessions

Interview-Technik: **Milo** (Werte-Berater). Gesprochen wird alles von George.

### `d.hypothesis` — Archetyp-Hypothese aus eurem heutigen Auftritt

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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
  > Aus euren Texten spricht vor allem der Schöpfer: „Wir schmieden jedes Stück einzeln, auch wenn es zehnmal dasselbe ist." Daneben klingt der Weise durch, wo ihr das Material erklärt.
  - en:
  > What speaks out of your texts is mostly the Creator: "we forge each piece on its own, even when it is the same one ten times". The Sage shows through where you explain the material.
- **Marken-Relaunch**
  - de:
  > Euer Auftritt zieht in zwei Richtungen: „Weltweit zu Hause" klingt nach dem Entdecker, die Seite mit den Stornobedingungen nach dem Herrscher.
  - en:
  > Your appearance pulls two ways: "at home anywhere in the world" sounds like the Explorer, while the cancellation page sounds like the Ruler.

### `d.pairs` — Welche der beiden fühlt sich mehr nach euch an?

**Art:** Instrument · **Umfang:** ~5 Min, 1 Züge · **Vertraulichkeit:** öffentlich

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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 20 Felder in 5 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

### `d.primary` — Primärer Archetyp

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 18 Felder in 5 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Name · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Der Schöpfer — „auch wenn es zehnmal dasselbe ist" ist euer Satz, nicht der eines Zulieferers.
  - en:
  > The Creator — "even when it is the same one ten times" is your sentence, not a supplier's.
- **Marken-Relaunch**
  - de:
  > Der Fürsorgliche — ihr habt dreimal gesagt, dass ihr sonntags ans Telefon geht, wenn jemand am Flughafen strandet.
  - en:
  > The Caregiver — you said three times that you answer the phone on a Sunday when somebody is stranded at an airport.

### `d.secondary` — Sekundärer Archetyp

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 2 Felder in 1 Kapiteln (Archetyp und Stimme)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Der Weise als Zweiter — er hält den Schöpfer vom Schwärmen ab: ihr erklärt, warum Damast bricht, bevor ihr ihn verkauft.
  - en:
  > The Sage second — it keeps the Creator from mere enthusiasm: you explain why damascus breaks before you sell it.
- **Marken-Relaunch**
  - de:
  > Der Entdecker als Zweiter — er hält den Fürsorglichen davon ab, betulich zu werden.
  - en:
  > The Explorer second — it keeps the Caregiver from turning fussy.

### `d.gapReveal` — Selbstbild und Außenbild

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 1 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Ihr wollt als Schöpfer gelesen werden, eure Seite klingt aber an drei Stellen nach dem Herrscher: „Wir liefern ausschließlich an Fachbetriebe."
  - en:
  > You want to be read as the Creator, but in three places your site sounds like the Ruler: "we supply exclusively to trade customers".
- **Marken-Relaunch**
  - de:
  > Selbstbild und Außenbild treffen sich beim Fürsorglichen — nur eure Preisliste spricht wie ein Herrscher: „Umbuchungen sind ausgeschlossen."
  - en:
  > Self-image and outside image meet at the Caregiver — only your price list speaks like a Ruler: "rebooking is excluded".

### `d.party` — Wenn eure Marke ein Mensch auf einer Party wäre — wie verhält sie sich?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Steht am Rand, redet mit einem Menschen zwei Stunden über dessen Küchenmesser und geht früh.
  - en:
  > Stands at the edge, talks to one person about their kitchen knife for two hours, and leaves early.
- **Marken-Relaunch**
  - de:
  > Merkt sich, wer keinen Alkohol trinkt, und holt ungefragt Wasser — hält aber keine Rede.
  - en:
  > Notices who is not drinking and fetches water unasked — but never makes a speech.

### `d.never` — Welche Eigenschaft sollte eure Marke NIEMALS haben?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Belehrend. Wir erklären das Material, aber wir sagen niemandem, dass er das falsche Messer benutzt.
  - en:
  > Preachy. We explain the material, but we never tell anybody they are using the wrong knife.
- **Marken-Relaunch**
  - de:
  > Aufgeregt. Kein „nur noch zwei Plätze frei" — dafür rufen die Leute uns nicht an.
  - en:
  > Breathless. No "only two seats left" — that is not what people call us for.

### `d.admired` — Nenn eine Marke, deren Persönlichkeit du bewunderst — was genau ist es bei denen?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Eine kleine Outdoor-Marke aus Schweden: Sie legt seit Jahren dieselbe Reparaturanleitung bei, statt jedes Jahr eine neue Kampagne zu machen. Ihre Umweltpredigt wäre uns aber zu viel.
  - en:
  > A small outdoor brand from Sweden: they have enclosed the same repair instructions for years instead of running a new campaign each season. Their environmental preaching would be too much for us, though.
- **Marken-Relaunch**
  - de:
  > Eine Kaffeerösterei in Hamburg: Sie schreibt auf jede Tüte, was der Bauer bekommen hat. Ihr Ton wäre uns aber zu belehrend.
  - en:
  > A coffee roastery in Hamburg: they print on every bag what the farmer was paid. Their tone would be too preachy for us, though.

### `d.emotion` — Was sollen Leute FÜHLEN, wenn sie mit euch zu tun haben?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Erleichterung — in dem Moment, in dem jemand merkt, dass das Messer noch zu retten ist.
  - en:
  > Relief — at the moment somebody realises the knife can still be saved.
- **Marken-Relaunch**
  - de:
  > Ruhe. Wenn die Bestätigung kommt, soll niemand mehr das Kleingedruckte suchen.
  - en:
  > Calm. When the confirmation arrives, nobody should still be looking for the small print.

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Das Messer ist zu retten, aber der Griff muss neu.
  > - Vor Ostern schaffen wir das nicht — ehrlich gesagt frühestens im Mai.
  > - 180 Euro, weil der Stahl von Hand geschmiedet ist und nicht gefräst.
  - en:
  > - The knife can be saved, but the handle has to be new.
  > - We will not manage it before Easter — honestly, May at the earliest.
  > - 180 euros, because the steel is forged by hand and not milled.
- **Marken-Relaunch**
  - de:
  > - Ihr Flug ist verschoben, wir haben schon umgebucht.
  > - Das Hotel ist gut, aber laut — sagen wir lieber jetzt als hinterher.
  > - Der Preis steigt am Freitag, deshalb melden wir uns heute.
  - en:
  > - Your flight has moved, we have already rebooked you.
  > - The hotel is good but noisy — better said now than afterwards.
  > - The price goes up on Friday, which is why we are calling today.

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 10 Felder in 4 Kapiteln (Archetyp und Stimme · Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - karg
  > - geduldig
  > - werkstattnah
  > - unbeeindruckt
  - en:
  > - spare
  > - patient
  > - workshop-plain
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

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > - use: geschmiedet
  > - use: Werkstatt
  > - avoid: Premium
  > - avoid: Manufaktur — steht inzwischen auf jeder Tiefkühlpizza
  - en:
  > - use: forged
  > - use: workshop
  > - avoid: premium
  > - avoid: artisanal — it is on frozen pizza now
- **Marken-Relaunch**
  - de:
  > - use: umgebucht
  > - use: Rückflug
  > - avoid: Traumreise
  > - avoid: unschlagbar
  - en:
  > - use: rebooked
  > - use: return flight
  > - avoid: dream holiday
  > - avoid: unbeatable

## Manifest (`manifesto`) — 6 Sessions

Interview-Technik: **Nika** (Sprach-Beraterin). Gesprochen wird alles von George.

### `e.warmup1` — Was regt dich an deiner Branche auf?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Dass Angebote absichtlich unvergleichbar gemacht werden — drei Seiten Positionen, damit niemand den Preis pro Fenster ausrechnen kann.
  - en:
  > That quotes are made deliberately incomparable — three pages of line items so nobody can work out the price per window.
- **Marken-Relaunch**
  - de:
  > Jahresverträge, die sich verlängern, wenn man die Kündigung um zwei Tage verpasst. Das ist kein Geschäftsmodell, das ist eine Falle.
  - en:
  > Annual contracts that renew if you miss the notice period by two days. That is not a business model, it is a trap.

### `e.warmup2` — Was sollten mehr Leute über eure Arbeit verstehen?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Dass die Dämmung nicht das Erste ist. Bei den meisten Häusern bringt die eingestellte Heizung im ersten Winter mehr als eine Fassade für 20.000 Euro.
  - en:
  > That insulation is not the first step. In most houses, setting the heating properly does more in the first winter than a façade costing 20,000 euros.
- **Marken-Relaunch**
  - de:
  > Dass die ersten sechs Wochen nichts mit Muskeln zu tun haben, sondern damit, ob jemand überhaupt wiederkommt.
  - en:
  > That the first six weeks have nothing to do with muscle and everything to do with whether somebody comes back at all.

### `e.statements` — Die Satzanfänge

**Art:** Entwurf · **Umfang:** ~10 Min, 4 Züge · **Vertraulichkeit:** öffentlich

**Ziel:** draft the statement openers the manifesto will be built from — one line per opener, filled from what they have already said.

**Woran man einen guten Wert erkennt:**

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
  > - Wir glauben, dass die billigste Kilowattstunde die ist, die niemand braucht.
  > - Wir weigern uns, eine Fassade zu empfehlen, bevor die Heizung eingestellt ist.
  - en:
  > - We believe the cheapest kilowatt hour is the one nobody needs.
  > - We refuse to recommend a façade before the heating has been set up properly.
- **Marken-Relaunch**
  - de:
  > - Wir glauben, dass Wiederkommen wichtiger ist als Fortschritt.
  > - Wir weigern uns, Verträge zu verlängern, die niemand nutzt.
  - en:
  > - We believe coming back matters more than progress.
  > - We refuse to renew a contract nobody is using.

### `e.composition` — Ton, Länge und Verwendung des Manifests

**Art:** Auswahl · **Umfang:** ~1 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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

- Eröffnung: settle tone, length and use — say which one you would take and why.
- Nachfrage: where exactly will this be read first?
- Umdeutung: if every use is ticked, ask which one it has to work for on day one

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 5 Felder in 3 Kapiteln (Manifest · Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Ton: nüchtern · Länge: kurz, unter 120 Wörtern · Verwendung: die erste Seite des Beratungsberichts
  - en:
  > Tone: sober · Length: short, under 120 words · Use: the first page of the advisory report
- **Marken-Relaunch**
  - de:
  > Ton: direkt · Länge: mittel · Verwendung: das Plakat im Eingang und die Seite „Über uns"
  - en:
  > Tone: direct · Length: medium · Use: the poster in the entrance and the About page

### `e.manifesto` — Manifest

**Art:** Entwurf · **Umfang:** ~5 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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
  > Die billigste Kilowattstunde ist die, die niemand braucht.
  > Deshalb rechnen wir, bevor wir bauen.
  > Und sagen ab, wenn sich das Gerüst nicht lohnt.
  - en:
  > The cheapest kilowatt hour is the one nobody needs.
  > So we do the arithmetic before we build.
  > And we say no when the scaffolding is not worth it.
- **Marken-Relaunch**
  - de:
  > Der beste Trainingsplan ist der, den jemand im November noch macht.
  > Wir zählen keine Anmeldungen.
  > Wir zählen, wer wiederkommt.
  - en:
  > The best training plan is the one somebody still follows in November.
  > We do not count sign-ups.
  > We count who comes back.

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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** der Wert ist ein Satz aus `e.manifesto`

**Fliesst später in:** 3 Felder in 2 Kapiteln (Tagline & Messaging · Ergebnis)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Die billigste Kilowattstunde ist die, die niemand braucht.
  - en:
  > The cheapest kilowatt hour is the one nobody needs.
- **Marken-Relaunch**
  - de:
  > Wir zählen, wer wiederkommt.
  - en:
  > We count who comes back.

## Tagline & Messaging (`verbal`) — 5 Sessions

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Erst rechnen, dann bauen.
  - en:
  > Do the arithmetic before the building.
- **Marken-Relaunch**
  - de:
  > Wir zählen die Wiederkommer.
  - en:
  > We count the ones who return.

### `ep.boilerplates` — Boilerplates — Bio, Kurzabsatz, Absatz

**Art:** Entwurf · **Umfang:** ~5 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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
  > Energieberatung für Altbauten in Ostwestfalen — wir rechnen, bevor jemand baut.
  - en:
  > ## Bio
  > Energy advice for older houses in East Westphalia — we do the arithmetic before anybody builds.
- **Marken-Relaunch**
  - de:
  > ## Bio
  > Studio für Erwachsene, die spät anfangen. Wir zählen, wer wiederkommt.
  - en:
  > ## Bio
  > A gym for adults starting late. We count who comes back.

### `ep.keyMessages` — Kernbotschaften je Zielgruppe

**Art:** Entwurf · **Umfang:** ~5 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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
  > ## Hausbesitzer über 60
  > - Sie müssen nicht ausziehen, wir arbeiten in bewohnten Häusern.
  > - Wir sagen Ihnen vorher, was sich nicht lohnt.
  - en:
  > ## Homeowners over 60
  > - You do not have to move out, we work in occupied houses.
  > - We tell you in advance what is not worth doing.
- **Marken-Relaunch**
  - de:
  > ## Wiedereinsteiger ab 40
  > - In den ersten sechs Wochen zählt nur, dass ihr wiederkommt.
  > - Kein Vertrag, der sich von selbst verlängert.
  - en:
  > ## People starting again after 40
  > - For the first six weeks the only thing that counts is that you come back.
  > - No contract that renews itself.

### `ep.vocabulary` — Wörter zum Benutzen, Wörter zum Meiden

**Art:** Ableitung · **Umfang:** ~2 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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
  > - use: Heizkurve
  > - use: Bestandsaufnahme
  > - avoid: Sanierungsstau
  > - avoid: energetisch optimiert
  - en:
  > - use: heating curve
  > - use: survey
  > - avoid: renovation backlog
  > - avoid: energy-optimised
- **Marken-Relaunch**
  - de:
  > - use: wiederkommen
  > - use: Probemonat
  > - avoid: Bikinifigur
  > - avoid: Transformation
  - en:
  > - use: come back
  > - use: trial month
  > - avoid: beach body
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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Die billigste Kilowattstunde ist die, die niemand braucht.
  - en:
  > The cheapest kilowatt hour is the one nobody needs.
- **Marken-Relaunch**
  - de:
  > Wir zählen, wer wiederkommt.
  - en:
  > We count who comes back.

## Name (`naming`) — 8 Sessions

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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 5 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Erfundener Name — kurz, schützbar, sagt nichts über Fahrräder und passt auch noch, wenn ihr später Lastenräder vermietet.
  - en:
  > An invented name — short, protectable, says nothing about bicycles, and still fits if you rent out cargo bikes later.
- **Marken-Relaunch**
  - de:
  > Gründername bleibt, aber ohne Titel: „Praxis Ehlerding" statt „Zahnarztpraxis Dr. med. dent. Ehlerding".
  - en:
  > The founder name stays, but without the titles: "Ehlerding Practice" instead of "Dental Surgery Dr Ehlerding".

### `f.taste` — Nenn drei bis fünf Markennamen, die du liebst — egal welche Branche — und sag warum.

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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
  > Mirabell — weich, zwei Silben, erklärt nichts. Kolibri — man sieht sofort ein Bild. Anker — kurz und am Telefon sofort verstanden.
  - en:
  > Mirabelle — soft, two syllables, explains nothing. Colibri — you see a picture at once. Anchor — short and understood on the phone straight away.
- **Marken-Relaunch**
  - de:
  > Klar, weil es ein einziges Wort ist. Nordlicht, weil es die Gegend mitnimmt, ohne sie zu buchstabieren. Hain, weil man es nach einmal Hören schreiben kann.
  - en:
  > Clear, because it is a single word. Northlight, because it carries the region without spelling it out. Grove, because you can spell it after hearing it once.

### `f.noGos` — Gibt es Wörter, Stile oder Längen, die tabu sind?

**Art:** Frage · **Umfang:** ~3 Min, 4 Züge · **Vertraulichkeit:** öffentlich

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 2 · „weiss nicht" gilt · vertagen möglich

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 5 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Kein „bike", kein „e-", nichts mit Bindestrich. Höchstens drei Silben — der Name muss auf den Anhänger passen.
  - en:
  > No "bike", no "e-", nothing with a hyphen. Three syllables at most — it has to fit on the trailer.
- **Marken-Relaunch**
  - de:
  > Nichts mit „dental" oder „smile". Kein Wort, das man buchstabieren muss, wenn ältere Patienten anrufen.
  - en:
  > Nothing with "dental" or "smile". No word that has to be spelled out when an older patient calls.

### `f.candidates` — Namens-Kandidaten

**Art:** Ableitung · **Umfang:** ~3 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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
  > - Kolben — erfunden
  > - Nabe — beschreibend, aus dem Handwerk
  > - Sattelfest — zusammengesetzt
  - en:
  > - Piston — invented
  > - Hub — descriptive, from the trade
  > - Saddlefast — compound
- **Marken-Relaunch**
  - de:
  > - Ehlerding — Gründername
  > - Hain — abstrakt
  > - Nordlicht — bildhaft
  - en:
  > - Ehlerding — founder name
  > - Grove — abstract
  > - Northlight — evocative

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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 3 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Kolben
  > - Nabe
  > - Sattelfest
  - en:
  > - Piston
  > - Hub
  > - Saddlefast
- **Marken-Relaunch**
  - de:
  > - Ehlerding
  > - Hain
  > - Nordlicht
  - en:
  > - Ehlerding
  > - Grove
  > - Northlight

### `f.checks` — Vorprüfung der Verfügbarkeit

**Art:** Ableitung · **Umfang:** ~5 Min, 2 Züge · **Vertraulichkeit:** öffentlich

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
  > ## Kolben
  > Domain: kolben.de vergeben, kolben-rad.de frei · Handles: ungeprüft, Suchlink unten · Marke: DPMA-Suche noch offen · Fremdsprache: keine Auffälligkeit
  - en:
  > ## Piston
  > Domain: piston.de taken, piston-bikes.de free · Handles: unverified, search link below · Trademark: DPMA search still open · Other languages: nothing conspicuous
- **Marken-Relaunch**
  - de:
  > ## Hain
  > Domain: hain.de vergeben, praxis-hain.de frei · Handles: ungeprüft · Marke: geführte Suche noch offen · Fremdsprache: keine Auffälligkeit
  - en:
  > ## Grove
  > Domain: grove.de taken, praxis-grove.de free · Handles: unverified · Trademark: guided search still open · Other languages: nothing conspicuous

### `f.criteria` — Bewertet die Finalisten an den acht Kriterien.

**Art:** Auswahl · **Umfang:** ~3 Min, 3 Züge · **Vertraulichkeit:** öffentlich

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

- Eröffnung: rate two or three finalists against the eight criteria, one criterion at a time.
- Nachfrage: which criterion did you rate highest — would a stranger agree?
- Umdeutung: if every criterion is high, ask where the name is weakest; every name is weak somewhere

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** 1 Felder in 1 Kapiteln (Name)

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > ## Kolben
  > Sprechbar: gut · Schreibbar: gut · Merkbar: mittel · Schützbar: gut · Passend: mittel · Erweiterbar: gut · Frei: offen · Zeitlos: gut
  - en:
  > ## Piston
  > Sayable: good · Spellable: good · Memorable: medium · Protectable: good · Fitting: medium · Extendable: good · Available: open · Timeless: good
- **Marken-Relaunch**
  - de:
  > ## Hain
  > Sprechbar: gut · Schreibbar: gut · Merkbar: mittel · Schützbar: mittel · Passend: gut · Erweiterbar: gut · Frei: offen · Zeitlos: gut
  - en:
  > ## Grove
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

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** jede Zeile stammt aus `f.shortlist`

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > - Kolben
  > - Sattelfest
  > - Nabe
  - en:
  > - Piston
  > - Saddlefast
  > - Hub
- **Marken-Relaunch**
  - de:
  > - Hain
  > - Ehlerding
  > - Nordlicht
  - en:
  > - Grove
  > - Ehlerding
  > - Northlight

## Ergebnis (`result`) — 2 Sessions

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

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt hier nicht · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus

**Beispiele** (erfunden, fremde Branche — für die Form, nie für den Inhalt):

- **Neue Marke**
  - de:
  > Die ruhige Richtung — sie passt zu „karg" und „geduldig"; die kontrastreiche wirkt wie ein Angebot im Schaufenster.
  - en:
  > The quiet direction — it matches "spare" and "patient"; the high-contrast one looks like an offer in a shop window.
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

- Asking again after a skip.
- Reading the rating as a confirmation of the result.
- Framing the question so that a low answer feels rude.

**Gesprächsleiter:**

- Eröffnung: ask once, plainly, and accept a skip as an answer.

**Form des Werts:** Person: folgt der Weiche Solo/Team · Zeit: frei · kein Wortdeckel

**Antwort-Regeln:** Mindest-Substanz: kurz · Nachfragen: höchstens 0 · „weiss nicht" gilt · nicht vertagbar

**Invarianten (im Code geprüft):** —

**Fliesst später in:** nichts — eine Korrektur hier löst keine Warteschlange aus
