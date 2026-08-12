import { communityHasAuthoredPost, seedWelcomePost } from '../utils/seedWelcomePost'

/**
 * Der Feed dieses Layers ist der ERSTE INHALT einer neuen Community (U4 Teil 5,
 * core-Vertrag `registerCommunityFirstContentProvider`).
 *
 * Warum über eine Registry und nicht per Import: `onboarding` ist ein
 * Naht-Layer und darf `posts` nicht kennen (A14, ESLint
 * `pukalani/no-cross-layer-relative`). Es kennt deshalb weder `POSTS_TABLE`
 * noch die Id des Beispiel-Beitrags — es fragt nur „sä den ersten Inhalt" und
 * „hat hier jemand selbst geschrieben?".
 *
 * BEIDE Methoden hier, nicht nur die Saat: eine App, die säen kann, muss auch
 * sagen können, ob inzwischen jemand selbst geschrieben hat — sonst hakt die
 * Willkommens-Checkliste ihren ersten Punkt mit unserem eigenen Beispiel ab.
 */
export default defineNitroPlugin(() => {
  registerCommunityFirstContentProvider({
    async seed(event, input) {
      await seedWelcomePost(event, input)
    },
    hasAuthored: communityHasAuthoredPost,
  })
})
