<script setup lang="ts">
import type { BrandWaitlistResponse } from '../../shared/types/brand'

/**
 * DIE WARTELISTE — die eine Lead-Erfassung der geschlossenen Beta (Davids
 * Auftrag 2026-09-04: About/Team auf Lead-Generierung optimieren).
 *
 * Bis dahin konnte, wer keinen Einladungscode hatte, NICHTS hinterlassen —
 * die Seite sagte „wir melden uns", ohne einen Weg dafür zu haben. Dieses
 * Formular ist der Weg: E-Mail (Pflicht) und Website (optional) an
 * `POST /api/brand/waitlist`; der Server prüft, dedupliziert und
 * benachrichtigt den Betreiber fail-soft.
 *
 * ── SO WENIG FELDER WIE MÖGLICH ───────────────────────────────────────────
 * Jedes Pflichtfeld kostet Eintragungen. Pflicht ist nur die Adresse; die
 * Website ist der eine optionale Kontext, der dem Betreiber beim Freischalten
 * wirklich hilft (Relaunch oder Neugründung? Welche Branche?).
 *
 * ── HONEYPOT STATT CAPTCHA ────────────────────────────────────────────────
 * `hp` ist ein für Menschen unsichtbares Feld; füllt ein Skript es, antwortet
 * der Server freundlich 200 und speichert nichts. Ein Captcha kostete jeden
 * ehrlichen Eintrag einen Klick — der Preis stünde in keinem Verhältnis.
 *
 * ── DOUBLE-OPT-IN: DIE MAIL ENTSCHEIDET, NICHT DER KLICK ──────────────────
 * Der Server legt die Adresse als `pending` an und schickt einen Link (24 h).
 * Erst der Klick macht daraus einen Eintrag — David: „sonst spammen die mir
 * das Fach voll". Wer sich ein zweites Mal einträgt, bekommt einen frischen
 * Link; wer schon bestätigt ist, die freundliche Auskunft statt einer roten
 * Meldung. Kann die Mail nicht raus, antwortet der Server 503 — dann steht
 * hier ehrlich „nicht geklappt", denn ohne Link gibt es keinen Eintrag.
 *
 * `source` sagt dem Betreiber, WELCHE Seite den Eintrag gebracht hat — die
 * eine Kennzahl, an der man sieht, ob eine Seite verkauft.
 */
const props = defineProps<{ source: string }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const email = ref('')
const website = ref('')
const hp = ref('')
const status = ref<'idle' | 'sending' | 'done' | 'error'>('idle')
/**
 * DOUBLE-OPT-IN (2026-09-04, Davids Auftrag): `mail_sent` heisst, der
 * Bestätigungs-Link ist raus und die Adresse steht als `pending` in der
 * Tabelle — auf die Liste kommt sie erst mit dem Klick in der Mail.
 * `already_confirmed` ist die freundliche Auskunft für die eigene Adresse.
 */
const alreadyConfirmed = ref(false)

const canSend = computed(() => status.value !== 'sending' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

async function submit(): Promise<void> {
  if (!canSend.value) return
  status.value = 'sending'
  try {
    const result = await $fetch<BrandWaitlistResponse>('/api/brand/waitlist', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        website: website.value.trim(),
        locale: locale.value === 'de' ? 'de' : 'en',
        source: props.source,
        hp: hp.value,
      },
    })
    alreadyConfirmed.value = result.state === 'already_confirmed'
    status.value = 'done'
  }
  catch {
    status.value = 'error'
  }
}
</script>

<template>
  <div>
    <div v-if="status === 'done'" class="bw-frame p-6" style="background: var(--bw-accent-soft)">
      <p class="font-medium tracking-tight" style="color: var(--bw-ink)">{{ t('brand.waitlist.doneTitle') }}</p>
      <p class="mt-1.5 text-sm leading-relaxed" style="color: var(--bw-ink-soft)">
        {{ alreadyConfirmed ? t('brand.waitlist.duplicateText') : t('brand.waitlist.doneText') }}
      </p>
    </div>

    <form v-else class="space-y-3" @submit.prevent="submit">
      <UInput
        v-model="email" type="email" name="email" autocomplete="email" required size="lg"
        :placeholder="t('brand.waitlist.emailPlaceholder')" :aria-label="t('brand.waitlist.email')"
        class="w-full"
      />
      <UInput
        v-model="website" type="text" name="website" autocomplete="url" inputmode="url" size="lg"
        :placeholder="t('brand.waitlist.websitePlaceholder')" :aria-label="t('brand.waitlist.website')"
        class="w-full"
      />
      <!-- Honeypot: für Menschen unsichtbar und unerreichbar (s. Kopf). -->
      <div class="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <input v-model="hp" type="text" name="hp" tabindex="-1" autocomplete="off">
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          type="submit" size="lg" class="rounded-full" :disabled="!canSend" :loading="status === 'sending'"
          :label="status === 'sending' ? t('brand.waitlist.sending') : t('brand.waitlist.submit')"
        />
        <UButton
          :to="localePath('/invite')" size="lg" color="neutral" variant="ghost" class="rounded-full"
          :label="t('brand.waitlist.haveCode')"
        />
      </div>
      <p v-if="status === 'error'" class="text-sm" style="color: var(--bw-stale)">{{ t('brand.waitlist.error') }}</p>
      <p class="bw-label leading-relaxed" style="color: var(--bw-muted)">{{ t('brand.waitlist.consent') }}</p>
    </form>
  </div>
</template>
