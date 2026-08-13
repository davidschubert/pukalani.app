/**
 * onboarding meldet die COMMUNITY-Verwaltung an — seit F51 (2026-08-07,
 * Davids Community-Settings-Hub) vollständig als REITER in
 * `pukalani.admin.communityTabs`, nicht mehr als Sidebar-Module.
 *
 * WAS SICH GEÄNDERT HAT: die drei Sidebar-Einträge `members`,
 * `community-branding` und `site-subscription` sind ERSATZLOS gestrichen —
 * ersatzlos in der Seitenleiste, versteht sich; ihre Flächen leben als Reiter
 * unter `/dashboard/community/*` weiter. Grund ist Davids Entscheidung, dass
 * es EINEN Einstieg „Community-Einstellungen" gibt statt fünf verstreuter
 * Menüpunkte in drei Nav-Gruppen. Wer hier einen Punkt ZURÜCK in `modules`
 * legt, hat ihn danach doppelt.
 *
 * WARUM DIESER LAYER: die Seiten können nur so weit reichen wie ihre Routen,
 * und die liegen hier (`/api/community/*`) — dieser Layer besitzt die
 * Service-Naht zum Control Plane, dem `communities`, `community_members` und
 * `community_invites` gehören. Läge ein Eintrag im admin-Layer, hätte die
 * Silo-App (apps/comments, ohne onboarding) einen Einstieg, dessen Seite ins
 * Leere greift. Eine Silo-Instanz hat auch keine Community-Grenze: dort
 * verwaltet der Betreiber Nutzer über /dashboard/users.
 */
export default defineAppConfig({
  pukalani: {
    auth: {
      /**
       * DER EHRLICHE SATZ ÜBER DEM REGISTER-FORMULAR (U2, Audit-Befund K1).
       *
       * Er steht in DIESEM Layer und nicht im Core, weil nur hier bekannt ist,
       * dass es überhaupt ein Early-Access-Tor gibt, wie sein Zustand zu
       * erfragen ist (`/api/onboarding/gate`) und wohin die Anfrage-Seite
       * zeigt. Eine Silo-App ohne onboarding (apps/comments) trägt den Eintrag
       * nicht und sieht deshalb auch nichts.
       *
       * Die Komponente entscheidet selbst, ob sie etwas rendert: auf einem
       * Mandanten-Host und bei offenem Tor bleibt sie leer.
       */
      notices: {
        founding: { component: 'OnboardingFoundingNotice', order: 10 },
      },
    },
    admin: {
      /**
       * KENNZAHLEN DER COMMUNITY (U9/K2, 2026-08-11) — die zwei Zahlen, die
       * dem Owner über seine Community etwas sagen, ohne ein Produkt zu
       * zählen: wie viele Menschen sind hier, und woran ist sie vertraglich?
       *
       * Beide gehören diesem Layer, weil hier die Service-Naht zum Control
       * Plane liegt (A14) — `community_members` und `communities.plan` leben
       * dort, der admin-Layer könnte keine der beiden beantworten.
       *
       * SIE STEHEN VORNE (`order` 30/40 vor den Produkt-Zählern ab 50), weil
       * sie über die Community selbst sprechen und nicht über einen ihrer
       * Inhalte.
       *
       * `emptyBelow: 2` bei den Mitgliedern: der Owner zählt mit, die Zahl ist
       * also nie 0 — allein ist er trotzdem, und genau dann ist „Einladen" der
       * nützliche Satz. Der Hinweis führt auf dasselbe Ziel wie die Kachel;
       * ein zweiter Knopf wäre eine Doppel-Aufforderung neben der
       * Willkommens-Checkliste (AP2).
       */
      stats: {
        members: {
          scope: 'community',
          labelKey: 'onboarding.stats.members',
          icon: 'i-ph-users-three',
          to: '/dashboard/community/members',
          requiredCapability: 'team.manage',
          emptyHintKey: 'onboarding.stats.membersEmpty',
          emptyBelow: 2,
          order: 30,
        },
        plan: {
          scope: 'community',
          labelKey: 'onboarding.stats.plan',
          icon: 'i-ph-seal-check',
          to: '/dashboard/community/plan',
          requiredCapability: 'community.billing',
          order: 40,
        },
      },
      /**
       * REITER DES COMMUNITY-HUBS (F51). Reihenfolge = `order`, gerendert von
       * packages/admin/app/pages/dashboard/community.vue, gefiltert mit
       * `resolveSettingsTabs` (Ort × Capability × Produkt-Gates).
       *
       * Alle sind `scope: 'community'`: auf einem Kontroll-Host verschwinden
       * sie, und mit ihnen der Menüpunkt — dort gibt es keine Community, deren
       * Einstellungen das wären.
       */
      communityTabs: [
        {
          /**
           * ALLGEMEIN — die Zugangsregeln (offene Registrierung, Sichtbarkeit)
           * und die Gefahrenzone. Der INDEX der Hülle: `/dashboard/community`
           * ohne Unterpfad.
           *
           * `team.manage` wie bei den Mitgliedern: wer das Team verwaltet, setzt
           * auch die Zugangsregeln. Die Gefahrenzone INNERHALB der Seite
           * verlangt zusätzlich `community.delete` (Owner) — ein Admin sieht den
           * Reiter, aber nicht die Löschen-Karte.
           */
          id: 'community',
          scope: 'community',
          labelKey: 'onboarding.communityTabs.general',
          icon: 'i-ph-sliders-horizontal',
          to: '/dashboard/community',
          requiredCapability: 'team.manage',
          order: 10,
        },
        {
          /**
           * BRANDING DER COMMUNITY (F5, 2026-07-31). `branding.manage` war bis
           * dahin eine tote Capability: in der Matrix (owner + admin), im Menü
           * ohne Einstieg, weil dort nur das Theme-Studio stand und das
           * `system.manage` verlangt.
           *
           * Der SCHNITT: Wahl ≠ Katalog. Hier wählt eine Community aus dem
           * Built-in-Katalog (`communities.theme/variant/neutral`); der Katalog
           * selbst (custom_themes/custom_fonts/themeSettings — INSTANZ-weit,
           * read(any), live an alle) bleibt Betreiber-Sache unter
           * /dashboard/themes. Begründung im Kopf der Seite.
           */
          id: 'community-branding',
          scope: 'community',
          labelKey: 'branding.navLabel',
          icon: 'i-ph-palette',
          to: '/dashboard/community/branding',
          requiredCapability: 'branding.manage',
          order: 20,
        },
        {
          /**
           * MITGLIEDER. `team.manage` war bis zum Audit-Befund S9 eine TOTE
           * Capability: in der Matrix vorhanden, im Dashboard ohne Einstieg.
           * Dieser Eintrag ist der Einstieg.
           */
          id: 'members',
          scope: 'community',
          labelKey: 'admin.nav.members',
          icon: 'i-ph-users-three',
          to: '/dashboard/community/members',
          requiredCapability: 'team.manage',
          order: 30,
        },
        {
          /**
           * EIGENE DOMAIN (control-035, Davids Entscheidungen vom 2026-08-07).
           *
           * `community.domain` trägt nur der OWNER — ein Admin sieht den
           * Reiter gar nicht erst. Die AUTORITÄT ist trotzdem der Server: die
           * Routen prüfen dieselbe Capability, und das Control Plane prüft sie
           * danach noch einmal selbst.
           *
           * KEIN Plan-Gate am Reiter, obwohl das Merkmal ab Pro ist (Davids
           * Entscheidung 1): ein Owner soll ERFAHREN, dass es eigene Domains
           * gibt. Die Seite selbst zeigt ihm dann, was ihm fehlt, und verlinkt
           * auf den Plan-Reiter. Ein Reiter, der bei Basic verschwindet,
           * verkauft nichts und erklärt nichts.
           */
          id: 'community-domain',
          scope: 'community',
          labelKey: 'onboarding.domain.navLabel',
          icon: 'i-ph-globe-hemisphere-west',
          to: '/dashboard/community/domain',
          requiredCapability: 'community.domain',
          order: 40,
        },
        {
          /**
           * PLAN — Abo, Kauf und Stripe-Portal (A6 Schritt 3).
           * `community.billing` trägt nur der Owner; ein Admin sieht den Reiter
           * gar nicht erst.
           *
           * Der PFAD ist fest verdrahtet und nicht frei wählbar: die
           * Erfolgs-/Abbruch-URLs des Checkouts baut der Server aus
           * `tenants.host` (apps/control/server/utils/communityCheckout.ts).
           * Wer ihn hier ändert, ändert ihn dort mit.
           */
          id: 'site-subscription',
          scope: 'community',
          labelKey: 'onboarding.communityTabs.plan',
          icon: 'i-ph-credit-card',
          to: '/dashboard/community/plan',
          requiredCapability: 'community.billing',
          order: 50,
        },
        {
          /**
           * PRODUKTE — was der TARIF dieser Community freischaltet (F51
           * Paket 2, 2026-08-07, Davids Ebenen-Entscheidung).
           *
           * `team.manage` und nicht `community.billing`: die Seite ZEIGT nur,
           * sie kauft nichts. Wer das Team verwaltet, soll wissen, was seiner
           * Community zur Verfügung steht — der Weg zum Tarif führt von dort
           * auf den Plan-Reiter, und der hängt weiterhin am Owner.
           *
           * BEWUSST OHNE `planProduct` und ohne `productKey`: dieser Reiter
           * IST die Auskunft über Tarif und Produkte. Ihn selbst zu gaten wäre
           * der Zirkelschluss, bei dem ausgerechnet die Erklärung verschwindet,
           * sobald etwas fehlt.
           *
           * `order: 90` — hinter Analytics (80), vor Speicher (100). Die vier
           * ZUSTÄNDIGKEITEN (Allgemein, Branding, Mitglieder, Domain, Plan)
           * stehen vorn; was man nachschlägt statt einzustellen, kommt hinten.
           */
          id: 'community-products',
          scope: 'community',
          labelKey: 'onboarding.communityTabs.products',
          icon: 'i-ph-puzzle-piece',
          to: '/dashboard/community/products',
          requiredCapability: 'team.manage',
          order: 90,
        },
        {
          /**
           * SPEICHER — eigener Verbrauch gegen das Kontingent des Tarifs
           * (F51 Paket 2).
           *
           * NICHT ZU VERWECHSELN mit `/dashboard/storage`: das ist die
           * BETREIBER-Seite (Appwrite-Buckets der ganzen Instanz,
           * `storage.manage`) und bleibt, wo sie ist. Diese hier zählt die
           * Zeilen EINER Community gegen ihren Tarif. Zwei Ebenen, zwei
           * Seiten, zwei Capabilities — im Pool sieht ein Owner nur diese.
           */
          id: 'community-storage',
          scope: 'community',
          labelKey: 'onboarding.communityTabs.storage',
          icon: 'i-ph-gauge',
          to: '/dashboard/community/storage',
          requiredCapability: 'team.manage',
          order: 100,
        },
        {
          /**
           * EXPORT — das Community-Bündel als eine JSON-Datei (U20,
           * 2026-08-12).
           *
           * `community.export` trägt NUR der Owner; ein Admin sieht den Reiter
           * gar nicht erst. Aus demselben Grund wie bei Übergabe und Löschung:
           * hier verlässt das gesamte Archiv das Haus. Die Autorität bleibt
           * der Server — `/api/community/export` prüft dieselbe Capability.
           *
           * `order: 110` ganz hinten, hinter Speicher: eine einmalige
           * Handlung, keine Einstellung, die man pflegt.
           */
          id: 'community-export',
          scope: 'community',
          labelKey: 'onboarding.communityTabs.export',
          icon: 'i-ph-download-simple',
          to: '/dashboard/community/export',
          requiredCapability: 'community.export',
          order: 110,
        },
      ],
      /**
       * Der Hinweis auf die ablaufende Testphase (M13). Aus DEMSELBEN Grund in
       * diesem Layer wie der Plan-Reiter: er lebt von `/api/community/billing/trial`,
       * und die braucht den Mandanten-Kontext, den nur eine Pool-App hat. Eine
       * Silo-App ohne onboarding trägt den Eintrag nicht — dort gibt es keine
       * Testphase, also erscheint auch nichts.
       *
       * Dieselbe Capability wie der Plan-Reiter, auf den er zeigt: `community.billing`
       * trägt nur der Owner. Ein Moderator bekäme sonst einen Hinweis mit einem
       * Knopf in ein 403 — und eine Auskunft über den Vertrag seiner Community,
       * die ihn nichts angeht.
       */
      notices: {
        /**
         * Die Sperre steht VOR der Testphase (M13): eine nur-lesende Community
         * ist die dringlichere Nachricht, und beides gleichzeitig gibt es
         * praktisch nicht — eine Testphase kann nichts schulden. Dieselbe
         * Capability wie der Plan-Reiter, auf den der Knopf zeigt.
         */
        communitySuspension: {
          component: 'CommunitySuspensionNotice',
          requiredCapability: 'community.billing',
          order: 5,
        },
        communityTrial: {
          component: 'CommunityTrialNotice',
          requiredCapability: 'community.billing',
          order: 10,
        },
        /**
         * Die Willkommens-Checkliste (U4) steht NACH den beiden Geld-Hinweisen:
         * eine nur-lesende Community oder eine ablaufende Testphase sind
         * dringlicher als der Aufbau. Sie verschwindet von selbst, sobald alle
         * fünf Schritte erledigt sind.
         *
         * `team.manage` statt `community.billing`, anders als die zwei
         * darüber: die Liste ist eine AUFBAU-Liste, und die bauen Owner UND
         * Admin. Ein Moderator, der zu einer fremden Community dazugestoßen
         * ist, braucht keine Startliste — seine Route weist ihn ohnehin ab.
         */
        communityGettingStarted: {
          component: 'CommunityGettingStartedNotice',
          requiredCapability: 'team.manage',
          order: 20,
        },
      },
    },
  },
})
