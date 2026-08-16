import { communityHasAuthoredPost, seedWelcomePost } from '../utils/seedWelcomePost'
import { seedDefaultCategory } from '../utils/seedDefaultCategory'

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
      /**
       * ZWEI SAATEN, EINE REIHENFOLGE: erst die Kategorie, dann der Beitrag
       * darin. Der Vertrag heißt „sä den ersten Inhalt" — was dieser Layer
       * dafür braucht, entscheidet er selbst; `onboarding` kennt weder
       * `post_categories` noch den Grund (A14).
       *
       * DIE KATEGORIE DARF DEN BEITRAG NICHT MITREISSEN: schlägt sie fehl,
       * wird der Beitrag ohne sie geschrieben (`categoryId: ''`, wie vor
       * dieser Änderung). Der Fehler steht im Log; eine Community ohne
       * Beispiel-Beitrag wäre der teurere Ausgang, und den Leerzustand der
       * Discussions hat die Oberfläche seit demselben Tag erklärt.
       *
       * Ein `throw` von hier landet ohnehin im fail-soft der Registry
       * (`seedCommunityFirstContent`) — der `catch` steht trotzdem hier, weil
       * er etwas anderes bedeutet: nicht „egal", sondern „weiter mit dem
       * Beitrag".
       */
      const categoryId = await seedDefaultCategory(event, {
        tenantId: input.tenantId,
        locale: input.locale,
      }).catch((error) => {
        logEvent('error', 'posts.seed_category_failed', {
          tenantId: input.tenantId,
          message: error instanceof Error ? error.message : String(error),
        })
        return null
      })

      await seedWelcomePost(event, { ...input, categoryId: categoryId ?? '' })
    },
    hasAuthored: communityHasAuthoredPost,
  })
})
